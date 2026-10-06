import * as THREE from './vendor/three/three.module.min.js';

// A per-scene pool: replacement previews don't dispose resources still used by
// other cars. The view releases unique geometry/materials when replacing a scene.
export function createModelPool() {
    return { box:new THREE.BoxGeometry(1,1,1), tire:new THREE.CylinderGeometry(.38,.38,.3,12), rim:new THREE.CylinderGeometry(.22,.22,.315,10),
        rubber:new THREE.MeshStandardMaterial({color:0x17212b,roughness:.95}), metal:new THREE.MeshStandardMaterial({color:0xc0cad4,metalness:.55,roughness:.35}),
        glass:new THREE.MeshStandardMaterial({color:0x223e53,metalness:.25,roughness:.2}), white:new THREE.MeshBasicMaterial({color:0xffedc8}), red:new THREE.MeshBasicMaterial({color:0xff354e}) };
}

function hull(rings, material) {
    const vertices=[], indices=[];
    for(const [z,width,bottom,top,roofWidth=width*.85] of rings)
        vertices.push(-width,bottom,z, width,bottom,z, roofWidth,top,z, -roofWidth,top,z);
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<4;j++){
        const a=i*4+j,b=i*4+(j+1)%4,c=a+4,d=b+4;indices.push(a,b,c,b,d,c);
    }
    indices.push(0,2,1,0,3,2);
    const end=(rings.length-1)*4;indices.push(end,end+1,end+2,end,end+2,end+3);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    return new THREE.Mesh(geometry,material);
}

export function createCarVisual(spec,color=spec.color,pool=createModelPool()) {
    const root=new THREE.Group();root.name=`Car_${spec.id}`;
    const paint=new THREE.MeshStandardMaterial({color,metalness:.24,roughness:.4,side:THREE.DoubleSide});
    const part=(name,mat,size,pos)=>{const m=new THREE.Mesh(pool.box,mat);m.name=name;m.scale.set(...size);m.position.set(...pos);root.add(m);return m;};
    const rally=spec.body==='rally', formula=spec.body==='formula', hyper=spec.body==='hyper', muscle=spec.body==='muscle', hatch=spec.body==='hatch';
    const floor=rally?.51:.38, length=muscle?2.2:hyper?2.18:formula?2.25:1.98;
    const body=hull([[-length,.72,floor,.78],[-1.45,.94,floor,.95],[.4,.94,floor,.82],[1.35,.86,floor,.7],[length,.64,floor+.07,.58]],paint);
    body.name='SculptedBody';root.add(body);
    if(formula){
        body.scale.x=.62;part('FrontWing',pool.rubber,[2.25,.12,.52],[0,.42,1.98]);
        part('RearWing',paint,[2.2,.14,.65],[0,1.17,-1.95]);part('WingSupport',pool.metal,[.8,.55,.1],[0,.9,-1.9]);
        const cockpit=hull([[-.85,.39,.75,1.13],[.2,.38,.75,1.02]],pool.rubber);root.add(cockpit);
        part('RollHoop',pool.metal,[.55,.12,.13],[0,1.24,-.55]);
    }else{
        const back=hatch||rally?-1.43:hyper?-1.03:-1.3, front=muscle?.12:hyper?.8:.65, top=hyper?1.22:rally?1.57:hatch?1.48:1.4;
        const cabin=hull([[back,.74,.82,1.04,.68],[back+.38,.7,.82,top,.59],[front-.38,.7,.82,top-.03,.58],[front,.73,.82,.89,.69]],pool.glass);
        cabin.name='CabinGlass';root.add(cabin);
        part('Roof',paint,[1.15,.075,Math.max(.3,front-back-.75)],[0,top+.025,(back+front)/2]);
        for(const x of [-.7,.7])part('Pillar',paint,[.08,.59,.075],[x,1.16,back+.42]);
        part('FrontBumper',pool.rubber,[1.4,.15,.13],[0,.46,length]);part('RearBumper',pool.rubber,[1.6,.14,.13],[0,.49,-length]);
        if(muscle){part('HoodScoop',pool.rubber,[.67,.15,.7],[0,.88,1.15]);for(const x of [-.27,.27])part('RacingStripe',pool.white,[.13,.018,1.6],[x,.8,1]);}
        if(!hatch||rally){part('Spoiler',paint,[1.9,.1,.42],[0,hyper?.93:1.12,-1.81]);for(const x of [-.64,.64])part('SpoilerMount',pool.rubber,[.07,.25,.1],[x,.96,-1.8]);}
        if(rally){part('RoofVent',pool.rubber,[.6,.12,.35],[0,1.64,-.25]);for(const x of [-.6,-.2,.2,.6])part('RallyLamp',pool.white,[.24,.23,.1],[x,.73,2]);}
        for(const x of [-.49,.49]){part('Headlight',pool.white,[hyper?.39:.32,.12,.07],[x,.53,length+.01]);part('Taillight',pool.red,[.35,.12,.06],[x,.7,-length-.01]);}
    }
    // Merge static body pieces per material; wheels remain named, articulated
    // nodes for steering/spin and future GLB replacements.
    const groups=new Map();
    for(const mesh of [...root.children])if(mesh.isMesh){
        if(!groups.has(mesh.material))groups.set(mesh.material,[]);groups.get(mesh.material).push(mesh);
    }
    for(const [material,pieces]of groups){
        const vertices=[],normals=[],indices=[];let offset=0;
        for(const mesh of pieces){
            mesh.updateMatrix();const g=mesh.geometry.clone().applyMatrix4(mesh.matrix),p=g.attributes.position,n=g.attributes.normal;
            vertices.push(...p.array);normals.push(...n.array);
            if(g.index)for(const index of g.index.array)indices.push(index+offset);else for(let i=0;i<p.count;i++)indices.push(i+offset);
            offset+=p.count;g.dispose();root.remove(mesh);
            if(mesh.geometry!==pool.box)mesh.geometry.dispose();
        }
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setIndex(indices);
        const merged=new THREE.Mesh(geometry,material);merged.name='Body_'+material.uuid;root.add(merged);
    }
    const wheelPivots=[],wheelRollers=[];
    // Driver's left is +X; all exported wheel names follow that convention.
    for(const [name,x,z] of [['Wheel_FL',1,1.32],['Wheel_FR',-1,1.32],['Wheel_RL',1,-1.27],['Wheel_RR',-1,-1.27]]){
        const pivot=new THREE.Group();pivot.name=name;pivot.position.set(x,rally?.48:.4,z);
        const roller=new THREE.Group(),tire=new THREE.Mesh(pool.tire,pool.rubber),rim=new THREE.Mesh(pool.rim,pool.metal);
        tire.rotation.z=Math.PI/2;rim.rotation.z=Math.PI/2;roller.add(tire,rim);pivot.add(roller);root.add(pivot);
        wheelPivots.push(pivot);wheelRollers.push(roller);
    }
    const ownedGeometry=root.children.filter(child=>child.isMesh).map(mesh=>mesh.geometry);
    return {root,wheelPivots,wheelRollers,dispose:()=>{ownedGeometry.forEach(geometry=>geometry.dispose());paint.dispose();}};
}
