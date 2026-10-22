import { RacingTrack, clamp, wrap } from './racing-3d-track.js';
import { CAR_TYPES, DIFFICULTIES, SURFACES } from './racing-3d-data.js';

export const FIXED_STEP = 1 / 60;
export const TOTAL_LAPS = 3;
const WHEELBASE = 2.55;
const MAX_STEER = .46;
export const steeringLimit = (speed, handling = 1) => Math.min(MAX_STEER * handling, Math.atan(WHEELBASE * 13 * handling / Math.max(25, speed ** 2)));
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const emptyInput = () => ({ throttle: 0, brake: 0, steer: 0 });

export function createCar(id, name, color, personality = null) {
    // Physics-only data. No mesh geometry or GLB assumptions in this object.
    return { id, name, color, personality, x: 0, y: 0, z: 0, heading: 0, vx: 0, vz: 0, speed: 0, steering: 0,
        wheelAngle: 0, completedLaps: 0, nextCheckpoint: 0, gatesPassed: 0, lapStart: 0,
        lastLap: null, bestLap: null, finishTime: null, progress: 0, offroad: false,
        stuckTime: 0, recoveryCooldown: 0, recoveries: 0, collisions: 0, input: emptyInput(),
        spec: CAR_TYPES[0], surface: 'asphalt', passLane: 0, laneOffset: 0, passUntil: 0, passCooldown: 0,
        passesAttempted: 0, overtakes: 0, wasBehind: null, defense: 0, reverseAttempts: 0,
        reverseUntil:0, reverseCooldown:0, noProgressTime:0,
        stepPrevious:{x:0,z:0,progress:0},collisionPrevious:{x:0,z:0} };
}

export class RacingEngine {
    constructor(track = new RacingTrack(), options = {}) {
        this.configure(track, options);
    }
    configure(track = this.track, options = this.options) {
        this.track = track;
        this.options = { mode: 'race', car: 'street', difficulty: 'normal', ...options };
        this.totalLaps=Number.isInteger(this.options.laps)&&this.options.laps>=1&&this.options.laps<=9?this.options.laps:TOTAL_LAPS;
        this.difficulty = DIFFICULTIES[this.options.difficulty] || DIFFICULTIES.normal;
        const selected = CAR_TYPES.find(c=>c.id===this.options.car) || CAR_TYPES[0];
        this.cars = [Object.assign(createCar(0, 'TU', selected.color), { spec: selected }),
            ...['Alex', 'Mia', 'Max', 'Leo', 'Zoe'].map((name, i) => createCar(i + 1, `BOT ${name}`, [0x51adf2, 0xffc94d, 0x9b72e8, 0x49c49a, 0xff9261][i], {
                ...this.difficulty, pace: this.difficulty.pace*(.97+i*.012),
                lateralG:this.difficulty.lateralG*(.9+i*.055), brake:this.difficulty.brake*(.92+i*.04),
                aggression: clamp(this.difficulty.aggression + (i-2)*.045, .1, 1),
                lane: (i % 3 - 1) * .45, phase: i * 1.7, style: ['costante','aggressivo','prudente','tecnico','veloce'][i]
            }))];
        this.cars.slice(1).forEach((car,i)=>car.spec=CAR_TYPES[(i+1)%CAR_TYPES.length]);
        if (this.options.mode === 'time') this.cars.length=1;
        this.reset();
    }
    get player() { return this.cars[0]; }

    reset() {
        this.state = 'menu'; this.pausedState = null; this.time = 0; this.countdown = 3;
        this.goTimer = 0; this.recoveryNotice = 0;
        this.cars.forEach((old, i) => {
            const fresh = Object.assign(createCar(old.id, old.name, old.color, old.personality), {spec:old.spec});
            Object.assign(old, fresh);
            // The player starts at the back in races: rivals are a real obstacle,
            // not five cars following an empty pole-position lap. Solo uses pole.
            const slot=this.cars.length===1?0:i===0?5:i-1;
            const p = this.track.sample(-(7 + Math.floor(slot / 2) * 6) / this.track.length, slot % 2 ? 2 : -2);
            Object.assign(old, { x: p.x, y: p.y, z: p.z, heading: p.heading });
            this.updateProgress(old);
        });
    }

    start() { this.reset(); this.state = 'countdown'; }
    pause() {
        if (this.state === 'racing' || this.state === 'countdown') {
            this.pausedState = this.state; this.state = 'paused';
        }
    }
    resume() { if (this.state === 'paused') { this.state = this.pausedState; this.pausedState = null; } }

    step(dt, playerInput = emptyInput(), participantInputs = null) {
        if (dt <= 0 || dt > .05 || !['countdown', 'racing', 'finished'].includes(this.state)) return;
        if (this.state === 'finished' && this.cars.every(c=>c.finishTime!==null)) return;
        if (this.state === 'countdown') {
            this.countdown = Math.max(0, this.countdown - dt);
            if (this.countdown <= 1e-7) { this.state = 'racing'; this.goTimer = .9; }
            return;
        }
        this.time += dt;
        this.goTimer = Math.max(0, this.goTimer - dt);
        this.recoveryNotice = Math.max(0, this.recoveryNotice - dt);
        for(const car of this.cars){car.stepPrevious.x=car.x;car.stepPrevious.z=car.z;car.stepPrevious.progress=car.progress;}
        for(const car of this.cars){
            car.input=car.finishTime===null&&participantInputs?.has(car.id)?participantInputs.get(car.id):car.personality||car.finishTime!==null||this.options.aiPlayer?this.botInput(car):playerInput;
            this.drive(car,car.input,dt);
            if(car.finishTime===null)this.checkGate(car,car.stepPrevious);
        }
        for(const car of this.cars){car.collisionPrevious.x=car.x;car.collisionPrevious.z=car.z;}
        this.collideCars();
        // Check both segments of the actual step: driven movement, then contact
        // resolution. A push can cross a gate; a bounce back must not erase an
        // earlier valid forward crossing. Ordered gates prevent double rewards.
        for(const car of this.cars){
            const before=car.stepPrevious;
            car.speed=car.vx*Math.sin(car.heading)+car.vz*Math.cos(car.heading);
            car.y=this.track.surfaceHeight(car.x,car.z);
            if(car.finishTime===null){this.checkGate(car,car.collisionPrevious);this.updateProgress(car);}
            car.recoveryCooldown=Math.max(0,car.recoveryCooldown-dt);
            // A bot yielding at zero target speed still intends to race. If
            // neutral input suppressed this timer, a nose-to-tail deadlock could
            // last until the leaders returned for another lap.
            const attempting=(car.personality||this.options.aiPlayer)&&car.finishTime===null||car.input.throttle>.1||car.input.brake>.1;
            car.stuckTime=Math.abs(car.speed)<.9&&attempting?car.stuckTime+dt:0;
            if(car.finishTime===null)car.noProgressTime=car.progress-before.progress<dt*.2&&attempting?car.noProgressTime+dt:0;
            if((car.stuckTime>10||(car.personality||this.options.aiPlayer)&&car.noProgressTime>14)&&car.recoveryCooldown===0)this.recover(car);
        }
        if (this.player.finishTime !== null) this.state = 'finished';
    }

    drive(car, input, dt) {
        const surface = this.track.nearest(car.x, car.z);
        car.offroad = Math.abs(surface.lateral) > this.track.halfWidth + .2;
        car.surface = car.offroad ? this.track.config.shoulder : 'asphalt';
        const road = SURFACES[car.surface], spec = car.spec;
        // +Z forward, -X right, positive input right: yaw is therefore negative.
        const fx = Math.sin(car.heading), fz = Math.cos(car.heading), rx = -fz, rz = fx;
        let forward = car.vx * fx + car.vz * fz;
        let lateral = car.vx * rx + car.vz * rz;
        const limit = steeringLimit(Math.abs(forward),spec.handling);
        const steeringTarget = clamp(input.steer, -1, 1) * limit;
        car.steering += (steeringTarget - car.steering) * (1 - Math.exp(-(input.steer ? 6.5 : 5.5) * dt));
        car.steering = clamp(car.steering,-limit,limit);
        const throttle = clamp(input.throttle, 0, 1), brake = clamp(input.brake, 0, 1);
        const maxSpeed = spec.speed * road.speed;
        // Brake first; holding S at a standstill engages reverse without instant flipping.
        if (brake > 0) {
            if (forward > .35) forward = Math.max(0, forward - 23 * brake * dt);
            else forward -= 8 * brake * dt;
        } else if (throttle > 0) {
            if (forward < -.35) forward = Math.min(0, forward + 21 * dt);
            else forward += spec.acceleration * road.acceleration * throttle * (1 - Math.max(0, forward) / (spec.speed*1.8)) * dt;
        }
        const drag = road.drag;
        forward *= Math.exp(-drag * dt);
        forward -= Math.sign(forward) * Math.min(Math.abs(forward), .38 * dt);
        forward -= 9.81 * surface.slope * (fx * surface.tx + fz * surface.tz) * dt;
        forward = clamp(forward, -9, spec.speed);
        if(forward>maxSpeed)forward=Math.max(maxSpeed,forward-14*dt);
        const yaw = clamp(-forward / WHEELBASE * Math.tan(car.steering) * (car.surface==='snow'?.92:1), -1.15, 1.15);
        car.heading += yaw * dt;
        // Inertial side-slip with a small, controlled arcade drift, not mesh-based physics.
        lateral += forward * yaw * dt * .42;
        const grip = spec.grip * road.grip - Math.min(2, Math.abs(forward * car.steering) * .12);
        lateral *= Math.exp(-grip * dt);
        car.vx = Math.sin(car.heading) * forward - Math.cos(car.heading) * lateral;
        car.vz = Math.cos(car.heading) * forward + Math.sin(car.heading) * lateral;
        car.x += car.vx * dt; car.z += car.vz * dt;
        this.collideWalls(car);
        for (const obstacle of this.track.obstacles) {
            const dx=car.x-obstacle.x, dz=car.z-obstacle.z, distance=Math.hypot(dx,dz), radius=obstacle.radius+1.25;
            if (distance>=radius || Math.abs(car.y-obstacle.y)>2) continue;
            const nx=dx/Math.max(.001,distance), nz=dz/Math.max(.001,distance), impact=car.vx*nx+car.vz*nz;
            car.x+=nx*(radius-distance);car.z+=nz*(radius-distance);
            if (impact<0) {car.vx-=1.08*impact*nx;car.vz-=1.08*impact*nz;car.vx*=.8;car.vz*=.8;car.collisions++;}
        }
        const after = this.track.nearest(car.x, car.z);
        car.y = this.track.surfaceHeight(car.x, car.z, after);
        car.speed = car.vx * Math.sin(car.heading) + car.vz * Math.cos(car.heading);
        car.wheelAngle += car.speed * dt / .38;
    }

    collideWalls(car) {
        // The wall is a one-sided corridor boundary. Resolving by the circle's
        // current side of a rail can push it OUT when a fast nose crosses the
        // rail between steps; always resolve towards the drivable interior.
        for(const along of [-1.15,1.15]){
            const cx=car.x+Math.sin(car.heading)*along,cz=car.z+Math.cos(car.heading)*along;
            const near=this.track.nearest(cx,cz),allowed=this.track.wallOffset-.92;
            if(Math.abs(near.lateral)<=allowed)continue;
            const side=Math.sign(near.lateral),nx=-side*near.rx,nz=-side*near.rz;
            const push=Math.abs(near.lateral)-allowed+.005;
            car.x+=nx*push;car.z+=nz*push;
            const impact=car.vx*nx+car.vz*nz;
            if(impact<0){car.vx-=impact*1.08*nx;car.vz-=impact*1.08*nz;car.vx*=.88;car.vz*=.88;if(impact< -1)car.collisions++;}
        }
    }

    collideCars() {
        for (let i = 0; i < this.cars.length; i++) for (let j = i + 1; j < this.cars.length; j++) {
            const a = this.cars[i], b = this.cars[j];
            if (a.recoveryCooldown > 3 || b.recoveryCooldown > 3) continue;
            const dx = b.x - a.x, dz = b.z - a.z, distance = Math.hypot(dx, dz);
            if (distance >= 4.5 || Math.abs(a.y - b.y) > 1.5) continue;
            let overlap=0,nx=0,nz=0;
            for(const ca of [-1.12,1.12])for(const cb of [-1.12,1.12]){
                const x=dx+Math.sin(b.heading)*cb-Math.sin(a.heading)*ca,z=dz+Math.cos(b.heading)*cb-Math.cos(a.heading)*ca,d=Math.hypot(x,z),penetration=1.84-d;
                if(penetration>overlap){overlap=penetration;nx=d>1e-6?x/d:1;nz=d>1e-6?z/d:0;}
            }
            if(overlap===0)continue;
            const push = overlap / 2 + .001;
            a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
            const relative = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
            if (relative < 0) {
                const impulse = -relative * .58;
                a.vx -= impulse * nx; a.vz -= impulse * nz; b.vx += impulse * nx; b.vz += impulse * nz;
                if(relative< -.8){a.collisions++; b.collisions++;}
            }
            this.collideWalls(a); this.collideWalls(b);
        }
    }

    botInput(car) {
        const near = this.track.nearest(car.x, car.z), bot = car.personality || {...this.difficulty,lane:0,phase:0};
        const speed = Math.max(0, car.speed);
        const lookahead = 7 + speed * .34;
        let targetSpeed = car.spec.speed*bot.pace;
        let leader=null, nearestAhead=Infinity;
        const fx=Math.sin(car.heading), fz=Math.cos(car.heading);
        const traffic=this.cars.filter(other=>other!==car).map(other=>{
            const dx=other.x-car.x,dz=other.z-car.z;
            return {other,ahead:dx*fx+dz*fz,side:-dx*fz+dz*fx};
        });
        for (const item of traffic) if(item.ahead>0&&item.ahead<nearestAhead&&Math.abs(item.side)<2.5){leader=item.other;nearestAhead=item.ahead;}
        if (car.passUntil<this.time && car.passCooldown<this.time && leader && nearestAhead<25 && speed>leader.speed-2) {
            const safe=side=>!traffic.some(t=>t.other!==leader&&t.ahead>-8&&t.ahead<22&&Math.abs(t.side-side*3.6)<bot.clearance);
            const preferred=car.id%2?1:-1, side=safe(preferred)?preferred:safe(-preferred)?-preferred:0;
            if(side && nearestAhead>bot.clearance+1) {
                car.passLane=side*3.6;car.passUntil=this.time+bot.commitment;
                car.passCooldown=car.passUntil+1.3;car.passesAttempted++;car.wasBehind=leader.id;
            }
        }
        if(car.passUntil<this.time) car.passLane=0;
        if(car.wasBehind!==null){const t=traffic.find(t=>t.other.id===car.wasBehind);if(t&&t.ahead<-4){car.overtakes++;car.wasBehind=null;}}
        // A modest, single move to defend a straight; never weave across rivals.
        const curvature=Math.abs(this.track.curvature(near.u));
        const threat=traffic.find(t=>t.ahead< -4&&t.ahead> -18&&t.other.speed>speed+1);
        const defense=threat&&bot.aggression>.6&&curvature<.008&&!car.passLane?Math.sign(threat.side)*.65:0;
        car.defense=defense;
        const wanted=car.passLane||defense||bot.lane;
        car.laneOffset+=(wanted-car.laneOffset)*.06;
        const errorLane=Math.sin(this.time*.55+bot.phase)*(1-bot.precision)*1.9;
        const target=this.track.racingSample(near.u+lookahead/this.track.length,car.laneOffset+errorLane);
        const targetNear=this.track.nearest(target.x,target.z);
        if(Math.abs(targetNear.lateral)>this.track.halfWidth-1.7){const safe=this.track.sample(target.u,clamp(targetNear.lateral,-this.track.halfWidth+1.7,this.track.halfWidth-1.7));target.x=safe.x;target.z=safe.z;}
        const bearing = Math.atan2(target.x - car.x, target.z - car.z);
        const error = angleDelta(bearing, car.heading);
        const desiredSteer = Math.atan2(-2 * WHEELBASE * Math.sin(error), lookahead);
        for (const distance of [0, 8, 16, 26, 38, 54, 72, 90]) {
            const k = Math.abs(this.track.curvature(near.u + distance / this.track.length));
            const cornerSpeed = clamp(Math.sqrt(bot.lateralG / Math.max(.003, k)), 10, car.spec.speed*bot.pace);
            targetSpeed = Math.min(targetSpeed, Math.sqrt(cornerSpeed ** 2 + 2 * bot.brake * Math.max(0, distance - bot.anticipation)));
        }
        if (Math.abs(error) > .65) targetSpeed = Math.min(targetSpeed, 12);
        if (Math.abs(near.lateral)>this.track.halfWidth-.8) targetSpeed=Math.min(targetSpeed,12);
        for(const t of traffic) if(t.ahead>0&&t.ahead<bot.clearance+speed*.2&&Math.abs(t.side)<2.2) targetSpeed=Math.min(targetSpeed,Math.max(0,t.other.speed-2));
        // Deterministic tiny errors, less frequent/strong on hard; no speed boosts.
        if(Math.sin(this.time*.16+bot.phase)>.985) targetSpeed*=1-bot.mistakes*.14;
        if(car.stuckTime>2.5&&car.reverseCooldown<this.time){car.reverseUntil=this.time+1.1;car.reverseCooldown=this.time+4;car.reverseAttempts++;}
        if(car.reverseUntil>this.time)return {steer:-Math.sign(desiredSteer||1),throttle:0,brake:1};
        return { steer: clamp(desiredSteer / steeringLimit(speed,car.spec.handling), -1, 1), throttle: speed < targetSpeed ? 1 : 0, brake: speed > targetSpeed + .7 ? clamp((speed - targetSpeed) / 5, 0, 1) : 0 };
    }

    checkGate(car, previous) {
        const gate = this.track.gates[car.nextCheckpoint];
        const before = (previous.x - gate.x) * gate.tx + (previous.z - gate.z) * gate.tz;
        const after = (car.x - gate.x) * gate.tx + (car.z - gate.z) * gate.tz;
        if (!(before <= 0 && after > 0)) return;
        const f = -before / (after - before);
        const x = previous.x + (car.x - previous.x) * f, z = previous.z + (car.z - previous.z) * f;
        const lateral = (x - gate.x) * gate.rx + (z - gate.z) * gate.rz;
        if (Math.abs(lateral) > this.track.halfWidth + 2) return;
        const crossTime = this.time - FIXED_STEP + FIXED_STEP * f;
        if (car.nextCheckpoint === 0) {
            if (car.gatesPassed > 0) {
                car.completedLaps++;
                car.lastLap = crossTime - car.lapStart;
                car.bestLap = Math.min(car.bestLap ?? Infinity, car.lastLap);
                if (car.completedLaps >= this.totalLaps) car.finishTime = crossTime;
            }
            car.lapStart = crossTime;
        }
        car.gatesPassed++;
        car.nextCheckpoint = (car.nextCheckpoint + 1) % this.track.checkpointCount;
    }

    updateProgress(car) {
        const u = this.track.nearest(car.x, car.z).u;
        if (car.gatesPassed === 0) car.progress = -wrap(-u) * this.track.length;
        else {
            const last = (car.nextCheckpoint - 1 + this.track.checkpointCount) % this.track.checkpointCount;
            let delta = wrap(u - last / this.track.checkpointCount);
            if (delta > .5) delta -= 1;
            const fraction = clamp(delta * this.track.checkpointCount, 0, 1);
            car.progress = (car.gatesPassed - 1 + fraction) * this.track.length / this.track.checkpointCount;
        }
    }

    recover(car = this.player) {
        if (car.finishTime !== null || !['racing', 'paused'].includes(this.state) || car.recoveryCooldown > 0) return false;
        const last = car.gatesPassed ? (car.nextCheckpoint - 1 + this.track.checkpointCount) % this.track.checkpointCount : 0;
        const u = car.gatesPassed ? last / this.track.checkpointCount + 2 / this.track.length : -5 / this.track.length;
        let p=this.track.sample(u,car.personality?.lane??0);
        for(const lane of [0,-3.5,3.5]) {
            const candidate=this.track.sample(u,lane);
            if(!this.cars.some(other=>other!==car&&Math.hypot(candidate.x-other.x,candidate.z-other.z)<5)){p=candidate;break;}
        }
        Object.assign(car, { x: p.x, y: p.y, z: p.z, heading: p.heading, vx: 0, vz: 0, speed: 0, steering: 0, stuckTime: 0, noProgressTime:0, reverseUntil:0, recoveryCooldown: 4 });
        car.recoveries++;
        this.updateProgress(car);
        if (car === this.player) this.recoveryNotice = 2;
        return true;
    }

    standings() {
        return [...this.cars].sort((a, b) => {
            if (a.finishTime !== null || b.finishTime !== null) return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
            return b.progress - a.progress || a.id - b.id;
        });
    }

    snapshot() {
        return { state: this.state, time: this.time, countdown: this.countdown, position: this.standings().findIndex(c => c.id === 0) + 1,
            track: this.track.config.id, mode:this.options.mode, difficulty:this.options.difficulty,
            cars: this.cars.map(({ id, name, x, y, z, heading, speed, steering, wheelAngle, completedLaps, nextCheckpoint, gatesPassed, lastLap, bestLap, finishTime, offroad, progress, collisions, recoveries, surface, passesAttempted, overtakes, reverseAttempts }) => ({ id, name, x, y, z, heading, speed, steering, wheelAngle, completedLaps, nextCheckpoint, gatesPassed, lastLap, bestLap, finishTime, offroad, progress, collisions, recoveries, surface, passesAttempted, overtakes, reverseAttempts })) };
    }
}
