import {EVENTS,normalizeConfig,activeEvents,annualWindow,romeParts} from './events-calendar.js';
import {officialPalette,mountScene,clearScene} from './events-scenes.js';

const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('../css/events.css',import.meta.url).href;document.head.append(stylesheet);
const SVG='http://www.w3.org/2000/svg';
const drawings={
    pumpkin:'<path d="M12 7c-9-5-14 11-5 13 3 2 7 2 10 0 9-2 4-18-5-13Z"/><path d="m12 7 2-5M8 12l1 1m6-1 1 1M8 16q4 4 8 0"/>',
    bat:'<path d="m12 8-3-3-2 4-6-4 1 11 5-2 5 7 5-7 5 2 1-11-6 4-2-4-3 3Z"/>',
    ghost:'<path d="M5 21V10a7 7 0 0 1 14 0v11l-4-3-3 3-3-3-4 3Z"/><path d="M9 9v3m6-3v3"/>',
    tree:'<path d="m12 2-7 8h3l-5 6h6v5h6v-5h6l-5-6h3L12 2Z"/><path d="m8 10 8 5M8 6l7 4"/>',
    snow:'<path d="M12 2v20M3 7l18 10M3 17 21 7M9 3l3 3 3-3M9 21l3-3 3 3"/>',
    star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
    stocking:'<path d="M6 2h12v5H6zM7 7v7l-4 4q-2 5 4 4l10-5V7"/>',
    broom:'<path d="m20 2-9 12m-2-2 5 4-5 7-8-6 8-5Z"/><path d="m4 17 6 4m-3-6 5 4"/>',
    egg:'<path d="M20 15c0 10-16 10-16 0C4 9 9 2 12 2s8 7 8 13Z"/><path d="m5 12 4 3 4-3 5 3m-11 4h10"/>',
    flower:'<path d="M12 8C3-3-3 9 7 12c-11 9 1 15 5 5 9 11 15-1 5-5 11-9-1-15-5-4Z"/><circle cx="12" cy="12" r="3"/>',
    bunny:'<path d="M7 11C-1-2 9-4 10 8h4c1-12 11-10 3 3 10 14-20 14-10 0Z"/><path d="M9 15h.1m6 0h.1m-4 3h2"/>',
    spark:'<path d="m12 2 2 7 8 3-8 2-2 8-2-8-8-2 8-3 2-7Z"/>',
    confetti:'<path d="m2 5 3 4m12-7-2 4M8 20l2-3m10-4-4-1M8 3l2 4M3 17l2-2m13 5 3 2M12 11l2 2"/>',
    mask:'<path d="m2 6 10 3 10-3v7c-1 9-6 7-10 2-4 5-9 7-10-2V6Z"/><path d="M5 11q3-3 5 1M14 12q2-4 5-1"/>',
    ribbon:'<path d="M3 2c18 1-5 8 6 10s15 5 4 7 6 4 8 2"/>',
    heart:'<path d="M12 21 3 12C-4 2 8-2 12 6 16-2 28 2 21 12l-9 9Z"/>',
    sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    wave:'<path d="M1 10q4-7 8 0t8 0q4-7 6 0M1 17q4-7 8 0t8 0q4-7 6 0"/>',
    shell:'<path d="m12 22-9-9c-9-17 27-17 18 0l-9 9Z"/><path d="M12 22V3m0 19L6 5m6 17 6-17"/>'
};
function art(name){const node=document.createElementNS(SVG,'svg');node.setAttribute('viewBox','0 0 24 24');node.setAttribute('aria-hidden','true');node.innerHTML=drawings[name]||drawings.star;return node;}
export const createEventArt=name=>art(name);
let row=null,config=normalizeConfig(null),preview=null,timer=null,offset=0,signature='',lastId=null;
let localEffectPreference=null;
let personalDark=null;
function effectiveDark(value){personalDark=Boolean(value);return Boolean(document.body.dataset.event)||personalDark;}
let clockChecked=false;
const getClient=()=>window.supabaseClient||window.CuginiPartyEventAdmin?.client;
const now=()=>Date.now()+offset;
const previewKey='CuginiParty_event_preview_v1',effectKey='CuginiParty_event_effects';
const safeRead=(storage,key)=>{try{return storage.getItem(key);}catch{return null;}};
function clientReady(){
    const existing=getClient();if(existing)return Promise.resolve(existing);
    // Some game pages load the SDK asynchronously through app.js. Wait for
    // that one existing bootstrap, rather than create a competing client.
    return new Promise((resolve,reject)=>{
        const ready=()=>{const client=getClient();if(client)resolve(client);else reject(Error('Connessione Supabase non disponibile. Riprova quando la rete è attiva.'));};
        window.addEventListener('cuginiparty:supabase-ready',ready,{once:true});
    });
}
export async function authorizeAdmin(){
    const client=await clientReady();
    const session=await client.auth.getSession();if(!session.data?.session)throw Error('Accedi come amministratore.');
    const result=await client.rpc('is_admin');if(result.error||result.data!==true)throw Error('Operazione riservata agli amministratori autorizzati.');
    return client;
}
export function ingestSettings(settings){
    if(!settings)return;row=settings;config=normalizeConfig(settings.value?.theme_events);
    window.dispatchEvent(new CustomEvent('cuginiparty:event-config',{detail:config}));tick();
    if(row.value?.theme_events&&!clockChecked)calibrate();
}
function dark(){return document.body.classList.contains('dark-mode')||Boolean(window.CuginiPartyEventAdmin&&matchMedia('(prefers-color-scheme: dark)').matches);}
function clearDecor(){clearScene();document.querySelectorAll('.event-ornament,.event-theme-note,#event-preview-indicator').forEach(e=>e.remove());}
function render(){
    const active=preview?.event||activeEvents(config,now())[0],def=EVENTS.find(d=>d.id===active?.id);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const low=(navigator.deviceMemory||8)<=4||(navigator.hardwareConcurrency||8)<=4||navigator.connection?.saveData;
    const preference=localEffectPreference||safeRead(localStorage,effectKey)||'auto';
    const key=JSON.stringify([active,active?null:dark(),Boolean(preview),reduced,low,preference]);
    if(key===signature)return;signature=key;clearDecor();
    const body=document.body;
    if(!def){const wasActive=Boolean(body.dataset.event);delete body.dataset.event;delete body.dataset.eventTone;delete body.dataset.eventMotion;body.classList.remove('event-special');for(const p of ['paper','ink','surface','soft','accent','border','decor'])body.style.removeProperty('--event-'+p);lastId=null;if(wasActive&&personalDark!==null)body.classList.toggle('dark-mode',personalDark);return;}
    if(!body.dataset.event&&personalDark===null)personalDark=body.classList.contains('dark-mode');
    const fx=active.effects,palette=officialPalette(def.id);
    for(const [p,v]of Object.entries(palette))body.style.setProperty('--event-'+p,v);
    body.dataset.event=def.id;body.dataset.eventTone='dark';body.classList.add('dark-mode');
    const themeSetting=document.getElementById('themeToggle')?.closest('.setting-row')||document.querySelector('[data-section-content="events"] .section-heading');
    if(themeSetting){const note=document.createElement('small');note.className='event-theme-note';note.textContent=`${def.name} usa la sua palette ufficiale. La preferenza chiaro/scuro verrà applicata al termine dell’evento.`;themeSetting.append(note);}
    const motion=!reduced&&preference!=='off'&&fx.quality!=='off'&&fx.intensity>0;
    body.dataset.eventMotion=motion?'on':'off';
    mountScene(def.id,{staticArt:fx.static,motion,particles:fx.particles,special:fx.special,reduced:low||preference==='reduced'||fx.quality==='reduced',intensity:fx.intensity});
    if(fx.static){
        const headers=[...document.querySelectorAll('.hero h1,.game-page h1,.game-page h2,.undercover-page h1,.undercover-page h2,.cat-mouse-hero h1,.cat-mouse-result h2,.cube-rush-hero h1,.guess-who-page h1,.guess-who-page h2,.r3d-panel h1,.r3d-panel h2,.section-heading h1,.section-heading h2,.heist-hud-objective,.r3d-stats')].slice(0,24);
        for(const [i,h]of headers.entries()){const ornament=document.createElement('span');ornament.className='event-ornament';ornament.setAttribute('aria-hidden','true');ornament.append(art(def.art[i%def.art.length]));h.append(ornament);}
    }
    body.classList.toggle('event-special',fx.special);
    if(preview){
        const label=document.createElement('div');label.id='event-preview-indicator';label.textContent=`Anteprima privata · ${def.name} `;
        const close=document.createElement('button');close.type='button';close.textContent='Termina';close.addEventListener('click',clearPreview);label.append(close);body.append(label);
    }
    lastId=def.id;window.dispatchEvent(new CustomEvent('cuginiparty:event-theme',{detail:{id:def.id,preview:Boolean(preview),motion}}));
}
function tick(){
    clearTimeout(timer);if(preview&&preview.expires<now()){preview=null;try{sessionStorage.removeItem(previewKey);}catch{/* private session only */}}
    render();let delay=30000;
    for(const e of config.events){let boundaries=[];if(e.mode==='scheduled')boundaries=[Date.parse(e.startAt),Date.parse(e.endAt)];
        if(e.mode==='annual')for(const y of [romeParts(now()).year-1,romeParts(now()).year,romeParts(now()).year+1])try{const w=annualWindow(e,y);boundaries.push(w.start,w.end);}catch{/* invalid config stays inactive */}
        for(const t of boundaries)if(t>now())delay=Math.min(delay,t-now()+25);
    }
    timer=setTimeout(tick,Math.max(50,delay));
}
export function clearPreview(){preview=null;try{sessionStorage.removeItem(previewKey);}catch{/* optional session storage */}signature='';tick();}
export async function setPreview(raw,id){
    await authorizeAdmin();const event=normalizeConfig(raw).events.find(e=>e.id===id);if(!event)throw Error('Tema non valido.');
    preview={event,expires:now()+2*3600000};
    try{sessionStorage.setItem(previewKey,JSON.stringify(preview));}catch{throw Error('L’anteprima fra pagine richiede sessionStorage disponibile.');}
    signature='';tick();
}
async function refresh(){const client=getClient();if(!client)return;const r=await client.from('site_settings').select('id,value,updated_at').eq('id',1).maybeSingle();if(!r.error&&r.data)ingestSettings(r.data);}
async function calibrate(){
    // Reuse the existing client's public connection. No credentials/client added.
    const c=getClient();if(!c||!row?.value?.theme_events)return;clockChecked=true;
    try{const t=Date.now(),r=await c.rpc('theme_events_clock'),server=Date.parse(r.data);if(!r.error&&Number.isFinite(server)){offset=server-(t+Date.now())/2;tick();return;}}catch{/* older installations may not yet have the additive RPC */}
    if(!c.supabaseUrl||!c.supabaseKey)return;
    try{const t=Date.now(),r=await fetch(c.supabaseUrl+'/rest/v1/site_settings?select=id&id=eq.1',{headers:{apikey:c.supabaseKey},cache:'no-store'}),server=Date.parse(r.headers.get('date'));if(r.ok&&Number.isFinite(server)){offset=server-(t+Date.now())/2;tick();}}catch{/* date clock falls back to device time */}
}
window.CuginiPartyEvents={ingestSettings,setPreview,clearPreview,refresh,authorizeAdmin,effectiveDark,snapshot:()=>({active:lastId,preview:Boolean(preview),config:structuredClone(config),serverClock:offset!==0})};
window.addEventListener('cuginiparty:site-settings',e=>ingestSettings(e.detail));
const observer=new MutationObserver(()=>{if(document.body.dataset.event&&!document.body.classList.contains('dark-mode'))document.body.classList.add('dark-mode');render();});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{signature='';tick();});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{signature='';tick();});
window.addEventListener('storage',e=>{if(e.key===effectKey){signature='';tick();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();refresh();}});
window.addEventListener('pagehide',()=>clearTimeout(timer));window.addEventListener('pageshow',()=>tick());
const saved=safeRead(sessionStorage,previewKey);
if(saved)try{const p=JSON.parse(saved);if(p.expires>Date.now()){await authorizeAdmin();preview={event:normalizeConfig({events:[p.event]}).events.find(e=>e.id===p.event.id),expires:p.expires};}}catch{try{sessionStorage.removeItem(previewKey);}catch{/* optional */}}
if(window.CuginiPartyEventSettings)ingestSettings(window.CuginiPartyEventSettings);else if(window.CuginiPartyEventAdmin)await refresh();
calibrate();tick();
const modal=document.querySelector('#settingsModal .settings-modal');
if(modal){const label=document.createElement('label');label.className='setting-row event-effects-setting';label.textContent='Effetti stagionali ';const select=document.createElement('select');select.setAttribute('aria-label','Effetti stagionali');for(const [value,text]of [['auto','Automatici'],['reduced','Ridotti'],['off','Disattivati']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}select.value=safeRead(localStorage,effectKey)||'auto';select.addEventListener('change',()=>{localEffectPreference=select.value;try{localStorage.setItem(effectKey,select.value);}catch{/* session only */}signature='';tick();});label.append(select);modal.append(label);}
window.dispatchEvent(new Event('cuginiparty:events-ready'));
