'use strict';
const path=require('node:path');
exports.startCoordinator=async origin=>{
    const {build}=require('esbuild'),{Miniflare,Log,LogLevel}=require('miniflare');
    const bundle=await build({entryPoints:[path.resolve(__dirname,'../server/racing/worker.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
    const runtime=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-07-30',host:'127.0.0.1',port:0,cf:false,bindings:{ALLOWED_ORIGINS:origin},durableObjects:{RACING_ROOMS:{className:'RacingRoom',useSQLite:true},RACING_LIMITS:{className:'RacingRateGate',useSQLite:true}},log:new Log(LogLevel.WARN)});
    try{const url=(await runtime.ready).origin;return {runtime,url,bundleBytes:bundle.outputFiles[0].contents.length,close:()=>runtime.dispose()};}catch(error){await runtime.dispose();throw error;}
};
