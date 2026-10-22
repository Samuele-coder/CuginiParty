// Lazy load inside the DO handler: Three's geometry helpers create UUIDs at
// initialization; Workers deliberately disallow global-scope randomness.
import {enforceRacingPolicy,RacingPolicyError} from './admin-policy.mjs';
const PROTOCOL=1,FIXED_STEP=1/60;

const json=(data,status=200,headers={})=>Response.json(data,{status,headers});
const allowed=(request,env)=>String(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(request.headers.get('Origin'));
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const codePattern=/^[A-HJ-NP-Z2-9]{8}$/;
const messageIsJoin=raw=>{try{return JSON.parse(raw)?.type==='join';}catch{return false;}};
export default {
    async fetch(request,env){
        const origin=request.headers.get('Origin');
        if(!allowed(request,env))return json({error:'Origine non autorizzata.'},403);
        const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store','Access-Control-Allow-Methods':'POST,GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
        if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
        const url=new URL(request.url),create=request.method==='POST'&&url.pathname==='/rooms',match=url.pathname.match(/^\/rooms\/([A-HJ-NP-Z2-9]{8})\/socket$/);
        if(!create&&!(request.method==='GET'&&match&&request.headers.get('Upgrade')?.toLowerCase()==='websocket'))return json({error:'Percorso non disponibile.'},404,cors);
        if(create&&+(request.headers.get('Content-Length')||0)>1024)return json({error:'Richiesta troppo grande.'},413,cors);
        const ip=await digest(request.headers.get('CF-Connecting-IP')||'local-development');
        const gate=env.RACING_LIMITS.get(env.RACING_LIMITS.idFromName(ip));
        const limit=await gate.fetch(new Request('https://internal/'+(create?'create':'connect')));
        if(!limit.ok)return json({error:'Troppe richieste. Riprova fra qualche minuto.'},429,{...cors,'Retry-After':'60'});
        try{await enforceRacingPolicy(env,create?'create':'play');}catch(error){return json({error:error.message},error.status||503,cors);}
        if(create){
            const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(8));
            const code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
            const stub=env.RACING_ROOMS.get(env.RACING_ROOMS.idFromName(code));
            const response=await stub.fetch(new Request('https://internal/initialize?code='+code,{method:'POST'}));
            const data=await response.json();return json(data,response.status,cors);
        }
        return env.RACING_ROOMS.get(env.RACING_ROOMS.idFromName(match[1])).fetch(request);
    }
};

// Separate bounded per-IP buckets; no raw IP address is stored.
export class RacingRateGate {
    constructor(ctx){this.ctx=ctx;}
    async fetch(request){
        const create=new URL(request.url).pathname==='/create',duration=create?3600000:60000,key=create?'create':'connect',max=create?10:60,now=Date.now();
        const ok=await this.ctx.storage.transaction(async storage=>{
            let bucket=await storage.get(key);if(!bucket||now-bucket.start>=duration)bucket={start:now,count:0};
            if(bucket.count>=max)return false;bucket.count++;await storage.put(key,bucket);return true;
        });
        await this.ctx.storage.setAlarm(now+86400000);return new Response(null,{status:ok?204:429});
    }
    async alarm(){await this.ctx.storage.deleteAll();}
}

export class RacingRoom {
    constructor(ctx,env){
        this.ctx=ctx;this.env=env;this.core=null;this.timer=null;this.inbox=Promise.resolve();this.lastPersist=0;this.accumulator=0;
        ctx.blockConcurrencyWhile(async()=>{
            this.RoomCore=(await import('./room.mjs')).RacingRoomCore;
            const saved=await ctx.storage.get('room');if(saved){this.core=this.RoomCore.restore(saved);const active=new Set(ctx.getWebSockets().map(ws=>ws.deserializeAttachment()?.playerId));
                this.core.players.forEach(p=>{if(!active.has(p.id)&&p.connected)this.core.disconnect(p.id);});this.ensureTick();}
        });
    }
    async fetch(request){
        const url=new URL(request.url);
        if(url.pathname==='/initialize'&&request.method==='POST'){
            try{await enforceRacingPolicy(this.env,'create');}catch(error){return json({error:error.message},error.status||503);}
            const code=url.searchParams.get('code');if(this.core||!codePattern.test(code||''))return json({error:'Codice non disponibile.'},409);
            this.core=new this.RoomCore(code);const hostTicket=await this.core.initialize();await this.persist();return json({v:PROTOCOL,code,hostTicket});
        }
        if(!this.core||Date.now()>=this.core.expiresAt)return json({error:'Stanza non trovata o scaduta.'},404);
        try{await enforceRacingPolicy(this.env);}catch(error){return json({error:error.message},error.status||503);}
        if(this.ctx.getWebSockets().length>=12)return json({error:'Troppe connessioni.'},429);
        const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);
        server.serializeAttachment({playerId:null,count:0,window:Date.now()});
        setTimeout(()=>{try{if(!server.deserializeAttachment()?.playerId)server.close(1008,'Accesso richiesto.');}catch{/* already closed */}},5000);
        return new Response(null,{status:101,webSocket:client});
    }
    webSocketMessage(ws,raw){
        // Measure arrival rate before asynchronous policy reads queue messages.
        const a=ws.deserializeAttachment(),now=Date.now();
        if(typeof raw!=='string'||new TextEncoder().encode(raw).length>1024){ws.close(1009,'Messaggio troppo grande.');return;}
        if(now-a.window>=1000){a.count=0;a.window=now;}if(++a.count>40){ws.close(1008,'Troppi messaggi.');return;}ws.serializeAttachment(a);
        this.inbox=this.inbox.then(()=>this.message(ws,raw)).catch(()=>{try{ws.close(1011,'Errore di sessione.');}catch{/* closed */}});return this.inbox;
    }
    async message(ws,raw){
        if(ws.readyState!==1)return;
        const a=ws.deserializeAttachment();
        try{
            const message=JSON.parse(raw);if(!message||message.v!==PROTOCOL)throw Error('Versione del protocollo non valida.');
            if(!a.playerId){
                if(message.type!=='join')throw Error('Accedi prima alla stanza.');
                await enforceRacingPolicy(this.env);
                const {player,token}=await this.core.join(message);
                for(const other of this.ctx.getWebSockets())if(other!==ws&&other.deserializeAttachment()?.playerId===player.id){other.serializeAttachment({...other.deserializeAttachment(),playerId:null});other.close(1000,'Sessione ripresa su una nuova connessione.');}
                ws.serializeAttachment({...ws.deserializeAttachment(),playerId:player.id});ws.send(JSON.stringify({type:'welcome',v:PROTOCOL,playerId:player.id,token}));
                await this.persist();this.broadcast();this.ensureTick();return;
            }
            if(!['leave','ping'].includes(message.type))await enforceRacingPolicy(this.env,message.type==='start'?'start':'play');
            const action=this.core.command(a.playerId,message);
            if(action==='pong')ws.send(JSON.stringify({type:'pong',v:PROTOCOL,at:message.at,serverNow:now}));
            if(action!=='none'&&action!=='pong'){await this.persist();this.broadcast();this.ensureTick();}
            if(message.type==='leave'){ws.serializeAttachment({...a,playerId:null});ws.close(1000,'Uscita dalla stanza.');}
        }catch(error){ws.send(JSON.stringify({type:'error',v:PROTOCOL,message:error.message||'Operazione non valida.'}));if(error instanceof RacingPolicyError){if(error.status===503)ws.close(1013,'Verifica Admin non disponibile. Riprova.');else if(messageIsJoin(raw))ws.close(1008,error.message.slice(0,100));}}
    }
    async webSocketClose(ws){
        try{ws.close(1000,'Connessione terminata.');}catch{/* already closed */}
        const id=ws.deserializeAttachment()?.playerId;if(id&&this.core){this.core.disconnect(id);await this.persist();this.broadcast();this.ensureTick();}
    }
    webSocketError(ws){return this.webSocketClose(ws);}
    broadcast(){
        if(!this.core)return;const message=JSON.stringify({type:'state',...this.core.snapshot()});
        for(const ws of this.ctx.getWebSockets())if(ws.deserializeAttachment()?.playerId){try{ws.send(message);}catch{/* close event handles grace */}}
    }
    async persist(){
        if(!this.core)return;await this.ctx.storage.put('room',this.core.serialize());this.lastPersist=Date.now();
        const deadlines=this.core.players.filter(p=>!p.connected&&p.disconnectedAt!==null&&!p.dnf).map(p=>p.disconnectedAt+20001);
        await this.ctx.storage.setAlarm(Math.min(this.core.expiresAt,...deadlines.filter(d=>d>Date.now()),Date.now()+1200000));
    }
    ensureTick(){
        if(!this.core||!['countdown','racing'].includes(this.core.phase)||this.timer)return;
        this.lastTick=Date.now();this.accumulator=0;
        this.timer=setInterval(()=>{if(this.ticking)return;this.ticking=true;this.ctx.waitUntil((async()=>{
            try{await enforceRacingPolicy(this.env);}catch(error){
                clearInterval(this.timer);this.timer=null;
                if(['countdown','racing'].includes(this.core.phase)){this.core.engine.cars.forEach(car=>{if(car.finishTime===null)car.dnf=true;});this.core.finish('Gara interrotta: '+error.message);this.broadcast();await this.persist();}
                return;
            }
            if(!['countdown','racing'].includes(this.core.phase)){clearInterval(this.timer);this.timer=null;return;}
            const now=Date.now();this.accumulator+=Math.min(.25,(now-this.lastTick)/1000);this.lastTick=now;
            while(this.accumulator>=FIXED_STEP){this.core.step();this.accumulator-=FIXED_STEP;}
            this.broadcast();
            if(now-this.lastPersist>=5000)this.ctx.waitUntil(this.persist());
            if(this.core.phase==='finished'){clearInterval(this.timer);this.timer=null;this.ctx.waitUntil(this.persist());}
        })().finally(()=>{this.ticking=false;}));},50);
    }
    async alarm(){
        if(!this.core)return;this.core.sweep();
        if(Date.now()>=this.core.expiresAt||!this.ctx.getWebSockets().length&&this.core.players.every(p=>!p.connected)){
            clearInterval(this.timer);this.timer=null;for(const ws of this.ctx.getWebSockets())ws.close(1000,'Stanza scaduta.');await this.ctx.storage.deleteAll();this.core=null;return;
        }
        this.broadcast();this.ensureTick();await this.persist();
    }
}
