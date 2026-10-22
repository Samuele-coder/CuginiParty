import {EVENTS,normalizeConfig,validateConfig,romeInput,romeInstant,activeEvents,annualWindow,romeParts,isActive} from '../js/events-calendar.js';
import {authorizeAdmin,setPreview,ingestSettings} from '../js/events-runtime.js';
import {createScenePreview} from '../js/events-scenes.js';

const bridge=window.CuginiPartyEventAdmin,section=document.querySelector('[data-section-content="events"]');
const grid=section.querySelector('#eventsGrid'),status=section.querySelector('#eventsStatus'),winner=section.querySelector('#eventsWinner'),form=section.querySelector('form');
let base=null,dirty=false,busy=false;
const message=(text,error=false)=>{status.textContent=text;status.dataset.error=String(error);};
const field=(card,name)=>card.querySelector(`[name="${name}"]`);
function draft(){
    return validateConfig({version:1,events:[...grid.querySelectorAll('[data-event-id]')].map(card=>{
        const get=n=>field(card,n).value,checked=n=>field(card,n).checked;
        return {id:card.dataset.eventId,mode:get('mode'),manualActive:checked('manualActive'),priority:+get('priority'),startAt:get('startAt')?romeInstant(get('startAt')):null,endAt:get('endAt')?romeInstant(get('endAt')):null,
            annual:{anchor:get('anchor'),startMonthDay:get('startMonthDay'),endMonthDay:get('endMonthDay'),startOffset:+get('startOffset'),endOffset:+get('endOffset'),startTime:get('startTime'),endTime:get('endTime')},
            effects:{static:checked('static'),particles:checked('particles'),special:checked('special'),intensity:+get('intensity'),quality:get('quality')}};
    })});
}
function summary(){
    try{const c=draft(),active=activeEvents(c);winner.textContent=active.length?`Precedenza attuale: ${EVENTS.find(d=>d.id===active[0].id).name}. ${active.length>1?'Gli altri eventi attivi restano in attesa: '+active.slice(1).map(e=>EVENTS.find(d=>d.id===e.id).name).join(', '):'Nessuna sovrapposizione.'}`:'Nessun tema attivo: viene rispettata la preferenza chiaro/scuro di ciascun utente.';
        for(const e of c.events){const card=grid.querySelector(`[data-event-id="${e.id}"]`),s=card.querySelector('.event-card-state');let dates='';if(e.mode==='annual'){try{const w=annualWindow(e,romeParts(Date.now()).year);dates=` · ${romeInput(w.start).replace('T',' ')} → ${romeInput(w.end).replace('T',' ')}`;}catch{dates=' · Date annuali da correggere';}}if(e.mode==='scheduled'&&e.startAt)dates=` · ${romeInput(e.startAt).replace('T',' ')} → ${romeInput(e.endAt).replace('T',' ')}`;s.textContent=({off:'Disattivato',manual:'Manuale',scheduled:'Programmato',annual:'Annuale'}[e.mode])+' · '+(isActive(e)?'Attivo':'Non attivo')+dates;}
    }catch(e){winner.textContent=e.message;}
}
function visibility(card){const mode=field(card,'mode').value;card.querySelector('[data-scheduled]').hidden=mode!=='scheduled';card.querySelector('[data-annual]').hidden=mode!=='annual';field(card,'manualActive').closest('label').hidden=mode!=='manual';const fixed=field(card,'anchor').value==='fixed';for(const el of card.querySelectorAll('[data-fixed]'))el.hidden=!fixed;for(const el of card.querySelectorAll('[data-movable]'))el.hidden=fixed;}
function render(settings){
    if(!settings)return;base=settings;const c=normalizeConfig(settings.value?.theme_events);grid.replaceChildren();
    for(const [i,def]of EVENTS.entries()){
        const e=c.events[i],card=document.createElement('article');card.className='event-editor';card.dataset.eventId=def.id;
        card.innerHTML=`<div class="event-swatch"></div>
        <h3>${def.name}</h3><p class="event-card-state"></p><details><summary>Modifica evento</summary>
        <label>Modalità<select name="mode"><option value="off">Disattivato</option><option value="manual">Manuale</option><option value="scheduled">Programmato</option><option value="annual">Automatico annuale</option></select></label>
        <label class="event-check"><input name="manualActive" type="checkbox">Attiva manualmente</label>
        <label>Priorità (più alta = precedenza)<input name="priority" type="number" min="0" max="1000" required></label>
        <fieldset data-scheduled><legend>Europe/Rome</legend><label>Inizio<input name="startAt" type="datetime-local"></label><label>Fine esclusa<input name="endAt" type="datetime-local"></label></fieldset>
        <fieldset data-annual><legend>Ricorrenza annuale</legend><label>Calendario<select name="anchor"><option value="fixed">Date fisse</option><option value="easter">Domenica di Pasqua</option><option value="carnival">Martedì grasso (rito romano)</option></select></label>
        <label data-fixed>Inizio (MM-GG)<input name="startMonthDay" type="text" pattern="[0-9]{2}-[0-9]{2}" maxlength="5" placeholder="10-20"></label><label data-fixed>Fine esclusa (MM-GG)<input name="endMonthDay" type="text" pattern="[0-9]{2}-[0-9]{2}" maxlength="5" placeholder="11-03"></label>
        <label data-movable>Giorni prima/dopo l’evento: inizio<input name="startOffset" type="number" min="-90" max="90"></label><label data-movable>Giorni prima/dopo l’evento: fine<input name="endOffset" type="number" min="-90" max="90"></label>
        <label>Ora inizio<input name="startTime" type="time"></label><label>Ora fine<input name="endTime" type="time"></label></fieldset>
        <fieldset><legend>Effetti</legend><label class="event-check"><input name="static" type="checkbox">Decorazioni statiche</label><label class="event-check"><input name="particles" type="checkbox">Particelle leggere</label><label class="event-check"><input name="special" type="checkbox">Animazioni delle decorazioni</label><label>Intensità (0–100)<input name="intensity" type="number" min="0" max="100" required></label><label>Dispositivi meno potenti<select name="quality"><option value="auto">Riduzione automatica</option><option value="reduced">Effetti ridotti per tutti</option><option value="off">Nessun effetto animato</option></select></label></fieldset>
        </details><div class="event-actions"><button type="button" data-preview="${def.id}">Anteprima privata</button><button type="button" data-preview-home="${def.id}">Anteprima Home</button><button type="button" data-preview-game="${def.id}">Anteprima Racing</button></div>`;
        card.querySelector('.event-swatch').replaceWith(createScenePreview(def.id,def.name));
        for(const n of ['mode','priority','manualActive']){const input=field(card,n);if(input.type==='checkbox')input.checked=e[n];else input.value=e[n];}
        for(const n of ['startAt','endAt'])field(card,n).value=e[n]?romeInput(e[n]):'';
        for(const [n,v]of Object.entries(e.annual))field(card,n).value=v;
        for(const [n,v]of Object.entries(e.effects)){const input=field(card,n);if(input.type==='checkbox')input.checked=v;else input.value=v;}
        grid.append(card);visibility(card);
    }
    dirty=false;summary();
}
form.addEventListener('input',()=>{dirty=true;for(const c of grid.children)visibility(c);summary();});
form.addEventListener('change',()=>{dirty=true;for(const c of grid.children)visibility(c);summary();});
form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    try{
        const config=draft(),client=await authorizeAdmin();busy=true;form.querySelector('[type="submit"]').disabled=true;message('Salvataggio delle impostazioni condivise…');
        const latest=await client.from('site_settings').select('id,value,updated_at').eq('id',1).single();if(latest.error)throw latest.error;
        if(base?.updated_at&&latest.data.updated_at!==base.updated_at)throw Error('Le impostazioni sono cambiate da un’altra sessione. Ricarica prima di salvare; la bozza non è stata cancellata.');
        const saved=await client.rpc('admin_save_theme_events',{p_config:config,p_expected_updated_at:latest.data.updated_at||null});
        if(saved.error){if(saved.error.code==='PGRST202')throw Error('Il salvataggio sicuro richiede la migrazione admin/events.sql nel database Supabase. Nessuna modifica è stata pubblicata.');throw saved.error;}
        if(!saved.data)throw Error('Salvataggio non autorizzato o dati modificati da un’altra sessione.');
        bridge.acceptSettings(saved.data);render(saved.data);ingestSettings(saved.data);await bridge.log?.('Aggiornamento Temi ed Eventi');message('Temi ed Eventi salvati per tutti gli utenti. Le date si attiveranno anche con questo PC spento.');
    }catch(e){message(e.message||'Impossibile salvare. Verifica autorizzazioni e connessione.',true);}finally{busy=false;form.querySelector('[type="submit"]').disabled=false;}
});
section.addEventListener('click',async e=>{
    const preview=e.target.closest('[data-preview],[data-preview-home],[data-preview-game]');if(preview){
        try{const id=preview.dataset.preview||preview.dataset.previewHome||preview.dataset.previewGame;await setPreview(draft(),id);message('Anteprima privata attiva solo in questa scheda. Nessuna modifica pubblicata.');
            if(preview.dataset.previewHome)location.href='../index.html';if(preview.dataset.previewGame)location.href='../games/racing.html';
        }catch(error){message(error.message,true);}return;
    }
    if(e.target.closest('#eventsReload')){if(dirty&&!confirm('Scartare la bozza locale e ricaricare le impostazioni condivise?'))return;const settings=await bridge.reload();if(settings){render(settings);message('Impostazioni ricaricate.');}}
});
window.addEventListener('cuginiparty:site-settings',e=>{if(!dirty)render(e.detail);});
document.querySelector('[data-section="events"]').addEventListener('click',()=>{if(!base&&bridge.settings())render(bridge.settings());});
if(bridge.settings())render(bridge.settings());else message('Accedi all’Admin Center per caricare le impostazioni.');
