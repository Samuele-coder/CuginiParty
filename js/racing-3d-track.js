import * as THREE from './vendor/three/three.module.min.js';
import { TRACKS } from './racing-3d-data.js';

export const wrap = value => ((value % 1) + 1) % 1;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// The curve is the single source for road mesh, racing line, walls and gates.
// Y is kept in every sample so later tracks can provide hills/bridges/tunnels.
export class RacingTrack {
    constructor(id = 'grand') {
        this.config = typeof id === 'object' ? id : (TRACKS.find(t => t.id === id) || TRACKS[0]);
        this.halfWidth = this.config.halfWidth;
        this.wallOffset = this.halfWidth + 5;
        this.checkpointCount = 20;
        this.sampleCount = 512;
        this.curve = new THREE.CatmullRomCurve3(this.config.points.map(p => new THREE.Vector3(...p)), true, 'centripetal');
        this.length = this.curve.getLength();
        this.points = Array.from({ length: this.sampleCount }, (_, i) => {
            const u = i / this.sampleCount;
            const p = this.curve.getPointAt(u);
            const t = this.curve.getTangentAt(u);
            const planar = Math.hypot(t.x, t.z);
            return { u, x: p.x, y: p.y, z: p.z, tx: t.x / planar, tz: t.z / planar, slope: t.y / planar, rx: -t.z / planar, rz: t.x / planar };
        });
        // Spatial index is independent of quality; all cars use identical geometry.
        this.segmentCells = new Map();
        this.points.forEach((a, i) => {
            const b = this.points[(i + 1) % this.sampleCount];
            for (let x = Math.floor(Math.min(a.x,b.x)/16); x <= Math.floor(Math.max(a.x,b.x)/16); x++)
                for (let z = Math.floor(Math.min(a.z,b.z)/16); z <= Math.floor(Math.max(a.z,b.z)/16); z++) {
                    const key = `${x},${z}`;
                    if (!this.segmentCells.has(key)) this.segmentCells.set(key, []);
                    this.segmentCells.get(key).push(i);
                }
        });
        // Relax a bounded path towards its neighbours: outside-entry, apex and
        // outside-exit emerge from the track, not a per-bot hardcoded centreline.
        this.line = this.points.map(() => 0);
        for (let pass = 0; pass < 160; pass++) {
            const next = this.line.map((lane, i) => {
                const p = this.points[i], a = this.sample((i-5)/this.sampleCount, this.line[(i-5+this.sampleCount)%this.sampleCount]);
                const b = this.sample((i+5)/this.sampleCount, this.line[(i+5)%this.sampleCount]);
                const desired = ((a.x+b.x)/2-p.x)*p.rx+((a.z+b.z)/2-p.z)*p.rz;
                return clamp(lane + (desired-lane)*.1, -this.halfWidth+3.1, this.halfWidth-3.1);
            });
            this.line = next;
        }
        this.gates = Array.from({ length: this.checkpointCount }, (_, i) => this.sample(i / this.checkpointCount));
        this.walls = [-1, 1].map(side => this.points.map(p => ({ x: p.x + p.rx * this.wallOffset * side, z: p.z + p.rz * this.wallOffset * side, y: p.y })));
        this.obstacles = [];
        // Collidable rocks/building corners are outside the asphalt and shoulders.
        for (let i=0;i<18;i++) {
            const p=this.sample((i+.3)/18, (i%2?1:-1)*(this.wallOffset-1));
            if (['canyon','city','alpine'].includes(this.config.theme)) this.obstacles.push({x:p.x,z:p.z,y:p.y,radius:.65});
        }
    }

    sample(progress, lane = 0) {
        const index = wrap(progress) * this.sampleCount;
        const a = this.points[Math.floor(index) % this.sampleCount];
        const b = this.points[(Math.floor(index) + 1) % this.sampleCount];
        const f = index - Math.floor(index);
        const lerp = key => a[key] + (b[key] - a[key]) * f;
        let tx = lerp('tx'), tz = lerp('tz');
        const norm = Math.hypot(tx, tz);
        tx /= norm; tz /= norm;
        return { u: wrap(progress), x: lerp('x') - tz * lane, y: lerp('y'), z: lerp('z') + tx * lane, tx, tz, rx: -tz, rz: tx, slope: lerp('slope'), heading: Math.atan2(tx, tz) };
    }

    racingSample(progress, offset = 0) {
        const at=wrap(progress)*this.sampleCount, i=Math.floor(at), f=at-i;
        return this.sample(progress, this.line[i]*(1-f)+this.line[(i+1)%this.sampleCount]*f+offset);
    }

    nearest(x, z) {
        let best = Infinity, bestIndex = 0, bestF = 0;
        const cx=Math.floor(x/16), cz=Math.floor(z/16), candidates=new Set();
        for (let dx=-1;dx<=1;dx++) for (let dz=-1;dz<=1;dz++)
            for (const i of this.segmentCells.get(`${cx+dx},${cz+dz}`)||[]) candidates.add(i);
        // If no nearby segment exists (garage/background), use exhaustive search.
        const indices = candidates.size ? candidates : this.points.keys();
        for (const i of indices) {
            const a = this.points[i], b = this.points[(i + 1) % this.sampleCount];
            const dx = b.x - a.x, dz = b.z - a.z;
            const f = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
            const d = (x - a.x - dx * f) ** 2 + (z - a.z - dz * f) ** 2;
            if (d < best) { best = d; bestIndex = i; bestF = f; }
        }
        const p = this.sample((bestIndex + bestF) / this.sampleCount);
        return { ...p, index: bestIndex, distance: Math.sqrt(best), lateral: (x - p.x) * p.rx + (z - p.z) * p.rz };
    }

    curvature(progress) {
        const a = this.sample(progress - 3 / this.length), b = this.sample(progress + 3 / this.length);
        return Math.atan2(a.tx * b.tz - a.tz * b.tx, a.tx * b.tx + a.tz * b.tz) / 6;
    }

    surfaceHeight(x, z, nearest = this.nearest(x, z)) {
        // Smooth grass shoulder meets the road; mild elevation, no jumping physics yet.
        const f = clamp((nearest.distance - this.wallOffset - 1) / 18, 0, 1);
        return nearest.y * (1 - f * f * (3 - 2 * f));
    }
}

export function createTrackVisual(track) {
    const root = new THREE.Group();
    root.name = 'ProceduralTrack';
    const makeStrip = (inner, outer, material, height = .04) => {
        const positions = [], indices = [];
        for (let i = 0; i <= track.sampleCount; i++) {
            const p = track.points[i % track.sampleCount];
            for (const lane of [inner, outer]) positions.push(p.x + p.rx * lane, p.y + height, p.z + p.rz * lane);
            if (i < track.sampleCount) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        root.add(mesh);
        return mesh;
    };
    // DoubleSide avoids relying on winding when strips are generated on either side.
    const road = new THREE.MeshStandardMaterial({ color: track.config.road, roughness: .97, side: THREE.DoubleSide });
    const grass = new THREE.MeshStandardMaterial({ color: track.config.ground, roughness: 1, side: THREE.DoubleSide });
    const paint = new THREE.MeshBasicMaterial({ color: 0xf5f0df, side: THREE.DoubleSide });
    makeStrip(-track.wallOffset - 1, track.wallOffset + 1, grass, .005);
    makeStrip(-track.halfWidth, track.halfWidth, road);
    makeStrip(-track.halfWidth+.3, -track.halfWidth+.45, paint, .055);
    makeStrip(track.halfWidth-.45, track.halfWidth-.3, paint, .055);

    const box = new THREE.BoxGeometry(1, 1, 1);
    const dummy = new THREE.Object3D();
    const curbCount = 192;
    for (const [color, parity] of [[0xe64d58, 0], [0xf6ece0, 1]]) {
        const curbs = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color, roughness: 1 }), curbCount);
        for (let i = 0; i < curbCount; i++) {
            const side = i % 2 ? -1 : 1;
            const u = (Math.floor(i / 2) * 2 + parity) / curbCount;
            const p = track.sample(u, (track.halfWidth + .35) * side);
            dummy.position.set(p.x, p.y + .085, p.z);
            dummy.rotation.set(-Math.atan(p.slope), p.heading, 0, 'YXZ');
            dummy.scale.set(.7, .15, track.length / curbCount * .96);
            dummy.updateMatrix(); curbs.setMatrixAt(i, dummy.matrix);
        }
        root.add(curbs);
    }
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd1dce3, roughness: .85 });
    const rails = new THREE.InstancedMesh(box, wallMaterial, track.sampleCount * 2);
    track.walls.forEach((wall, side) => wall.forEach((a, i) => {
        const b = wall[(i + 1) % wall.length];
        dummy.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + .58, (a.z + b.z) / 2);
        dummy.rotation.set(-Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z)), Math.atan2(b.x - a.x, b.z - a.z), 0, 'YXZ');
        dummy.scale.set(.3, 1.1, Math.hypot(b.x - a.x, b.z - a.z) + .06);
        dummy.updateMatrix(); rails.setMatrixAt(side * track.sampleCount + i, dummy.matrix);
    }));
    root.add(rails);

    // Start/finish is actual geometry, not a pre-rendered track image.
    const start = track.sample(0);
    const stripe = new THREE.Group();
    stripe.position.set(start.x, start.y + .065, start.z); stripe.rotation.y = start.heading;
    const checkerMaterials = [0xffffff, 0x192330].map(color => new THREE.MeshBasicMaterial({ color }));
    for(let parity=0;parity<2;parity++){
        const squares=new THREE.InstancedMesh(box,checkerMaterials[parity],14);let i=0;
        for(let x=0;x<14;x++)for(let z=0;z<2;z++)if((x+z)%2===parity){
            dummy.position.set(x-6.5,0,z-.5);dummy.scale.set(1,.018,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();squares.setMatrixAt(i++,dummy.matrix);
        }
        stripe.add(squares);
    }
    root.add(stripe);
    return root;
}
