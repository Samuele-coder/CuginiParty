'use strict';
// Native paints, no mocked clock: reliable UI/WebGL screenshot evidence.
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const {chromium}=require('playwright');
const origin=process.env.RACING_ORIGIN||'http://127.0.0.1:8770';
const route=process.env.RACING_URL||'/games/racing.html';
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'racing3d-visual-'));
(async()=>{
    const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const errors=[],metrics=[];
    try{
        for(const track of ['grand','canyon','city','alpine','neon']){
            const context=await browser.newContext({viewport:{width:844,height:390}});
            await context.addInitScript(track=>{localStorage.setItem('CuginiParty_racing3d_v1',JSON.stringify({track,car:'gt',difficulty:'hard',quality:'low'}));localStorage.setItem('CuginiParty_audio_enabled','false');},track);
            const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('THREE'))errors.push(m.text());});
            await page.goto(origin+route+'?debug=1&ai=1');await page.waitForFunction(()=>window.racing3DDebug);
            await page.locator('#r3dStartButton').click();await page.locator('#r3dTrackNext').click();await page.locator('#r3dCarNext').click();await page.locator('#r3dRaceButton').click();
            await page.waitForFunction(()=>window.racing3DDebug.snapshot().time>2,{timeout:20000});
            await page.evaluate(()=>window.applyTheme(true));
            await page.screenshot({path:path.join(artifacts,track+'-mobile-dark.png'),timeout:15000});
            const snapshot=await page.evaluate(()=>window.racing3DDebug.snapshot());assert.ok(snapshot.drawCalls>0);assert.ok(snapshot.triangles>0);metrics.push({track,drawCalls:snapshot.drawCalls,geometries:snapshot.geometries,triangles:snapshot.triangles,instances:snapshot.instances,textures:snapshot.textures,fpsSoftware:snapshot.fps,width:snapshot.width,height:snapshot.height,dpr:snapshot.dpr});
            console.log('PASS | native visual '+track);await context.close();
        }
        for(const [width,height]of [[1366,768],[390,844],[800,360]]){
            const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
            await page.goto(origin+route+'?debug=1');await page.waitForFunction(()=>window.racing3DDebug);
            for(const dark of [false,true]){
                await page.evaluate(d=>window.applyTheme(d),dark);await page.screenshot({path:path.join(artifacts,width+'-menu-'+dark+'.png'),timeout:15000});
                await page.locator('#r3dGarageButton').click();await page.waitForFunction(()=>window.racing3DDebug.snapshot().previewAngle>.1);
                await page.screenshot({path:path.join(artifacts,width+'-garage-'+dark+'.png'),timeout:15000});
                await page.locator('#r3dCarNext').click();await page.locator('#r3dSettingsButton').click();await page.screenshot({path:path.join(artifacts,width+'-settings-'+dark+'.png'),timeout:15000});
                await page.locator('#r3dSettings [data-back]').click();
            }
            if(width===1366){
                await page.locator('#r3dStartButton').click();await page.locator('#r3dTrackNext').click();await page.locator('#r3dCarNext').click();await page.locator('#r3dRaceButton').click();
                await page.evaluate(()=>{window.testWebGLExtension=document.getElementById('r3dCanvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.testWebGLExtension.loseContext();});
                await page.waitForFunction(()=>document.getElementById('r3dResumeButton').disabled);
                const frozen=await page.evaluate(()=>window.racing3DDebug.snapshot().time);
                await page.evaluate(()=>window.testWebGLExtension.restoreContext());
                await page.waitForFunction(()=>!document.getElementById('r3dResumeButton').disabled);
                assert.equal(await page.evaluate(()=>window.racing3DDebug.snapshot().time),frozen);
                await page.locator('#r3dResumeButton').click();await page.waitForFunction(()=>window.racing3DDebug.snapshot().state==='racing');
                console.log('PASS | WebGL loss/restore: frozen state, recovery without reload');
            }
            console.log('PASS | native menu/garage/settings '+width+'x'+height);await context.close();
        }
        assert.deepEqual(errors,[]);fs.writeFileSync(path.join(artifacts,'metrics.json'),JSON.stringify(metrics,null,2));console.log('ARTIFACTS '+artifacts);
    }finally{await browser.close();}
})().catch(e=>{console.error(e);console.error('ARTIFACTS '+artifacts);process.exitCode=1;});
