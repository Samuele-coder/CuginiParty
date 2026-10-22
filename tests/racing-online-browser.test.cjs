'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{chromium}=require('playwright');
const {startServer,installFixture}=require('./platform-test-server.cjs'),{startCoordinator}=require('./racing-online-runtime.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'cuginiparty-online-'));
(async()=>{
    const server=await startServer(),service=await startCoordinator(server.origin),browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const pc=await browser.newContext({viewport:{width:1366,height:768}}),phone=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[],received=[[],[]],sent=[[],[]];
    try{
        assert.equal((await fetch(service.url+'/rooms',{method:'POST',headers:{Origin:'https://unauthorized.invalid'}})).status,403);
        for(const context of [pc,phone]){await installFixture(context);await context.route('**/js/racing-online-config.js',r=>r.fulfill({contentType:'text/javascript',body:'export const RACING_SERVER_URL='+JSON.stringify(service.url)+';'}));}
        const pages=[await pc.newPage(),await phone.newPage()];
        for(const [i,page]of pages.entries()){
            page.on('pageerror',e=>errors.push(e.message));page.on('websocket',ws=>{ws.on('framereceived',f=>{try{received[i].push(JSON.parse(f.payload));}catch{}});ws.on('framesent',f=>{try{sent[i].push(JSON.parse(f.payload));}catch{}});});
            await page.goto(server.origin+'/games/racing-online.html');await page.locator('#r3oCreate').waitFor({state:'visible'});await page.waitForFunction(()=>!document.getElementById('r3oCreate').disabled);
            await page.locator('#r3oNickname').fill(i?'Telefono':'Computer');
        }
        const [host,guest]=pages;
        // Different contexts intentionally have separate storage. Verify the
        // live storage event in a second tab of the same user's context.
        const settingsTab=await pc.newPage();await settingsTab.goto(server.origin+'/index.html');await settingsTab.evaluate(()=>localStorage.setItem('CuginiParty_dark_mode','true'));await host.waitForFunction(()=>document.body.classList.contains('dark-mode'));await settingsTab.evaluate(()=>localStorage.setItem('CuginiParty_dark_mode','false'));await host.waitForFunction(()=>!document.body.classList.contains('dark-mode'));await settingsTab.close();
        await host.locator('#r3oCreate').click();await host.locator('#r3oLobby').waitFor({state:'visible'});const code=await host.locator('#r3oRoomCode').textContent();assert.match(code,/^[A-HJ-NP-Z2-9]{8}$/);
        await guest.locator('#r3oCode').fill(code);await guest.locator('#r3oJoin').click();await guest.locator('#r3oLobby').waitFor({state:'visible'});
        await host.waitForFunction(()=>document.querySelectorAll('#r3oPlayers li').length===2);assert.equal(await guest.locator('#r3oConfig').evaluate(e=>e.disabled),true,JSON.stringify(received[1].slice(-2)));assert.equal(await guest.locator('#r3oStart').isVisible(),false);
        await host.locator('#r3oLaps').selectOption('1');await host.locator('#r3oBots').selectOption('1');await host.locator('#r3oApply').click();await guest.waitForFunction(()=>document.getElementById('r3oBots').value==='1');
        await host.locator('#r3oReady').click();await guest.locator('#r3oReady').click();await host.waitForFunction(()=>!document.getElementById('r3oStart').disabled);await host.locator('#r3oStart').click();await guest.locator('#r3oHud').waitFor({state:'visible'});
        await host.waitForFunction(()=>document.getElementById('r3dApp').dataset.state==='racing');await guest.waitForFunction(()=>document.getElementById('r3dApp').dataset.state==='racing');
        const moved=async i=>{const deadline=Date.now()+15000;while(!sent[i].some(m=>m.type==='input'&&m.input.throttle===1)||!received[i].some(m=>m.type==='state'&&m.frame?.cars.some(c=>c.playerId===received[i].find(w=>w.type==='welcome')?.playerId&&c.speed>2))){if(Date.now()>deadline)throw Error('Server car did not move from actual input for client '+i);await pages[i].waitForTimeout(100);}};
        await host.bringToFront();await host.locator('#r3dCanvas').click({position:{x:200,y:350}});await host.keyboard.down('w');await moved(0);await host.keyboard.up('w');
        await guest.bringToFront();const pedal=guest.locator('[data-drive="throttle"]'),rect=await pedal.boundingBox(),touchSession=await phone.newCDPSession(guest);await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2,id:1}]});await moved(1);await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touchSession.detach();await guest.waitForTimeout(1000);
        for(let i=0;i<2;i++){
            const welcome=received[i].find(m=>m.type==='welcome');assert.ok(welcome?.token);assert.ok(received[i].some(m=>m.type==='state'&&m.frame?.cars.some(c=>c.playerId===welcome.playerId&&c.speed>2)),'Actual server car moved for client '+i);
            assert.ok(sent[i].some(m=>m.type==='input'&&m.input.throttle===1));assert.ok(!sent[i].some(m=>'position' in m||'completedLaps' in m));
            assert.equal(await pages[i].locator('#r3oCountdown').isVisible(),false,'Countdown must disappear after start');
            const publicMessages=received[i].filter(m=>m.type==='state');assert.ok(publicMessages.every(m=>!JSON.stringify(m).includes('tokenHash')));
            assert.equal(await pages[i].evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);await pages[i].screenshot({path:path.join(out,i?'phone-race.png':'desktop-race.png')});
        }
        const shared=received[0].filter(m=>m.type==='state'&&m.frame?.state==='racing').find(a=>received[1].some(b=>b.type==='state'&&b.serverNow===a.serverNow));assert.ok(shared,'Two browsers receive the same authoritative tick');const other=received[1].find(b=>b.type==='state'&&b.serverNow===shared.serverNow);assert.deepEqual(shared.frame,other.frame);assert.equal(shared.frame.cars.length,3);
        // Reload = actual WebSocket disconnect + guest-token resume, no fake player.
        const idBefore=received[1].find(m=>m.type==='welcome').playerId;await guest.reload();await guest.waitForFunction(()=>document.getElementById('r3dApp').dataset.state==='racing');assert.equal(received[1].filter(m=>m.type==='welcome').at(-1).playerId,idBefore);
        host.once('dialog',d=>d.accept());await host.locator('#r3oRaceMenu').click();await host.locator('#r3oAbort').click();await guest.locator('#r3oResults').waitFor({state:'visible'});assert.equal(await guest.locator('#r3oStandings li').count(),3);
        await host.locator('#r3oAgain').click();await guest.locator('#r3oLobby').waitFor({state:'visible'});await host.locator('#r3oBots').selectOption('0');await host.locator('#r3oApply').click();
        // Wait for the server acknowledgement, not the host's optimistic select.
        await guest.waitForFunction(()=>document.getElementById('r3oBots').value==='0');
        await host.locator('#r3oReady').click();await guest.locator('#r3oReady').click();await host.waitForFunction(()=>!document.getElementById('r3oStart').disabled);await host.locator('#r3oStart').click();await guest.locator('#r3oHud').waitFor({state:'visible'});
        // The guest can receive the new round before the host. Both rendered
        // rosters must have caught up before examining the host's last packet.
        for(const page of pages)await page.waitForFunction(()=>document.querySelectorAll('#r3oRanking li').length===2);
        assert.equal(received[0].filter(m=>m.type==='state'&&m.frame).at(-1).frame.cars.length,2);
        await guest.locator('#r3oRaceMenu').click();await guest.locator('#r3oRaceLeave').click();await guest.locator('#r3oEntry').waitFor({state:'visible'});
        assert.deepEqual(errors,[]);assert.deepEqual(server.missing,[]);
        fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'LOCAL workerd + Chromium desktop and emulated phone. NOT a public/physical-device test.',bundleBytes:service.bundleBytes,code,states:received.map(a=>a.filter(m=>m.type==='state').length),checks:['Origin allowlist','Create/join/code','Guest/host permissions','Ready/countdown','PC + touch authoritative movement','Identical shared snapshots + one bot','Disconnect/reload/resume','Server results dialog','Rematch friends-only','Leave'],errors},null,2));
        console.log('PASS local Workers/WebSocket + two isolated browser sessions; creation, ready, PC/touch movement, same state, shared bot, resume, results, friends-only rematch. PUBLIC ONLINE NOT TESTED. ARTIFACTS '+out);
    }catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:error.message,errors,sentInputs:sent.map(a=>a.filter(m=>m.type==='input').slice(-10)),events:received.map(a=>a.filter(m=>m.type!=='state').slice(-10).map(({token,...m})=>m)),states:received.map(a=>a.filter(m=>m.type==='state').slice(-2))},null,2));throw error;}finally{await browser.close();await service.close();await server.close();}
})().catch(e=>{console.error(e);console.error('ARTIFACTS '+out);process.exitCode=1;});
