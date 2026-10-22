'use strict';
const path=require('node:path');
exports.defaultPolicy=()=>({settings:{id:1,global_status:'online',total_block_enabled:false,global_games_locked:false,emergency_enabled:false,multiplayer_enabled:true,new_rooms_enabled:true,new_matches_enabled:true},game:{game_id:'racing',status:'available',enabled:true,visible:true,auto_release:false,scheduled_release_at:null,multiplayer_enabled:true,new_rooms_enabled:true}});
exports.startCoordinator=async(origin,{policy=exports.defaultPolicy()}={})=>{
    const {build}=require('esbuild'),{Miniflare,Log,LogLevel}=require('miniflare');
    const bundle=await build({entryPoints:[path.resolve(__dirname,'../server/racing/worker.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
    const runtime=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-07-30',host:'127.0.0.1',port:0,cf:false,bindings:{ALLOWED_ORIGINS:origin,SUPABASE_URL:'https://policy.example.invalid',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_only'},serviceBindings:{ADMIN_SOURCE:async request=>{if(policy.delay)await new Promise(r=>setTimeout(r,policy.delay));if(policy.unavailable)return new Response('Unavailable',{status:503});const settings=new URL(request.url).pathname.endsWith('/site_settings');return Response.json(policy.missing?[]:[settings?policy.settings:policy.game]);}},durableObjects:{RACING_ROOMS:{className:'RacingRoom',useSQLite:true},RACING_LIMITS:{className:'RacingRateGate',useSQLite:true}},log:new Log(LogLevel.WARN)});
    try{const url=(await runtime.ready).origin;return {runtime,url,bundleBytes:bundle.outputFiles[0].contents.length,close:()=>runtime.dispose()};}catch(error){await runtime.dispose();throw error;}
};
