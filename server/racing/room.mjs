import {RacingEngine,FIXED_STEP} from '../../js/racing-3d-engine.js';
import {RacingTrack} from '../../js/racing-3d-track.js';
import {CAR_TYPES,TRACKS,DIFFICULTIES} from '../../js/racing-3d-data.js';

export const PROTOCOL=1,MAX_PLAYERS=6,GRACE_MS=20000;
const neutral=()=>({throttle:0,brake:0,steer:0});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const reject=message=>{throw Error(message);};
const nickname=value=>{if(typeof value!=='string')reject('Inserisci un nickname.');const name=value.normalize('NFC').replace(/[\p{C}<>]/gu,'').trim();if(name.length<2||name.length>24)reject('Nickname: da 2 a 24 caratteri.');return name;};
const knownCar=id=>CAR_TYPES.find(car=>car.id===id)||reject('Auto non valida.');
export class RacingRoomCore{
    constructor(code,clock=()=>Date.now()){
        this.clock=clock;this.code=code;this.players=[];this.hostId=null;this.hostHash=null;this.hostClaimed=false;this.createdAt=clock();this.expiresAt=clock()+2*3600000;
        this.config={track:'grand',laps:3,bots:0,difficulty:'normal'};this.phase='lobby';this.round=0;this.revision=0;this.engine=null;this.startedAt=null;this.results=[];this.history=[];this.inputs=new Map();this.inputAt=new Map();this.sequences=new Map();this.trackCache=new Map();
    }
    async initialize(){if(this.hostHash)reject('Stanza già esistente.');const ticket=token();this.hostHash=await hash(ticket);return ticket;}
    publicState(){return {v:PROTOCOL,code:this.code,hostId:this.hostId,phase:this.phase,round:this.round,revision:this.revision,config:{...this.config},players:this.players.map(({id,name,car,ready,connected,dnf})=>({id,name,car,ready,connected,dnf:Boolean(dnf)})),results:this.results,serverNow:this.clock(),expiresAt:this.expiresAt};}
    async join(message){
        if(this.clock()>this.expiresAt)reject('Stanza scaduta.');
        if(typeof message.resumeToken==='string'&&message.resumeToken.length<=100){const digest=await hash(message.resumeToken),player=this.players.find(p=>p.tokenHash===digest);if(!player)reject('Sessione non valida.');if(player.dnf&&this.phase!=='lobby')reject('La sessione ha abbandonato questa gara.');player.connected=true;player.disconnectedAt=null;if(!this.hostId&&this.hostClaimed)this.hostId=player.id;this.sequences.delete(player.id);this.inputs.delete(player.id);this.inputAt.delete(player.id);return {player,token:message.resumeToken};}
        if(this.phase!=='lobby')reject('Gara già iniziata.');
        const host=typeof message.hostTicket==='string'&&message.hostTicket.length<=100&&await hash(message.hostTicket)===this.hostHash;
        if(host&&this.hostId)reject('Host già connesso: usa la sessione originale.');
        if(this.players.length>=MAX_PLAYERS-(this.hostId||host||this.hostClaimed?0:1))reject('Stanza piena.');
        const session=token(),player={id:crypto.randomUUID(),name:nickname(message.nickname),car:knownCar(message.car||'street').id,ready:false,connected:true,tokenHash:await hash(session),disconnectedAt:null,dnf:false};
        this.players.push(player);if(host){this.hostId=player.id;this.hostClaimed=true;}else if(!this.hostId&&this.hostClaimed)this.hostId=player.id;this.config.bots=Math.min(this.config.bots,MAX_PLAYERS-this.players.length);this.players.forEach(p=>p.ready=false);this.revision++;return {player,token:session};
    }
    authorize(id){return this.players.find(p=>p.id===id&&p.connected)||reject('Sessione non connessa.');}
    requireHost(id){if(this.hostId!==id)reject('Solo l’host può farlo.');}
    command(id,message){
        const player=this.authorize(id);if(!message||message.v!==PROTOCOL||typeof message.type!=='string')reject('Protocollo non valido.');
        switch(message.type){
        case 'config':{
            this.requireHost(id);if(this.phase!=='lobby')reject('Impostazioni bloccate durante la gara.');
            const c=message.config;if(!c||Object.keys(c).some(k=>!['track','laps','bots','difficulty'].includes(k))||!TRACKS.some(t=>t.id===c.track)||!Number.isInteger(c.laps)||c.laps<1||c.laps>9||!Number.isInteger(c.bots)||c.bots<0||c.bots>5||!Object.hasOwn(DIFFICULTIES,c.difficulty))reject('Configurazione non valida.');
            if(c.bots+this.players.length>MAX_PLAYERS)reject('Al massimo sei auto fra amici e bot.');this.config={...c};this.players.forEach(p=>p.ready=false);this.revision++;return 'lobby';}
        case 'car':if(this.phase!=='lobby')reject('Auto bloccata durante la gara.');player.car=knownCar(message.car).id;player.ready=false;this.revision++;return 'lobby';
        case 'ready':if(this.phase!=='lobby'||typeof message.ready!=='boolean')reject('Stato pronto non valido.');player.ready=message.ready;return 'lobby';
        case 'start':this.requireHost(id);this.start();return 'race';
        case 'input':{
            if(!['countdown','racing'].includes(this.phase)||message.round!==this.round||player.dnf)return 'none';
            if(!Number.isSafeInteger(message.seq)||message.seq<0||message.seq<=(this.sequences.get(id)??-1))return 'none';
            const input=message.input;if(!input||Object.keys(input).some(k=>!['steer','throttle','brake'].includes(k))||!['steer','throttle','brake'].every(k=>Number.isFinite(input[k]))||Math.abs(input.steer)>1||input.throttle<0||input.throttle>1||input.brake<0||input.brake>1)reject('Comandi di guida non validi.');
            this.inputs.set(id,{...input});this.inputAt.set(id,this.clock());this.sequences.set(id,message.seq);return 'none';}
        case 'recover':{const car=this.engine?.cars.find(c=>c.playerId===id);if(this.phase==='racing'&&message.round===this.round&&car&&!player.dnf){this.engine.state='racing';this.engine.recover(car);}return 'none';}
        case 'lobby':this.requireHost(id);if(this.phase!=='finished'&&this.phase!=='lobby')reject('La gara è ancora in corso.');this.phase='lobby';this.engine=null;this.players=this.players.filter(p=>p.connected);this.players.forEach(p=>{p.ready=false;p.dnf=false;});this.revision++;return 'lobby';
        case 'abort':this.requireHost(id);if(['countdown','racing'].includes(this.phase)){this.engine.cars.forEach(c=>{if(c.finishTime===null)c.dnf=true;});this.finish('Gara interrotta dall’host.');}return 'race';
        case 'leave':this.disconnect(id,true);return 'lobby';
        case 'ping':return 'pong';
        default:reject('Messaggio non supportato.');
        }
    }
    start(){
        if(this.phase!=='lobby')reject('La gara è già iniziata.');
        if(!this.players.every(p=>p.connected&&p.ready)||!this.players.length)reject('Tutti i partecipanti devono essere connessi e pronti.');
        const count=this.players.length+this.config.bots;if(count<2||count>MAX_PLAYERS)reject('Servono da due a sei auto.');
        let track=this.trackCache.get(this.config.track);if(!track){track=new RacingTrack(this.config.track);this.trackCache.set(this.config.track,track);}
        this.engine=new RacingEngine(track,{mode:'race',difficulty:this.config.difficulty,laps:this.config.laps});
        this.engine.cars.length=count;
        this.engine.cars.forEach((car,i)=>{
            const p=this.players[i];if(p){car.name=p.name;car.playerId=p.id;car.spec=knownCar(p.car);car.color=car.spec.color;car.personality=null;}else{car.name='BOT '+(i-this.players.length+1);car.playerId=null;}
        });
        this.engine.start();this.engine.cars.forEach((car,i)=>{const position=track.sample(-(7+Math.floor(i/2)*6)/track.length,i%2?2:-2);Object.assign(car,{x:position.x,y:position.y,z:position.z,heading:position.heading});this.engine.updateProgress(car);});
        this.phase='countdown';this.reason='';this.startedAt=this.clock();this.round++;this.inputs.clear();this.inputAt.clear();this.sequences.clear();this.results=[];
    }
    disconnect(id,leave=false){
        const player=this.players.find(p=>p.id===id);if(!player)return;player.connected=false;player.disconnectedAt=this.clock()-(leave?GRACE_MS:0);player.ready=false;this.inputs.delete(id);
        if(this.phase==='lobby'&&leave){this.players=this.players.filter(p=>p.id!==id);if(id===this.hostId)this.hostId=this.players.find(p=>p.connected)?.id||null;this.revision++;}this.sweep();
    }
    sweep(){
        const now=this.clock();for(const p of this.players){if(p.connected||p.disconnectedAt===null||now-p.disconnectedAt<GRACE_MS)continue;
            if(this.phase==='lobby'){this.players=this.players.filter(other=>other!==p);if(p.id===this.hostId)this.hostId=this.players.find(other=>other.connected)?.id||null;}
            else {p.dnf=true;const car=this.engine?.cars.find(c=>c.playerId===p.id);if(car&&car.finishTime===null){car.dnf=true;car.finishTime=1e9;}if(p.id===this.hostId)this.hostId=this.players.find(other=>other.connected&&!other.dnf)?.id||null;}
        }
        if(this.engine&&['countdown','racing'].includes(this.phase)&&(!this.players.some(p=>!p.dnf)||this.engine.cars.every(c=>c.dnf||c.finishTime!==null)||now-this.startedAt>180000+this.config.laps*120000))this.finish('Gara conclusa.');
    }
    step(){
        if(!this.engine||!['countdown','racing'].includes(this.phase))return;
        const inputs=new Map(this.players.filter(p=>!p.dnf).map(p=>{const car=this.engine.cars.find(c=>c.playerId===p.id);return [car.id,p.connected&&this.clock()-(this.inputAt.get(p.id)||0)<500?this.inputs.get(p.id)||neutral():neutral()];}));
        this.engine.step(FIXED_STEP,neutral(),inputs);this.phase=this.engine.state==='countdown'?'countdown':'racing';this.sweep();
    }
    finish(reason){
        if(this.phase==='finished')return;this.phase='finished';this.reason=reason;
        this.results=this.engine.standings().sort((a,b)=>Number(Boolean(a.dnf||a.finishTime===null))-Number(Boolean(b.dnf||b.finishTime===null))).map((car,index)=>({position:index+1,id:car.playerId||'bot-'+car.id,name:car.name,bot:!car.playerId,dnf:Boolean(car.dnf||car.finishTime===null),time:car.dnf||car.finishTime===null?null:car.finishTime,bestLap:car.bestLap}));
        this.history=[...this.history,{round:this.round,config:this.config,results:this.results,finishedAt:this.clock()}].slice(-10);
    }
    snapshot(){
        return {...this.publicState(),reason:this.reason||'',frame:this.engine?{state:this.phase,time:this.engine.time,countdown:this.engine.countdown,goTimer:this.engine.goTimer,cars:this.engine.cars.map(c=>({id:c.id,playerId:c.playerId||null,name:c.name,car:c.spec.id,color:c.color,x:c.x,y:c.y,z:c.z,heading:c.heading,vx:c.vx,vz:c.vz,speed:c.speed,steering:c.steering,wheelAngle:c.wheelAngle,completedLaps:c.completedLaps,nextCheckpoint:c.nextCheckpoint,gatesPassed:c.gatesPassed,lastLap:c.lastLap,bestLap:c.bestLap,finishTime:c.dnf?null:c.finishTime,dnf:Boolean(c.dnf),offroad:c.offroad,surface:c.surface,progress:c.progress,collisions:c.collisions,recoveries:c.recoveries}))}:null};
    }
    serialize(){return {code:this.code,players:this.players,hostId:this.hostId,hostHash:this.hostHash,hostClaimed:this.hostClaimed,createdAt:this.createdAt,expiresAt:this.expiresAt,config:this.config,phase:this.phase,round:this.round,revision:this.revision,startedAt:this.startedAt,results:this.results,history:this.history,reason:this.reason,engine:this.engine?{time:this.engine.time,countdown:this.engine.countdown,state:this.engine.state,goTimer:this.engine.goTimer,cars:this.engine.cars}:null};}
    static restore(data,clock){
        const core=new RacingRoomCore(data.code,clock);Object.assign(core,data);core.inputs=new Map();core.inputAt=new Map();core.sequences=new Map();core.trackCache=new Map();
        if(data.engine){core.engine=new RacingEngine(new RacingTrack(data.config.track),{mode:'race',difficulty:data.config.difficulty,laps:data.config.laps});Object.assign(core.engine,data.engine);}return core;
    }
}
