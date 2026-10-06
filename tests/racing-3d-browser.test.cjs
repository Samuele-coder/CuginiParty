'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'racing3d-v1-'));
const route=process.env.RACING_URL||'/games/racing.html';
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png'};
const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(data);});
});
(async()=>{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const errors=[],checks=[],metrics=[];const pass=name=>{checks.push(name);console.log('PASS | '+name);};
    try{
        let context=await browser.newContext({viewport:{width:960,height:540}});
        await context.addInitScript(()=>{if(!localStorage.getItem('CuginiParty_racing3d_v1'))localStorage.setItem('CuginiParty_racing3d_v1',JSON.stringify({quality:'low'}));localStorage.setItem('CuginiParty_audio_enabled','false');});
        let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
        const snapshot=()=>page.evaluate(()=>window.racing3DDebug.snapshot());
        await page.goto(origin+route+'?debug=1');await page.waitForFunction(()=>window.racing3DDebug);
        await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
        const tick=async(ms=100)=>{for(let left=ms;left>0;left-=100)await page.clock.fastForward(Math.min(left,100));};
        // Visual captures run separately without a virtual clock; this suite
        // verifies real WebGL draws, DOM and full fixed-step races.
        const launch=async(mode='race')=>{
            await page.locator('[data-mode="'+mode+'"]').click();await page.locator('#r3dTrackNext').click();await page.locator('#r3dCarNext').click();
            if(mode==='race')await page.locator('#r3dRaceButton').click();await tick(100);
        };
        const leave=async()=>{
            const s=await snapshot();
            if(['racing','countdown'].includes(s.state)){await page.keyboard.press('Escape');await tick();}
            if((await snapshot()).state==='paused')await page.locator('#r3dExitButton').click();
            else if((await snapshot()).state==='finished')await page.locator('#r3dMenuButton').click();
            await tick();
        };
        assert.equal((await snapshot()).drawCalls>0,true);
        await page.locator('#r3dGarageButton').click();await tick(300);
        for(const car of ['street','gt','rally','muscle','formula','hyper']){
            await page.locator('#r3dCarList [data-value="'+car+'"]').click();await tick(200);const s=await snapshot();assert.equal(s.preferences.car,car);assert.equal(s.screen,'cars');

        }
        const angle=(await snapshot()).previewAngle;await tick(400);assert.ok((await snapshot()).previewAngle>angle);
        await page.locator('#r3dCarNext').click();await tick();
        pass('Garage: sei modelli renderizzati, anteprima rotante, statistiche e selezione persistente');
        await page.locator('#r3dSettingsButton').click();
        for(const quality of ['low','medium','high','auto']){await page.locator('#r3dQuality').selectOption(quality);await tick();const s=await snapshot();assert.equal(s.quality,quality);metrics.push({quality,...s, cars:undefined,preferences:undefined,input:undefined});}
        await page.locator('#r3dQuality').selectOption('low');await page.locator('#r3dSettings [data-back]').click();await tick();
        pass('Quattro qualità, selettore e controllo audio coerente con CuginiParty');
        await launch();await page.keyboard.down('w');await tick(1000);let s=await snapshot();assert.equal(s.state,'countdown');assert.equal(s.cars[0].speed,0);assert.equal(s.time,0);
        await tick(2500);s=await snapshot();assert.equal(s.state,'racing');assert.ok(s.cars[0].speed>3);assert.ok(s.cameraRight>0,'Driver-right projects to screen-right');
        await page.keyboard.down('d');const initial=s.cars[0].heading;await tick(300);s=await snapshot();assert.ok(Math.atan2(Math.sin(s.cars[0].heading-initial),Math.cos(s.cars[0].heading-initial))<0);
        await page.keyboard.up('d');const steer=Math.abs(s.cars[0].steering);await tick(200);assert.ok(Math.abs((await snapshot()).cars[0].steering)<steer);
        const beforeLeft=(await snapshot()).cars[0].heading;await page.keyboard.down('a');await tick(400);await page.keyboard.up('a');
        assert.ok(Math.atan2(Math.sin((await snapshot()).cars[0].heading-beforeLeft),Math.cos((await snapshot()).cars[0].heading-beforeLeft))>0);
        await page.keyboard.up('w');await page.keyboard.down('s');await tick(1800);assert.ok((await snapshot()).cars[0].speed<0);await page.keyboard.up('s');
        await page.keyboard.press('Escape');await tick();const frozen=(await snapshot()).time;await tick(1000);assert.equal((await snapshot()).time,frozen);
        await page.locator('#r3dResetButton').click();await tick();assert.equal((await snapshot()).cars[0].recoveries,1);
        await leave();pass('Tastiera: countdown fermo, gas, destra coerente con camera, ritorno al centro, freno/retro, pausa e recupero');
        const inspect=()=>page.evaluate(()=>{
            const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
            const panel=[...document.querySelectorAll('#r3dMenu [data-screen]')].find(e=>!e.hidden);
            const style=getComputedStyle(panel);
            return {overflow:document.documentElement.scrollWidth-innerWidth,canvas:rect(document.getElementById('r3dCanvas')),panel:rect(panel),text:style.color,surface:style.backgroundColor,controls:[...document.querySelectorAll('[data-drive]')].map(rect),hud:rect(document.querySelector('.r3d-stats')),map:rect(document.getElementById('r3dMinimap'))};
        });
        for(const [width,height]of [[1920,1080],[1366,768],[1024,768],[768,1024],[844,390],[800,360],[390,844]]){
            await page.setViewportSize({width,height});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick();
            for(const dark of [false,true]){
                await page.evaluate(d=>window.applyTheme(d),dark);await tick();
                let layout=await inspect();assert.equal(layout.overflow,0);assert.notEqual(layout.text,layout.surface);assert.equal(layout.canvas.width,width);assert.equal(layout.canvas.height,height);
                await page.locator('#r3dStartButton').click();await tick();layout=await inspect();assert.equal(layout.overflow,0);
                assert.equal(await page.locator('#r3dTrackList .r3d-choice').count(),5);
                await page.locator('#r3dTrackNext').click();await tick();layout=await inspect();assert.equal(layout.overflow,0);
                await page.locator('#r3dCarNext').click();await page.locator('#r3dRaceButton').click();await page.clock.runFor(3300);
                s=await snapshot();
                if(width<height&&width<=900){
                    assert.equal(s.state,'paused');assert.equal(s.portraitPaused,true);assert.ok(await page.locator('#r3dOrientation').isVisible());
                    await page.setViewportSize({width:height,height:width});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
                    for(let wait=0;wait<60&&(await snapshot()).state!=='racing';wait++)await page.clock.runFor(100);
                    assert.equal((await snapshot()).state,'racing');assert.equal((await snapshot()).portraitPaused,false);
                }else{
                    assert.equal(s.state,'racing');layout=await inspect();
                    if(width<=900)for(const control of layout.controls){assert.ok(control.width>=44&&control.height>=44);assert.ok(control.x>=0&&control.right<=width&&control.bottom<=height);assert.ok(control.y>=layout.hud.bottom,'Touch below HUD');assert.ok(control.y>=layout.map.bottom||control.x>=layout.map.right||control.right<=layout.map.x,'Touch does not overlap map');}
                }

                await leave();await page.setViewportSize({width,height});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick();
            }
            pass(width+'×'+height+' chiaro/scuro: menu, piste, garage, HUD, orientamento, no overflow');
        }
        await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick();await launch();await page.clock.runFor(3200);
        const cdp=await context.newCDPSession(page);
        const touch=async(actions)=>{
            const points=[];for(let i=0;i<actions.length;i++){const b=await page.locator('[data-drive="'+actions[i]+'"]').boundingBox();points.push({x:b.x+b.width/2,y:b.y+b.height/2,id:i+1});}
            await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await tick(650);
            const state=await snapshot();await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await tick();return state;
        };
        s=await touch(['right','throttle']);assert.equal(s.pointers,2);assert.equal(s.input.steer,1);assert.equal(s.input.throttle,1);assert.ok(s.cars[0].steering>0);
        s=await touch(['left','brake']);assert.equal(s.pointers,2);assert.equal(s.input.steer,-1);assert.equal(s.input.brake,1);
        assert.equal((await snapshot()).pointers,0);await cdp.detach();await leave();
        pass('CDP multitouch reale: sterzo+gas, sterzo+freno, cancellazione e rilascio');
        await launch();await page.clock.runFor(3200);await page.keyboard.press('Escape');await tick();
        await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick();await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick();
        assert.equal((await snapshot()).state,'paused');await page.locator('#r3dExitButton').click();await tick();
        pass('Una pausa manuale non viene annullata dalla rotazione');
        // Real rendered race, production keys only: analogue suggestion is PWM
        // quantised by the test driver, never writes car position or checkpoints.
        await page.setViewportSize({width:640,height:360});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await tick();await launch('time');await page.clock.runFor(3100);
        const held=new Set();let debt=0;
        const driveTouch=await context.newCDPSession(page),touchBands=new Set();
        const sendTouch=async side=>{
            const points=[];
            for(const [id,action]of [[1,side],[2,'throttle']]){const b=await page.locator('[data-drive="'+action+'"]').boundingBox();points.push({id,x:b.x+b.width/2,y:b.y+b.height/2});}
            await driveTouch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
        };
        for(let frame=0;frame<2400;frame++){
            const data=await page.evaluate(()=>({state:window.racing3DDebug.snapshot().state,speed:window.racing3DDebug.snapshot().cars[0].speed,...window.racing3DDebug.suggestion()}));
            if(data.state==='finished')break;assert.equal(data.state,'racing');
            const band=data.speed>=30?'high':data.speed>=16&&data.speed<24?'medium':data.speed>=4&&data.speed<12?'low':null;
            if(band&&!touchBands.has(band)){
                for(const k of held)await page.keyboard.up(k);held.clear();
                await sendTouch('right');await page.clock.runFor(350);let touch=await snapshot();assert.equal(touch.pointers,2);assert.ok(touch.cars[0].steering>0);assert.equal(touch.input.throttle,1);
                await driveTouch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
                await sendTouch('left');await page.clock.runFor(450);touch=await snapshot();assert.equal(touch.pointers,2);assert.ok(touch.cars[0].steering<0);
                await driveTouch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.clock.runFor(32);assert.equal((await snapshot()).pointers,0);
                touchBands.add(band);console.log('PASS | multitouch both directions at '+band+' speed ('+data.speed.toFixed(1)+' m/s)');continue;
            }
            debt+=data.steer;const direction=debt>.5?1:debt<-.5?-1:0;debt-=direction;
            const want=new Set([...(data.throttle?['w']:[]),...(data.brake>.15?['s']:[]),...(direction>0?['d']:direction<0?['a']:[])]);
            for(const k of held)if(!want.has(k)){await page.keyboard.up(k);held.delete(k);}
            for(const k of want)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
            await tick();
            if(frame%300===0)console.log('Key-driven race seconds',(await snapshot()).time.toFixed(1));
        }
        for(const k of held)await page.keyboard.up(k);
        await driveTouch.detach();assert.equal(touchBands.size,3);
        s=await snapshot();assert.equal(s.state,'finished');assert.equal(s.cars[0].completedLaps,3);assert.equal(s.cars[0].gatesPassed,61);assert.equal(s.cars[0].recoveries,0);assert.equal(s.cars.length,1);
        assert.ok(s.preferences.records[s.track].trialTotal>0);assert.ok(s.preferences.records[s.track].trialLap>0);
        await page.locator('#r3dAgainButton').click();await tick();assert.equal((await snapshot()).state,'countdown');await leave();
        const record=s.preferences.records;await page.reload();await page.waitForFunction(()=>window.racing3DDebug);await tick();assert.deepEqual((await snapshot()).preferences.records,record);
        pass('Time Trial completo da tastiera: 61 gate, 3 giri, nessun recupero, record/risultati/replay e persistenza dopo reload');
        // AI option is explicitly debug-only, exercised for full live UI races.
        // Playwright's clock is context-wide. Give this suite a fresh context,
        // preserving storage but not reinstalling a clock at an earlier date.
        const persisted=await context.storageState();await context.close();
        context=await browser.newContext({viewport:{width:640,height:360},storageState:persisted});
        page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
        await page.goto(origin+route+'?debug=1&ai=1');await page.waitForFunction(()=>window.racing3DDebug);
        await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await tick();
        const resource=[];
        for(const track of ['grand','canyon','city','alpine','neon']){
            await page.locator('#r3dStartButton').click();await page.locator('#r3dTrackList [data-value="'+track+'"]').click();await page.locator('#r3dTrackNext').click();await page.locator('#r3dCarNext').click();await page.locator('#r3dDifficultyList [data-value="hard"]').click();await page.locator('#r3dRaceButton').click();await page.clock.runFor(3200);
            for(let frame=0;frame<2000;frame++){
                s=await snapshot();if(s.cars.every(c=>c.finishTime!==null))break;await tick();
                if(frame===40){metrics.push({track,...await snapshot(),cars:undefined,preferences:undefined,input:undefined});}
            }
            s=await snapshot();assert.ok(s.cars.every(c=>c.finishTime!==null&&c.gatesPassed===61));assert.equal(await page.locator('#r3dStandings li').count(),6);
            assert.ok((await page.locator('#r3dResultsStatus').textContent()).includes('tutti'));
            await page.locator('#r3dChangeTrack').click();await tick();assert.equal((await snapshot()).screen,'tracks');await page.locator('#r3dTracks [data-back]').click();await tick();resource.push({track,geometries:(await snapshot()).geometries,textures:(await snapshot()).textures});
            pass(track+': gara 3 giri renderizzata, tutti i bot arrivati, classifica aggiornata, cambia pista');
        }
        // Repeated rebuilds of the same configuration must have stable counts.
        const heapSession=await context.newCDPSession(page);await heapSession.send('HeapProfiler.collectGarbage');
        const heapBefore=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);
        const counts=[];
        for(let i=0;i<5;i++){await page.locator('#r3dGarageButton').click();await tick();await page.clock.runFor(32);counts.push((await snapshot()).geometries);await page.locator('#r3dCarNext').click();await tick();}
        assert.ok(counts.every(n=>n>0));assert.equal(new Set(counts).size,1);pass('Geometrie stabili dopo cinque ricostruzioni; texture esterne zero');
        await heapSession.send('HeapProfiler.collectGarbage');const heapAfter=await page.evaluate(()=>performance.memory?.usedJSHeapSize??null);await heapSession.detach();
        const tab=await context.newPage();await tab.goto(origin+route);await tab.waitForFunction(()=>!document.getElementById('r3dStartButton').disabled);
        assert.equal(await tab.evaluate(()=>window.racing3DDebug===undefined&&document.getElementById('r3dDebug').hidden),true);
        await tab.evaluate(()=>localStorage.setItem('CuginiParty_dark_mode','false'));await tick();assert.equal(await page.evaluate(()=>document.body.classList.contains('dark-mode')),false);
        await tab.evaluate(()=>localStorage.setItem('CuginiParty_dark_mode','true'));await tick();assert.equal(await page.evaluate(()=>document.body.classList.contains('dark-mode')),true);await tab.close();
        pass('Debug spento normalmente; tema live fra schede sulla chiave esistente');
        assert.deepEqual(errors,[]);pass('Nessun errore JavaScript nei flussi eseguiti');
        fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,metrics,resource,counts,heapBefore,heapAfter,errors},null,2));
        console.log('ARTIFACTS '+artifacts);
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);console.error('ARTIFACTS '+artifacts);server.close();process.exitCode=1;});
