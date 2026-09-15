-- CuginiParty / Indovina Chi online
-- Migration additiva e idempotente. Eseguire nel Supabase SQL Editor.
-- Nessuna chiave privilegiata viene usata dal browser.

create extension if not exists pgcrypto;

insert into public.site_games (
  game_id,name,enabled,multiplayer_enabled,new_rooms_enabled,disabled_message,
  status,visible,sort_order,path,description,category,icon
) values (
  'indovina-chi','Indovina Chi',true,true,true,'','available',true,21,
  'games/indovina-chi.html',
  'Fai domande, elimina i sospetti e scopri il personaggio segreto del tuo avversario prima che lui scopra il tuo.',
  'Party','assets/indovina-chi-icon.svg'
) on conflict (game_id) do update set
  name=excluded.name,
  path=excluded.path,
  description=excluded.description,
  category=excluded.category,
  icon=excluded.icon,
  multiplayer_enabled=excluded.multiplayer_enabled,
  new_rooms_enabled=excluded.new_rooms_enabled;

create table if not exists public.guess_who_characters (
  id text primary key,
  name text not null unique,
  attributes jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint guess_who_characters_attributes_object check (jsonb_typeof(attributes)='object')
);

create table if not exists public.guess_who_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  status text not null default 'lobby' check (status in ('lobby','playing','finished','closed')),
  phase text not null default 'lobby' check (phase in ('lobby','turn','question','review','finished','closed')),
  host_player_id uuid,
  current_turn_player_id uuid,
  first_player_id uuid,
  pending_question_id uuid,
  winner_player_id uuid,
  loser_player_id uuid,
  result_reason text check (result_reason is null or result_reason in ('correct_guess','wrong_guess','abandoned')),
  match_number integer not null default 0 check (match_number >= 0),
  turn_count integer not null default 0 check (turn_count >= 0),
  version bigint not null default 1,
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz not null default (now() + interval '4 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guess_who_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.guess_who_rooms(id) on delete cascade,
  name text not null,
  seat smallint not null check (seat in (1,2)),
  connected boolean not null default true,
  ready_rematch boolean not null default false,
  questions_asked integer not null default 0 check (questions_asked >= 0),
  last_seen timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  unique(room_id,seat)
);

create table if not exists public.guess_who_player_sessions (
  room_id uuid not null references public.guess_who_rooms(id) on delete cascade,
  player_id uuid not null references public.guess_who_players(id) on delete cascade,
  token_hash bytea not null,
  created_at timestamptz not null default now(),
  primary key(room_id,player_id),
  unique(token_hash)
);

create table if not exists public.guess_who_secrets (
  room_id uuid not null references public.guess_who_rooms(id) on delete cascade,
  player_id uuid not null references public.guess_who_players(id) on delete cascade,
  character_id text not null references public.guess_who_characters(id),
  assigned_at timestamptz not null default now(),
  primary key(room_id,player_id)
);

create table if not exists public.guess_who_questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.guess_who_rooms(id) on delete cascade,
  match_number integer not null,
  asker_player_id uuid not null references public.guess_who_players(id) on delete cascade,
  answerer_player_id uuid not null references public.guess_who_players(id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer boolean,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

-- Questa è l'unica tabella letta da Realtime. Non contiene nomi, domande,
-- risposte o personaggi: segnala soltanto che lo stato autorizzato va riletto.
create table if not exists public.guess_who_events (
  room_id uuid primary key references public.guess_who_rooms(id) on delete cascade,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists guess_who_rooms_expiry_idx on public.guess_who_rooms(expires_at);
create index if not exists guess_who_players_room_idx on public.guess_who_players(room_id,seat);
create index if not exists guess_who_questions_room_match_idx on public.guess_who_questions(room_id,match_number,created_at);

insert into public.guess_who_characters(id,name,attributes) values
('maya','Maya','{"hairColor":"black","hairLength":"long","curly":true,"glasses":true,"hat":false,"beard":false,"moustache":false,"earrings":true,"smile":true,"freckles":true}'),
('teo','Teo','{"hairColor":"brown","hairLength":"short","curly":false,"glasses":false,"hat":true,"beard":true,"moustache":true,"earrings":true,"smile":false,"freckles":false}'),
('luna','Luna','{"hairColor":"blond","hairLength":"long","curly":false,"glasses":true,"hat":false,"beard":false,"moustache":true,"earrings":false,"smile":true,"freckles":false}'),
('nilo','Nilo','{"hairColor":"red","hairLength":"short","curly":true,"glasses":false,"hat":true,"beard":true,"moustache":false,"earrings":false,"smile":false,"freckles":true}'),
('cora','Cora','{"hairColor":"gray","hairLength":"long","curly":false,"glasses":true,"hat":false,"beard":false,"moustache":false,"earrings":true,"smile":false,"freckles":true}'),
('elio','Elio','{"hairColor":"none","hairLength":"none","curly":false,"glasses":false,"hat":true,"beard":true,"moustache":true,"earrings":true,"smile":true,"freckles":false}'),
('zara','Zara','{"hairColor":"black","hairLength":"short","curly":false,"glasses":true,"hat":false,"beard":false,"moustache":true,"earrings":false,"smile":false,"freckles":false}'),
('berto','Berto','{"hairColor":"brown","hairLength":"long","curly":true,"glasses":false,"hat":true,"beard":true,"moustache":false,"earrings":false,"smile":true,"freckles":true}'),
('iris','Iris','{"hairColor":"blond","hairLength":"short","curly":false,"glasses":true,"hat":false,"beard":false,"moustache":false,"earrings":true,"smile":true,"freckles":true}'),
('rami','Rami','{"hairColor":"red","hairLength":"long","curly":true,"glasses":false,"hat":false,"beard":true,"moustache":true,"earrings":true,"smile":false,"freckles":false}'),
('ada','Ada','{"hairColor":"gray","hairLength":"short","curly":false,"glasses":true,"hat":true,"beard":false,"moustache":true,"earrings":false,"smile":true,"freckles":false}'),
('pino','Pino','{"hairColor":"none","hairLength":"none","curly":false,"glasses":false,"hat":false,"beard":true,"moustache":false,"earrings":false,"smile":false,"freckles":true}'),
('neve','Neve','{"hairColor":"black","hairLength":"long","curly":true,"glasses":true,"hat":true,"beard":false,"moustache":false,"earrings":true,"smile":true,"freckles":true}'),
('milo','Milo','{"hairColor":"brown","hairLength":"short","curly":false,"glasses":false,"hat":false,"beard":true,"moustache":true,"earrings":true,"smile":false,"freckles":false}'),
('sole','Sole','{"hairColor":"blond","hairLength":"long","curly":false,"glasses":true,"hat":true,"beard":false,"moustache":true,"earrings":false,"smile":false,"freckles":true}'),
('timo','Timo','{"hairColor":"red","hairLength":"short","curly":true,"glasses":false,"hat":false,"beard":true,"moustache":false,"earrings":false,"smile":true,"freckles":false}'),
('olga','Olga','{"hairColor":"gray","hairLength":"long","curly":false,"glasses":true,"hat":false,"beard":false,"moustache":false,"earrings":true,"smile":false,"freckles":true}'),
('gino','Gino','{"hairColor":"none","hairLength":"none","curly":false,"glasses":false,"hat":true,"beard":true,"moustache":true,"earrings":true,"smile":true,"freckles":false}'),
('lia','Lia','{"hairColor":"black","hairLength":"short","curly":true,"glasses":true,"hat":false,"beard":false,"moustache":true,"earrings":false,"smile":false,"freckles":false}'),
('vasco','Vasco','{"hairColor":"brown","hairLength":"long","curly":false,"glasses":false,"hat":false,"beard":true,"moustache":false,"earrings":false,"smile":true,"freckles":true}'),
('dora','Dora','{"hairColor":"blond","hairLength":"short","curly":true,"glasses":true,"hat":true,"beard":false,"moustache":true,"earrings":true,"smile":true,"freckles":false}'),
('runa','Runa','{"hairColor":"red","hairLength":"long","curly":false,"glasses":false,"hat":false,"beard":true,"moustache":true,"earrings":true,"smile":false,"freckles":true}'),
('enea','Enea','{"hairColor":"gray","hairLength":"short","curly":true,"glasses":true,"hat":true,"beard":false,"moustache":false,"earrings":false,"smile":false,"freckles":false}'),
('alba','Alba','{"hairColor":"none","hairLength":"none","curly":false,"glasses":false,"hat":false,"beard":true,"moustache":false,"earrings":false,"smile":true,"freckles":true}')
on conflict(id) do update set name=excluded.name,attributes=excluded.attributes,active=true;

alter table public.guess_who_characters enable row level security;
alter table public.guess_who_rooms enable row level security;
alter table public.guess_who_players enable row level security;
alter table public.guess_who_player_sessions enable row level security;
alter table public.guess_who_secrets enable row level security;
alter table public.guess_who_questions enable row level security;
alter table public.guess_who_events enable row level security;

revoke all on public.guess_who_rooms,public.guess_who_players,public.guess_who_player_sessions,public.guess_who_secrets,public.guess_who_questions from anon,authenticated;
revoke all on public.guess_who_characters,public.guess_who_events from anon,authenticated;
grant select on public.guess_who_characters,public.guess_who_events to anon,authenticated;

drop policy if exists guess_who_characters_public_read on public.guess_who_characters;
create policy guess_who_characters_public_read on public.guess_who_characters for select to anon,authenticated using(active);
drop policy if exists guess_who_events_signal_read on public.guess_who_events;
create policy guess_who_events_signal_read on public.guess_who_events for select to anon,authenticated using(true);

create or replace function public.guess_who_authorized(p_room_id uuid,p_player_id uuid,p_token text)
returns boolean language sql stable security definer set search_path=public,extensions as $$
  select exists(
    select 1 from public.guess_who_player_sessions
    where room_id=p_room_id and player_id=p_player_id
      and token_hash=digest(coalesce(p_token,''),'sha256')
  )
$$;

create or replace function public.guess_who_question_text(p_key text)
returns text language sql immutable set search_path=public as $$
  select case p_key
    when 'hair_black' then 'Ha i capelli neri?'
    when 'hair_brown' then 'Ha i capelli castani?'
    when 'hair_blond' then 'Ha i capelli biondi?'
    when 'hair_red' then 'Ha i capelli rossi?'
    when 'hair_gray' then 'Ha i capelli grigi?'
    when 'hair_long' then 'Ha i capelli lunghi?'
    when 'hair_curly' then 'Ha i capelli ricci?'
    when 'bald' then 'È senza capelli?'
    when 'beard' then 'Ha la barba?'
    when 'moustache' then 'Ha i baffi?'
    when 'smile' then 'Sta sorridendo?'
    when 'freckles' then 'Ha le lentiggini?'
    when 'glasses' then 'Ha gli occhiali?'
    when 'hat' then 'Indossa un cappello?'
    when 'earrings' then 'Ha gli orecchini?'
    else null end
$$;

create or replace function public.guess_who_question_answer(p_character_id text,p_key text)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare a jsonb;
begin
  select attributes into a from public.guess_who_characters where id=p_character_id and active;
  if a is null or public.guess_who_question_text(p_key) is null then raise exception 'GW_INVALID_QUESTION'; end if;
  return case p_key
    when 'hair_black' then a->>'hairColor'='black'
    when 'hair_brown' then a->>'hairColor'='brown'
    when 'hair_blond' then a->>'hairColor'='blond'
    when 'hair_red' then a->>'hairColor'='red'
    when 'hair_gray' then a->>'hairColor'='gray'
    when 'hair_long' then a->>'hairLength'='long'
    when 'hair_curly' then (a->>'curly')::boolean
    when 'bald' then a->>'hairColor'='none'
    when 'beard' then (a->>'beard')::boolean
    when 'moustache' then (a->>'moustache')::boolean
    when 'smile' then (a->>'smile')::boolean
    when 'freckles' then (a->>'freckles')::boolean
    when 'glasses' then (a->>'glasses')::boolean
    when 'hat' then (a->>'hat')::boolean
    when 'earrings' then (a->>'earrings')::boolean
    else false end;
end $$;

create or replace function public.guess_who_bump_event(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_version bigint;
begin
  update public.guess_who_rooms
  set version=version+1,updated_at=now(),expires_at=greatest(expires_at,now()+interval '4 hours')
  where id=p_room_id returning version into v_version;
  insert into public.guess_who_events(room_id,version,updated_at) values(p_room_id,v_version,now())
  on conflict(room_id) do update set version=excluded.version,updated_at=excluded.updated_at;
end $$;

create or replace function public.guess_who_cleanup_expired()
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  delete from public.guess_who_rooms where expires_at<now();
  get diagnostics n=row_count;
  return n;
end $$;

create or replace function public.guess_who_create_room(p_name text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_name text:=left(regexp_replace(btrim(coalesce(p_name,'')),'[[:cntrl:]]','','g'),18);
declare v_code text; v_room uuid; v_player uuid; v_token text; i integer; j integer;
declare v_global_enabled boolean:=true; v_global_rooms boolean:=true; v_game_enabled boolean:=true; v_rooms_enabled boolean:=true;
begin
  if char_length(v_name)<1 then raise exception 'GW_NAME_REQUIRED'; end if;
  perform public.guess_who_cleanup_expired();
  select coalesce(multiplayer_enabled,true),coalesce(new_rooms_enabled,true) into v_global_enabled,v_global_rooms from public.site_settings where id=1;
  select coalesce(enabled,true) and coalesce(multiplayer_enabled,true),coalesce(new_rooms_enabled,true)
    into v_game_enabled,v_rooms_enabled from public.site_games where game_id='indovina-chi';
  if not coalesce(v_global_enabled,true) or not coalesce(v_game_enabled,true) then raise exception 'GW_MULTIPLAYER_DISABLED'; end if;
  if not coalesce(v_global_rooms,true) or not coalesce(v_rooms_enabled,true) then raise exception 'GW_NEW_ROOMS_DISABLED'; end if;
  for i in 1..20 loop
    v_code:='';
    for j in 1..5 loop v_code:=v_code||substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',1+floor(random()*32)::integer,1); end loop;
    exit when not exists(select 1 from public.guess_who_rooms where room_code=v_code);
  end loop;
  if exists(select 1 from public.guess_who_rooms where room_code=v_code) then raise exception 'GW_CODE_GENERATION'; end if;
  insert into public.guess_who_rooms(room_code) values(v_code) returning id into v_room;
  insert into public.guess_who_players(room_id,name,seat) values(v_room,v_name,1) returning id into v_player;
  update public.guess_who_rooms set host_player_id=v_player where id=v_room;
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.guess_who_player_sessions(room_id,player_id,token_hash) values(v_room,v_player,digest(v_token,'sha256'));
  insert into public.guess_who_events(room_id,version) values(v_room,1);
  return jsonb_build_object('roomId',v_room,'playerId',v_player,'token',v_token,'code',v_code);
end $$;

create or replace function public.guess_who_join_room(p_name text,p_code text)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_name text:=left(regexp_replace(btrim(coalesce(p_name,'')),'[[:cntrl:]]','','g'),18);
declare v_code text:=upper(btrim(coalesce(p_code,''))); v_room public.guess_who_rooms%rowtype;
declare v_player uuid; v_token text; v_count integer; v_enabled boolean:=true; v_global_enabled boolean:=true;
begin
  if char_length(v_name)<1 then raise exception 'GW_NAME_REQUIRED'; end if;
  perform public.guess_who_cleanup_expired();
  select coalesce(multiplayer_enabled,true) into v_global_enabled from public.site_settings where id=1;
  select coalesce(enabled,true) and coalesce(multiplayer_enabled,true) into v_enabled from public.site_games where game_id='indovina-chi';
  if not coalesce(v_global_enabled,true) or not coalesce(v_enabled,true) then raise exception 'GW_MULTIPLAYER_DISABLED'; end if;
  select * into v_room from public.guess_who_rooms where room_code=v_code for update;
  if not found then raise exception 'GW_ROOM_NOT_FOUND'; end if;
  if v_room.expires_at<now() then raise exception 'GW_ROOM_EXPIRED'; end if;
  if v_room.status<>'lobby' then raise exception 'GW_ROOM_STARTED'; end if;
  select count(*) into v_count from public.guess_who_players where room_id=v_room.id;
  if v_count>=2 then raise exception 'GW_ROOM_FULL'; end if;
  insert into public.guess_who_players(room_id,name,seat) values(v_room.id,v_name,2) returning id into v_player;
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.guess_who_player_sessions(room_id,player_id,token_hash) values(v_room.id,v_player,digest(v_token,'sha256'));
  perform public.guess_who_bump_event(v_room.id);
  return jsonb_build_object('roomId',v_room.id,'playerId',v_player,'token',v_token,'code',v_room.room_code);
end $$;

create or replace function public.guess_who_get_state(p_room_id uuid,p_player_id uuid,p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; v_players jsonb; v_history jsonb; v_pending jsonb;
declare v_secret text; v_opponent_secret text;
begin
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  update public.guess_who_players set connected=true,last_seen=now() where id=p_player_id and room_id=p_room_id;
  select * into r from public.guess_who_rooms where id=p_room_id;
  if not found then raise exception 'GW_ROOM_NOT_FOUND'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'name',p.name,'seat',p.seat,'connected',p.connected,'lastSeen',p.last_seen,
    'readyRematch',p.ready_rematch,'questionsAsked',p.questions_asked
  ) order by p.seat),'[]'::jsonb) into v_players from public.guess_who_players p where p.room_id=p_room_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,'key',q.question_key,'text',q.question_text,'answer',q.answer,'askerId',q.asker_player_id
  ) order by q.created_at),'[]'::jsonb) into v_history
  from public.guess_who_questions q where q.room_id=p_room_id and q.match_number=r.match_number and q.answer is not null;
  if r.pending_question_id is not null then
    select jsonb_build_object('id',q.id,'key',q.question_key,'text',q.question_text,'answer',q.answer,'askerId',q.asker_player_id,'answererId',q.answerer_player_id)
    into v_pending from public.guess_who_questions q where q.id=r.pending_question_id;
  end if;
  select character_id into v_secret from public.guess_who_secrets where room_id=p_room_id and player_id=p_player_id;
  if r.status='finished' then
    select character_id into v_opponent_secret from public.guess_who_secrets where room_id=p_room_id and player_id<>p_player_id;
  end if;
  return jsonb_build_object(
    'roomId',r.id,'code',r.room_code,'status',r.status,'phase',r.phase,'hostPlayerId',r.host_player_id,
    'currentTurnPlayerId',r.current_turn_player_id,'winnerPlayerId',r.winner_player_id,'loserPlayerId',r.loser_player_id,
    'resultReason',r.result_reason,'matchNumber',r.match_number,'turnCount',r.turn_count,'version',r.version,
    'startedAt',r.started_at,'finishedAt',r.finished_at,'mySecretId',v_secret,'opponentSecretId',v_opponent_secret,
    'pendingQuestion',v_pending,'players',v_players,'history',v_history
  );
end $$;

create or replace function public.guess_who_start_game(p_room_id uuid,p_player_id uuid,p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; v_players uuid[]; v_chars text[]; v_first uuid;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not found then raise exception 'GW_ROOM_NOT_FOUND'; end if;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.host_player_id<>p_player_id then raise exception 'GW_NOT_HOST'; end if;
  if r.status<>'lobby' then raise exception 'GW_ROOM_STARTED'; end if;
  select array_agg(id order by seat) into v_players from public.guess_who_players where room_id=p_room_id;
  if coalesce(array_length(v_players,1),0)<>2 then raise exception 'GW_NEED_TWO_PLAYERS'; end if;
  select array_agg(id) into v_chars from (select id from public.guess_who_characters where active order by random() limit 2) c;
  if coalesce(array_length(v_chars,1),0)<>2 then raise exception 'GW_CHARACTER_POOL'; end if;
  delete from public.guess_who_secrets where room_id=p_room_id;
  insert into public.guess_who_secrets(room_id,player_id,character_id) values(p_room_id,v_players[1],v_chars[1]),(p_room_id,v_players[2],v_chars[2]);
  v_first:=case when random()<.5 then v_players[1] else v_players[2] end;
  update public.guess_who_players set ready_rematch=false,questions_asked=0 where room_id=p_room_id;
  update public.guess_who_rooms set status='playing',phase='turn',current_turn_player_id=v_first,first_player_id=v_first,
    pending_question_id=null,winner_player_id=null,loser_player_id=null,result_reason=null,match_number=1,turn_count=1,
    started_at=now(),finished_at=null where id=p_room_id;
  perform public.guess_who_bump_event(p_room_id);
  return jsonb_build_object('started',true);
end $$;

create or replace function public.guess_who_ask_question(p_room_id uuid,p_player_id uuid,p_token text,p_question_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; v_text text; v_answerer uuid; v_question uuid;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.status<>'playing' or r.phase<>'turn' then raise exception 'GW_INVALID_PHASE'; end if;
  if r.current_turn_player_id<>p_player_id then raise exception 'GW_NOT_YOUR_TURN'; end if;
  v_text:=public.guess_who_question_text(p_question_key);
  if v_text is null then raise exception 'GW_INVALID_QUESTION'; end if;
  select id into v_answerer from public.guess_who_players where room_id=p_room_id and id<>p_player_id limit 1;
  if v_answerer is null then raise exception 'GW_NEED_TWO_PLAYERS'; end if;
  insert into public.guess_who_questions(room_id,match_number,asker_player_id,answerer_player_id,question_key,question_text)
  values(p_room_id,r.match_number,p_player_id,v_answerer,p_question_key,v_text) returning id into v_question;
  update public.guess_who_players set questions_asked=questions_asked+1 where id=p_player_id;
  update public.guess_who_rooms set phase='question',pending_question_id=v_question where id=p_room_id;
  perform public.guess_who_bump_event(p_room_id);
  return jsonb_build_object('questionId',v_question);
end $$;

create or replace function public.guess_who_answer_question(p_room_id uuid,p_player_id uuid,p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; q public.guess_who_questions%rowtype; v_secret text; v_answer boolean;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.status<>'playing' or r.phase<>'question' or r.pending_question_id is null then raise exception 'GW_INVALID_PHASE'; end if;
  select * into q from public.guess_who_questions where id=r.pending_question_id for update;
  if q.answerer_player_id<>p_player_id or q.answer is not null then raise exception 'GW_INVALID_PHASE'; end if;
  select character_id into v_secret from public.guess_who_secrets where room_id=p_room_id and player_id=p_player_id;
  v_answer:=public.guess_who_question_answer(v_secret,q.question_key);
  update public.guess_who_questions set answer=v_answer,answered_at=now() where id=q.id;
  update public.guess_who_rooms set phase='review' where id=p_room_id;
  perform public.guess_who_bump_event(p_room_id);
  return jsonb_build_object('answer',v_answer);
end $$;

create or replace function public.guess_who_finish_turn(p_room_id uuid,p_player_id uuid,p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; q public.guess_who_questions%rowtype;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.status<>'playing' or r.phase<>'review' or r.pending_question_id is null then raise exception 'GW_INVALID_PHASE'; end if;
  select * into q from public.guess_who_questions where id=r.pending_question_id;
  if q.asker_player_id<>p_player_id or q.answer is null then raise exception 'GW_INVALID_PHASE'; end if;
  update public.guess_who_rooms set phase='turn',current_turn_player_id=q.answerer_player_id,pending_question_id=null,turn_count=turn_count+1 where id=p_room_id;
  perform public.guess_who_bump_event(p_room_id);
  return jsonb_build_object('currentTurnPlayerId',q.answerer_player_id);
end $$;

create or replace function public.guess_who_make_guess(p_room_id uuid,p_player_id uuid,p_token text,p_character_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; v_opponent uuid; v_secret text; v_winner uuid; v_loser uuid; v_correct boolean;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.status='finished' then raise exception 'GW_ALREADY_FINISHED'; end if;
  if r.status<>'playing' or r.phase<>'turn' then raise exception 'GW_INVALID_PHASE'; end if;
  if r.current_turn_player_id<>p_player_id then raise exception 'GW_NOT_YOUR_TURN'; end if;
  if not exists(select 1 from public.guess_who_characters where id=p_character_id and active) then raise exception 'GW_CHARACTER_INVALID'; end if;
  select id into v_opponent from public.guess_who_players where room_id=p_room_id and id<>p_player_id limit 1;
  select character_id into v_secret from public.guess_who_secrets where room_id=p_room_id and player_id=v_opponent;
  v_correct:=v_secret=p_character_id;
  v_winner:=case when v_correct then p_player_id else v_opponent end;
  v_loser:=case when v_correct then v_opponent else p_player_id end;
  update public.guess_who_rooms set status='finished',phase='finished',winner_player_id=v_winner,loser_player_id=v_loser,
    result_reason=case when v_correct then 'correct_guess' else 'wrong_guess' end,finished_at=now() where id=p_room_id;
  perform public.guess_who_bump_event(p_room_id);
  return jsonb_build_object('correct',v_correct,'winnerPlayerId',v_winner);
end $$;

create or replace function public.guess_who_request_rematch(p_room_id uuid,p_player_id uuid,p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; v_ready integer; v_players uuid[]; v_chars text[]; v_first uuid;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.status<>'finished' then raise exception 'GW_INVALID_PHASE'; end if;
  update public.guess_who_players set ready_rematch=true,connected=true,last_seen=now() where room_id=p_room_id and id=p_player_id;
  select count(*) into v_ready from public.guess_who_players where room_id=p_room_id and ready_rematch;
  if v_ready=2 then
    select array_agg(id order by seat) into v_players from public.guess_who_players where room_id=p_room_id;
    select array_agg(id) into v_chars from (select id from public.guess_who_characters where active order by random() limit 2) c;
    v_first:=case when r.first_player_id=v_players[1] then v_players[2] else v_players[1] end;
    delete from public.guess_who_questions where room_id=p_room_id;
    delete from public.guess_who_secrets where room_id=p_room_id;
    insert into public.guess_who_secrets(room_id,player_id,character_id) values(p_room_id,v_players[1],v_chars[1]),(p_room_id,v_players[2],v_chars[2]);
    update public.guess_who_players set ready_rematch=false,questions_asked=0 where room_id=p_room_id;
    update public.guess_who_rooms set status='playing',phase='turn',current_turn_player_id=v_first,first_player_id=v_first,
      pending_question_id=null,winner_player_id=null,loser_player_id=null,result_reason=null,match_number=match_number+1,
      turn_count=1,started_at=now(),finished_at=null where id=p_room_id;
  end if;
  perform public.guess_who_bump_event(p_room_id);
  return jsonb_build_object('readyCount',v_ready,'started',v_ready=2);
end $$;

create or replace function public.guess_who_set_presence(p_room_id uuid,p_player_id uuid,p_token text,p_connected boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_old boolean;
begin
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  select connected into v_old from public.guess_who_players where room_id=p_room_id and id=p_player_id;
  update public.guess_who_players set connected=coalesce(p_connected,false),last_seen=now() where room_id=p_room_id and id=p_player_id;
  if v_old is distinct from coalesce(p_connected,false) then perform public.guess_who_bump_event(p_room_id); end if;
  return true;
end $$;

create or replace function public.guess_who_leave_room(p_room_id uuid,p_player_id uuid,p_token text)
returns boolean language plpgsql security definer set search_path=public as $$
declare r public.guess_who_rooms%rowtype; v_next uuid;
begin
  select * into r from public.guess_who_rooms where id=p_room_id for update;
  if not public.guess_who_authorized(p_room_id,p_player_id,p_token) then raise exception 'GW_NOT_AUTHORIZED'; end if;
  if r.status='lobby' then
    delete from public.guess_who_players where room_id=p_room_id and id=p_player_id;
    select id into v_next from public.guess_who_players where room_id=p_room_id order by seat limit 1;
    if v_next is null then delete from public.guess_who_rooms where id=p_room_id;
    else update public.guess_who_rooms set host_player_id=v_next where id=p_room_id; perform public.guess_who_bump_event(p_room_id); end if;
  else
    update public.guess_who_players set connected=false,last_seen=now() where room_id=p_room_id and id=p_player_id;
    perform public.guess_who_bump_event(p_room_id);
  end if;
  return true;
end $$;

-- Solo gli RPC pubblici necessari sono eseguibili dai client.
revoke all on function public.guess_who_authorized(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.guess_who_question_text(text) from public,anon,authenticated;
revoke all on function public.guess_who_question_answer(text,text) from public,anon,authenticated;
revoke all on function public.guess_who_bump_event(uuid) from public,anon,authenticated;
revoke all on function public.guess_who_cleanup_expired() from public,anon,authenticated;

revoke all on function public.guess_who_create_room(text) from public;
revoke all on function public.guess_who_join_room(text,text) from public;
revoke all on function public.guess_who_get_state(uuid,uuid,text) from public;
revoke all on function public.guess_who_start_game(uuid,uuid,text) from public;
revoke all on function public.guess_who_ask_question(uuid,uuid,text,text) from public;
revoke all on function public.guess_who_answer_question(uuid,uuid,text) from public;
revoke all on function public.guess_who_finish_turn(uuid,uuid,text) from public;
revoke all on function public.guess_who_make_guess(uuid,uuid,text,text) from public;
revoke all on function public.guess_who_request_rematch(uuid,uuid,text) from public;
revoke all on function public.guess_who_set_presence(uuid,uuid,text,boolean) from public;
revoke all on function public.guess_who_leave_room(uuid,uuid,text) from public;

grant execute on function public.guess_who_create_room(text) to anon,authenticated;
grant execute on function public.guess_who_join_room(text,text) to anon,authenticated;
grant execute on function public.guess_who_get_state(uuid,uuid,text) to anon,authenticated;
grant execute on function public.guess_who_start_game(uuid,uuid,text) to anon,authenticated;
grant execute on function public.guess_who_ask_question(uuid,uuid,text,text) to anon,authenticated;
grant execute on function public.guess_who_answer_question(uuid,uuid,text) to anon,authenticated;
grant execute on function public.guess_who_finish_turn(uuid,uuid,text) to anon,authenticated;
grant execute on function public.guess_who_make_guess(uuid,uuid,text,text) to anon,authenticated;
grant execute on function public.guess_who_request_rematch(uuid,uuid,text) to anon,authenticated;
grant execute on function public.guess_who_set_presence(uuid,uuid,text,boolean) to anon,authenticated;
grant execute on function public.guess_who_leave_room(uuid,uuid,text) to anon,authenticated;

-- Supabase Realtime ignora i duplicati; il blocco rende la migration ri-eseguibile.
do $$ begin
  if not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='guess_who_events'
  ) then alter publication supabase_realtime add table public.guess_who_events; end if;
end $$;
