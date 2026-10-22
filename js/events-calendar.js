// Pure calendar/configuration layer. No DOM, storage or second light/dark theme.
export const TIME_ZONE = 'Europe/Rome';
export const EVENTS = Object.freeze([
    {id:'halloween',name:'Halloween',dates:['10-20','11-03'],colors:['#f3ebfc','#261b32','#8d3e08','#ffb454'],art:['pumpkin','bat','ghost']},
    {id:'christmas',name:'Natale',dates:['12-08','12-28'],colors:['#fff8ed','#122b29','#20633b','#f2d283'],art:['tree','snow','star']},
    {id:'epiphany',name:'Epifania / Befana',dates:['01-02','01-08'],colors:['#f4f3ff','#191e3c','#5346a2','#d6c4ff'],art:['stocking','star','broom']},
    {id:'easter',name:'Pasqua',anchor:'easter',offsets:[-7,2],colors:['#f7fbef','#1d302b','#456727','#c0e6a0'],art:['egg','flower','bunny']},
    {id:'newyear',name:'Capodanno',dates:['12-28','01-02'],colors:['#fffbed','#152239','#785d0b','#f4d77b'],art:['spark','star','confetti']},
    {id:'carnival',name:'Carnevale',anchor:'carnival',offsets:[-7,1],colors:['#fff3fc','#2e203a','#923574','#f3b5dd'],art:['mask','confetti','ribbon']},
    {id:'valentine',name:'San Valentino',dates:['02-07','02-16'],colors:['#fff3f6','#321f2d','#ab2c51','#ffb4ce'],art:['heart','flower','spark']},
    {id:'summer',name:'Ferragosto',dates:['08-10','08-18'],colors:['#effcfc','#15313b','#066b72','#8ee5de'],art:['sun','wave','shell']}
]);
const modes = ['off','manual','scheduled','annual'];
const formatter = new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function romeParts(date) {return Object.fromEntries(formatter.formatToParts(new Date(date)).filter(p=>p.type!=='literal').map(p=>[p.type,+p.value]));}
export function romeInput(date) {const p=romeParts(date);return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`;}
export function romeInstant(input) {
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input))throw Error('Inserisci data e ora valide (Europe/Rome).');
    const [y,m,d,h,n]=input.match(/\d+/g).map(Number),nominal=Date.UTC(y,m-1,d,h,n);
    let guess=nominal;
    for(let i=0;i<3;i++){const p=romeParts(guess);guess+=nominal-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);}
    // DST gaps are rejected, never silently shifted. A repeated autumn hour
    // resolves to its first occurrence; the editor states this explicitly.
    const matches=[guess-3600000,guess,guess+3600000].filter(t=>romeInput(t)===input);
    if(!matches.length)throw Error('Ora inesistente nel cambio d’ora Europe/Rome. Scegli un altro orario.');
    return new Date(Math.min(...matches)).toISOString();
}
export function easterSunday(year) {
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),v=h+l-7*m+114;
    return new Date(Date.UTC(year,Math.floor(v/31)-1,v%31+1,12));
}
const integer=(v,min,max,fallback)=>Number.isFinite(+v)?Math.max(min,Math.min(max,Math.round(+v))):fallback;
const time=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:'00:00';
const monthDay=v=>/^\d{2}-\d{2}$/.test(v)&&(()=>{const [m,d]=v.split('-').map(Number),n=new Date(Date.UTC(2000,m-1,d));return n.getUTCMonth()===m-1&&n.getUTCDate()===d;})();
export function defaultEvent(def,index=0) {return {id:def.id,mode:'off',manualActive:true,priority:100-index,startAt:null,endAt:null,annual:{anchor:def.anchor||'fixed',startMonthDay:def.dates?.[0]||'01-01',endMonthDay:def.dates?.[1]||'01-02',startOffset:def.offsets?.[0]||0,endOffset:def.offsets?.[1]||1,startTime:'00:00',endTime:'00:00'},effects:{static:true,particles:true,special:true,intensity:40,quality:'auto'}};}
export function normalizeConfig(raw) {
    const rows=Array.isArray(raw?.events)?raw.events:[];
    return {version:1,events:EVENTS.map((def,i)=>{
        const d=defaultEvent(def,i),v=rows.find(v=>v?.id===def.id)||{},a=v.annual||{},fx=v.effects||{};
        return {...d,mode:modes.includes(v.mode)?v.mode:'off',manualActive:v.manualActive!==false,priority:integer(v.priority,0,1000,d.priority),startAt:Number.isFinite(Date.parse(v.startAt))?new Date(v.startAt).toISOString():null,endAt:Number.isFinite(Date.parse(v.endAt))?new Date(v.endAt).toISOString():null,
            annual:{anchor:['fixed','easter','carnival'].includes(a.anchor)?a.anchor:d.annual.anchor,startMonthDay:monthDay(a.startMonthDay)?a.startMonthDay:d.annual.startMonthDay,endMonthDay:monthDay(a.endMonthDay)?a.endMonthDay:d.annual.endMonthDay,startOffset:integer(a.startOffset,-90,90,d.annual.startOffset),endOffset:integer(a.endOffset,-90,90,d.annual.endOffset),startTime:time(a.startTime),endTime:time(a.endTime)},
            effects:{static:fx.static!==false,particles:fx.particles!==false,special:fx.special!==false,intensity:integer(fx.intensity,0,100,40),quality:['auto','reduced','off'].includes(fx.quality)?fx.quality:'auto'}};
    })};
}
function dateInput(year,md,t){return `${year}-${md}T${t}`;}
function shifted(date,days,t){const d=new Date(+date+days*86400000);return `${d.toISOString().slice(0,10)}T${t}`;}
export function annualWindow(event,year) {
    const a=event.annual;
    if(a.anchor==='fixed'){
        const start=romeInstant(dateInput(year,a.startMonthDay,a.startTime));
        const sameYearEnd=dateInput(year,a.endMonthDay,a.endTime);
        const end=romeInstant(sameYearEnd<=dateInput(year,a.startMonthDay,a.startTime)?dateInput(year+1,a.endMonthDay,a.endTime):sameYearEnd);
        return {start:+new Date(start),end:+new Date(end)};
    }
    const base=new Date(+easterSunday(year)-(a.anchor==='carnival'?47:0)*86400000);
    return {start:Date.parse(romeInstant(shifted(base,a.startOffset,a.startTime))),end:Date.parse(romeInstant(shifted(base,a.endOffset,a.endTime)))};
}
export function isActive(event,now=Date.now()) {
    if(event.mode==='manual')return event.manualActive;
    if(event.mode==='scheduled')return event.startAt&&event.endAt&&Date.parse(event.startAt)<=now&&now<Date.parse(event.endAt);
    if(event.mode!=='annual')return false;
    const y=romeParts(now).year;
    return [y-1,y,y+1].some(year=>{try{const w=annualWindow(event,year);return w.start<=now&&now<w.end;}catch{return false;}});
}
export function activeEvents(config,now=Date.now()) {return normalizeConfig(config).events.filter(e=>isActive(e,now)).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));}
export function validateConfig(config) {
    for(const row of Array.isArray(config?.events)?config.events:[]){
        if(row.mode==='annual'&&row.annual?.anchor==='fixed'&&(!monthDay(row.annual.startMonthDay)||!monthDay(row.annual.endMonthDay)))throw Error('Inserisci date annuali valide nel formato MM-GG.');
    }
    const c=normalizeConfig(config);
    for(const e of c.events){
        if(e.mode==='scheduled'&&(!e.startAt||!e.endAt||Date.parse(e.endAt)<=Date.parse(e.startAt)))throw Error(`${EVENTS.find(d=>d.id===e.id).name}: la fine deve seguire l’inizio.`);
        if(e.mode==='annual'&&e.annual.anchor!=='fixed'&&e.annual.endOffset<=e.annual.startOffset)throw Error('Il termine annuale deve seguire l’inizio.');
        if(e.mode==='annual'){const current=romeParts(Date.now()).year;for(let year=current;year<current+9;year++)annualWindow(e,year);}
    }
    return c;
}
