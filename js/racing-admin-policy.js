// Shared decision rules only: no client, storage, network or privileged key.
export function racingRestriction(settings,game,action='play',{now=Date.now(),requireRecords=true}={}){
    if(!settings||!game){if(requireRecords)return 'Verifica impostazioni Admin non disponibile. Riprova.';settings||={};game||={game_id:'racing'};}
    // Global maintenance is an existing dismissible notice, not an offline switch.
    if(settings.total_block_enabled===true||settings.global_games_locked===true||settings.emergency_enabled===true||['offline','emergency'].includes(settings.global_status))return 'Racing è temporaneamente bloccato dall’Admin.';
    const released=game.status==='coming_soon'&&game.auto_release===true&&Number.isFinite(Date.parse(game.scheduled_release_at))&&Date.parse(game.scheduled_release_at)<=now;
    if(game.game_id!=='racing'||game.visible===false||game.status==='maintenance'||game.status==='coming_soon'&&!released||game.enabled===false&&!released)return 'Racing non è disponibile: controlla lo stato o il rilascio programmato.';
    if(action==='offline')return null;
    if(settings.multiplayer_enabled===false||game.multiplayer_enabled===false)return 'Il multiplayer è temporaneamente disabilitato dall’Admin.';
    if(action==='create'&&(settings.new_rooms_enabled===false||game.new_rooms_enabled===false))return 'La creazione di nuove stanze è temporaneamente disabilitata.';
    if(action==='start'&&settings.new_matches_enabled===false)return 'Le nuove gare sono temporaneamente disabilitate.';
    return null;
}
