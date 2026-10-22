'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright'),{startServer,installFixture}=require('./platform-test-server.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'cuginiparty-wordle-classic-'));
const roundKey='cuginiparty_wordle_round_v2',statsKey='cuginiparty_wordle_stats_v1';
(async()=>{
    const server=await startServer(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1366,height:768}});context.setDefaultTimeout(15000);await installFixture(context,true);
    const page=await context.newPage(),errors=[],checks=[],timings=[];page.on('pageerror',e=>errors.push(e.message));
    const pass=label=>{checks.push(label);console.log('PASS '+label);};
    async function seed(solution='CASSA',guesses=[],extra={}){
        await page.evaluate(({solution,guesses,extra,roundKey})=>localStorage.setItem(roundKey,JSON.stringify({version:2,solution,guesses,guess:'',length:solution.length,difficulty:'common',recent:[solution],selection:String(solution.length),...extra})),{solution,guesses,extra,roundKey});
        await page.reload();await page.waitForSelector('.wordle-row');await page.locator('#wordleBoard').click({position:{x:10,y:10}});
    }
    const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),roundKey);
    const stats=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),statsKey);
    const type=async word=>{await page.keyboard.type(word);await page.keyboard.press('Enter');};
    const phase=async value=>page.waitForFunction(value=>document.getElementById('wordleBoard').dataset.phase===value,value);
    const settleTheme=()=>page.evaluate(async()=>{await new Promise(requestAnimationFrame);for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();await new Promise(requestAnimationFrame);});
    try{
        await page.goto(server.origin+'/games/wordle.html');await page.waitForSelector('.wordle-row');
        await page.evaluate(({statsKey})=>localStorage.setItem(statsKey,JSON.stringify({played:12,wins:8,streak:2,bestStreak:4,legacyMarker:'preserved'})),{statsKey});
        await seed();await page.keyboard.type('CA');
        const pop=await page.locator('.wordle-cell').nth(1).evaluate(cell=>({filled:cell.classList.contains('filled'),frames:cell.getAnimations().flatMap(a=>a.effect.getKeyframes().map(f=>f.transform))}));assert.equal(pop.filled,true);assert.ok(pop.frames.some(f=>f.includes('scale')));
        await page.keyboard.press('Enter');assert.equal((await state()).guesses.length,0);assert.match(await page.locator('#wordleStatus').textContent(),/Non abbastanza lettere/);assert.equal(await page.locator('.wordle-row').first().getAttribute('data-animation'),'shake');
        await page.keyboard.press('Backspace');assert.equal(await page.locator('.wordle-cell').nth(1).textContent(),'');assert.equal(await page.locator('.wordle-cell').nth(1).getAttribute('class'),'wordle-cell');pass('Typing pop, stronger filled border, erase, incomplete-row shake without consuming an attempt');

        await seed();await page.keyboard.type('CASCO');
        await page.evaluate(()=>{window.__flips=[];const start=performance.now();new MutationObserver(records=>{for(const r of records)if(r.attributeName==='data-result'&&r.target.classList.contains('wordle-cell'))__flips.push({column:[...r.target.parentElement.children].indexOf(r.target),kind:r.target.dataset.result,at:performance.now()-start});}).observe(document.getElementById('wordleBoard'),{subtree:true,attributes:true,attributeFilter:['data-result']});});
        await page.keyboard.press('Enter');
        // Pause/seek the actual native CSS-transform animation: no production
        // debug hooks or fake guessed colours are involved.
        const before=await page.evaluate(()=>{
            const cell=document.querySelector('.wordle-cell'),animation=cell.getAnimations()[0];animation.pause();animation.currentTime=70;
            return {result:cell.dataset.result||null,bg:getComputedStyle(cell).backgroundColor,key:document.querySelector('[data-key="C"]').dataset.result||null,transform:getComputedStyle(cell).transform,frames:animation.effect.getKeyframes().map(f=>f.transform)};
        });
        assert.equal(before.result,null);assert.equal(before.key,null);assert.ok(before.frames.includes('rotateX(90deg)'));assert.notEqual(before.transform,'none');
        assert.equal(await page.locator('#wordleNewGame').isDisabled(),true);const originalId=(await state()).roundId;
        await page.evaluate(()=>document.getElementById('wordleNewGame').dispatchEvent(new Event('click')));await page.keyboard.type('ZZZZZ');await page.keyboard.press('Enter');assert.equal((await state()).guesses.length,1);assert.equal((await state()).roundId,originalId);
        await page.evaluate(async()=>{document.querySelector('.wordle-cell').getAnimations()[0].finish();await Promise.resolve();});
        const midpoint=await page.locator('.wordle-cell').first().evaluate(cell=>{const a=cell.getAnimations()[0];a.pause();a.currentTime=0;return {result:cell.dataset.result,bg:getComputedStyle(cell).backgroundColor,key:document.querySelector('[data-key="C"]').dataset.result,frames:a.effect.getKeyframes().map(f=>f.transform),next:cell.nextElementSibling.dataset.result||null};});
        assert.equal(midpoint.result,'correct');assert.equal(midpoint.bg,'rgb(106, 170, 100)');assert.equal(midpoint.key,'correct');assert.ok(midpoint.frames.includes('rotateX(-90deg)'));assert.equal(midpoint.next,null);
        await page.evaluate(()=>document.querySelector('.wordle-cell').getAnimations()[0].play());await phase('typing');
        assert.deepEqual(await page.locator('.wordle-row').first().locator('.wordle-cell').evaluateAll(es=>es.map(e=>e.dataset.result)),['correct','correct','correct','absent','absent']);
        const trace=await page.evaluate(()=>__flips);timings.push(trace);assert.deepEqual(trace.map(v=>v.column),[0,1,2,3,4]);assert.ok(trace.every((v,i)=>!i||v.at>trace[i-1].at+200));
        assert.equal((await stats()).played,12);pass('Sequential native rotateX flip; neutral before midpoint; result/key commit edge-on; no mirrored face; input/reset locked; duplicate letters correct');

        await type('ZZZZZ');await phase('typing');assert.equal((await state()).guesses.at(-1),'ZZZZZ');await page.reload();await page.waitForSelector('.wordle-row');assert.equal((await state()).guesses.at(-1),'ZZZZZ');assert.equal(await page.locator('[data-key="C"]').getAttribute('data-result'),'correct');
        await page.locator('#wordleBoard').click();await type('CACCC');await phase('typing');assert.equal(await page.locator('[data-key="C"]').getAttribute('data-result'),'correct');pass('Non-dictionary sequences accepted and restored; green keyboard priority survives later excess/absent occurrences');

        await seed();await type('CASSA');assert.equal((await stats()).played,12);assert.doesNotMatch(await page.locator('#wordleStatus').textContent(),/Hai trovato/);
        await phase('celebrating');assert.equal(await page.locator('.wordle-cell.correct').count(),5);assert.match(await page.locator('#wordleStatus').textContent(),/Hai trovato CASSA/);assert.equal((await stats()).played,13);assert.equal((await stats()).wins,9);assert.equal((await stats()).legacyMarker,'preserved');
        const bounce=await page.locator('.wordle-cell.correct').evaluateAll(es=>es.map(e=>e.getAnimations().map(a=>({delay:a.effect.getTiming().delay,frames:a.effect.getKeyframes().map(f=>f.transform)}))));assert.ok(bounce.every(a=>a.some(v=>v.frames.some(f=>f.includes('-20px')))));assert.deepEqual(bounce.map(a=>a[0].delay),[0,65,130,195,260]);
        await phase('finished');assert.equal(await page.locator('#wordleNewGame').isDisabled(),false);assert.equal(await page.locator('#wordleBoard').evaluate(e=>e.getAnimations({subtree:true}).length),0);await page.reload();await page.waitForSelector('.wordle-row');assert.equal((await stats()).played,13);pass('Victory only after every flip; sequential green bounce; one stats update; reload never double-counts');

        await seed('CASSA',['ZZZZZ','QQQQQ','XXXXX','YYYYY','JJJJJ']);await page.locator('#wordleBoard').click();await type('VVVVV');assert.equal((await stats()).played,13);assert.doesNotMatch(await page.locator('#wordleStatus').textContent(),/La parola era/);await phase('finished');assert.match(await page.locator('#wordleStatus').textContent(),/La parola era CASSA/);assert.equal((await stats()).played,14);assert.equal((await stats()).streak,0);pass('Defeat waits for last-row reveal; secret shown afterward; streak resets');

        await seed();await type('CASSA');await page.reload();await page.waitForSelector('.wordle-row');assert.equal((await stats()).played,15);assert.equal((await stats()).wins,10);assert.equal(await page.locator('#wordleBoard').getAttribute('data-phase'),'finished');await page.reload();await page.waitForSelector('.wordle-row');assert.equal((await stats()).played,15);pass('Reload during winning reveal settles the committed result exactly once');
        await seed();await type('CASCO');await page.emulateMedia({reducedMotion:'reduce'});await phase('typing');assert.equal(await page.locator('.wordle-row').first().locator('[data-result]').count(),5);assert.equal(await page.locator('#wordleBoard').evaluate(e=>e.getAnimations({subtree:true}).length),0);await page.locator('#wordleNewGame').click();assert.equal(await page.locator('[data-result]').count(),0);await page.waitForTimeout(400);assert.equal(await page.locator('[data-result]').count(),0);pass('Reduced-motion live change settles/cancels pending animations; reset has no stale callbacks');

        const lexicon=await import(pathToFileURL(path.resolve(__dirname,'../js/wordle-lexicon.js')));
        for(const [width,height]of [[320,568],[360,800],[390,844],[844,390],[768,1024],[1366,768]])for(const size of [4,5,6,7,8]){
            await page.setViewportSize({width,height});await page.locator('#wordleLength').selectOption(String(size));await page.locator('#wordleNewGame').click();await page.locator('#wordleBoard').click();await type('Z'.repeat(size));await phase('typing');assert.equal(await page.locator('.wordle-cell').count(),size*(size<=5?6:size===6?7:8));assert.ok(lexicon.ACCEPTED_WORDS.includes((await state()).solution));
            const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,bad:[...document.querySelectorAll('.wordle-cell,.wordle-key')].filter(e=>{const r=e.getBoundingClientRect();return r.x<0||r.right>innerWidth+1||e.classList.contains('wordle-cell')&&Math.abs(r.width-r.height)>1||e.classList.contains('wordle-key')&&r.height<44;}).map(e=>e.className)}));assert.equal(geometry.overflow,0);assert.deepEqual(geometry.bad,[]);
        }pass('Lengths 4–8 × 6 desktop/mobile/landscape/tablet viewports; valid secret pools, arbitrary attempts, square cells, keys ≥44px, no horizontal overflow');

        await page.setViewportSize({width:390,height:844});await seed('CASSA',['CASCO','AMACA']);
        const expected=['rgb(106, 170, 100)','rgb(201, 180, 88)','rgb(120, 124, 126)'];
        for(const event of [null,'halloween','christmas','epiphany','easter','newyear','carnival','valentine','summer'])for(const dark of [false,true]){
            await page.evaluate(({event,dark})=>{CuginiPartyEvents.ingestSettings({id:1,value:null});applyTheme(dark);if(event)CuginiPartyEvents.ingestSettings({id:1,value:{theme_events:{events:[{id:event,mode:'manual'}]}}});},{event,dark});
            await settleTheme();
            const palette=await page.evaluate(()=>['correct','present','absent'].map(kind=>getComputedStyle(document.querySelector('.wordle-cell.'+kind)).backgroundColor));assert.deepEqual(palette,expected);
            const contrast=await page.evaluate(()=>{
                const luminance=colour=>colour.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
                return [...document.querySelectorAll('.wordle-cell[data-result],.wordle-key[data-result]')].map(element=>{const style=getComputedStyle(element),a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
            });assert.ok(contrast.every(ratio=>ratio>=4.5));
            if(event==='halloween'&&dark){await page.evaluate(()=>document.querySelectorAll('.wordle-key').forEach(key=>key.disabled=true));assert.ok((await page.locator('.wordle-key').evaluateAll(keys=>keys.map(key=>getComputedStyle(key).opacity))).every(opacity=>opacity==='1'));await page.evaluate(()=>document.querySelectorAll('.wordle-key').forEach(key=>key.disabled=false));}
            if(event==='halloween'&&!dark)await page.screenshot({path:path.join(out,'halloween-mobile.png'),fullPage:true});
        }
        await page.evaluate(()=>{CuginiPartyEvents.ingestSettings({id:1,value:null});applyTheme(false);});await settleTheme();await page.screenshot({path:path.join(out,'classic-mobile.png'),fullPage:true});await page.setViewportSize({width:1366,height:768});await page.screenshot({path:path.join(out,'classic-desktop.png'),fullPage:true});pass('Exact functional palette and ≥4.5:1 result text contrast across 8 holidays and both personal theme preferences; disabled keys do not fade');

        await page.emulateMedia({reducedMotion:'no-preference'});await seed();await type('AMACA');await phase('typing');assert.equal(await page.locator('[data-key="C"]').getAttribute('data-result'),'present');await type('ZZZZC');await phase('typing');assert.equal(await page.locator('[data-key="C"]').getAttribute('data-result'),'present');pass('Yellow keyboard priority survives a later grey occurrence');
        const oldPlayed=(await stats()).played;await seed('CASSA',['CASSA']);assert.equal((await stats()).played,oldPlayed);pass('Legacy completed version-2 saves keep their existing statistics without recounting');
        await seed();await type('CASCO');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await phase('typing');assert.equal(await page.locator('.wordle-row').first().locator('[data-result]').count(),5);assert.equal(await page.locator('#wordleBoard').evaluate(e=>e.getAnimations({subtree:true}).length),0);await page.locator('#wordleNewGame').click();await page.waitForTimeout(400);assert.equal(await page.locator('[data-result]').count(),0);pass('Page-exit lifecycle event settles committed guesses, cancels pending effects, and cannot repaint a new round');

        const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await installFixture(mobile);const touchPage=await mobile.newPage();touchPage.on('pageerror',e=>errors.push(e.message));await touchPage.goto(server.origin+'/games/wordle.html');await touchPage.waitForSelector('.wordle-row');
        assert.equal(await touchPage.locator('[data-key="BACKSPACE"] svg').count(),1);await touchPage.locator('[data-key="Z"]').tap();await touchPage.locator('[data-key="BACKSPACE"]').tap();assert.equal(await touchPage.locator('.wordle-row').first().textContent(),'');for(let i=0;i<5;i++)await touchPage.locator('[data-key="Z"]').tap();await touchPage.locator('[data-key="ENTER"]').tap();await touchPage.waitForFunction(()=>document.getElementById('wordleBoard').dataset.phase==='typing');assert.equal(await touchPage.locator('.wordle-row').first().textContent(),'ZZZZZ');await mobile.close();pass('Real touch taps for letters, SVG delete and submit, with reduced motion');
        assert.deepEqual(errors,[]);assert.deepEqual(server.missing,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,timings,errors,missing:server.missing,scope:'Real Chromium animations and emulated touch; Supabase fixture, no remote mutations.'},null,2));console.log('ARTIFACTS '+out);
    }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);console.error('ARTIFACTS '+out);process.exitCode=1;});
