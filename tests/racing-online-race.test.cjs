'use strict';
// Two automated remote drivers send ordinary pedal/steering inputs over real
// WebSockets. No client position/lap packets and no server test shortcuts.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),WS=require('ws'),{startCoordinator}=require('./racing-online-runtime.cjs');
(async()=>{
    const {RacingEngine}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-engine.js'))),{RacingTrack}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-track.js')));
    const origin='http://localhost:8080',service=await startCoordinator(origin);const sockets=[];
    const wait=async(predicate,timeout=10000)=>{const deadline=Date.now()+timeout;while(!predicate()){if(Date.now()>deadline)throw Error('Wait timed out');await new Promise(r=>setTimeout(r,50));}};
    try{
        const created=await (await fetch(service.url+'/rooms',{method:'POST',headers:{Origin:origin}})).json();
        async function peer(name,hostTicket){const ws=new WS(service.url.replace('http','ws')+'/rooms/'+created.code+'/socket',{headers:{Origin:origin}}),p={ws,messages:[],state:null,id:null,seq:0};sockets.push(ws);ws.on('message',raw=>{const m=JSON.parse(raw);p.messages.push(m);if(m.type==='state')p.state=m;if(m.type==='welcome')p.id=m.playerId;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});p.send=m=>ws.send(JSON.stringify({v:1,...m}));p.send({type:'join',nickname:name,hostTicket});await wait(()=>p.id&&p.state);return p;}
        const host=await peer('Driver PC',created.hostTicket),friend=await peer('Driver phone');
        friend.send({type:'config',config:{track:'grand',laps:1,bots:1,difficulty:'normal'}});await wait(()=>friend.messages.some(m=>m.type==='error'));assert.match(friend.messages.find(m=>m.type==='error').message,/host/);
        host.send({type:'config',config:{track:'grand',laps:1,bots:1,difficulty:'normal'}});await wait(()=>friend.state.config.laps===1&&friend.state.config.bots===1);
        host.send({type:'ready',ready:true});friend.send({type:'ready',ready:true});await wait(()=>host.state.players.every(p=>p.ready));host.send({type:'start'});await wait(()=>host.state.frame&&friend.state.frame);
        const advisor=new RacingEngine(new RacingTrack('grand'),{difficulty:'normal'});advisor.cars.length=3;
        const timer=setInterval(()=>{
            const state=host.state;if(!state?.frame||state.phase==='finished')return;advisor.time=state.frame.time;
            for(const snapshot of state.frame.cars){const car=advisor.cars.find(c=>c.id===snapshot.id);Object.assign(car,snapshot);}
            for(const p of [host,friend]){const car=advisor.cars.find(c=>c.playerId===p.id);p.send({type:'input',round:state.round,seq:p.seq++,input:advisor.botInput(car)});}
        },50);
        try{await wait(()=>host.state.phase==='finished'&&friend.state.phase==='finished',140000);}finally{clearInterval(timer);}
        assert.deepEqual(host.state.results,friend.state.results);assert.equal(host.state.results.length,3);assert.ok(host.state.results.every(r=>!r.dnf&&r.time>10));assert.ok(host.state.frame.cars.every(c=>c.completedLaps===1&&c.gatesPassed===21));
        console.log('PASS LOCAL workerd: real-time full lap via two WebSocket input drivers + one server bot; 21 ordered gates each; identical final results. '+JSON.stringify(host.state.results.map(r=>({name:r.name,time:r.time}))));
        console.log('Public hosting, real WAN latency and physical phones: NOT TESTED.');
    }finally{for(const ws of sockets)ws.close();await service.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
