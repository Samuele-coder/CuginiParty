import {RACING_SERVER_URL} from './racing-online-config.js';
import {CAR_TYPES,TRACKS,DIFFICULTIES} from './racing-3d-data.js';
import {RacingTrack} from './racing-3d-track.js';
import {createCar} from './racing-3d-engine.js';
import {RacingView} from './racing-3d-view.js';

const $=id=>document.getElementById(id),sessionKey='CuginiParty_racing_online_session_v1';
const neutral=()=>({steer:0,throttle:0,brake:0});
let socket=null,session=null,latest=null,playerId=null,seq=0,retries=0,retryTimer=null,leaving=false,paused=false,frames=[],view=null,roster='',lastPlayers='',latency=null;
const keys=new Set(),touch=new Map();
const facade={track:new RacingTrack('grand'),cars:[createCar(0,'TU',CAR_TYPES[0].color)],state:'menu',time:0,get player(){return this.cars.find(c=>c.playerId===playerId)||this.cars[0];}};
Object.assign(facade.cars[0],facade.track.sample(0));
const status=message=>{$('r3oStatus').textContent=message;};
const readSession=()=>{try{return JSON.parse(sessionStorage.getItem(sessionKey)||'null');}catch{return null;}};
const saveSession=()=>{try{if(session)sessionStorage.setItem(sessionKey,JSON.stringify(session));else sessionStorage.removeItem(sessionKey);}catch{/* session still works in memory */}};
const send=message=>{if(socket?.readyState===WebSocket.OPEN&&socket.bufferedAmount<4096){socket.send(JSON.stringify({v:1,...message}));return true;}return false;};
const active=()=>['countdown','racing'].includes(latest?.phase);
const option=(value,text)=>new Option(text,value);
const time=value=>value===null||!Number.isFinite(value)?'—':Math.floor(value/60)+':'+(value%60).toFixed(2).padStart(5,'0');
const racerName=(name,bot)=>name+(bot&&!/^BOT /i.test(name)?' · BOT':'');
for(const id of ['r3oEntryCar','r3oCar'])$(id).replaceChildren(...CAR_TYPES.map(c=>option(c.id,c.name)));
$('r3oTrack').replaceChildren(...TRACKS.map(t=>option(t.id,t.name)));
$('r3oLaps').replaceChildren(...Array.from({length:9},(_,i)=>option(i+1,String(i+1))));
$('r3oDifficulty').replaceChildren(...Object.entries(DIFFICULTIES).map(([id,d])=>option(id,d.name)));
function clearInput(){keys.clear();touch.clear();for(const button of document.querySelectorAll('[data-drive]'))button.classList.remove('is-held');}
function input(){
    if(paused||document.hidden)return neutral();
    const held=drive=>[...touch.values()].includes(drive)||({left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],throttle:['KeyW','ArrowUp'],brake:['KeyS','ArrowDown']}[drive]).some(k=>keys.has(k));
    return {steer:Number(held('right'))-Number(held('left')),throttle:Number(held('throttle')),brake:Number(held('brake'))};
}
function renderLobby(state){
    const host=state.hostId===playerId,me=state.players.find(p=>p.id===playerId),signature=JSON.stringify([state.players,state.hostId]);
    $('r3oRoomCode').textContent=state.code;$('r3oConfig').disabled=!host;$('r3oStart').hidden=!host;
    $('r3oStart').disabled=state.players.length+state.config.bots<2||!state.players.every(p=>p.connected&&p.ready);
    $('r3oReady').textContent=me?.ready?'Non sono più pronto':'Sono pronto';$('r3oReady').setAttribute('aria-pressed',String(Boolean(me?.ready)));
    if(signature!==lastPlayers){lastPlayers=signature;$('r3oPlayers').replaceChildren(...state.players.map(p=>{
        const li=document.createElement('li'),name=document.createElement('strong'),info=document.createElement('small');
        name.textContent=p.name+(p.id===playerId?' · TU':'')+(p.id===state.hostId?' · HOST':'');info.textContent=!p.connected?'Disconnesso · attesa 20 s':p.ready?'Pronto':'Non pronto';li.append(name,info);return li;
    }));}
    if(me)$('r3oCar').value=me.car;
    for(const [id,key]of [['r3oTrack','track'],['r3oLaps','laps'],['r3oBots','bots'],['r3oDifficulty','difficulty']])$(id).value=String(state.config[key]);
    for(const o of $('r3oBots').options)o.disabled=+o.value+state.players.length>6;
    status(host?'Sei l’host. Configura la gara e attendi che tutti siano pronti.':'Scegli l’auto e premi Sono pronto. Solo l’host può cambiare la gara.');
}
function receiveState(state){
    if(!state.players?.some(p=>p.id===playerId))return;
    if(latest?.round!==state.round){seq=0;frames=[];paused=false;$('r3oPause').hidden=true;}
    latest=state;$('r3oEntry').hidden=true;$('r3oLobby').hidden=state.phase!=='lobby';$('r3dMenu').hidden=state.phase!=='lobby';
    $('r3oResults').hidden=state.phase!=='finished';$('r3oHud').hidden=!active();$('r3dTouch').hidden=!active();$('r3oNetwork').hidden=!active();$('r3oRanking').hidden=!active();
    $('r3oAbort').hidden=state.hostId!==playerId;$('r3oAgain').hidden=state.hostId!==playerId;
    $('r3dApp').dataset.state=active()?state.phase:'menu';facade.state=active()?state.phase:'menu';
    if(state.phase==='lobby'){frames=[];renderLobby(state);}
    if(state.frame){
        frames.push({...state.frame,at:state.serverNow,arrival:performance.now()});frames=frames.slice(-12);
        const signature=state.config.track+':'+state.round+':'+state.frame.cars.map(c=>c.id+'/'+c.car).join(',');
        if(signature!==roster){roster=signature;facade.track=new RacingTrack(state.config.track);facade.cars=state.frame.cars.map(c=>Object.assign(createCar(c.id,c.name,c.color),c,{spec:CAR_TYPES.find(s=>s.id===c.car)}));try{view?.build();view?.resize();}catch(error){status('Grafica non disponibile: '+error.message);}}
    }
    if(state.phase==='finished'){
        clearInput();paused=false;$('r3oPause').hidden=true;$('r3oCountdown').hidden=true;
        $('r3oResultNote').textContent=state.reason+(state.hostId===playerId?' Puoi tornare alla lobby per la rivincita.':' Attendi che l’host torni alla lobby per la rivincita.');
        $('r3oStandings').replaceChildren(...state.results.map(r=>{const li=document.createElement('li'),name=document.createElement('span'),clock=document.createElement('time');name.textContent=racerName(r.name,r.bot);clock.textContent=r.dnf?'RITIRATO':time(r.time);li.classList.toggle('is-player',r.id===playerId);li.append(name,clock);return li;}));
    }
}
function connect(resume=false){
    clearTimeout(retryTimer);const current=new WebSocket(endpoint.replace(/^http/,'ws')+'/rooms/'+session.code+'/socket');socket=current;status(resume?'Riconnessione alla stanza…':'Accesso alla stanza…');
    current.addEventListener('open',()=>current.send(JSON.stringify({v:1,type:'join',nickname:session.nickname,car:session.car,...(session.token?{resumeToken:session.token}:{hostTicket:session.hostTicket})})));
    current.addEventListener('message',event=>{
        if(current!==socket)return;let message;try{message=JSON.parse(event.data);}catch{return;}
        if(message.type==='welcome'){playerId=message.playerId;session.token=message.token;delete session.hostTicket;saveSession();retries=0;}
        else if(message.type==='state')receiveState(message);
        else if(message.type==='error'){status(message.message);$('r3oNetwork').textContent=message.message;}
        else if(message.type==='pong')latency=Math.max(0,Date.now()-message.at);
    });
    current.addEventListener('error',()=>status('Servizio non raggiungibile. Controlla la connessione e la configurazione del server.'));
    current.addEventListener('close',event=>{
        if(current!==socket||leaving)return;clearInput();$('r3oNetwork').hidden=false;$('r3oNetwork').textContent='Connessione persa. Riconnessione in corso…';
        if(![1008,1009].includes(event.code)&&session?.token&&retries<6){retryTimer=setTimeout(()=>connect(true),Math.min(4000,500*2**retries++));}
        else{status('Connessione terminata. '+(event.reason||'Verifica il codice o crea una nuova stanza.'));latest=null;frames=[];session=null;saveSession();$('r3oEntry').hidden=false;$('r3oLobby').hidden=true;$('r3dMenu').hidden=false;$('r3oResults').hidden=true;$('r3oPause').hidden=true;$('r3oHud').hidden=true;$('r3dTouch').hidden=true;$('r3oRanking').hidden=true;$('r3oCountdown').hidden=true;$('r3dApp').dataset.state='menu';facade.state='menu';$('r3oCreate').disabled=!endpoint;$('r3oJoin').disabled=!endpoint;}
    });
}
let endpoint='';try{const url=new URL(RACING_SERVER_URL);if(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))endpoint=url.origin;}catch{/* not configured intentionally */}
function permission(create=false){
    const settings=window.CuginiPartyEventSettings,game=window.getPublicGameRecord?.('racing');
    if(settings?.multiplayer_enabled===false||game?.multiplayer_enabled===false)throw Error('Il multiplayer è temporaneamente disabilitato dall’Admin.');
    if(create&&(settings?.new_rooms_enabled===false||game?.new_rooms_enabled===false))throw Error('La creazione di nuove stanze è temporaneamente disabilitata.');
    if(settings?.new_matches_enabled===false||game?.new_matches_enabled===false)throw Error('Le nuove gare sono temporaneamente disabilitate.');
}
function entry(create){if(!endpoint)throw Error('Il coordinatore non è ancora pubblicato/configurato. Racing offline rimane disponibile.');permission(create);if(!$('r3oNickname').reportValidity())return null;return {nickname:$('r3oNickname').value.trim(),car:$('r3oEntryCar').value};}
async function join(create){
    try{const value=entry(create);if(!value)return;leaving=false;$('r3oCreate').disabled=true;$('r3oJoin').disabled=true;
        if(create){status('Creazione stanza…');const response=await fetch(endpoint+'/rooms',{method:'POST',signal:AbortSignal.timeout(10000)}),data=await response.json();if(!response.ok)throw Error(data.error||'Creazione non riuscita.');session={...value,code:data.code,hostTicket:data.hostTicket};}
        else {const code=$('r3oCode').value.trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw Error('Il codice deve contenere 8 caratteri validi.');session={...value,code};}
        saveSession();connect();
    }catch(error){status(error.name==='TimeoutError'?'Il server non risponde. Riprova.':error.message);$('r3oCreate').disabled=false;$('r3oJoin').disabled=false;}
}
function leave(){leaving=true;clearTimeout(retryTimer);send({type:'leave'});socket?.close(1000,'Uscita volontaria');socket=null;session=null;saveSession();location.reload();}
$('r3oEntry').addEventListener('submit',e=>{e.preventDefault();join(true);});$('r3oJoin').addEventListener('click',()=>join(false));
$('r3oApply').addEventListener('click',()=>send({type:'config',config:{track:$('r3oTrack').value,laps:+$('r3oLaps').value,bots:+$('r3oBots').value,difficulty:$('r3oDifficulty').value}}));
$('r3oCar').addEventListener('change',()=>send({type:'car',car:$('r3oCar').value}));
$('r3oReady').addEventListener('click',()=>send({type:'ready',ready:!latest?.players.find(p=>p.id===playerId)?.ready}));
$('r3oStart').addEventListener('click',()=>{try{permission();send({type:'start'});}catch(error){status(error.message);}});$('r3oAgain').addEventListener('click',()=>send({type:'lobby'}));
for(const id of ['r3oLeave','r3oRaceLeave','r3oResultLeave'])$(id).addEventListener('click',leave);
$('r3oCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(session.code);status('Codice copiato.');}catch{status('Copia questo codice: '+session.code);}});
function pause(value){paused=value;clearInput();$('r3oPause').hidden=!value;send({type:'input',round:latest?.round,seq:seq++,input:neutral()});}
$('r3oRaceMenu').addEventListener('click',()=>pause(true));$('r3oResume').addEventListener('click',()=>pause(false));
$('r3oRecover').addEventListener('click',()=>{send({type:'recover',round:latest?.round});pause(false);});
$('r3oAbort').addEventListener('click',()=>{if(confirm('Interrompere la gara per tutti?'))send({type:'abort'});});
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea')||!active())return;if(e.code==='Escape'){pause(!paused);e.preventDefault();}else if(e.code==='KeyR')send({type:'recover',round:latest.round});else if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden)send({type:'input',round:latest?.round,seq:seq++,input:neutral()});});
for(const button of document.querySelectorAll('[data-drive]')){
    button.addEventListener('pointerdown',e=>{if(!active()||paused)return;e.preventDefault();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,button.dataset.drive);button.classList.add('is-held');});
    const release=e=>{touch.delete(e.pointerId);button.classList.toggle('is-held',[...touch.values()].includes(button.dataset.drive));};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);button.addEventListener('contextmenu',e=>e.preventDefault());
}
setInterval(()=>{if(active())send({type:'input',round:latest.round,seq:seq++,input:input()});},50);
setInterval(()=>send({type:'ping',at:Date.now()}),5000);
window.addEventListener('pagehide',()=>{clearInput();socket?.close();});
window.addEventListener('storage',event=>{if(event.key==='CuginiParty_dark_mode')window.applyTheme?.(event.newValue==='true');});

// Render delayed server frames; no local physics, bot simulation or client lap authority.
function interpolate(now){
    if(!frames.length)return;const last=frames.at(-1),target=last.at+(now-last.arrival)-100;
    let a=frames[0],b=last;for(let i=1;i<frames.length;i++)if(frames[i].at>=target){a=frames[i-1];b=frames[i];break;}
    const mix=Math.max(0,Math.min(1,(target-a.at)/(b.at-a.at||1))),extra=Math.min(100,Math.max(0,target-last.at))/1000;
    for(const car of facade.cars){const from=a.cars.find(c=>c.id===car.id),to=b.cars.find(c=>c.id===car.id);if(!from||!to)continue;Object.assign(car,to);const t=from.recoveries!==to.recoveries?1:mix;
        for(const field of ['x','y','z','speed','steering','wheelAngle'])car[field]=from[field]+(to[field]-from[field])*t;
        car.heading=from.heading+Math.atan2(Math.sin(to.heading-from.heading),Math.cos(to.heading-from.heading))*t;
        if(extra&&to.finishTime===null&&!to.dnf){car.x+=to.vx*extra;car.z+=to.vz*extra;}
    }
    facade.time=last.time;const me=facade.player,order=[...last.cars].sort((a,b)=>Number(a.dnf)-Number(b.dnf)||((a.finishTime??Infinity)-(b.finishTime??Infinity))||b.progress-a.progress);
    $('r3oPosition').textContent=(order.findIndex(c=>c.playerId===playerId)+1)+' / '+order.length;$('r3oLap').textContent=Math.min(latest.config.laps,me.completedLaps+1)+' / '+latest.config.laps;
    $('r3oSpeed').textContent=Math.round(Math.abs(me.speed)*3.6)+' km/h';$('r3oTime').textContent=time(last.time);
    $('r3oCountdown').hidden=!active()||latest.phase!=='countdown'&&last.goTimer<=0;$('r3oCountdown').textContent=latest.phase==='countdown'?Math.ceil(last.countdown):'VIA!';
    const ranking=JSON.stringify(order.map(c=>[c.id,c.completedLaps,c.dnf,c.finishTime]));if($('r3oRanking').dataset.signature!==ranking){$('r3oRanking').dataset.signature=ranking;$('r3oRanking').replaceChildren(...order.map(c=>{const li=document.createElement('li');li.textContent=racerName(c.name,!c.playerId)+(c.dnf?' · ritirato':c.finishTime!==null?' · arrivato':'');li.classList.toggle('is-player',c.playerId===playerId);return li;}));}
    if(active())$('r3oNetwork').textContent=now-last.arrival>1000?'Aggiornamenti in ritardo. La previsione è limitata; controllo della connessione…':me.finishTime!==null?'Sei arrivato. Attendi gli altri partecipanti.':(matchMedia('(orientation: portrait) and (pointer: coarse)').matches?'Ruota in orizzontale per guidare meglio · ':'')+(latency===null?'Gara sincronizzata':'Rete '+latency+' ms');
}
try{view=new RacingView($('r3dCanvas'),facade,false,'auto');}catch(error){status('WebGL 2 non disponibile. Racing richiede accelerazione grafica.');console.error('Racing Online grafica:',error);}
window.addEventListener('resize',()=>view?.resize());window.visualViewport?.addEventListener('resize',()=>view?.resize());
let previous=performance.now();function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;interpolate(now);view?.render(dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);
if(endpoint){$('r3oCreate').disabled=false;$('r3oJoin').disabled=false;status('Crea una stanza privata o inserisci il codice degli amici.');const saved=readSession();if(saved&&/^[A-HJ-NP-Z2-9]{8}$/.test(saved.code||'')&&(saved.token||saved.hostTicket)){session=saved;connect(true);}}
else status('Racing Online è pronto per il collegamento, ma il coordinatore non è ancora pubblicato/configurato. Usa Racing offline nel frattempo.');
