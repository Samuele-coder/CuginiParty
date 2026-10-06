import * as THREE from './vendor/three/three.module.min.js';
import { createTrackVisual } from './racing-3d-track.js';
import { createEnvironment } from './racing-3d-environment.js';
import { createCarVisual, createModelPool } from './racing-3d-models.js';
import { QUALITY } from './racing-3d-data.js';

function releaseScene(scene) {
    const geometry=new Set(),material=new Set();
    scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)for(const m of [].concat(o.material))material.add(m);if(o.isInstancedMesh)o.dispose();});
    geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());scene.clear();
}
export class RacingView {
    constructor(canvas,engine,debug=false,quality='auto') {
        this.engine=engine;this.debug=debug;this.quality=quality;this.visuals=new Map();
        this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
        this.renderer.outputColorSpace=THREE.SRGBColorSpace;
        this.camera=new THREE.PerspectiveCamera(58,1,.12,500);
        this.cameraLook=new THREE.Vector3();this.desiredCamera=new THREE.Vector3();this.desiredLook=new THREE.Vector3();
        this.performanceTime=0;this.performanceFrames=0;this.autoReduced=false;this.preview=false;
        this.build();this.resize();
    }
    build() {
        if(this.scene)releaseScene(this.scene);
        this.visuals.clear();this.scene=new THREE.Scene();this.pool=createModelPool();
        const config=this.engine.track.config, settings=QUALITY[this.quality]||QUALITY.auto;
        this.effective=this.quality==='auto'&&this.autoReduced?QUALITY.low:settings;
        this.pixelRatio=Math.min(devicePixelRatio||1,this.effective.dpr);this.renderer.setPixelRatio(this.pixelRatio);
        this.scene.background=new THREE.Color(config.sky);this.scene.fog=new THREE.Fog(config.sky,this.effective.distance*.42,this.effective.distance);
        this.camera.far=this.effective.distance+100;this.camera.updateProjectionMatrix();
        const night=['city','neon'].includes(config.theme);
        const horizon=new THREE.Color(config.sky),zenith=horizon.clone().multiplyScalar(night?.4:.65);
        this.sky=new THREE.Mesh(new THREE.SphereGeometry(1,24,12),new THREE.ShaderMaterial({
            uniforms:{horizon:{value:horizon},zenith:{value:zenith}},side:THREE.BackSide,depthWrite:false,
            vertexShader:'varying float elevation; void main(){ elevation=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
            fragmentShader:'uniform vec3 horizon; uniform vec3 zenith; varying float elevation; void main(){ gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-0.08,0.75,elevation)),1.0); #include <colorspace_fragment> }'.replace('#include','\n#include').replace(' }','\n}')
        }));
        this.sky.scale.setScalar(this.camera.far*.92);this.sky.frustumCulled=false;this.sky.renderOrder=-1;this.scene.add(this.sky);
        this.scene.add(new THREE.HemisphereLight(night?0xaacfff:0xe4f3ff,config.ground,night?1.9:2.5));
        const sun=new THREE.DirectionalLight(night?0xb5c4ef:0xffead6,night?1.1:2.2);sun.position.set(-60,95,35);this.scene.add(sun);
        this.world=new THREE.Group();this.world.add(createTrackVisual(this.engine.track),createEnvironment(this.engine.track,this.effective));this.scene.add(this.world);
        for(const car of this.engine.cars)this.setCarVisual(car.id,createCarVisual(car.spec,car.color,this.pool));
        const sg=new THREE.CircleGeometry(1,14),sm=new THREE.MeshBasicMaterial({color:0x101828,transparent:true,opacity:.22,depthWrite:false});
        this.shadows=this.engine.cars.map(()=>{const s=new THREE.Mesh(sg,sm);s.rotation.x=-Math.PI/2;s.scale.set(1.4,2.35,1);this.scene.add(s);return s;});
        this.garageFloor=new THREE.Mesh(new THREE.CylinderGeometry(3.8,3.9,.15,48),new THREE.MeshStandardMaterial({color:0x4d5868,roughness:.8}));
        this.garageFloor.position.y=-.12;this.scene.add(this.garageFloor);
        this.createParticles(this.effective.particles);this.lastState=null;this.previewAngle=0;
        if(this.debug){const points=this.engine.track.points.map(p=>new THREE.Vector3(p.x,p.y+.2,p.z));points.push(points[0]);this.world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xffec4d})));}
    }
    // GLB adapter contract: root and named Wheel_FL/FR/RL/RR pivots/rollers.
    // Models must use +Z forward/+Y up, driver-right -X, and metre-scale.
    setCarVisual(id,visual) {
        const old=this.visuals.get(id);if(old){this.scene.remove(old.root);old.dispose?.();}
        this.visuals.set(id,visual);this.scene.add(visual.root);
    }
    setQuality(value) {if(!QUALITY[value])return;this.quality=value;this.autoReduced=false;this.build();this.resize();}
    createParticles(count) {
        this.particles=Array.from({length:count},()=>({life:0,x:0,y:0,z:0,vx:0,vz:0}));this.particleCursor=0;this.emission=0;
        const positions=new Float32Array(count*3);positions.fill(-1000);
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
        this.particleMesh=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xd9c3a1,size:.38,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:true}));
        this.particleMesh.frustumCulled=false;this.scene.add(this.particleMesh);
    }
    updateParticles(dt) {
        const c=this.engine.player,slip=Math.abs(-Math.cos(c.heading)*c.vx+Math.sin(c.heading)*c.vz);this.emission+=dt;
        if(this.engine.state==='racing'&&(c.offroad||slip>.8&&Math.abs(c.speed)>13)&&Math.abs(c.speed)>4&&this.emission>.04){
            this.emission=0;const p=this.particles[this.particleCursor++%this.particles.length];
            Object.assign(p,{life:.6,x:c.x-Math.sin(c.heading)*1.6,y:c.y+.3,z:c.z-Math.cos(c.heading)*1.6,vx:-c.vx*.07,vz:-c.vz*.07});
        }
        const attribute=this.particleMesh.geometry.attributes.position;
        this.particles.forEach((p,i)=>{p.life-=dt;if(p.life>0){p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=dt*.6;attribute.setXYZ(i,p.x,p.y,p.z);}else attribute.setXYZ(i,0,-1000,0);});attribute.needsUpdate=true;
        this.particleMesh.visible=!this.preview;
    }
    resize() {
        const rect=this.renderer.domElement.getBoundingClientRect();this.width=Math.max(1,Math.round(rect.width));this.height=Math.max(1,Math.round(rect.height));
        this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
    }
    render(dt) {
        const engine=this.engine,player=engine.player,mode=this.preview?'garage':engine.state;
        this.sky.visible=!this.preview;
        this.world.visible=!this.preview;this.garageFloor.visible=this.preview;this.scene.background.set(this.preview?0x243044:engine.track.config.sky);
        for(const car of engine.cars){
            const v=this.visuals.get(car.id);if(!v)continue;v.root.visible=!this.preview||car.id===0;
            if(this.preview){if(car.id===0){this.previewAngle+=dt*.28;v.root.position.set(0,0,0);v.root.rotation.set(0,this.previewAngle,0);}continue;}
            v.root.position.set(car.x,car.y+.035,car.z);
            const road=engine.track.nearest(car.x,car.z),grade=road.slope*(Math.sin(car.heading)*road.tx+Math.cos(car.heading)*road.tz);
            v.root.rotation.set(-Math.atan(grade),car.heading,car.steering*Math.min(Math.abs(car.speed),30)*.0018,'YXZ');
            v.wheelPivots?.forEach((pivot,i)=>pivot.rotation.y=i<2?-car.steering:0);
            v.wheelRollers?.forEach(roller=>roller.rotation.x=car.wheelAngle);
        }
        this.shadows.forEach((s,i)=>{const c=engine.cars[i];s.visible=!this.preview;s.position.set(c.x,c.y+.08,c.z);s.rotation.z=-c.heading;});this.updateParticles(dt);
        if(this.preview){
            const fit=Math.max(1,.72/(this.width/this.height));
            this.desiredCamera.set(5.3*fit,.8+2.4*fit,-6.6*fit);this.desiredLook.set(0,.8,0);
            const sidePanel=this.width>800||this.width>600&&this.width>this.height;
            this.camera.setViewOffset(this.width,this.height,sidePanel?this.width*.23:0,sidePanel?0:this.height*.23,this.width,this.height);
        }else{
            this.camera.clearViewOffset();
            if(mode==='menu'){this.desiredCamera.set(-130,105,-160);this.desiredLook.set(0,4,-5);}
            else{
                const distance=8.8+Math.min(3,Math.abs(player.speed)*.055),fx=Math.sin(player.heading),fz=Math.cos(player.heading);
                this.desiredCamera.set(player.x-fx*distance,player.y+4.7,player.z-fz*distance);
                this.desiredLook.set(player.x+fx*(7+Math.abs(player.speed)*.1),player.y+1.3,player.z+fz*(7+Math.abs(player.speed)*.1));
                this.desiredCamera.y=Math.max(this.desiredCamera.y,engine.track.surfaceHeight(this.desiredCamera.x,this.desiredCamera.z)+2);
                const tunnel=engine.track.config.tunnel,u=engine.track.nearest(player.x,player.z).u;
                if(tunnel!==null&&u>tunnel-.02&&u<tunnel+38/engine.track.length)this.desiredCamera.y=Math.min(this.desiredCamera.y,player.y+4.3);
                for(const o of engine.track.obstacles)if(Math.hypot(this.desiredCamera.x-o.x,this.desiredCamera.z-o.z)<o.radius+1)this.desiredCamera.y=Math.max(this.desiredCamera.y,o.y+3);
            }
        }
        if(this.lastState!==mode||player.recoveryCooldown>3.95){this.camera.position.copy(this.desiredCamera);this.cameraLook.copy(this.desiredLook);}
        else{this.camera.position.lerp(this.desiredCamera,1-Math.exp(-4.5*dt));this.cameraLook.lerp(this.desiredLook,1-Math.exp(-6*dt));}
        this.lastState=mode;this.camera.lookAt(this.cameraLook);
        this.sky.position.copy(this.camera.position);
        const fov=this.preview?42:58+Math.min(5,Math.abs(player.speed)*.1);this.camera.fov+=(fov-this.camera.fov)*(1-Math.exp(-3*dt));this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene,this.camera);
        // AUTO is presentation-only. One-way reduction avoids allocation churn.
        if(this.quality==='auto'&&!this.autoReduced&&mode==='racing'){
            this.performanceTime+=dt;this.performanceFrames++;
            if(this.performanceTime>5){if(this.performanceFrames/this.performanceTime<38){this.autoReduced=true;this.build();this.resize();}this.performanceTime=0;this.performanceFrames=0;}
        }
    }
    metrics() {
        let meshes=0,instances=0;this.scene.traverse(o=>{if(o.isMesh)meshes++;if(o.isInstancedMesh)instances+=o.count;});
        return {width:this.width,height:this.height,dpr:this.pixelRatio,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,meshes,instances,quality:this.quality,autoReduced:this.autoReduced};
    }
    screenDirection() {
        const c=this.engine.player,a=new THREE.Vector3(c.x,c.y+1,c.z),b=a.clone().add(new THREE.Vector3(-Math.cos(c.heading),0,Math.sin(c.heading)));
        return b.project(this.camera).x-a.project(this.camera).x;
    }
    dispose() {releaseScene(this.scene);this.renderer.renderLists.dispose();this.renderer.dispose();}
}
