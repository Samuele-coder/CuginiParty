import {CAR_TYPES,TRACKS,DIFFICULTIES,QUALITY} from './racing-3d-data.js';

export const STORAGE_KEY='CuginiParty_racing3d_v1';
export function loadPreferences(storage) {
    const defaults={version:1,car:'street',track:'grand',difficulty:'normal',quality:'auto',records:{}};
    let raw;
    try{raw=JSON.parse(storage.getItem(STORAGE_KEY)||'null');}catch{return defaults;}
    if(!raw||typeof raw!=='object')return defaults;
    const valid=(value,list,fallback)=>list.includes(value)?value:fallback;
    const records={};
    for(const track of TRACKS){
        const r=raw.records?.[track.id];if(!r||typeof r!=='object')continue;
        const time=value=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null;
        records[track.id]={lap:time(r.lap),trialLap:time(r.trialLap),trialTotal:time(r.trialTotal)};
    }
    return {version:1,car:valid(raw.car,CAR_TYPES.map(c=>c.id),'street'),track:valid(raw.track,TRACKS.map(t=>t.id),'grand'),difficulty:valid(raw.difficulty,Object.keys(DIFFICULTIES),'normal'),quality:valid(raw.quality,Object.keys(QUALITY),'auto'),records};
}
export function savePreferences(storage,preferences) {try{storage.setItem(STORAGE_KEY,JSON.stringify(preferences));return true;}catch{return false;}}
export function updateRecords(preferences,track,mode,lap,total) {
    const previous=preferences.records[track]||{lap:null,trialLap:null,trialTotal:null};
    const best=(a,b)=>Number.isFinite(b)&&b>0?Math.min(a??Infinity,b):a;
    const record={...previous,lap:best(previous.lap,lap)};
    if(mode==='time'){record.trialLap=best(previous.trialLap,lap);record.trialTotal=best(previous.trialTotal,total);}
    preferences.records[track]=record;return record;
}
