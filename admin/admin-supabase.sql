-- CuginiParty Admin V2 - allineamento completo frontend/database
-- Migrazione additiva e idempotente. Non elimina tabelle, colonne o dati.

create extension if not exists pgcrypto;

-- =========================================================
-- TABELLE ADMIN E SITO
-- =========================================================

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    enabled boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.admin_users
    add column if not exists user_id uuid,
    add column if not exists enabled boolean not null default true,
    add column if not exists created_at timestamptz not null default now();

create table if not exists public.site_settings (
    id integer primary key default 1,
    maintenance_enabled boolean not null default false,
    maintenance_title text not null default 'Manutenzione programmata',
    maintenance_message text not null default '',
    maintenance_end_time timestamptz,
    emergency_enabled boolean not null default false,
    emergency_title text,
    emergency_message text,
    total_block_enabled boolean not null default false,
    global_status text not null default 'online',
    multiplayer_enabled boolean not null default true,
    new_rooms_enabled boolean not null default true,
    new_matches_enabled boolean not null default true,
    global_games_locked boolean not null default false,
    updated_at timestamptz not null default now()
);

alter table public.site_settings
    add column if not exists id integer default 1,
    add column if not exists maintenance_enabled boolean not null default false,
    add column if not exists maintenance_title text not null default 'Manutenzione programmata',
    add column if not exists maintenance_message text not null default '',
    add column if not exists maintenance_end_time timestamptz,
    add column if not exists emergency_enabled boolean not null default false,
    add column if not exists emergency_title text,
    add column if not exists emergency_message text,
    add column if not exists total_block_enabled boolean not null default false,
    add column if not exists global_status text not null default 'online',
    add column if not exists multiplayer_enabled boolean not null default true,
    add column if not exists new_rooms_enabled boolean not null default true,
    add column if not exists new_matches_enabled boolean not null default true,
    add column if not exists global_games_locked boolean not null default false,
    add column if not exists updated_at timestamptz not null default now();

create table if not exists public.site_games (
    game_id text primary key,
    name text not null default '',
    enabled boolean not null default true,
    multiplayer_enabled boolean not null default true,
    new_rooms_enabled boolean not null default true,
    disabled_message text not null default '',
    status text not null default 'available',
    visible boolean not null default true,
    badge text,
    badge_expires_at timestamptz,
    release_date date,
    release_time time,
    sort_order integer not null default 0,
    path text,
    description text,
    category text,
    icon text,
    maintenance_message text,
    scheduled_release_at timestamptz,
    auto_release boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.site_games
    add column if not exists game_id text,
    add column if not exists name text not null default '',
    add column if not exists enabled boolean not null default true,
    add column if not exists multiplayer_enabled boolean not null default true,
    add column if not exists new_rooms_enabled boolean not null default true,
    add column if not exists disabled_message text not null default '',
    add column if not exists status text not null default 'available',
    add column if not exists visible boolean not null default true,
    add column if not exists badge text,
    add column if not exists badge_expires_at timestamptz,
    add column if not exists release_date date,
    add column if not exists release_time time,
    add column if not exists sort_order integer not null default 0,
    add column if not exists path text,
    add column if not exists description text,
    add column if not exists category text,
    add column if not exists icon text,
    add column if not exists maintenance_message text,
    add column if not exists scheduled_release_at timestamptz,
    add column if not exists auto_release boolean not null default false,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

-- Crea solo i record mancanti: nessuno stato Admin già configurato viene
-- sovrascritto. Il catalogo DB non può restare vuoto mentre l'Admin mostra
-- fallback non salvabili.
insert into public.site_games (
    game_id, name, enabled, multiplayer_enabled, new_rooms_enabled,
    disabled_message, status, visible, sort_order, path, description, category, icon
) values
    ('tris', 'Tris', true, false, false, '', 'available', true, 0, 'games/tris.html', 'Sfida un amico o affronta il computer nel classico gioco del Tris.', 'Party', '❌⭕'),
    ('uno', 'UNO', true, true, true, '', 'available', true, 1, 'games/uno.html', 'Gioca a UNO con i tuoi amici online e sfidali in stanze private.', 'Party', '🃏'),
    ('racing', 'Racing 2D', true, false, false, '', 'available', true, 2, 'games/racing.html', 'Corri, schiva gli ostacoli e raggiungi il traguardo nel minor tempo possibile.', 'Arcade', '🏎️'),
    ('memory', 'Memory', true, false, false, '', 'available', true, 3, 'games/memory.html', 'Trova tutte le coppie di carte nel minor numero di mosse possibile.', 'Puzzle', '🧠'),
    ('pizza', 'Prepara la Pizza', true, false, false, '', 'available', true, 4, 'games/pizza.html', 'Prepara gli ordini dei clienti, cucina le pizze e guadagna!', 'Cucina', '🍕'),
    ('balloons', 'Scoppia i Palloncini', true, false, false, '', 'available', true, 5, 'games/balloons.html', 'Scoppia più palloncini possibile prima che il tempo finisca.', 'Arcade', '🎈'),
    ('aquarium', 'Acquario Magico', true, false, false, '', 'available', true, 6, 'games/aquarium.html', 'Esplora l''acquario, raccogli stelle magiche e trova tesori nascosti.', 'Relax', '🐠'),
    ('undercover', 'Undercover', true, true, true, '', 'available', true, 7, 'games/undercover.html', 'Scopri chi ha una parola diversa, sullo stesso telefono oppure online.', 'Party', '🕵️'),
    ('block-blast', 'Block Blast', true, false, false, '', 'available', true, 8, 'games/block-blast.html', 'Posiziona i blocchi, completa righe e colonne e cerca di ottenere il punteggio più alto.', 'Puzzle', '🧩'),
    ('tetris', 'Tetris', true, false, false, '', 'available', true, 9, 'games/tetris.html', 'Incastra i tetramini, completa le righe e resisti mentre la velocità aumenta.', 'Puzzle', '🧱')
on conflict (game_id) do nothing;

create table if not exists public.site_messages (
    id uuid primary key default gen_random_uuid(),
    type text not null default 'normal',
    title text,
    target text not null default 'all',
    game_id text,
    message text not null default '',
    active boolean not null default true,
    persistent boolean not null default false,
    scheduled_start timestamptz,
    scheduled_end timestamptz,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.site_messages
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists type text not null default 'normal',
    add column if not exists title text,
    add column if not exists target text not null default 'all',
    add column if not exists game_id text,
    add column if not exists message text not null default '',
    add column if not exists active boolean not null default true,
    add column if not exists persistent boolean not null default false,
    add column if not exists scheduled_start timestamptz,
    add column if not exists scheduled_end timestamptz,
    add column if not exists created_by uuid,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

create table if not exists public.blocked_users (
    player_id uuid primary key,
    nickname text,
    blocked_by uuid,
    reason text,
    blocked_at timestamptz not null default now(),
    unblocked_at timestamptz
);

alter table public.blocked_users
    add column if not exists player_id uuid,
    add column if not exists nickname text,
    add column if not exists blocked_by uuid,
    add column if not exists reason text,
    add column if not exists blocked_at timestamptz not null default now(),
    add column if not exists unblocked_at timestamptz;

create table if not exists public.admin_logs (
    id uuid primary key default gen_random_uuid(),
    admin_user_id uuid,
    action text not null default '',
    target text,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.admin_logs
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists admin_user_id uuid,
    add column if not exists action text not null default '',
    add column if not exists target text,
    add column if not exists details jsonb not null default '{}'::jsonb,
    add column if not exists created_at timestamptz not null default now();

-- =========================================================
-- TABELLE UNO LETTE/GESTITE DALL'ADMIN
-- =========================================================

create table if not exists public.uno_rooms (
    id uuid primary key default gen_random_uuid(),
    room_code text not null,
    host_id uuid,
    status text not null default 'waiting',
    game_state jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.uno_rooms
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists room_code text,
    add column if not exists host_id uuid,
    add column if not exists status text not null default 'waiting',
    add column if not exists game_state jsonb,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

create table if not exists public.uno_players (
    id uuid primary key default gen_random_uuid(),
    room_id uuid,
    player_id uuid,
    nickname text not null default '',
    is_host boolean not null default false,
    is_ready boolean not null default false,
    connected boolean not null default true,
    last_seen timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.uno_players
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists room_id uuid,
    add column if not exists player_id uuid,
    add column if not exists nickname text not null default '',
    add column if not exists is_host boolean not null default false,
    add column if not exists is_ready boolean not null default false,
    add column if not exists connected boolean not null default true,
    add column if not exists last_seen timestamptz,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

-- =========================================================
-- BASE UNDERCOVER: SOLO GARANZIA ADDITIVA DEL CONTRATTO ESISTENTE
-- Le RPC e la state machine restano in undercover_online.sql.
-- =========================================================

create table if not exists public.undercover_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null default '',
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.undercover_categories
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists name text not null default '',
    add column if not exists active boolean not null default true,
    add column if not exists created_at timestamptz not null default now();

create table if not exists public.undercover_word_pairs (
    id uuid primary key default gen_random_uuid(),
    category_id uuid,
    civilian_word text not null default '',
    undercover_word text not null default '',
    difficulty text not null default 'normal',
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.undercover_word_pairs
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists category_id uuid,
    add column if not exists civilian_word text not null default '',
    add column if not exists undercover_word text not null default '',
    add column if not exists difficulty text not null default 'normal',
    add column if not exists active boolean not null default true,
    add column if not exists created_at timestamptz not null default now();

create table if not exists public.undercover_rooms (
    id uuid primary key default gen_random_uuid(),
    room_code text not null,
    host_player_id uuid,
    status text not null default 'lobby',
    role_mode text not null default 'auto',
    undercover_count integer not null default 0,
    mr_white_count integer not null default 1,
    difficulty text not null default 'normal',
    category text,
    game_state jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.undercover_rooms
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists room_code text,
    add column if not exists host_player_id uuid,
    add column if not exists status text not null default 'lobby',
    add column if not exists role_mode text not null default 'auto',
    add column if not exists undercover_count integer not null default 0,
    add column if not exists mr_white_count integer not null default 1,
    add column if not exists difficulty text not null default 'normal',
    add column if not exists category text,
    add column if not exists game_state jsonb,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

create table if not exists public.undercover_players (
    id uuid primary key default gen_random_uuid(),
    room_id uuid,
    player_id uuid,
    nickname text,
    name text,
    client_id text,
    is_host boolean not null default false,
    connected boolean not null default true,
    joined_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.undercover_players
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists room_id uuid,
    add column if not exists player_id uuid,
    add column if not exists nickname text,
    add column if not exists name text,
    add column if not exists client_id text,
    add column if not exists is_host boolean not null default false,
    add column if not exists connected boolean not null default true,
    add column if not exists joined_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

create table if not exists public.undercover_votes (
    room_id uuid not null,
    voter_player_id uuid not null,
    target_player_id uuid not null,
    round_number integer not null default 1,
    ballot_number integer not null default 1,
    created_at timestamptz not null default now(),
    unique (room_id, round_number, ballot_number, voter_player_id)
);

alter table public.undercover_votes
    add column if not exists room_id uuid,
    add column if not exists voter_player_id uuid,
    add column if not exists target_player_id uuid,
    add column if not exists round_number integer not null default 1,
    add column if not exists ballot_number integer not null default 1,
    add column if not exists created_at timestamptz not null default now();
alter table public.undercover_votes alter column target_player_id drop not null;

create table if not exists public.undercover_private_cards (
    room_id uuid not null,
    player_id uuid not null,
    role text not null,
    word text not null,
    civilian_word text not null,
    undercover_word text not null default '',
    created_at timestamptz not null default now(),
    primary key (room_id, player_id)
);

alter table public.undercover_private_cards
    add column if not exists room_id uuid,
    add column if not exists player_id uuid,
    add column if not exists role text,
    add column if not exists word text,
    add column if not exists civilian_word text,
    add column if not exists undercover_word text not null default '',
    add column if not exists created_at timestamptz not null default now();

create table if not exists public.undercover_player_sessions (
    room_id uuid not null,
    player_id uuid not null,
    client_id text not null,
    created_at timestamptz not null default now(),
    primary key (room_id, player_id),
    unique (room_id, client_id)
);

alter table public.undercover_player_sessions
    add column if not exists room_id uuid,
    add column if not exists player_id uuid,
    add column if not exists client_id text,
    add column if not exists created_at timestamptz not null default now();

-- =========================================================
-- MIGRAZIONE COERENTE DEGLI ALIAS LEGACY
-- =========================================================

do $$
begin
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_settings' and column_name='room_creation_enabled') then
        execute 'update public.site_settings set new_rooms_enabled = coalesce(room_creation_enabled, new_rooms_enabled)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_settings' and column_name='key' and data_type in ('text','character varying','character')) then
        execute 'alter table public.site_settings alter column key set default ''global''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_games' and column_name='game_name') then
        execute 'update public.site_games set name = coalesce(nullif(name, ''''), game_name)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_games' and column_name='room_creation_enabled') then
        execute 'update public.site_games set new_rooms_enabled = coalesce(room_creation_enabled, new_rooms_enabled)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_messages' and column_name='target_game') then
        execute 'update public.site_messages set game_id = coalesce(game_id, target_game)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_messages' and column_name='online_only') then
        execute 'update public.site_messages set target = case when online_only is true then ''online'' when game_id is not null then ''game'' else coalesce(target, ''all'') end';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_messages' and column_name='scheduled_at') then
        execute 'update public.site_messages set scheduled_start = coalesce(scheduled_start, scheduled_at)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_messages' and column_name='expires_at') then
        execute 'update public.site_messages set scheduled_end = coalesce(scheduled_end, expires_at)';
    end if;
end;
$$;

update public.site_settings
set global_status = case
    when total_block_enabled then 'offline'
    when emergency_enabled then 'emergency'
    when maintenance_enabled then 'maintenance'
    else 'online'
end
where global_status is distinct from case
    when total_block_enabled then 'offline'
    when emergency_enabled then 'emergency'
    when maintenance_enabled then 'maintenance'
    else 'online'
end;

update public.site_games
set disabled_message = ''
where disabled_message is null;

alter table public.site_games
    alter column disabled_message set default '',
    alter column disabled_message set not null;

do $$
begin
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='site_settings' and column_name='key') then
        execute $sql$
            insert into public.site_settings (id, key, global_status)
            select 1, 'global', 'online'
            where not exists (select 1 from public.site_settings where id = 1)
            on conflict do nothing
        $sql$;
    else
        insert into public.site_settings (id, global_status)
        select 1, 'online'
        where not exists (select 1 from public.site_settings where id = 1)
        on conflict do nothing;
    end if;
end;
$$;

-- =========================================================
-- VINCOLI E INDICI SICURI
-- =========================================================

create index if not exists site_games_admin_v2_order_idx on public.site_games(sort_order, game_id);
create index if not exists site_messages_admin_v2_created_idx on public.site_messages(created_at desc);
create index if not exists site_messages_admin_v2_schedule_idx on public.site_messages(scheduled_start, scheduled_end) where active = true;
create index if not exists uno_rooms_admin_v2_code_idx on public.uno_rooms(room_code);
create index if not exists uno_rooms_admin_v2_updated_idx on public.uno_rooms(updated_at desc);
create index if not exists uno_players_admin_v2_player_idx on public.uno_players(player_id);
create index if not exists uno_players_admin_v2_room_idx on public.uno_players(room_id, created_at);
create index if not exists undercover_rooms_admin_v2_code_idx on public.undercover_rooms(room_code);
create index if not exists undercover_players_admin_v2_room_idx on public.undercover_players(room_id, joined_at);

do $$
begin
    if not exists (select 1 from pg_constraint where conrelid='public.site_settings'::regclass and conname='site_settings_admin_v2_global_status_check') then
        alter table public.site_settings add constraint site_settings_admin_v2_global_status_check
            check (global_status in ('online','maintenance','emergency','offline')) not valid;
    end if;
    if not exists (select 1 from pg_constraint where conrelid='public.site_messages'::regclass and conname='site_messages_admin_v2_target_check') then
        alter table public.site_messages add constraint site_messages_admin_v2_target_check
            check (target in ('all','online','game')) not valid;
    end if;
    if not exists (select 1 from pg_constraint where conrelid='public.site_messages'::regclass and conname='site_messages_admin_v2_type_check') then
        alter table public.site_messages add constraint site_messages_admin_v2_type_check
            check (type in ('normal','important','urgent','banner','popup','scheduled')) not valid;
    end if;
end;
$$;

-- =========================================================
-- TRIGGER UPDATED_AT
-- =========================================================

create or replace function public.sync_site_settings_global_status()
returns trigger language plpgsql set search_path=public as $$
begin
    if tg_op = 'INSERT'
       or new.global_status is distinct from old.global_status then
        new.maintenance_enabled := new.global_status = 'maintenance';
        new.emergency_enabled := new.global_status = 'emergency';
        new.total_block_enabled := new.global_status = 'offline';
    else
        new.global_status := case
            when new.total_block_enabled then 'offline'
            when new.emergency_enabled then 'emergency'
            when new.maintenance_enabled then 'maintenance'
            else 'online'
        end;
    end if;
    return new;
end;
$$;

do $$
begin
    if not exists (
        select 1 from pg_trigger
        where tgrelid='public.site_settings'::regclass
          and tgname='site_settings_admin_v2_sync_status'
    ) then
        create trigger site_settings_admin_v2_sync_status
        before insert or update on public.site_settings
        for each row execute function public.sync_site_settings_global_status();
    end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

do $$
begin
    if not exists (select 1 from pg_trigger where tgrelid='public.site_settings'::regclass and tgname='site_settings_admin_v2_updated_at') then
        create trigger site_settings_admin_v2_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgrelid='public.site_games'::regclass and tgname='site_games_admin_v2_updated_at') then
        create trigger site_games_admin_v2_updated_at before update on public.site_games for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgrelid='public.site_messages'::regclass and tgname='site_messages_admin_v2_updated_at') then
        create trigger site_messages_admin_v2_updated_at before update on public.site_messages for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgrelid='public.uno_rooms'::regclass and tgname='uno_rooms_admin_v2_updated_at') then
        create trigger uno_rooms_admin_v2_updated_at before update on public.uno_rooms for each row execute function public.set_updated_at();
    end if;
    if not exists (select 1 from pg_trigger where tgrelid='public.uno_players'::regclass and tgname='uno_players_admin_v2_updated_at') then
        create trigger uno_players_admin_v2_updated_at before update on public.uno_players for each row execute function public.set_updated_at();
    end if;
end;
$$;

-- =========================================================
-- RLS: LETTURE PUBBLICHE MINIME, SCRITTURE ADMIN AUTENTICATE
-- =========================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
    select exists (
        select 1 from public.admin_users
        where user_id = auth.uid() and enabled = true
    );
$$;

-- Operazioni bulk Admin atomiche. La chiusura Admin è esplicita:
-- chiudere una room mostra ai giocatori che l'amministratore l'ha chiusa;
-- chiudere una partita chiude automaticamente anche la relativa room.

create or replace function public.admin_close_uno_room(p_room_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer := 0;
begin
    if not public.is_admin() then
        raise exception using errcode='42501', message='Operazione riservata agli amministratori';
    end if;
    update public.uno_rooms
    set status='closed', updated_at=now()
    where id=p_room_id and status in ('waiting','playing','finished');
    get diagnostics affected = row_count;
    if affected > 0 then
        update public.uno_players
        set connected=false, last_seen=null, updated_at=now()
        where room_id=p_room_id;
    end if;
    return affected;
end;
$$;

create or replace function public.admin_close_all_uno_rooms()
returns integer language plpgsql security definer set search_path=public as $$
declare room_ids uuid[]; affected integer := 0;
begin
    if not public.is_admin() then
        raise exception using errcode='42501', message='Operazione riservata agli amministratori';
    end if;
    select coalesce(array_agg(id), array[]::uuid[]) into room_ids
    from public.uno_rooms where status in ('waiting','playing','finished');
    affected := cardinality(room_ids);
    if affected > 0 then
        update public.uno_rooms set status='closed', updated_at=now() where id=any(room_ids);
        update public.uno_players
        set connected=false, last_seen=null, updated_at=now()
        where room_id=any(room_ids);
    end if;
    return affected;
end;
$$;

create or replace function public.admin_close_all_uno_matches()
returns integer language plpgsql security definer set search_path=public as $$
declare room_ids uuid[]; affected integer := 0;
begin
    if not public.is_admin() then
        raise exception using errcode='42501', message='Operazione riservata agli amministratori';
    end if;
    select coalesce(array_agg(id), array[]::uuid[]) into room_ids
    from public.uno_rooms where status='playing';
    affected := cardinality(room_ids);
    if affected > 0 then
        update public.uno_rooms
        set status='waiting', game_state=null, updated_at=now()
        where id=any(room_ids);
        update public.uno_players
        set is_ready=false, updated_at=now()
        where room_id=any(room_ids);
    end if;
    return affected;
end;
$$;

create or replace function public.admin_close_undercover_room(p_room_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer := 0;
begin
    if not public.is_admin() then
        raise exception using errcode='42501', message='Operazione riservata agli amministratori';
    end if;
    update public.undercover_rooms
    set status='closed',
        game_state=coalesce(game_state,'{}'::jsonb) || jsonb_build_object('phase','closed','adminClosed',true,'adminCloseReason','room','adminCloseMessage','L''amministratore ha chiuso la stanza.'),
        updated_at=now()
    where id=p_room_id and status<>'closed';
    get diagnostics affected = row_count;
    if affected > 0 then
        update public.undercover_players
        set connected=false, updated_at=now()
        where room_id=p_room_id;
    end if;
    return affected;
end;
$$;

create or replace function public.admin_close_all_undercover_rooms()
returns integer language plpgsql security definer set search_path=public as $$
declare room_ids uuid[]; affected integer := 0;
begin
    if not public.is_admin() then
        raise exception using errcode='42501', message='Operazione riservata agli amministratori';
    end if;
    select coalesce(array_agg(id), array[]::uuid[]) into room_ids
    from public.undercover_rooms
    where status <> 'closed';
    affected := cardinality(room_ids);
    if affected > 0 then
        update public.undercover_rooms
        set status='closed',
            game_state=coalesce(game_state,'{}'::jsonb) || jsonb_build_object('phase','closed','adminClosed',true,'adminCloseReason','room','adminCloseMessage','L''amministratore ha chiuso la stanza.'),
            updated_at=now()
        where id=any(room_ids);
        update public.undercover_players
        set connected=false, updated_at=now()
        where room_id=any(room_ids);
    end if;
    return affected;
end;
$$;

create or replace function public.admin_close_all_undercover_matches()
returns integer language plpgsql security definer set search_path=public as $$
declare room_ids uuid[]; affected integer := 0;
begin
    if not public.is_admin() then
        raise exception using errcode='42501', message='Operazione riservata agli amministratori';
    end if;
    select coalesce(array_agg(id), array[]::uuid[]) into room_ids
    from public.undercover_rooms
    where status not in ('lobby','closed');
    affected := cardinality(room_ids);
    if affected > 0 then
        update public.undercover_rooms
        set status='closed',
            game_state=coalesce(game_state,'{}'::jsonb) || jsonb_build_object('phase','closed','adminClosed',true,'adminCloseReason','match','adminCloseMessage','L''amministratore ha chiuso la partita e la stanza.'),
            updated_at=now()
        where id=any(room_ids);
        update public.undercover_players
        set connected=false, updated_at=now()
        where room_id=any(room_ids);
    end if;
    return affected;
end;
$$;

revoke all on function public.admin_close_uno_room(uuid) from public, anon;
revoke all on function public.admin_close_all_uno_rooms() from public, anon;
revoke all on function public.admin_close_all_uno_matches() from public, anon;
revoke all on function public.admin_close_undercover_room(uuid) from public, anon;
revoke all on function public.admin_close_all_undercover_rooms() from public, anon;
revoke all on function public.admin_close_all_undercover_matches() from public, anon;
grant execute on function public.admin_close_uno_room(uuid) to authenticated;
grant execute on function public.admin_close_all_uno_rooms() to authenticated;
grant execute on function public.admin_close_all_uno_matches() to authenticated;
grant execute on function public.admin_close_undercover_room(uuid) to authenticated;
grant execute on function public.admin_close_all_undercover_rooms() to authenticated;
grant execute on function public.admin_close_all_undercover_matches() to authenticated;

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_games enable row level security;
alter table public.site_messages enable row level security;
alter table public.blocked_users enable row level security;
alter table public.admin_logs enable row level security;
alter table public.uno_rooms enable row level security;
alter table public.uno_players enable row level security;
alter table public.undercover_rooms enable row level security;
alter table public.undercover_players enable row level security;
alter table public.undercover_categories enable row level security;
alter table public.undercover_word_pairs enable row level security;

grant select on public.admin_users to authenticated;
grant select on public.site_settings, public.site_games, public.site_messages to anon, authenticated;
grant select, insert, update, delete on public.site_settings, public.site_games, public.site_messages, public.blocked_users, public.admin_logs to authenticated;
grant select, insert, update, delete on public.uno_rooms, public.uno_players to anon, authenticated;
grant select on public.undercover_rooms, public.undercover_players to anon, authenticated;
grant select on public.undercover_categories, public.undercover_word_pairs to anon, authenticated;
grant update, delete on public.undercover_rooms, public.undercover_players to authenticated;

do $$
begin
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_users' and policyname='admin_users_v2_self_read') then
        create policy admin_users_v2_self_read on public.admin_users for select to authenticated using (user_id=auth.uid());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_settings' and policyname='site_settings_v2_public_read') then
        create policy site_settings_v2_public_read on public.site_settings for select to anon,authenticated using (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_settings' and policyname='site_settings_v2_admin_all') then
        create policy site_settings_v2_admin_all on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_games' and policyname='site_games_v2_public_read') then
        create policy site_games_v2_public_read on public.site_games for select to anon,authenticated using (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_games' and policyname='site_games_v2_admin_all') then
        create policy site_games_v2_admin_all on public.site_games for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_messages' and policyname='site_messages_v2_public_read') then
        create policy site_messages_v2_public_read on public.site_messages for select to anon,authenticated using (active=true or public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_messages' and policyname='site_messages_v2_admin_all') then
        create policy site_messages_v2_admin_all on public.site_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='blocked_users' and policyname='blocked_users_v2_admin_all') then
        create policy blocked_users_v2_admin_all on public.blocked_users for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_logs' and policyname='admin_logs_v2_admin_all') then
        create policy admin_logs_v2_admin_all on public.admin_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='uno_rooms' and policyname='uno_rooms_v2_legacy_gameplay') then
        create policy uno_rooms_v2_legacy_gameplay on public.uno_rooms for all to anon using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='uno_rooms' and policyname='uno_rooms_v2_admin_all') then
        create policy uno_rooms_v2_admin_all on public.uno_rooms for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='uno_players' and policyname='uno_players_v2_legacy_gameplay') then
        create policy uno_players_v2_legacy_gameplay on public.uno_players for all to anon using (true) with check (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='uno_players' and policyname='uno_players_v2_admin_all') then
        create policy uno_players_v2_admin_all on public.uno_players for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='undercover_rooms' and policyname='undercover_rooms_v2_admin_all') then
        create policy undercover_rooms_v2_admin_all on public.undercover_rooms for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='undercover_players' and policyname='undercover_players_v2_admin_all') then
        create policy undercover_players_v2_admin_all on public.undercover_players for all to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='undercover_rooms' and policyname='undercover_rooms_v2_public_read') then
        create policy undercover_rooms_v2_public_read on public.undercover_rooms for select to anon,authenticated using (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='undercover_players' and policyname='undercover_players_v2_public_read') then
        create policy undercover_players_v2_public_read on public.undercover_players for select to anon,authenticated using (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='undercover_categories' and policyname='undercover_categories_v2_public_read') then
        create policy undercover_categories_v2_public_read on public.undercover_categories for select to anon,authenticated using (active is distinct from false);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='undercover_word_pairs' and policyname='undercover_word_pairs_v2_public_read') then
        create policy undercover_word_pairs_v2_public_read on public.undercover_word_pairs for select to anon,authenticated using (active is distinct from false);
    end if;
end;
$$;

-- =========================================================
-- REALTIME E SCHEMA CACHE
-- =========================================================

do $$
declare v_table_name text;
begin
    foreach v_table_name in array array['site_settings','site_games','site_messages','admin_logs','uno_rooms','uno_players','undercover_rooms','undercover_players']
    loop
        if to_regclass('public.' || v_table_name) is not null
           and not exists (
               select 1 from pg_publication_tables
               where pubname='supabase_realtime' and schemaname='public' and tablename=v_table_name
           ) then
            execute format('alter publication supabase_realtime add table public.%I', v_table_name);
        end if;
    end loop;
end;
$$;

notify pgrst, 'reload schema';
