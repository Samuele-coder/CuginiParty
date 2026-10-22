'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright'),{startServer,installFixture}=require('./platform-test-server.cjs');
const ids=(process.env.EVENT_SCENE_IDS||'halloween,christmas,epiphany,easter,newyear,carnival,valentine,summer').split(',');
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'cuginiparty-scenes-'));
const sizes=[[320,568],[375,667],[390,844],[430,932],[667,375],[844,390],[932,430],[768,1024],[1024,768],[1366,768],[1920,1080]];
(async()=>{
    const server=await startServer(),browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const context=await browser.newContext();await installFixture(context,true);
    const checks=[],errors=[],requests=[];
    const pass=message=>{checks.push(message);console.log('PASS '+message);};
    const open=async route=>{const page=await context.newPage();page.on('pageerror',e=>errors.push({route,message:e.message}));page.on('response',r=>{if(r.url().includes('/assets/events/'))requests.push({url:r.url(),status:r.status()});});await page.goto(server.origin+route);await page.waitForFunction(()=>window.CuginiPartyEvents);await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('/events.css')));return page;};
    const theme=async(page,id,dark=false,effects={})=>{await page.evaluate(({id,dark,effects})=>{window.applyTheme?.(dark);document.body.classList.toggle('dark-mode',dark);const row={...JSON.parse(localStorage.getItem('__event_test_db')||'{"id":1,"global_status":"online"}'),value:{theme_events:{events:[{id,mode:'manual',effects}]}}};localStorage.setItem('__event_test_db',JSON.stringify(row));window.CuginiPartyEvents.ingestSettings(row);},{id,dark,effects});await page.waitForTimeout(350);};
    try{
        let page=await open('/index.html');
        const normal=await page.evaluate(()=>({body:getComputedStyle(document.body).backgroundColor,hero:getComputedStyle(document.querySelector('.hero')).background,card:getComputedStyle(document.querySelector('.game-card')).background,bands:document.querySelectorAll('[data-event-visual]').length,links:[...document.querySelectorAll('.game-card .play-button')].map(e=>e.getAttribute('href'))}));
        assert.equal(normal.bands,0);
        for(const id of ids){
            for(const [width,height]of sizes){await page.setViewportSize({width,height});for(const dark of [false,true]){
                await theme(page,id,dark);
                const result=await page.evaluate(()=>{
                    const style=getComputedStyle(document.body),hero=document.querySelector('.hero'),rect=hero.getBoundingClientRect();
                    const wide=[...document.querySelectorAll('body *')].filter(el=>{if(el.closest('[data-event-visual]'))return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'&&(r.right>innerWidth+1||r.left<-1);}).map(e=>e.className).slice(0,5);
                    const grid=document.querySelector('.games-grid');
                    return {id:document.body.dataset.event,overflow:document.documentElement.scrollWidth-innerWidth,wide,scene:getComputedStyle(hero,'::before').backgroundImage,bands:['::before','::after'].filter(p=>getComputedStyle(grid,p).content!=='none').length,world:document.querySelectorAll('#event-world').length,particles:document.querySelectorAll('.event-particle').length,hero:{height:rect.height},links:[...document.querySelectorAll('.game-card .play-button')].map(e=>e.getAttribute('href'))};
                });
                assert.equal(result.id,id);assert.equal(result.overflow,0,`${id} ${width} overflow`);assert.deepEqual(result.wide,[],`${id} ${width} clipped content`);assert.ok(result.scene.includes(id));assert.equal(result.bands,2);assert.equal(result.world,1);assert.ok(result.particles<=12);assert.deepEqual(result.links,normal.links);
                if([[390,844],[1366,768]].some(([w,h])=>w===width&&h===height))await page.screenshot({path:path.join(artifacts,`${id}-home-${width}-${dark?'dark':'light'}.png`),animations:'disabled'});
            }}
            pass(id+': Home 11 sizes × light/dark; artwork, 2 catalogue bands, preserved game links and no overflow');
        }
        await theme(page,ids[0],false);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);
        assert.equal(await page.locator('#event-world').count(),1);assert.equal(await page.locator('[data-event-gallery]').count(),1);assert.equal(await page.locator('.event-character').first().evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('#event-atmosphere').count(),0);
        await page.emulateMedia({reducedMotion:'no-preference'});await theme(page,ids[0],false,{quality:'reduced'});assert.equal(await page.locator('#event-world').count(),1);assert.ok(await page.locator('.event-particle').count()<=5);
        await page.evaluate(()=>window.renderGameLinkStates());assert.equal(await page.locator('.games-grid > :not([data-game-id])').count(),0);assert.deepEqual(await page.locator('.game-card .play-button').evaluateAll(links=>links.map(link=>link.getAttribute('href'))),normal.links);
        await page.setViewportSize({width:390,height:844});await theme(page,ids[0],true);await page.locator('#mobileMenuButton').click();await page.locator('#mobileSettingsButton').click();
        const select=page.locator('.event-effects-setting select');await select.waitFor({state:'visible'});const colours=await select.evaluate(e=>({text:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));assert.notEqual(colours.text,colours.bg);await select.selectOption('off');assert.equal(await page.locator('#event-atmosphere').count(),0);assert.equal(await page.locator('#event-world').count(),1);await select.selectOption('auto');await page.locator('#closeSettingsButton').click();
        await theme(page,ids[0],false,{quality:'off'});assert.equal(await page.locator('#event-atmosphere').count(),0);assert.equal(await page.locator('#event-world').count(),1);
        await theme(page,ids[0],false,{static:false,quality:'off'});assert.equal(await page.locator('#event-world').count(),0);assert.equal(await page.locator('[data-event-visual]').count(),0);
        await page.evaluate(()=>{window.applyTheme(false);localStorage.removeItem('__event_test_db');window.CuginiPartyEvents.ingestSettings({id:1,value:null});});await page.waitForFunction(expected=>getComputedStyle(document.body).backgroundColor===expected,normal.body);
        assert.deepEqual(await page.evaluate(()=>({body:getComputedStyle(document.body).backgroundColor,hero:getComputedStyle(document.querySelector('.hero')).background,card:getComputedStyle(document.querySelector('.game-card')).background,bands:document.querySelectorAll('[data-event-visual]').length,links:[...document.querySelectorAll('.game-card .play-button')].map(e=>e.getAttribute('href'))})),normal);
        pass('Reduced motion/low quality preserve static identity; off/static flags work; normal design restores exactly');await page.close();
        page=await open('/admin/index.html');await page.locator('[data-section="events"]').click();await page.waitForFunction(()=>document.querySelectorAll('.event-editor').length===8);
        for(const id of ids){const preview=page.locator(`[data-scene-id="${id}"]`);await preview.scrollIntoViewIfNeeded();await preview.locator('img').evaluate(image=>image.decode());assert.equal(await preview.locator('.event-preview-components').count(),1);}
        await theme(page,ids[0]);for(const [width,height]of [[390,844],[1366,768]]){await page.setViewportSize({width,height});await page.locator('[data-event-id="halloween"]').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);await page.screenshot({path:path.join(artifacts,`admin-${width}.png`),animations:'disabled'});}
        pass('Admin: illustrated previews with real local artwork + UI samples, desktop/mobile accessible editors');await page.close();
        page=await open('/games/racing.html?debug=1');await page.waitForFunction(()=>window.racing3DDebug);
        for(const id of ids){await page.setViewportSize({width:844,height:390});await theme(page,id,true);assert.ok((await page.locator('#r3dMenu').evaluate(e=>getComputedStyle(e).backgroundImage)).includes(id));await page.screenshot({path:path.join(artifacts,`${id}-racing.png`),animations:'disabled'});}
        await page.locator('#r3dGarageButton').click();assert.ok(!(await page.locator('#r3dMenu').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('/assets/events/'));
        await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
        await page.locator('#r3dCarNext').click();await page.locator('#r3dStartButton').click();await page.locator('#r3dTrackNext').click();await page.locator('#r3dCarNext').click();await page.locator('#r3dRaceButton').click();for(let i=0;i<35;i++)await page.clock.runFor(100);assert.equal(await page.evaluate(()=>window.racing3DDebug.snapshot().state),'racing');
        assert.equal(await page.locator('#event-atmosphere').evaluate(e=>getComputedStyle(e).display),'none');assert.equal(await page.locator('[data-event-gallery]').count(),0);
        const visible=await page.evaluate(()=>[...document.querySelectorAll('[data-event-visual]')].filter(e=>getComputedStyle(e).pointerEvents!=='none'&&getComputedStyle(e).display!=='none').map(e=>e.className));assert.deepEqual(visible,[]);
        await page.keyboard.press('Escape');assert.ok(await page.locator('#r3dPause').isVisible());await page.screenshot({path:path.join(artifacts,'racing-pause.png'),animations:'disabled'});
        pass('Racing: all themed menus, original garage preview, real race starts, no decorative controls interception, pause works');await page.close();
        assert.deepEqual(errors,[]);const absent=requests.filter(r=>r.status>=400&&ids.some(id=>r.url.includes('/'+id+'-')));assert.deepEqual(absent,[]);
        // Early Halloween-only verification deliberately precedes production of the other seven assets.
        if(ids.length===8)assert.deepEqual(server.missing,[]);
        fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,errors,requests,missing:server.missing},null,2));console.log('ARTIFACTS '+artifacts);
    }finally{await context.close();await browser.close();await server.close();}
})().catch(error=>{console.error(error);console.error('ARTIFACTS '+artifacts);process.exitCode=1;});
