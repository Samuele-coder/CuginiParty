'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
    const {RacingEngine,FIXED_STEP,steeringLimit}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-engine.js')));
    const {RacingTrack}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-track.js')));
    const {TRACKS,DIFFICULTIES,CAR_TYPES}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-data.js')));
    const {loadPreferences,savePreferences,updateRecords}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-storage.js')));
    const {createCarVisual}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-models.js')));
    const rows=[];
    for(const config of TRACKS)for(const difficulty of Object.keys(DIFFICULTIES)){
        const e=new RacingEngine(new RacingTrack(config.id),{difficulty,aiPlayer:true});e.start();
        let maxLateral=0;
        const lapTimes=new Map(e.cars.map(c=>[c.id,[]])),firstGate={};
        for(let i=0;i<60*400&&!e.cars.every(c=>c.finishTime!==null);i++){
            e.step(FIXED_STEP);
            for(const c of e.cars){if(c.gatesPassed>0&&firstGate[c.id]===undefined)firstGate[c.id]=e.time;const laps=lapTimes.get(c.id);if(c.completedLaps>laps.length)laps.push(c.lastLap);}
            if(i%60===0)for(const c of e.cars)maxLateral=Math.max(maxLateral,Math.abs(e.track.nearest(c.x,c.z).lateral));
        }
        const row={track:config.id,difficulty,times:e.cars.map(c=>c.finishTime===null?null:+c.finishTime.toFixed(2)),gates:e.cars.map(c=>c.gatesPassed),resets:e.cars.reduce((n,c)=>n+c.recoveries,0),collisions:e.cars.reduce((n,c)=>n+c.collisions,0),passes:e.cars.reduce((n,c)=>n+c.passesAttempted,0),overtakes:e.cars.reduce((n,c)=>n+c.overtakes,0),maxLateral:+maxLateral.toFixed(2),worstLapRatio:+Math.max(...[...lapTimes.values()].map(laps=>Math.max(...laps)/Math.min(...laps))).toFixed(2)};
        rows.push(row);console.log(JSON.stringify(row));
        assert.ok(e.cars.every(c=>c.finishTime!==null&&c.completedLaps===3&&c.gatesPassed===61),`Incomplete ordered race: ${config.id}/${difficulty}`);
        assert.equal(row.resets,0,`Unexpected recovery ${config.id}/${difficulty}`);
        assert.ok(Object.values(firstGate).every(time=>time<6),'All cars must arm lap 1 without missing the grid gate');
        assert.ok(row.worstLapRatio<1.65,'A bot must not lose an entire lap to a missed gate/collision');
    }
    for(const speed of [4,18,40])for(const sign of [-1,1]){
        const e=new RacingEngine(new RacingTrack('grand'),{mode:'time'}),c=e.player,p=e.track.sample(.02);
        Object.assign(c,{x:p.x,z:p.z,y:p.y,heading:p.heading,vx:p.tx*speed,vz:p.tz*speed});
        for(let i=0;i<25;i++)e.drive(c,{steer:sign,throttle:0,brake:0},FIXED_STEP);
        const delta=Math.atan2(Math.sin(c.heading-p.heading),Math.cos(c.heading-p.heading));
        assert.ok(delta*sign<0,'Driver right must rotate negative yaw');
        assert.ok(Math.abs(c.steering)<=steeringLimit(Math.abs(c.speed),c.spec.handling)+.01);
        const previous=Math.abs(c.steering);e.drive(c,{steer:0,throttle:0,brake:0},FIXED_STEP);assert.ok(Math.abs(c.steering)<previous);
    }
    for(const cfg of TRACKS){
        const e=new RacingEngine(new RacingTrack(cfg.id),{mode:'time'}),c=e.player,p=e.track.sample(.02,e.track.halfWidth+2);
        Object.assign(c,{x:p.x,z:p.z,y:p.y,heading:p.heading,vx:p.tx*30,vz:p.tz*30});e.drive(c,{steer:0,throttle:1,brake:0},FIXED_STEP);
        assert.equal(c.surface,cfg.shoulder);assert.ok(c.speed<30);
        e.state='racing';c.nextCheckpoint=4;c.gatesPassed=4;e.recover();assert.equal(c.gatesPassed,4);assert.equal(c.nextCheckpoint,4);
    }
    for(const spec of CAR_TYPES){
        const v=createCarVisual(spec);assert.equal(v.wheelPivots.length,4);assert.deepEqual(v.wheelPivots.map(w=>w.name),['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']);
        const e=new RacingEngine(undefined,{mode:'time',car:spec.id}),c=e.player,p=e.track.sample(.02);
        Object.assign(c,{x:p.x,z:p.z,y:p.y,heading:p.heading,vx:p.tx*18,vz:p.tz*18});
        const h=c.heading;e.drive(c,{throttle:1,steer:1,brake:0},FIXED_STEP);assert.ok(Math.abs(c.heading-h)<.05);
        assert.ok(c.speed>18);assert.ok(c.wheelAngle>0);
        const slip=Math.abs(-Math.cos(c.heading)*c.vx+Math.sin(c.heading)*c.vz);assert.ok(slip>0&&slip<2);
        e.drive(c,{throttle:0,steer:0,brake:0},FIXED_STEP);assert.ok(c.speed<19);
        for(let i=0;i<120;i++)e.drive(c,{throttle:0,steer:0,brake:1},FIXED_STEP);assert.ok(c.speed< -2);
    }
    {
        const e=new RacingEngine(),c=e.player,t=e.track;
        const cross=(index,sign=1,lane=0)=>{
            const g=t.gates[index],previous={x:g.x-sign*g.tx*2+lane*g.rx,z:g.z-sign*g.tz*2+lane*g.rz};
            c.x=g.x+sign*g.tx*2+lane*g.rx;c.z=g.z+sign*g.tz*2+lane*g.rz;e.time++;e.checkGate(c,previous);
        };
        cross(0,-1);cross(0,1,t.wallOffset+2);assert.equal(c.gatesPassed,0);cross(0);cross(8);cross(0);assert.equal(c.gatesPassed,1);
        for(let lap=0;lap<3;lap++){for(let i=1;i<t.checkpointCount;i++)cross(i);cross(0);}
        assert.equal(c.completedLaps,3);assert.equal(c.gatesPassed,61);assert.ok(c.finishTime>0);
        const p=t.sample(.02,t.wallOffset-1.1);Object.assign(c,{x:p.x,z:p.z,y:p.y,heading:p.heading-Math.PI/2,vx:p.rx*45,vz:p.rz*45});
        for(let i=0;i<15;i++)e.drive(c,{throttle:1,steer:0,brake:0},FIXED_STEP);
        assert.ok(c.collisions>0);assert.ok(Math.abs(t.nearest(c.x,c.z).lateral)<t.wallOffset+.2);
        const a=e.cars[1],b=e.cars[2],onRoad=t.sample(.02);e.cars=[a,b];
        Object.assign(a,{x:onRoad.x,z:onRoad.z,y:onRoad.y,heading:onRoad.heading,vx:onRoad.tx*10,vz:onRoad.tz*10});
        Object.assign(b,{x:onRoad.x+onRoad.tx*3.2,z:onRoad.z+onRoad.tz*3.2,y:onRoad.y,heading:onRoad.heading,vx:0,vz:0});
        e.collideCars();assert.ok(a.vx*onRoad.tx+a.vz*onRoad.tz<10);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=4);
    }
    {
        let value='{broken';const fake={getItem:()=>value,setItem:(_,v)=>value=v};
        let prefs=loadPreferences(fake);assert.equal(prefs.car,'street');value=JSON.stringify({car:'invalid',quality:'ultra',records:{grand:{lap:-1,trialLap:'fake'}}});
        prefs=loadPreferences(fake);assert.equal(prefs.quality,'auto');assert.equal(prefs.records.grand.lap,null);
        updateRecords(prefs,'grand','time',30,95);updateRecords(prefs,'grand','time',35,100);assert.equal(prefs.records.grand.trialTotal,95);assert.equal(prefs.records.grand.trialLap,30);
        assert.ok(savePreferences(fake,prefs));assert.equal(loadPreferences(fake).records.grand.trialTotal,95);
        assert.equal(savePreferences({setItem:()=>{throw Error('quota');}},prefs),false);
    }
    {
        const e=new RacingEngine(undefined,{difficulty:'hard'}),leader=e.player,bot=e.cars[1];e.cars=[leader,bot];e.state='racing';
        for(const [car,u]of [[leader,.06],[bot,.047]]){const p=e.track.racingSample(u);Object.assign(car,{x:p.x,z:p.z,y:p.y,heading:p.heading,gatesPassed:1,nextCheckpoint:1});e.updateProgress(car);}
        const start=leader.progress;
        for(let i=0;i<60*25&&bot.progress<start+30;i++)e.step(FIXED_STEP);
        assert.ok(bot.progress>start+30,'AI must pass a stationary opponent rather than remain in a train');assert.equal(bot.recoveries,0);assert.ok(bot.passesAttempted>0);
        bot.stuckTime=2.6;bot.reverseCooldown=0;e.time+=5;assert.equal(e.botInput(bot).brake,1);bot.stuckTime=0;e.time+=.3;assert.equal(e.botInput(bot).brake,1,'Reverse manoeuvre must last after movement resumes');
    }
    assert.equal(new RacingEngine(undefined,{mode:'time'}).cars.length,1);
    assert.equal(CAR_TYPES.length,6);assert.equal(new Set(CAR_TYPES.map(c=>c.speed)).size,6);
    const e=new RacingEngine();e.start();const initial=e.player.x;e.step(FIXED_STEP,{throttle:1,steer:1,brake:0});assert.equal(e.player.x,initial);e.pause();const t=e.countdown;e.step(FIXED_STEP);assert.equal(e.countdown,t);e.resume();
    console.log('PASS: 15 complete AI races; steering 6 directions/speeds; surfaces; recovery; countdown; pause; six specs/models; drift/brakes/reverse; anti-shortcut; walls/car collision; storage corruption/quota/records; time trial');
})().catch(error=>{console.error(error);process.exitCode=1;});
