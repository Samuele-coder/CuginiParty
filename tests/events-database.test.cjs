'use strict';
// Execute the real migration in an isolated PostgreSQL/WASM instance, not Supabase production.
// Optional test-only dependency: PGLITE_MODULE=/absolute/path/to/pglite/dist/index.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
    const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');const db=await PGlite.create();
    const {normalizeConfig}=await import(pathToFileURL(path.resolve(__dirname,'../js/events-calendar.js')));
    const admin='00000000-0000-0000-0000-000000000001',user='00000000-0000-0000-0000-000000000002';
    try{
        await db.exec(`create role anon; create role authenticated; create schema auth;
        create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
        grant usage on schema auth to anon,authenticated;
        create table public.admin_users(user_id uuid primary key,enabled boolean);
        insert into public.admin_users values('${admin}',true);
        create table public.site_settings(id integer primary key,value jsonb,updated_at timestamptz default now(),global_status text default 'online');
        insert into public.site_settings(id,value,updated_at) values(1,'{"unrelated_setting":"preserve-me"}','2026-10-01T00:00:00Z');
        create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp();return new;end; $$;
        create trigger updated_at before update on public.site_settings for each row execute function public.set_updated_at();
        alter table public.site_settings enable row level security;
        grant select,update,insert on public.site_settings to anon,authenticated;
        create policy intentionally_permissive_legacy_fixture on public.site_settings for all to anon,authenticated using(true) with check(true);`);
        const schema=fs.readFileSync(path.resolve(__dirname,'../admin/admin-supabase.sql'),'utf8'),isAdmin=schema.match(/create or replace function public\.is_admin\(\)[\s\S]+?\$\$;/)[0];await db.exec(isAdmin);
        const migration=fs.readFileSync(path.resolve(__dirname,'../admin/events.sql'),'utf8');await db.exec(migration);await db.exec(migration);
        const config=normalizeConfig({events:[{id:'halloween',mode:'manual'}]}),json=JSON.stringify(config);
        const as=async(role,id)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec('set role '+role);};
        const rejects=async(operation,codes)=>{await assert.rejects(operation,e=>codes.includes(e.code));};
        await as('anon','');await rejects(()=>db.query('select public.admin_save_theme_events($1::jsonb,$2::timestamptz)',[json,'2026-10-01T00:00:00Z']),['42501']);
        await rejects(()=>db.query("update public.site_settings set value=jsonb_set(value,'{theme_events}',$1::jsonb) where id=1",[json]),['42501']);
        await as('authenticated',user);await rejects(()=>db.query('select public.admin_save_theme_events($1::jsonb,$2::timestamptz)',[json,'2026-10-01T00:00:00Z']),['42501']);
        await rejects(()=>db.query("update public.site_settings set value=jsonb_set(value,'{theme_events}',$1::jsonb) where id=1",[json]),['42501']);
        await as('authenticated',admin);
        const first=(await db.query('select public.admin_save_theme_events($1::jsonb,$2::timestamptz) as saved',[json,'2026-10-01T00:00:00Z'])).rows[0].saved;
        assert.equal(first.value.unrelated_setting,'preserve-me');assert.equal(first.value.theme_events.events[0].mode,'manual');assert.equal((await db.query('select global_status from public.site_settings')).rows[0].global_status,'online');
        await rejects(()=>db.query('select public.admin_save_theme_events($1::jsonb,$2::timestamptz)',[json,'2026-10-01T00:00:00Z']),['40001']);
        for(const bad of [{...config,events:[]},{...config,events:config.events.map((e,i)=>i?e:{...e,id:'unknown'})},{...config,secret:'unexpected-field'},{...config,events:config.events.map((e,i)=>i?e:{...e,mode:'scheduled',startAt:'2026-10-31T10:00:00Z',endAt:'2026-10-31T09:00:00Z'})}]){
            await rejects(()=>db.query('select public.admin_save_theme_events($1::jsonb,$2::timestamptz)',[JSON.stringify(bad),first.updated_at]),['22023']);
        }
        await as('anon','');const read=(await db.query('select value from public.site_settings where id=1')).rows[0].value;assert.equal(read.theme_events.events[0].id,'halloween');assert.ok((await db.query('select public.theme_events_clock() as time')).rows[0].time);
        await db.exec('reset role; drop trigger site_settings_theme_events_guard on public.site_settings; alter table public.site_settings alter column value type json using value::json;');await db.exec(migration);
        await as('authenticated',admin);const jsonVersion=(await db.query('select public.admin_save_theme_events($1::jsonb,$2::timestamptz) as saved',[json,first.updated_at])).rows[0].saved;assert.equal(jsonVersion.value.unrelated_setting,'preserve-me');
        console.log('PASS real PostgreSQL engine: migration twice; anon/non-admin RPC and direct UPDATE denied despite permissive legacy policy; admin save; public read; unrelated settings preserved; conflict and invalid configuration rejected; server clock');
    }finally{await db.close();}
})().catch(e=>{console.error(e.message);if(e.code)console.error('PostgreSQL '+e.code);process.exitCode=1;});
