'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
exports.startServer=async()=>{
    const root=path.resolve(__dirname,'..'),missing=[];
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.sql':'text/plain'};
    const server=http.createServer((req,res)=>{
        let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return;}
        if(!file.startsWith(root+path.sep)||file.includes(path.sep+'.git'+path.sep)){res.writeHead(403).end();return;}
        fs.readFile(file,(e,b)=>{if(e){missing.push(new URL(req.url,'http://localhost').pathname);res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(b);});
    });
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    return {origin:'http://127.0.0.1:'+server.address().port,missing,close:()=>new Promise(r=>server.close(r))};
};
// In-memory/localStorage fixture only, never a production backend or real RLS test.
exports.installFixture=async(context,admin=false,{preserveRacingSave=false}={})=>{
    await context.addInitScript(({admin,preserveRacingSave})=>{
        window.__eventTest={admin,saves:0,privateChecks:0};
        const initial={id:1,value:{unrelated_setting:'preserve-me'},updated_at:'2026-10-01T00:00:00Z',global_status:'online',maintenance_enabled:false,emergency_enabled:false,total_block_enabled:false,global_games_locked:false,multiplayer_enabled:true,new_rooms_enabled:true,new_matches_enabled:true};
        const read=()=>JSON.parse(localStorage.getItem('__event_test_db')||JSON.stringify(initial));
        class Query{
            constructor(table){this.table=table;this.one=false;this.filters=[];}
            select(){return this;}eq(k,v){this.filters.push([k,v]);return this;}neq(){return this;}order(){return this;}limit(){return this;}range(){return this;}in(){return this;}is(){return this;}gte(){return this;}lte(){return this;}gt(){return this;}lt(){return this;}or(){return this;}not(){return this;}
            maybeSingle(){this.one=true;return this;}single(){this.one=true;return this;}
            update(v){this.value=v;return this;}insert(){return this;}upsert(){return this;}delete(){return this;}
            then(ok,bad){
                let data=this.table==='site_settings'?read():this.table==='admin_users'?{user_id:'test-admin',enabled:window.__eventTest.admin}:null,error=null;
                if(this.table==='site_settings'&&this.value){
                    if(!window.__eventTest.admin)error={message:'Accesso negato dalla fixture RLS',code:'42501'};
                    else if(this.filters.some(([k,v])=>k==='updated_at'&&data[k]!==v))error={message:'Conflitto di aggiornamento',code:'PGRST116'};
                    else{data={...data,...this.value,updated_at:new Date().toISOString()};localStorage.setItem('__event_test_db',JSON.stringify(data));window.__eventTest.saves++;}
                }
                if(!this.one)data=data?[data]:[];
                return Promise.resolve({data,error,count:0}).then(ok,bad);
            }
        }
        const user={id:'test-admin',email:'admin@example.invalid'};
        const client={from:t=>new Query(t),rpc:async (name,args)=>{
            if(name==='is_admin'){window.__eventTest.privateChecks++;return {data:window.__eventTest.admin,error:null};}
            if(name==='admin_save_theme_events'){
                if(window.__eventTest.migrationMissing)return {data:null,error:{code:'PGRST202',message:'Function not found'}};
                if(!window.__eventTest.admin)return {data:null,error:{code:'42501',message:'Admin richiesta'}};
                const old=read();if(old.updated_at!==args.p_expected_updated_at)return {data:null,error:{code:'40001',message:'Conflitto di aggiornamento'}};
                const data={...old,value:{...old.value,theme_events:args.p_config},updated_at:new Date().toISOString()};localStorage.setItem('__event_test_db',JSON.stringify(data));window.__eventTest.saves++;return {data,error:null};
            }return {data:null,error:null};
        },channel:()=>({on(){return this;},subscribe(){return this;},unsubscribe(){return Promise.resolve();}}),removeChannel:async()=>{},auth:{getSession:async()=>({data:{session:window.__eventTest.admin?{user,access_token:'fixture-not-a-real-token'}:null},error:null}),getUser:async()=>({data:{user:window.__eventTest.admin?user:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>{window.__eventTest.admin=false;return {error:null};},signInWithPassword:async()=>({data:{user},error:null})}};
        window.supabase={createClient:()=>client};
        localStorage.setItem('CuginiParty_audio_enabled','false');if(!preserveRacingSave||!localStorage.getItem('CuginiParty_racing3d_v1'))localStorage.setItem('CuginiParty_racing3d_v1',JSON.stringify({quality:'low'}));
    },{admin,preserveRacingSave});
    await context.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'text/javascript',body:'/* Test fixture supplied before page scripts. */'}));
};
