import * as THREE from './vendor/three/three.module.min.js';

// Props are batches sharing a small geometry/material palette. No individual
// point lights, downloaded textures or per-tree draw calls.
export function createEnvironment(track,quality) {
    const root=new THREE.Group();root.name=`Environment_${track.config.id}`;
    const theme=track.config.theme,night=['city','neon'].includes(theme),snow=theme==='alpine';
    const geometries={box:new THREE.BoxGeometry(1,1,1),trunk:new THREE.CylinderGeometry(.45,.6,1,7),crown:new THREE.IcosahedronGeometry(1,1),cone:new THREE.ConeGeometry(1,1,8),rock:new THREE.DodecahedronGeometry(1,0),tire:new THREE.TorusGeometry(.58,.2,6,10)};
    const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.95});
    const palette={ground:mat(track.config.ground),wood:mat(0x77513c),leaf:mat(0x36764e),leaf2:mat(0x609343),pine:mat(snow?0x326258:0x28573e),stone:mat(theme==='canyon'?0xae6746:0x9ba6ae),wall:mat(night?0x303c55:0xc3c6ca),dark:mat(0x28313d),snow:mat(0xeaf1f4),yellow:mat(0xf3be42),orange:mat(0xf1793d),roof:mat(0x715043),glow:new THREE.MeshBasicMaterial({color:track.config.accent}),window:new THREE.MeshBasicMaterial({color:0xffd489}),white:new THREE.MeshBasicMaterial({color:0xf0f1e8})};
    const batches=new Map(),dummy=new THREE.Object3D();
    const prop=(geo,material,position,scale,rotation=0)=>{
        const key=`${geo}/${material}`;if(!batches.has(key))batches.set(key,[]);
        batches.get(key).push({position,scale,rotation});
    };
    const groundAt=(x,z)=>{
        const near=track.nearest(x,z);
        if(theme==='canyon'&&near.u>track.config.bridge-.018&&near.u<track.config.bridge+40/track.length&&near.distance<35)return -8;
        return track.surfaceHeight(x,z,near);
    };
    const groundGeometry=new THREE.PlaneGeometry(580,580,80,80);groundGeometry.rotateX(-Math.PI/2);
    const pos=groundGeometry.attributes.position;
    for(let i=0;i<pos.count;i++){
        pos.setY(i,groundAt(pos.getX(i),pos.getZ(i))-.065);
    }
    groundGeometry.computeVertexNormals();root.add(new THREE.Mesh(groundGeometry,palette.ground));
    const at=(u,lane=0)=>{const p=track.sample(u,lane);if(Math.abs(lane)>track.wallOffset+1)p.y=groundAt(p.x,p.z);return p;};
    const tree=(p,type,size,seed)=>{
        const {x,y,z}=p;
        prop('trunk','wood',[x,y+size*1.35,z],[size*.65,size*2.7,size*.65]);
        if(type>=3){
            for(let n=0;n<(type===3?3:4);n++)prop('cone','pine',[x,y+size*(2+n*.9),z],[size*(2.3-n*.4),size*2.4,size*(2.3-n*.4)]);
            if(snow)prop('cone','snow',[x,y+size*4.2,z],[size*1.1,size*1.8,size*1.1]);
        }else{
            const count=type===0?3:type===1?5:4;
            for(let n=0;n<count;n++){
                const angle=n*2.4+seed,r=type===0?.8:1.1;
                prop('crown',type===1?'leaf2':'leaf',[x+Math.sin(angle)*size*r,y+size*(3.1+n%2*.6),z+Math.cos(angle)*size*r],[size*(type===2?1.2:1.5),size*(type===2?2:1.4),size*1.5],angle);
            }
        }
    };
    const building=(p,height,width,depth,lit=false)=>{
        prop('box','wall',[p.x,p.y+height/2,p.z],[width,height,depth],p.heading||0);
        if(lit)for(let floor=2;floor<height;floor+=3)for(let col=-width/2+1;col<width/2;col+=2.2){
            const heading=p.heading||0,front=depth/2+.04;
            prop('box','window',[p.x+Math.cos(heading)*col+Math.sin(heading)*front,p.y+floor,p.z-Math.sin(heading)*col+Math.cos(heading)*front],[.85,.95,.05],heading);
        }
    };
    const count=Math.round(130*quality.density);
    for(let i=0;i<count;i++){
        const u=(i*.61803398875)%1, side=i%2?1:-1, lane=side*(track.wallOffset+11+(i%7)*7),p=at(u,lane);
        // Placement follows the actual road distance, including adjacent segments.
        if(track.nearest(p.x,p.z).distance<track.wallOffset+6)continue;
        const size=.85+(i%5)*.22;
        if(theme==='grand')tree(p,i%3,size,i);
        if(snow)tree(p,3+i%2,size,i);
        if(theme==='canyon'){
            prop('rock','stone',[p.x,p.y+size*3,p.z],[size*3,size*6,size*2.5],i);
            if(i%3===0){prop('trunk','leaf',[p.x+4,p.y+2,p.z],[.7,4,.7]);prop('box','leaf',[p.x+4.7,p.y+2.5,p.z],[1.5,.45,.45]);prop('trunk','leaf',[p.x+5.3,p.y+3,p.z],[.45,1.5,.45]);}
        }
        if(theme==='city')building(p,10+i%7*4,6+i%3*2,6,true);
        if(theme==='neon'){
            building(p,8+i%6*5,4,4,false);prop('box','glow',[p.x,p.y+8+i%6*2.5,p.z],[.16,16+i%6*5,4.05]);
        }
    }
    // Visible collision props use exactly the engine's separate collision data.
    for(const obstacle of track.obstacles){
        if(theme==='city')prop('box','wall',[obstacle.x,obstacle.y+1.5,obstacle.z],[1.1,3,1.1]);
        else prop('rock','stone',[obstacle.x,obstacle.y+.6,obstacle.z],[obstacle.radius,1.2,obstacle.radius]);
    }
    // Reusable foreground: marker signs, cones, tyre stacks and guardrail posts.
    for(let i=0;i<32;i++){
        const p=at(i/32,(i%2?1:-1)*(track.wallOffset+.35));
        prop('box','wall',[p.x,p.y+.7,p.z],[.22,1.4,.22],p.heading);
        if(i%4===0){prop('box','glow',[p.x,p.y+2.2,p.z],[2.6,1.1,.15],p.heading);prop('box','dark',[p.x,p.y+1.2,p.z],[.12,2.4,.12]);}
        if(theme==='grand'&&i%3===0)for(let t=0;t<3;t++)prop('tire','dark',[p.x,p.y+.25+t*.4,p.z],[1,1,1],Math.PI/2);
        if(night){const lamp=at(i/32,track.wallOffset+1.5);prop('box','dark',[lamp.x,lamp.y+3.5,lamp.z],[.18,7,.18]);prop('box','window',[lamp.x,lamp.y+7,lamp.z],[1.2,.15,1.2]);}
        if(theme==='neon')for(const side of [-1,1]){const rail=at(i/32,side*track.wallOffset);prop('box','glow',[rail.x,rail.y+.85,rail.z],[.12,.12,track.length/32*.94],rail.heading);}
    }
    if(theme==='grand'){
        for(const side of [-1,1])for(let i=0;i<8;i++){
            const p=at(.015+i*.012,side*(track.wallOffset+8));
            for(let row=0;row<4;row++)prop('box',row%2?'white':'glow',[p.x+p.rx*row*1.3*side,p.y+.8+row*.8,p.z+p.rz*row*1.3*side],[8,.4,1.3],p.heading);
        }
        const pit=at(.965,track.wallOffset+9);building(pit,4,20,7);prop('box','glow',[pit.x,pit.y+4,pit.z],[20,.25,7]);
        for(let i=0;i<8;i++){const p=at(.9+i*.008,track.wallOffset-1.5);prop('cone','orange',[p.x,p.y+.5,p.z],[.7,1,.7]);}
    }
    if(snow){
        for(let i=0;i<16;i++){const p=at(i/16,(i%2?1:-1)*(track.wallOffset+50));prop('cone','stone',[p.x,p.y+25,p.z],[35,70,35],i);prop('cone','snow',[p.x,p.y+49,p.z],[13,27,13]);}
        for(let i=0;i<5;i++){const p=at(i/5,track.wallOffset+14);building(p,3.5,6,5);prop('cone','roof',[p.x,p.y+4.7,p.z],[5,3,4],Math.PI/4);}
    }
    if(theme==='canyon'){
        for(let i=0;i<18;i++){const p=at(i/18,(i%2?1:-1)*(track.wallOffset+50));prop('rock','stone',[p.x,p.y+15,p.z],[15,30+i%4*7,18],i);}
    }
    if(track.config.tunnel!==null){
        for(let i=0;i<12;i++){
            const p=at(track.config.tunnel+i*3/track.length,0);
            for(const side of [-1,1]){const post=at(p.u,side*(track.wallOffset+.35));prop('box',theme==='canyon'?'stone':'wall',[post.x,post.y+3.5,post.z],[.7,7,3.1],p.heading);}
            prop('box',theme==='canyon'?'stone':'wall',[p.x,p.y+7,p.z],[track.wallOffset*2+.7,.65,3.1],p.heading);
            if(night)prop('box','glow',[p.x,p.y+6.6,p.z],[track.halfWidth*2,.06,.2],p.heading);
        }
    }
    if(track.config.bridge!==null){
        for(let i=0;i<8;i++){
            const p=at(track.config.bridge+i*4/track.length);
            prop('box','dark',[p.x,p.y-.5,p.z],[track.wallOffset*2,1,4.1],p.heading);
            for(const side of [-1,1]){const a=at(p.u,side*track.wallOffset),bottom=theme==='canyon'?-8:0;prop('box','wall',[a.x,(a.y+bottom)/2,a.z],[.8,Math.max(1,a.y-bottom),.8]);prop('box','glow',[a.x,a.y+1.4,a.z],[.3,.25,4.1],p.heading);}
        }
    }
    // Start banner (solid materials), visible in every environment.
    const start=at(0);
    for(const side of [-1,1]){const p=at(0,side*(track.halfWidth+1));prop('box','dark',[p.x,p.y+3,p.z],[.45,6,.45]);}
    prop('box','glow',[start.x,start.y+6,start.z],[track.halfWidth*2+2,.9,.4],start.heading);
    for(const [key,instances] of batches){
        const [geo,material]=key.split('/'),mesh=new THREE.InstancedMesh(geometries[geo],palette[material],instances.length);
        mesh.name=`Prop_${key}`;
        instances.forEach((item,i)=>{dummy.position.set(...item.position);dummy.scale.set(...item.scale);dummy.rotation.set(0,item.rotation,0);if(geo==='tire')dummy.rotation.x=Math.PI/2;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
        mesh.computeBoundingSphere();root.add(mesh);
    }
    // Resources not used by a batch aren't retained or uploaded.
    for(const [name,g]of Object.entries(geometries))if(![...batches.keys()].some(k=>k.startsWith(name+'/')))g.dispose();
    for(const [name,m]of Object.entries(palette))if(name!=='ground'&&![...batches.keys()].some(k=>k.endsWith('/'+name)))m.dispose();
    return root;
}
