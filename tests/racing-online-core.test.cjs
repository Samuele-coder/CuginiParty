'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
    const {RacingRoomCore,GRACE_MS}=await import(pathToFileURL(path.resolve(__dirname,'../server/racing/room.mjs')));
    let now=100000;const clock=()=>now,room=new RacingRoomCore('ABCD2345',clock),hostTicket=await room.initialize();
    const host=await room.join({nickname:'PC',hostTicket}),friend=await room.join({nickname:'Telefono',car:'rally'});
    const command=(who,type,extra={})=>room.command(who.player.id,{v:1,type,...extra});
    assert.throws(()=>command(friend,'config',{config:{track:'grand',laps:1,bots:1,difficulty:'normal'}}),/host/);
    assert.throws(()=>command(host,'config',{config:{track:'grand',laps:1,bots:1,difficulty:'toString'}}),/valida/);
    command(host,'config',{config:{track:'grand',laps:1,bots:1,difficulty:'normal'}});
    assert.throws(()=>command(host,'start'),/pronti/);command(host,'ready',{ready:true});command(friend,'ready',{ready:true});command(host,'start');
    assert.equal(room.engine.cars.length,3);assert.equal(room.engine.cars.filter(c=>c.playerId).length,2);assert.equal(room.engine.totalLaps,1);
    assert.throws(()=>command(friend,'position',{x:1,z:100000,completedLaps:999}),/supportato/);
    assert.throws(()=>command(friend,'input',{round:room.round,seq:0,input:{steer:0,throttle:2,brake:0}}),/validi/);
    assert.throws(()=>command(friend,'input',{round:room.round,seq:0,input:{steer:0,throttle:1,brake:0,x:999}}),/validi/);
    command(friend,'input',{round:room.round,seq:10,input:{steer:0,throttle:1,brake:0}});command(friend,'input',{round:room.round,seq:9,input:{steer:0,throttle:0,brake:0}});assert.equal(room.inputs.get(friend.player.id).throttle,1);
    const publicJSON=JSON.stringify(room.snapshot());assert.ok(!publicJSON.includes(host.token)&&!publicJSON.includes('tokenHash')&&!publicJSON.includes(hostTicket));
    // Test driver emits only legitimate steering/pedals. The room engine alone
    // moves cars and validates the complete ordered checkpoint/lap sequence.
    let seq=11;for(let step=0;step<60*200&&room.phase!=='finished';step++){
        for(const participant of [host,friend]){const car=room.engine.cars.find(c=>c.playerId===participant.player.id);command(participant,'input',{round:room.round,seq:seq++,input:room.engine.botInput(car)});}
        now+=1000/60;room.step();
    }
    assert.equal(room.phase,'finished');assert.equal(room.results.length,3);assert.ok(room.results.every(r=>!r.dnf&&r.time>0));assert.ok(room.engine.cars.every(c=>c.completedLaps===1&&c.gatesPassed===21));
    const restored=RacingRoomCore.restore(structuredClone(room.serialize()),clock);assert.deepEqual(restored.results,room.results);assert.equal(restored.history.length,1);
    command(host,'lobby');command(host,'config',{config:{track:'city',laps:2,bots:0,difficulty:'easy'}});command(host,'ready',{ready:true});command(friend,'ready',{ready:true});command(host,'start');assert.equal(room.engine.cars.length,2);
    const checkpoint=RacingRoomCore.restore(structuredClone(room.serialize()),clock);assert.equal(checkpoint.engine.totalLaps,2);assert.deepEqual(checkpoint.engine.cars.map(c=>[c.x,c.z]),room.engine.cars.map(c=>[c.x,c.z]));checkpoint.step();assert.equal(checkpoint.phase,'countdown');
    room.disconnect(host.player.id);room.disconnect(friend.player.id);assert.equal(room.phase,'countdown','All connections retain their 20 second grace');await room.join({resumeToken:friend.token});now+=1000;const resumed=await room.join({resumeToken:host.token});assert.equal(resumed.player.id,host.player.id);assert.equal(room.hostId,host.player.id);
    command(host,'input',{round:room.round,seq:0,input:{steer:0,throttle:1,brake:0}});assert.equal(room.inputs.get(host.player.id).throttle,1,'A resumed connection accepts sequence zero');
    room.disconnect(host.player.id);now+=GRACE_MS+1;room.sweep();assert.equal(room.hostId,friend.player.id);assert.equal(room.players[0].dnf,true);await assert.rejects(()=>room.join({resumeToken:host.token}),/abbandonato/);
    command(friend,'abort');assert.equal(room.phase,'finished');command(friend,'lobby');assert.equal(room.players.length,1);assert.equal(room.hostId,friend.player.id);
    await assert.rejects(()=>room.join({nickname:'x'}),/Nickname/);await assert.rejects(()=>room.join({resumeToken:'forged'}),/Sessione/);
    const full=new RacingRoomCore('WXYZ2345',clock),ticket=await full.initialize();for(let i=0;i<6;i++)await full.join({nickname:'Pilota '+i,...(i===0?{hostTicket:ticket}:{})});await assert.rejects(()=>full.join({nickname:'Settimo'}),/piena/);assert.throws(()=>full.command(full.hostId,{v:1,type:'config',config:{track:'grand',laps:1,bots:1,difficulty:'normal'}}),/sei auto/);full.players.forEach(p=>full.command(p.id,{v:1,type:'ready',ready:true}));full.command(full.hostId,{v:1,type:'start'});full.step();assert.equal(full.snapshot().frame.cars.length,6);
    const pending=new RacingRoomCore('CDEF3456',clock),pendingTicket=await pending.initialize(),early=await pending.join({nickname:'Amico anticipato'});pending.disconnect(early.player.id);await pending.join({resumeToken:early.token});assert.equal(pending.hostId,null,'A guest cannot steal the unclaimed creator slot');const owner=await pending.join({nickname:'Creatore',hostTicket:pendingTicket});pending.disconnect(owner.player.id);now+=15000;pending.disconnect(early.player.id);now+=6000;pending.sweep();assert.equal(pending.hostId,null);await pending.join({resumeToken:early.token});assert.equal(pending.hostId,early.player.id,'A still-valid returning guest inherits a departed host');
    console.log('PASS authoritative race: two human input streams + one shared bot, ordered checkpoints, finish/results, persistence, friends-only, permissions, replay/injection checks, resume/grace/host handoff, rematch. LOCAL CORE ONLY.');
})().catch(e=>{console.error(e);process.exitCode=1;});
