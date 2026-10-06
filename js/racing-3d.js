// Racing 3D V1: one engine, canonical catalog id "racing".
import { RacingEngine, FIXED_STEP, TOTAL_LAPS } from './racing-3d-engine.js';
import { RacingTrack } from './racing-3d-track.js';
import { RacingView } from './racing-3d-view.js';
import { CAR_TYPES, TRACKS, DIFFICULTIES } from './racing-3d-data.js';
import { loadPreferences, savePreferences, updateRecords } from './racing-3d-storage.js';
import { RacingAudio } from './racing-3d-audio.js';

const params=new URLSearchParams(location.search), DEBUG=params.get('debug')==='1', AI_PLAYER=DEBUG&&params.get('ai')==='1';
const ids=['App','Canvas','Hud','Position','Lap','Speed','Time','LastLap','BestLap','Countdown','Message','Orientation','Touch','Menu','Pause','PauseMessage','Results','ResultSummary','ResultsStatus','Standings','Debug','StartButton','LoadStatus','PauseButton','ResumeButton','ResetButton','ExitButton','AgainButton','MenuButton','GarageButton','SettingsButton','Tracks','TrackList','TrackNext','ModeLabel','Record','Cars','CarName','CarDescription','CarStats','CarList','CarBack','CarNext','Difficulty','DifficultyList','RaceButton','Settings','Quality','Audio','Fullscreen','SettingsStatus','ChangeTrack','Minimap'];
const ui=Object.fromEntries(ids.map(id=>[id,document.getElementById('r3d'+id)]));
ui.RotateMenu=document.getElementById('r3dRotateMenu');
if(Object.values(ui).some(node=>!node))throw new Error('Racing 3D: DOM incompleto');
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
const preferences=loadPreferences(storage),trackCache=new Map();
const getTrack=id=>{if(!trackCache.has(id))trackCache.set(id,new RacingTrack(id));return trackCache.get(id);};
const engine=new RacingEngine(getTrack(preferences.track),{car:preferences.car,difficulty:preferences.difficulty,aiPlayer:AI_PLAYER});
const keys=new Set(),pointers=new Map(),audio=new RacingAudio();
let view,animation,lastTime=null,accumulator=0,displayedState=null,hudTime=0,fpsFrames=0,fpsTime=0,fps=0;
let mode='race',screen='main',garageOnly=false,portraitPaused=false,contextLost=false,pageSuspended=false,finishSaved=false,lastSavedLap=null,lastCountdown='',lastCollision=0,impactTime=0;

export function formatTime(seconds){
    if(seconds===null||!Number.isFinite(seconds))return '—';
    const ms=Math.max(0,Math.round(seconds*1000));
    return Math.floor(ms/60000)+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+'.'+String(ms%1000).padStart(3,'0');
}
function persist(){if(!savePreferences(storage,preferences))ui.SettingsStatus.textContent='Il browser non consente di salvare le preferenze. Puoi continuare a giocare.';}
function clearInput(){keys.clear();pointers.clear();document.querySelectorAll('[data-drive]').forEach(b=>b.classList.remove('is-held'));}
function input(){
    const held=a=>[...pointers.values()].includes(a);
    return {throttle:Number(keys.has('KeyW')||keys.has('ArrowUp')||held('throttle')),brake:Number(keys.has('KeyS')||keys.has('ArrowDown')||held('brake')),steer:Number(keys.has('KeyD')||keys.has('ArrowRight')||held('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||held('left'))};
}
function presentScreen(next){
    screen=next;ui.App.dataset.menuScreen=next;
    ui.Menu.querySelectorAll('[data-screen]').forEach(panel=>{panel.hidden=panel.dataset.screen!==next;panel.inert=panel.hidden;});
    if(view)view.preview=next==='cars';
    if(next==='tracks'){ui.ModeLabel.textContent=mode==='time'?'TIME TRIAL · SOLO TU E IL CRONOMETRO':'GARA · 6 PILOTI · 3 GIRI';renderRecord();}
    if(next==='cars'){renderCar();ui.CarNext.textContent=garageOnly?'Conferma auto':mode==='time'?'Inizia Time Trial →':'Scegli difficoltà →';}
    const panel=ui.Menu.querySelector('[data-screen="'+next+'"]');panel?.querySelector('button,a,select')?.focus();
}
function configure(){
    engine.configure(getTrack(preferences.track),{mode,car:preferences.car,difficulty:preferences.difficulty,aiPlayer:AI_PLAYER});
    view?.build();view?.resize();if(view)view.preview=screen==='cars';drawMinimap();finishSaved=false;lastSavedLap=null;lastCountdown='';lastCollision=0;
}
function selectButtons(container,value){container.querySelectorAll('[data-value]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===value)));}
function mapData(track){
    const minX=Math.min(...track.points.map(p=>p.x)),maxX=Math.max(...track.points.map(p=>p.x)),minZ=Math.min(...track.points.map(p=>p.z)),maxZ=Math.max(...track.points.map(p=>p.z));
    const scale=132/Math.max(maxX-minX,maxZ-minZ),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
    const point=p=>({x:80+(p.x-cx)*scale,y:80+(p.z-cz)*scale});
    const path=track.points.filter((_,i)=>i%4===0).map((p,i)=>{const q=point(p);return (i?'L':'M')+q.x.toFixed(1)+','+q.y.toFixed(1);}).join(' ')+'Z';
    return {path,point};
}
const svgNode=name=>document.createElementNS('http://www.w3.org/2000/svg',name);
function renderTracks(){
    ui.TrackList.replaceChildren(...TRACKS.map(config=>{
        const button=document.createElement('button');button.type='button';button.className='r3d-choice';button.dataset.value=config.id;button.setAttribute('aria-pressed',String(config.id===preferences.track));
        const svg=svgNode('svg'),path=svgNode('path');svg.setAttribute('viewBox','0 0 160 160');svg.setAttribute('aria-hidden','true');
        path.setAttribute('d',mapData(getTrack(config.id)).path);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','8');svg.append(path);
        const name=document.createElement('strong'),description=document.createElement('small'),meta=document.createElement('small');name.textContent=config.name;description.textContent=config.description;meta.textContent=config.difficulty+' · '+config.laps+' giri';
        button.append(svg,name,description,meta);button.addEventListener('click',()=>{preferences.track=config.id;persist();selectButtons(ui.TrackList,config.id);configure();renderRecord();});return button;
    }));
}
function renderRecord(){
    const r=preferences.records[preferences.track]||{};
    ui.Record.textContent='Record pista '+formatTime(r.lap??null)+' · Time Trial: giro '+formatTime(r.trialLap??null)+' / totale '+formatTime(r.trialTotal??null);
}
function renderCars(){
    ui.CarList.replaceChildren(...CAR_TYPES.map(spec=>{
        const button=document.createElement('button');button.type='button';button.className='r3d-choice';button.dataset.value=spec.id;button.textContent=spec.name;button.setAttribute('aria-pressed',String(spec.id===preferences.car));
        button.addEventListener('click',()=>{preferences.car=spec.id;persist();selectButtons(ui.CarList,spec.id);configure();renderCar();});return button;
    }));
}
function renderCar(){
    const spec=CAR_TYPES.find(c=>c.id===preferences.car);ui.CarName.textContent=spec.name;ui.CarDescription.textContent=spec.description;
    ui.CarStats.replaceChildren(...[['Velocità',spec.speed,55],['Accelerazione',spec.acceleration,16],['Controllo',spec.handling,1.2]].map(([name,value,max])=>{
        const label=document.createElement('label'),text=document.createElement('span'),meter=document.createElement('meter');text.textContent=name;meter.min=0;meter.max=max;meter.value=value;meter.setAttribute('aria-label',name+' '+Math.round(value/max*100)+' su 100');label.append(text,meter);return label;
    }));
}
function renderDifficulties(){
    const descriptions={easy:'Frenate anticipate, traiettorie permissive e sorpassi prudenti.',normal:'Buon ritmo, sorpassi decisi e qualche errore.',hard:'Frenate tardive, uscite veloci e rivali precisi nel traffico.'};
    ui.DifficultyList.replaceChildren(...Object.entries(DIFFICULTIES).map(([id,d])=>{
        const b=document.createElement('button');b.type='button';b.className='r3d-choice';b.dataset.value=id;b.setAttribute('aria-pressed',String(id===preferences.difficulty));
        const name=document.createElement('strong'),desc=document.createElement('small');name.textContent=d.name;desc.textContent=descriptions[id];b.append(name,desc);
        b.addEventListener('click',()=>{preferences.difficulty=id;persist();selectButtons(ui.DifficultyList,id);});return b;
    }));
}
let minimap;
function drawMinimap(){
    minimap=mapData(engine.track);const path=svgNode('path');path.setAttribute('d',minimap.path);
    ui.Minimap.replaceChildren(path,...engine.cars.map(car=>{const marker=svgNode('circle');marker.dataset.car=car.id;marker.setAttribute('r',car.id===0?4.5:3);marker.setAttribute('fill',car.id===0?'#f54c65':'#57abe9');return marker;}));
}
function syncState(){
    const changed=displayedState!==engine.state;displayedState=engine.state;ui.App.dataset.state=engine.state;
    const active=['countdown','racing'].includes(engine.state);
    ui.Menu.hidden=engine.state!=='menu';ui.Pause.hidden=engine.state!=='paused'||portraitPaused;ui.Results.hidden=engine.state!=='finished';
    ui.Hud.hidden=engine.state==='menu';ui.Touch.hidden=!active;ui.Orientation.hidden=!portraitPaused;
    ui.Menu.inert=ui.Menu.hidden;ui.Pause.inert=ui.Pause.hidden;ui.Results.inert=ui.Results.hidden;ui.Hud.inert=!active;ui.Touch.inert=!active;
    ui.Debug.hidden=!DEBUG;
    if(!active){clearInput();ui.Countdown.hidden=true;ui.Message.hidden=true;}
    if(changed){
        if(engine.state==='paused'){if(portraitPaused)ui.RotateMenu.focus();else ui.ResumeButton.focus();}
        if(engine.state==='finished'){saveFinish();showResults();audio.tone(660,.3);ui.AgainButton.focus();}
        if(active)ui.PauseButton.focus();
    }
}
function saveFinish(){
    if(finishSaved||engine.player.finishTime===null)return;
    finishSaved=true;updateRecords(preferences,preferences.track,mode,engine.player.bestLap,engine.player.finishTime);persist();
}
function showResults(){
    const order=engine.standings(),p=engine.player;
    ui.ResultSummary.textContent=(mode==='time'?'Time Trial':(order.indexOf(p)+1)+'° posto')+' · Tempo '+formatTime(p.finishTime)+' · Giro migliore '+formatTime(p.bestLap);
    ui.Standings.replaceChildren(...order.map(car=>{
        const row=document.createElement('li'),name=document.createElement('span'),time=document.createElement('time');row.classList.toggle('is-player',car.id===0);
        name.textContent=car.name;time.textContent=car.finishTime!==null?formatTime(car.finishTime):'In pista · giro '+Math.min(3,car.completedLaps+1);row.append(name,time);return row;
    }));
    ui.ResultsStatus.textContent=order.every(c=>c.finishTime!==null)?(mode==='time'?'Record Time Trial salvati su questo dispositivo.':'Classifica completa · tutti i piloti al traguardo.'):'I rivali stanno completando la gara. La classifica si aggiorna con i loro tempi reali.';
}
function updateHud(dt){
    hudTime+=dt;impactTime=Math.max(0,impactTime-dt);ui.App.classList.toggle('is-impact',impactTime>0);
    if(hudTime<.08)return;hudTime=0;
    const p=engine.player;ui.Position.textContent=(engine.standings().indexOf(p)+1)+' / '+engine.cars.length;
    ui.Lap.textContent=Math.min(TOTAL_LAPS,p.completedLaps+1)+' / '+TOTAL_LAPS;ui.Speed.textContent=String(Math.round(Math.abs(p.speed)*3.6));
    ui.Time.textContent=formatTime(p.finishTime??engine.time);ui.LastLap.textContent=formatTime(p.lastLap);ui.BestLap.textContent=formatTime(p.bestLap);
    if(p.bestLap!==null&&p.bestLap!==lastSavedLap){lastSavedLap=p.bestLap;updateRecords(preferences,preferences.track,mode,p.bestLap,null);persist();}
    const countdown=engine.state==='countdown',label=countdown?String(Math.max(1,Math.ceil(engine.countdown))):'VIA!';
    ui.Countdown.hidden=!countdown&&!(engine.state==='racing'&&engine.goTimer>0);
    if(ui.Countdown.textContent!==label)ui.Countdown.textContent=label;
    if(!ui.Countdown.hidden&&lastCountdown!==label){lastCountdown=label;audio.tone(label==='VIA!'?880:440);}
    ui.Message.hidden=engine.state!=='racing'||!(p.offroad||p.speed< -1||engine.recoveryNotice>0);
    const surfaces={grass:'ERBA',sand:'SABBIA',dirt:'STERRATO',snow:'NEVE'};
    ui.Message.textContent=engine.recoveryNotice>0?'Auto recuperata all’ultimo checkpoint':p.speed< -1?'RETROMARCIA':(surfaces[p.surface]||'BANCHINA')+' · rallenta e rientra in pista';
    if(p.collisions>lastCollision){impactTime=.18;lastCollision=p.collisions;}
    ui.Minimap.querySelectorAll('circle').forEach(marker=>{const car=engine.cars[Number(marker.dataset.car)],point=minimap.point(car);marker.setAttribute('cx',point.x.toFixed(1));marker.setAttribute('cy',point.y.toFixed(1));});
    if(engine.state==='finished')showResults();
    if(DEBUG){const m=view.metrics();ui.Debug.textContent='FPS '+fps+' · '+m.drawCalls+' draw · DPR '+m.dpr+'\nCP '+p.nextCheckpoint+'/'+engine.track.checkpointCount+' · '+p.speed.toFixed(1)+' m/s\n'+m.geometries+' geometrie · '+m.instances+' istanze\n'+p.collisions+' urti · '+p.recoveries+' recuperi';}
}
function frame(now){
    if(pageSuspended||contextLost)return;
    const raw=lastTime===null?0:Math.max(0,(now-lastTime)/1000);lastTime=now;
    if(raw>.75&&['racing','countdown'].includes(engine.state))engine.pause();
    const dt=Math.min(raw,.1);accumulator+=dt;
    while(accumulator>=FIXED_STEP){engine.step(FIXED_STEP,input());accumulator-=FIXED_STEP;}
    syncState();updateHud(dt);view.render(dt);audio.update(engine);
    fpsTime+=raw;fpsFrames++;if(fpsTime>=1){fps=Math.round(fpsFrames/fpsTime);fpsTime=0;fpsFrames=0;}
    animation=requestAnimationFrame(frame);
}
const portrait=()=>matchMedia('(orientation: portrait) and (max-width: 900px)').matches;
function checkOrientation(){
    if(portrait()&&['countdown','racing'].includes(engine.state)){portraitPaused=true;engine.pause();clearInput();}
    else if(!portrait()&&portraitPaused){portraitPaused=false;engine.resume();lastTime=null;accumulator=0;}
    syncState();
}
function launch(){if(!view||contextLost)return;clearInput();configure();screen='main';view.preview=false;engine.start();audio.unlock();accumulator=0;lastTime=null;checkOrientation();}
function menu(next='main'){clearInput();portraitPaused=false;engine.reset();syncState();presentScreen(next);}
function togglePause(){if(portraitPaused||contextLost)return;clearInput();engine.state==='paused'?engine.resume():engine.pause();syncState();audio.unlock();audio.update(engine);}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(!view||contextLost)return;mode=b.dataset.mode;garageOnly=false;audio.unlock();presentScreen('tracks');}));
ui.GarageButton.addEventListener('click',()=>{if(!view||contextLost)return;garageOnly=true;configure();presentScreen('cars');});
ui.SettingsButton.addEventListener('click',()=>presentScreen('settings'));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>presentScreen(b.dataset.back)));
ui.TrackNext.addEventListener('click',()=>{configure();presentScreen('cars');});
ui.CarBack.addEventListener('click',()=>presentScreen(garageOnly?'main':'tracks'));
ui.CarNext.addEventListener('click',()=>{if(garageOnly)presentScreen('main');else if(mode==='time')launch();else presentScreen('difficulty');});
ui.RaceButton.addEventListener('click',launch);ui.AgainButton.addEventListener('click',launch);
ui.PauseButton.addEventListener('click',togglePause);ui.ResumeButton.addEventListener('click',togglePause);
ui.ResetButton.addEventListener('click',()=>{if(contextLost)return;engine.recover();engine.resume();checkOrientation();});
ui.ExitButton.addEventListener('click',()=>menu());ui.MenuButton.addEventListener('click',()=>menu());
ui.ChangeTrack.addEventListener('click',()=>{garageOnly=false;menu('tracks');});
ui.RotateMenu.addEventListener('click',()=>menu());
ui.Quality.value=preferences.quality;ui.Quality.addEventListener('change',()=>{preferences.quality=ui.Quality.value;persist();view?.setQuality(preferences.quality);});
try{audio.enabled=storage.getItem('CuginiParty_audio_enabled')!=='false';}catch{audio.enabled=true;}
ui.Audio.checked=audio.enabled;
ui.Audio.addEventListener('change',()=>{audio.enabled=ui.Audio.checked;try{storage.setItem('CuginiParty_audio_enabled',String(audio.enabled));}catch{ui.SettingsStatus.textContent='Audio aggiornato solo per questa sessione.';}if(audio.enabled)audio.unlock();audio.update(engine);});
ui.Fullscreen.addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else ui.SettingsStatus.textContent='Schermo intero non disponibile qui. La gara funziona anche senza.';}catch{ui.SettingsStatus.textContent='Schermo intero non disponibile. Puoi continuare a giocare.';}
});
const driveKeys=['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
document.addEventListener('keydown',event=>{
    if(event.target.closest('input,select,textarea')||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.code==='Escape'){event.preventDefault();if(!event.repeat){if(engine.state==='menu')presentScreen('main');else togglePause();}return;}
    if(!['countdown','racing'].includes(engine.state))return;
    if(event.code==='KeyR'){event.preventDefault();if(!event.repeat)engine.recover();}
    if(driveKeys.includes(event.code)){event.preventDefault();keys.add(event.code);audio.unlock();}
});
document.addEventListener('keyup',event=>keys.delete(event.code));
document.querySelectorAll('[data-drive]').forEach(b=>{
    b.addEventListener('pointerdown',event=>{if(!['countdown','racing'].includes(engine.state))return;event.preventDefault();b.setPointerCapture(event.pointerId);pointers.set(event.pointerId,b.dataset.drive);b.classList.add('is-held');audio.unlock();});
    const release=event=>{pointers.delete(event.pointerId);b.classList.toggle('is-held',[...pointers.values()].includes(b.dataset.drive));};
    b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);b.addEventListener('contextmenu',e=>e.preventDefault());
});
document.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const dialog=engine.state==='paused'?ui.Pause:engine.state==='finished'?ui.Results:null;if(!dialog||dialog.hidden)return;
    const buttons=[...dialog.querySelectorAll('button:not(:disabled)')];
    if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0].focus();}
});
function suspend(){clearInput();engine.pause();syncState();accumulator=0;lastTime=null;audio.update(engine);}
window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
const resize=()=>{view?.resize();if(view)checkOrientation();};
window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);document.addEventListener('fullscreenchange',resize);window.visualViewport?.addEventListener('resize',resize);
window.addEventListener('storage',event=>{
    if(event.key==='CuginiParty_dark_mode'&&typeof window.applyTheme==='function')window.applyTheme(event.newValue==='true');
    if(event.key==='CuginiParty_audio_enabled'){audio.enabled=event.newValue!=='false';ui.Audio.checked=audio.enabled;audio.update(engine);}
});
ui.Canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();suspend();contextLost=true;cancelAnimationFrame(animation);ui.ResumeButton.disabled=true;ui.ResetButton.disabled=true;ui.PauseMessage.textContent='Grafica interrotta. La gara è ferma durante il ripristino.';
    ui.StartButton.disabled=true;ui.LoadStatus.textContent='Grafica interrotta: ripristino in corso.';
});
ui.Canvas.addEventListener('webglcontextrestored',()=>{
    contextLost=false;view.build();view.resize();ui.StartButton.disabled=false;ui.LoadStatus.textContent='Grafica ripristinata.';ui.ResumeButton.disabled=false;ui.ResetButton.disabled=false;ui.PauseMessage.textContent='Grafica ripristinata. Riprendi quando sei pronto.';lastTime=null;animation=requestAnimationFrame(frame);
});
window.addEventListener('pagehide',event=>{suspend();cancelAnimationFrame(animation);pageSuspended=true;if(!event.persisted){view?.dispose();audio.dispose();}});
window.addEventListener('pageshow',event=>{if(event.persisted){pageSuspended=false;lastTime=null;view?.resize();if(view)animation=requestAnimationFrame(frame);}});
try{
    renderTracks();renderCars();renderDifficulties();view=new RacingView(ui.Canvas,engine,DEBUG,preferences.quality);drawMinimap();
    ui.StartButton.disabled=false;ui.StartButton.textContent='Gara';ui.LoadStatus.textContent='3 giri · 5 rivali · Record salvati sul dispositivo';
    if(DEBUG)window.racing3DDebug=Object.freeze({snapshot:()=>({...engine.snapshot(),...view.metrics(),fps,input:input(),pointers:pointers.size,screen,portraitPaused,cameraRight:view.screenDirection(),previewAngle:view.previewAngle,preferences:JSON.parse(JSON.stringify(preferences))}),suggestion:()=>engine.botInput({...engine.player})});
    presentScreen('main');syncState();animation=requestAnimationFrame(frame);
}catch(error){
    view?.dispose();ui.StartButton.disabled=true;ui.StartButton.textContent='Grafica non disponibile';ui.LoadStatus.textContent='Questo browser non riesce ad avviare WebGL 2. Verifica il supporto e l’accelerazione grafica.';console.error('Racing 3D:',error);
}
