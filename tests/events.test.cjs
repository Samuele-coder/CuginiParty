'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
    const c=await import(pathToFileURL(path.resolve(__dirname,'../js/events-calendar.js')));
    assert.equal(c.EVENTS.length,8);assert.equal(new Set(c.EVENTS.map(e=>e.id)).size,8);
    assert.equal(c.activeEvents(null).length,0);
    for(const [year,day]of [[2025,'2025-04-20'],[2026,'2026-04-05'],[2027,'2027-03-28'],[2028,'2028-04-16']])assert.equal(c.easterSunday(year).toISOString().slice(0,10),day);
    assert.equal(c.romeInstant('2026-01-06T12:00'),'2026-01-06T11:00:00.000Z');
    assert.equal(c.romeInstant('2026-08-15T12:00'),'2026-08-15T10:00:00.000Z');
    assert.throws(()=>c.romeInstant('2026-03-29T02:30'),/inesistente/);
    assert.equal(c.romeInstant('2026-10-25T02:30'),'2026-10-25T00:30:00.000Z');
    assert.throws(()=>c.romeInstant('2026-02-30T10:00'));
    const scheduled=c.normalizeConfig({events:[{id:'halloween',mode:'scheduled',startAt:'2026-10-31T09:00:00Z',endAt:'2026-10-31T10:00:00Z'}]}).events[0];
    assert.equal(Boolean(c.isActive(scheduled,Date.parse(scheduled.startAt)-1)),false);assert.equal(Boolean(c.isActive(scheduled,Date.parse(scheduled.startAt))),true);assert.equal(Boolean(c.isActive(scheduled,Date.parse(scheduled.endAt))),false);
    assert.throws(()=>c.validateConfig({events:[{id:'halloween',mode:'scheduled',startAt:scheduled.endAt,endAt:scheduled.startAt}]}));
    const cfg=c.normalizeConfig(null),newyear=cfg.events.find(e=>e.id==='newyear');newyear.mode='annual';
    assert.ok(c.isActive(newyear,Date.parse('2027-01-01T12:00:00Z')));assert.equal(c.isActive(newyear,Date.parse('2027-01-03T12:00:00Z')),false);
    for(const id of ['easter','carnival']){const e=cfg.events.find(e=>e.id===id);e.mode='annual';for(const year of [2025,2026,2027,2028]){const w=c.annualWindow(e,year);assert.ok(w.end>w.start);assert.ok(c.isActive(e,w.start));assert.equal(c.isActive(e,w.end),false);}}
    const manual=cfg.events.find(e=>e.id==='halloween');manual.mode='manual';manual.priority=1000;
    assert.equal(c.activeEvents(cfg,Date.parse('2026-04-05T12:00:00Z'))[0].id,'halloween');manual.manualActive=false;assert.notEqual(c.activeEvents(cfg,Date.parse('2026-04-05T12:00:00Z'))[0]?.id,'halloween');
    assert.equal(c.normalizeConfig({events:[{id:'<script>',mode:'manual'},{id:'halloween',mode:'invalid',effects:{intensity:1e12}}]}).events[0].mode,'off');
    console.log('PASS: 8 events; Rome summer/winter/DST gap/fold; Easter/Carnival four years; scheduled start/end; annual year crossing; priority; manual off; invalid/corrupt config');
    const {RacingTrack}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-track.js'))),{createEnvironment}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-environment.js'))),{TRACKS,QUALITY}=await import(pathToFileURL(path.resolve(__dirname,'../js/racing-3d-data.js')));
    for(const t of TRACKS){const track=new RacingTrack(t.id),scene=createEnvironment(track,QUALITY.high);let terrainMax=-Infinity;
        for(const p of scene.userData.placements)assert.ok(track.nearest(p.x,p.z).distance>=track.halfWidth+p.radius+2.9,`${t.id}/${p.type} footprint on road`);
        for(const p of track.points)for(const lane of [-track.halfWidth*.9,0,track.halfWidth*.9]){const x=p.x+p.rx*lane,z=p.z+p.rz*lane;terrainMax=Math.max(terrainMax,scene.userData.groundHeight(x,z)-p.y);}
        assert.ok(terrainMax<.04,`${t.id}: terrain intrudes ${terrainMax}`);
        if(t.id==='alpine')assert.equal(scene.userData.placements.filter(p=>p.type==='mountain').length,16);
        console.log(`PASS ${t.id}: ${scene.userData.placements.length} grounded placements, terrain max relative road ${terrainMax.toFixed(3)} m`);
        const g=new Set(),m=new Set();scene.traverse(o=>{if(o.geometry)g.add(o.geometry);if(o.material)for(const x of [].concat(o.material))m.add(x);if(o.isInstancedMesh)o.dispose();});g.forEach(x=>x.dispose());m.forEach(x=>x.dispose());
    }
})().catch(e=>{console.error(e);process.exitCode=1;});
