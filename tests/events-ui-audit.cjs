'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{chromium}=require('playwright'),{startServer,installFixture}=require('./platform-test-server.cjs');
const ids=['halloween','christmas','epiphany','easter','newyear','carnival','valentine','summer'];
(async()=>{
    const server=await startServer(),browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),context=await browser.newContext();await installFixture(context,true);
    const out=fs.mkdtempSync(path.join(os.tmpdir(),'cuginiparty-ui-')),issues=[],errors=[],results=[];
    try{for(const route of fs.readdirSync(path.resolve(__dirname,'../games')).filter(f=>f.endsWith('.html')&&(!process.env.EVENT_UI_ROUTES||process.env.EVENT_UI_ROUTES.split(',').includes(path.basename(f,'.html')))).map(f=>'/games/'+f)){
        const page=await context.newPage();page.on('pageerror',e=>errors.push({route,error:e.message}));await page.goto(server.origin+route);await page.waitForFunction(()=>window.CuginiPartyEvents);await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('/events.css')));
        for(const [width,height]of [[375,667],[1366,768]])for(const dark of [false,true])for(const id of ids){
            await page.setViewportSize({width,height});await page.evaluate(({id,dark})=>{window.applyTheme?.(dark);document.body.classList.toggle('dark-mode',dark);const row={id:1,global_status:'online',value:{theme_events:{events:[{id,mode:'manual'}]}}};localStorage.setItem('__event_test_db',JSON.stringify(row));window.CuginiPartyEvents.ingestSettings(row);},{id,dark});await page.waitForTimeout(100);await page.evaluate(()=>{for(const animation of document.getAnimations())if(animation instanceof CSSTransition)animation.finish();});
            const found=await page.evaluate(()=>{
                const rgb=value=>{const n=value.match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?[n[0],n[1],n[2],n[3]??1]:null;};
                const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
                const list=[];
                for(const el of document.querySelectorAll('h1,h2,h3,p,label,button,small,strong,span')){
                    if(!el.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})||el.closest('[aria-hidden="true"],[data-event-visual],.memory-card,.uno-card,.tris-cell,.cube-rush-level-art,.guess-who-character-card,.reaction-arena'))continue;
                    const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ');if(!/[a-zA-ZÀ-ÿ]{3}/.test(text))continue;
                    const style=getComputedStyle(el),fg=rgb(style.color);if(!fg)continue;
                    let parent=el,bg=null;while(parent){const color=rgb(getComputedStyle(parent).backgroundColor);if(color&&color[3]>.98){bg=color;break;}parent=parent.parentElement;}
                    if(!bg)continue;const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
                    // Diagnostic for grossly unreadable computed UI colours, not a
                    // WCAG certification of images/gradients or gameplay pixels.
                    if(ratio<2.7)list.push({tag:el.tagName,cls:typeof el.className==='string'?el.className:'',text:text.slice(0,65),fg:style.color,bg:bg.slice(0,3),ratio:+ratio.toFixed(2)});
                }
                return list;
            });if(found.length)issues.push({route,width,dark,id,found});
            assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0,route+' '+id+' overflow');
            if(width===375&&dark&&id==='halloween')await page.screenshot({path:path.join(out,path.basename(route,'.html')+'.png'),animations:'disabled'});
        }
        results.push({route,cases:32});console.log('UI '+route);await page.close();
    }
    fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({results,issues,errors,missing:server.missing},null,2));console.log(JSON.stringify({out,cases:results.length*32,issues:issues.length,errors,missing:server.missing}));assert.deepEqual(errors,[]);assert.deepEqual(server.missing,[]);if(process.env.CONTRAST_STRICT==='1')assert.deepEqual(issues,[]);
    }finally{await context.close();await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
