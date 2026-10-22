'use strict';
// UI fixtures expose existing DOM screens, including those that require online
// peers to reach. This checks layout/colours, NOT multiplayer/game transitions.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{startServer,installFixture}=require('./platform-test-server.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'cuginiparty-screens-'));
const selectors={
    undercover:'.undercover-panel',uno:'#startScreen,#roomScreen,#gameScreen,#colorPicker',memory:'#memoryStartScreen,#memoryGameScreen,#memoryVictoryScreen',pizza:'[id$="Screen"]',balloons:'[id$="Screen"]',aquarium:'[id$="Screen"]',
    'polizia-ladri':'#heistMenu,#heistGame,#heistPauseOverlay,#heistResultOverlay','gatto-topo':'#catMouseMenu,#catMouseGame,#catMouseResult','cube-rush':'#cubeRushMenu,#cubeRushGame,#cubeRushSkinsOverlay,#cubeRushPauseOverlay,#cubeRushCompleteOverlay',
    racing:'#r3dMenuMain,#r3dTracks,#r3dCars,#r3dDifficulty,#r3dSettings,#r3dPause,#r3dResults','racing-online':'#r3oEntry,#r3oLobby,#r3oPause,#r3oResults',
    'indovina-chi':'.guess-who-screen,.guess-who-sheet','block-blast':'#blockBlastGameOver','number-merge':'#mergeModal','color-match':'#colorSummary',tetris:'#tetrisOverlay'
};
(async()=>{
    const server=await startServer(),browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),context=await browser.newContext({reducedMotion:'reduce'});await installFixture(context,true);
    const issues=[],errors=[],results=[];
    try{for(const file of fs.readdirSync(path.resolve(__dirname,'../games')).filter(f=>f.endsWith('.html'))){
        const game=path.basename(file,'.html');if(process.env.SCREEN_ROUTES&&!process.env.SCREEN_ROUTES.split(',').includes(game))continue;
        const page=await context.newPage();page.on('pageerror',e=>errors.push({game,error:e.message}));await page.goto(server.origin+'/games/'+file);await page.waitForFunction(()=>window.CuginiPartyEvents);await page.waitForTimeout(100);await page.clock.install();await page.clock.pauseAt(new Date());
        const ids=await page.evaluate(selector=>{const elements=selector?[...document.querySelectorAll(selector)]:[];window.__auditScreens=elements.map(e=>({el:e,hidden:e.hidden,style:e.getAttribute('style'),class:e.className}));return elements.map(e=>e.id).filter(Boolean);},selectors[game]||'');
        for(const screen of ['initial',...ids])for(const [width,height]of [[390,844],[844,390],[768,1024],[1366,768]])for(const mode of ['light','dark','event']){
            await page.setViewportSize({width,height});await page.evaluate(({screen,mode})=>{
                CuginiPartyEvents.ingestSettings({id:1,value:null});if(window.applyTheme)applyTheme(mode==='dark');else document.body.classList.toggle('dark-mode',CuginiPartyEvents.effectiveDark(mode==='dark'));
                for(const item of window.__auditScreens){item.el.hidden=item.hidden;item.style===null?item.el.removeAttribute('style'):item.el.setAttribute('style',item.style);item.el.className=item.class;}
                if(screen!=='initial'){
                    const target=document.getElementById(screen);
                    for(const item of window.__auditScreens)if(item.el!==target&&!item.el.contains(target)&&!target.contains(item.el)){item.el.hidden=true;item.el.style.display='none';}
                    for(let e=target;e&&e!==document.body;e=e.parentElement){e.hidden=false;e.classList.remove('hidden');if(getComputedStyle(e).display==='none')e.style.display='block';}
                }
                if(mode==='event')CuginiPartyEvents.ingestSettings({id:1,value:{theme_events:{events:[{id:'halloween',mode:'manual'}]}}});
                for(const a of document.getAnimations())if(a instanceof CSSTransition)a.finish();
            },{screen,mode});
            const found=await page.evaluate(()=>{
                const rgb=s=>{const v=s.match(/[\d.]+/g)?.map(Number);return v?.length>=3?[...v.slice(0,3),v[3]??1]:null;};const lum=c=>c.slice(0,3).reduce((n,v,i)=>{v/=255;return n+(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*[.2126,.7152,.0722][i];},0),problems=[];
                for(const e of document.querySelectorAll('h1,h2,h3,p,button,label,select,input,small,strong,span,a')){
                    if(!e.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})||e.closest('[aria-hidden="true"],[data-event-visual],.uno-card,.uno-card-back,.memory-card,.tris-cell,.guess-who-character-card,.reaction-arena,.pizza-ingredient,.balloon,.cube-rush-level-art,#colorWord'))continue;
                    const r=e.getBoundingClientRect(),s=getComputedStyle(e),text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ');if(!r.width||!r.height)continue;
                    if((r.left< -1.5||r.right>innerWidth+1.5)&&s.position!=='absolute')problems.push({kind:'width',id:e.id,cls:e.className,text:text.slice(0,35),left:r.left,right:r.right});
                    if(!/[A-Za-zÀ-ÿ]{3}/.test(text))continue;let bg=null;for(let p=e;p;p=p.parentElement){const ps=getComputedStyle(p),c=rgb(ps.backgroundColor);if(ps.backgroundImage!=='none'){bg=null;break;}if(c?.[3]>.98){bg=c;break;}if(c&&c[3]>.7){bg=null;break;}}const fg=rgb(s.color);if(!bg||!fg)continue;const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<2.7)problems.push({kind:'contrast',id:e.id,cls:e.className,text:text.slice(0,40),fg:s.color,bg:bg.slice(0,3),ratio:+ratio.toFixed(2)});
                }return problems;
            });if(found.length)issues.push({game,screen,width,height,mode,found});
            if(width===390&&mode==='event')await page.screenshot({path:path.join(out,game+'-'+screen+'.png'),animations:'disabled'});
        }
        results.push({game,screens:['initial',...ids],cases:(ids.length+1)*12});console.log('SCREENS '+game+' '+(ids.length+1));await page.close();
    }
        fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({scope:'Existing DOM screen visual fixtures, not functional/online certification.',results,issues,errors,missing:server.missing},null,2));console.log(JSON.stringify({out,cases:results.reduce((s,r)=>s+r.cases,0),issueCases:issues.length,errors,missing:server.missing}));assert.deepEqual(errors,[]);assert.deepEqual(server.missing,[]);if(process.env.SCREEN_STRICT==='1')assert.deepEqual(issues,[]);
    }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);console.error('ARTIFACTS '+out);process.exitCode=1;});
