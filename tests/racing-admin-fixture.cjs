'use strict';
const {installFixture}=require('./platform-test-server.cjs');
exports.installRacingFixture=async context=>{
    await installFixture(context,true);
    await context.addInitScript(()=>{
        const client=window.supabase.createClient(),original=client.from.bind(client);
        const initial=['tris','uno','racing','memory'].map((game_id,sort_order)=>({game_id,name:game_id==='racing'?'Racing 3D':game_id,icon:'assets/'+(game_id==='racing'?'racing-2d':game_id)+'-icon.png',path:'games/'+game_id+'.html',description:'Descrizione '+game_id,category:'Arcade',enabled:true,visible:true,status:'available',badge:null,badge_expires_at:null,sort_order,multiplayer_enabled:true,new_rooms_enabled:true,auto_release:false,scheduled_release_at:null}));
        const read=()=>JSON.parse(localStorage.getItem('__racing_admin_games')||JSON.stringify(initial));
        class GamesQuery{
            constructor(){this.filters=[];this.singleRow=false;}
            select(){return this;}order(){return this;}eq(k,v){this.filters.push([k,v]);return this;}maybeSingle(){this.singleRow=true;return this;}single(){return this.maybeSingle();}
            upsert(value){this.operation='upsert';this.value=value;return this;}insert(value){return this.upsert(value);}update(value){this.operation='update';this.value=value;return this;}delete(){this.operation='delete';return this;}
            then(ok,bad){let rows=read(),data=[],error=null;const matches=row=>this.filters.every(([key,value])=>row[key]===value);
                if(this.operation&&!window.__eventTest.admin)error={message:'Accesso negato',code:'42501'};
                else if(this.operation==='upsert'){const values=Array.isArray(this.value)?this.value:[this.value];for(const value of values){const old=rows.find(row=>row.game_id===value.game_id);if(old)Object.assign(old,value);else rows.push({...value});}data=values;}
                else if(this.operation==='update'){data=rows.filter(matches);for(const row of data)Object.assign(row,this.value);}
                else if(this.operation==='delete'){data=rows.filter(matches);rows=rows.filter(row=>!matches(row));}
                else data=rows.filter(matches);
                if(this.operation&&!error){localStorage.setItem('__racing_admin_games',JSON.stringify(rows));window.__eventTest.gameSaves=(window.__eventTest.gameSaves||0)+1;}
                return Promise.resolve({data:this.singleRow?(data[0]||null):data,error,count:data.length}).then(ok,bad);
            }
        }
        client.from=table=>table==='site_games'?new GamesQuery():original(table);
        window.supabase.createClient=()=>client;
    });
};
