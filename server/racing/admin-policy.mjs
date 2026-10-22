import {racingRestriction} from '../../js/racing-admin-policy.js';

export const POLICY_MAX_AGE_MS=2000;
const caches=new WeakMap();
export class RacingPolicyError extends Error{
    constructor(message,status=403){super(message);this.status=status;}
}
async function load(env,fresh){
    let cache=caches.get(env);if(!cache){cache={until:0,data:null,pending:null};caches.set(env,cache);}
    if(!fresh&&cache.data&&Date.now()<cache.until)return cache.data;
    if(cache.pending)return cache.pending;
    cache.pending=Promise.resolve().then(async()=>{
        try{
            const base=new URL(env.SUPABASE_URL),key=env.SUPABASE_PUBLISHABLE_KEY;
            if(base.protocol!=='https:'||!key?.startsWith('sb_publishable_'))throw Error('Configuration');
            const settingsColumns='id,global_status,total_block_enabled,global_games_locked,emergency_enabled,multiplayer_enabled,new_rooms_enabled,new_matches_enabled';
            const gameColumns='game_id,status,visible,enabled,auto_release,scheduled_release_at,multiplayer_enabled,new_rooms_enabled';
            const paths=[`site_settings?id=eq.1&select=${settingsColumns}`,`site_games?game_id=eq.racing&select=${gameColumns}`];
            const rows=await Promise.all(paths.map(async path=>{
                const request=new Request(new URL('/rest/v1/'+path,base),{headers:{apikey:key,Accept:'application/json','Cache-Control':'no-cache'},signal:AbortSignal.timeout(3000)});
                // ADMIN_SOURCE is a test-only service binding; production uses
                // deployment configuration, never request/client data.
                const response=await (env.ADMIN_SOURCE?env.ADMIN_SOURCE.fetch(request):fetch(request));
                if(!response.ok)throw Error('Read failed');const data=await response.json();if(!Array.isArray(data)||data.length!==1)throw Error('Missing/duplicate policy');return data[0];
            }));
            const [settings,game]=rows;
            if(settings.id!==1||!['online','maintenance','emergency','offline'].includes(settings.global_status)||game.game_id!=='racing'||!['available','maintenance','coming_soon'].includes(game.status))throw Error('Invalid policy');
            for(const field of ['total_block_enabled','global_games_locked','emergency_enabled','multiplayer_enabled','new_rooms_enabled','new_matches_enabled'])if(typeof settings[field]!=='boolean')throw Error('Invalid flag');
            for(const field of ['visible','enabled','auto_release','multiplayer_enabled','new_rooms_enabled'])if(typeof game[field]!=='boolean')throw Error('Invalid flag');
            cache.data={settings,game};cache.until=Date.now()+POLICY_MAX_AGE_MS;return cache.data;
        }catch{cache.data=null;cache.until=0;throw new RacingPolicyError('Verifica impostazioni Admin non disponibile. Riprova.',503);}
        finally{cache.pending=null;}
    });
    return cache.pending;
}
export async function enforceRacingPolicy(env,action='play'){
    const {settings,game}=await load(env,['create','start'].includes(action));
    const reason=racingRestriction(settings,game,action);if(reason)throw new RacingPolicyError(reason);
}
