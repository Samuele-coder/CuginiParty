'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{startServer,installFixture}=require('./platform-test-server.cjs');
const widths=[[320,568],[375,667],[390,844],[430,932],[667,375],[844,390],[932,430],[768,1024],[1024,768],[1366,768],[1920,1080]];
(async()=>{
    const s=await startServer(),b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),context=await b.newContext();await installFixture(context);
    const errors=[],results=[],wide=[];const out=fs.mkdtempSync(path.join(os.tmpdir(),'cuginiparty-layout-'));
    try{for(const route of ['/index.html','/admin/index.html','/polizia-ladri.html',...fs.readdirSync(path.resolve(__dirname,'../games')).filter(f=>f.endsWith('.html')).map(f=>'/games/'+f)]){
        const page=await context.newPage();page.on('pageerror',e=>errors.push({route,error:e.message}));await page.goto(s.origin+route);await page.waitForTimeout(route.includes('racing')?500:80);
        for(const [width,height]of widths){await page.setViewportSize({width,height});
            for(const dark of [false,true]){await page.evaluate(d=>{if(window.applyTheme)applyTheme(d);else document.body.classList.toggle('dark-mode',d);},dark);
                const r=await page.evaluate(()=>{const a=[];for(const e of document.body.querySelectorAll('*')){if(!e.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true}))continue;const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(r.width>0&&r.height>0&&(r.left< -1.5||r.right>innerWidth+1.5)&&s.position!=='absolute'&&e.tagName!=='SVG'&&e.tagName!=='PATH')a.push({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,100),left:+r.left.toFixed(1),right:+r.right.toFixed(1),width:+r.width.toFixed(1)});}return {scroll:document.documentElement.scrollWidth-innerWidth,wide:a.slice(0,12)};});
                if(r.scroll>0||r.wide.length)wide.push({route,width,height,dark,...r});
            }
        }
        results.push({route,checks:widths.length*2});console.log('AUDIT '+route);await page.close();
    }
    fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({results,wide,errors,missing:s.missing},null,2));console.log(JSON.stringify({artifacts:out,wide:wide.length,errors,missing:s.missing}));
    if(process.env.AUDIT_STRICT==='1'){assert.deepEqual(errors,[]);assert.deepEqual(wide,[]);assert.deepEqual(s.missing,[]);}
    }finally{await b.close();await s.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
