-- CuginiParty / Undercover online
-- Migrazione additiva e idempotente. Eseguire nel Supabase SQL Editor.
-- Usa lo schema esistente, in particolare undercover_rooms.room_code.

create extension if not exists pgcrypto;

-- Unica state machine pubblica. Prima converte in modo conservativo gli
-- eventuali valori delle versioni precedenti, poi reinstalla il constraint.
alter table public.undercover_rooms
  drop constraint if exists undercover_rooms_status_check;

update public.undercover_rooms
set status=case
  when game_state->>'phase' in('lobby','revealing','round','voting','result','white_guess','victory','closed')
    then game_state->>'phase'
  else 'lobby'
end
where status not in('lobby','revealing','round','voting','result','white_guess','victory','closed')
   or status is null;

-- Ripara le chiusure Admin della versione precedente, che venivano salvate
-- come una falsa vittoria degli impostori.
update public.undercover_rooms
set status='closed',
    game_state=coalesce(game_state,'{}'::jsonb) || jsonb_build_object(
      'phase','closed',
      'adminCloseReason',coalesce(game_state->>'adminCloseReason','room'),
      'adminCloseMessage',coalesce(game_state->>'adminCloseMessage','L''amministratore ha chiuso la stanza.')
    )
where status='victory' and game_state->>'adminClosed'='true';

update public.undercover_rooms
set game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{phase}',to_jsonb(status),true)
where coalesce(game_state->>'phase','')<>status;

alter table public.undercover_rooms alter column status set default 'lobby';
alter table public.undercover_rooms alter column status set not null;

alter table public.undercover_rooms
  add constraint undercover_rooms_status_check
  check(status in('lobby','revealing','round','voting','result','white_guess','victory','closed'));

alter table public.undercover_rooms
  drop constraint if exists undercover_rooms_game_state_phase_check;
alter table public.undercover_rooms
  add constraint undercover_rooms_game_state_phase_check
  check(game_state is null or(game_state?'phase' and game_state->>'phase'=status));

alter table public.undercover_rooms
  add column if not exists role_mode text not null default 'auto';
update public.undercover_rooms
set role_mode='auto'
where role_mode is null or role_mode not in('auto','manual');
alter table public.undercover_rooms
  drop constraint if exists undercover_rooms_role_mode_check;
alter table public.undercover_rooms
  add constraint undercover_rooms_role_mode_check
  check(role_mode in('auto','manual'));
update public.undercover_rooms
set mr_white_count=1
where mr_white_count is null or mr_white_count<1;
alter table public.undercover_rooms
  drop constraint if exists undercover_rooms_mr_white_required_check;
alter table public.undercover_rooms
  add constraint undercover_rooms_mr_white_required_check
  check(mr_white_count between 1 and 2);

create table if not exists public.undercover_private_cards (
  room_id uuid not null references public.undercover_rooms(id) on delete cascade,
  player_id uuid not null,
  role text not null check (role in ('civilian','undercover','mrwhite')),
  word text not null,
  civilian_word text not null,
  undercover_word text not null,
  created_at timestamptz not null default now(),
  primary key (room_id,player_id)
);
alter table public.undercover_private_cards add column if not exists undercover_word text;
update public.undercover_private_cards set undercover_word=coalesce(undercover_word,'') where undercover_word is null;
alter table public.undercover_private_cards alter column undercover_word set not null;

create table if not exists public.undercover_player_sessions (
  room_id uuid not null references public.undercover_rooms(id) on delete cascade,
  player_id uuid not null,
  client_id text not null,
  created_at timestamptz not null default now(),
  primary key (room_id,player_id),
  unique (room_id,client_id)
);

create index if not exists undercover_players_room_joined_idx
  on public.undercover_players(room_id,joined_at);
create unique index if not exists undercover_rooms_room_code_unique_idx
  on public.undercover_rooms(room_code);
alter table public.undercover_votes
  add column if not exists round_number integer;
alter table public.undercover_votes
  add column if not exists ballot_number integer;
alter table public.undercover_votes alter column target_player_id drop not null;
update public.undercover_votes set round_number=1 where round_number is null;
update public.undercover_votes set ballot_number=1 where ballot_number is null;
alter table public.undercover_votes alter column round_number set default 1;
alter table public.undercover_votes alter column round_number set not null;
alter table public.undercover_votes alter column ballot_number set default 1;
alter table public.undercover_votes alter column ballot_number set not null;
alter table public.undercover_votes
  drop constraint if exists undercover_votes_not_self_check;
alter table public.undercover_votes
  add constraint undercover_votes_not_self_check
  check(voter_player_id<>target_player_id) not valid;
drop index if exists public.undercover_votes_one_vote_per_player_idx;
create unique index if not exists undercover_votes_one_vote_per_ballot_idx
  on public.undercover_votes(room_id,round_number,ballot_number,voter_player_id);
create index if not exists undercover_votes_room_ballot_target_idx
  on public.undercover_votes(room_id,round_number,ballot_number,target_player_id);

insert into public.undercover_player_sessions(room_id,player_id,client_id)
select room_id,player_id,client_id from public.undercover_players
where client_id is not null and btrim(client_id)<>'' on conflict do nothing;
-- Il vero token resta nella tabella privata; questo valore legacy non è più una credenziale.
update public.undercover_players set client_id=player_id::text where client_id is distinct from player_id::text;

alter table public.undercover_private_cards enable row level security;
alter table public.undercover_player_sessions enable row level security;
alter table public.undercover_votes enable row level security;
alter table public.undercover_rooms enable row level security;
alter table public.undercover_players enable row level security;
alter table public.undercover_categories enable row level security;
alter table public.undercover_word_pairs enable row level security;
revoke all on public.undercover_private_cards from anon,authenticated;
revoke all on public.undercover_player_sessions from anon,authenticated;
revoke all on public.undercover_votes from anon,authenticated;
revoke insert,update,delete on public.undercover_rooms from anon,authenticated;
revoke insert,update,delete on public.undercover_players from anon,authenticated;
grant select on public.undercover_rooms,public.undercover_players,public.undercover_categories,public.undercover_word_pairs to anon,authenticated;
drop policy if exists undercover_rooms_public_read on public.undercover_rooms;
create policy undercover_rooms_public_read on public.undercover_rooms for select to anon,authenticated using(true);
drop policy if exists undercover_players_public_read on public.undercover_players;
create policy undercover_players_public_read on public.undercover_players for select to anon,authenticated using(true);
drop policy if exists undercover_categories_public_read on public.undercover_categories;
create policy undercover_categories_public_read on public.undercover_categories for select to anon,authenticated using(active is distinct from false);
drop policy if exists undercover_word_pairs_public_read on public.undercover_word_pairs;
create policy undercover_word_pairs_public_read on public.undercover_word_pairs for select to anon,authenticated using(active is distinct from false);

create or replace function public.undercover_normalize_text(value text) returns text
language sql immutable set search_path=public as $$
 select regexp_replace(translate(lower(btrim(coalesce(value,''))),
 'àáâäãåèéêëìíîïòóôöõùúûüýÿçñ','aaaaaaeeeeiiiiooooouuuuyycn'),'[[:space:]]+','','g')
$$;

create or replace function public.undercover_automatic_roles(p_player_count integer)
returns table(undercover_count integer,mr_white_count integer)
language sql immutable set search_path=public as $$
 select
   case
     when p_player_count>=19 then 5
     when p_player_count>=16 then 4
     when p_player_count>=13 then 3
     when p_player_count>=8 then 2
     when p_player_count>=5 then 1
     else 0
   end,
   case when p_player_count>=10 then 2 else 1 end
$$;

create or replace function public.undercover_sync_auto_roles(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare n integer; u integer; w integer;
begin
 select count(*)::integer into n
 from public.undercover_players
 where room_id=p_room_id and connected is distinct from false;
 select undercover_count,mr_white_count into u,w
 from public.undercover_automatic_roles(n);
 update public.undercover_rooms
 set undercover_count=u,mr_white_count=w,updated_at=now()
 where id=p_room_id and status='lobby' and role_mode='auto';
end $$;

create or replace function public.undercover_authorized(p_room_id uuid,p_player_id uuid,p_client_id text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.undercover_player_sessions
 where room_id=p_room_id and player_id=p_player_id and client_id=p_client_id)
$$;

create or replace function public.undercover_is_host(p_room_id uuid,p_player_id uuid,p_client_id text)
returns boolean language sql stable security definer set search_path=public as $$
 select public.undercover_authorized(p_room_id,p_player_id,p_client_id)
 and exists(select 1 from public.undercover_players where room_id=p_room_id and player_id=p_player_id and is_host=true)
$$;

create or replace function public.undercover_with_victory_words(p_room_id uuid,p_state jsonb,p_winner text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c text; u text;
begin
 select max(civilian_word),max(undercover_word) into c,u from public.undercover_private_cards where room_id=p_room_id;
 return jsonb_set(jsonb_set(jsonb_set(jsonb_set(p_state,'{phase}','"victory"'),'{winner}',to_jsonb(p_winner)),
   '{civilianWord}',to_jsonb(coalesce(c,''))),'{undercoverWord}',to_jsonb(coalesce(u,'')));
end $$;

create or replace function public.undercover_apply_victory(p_room_id uuid,p_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a jsonb:=coalesce(p_state->'aliveIds','[]'); civ integer; special integer;
begin
 select count(*) filter(where role='civilian'),count(*) filter(where role in('undercover','mrwhite'))
 into civ,special from public.undercover_private_cards
 where room_id=p_room_id and player_id::text in(select jsonb_array_elements_text(a));
 if civ<=0 or special>=civ then return public.undercover_with_victory_words(p_room_id,p_state,'special'); end if;
 if special<=0 then return public.undercover_with_victory_words(p_room_id,p_state,'civilians'); end if;
 return p_state;
end $$;

create or replace function public.undercover_resolve_vote(p_room_id uuid,p_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a jsonb:=coalesce(p_state->'aliveIds','[]'); totals jsonb; tops jsonb; eliminated uuid; r text; new_alive jsonb;
 rn integer:=coalesce((p_state->>'round')::integer,1); bn integer:=coalesce((p_state->>'voteRound')::integer,1);
begin
 select coalesce(jsonb_object_agg(target_player_id::text,n),'{}') into totals
 from(select target_player_id,count(*)::integer n from public.undercover_votes
   where room_id=p_room_id and round_number=rn and ballot_number=bn
     and target_player_id is not null
   group by target_player_id)t;
 if totals='{}'::jsonb then
   p_state:=jsonb_set(jsonb_set(jsonb_set(p_state,'{phase}','"result"'),'{voteTotals}','{}'),'{skippedVote}','true');
   p_state:=jsonb_set(p_state,'{votesSubmitted}',to_jsonb((select count(distinct voter_player_id)::integer
     from public.undercover_votes where room_id=p_room_id and round_number=rn and ballot_number=bn)));
   return p_state;
 end if;
 select coalesce(jsonb_agg(key),'[]') into tops from jsonb_each(totals)
 where value::text::integer=(select max(e.value::text::integer) from jsonb_each(totals)e);
 p_state:=jsonb_set(jsonb_set(p_state,'{phase}','"result"'),'{voteTotals}',totals);
 p_state:=jsonb_set(p_state,'{votesSubmitted}',to_jsonb((select count(distinct voter_player_id)::integer
   from public.undercover_votes where room_id=p_room_id and round_number=rn and ballot_number=bn)));
 if jsonb_array_length(tops)>1 then
   p_state:=jsonb_set(p_state,'{tiedIds}',tops)-'eliminatedId'-'eliminatedRole'; return p_state;
 end if;
 eliminated:=(tops->>0)::uuid;
 select role into r from public.undercover_private_cards where room_id=p_room_id and player_id=eliminated;
 select coalesce(jsonb_agg(value),'[]') into new_alive from jsonb_array_elements_text(a) where value<>eliminated::text;
 p_state:=jsonb_set(jsonb_set(jsonb_set(jsonb_set(p_state,'{aliveIds}',new_alive),'{tiedIds}','[]'),
   '{eliminatedId}',to_jsonb(eliminated::text)),'{eliminatedRole}',to_jsonb(r));
 return p_state;
end $$;

create or replace function public.undercover_create_room(p_room_code text,p_name text,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare rid uuid:=gen_random_uuid(); pid uuid:=gen_random_uuid(); rc text:=upper(regexp_replace(p_room_code,'[^A-Z0-9]','','g')); n text:=btrim(p_name);
begin
 if rc!~'^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then raise exception 'Codice stanza non valido'; end if;
 if n is null or n='' or length(n)>18 then raise exception 'Inserisci un nome valido'; end if;
 if coalesce(p_client_id,'')='' then raise exception 'Identificatore client non valido'; end if;
 perform pg_advisory_xact_lock(hashtext(rc));
 if exists(select 1 from public.undercover_rooms where room_code=rc) then
   raise exception using errcode='23505',message='Codice stanza già in uso';
 end if;
 insert into public.undercover_rooms(id,room_code,status,role_mode,undercover_count,mr_white_count,difficulty,category,game_state)
 values(rid,rc,'lobby','auto',0,1,'normal',null,jsonb_build_object('phase','lobby','round',1));
 insert into public.undercover_players(room_id,player_id,nickname,name,client_id,is_host,connected)
 values(rid,pid,n,n,pid::text,true,true);
 update public.undercover_rooms set host_player_id=pid where id=rid;
 insert into public.undercover_player_sessions(room_id,player_id,client_id) values(rid,pid,p_client_id);
 return jsonb_build_object('room_id',rid,'player_id',pid);
end $$;

create or replace function public.undercover_join_room(p_room_code text,p_name text,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare room public.undercover_rooms%rowtype; pid uuid; rc text:=upper(regexp_replace(p_room_code,'[^A-Z0-9]','','g')); n text:=btrim(p_name);
begin
 if length(rc)<>6 then raise exception 'Codice stanza non valido'; end if;
 if n is null or n='' or length(n)>18 then raise exception 'Inserisci un nome valido'; end if;
 select * into room from public.undercover_rooms where room_code=rc for update;
 if not found then raise exception 'Stanza non trovata. Controlla il codice.'; end if;
 if room.status<>'lobby' then raise exception 'La partita in questa stanza è già iniziata.'; end if;
 select player_id into pid from public.undercover_player_sessions where room_id=room.id and client_id=p_client_id;
 if pid is not null then
   if exists(select 1 from public.undercover_players where room_id=room.id and player_id<>pid
     and public.undercover_normalize_text(coalesce(nickname,name))=public.undercover_normalize_text(n))
    then raise exception 'Questo nome è già usato nella stanza. Scegline un altro.'; end if;
    update public.undercover_players set nickname=n,name=n,connected=true,updated_at=now() where room_id=room.id and player_id=pid;
    perform public.undercover_sync_auto_roles(room.id);
    return jsonb_build_object('room_id',room.id,'player_id',pid,'rejoined',true);
 end if;
 if exists(select 1 from public.undercover_players where room_id=room.id
   and public.undercover_normalize_text(coalesce(nickname,name))=public.undercover_normalize_text(n))
 then raise exception 'Questo nome è già usato nella stanza. Scegline un altro.'; end if;
 pid:=gen_random_uuid();
 insert into public.undercover_players(room_id,player_id,nickname,name,client_id,is_host,connected)
 values(room.id,pid,n,n,pid::text,false,true);
 insert into public.undercover_player_sessions(room_id,player_id,client_id) values(room.id,pid,p_client_id);
 perform public.undercover_sync_auto_roles(room.id);
 return jsonb_build_object('room_id',room.id,'player_id',pid,'rejoined',false);
end $$;

create or replace function public.undercover_resume_session(p_room_id uuid,p_player_id uuid,p_client_id text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then return false; end if;
 perform 1 from public.undercover_rooms where id=p_room_id for update;
 update public.undercover_players set connected=true,updated_at=now() where room_id=p_room_id and player_id=p_player_id;
 perform public.undercover_sync_auto_roles(p_room_id);
 return found;
end $$;

create or replace function public.undercover_set_presence(p_room_id uuid,p_player_id uuid,p_client_id text,p_connected boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then return false; end if;
 perform 1 from public.undercover_rooms where id=p_room_id for update;
 update public.undercover_players set connected=p_connected,updated_at=now() where room_id=p_room_id and player_id=p_player_id;
 perform public.undercover_sync_auto_roles(p_room_id);
 return found;
end $$;

create or replace function public.undercover_claim_host(p_room_id uuid,p_player_id uuid,p_client_id text)
returns boolean language plpgsql security definer set search_path=public as $$
declare current_host public.undercover_players%rowtype;
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then return false; end if;
 perform 1 from public.undercover_rooms where id=p_room_id for update;
 select * into current_host from public.undercover_players where room_id=p_room_id and is_host=true order by joined_at limit 1;
 if current_host.player_id is not null and
    (current_host.connected is distinct from false or current_host.updated_at>now()-interval '15 seconds')
 then return false; end if;
 if not exists(select 1 from public.undercover_players where room_id=p_room_id and player_id=p_player_id and connected is distinct from false)
 then return false; end if;
 update public.undercover_players set is_host=false where room_id=p_room_id;
 update public.undercover_players set is_host=true,updated_at=now() where room_id=p_room_id and player_id=p_player_id;
 update public.undercover_rooms set host_player_id=p_player_id,updated_at=now() where id=p_room_id;
 return true;
end $$;

drop function if exists public.undercover_update_settings(uuid,uuid,text,integer,integer,text,text);
create or replace function public.undercover_update_settings(p_room_id uuid,p_host_player_id uuid,p_client_id text,
 p_role_mode text,p_undercover_count integer,p_mr_white_count integer,p_difficulty text,p_category text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.undercover_is_host(p_room_id,p_host_player_id,p_client_id) then raise exception 'Solo l''host può modificare la configurazione'; end if;
 if p_role_mode not in('auto','manual') then raise exception 'Modalità ruoli non valida'; end if;
 if p_undercover_count is null or p_mr_white_count is null or p_undercover_count<0
    or p_mr_white_count<1 or p_mr_white_count>2
 then raise exception 'Configurazione ruoli non valida: Mr. White deve essere almeno 1'; end if;
 if p_difficulty not in('easy','normal','hard') then raise exception 'Difficoltà non valida'; end if;
 update public.undercover_rooms set role_mode=p_role_mode,
 undercover_count=case when p_role_mode='manual' then p_undercover_count else undercover_count end,
 mr_white_count=case when p_role_mode='manual' then p_mr_white_count else mr_white_count end,
 difficulty=p_difficulty,category=nullif(p_category,''),updated_at=now()
 where id=p_room_id and status='lobby';
 if not found then raise exception 'La partita è già iniziata'; end if;
 if p_role_mode='auto' then perform public.undercover_sync_auto_roles(p_room_id); end if;
 return true;
end $$;

drop function if exists public.undercover_start_game(uuid,uuid,text,integer,integer,text,text,jsonb,jsonb);
create or replace function public.undercover_start_game(p_room_id uuid,p_host_player_id uuid,p_client_id text,
 p_undercover_count integer,p_mr_white_count integer,p_difficulty text,p_category text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare room public.undercover_rooms%rowtype; n integer; special_count integer; civilian_count integer;
 cw text; uw text; cat text; alive jsonb; s jsonb;
begin
 if not public.undercover_is_host(p_room_id,p_host_player_id,p_client_id) then raise exception 'Solo l''host può avviare la partita'; end if;
 select * into room from public.undercover_rooms where id=p_room_id for update;
 if room.status<>'lobby' then raise exception 'La partita è già iniziata'; end if;
 select count(*) into n from public.undercover_players where room_id=p_room_id and connected is distinct from false;
 if n<3 then raise exception 'Servono almeno 3 giocatori connessi'; end if;
 if room.role_mode='auto' then
   select undercover_count,mr_white_count into p_undercover_count,p_mr_white_count
   from public.undercover_automatic_roles(n);
 else
   p_undercover_count:=room.undercover_count;
   p_mr_white_count:=room.mr_white_count;
 end if;
 if p_undercover_count is null or p_mr_white_count is null or p_undercover_count<0
    or p_mr_white_count<1 or p_mr_white_count>2
 then raise exception 'Il numero di ruoli speciali non è valido'; end if;
 special_count:=p_undercover_count+p_mr_white_count;
 civilian_count:=n-special_count;
 if civilian_count<=special_count
 then raise exception 'Servono più Civili dei ruoli speciali. Riduci il numero di Undercover o Mr. White.'; end if;
 select civilian_word,undercover_word,category_id::text into cw,uw,cat from public.undercover_word_pairs
 where active is distinct from false and civilian_word is not null and undercover_word is not null
   and btrim(civilian_word)<>'' and btrim(undercover_word)<>''
   and difficulty=p_difficulty and(nullif(p_category,'') is null or category_id::text=p_category) order by random() limit 1;
 if cw is null then select civilian_word,undercover_word,category_id::text into cw,uw,cat from public.undercover_word_pairs
   where active is distinct from false and civilian_word is not null and undercover_word is not null
   and btrim(civilian_word)<>'' and btrim(undercover_word)<>''
   and(nullif(p_category,'') is null or category_id::text=p_category) order by random() limit 1; end if;
 if cw is null then select civilian_word,undercover_word,category_id::text into cw,uw,cat from public.undercover_word_pairs
   where active is distinct from false and civilian_word is not null and undercover_word is not null
   and btrim(civilian_word)<>'' and btrim(undercover_word)<>'' order by random() limit 1; end if;
 if cw is null then select f.c,f.u,'fallback' into cw,uw,cat from(values('Pizza','Focaccia'),('Pasta','Lasagna'),
   ('Divano','Poltrona'),('Doccia','Vasca'),('Tennis','Padel'),('Cane','Lupo'),('Mare','Oceano'),
   ('Hotel','Resort'),('Matita','Penna'),('Fratello','Cugino'))f(c,u) order by random() limit 1; end if;
 delete from public.undercover_votes where room_id=p_room_id;
 delete from public.undercover_private_cards where room_id=p_room_id;
 with randomized as(select player_id,row_number()over(order by random()) pos from public.undercover_players
   where room_id=p_room_id and connected is distinct from false)
 insert into public.undercover_private_cards(room_id,player_id,role,word,civilian_word,undercover_word)
 select p_room_id,player_id,case when pos<=p_undercover_count then'undercover' when pos<=p_undercover_count+p_mr_white_count then'mrwhite' else'civilian' end,
   case when pos<=p_undercover_count then uw when pos<=p_undercover_count+p_mr_white_count then'???' else cw end,cw,uw from randomized;
 select coalesce(jsonb_agg(player_id::text),'[]') into alive from public.undercover_private_cards where room_id=p_room_id;
 s:=jsonb_build_object('phase','revealing','round',1,'aliveIds',alive,'readyIds','[]'::jsonb,
   'votesSubmitted',0,'voteTotals','{}'::jsonb,'tiedIds','[]'::jsonb,'candidateIds','[]'::jsonb,
   'voteRound',0,'difficulty',p_difficulty,'category',coalesce(nullif(p_category,''),cat));
 update public.undercover_rooms set status='revealing',undercover_count=p_undercover_count,mr_white_count=p_mr_white_count,
   difficulty=p_difficulty,category=nullif(p_category,''),game_state=s,updated_at=now() where id=p_room_id;
 return s;
end $$;

drop function if exists public.undercover_get_my_card(uuid,uuid,text);
create function public.undercover_get_my_card(p_room_id uuid,p_player_id uuid,p_client_id text)
returns table(role text,word text) language plpgsql security definer set search_path=public as $$
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then raise exception 'Giocatore non autorizzato'; end if;
 return query select c.role,c.word from public.undercover_private_cards c where c.room_id=p_room_id and c.player_id=p_player_id;
end $$;

create or replace function public.undercover_mark_ready(p_room_id uuid,p_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb; a jsonb; ready jsonb;
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then raise exception 'Giocatore non autorizzato'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 if s->>'phase'<>'revealing' then return s; end if;
 a:=coalesce(s->'aliveIds','[]'); if not(a?p_player_id::text) then raise exception 'Giocatore non attivo'; end if;
 ready:=coalesce(s->'readyIds','[]'); if not(ready?p_player_id::text) then ready:=ready||jsonb_build_array(p_player_id::text); end if;
 s:=jsonb_set(s,'{readyIds}',ready);
 if jsonb_array_length(ready)>=jsonb_array_length(a) then s:=jsonb_set(s,'{phase}','"round"'); end if;
 update public.undercover_rooms set game_state=s,status=s->>'phase',updated_at=now() where id=p_room_id;
 return s;
end $$;

create or replace function public.undercover_open_voting(p_room_id uuid,p_host_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb;
begin
 if not public.undercover_is_host(p_room_id,p_host_player_id,p_client_id) then raise exception 'Solo l''host può iniziare la votazione'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 if s->>'phase'<>'round' then raise exception 'Il round non è pronto per la votazione'; end if;
 delete from public.undercover_votes where room_id=p_room_id;
 s:=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(s,'{phase}','"voting"'),'{votesSubmitted}','0'),'{voteTotals}','{}'),'{tiedIds}','[]'),'{candidateIds}','[]')-'skippedVote';
 s:=jsonb_set(s,'{voteRound}',to_jsonb(coalesce((s->>'voteRound')::integer,0)+1));
 update public.undercover_rooms set game_state=s,status='voting',updated_at=now() where id=p_room_id; return s;
end $$;

create or replace function public.undercover_get_my_vote(p_room_id uuid,p_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare target uuid; has_vote boolean:=false; s jsonb; rn integer; bn integer;
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then raise exception 'Giocatore non autorizzato'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id;
 rn:=coalesce((s->>'round')::integer,1);
 bn:=coalesce((s->>'voteRound')::integer,1);
 select target_player_id,true into target,has_vote from public.undercover_votes
 where room_id=p_room_id and round_number=rn and ballot_number=bn and voter_player_id=p_player_id;
 return jsonb_build_object('target_player_id',target,'skipped',has_vote and target is null);
end $$;

create or replace function public.undercover_cast_vote(p_room_id uuid,p_voter_player_id uuid,p_target_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb; a jsonb; candidates jsonb; n integer; rn integer; bn integer;
begin
 if not public.undercover_authorized(p_room_id,p_voter_player_id,p_client_id) then raise exception 'Giocatore non autorizzato'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 a:=coalesce(s->'aliveIds','[]'); candidates:=coalesce(s->'candidateIds','[]');
 rn:=coalesce((s->>'round')::integer,1);
 bn:=coalesce((s->>'voteRound')::integer,1);
 if s->>'phase'<>'voting' or not(a?p_voter_player_id::text) or (p_target_player_id is not null and (not(a?p_target_player_id::text)
  or p_voter_player_id=p_target_player_id or(jsonb_array_length(candidates)>0 and not(candidates?p_target_player_id::text))))
 then raise exception 'Voto non valido'; end if;
 insert into public.undercover_votes(room_id,round_number,ballot_number,voter_player_id,target_player_id)
 values(p_room_id,rn,bn,p_voter_player_id,p_target_player_id)
 on conflict(room_id,round_number,ballot_number,voter_player_id)
 do update set target_player_id=excluded.target_player_id;
 select count(*)::integer into n from public.undercover_votes where room_id=p_room_id
 and round_number=rn and ballot_number=bn
 and voter_player_id::text in(select jsonb_array_elements_text(a));
 s:=jsonb_set(s,'{votesSubmitted}',to_jsonb(n));
 if n>=jsonb_array_length(a) then s:=public.undercover_resolve_vote(p_room_id,s); end if;
 update public.undercover_rooms set game_state=s,status=s->>'phase',updated_at=now() where id=p_room_id; return s;
end $$;

create or replace function public.undercover_clear_vote(p_room_id uuid,p_voter_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb; a jsonb; rn integer; bn integer; n integer;
begin
 if not public.undercover_authorized(p_room_id,p_voter_player_id,p_client_id) then raise exception 'Giocatore non autorizzato'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 if s->>'phase'<>'voting' then raise exception 'La votazione è già conclusa'; end if;
 a:=coalesce(s->'aliveIds','[]'); rn:=coalesce((s->>'round')::integer,1); bn:=coalesce((s->>'voteRound')::integer,1);
 delete from public.undercover_votes where room_id=p_room_id and round_number=rn and ballot_number=bn and voter_player_id=p_voter_player_id;
 select count(distinct voter_player_id)::integer into n from public.undercover_votes where room_id=p_room_id and round_number=rn and ballot_number=bn and voter_player_id::text in(select jsonb_array_elements_text(a));
 s:=jsonb_set(s,'{votesSubmitted}',to_jsonb(n));
 update public.undercover_rooms set game_state=s,status='voting',updated_at=now() where id=p_room_id;
 return s;
end $$;

drop function if exists public.undercover_finish_vote(uuid,uuid,text);
create or replace function public.undercover_finish_vote(p_room_id uuid,p_host_player_id uuid,p_client_id text,p_force boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb; a jsonb; n integer; rn integer; bn integer;
begin
 if not public.undercover_is_host(p_room_id,p_host_player_id,p_client_id) then raise exception 'Solo l''host può concludere la votazione'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 if s->>'phase'<>'voting' then raise exception 'La votazione è già conclusa'; end if;
 a:=coalesce(s->'aliveIds','[]');
 rn:=coalesce((s->>'round')::integer,1);
 bn:=coalesce((s->>'voteRound')::integer,1);
 select count(distinct voter_player_id)::integer into n from public.undercover_votes
 where room_id=p_room_id and round_number=rn and ballot_number=bn
 and voter_player_id::text in(select jsonb_array_elements_text(a));
 if n=0 then raise exception 'Non è stato registrato alcun voto'; end if;
 if not p_force and n<jsonb_array_length(a) then raise exception 'Tutti i giocatori devono votare'; end if;
 s:=public.undercover_resolve_vote(p_room_id,s);
 update public.undercover_rooms set game_state=s,status='result',updated_at=now() where id=p_room_id; return s;
end $$;

create or replace function public.undercover_continue_after_result(p_room_id uuid,p_host_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb; tied jsonb;
begin
 if not public.undercover_is_host(p_room_id,p_host_player_id,p_client_id) then raise exception 'Solo l''host può proseguire'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 if s->>'phase'<>'result' then raise exception 'Risultato non disponibile'; end if;
 tied:=coalesce(s->'tiedIds','[]');
 if coalesce((s->>'skippedVote')::boolean,false) then
   s:=public.undercover_apply_victory(p_room_id,s);
   if s->>'phase'<>'victory' then
     s:=jsonb_set(jsonb_set(s,'{phase}','"round"'),'{round}',to_jsonb(coalesce((s->>'round')::integer,1)+1))- 'skippedVote';
   end if;
 elsif jsonb_array_length(tied)>1 then
   delete from public.undercover_votes where room_id=p_room_id;
   s:=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(s,'{phase}','"voting"'),'{candidateIds}',tied),'{tiedIds}','[]'),'{votesSubmitted}','0'),'{voteTotals}','{}');
   s:=jsonb_set(s,'{voteRound}',to_jsonb(coalesce((s->>'voteRound')::integer,0)+1));
 elsif s->>'eliminatedRole'='mrwhite' then
   s:=jsonb_set(jsonb_set(s,'{phase}','"white_guess"'),'{whitePlayerId}',s->'eliminatedId');
 else
   s:=public.undercover_apply_victory(p_room_id,s);
   if s->>'phase'<>'victory' then
     s:=jsonb_set(jsonb_set(jsonb_set(s,'{phase}','"round"'),'{round}',to_jsonb(coalesce((s->>'round')::integer,1)+1)),'{candidateIds}','[]')-'eliminatedId'-'eliminatedRole';
   end if;
 end if;
 update public.undercover_rooms set game_state=s,status=s->>'phase',updated_at=now() where id=p_room_id;
 return s;
end $$;

create or replace function public.undercover_advance_round(p_room_id uuid,p_host_player_id uuid,p_client_id text)
returns jsonb language sql security definer set search_path=public as $$
 select public.undercover_continue_after_result(p_room_id,p_host_player_id,p_client_id)
$$;

create or replace function public.undercover_submit_white_guess(p_room_id uuid,p_player_id uuid,p_client_id text,p_guess text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb; word text;
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then raise exception 'Giocatore non autorizzato'; end if;
 select game_state into s from public.undercover_rooms where id=p_room_id for update;
 if s->>'phase'<>'white_guess' or s->>'whitePlayerId'<>p_player_id::text then raise exception 'Tentativo non disponibile'; end if;
 select civilian_word into word from public.undercover_private_cards where room_id=p_room_id and player_id=p_player_id and role='mrwhite';
 if public.undercover_normalize_text(p_guess)=public.undercover_normalize_text(word) then
   s:=jsonb_set(public.undercover_with_victory_words(p_room_id,s,'white'),'{whiteGuessCorrect}','true');
 else
   s:=jsonb_set(s,'{whiteGuessCorrect}','false'); s:=public.undercover_apply_victory(p_room_id,s);
   if s->>'phase'<>'victory' then s:=jsonb_set(jsonb_set(s,'{phase}','"round"'),'{round}',to_jsonb(coalesce((s->>'round')::integer,1)+1))-'whitePlayerId'-'eliminatedId'-'eliminatedRole'; end if;
 end if;
 update public.undercover_rooms set game_state=s,status=s->>'phase',updated_at=now() where id=p_room_id;
 return s;
end $$;

create or replace function public.undercover_leave_room(p_room_id uuid,p_player_id uuid,p_client_id text)
returns boolean language plpgsql security definer set search_path=public as $$
declare room public.undercover_rooms%rowtype; was_host boolean; next_host uuid; s jsonb;
begin
 if not public.undercover_authorized(p_room_id,p_player_id,p_client_id) then return false; end if;
 select * into room from public.undercover_rooms where id=p_room_id for update;
 select is_host into was_host from public.undercover_players where room_id=p_room_id and player_id=p_player_id;
 delete from public.undercover_player_sessions where room_id=p_room_id and player_id=p_player_id;
 if room.status='lobby' then
   delete from public.undercover_players where room_id=p_room_id and player_id=p_player_id;
   perform public.undercover_sync_auto_roles(p_room_id);
 else
   update public.undercover_players set connected=false,is_host=false,updated_at=now() where room_id=p_room_id and player_id=p_player_id;
   delete from public.undercover_votes where room_id=p_room_id and voter_player_id=p_player_id;
   s:=coalesce(room.game_state,'{}');
   s:=jsonb_set(s,'{aliveIds}',coalesce((select jsonb_agg(value) from jsonb_array_elements_text(coalesce(s->'aliveIds','[]'))where value<>p_player_id::text),'[]'));
   s:=jsonb_set(s,'{readyIds}',coalesce((select jsonb_agg(value) from jsonb_array_elements_text(coalesce(s->'readyIds','[]'))where value<>p_player_id::text),'[]'));
   if s->>'phase'<>'revealing' then s:=public.undercover_apply_victory(p_room_id,s); end if;
   if s->>'phase'<>'victory' and s->>'phase'='revealing'
      and jsonb_array_length(coalesce(s->'readyIds','[]'))>=jsonb_array_length(coalesce(s->'aliveIds','[]'))
   then s:=jsonb_set(s,'{phase}','"round"'); end if;
   if s->>'phase'='voting' then
     s:=jsonb_set(s,'{votesSubmitted}',to_jsonb((select count(distinct voter_player_id)::integer
       from public.undercover_votes where room_id=p_room_id
       and round_number=coalesce((s->>'round')::integer,1)
       and ballot_number=coalesce((s->>'voteRound')::integer,1))));
     if (s->>'votesSubmitted')::integer>0
        and (s->>'votesSubmitted')::integer>=jsonb_array_length(coalesce(s->'aliveIds','[]'))
     then s:=public.undercover_resolve_vote(p_room_id,s); end if;
   end if;
   update public.undercover_rooms set game_state=s,status=s->>'phase',updated_at=now() where id=p_room_id;
 end if;
 if was_host then
   select player_id into next_host from public.undercover_players where room_id=p_room_id and player_id<>p_player_id and connected is distinct from false order by joined_at limit 1;
   if next_host is not null then
     update public.undercover_players set is_host=false where room_id=p_room_id;
     update public.undercover_players set is_host=true where room_id=p_room_id and player_id=next_host;
     update public.undercover_rooms set host_player_id=next_host,updated_at=now() where id=p_room_id;
   end if;
 end if;
 if not exists(select 1 from public.undercover_players where room_id=p_room_id and connected is distinct from false)then delete from public.undercover_rooms where id=p_room_id; end if;
 return true;
end $$;

create or replace function public.undercover_reset_room(p_room_id uuid,p_host_player_id uuid,p_client_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s jsonb:=jsonb_build_object('phase','lobby','round',1);
begin
 if not public.undercover_is_host(p_room_id,p_host_player_id,p_client_id) then raise exception 'Solo l''host può preparare una nuova partita'; end if;
 delete from public.undercover_votes where room_id=p_room_id; delete from public.undercover_private_cards where room_id=p_room_id;
 delete from public.undercover_players where room_id=p_room_id and connected=false;
 update public.undercover_rooms set status='lobby',game_state=s,updated_at=now() where id=p_room_id;
 perform public.undercover_sync_auto_roles(p_room_id);
 return s;
end $$;

-- Helper interni non accessibili dal browser.
revoke execute on function public.undercover_normalize_text(text) from public,anon,authenticated;
revoke execute on function public.undercover_automatic_roles(integer) from public,anon,authenticated;
revoke execute on function public.undercover_sync_auto_roles(uuid) from public,anon,authenticated;
revoke execute on function public.undercover_authorized(uuid,uuid,text) from public,anon,authenticated;
revoke execute on function public.undercover_is_host(uuid,uuid,text) from public,anon,authenticated;
revoke execute on function public.undercover_with_victory_words(uuid,jsonb,text) from public,anon,authenticated;
revoke execute on function public.undercover_apply_victory(uuid,jsonb) from public,anon,authenticated;
revoke execute on function public.undercover_resolve_vote(uuid,jsonb) from public,anon,authenticated;

revoke execute on function public.undercover_create_room(text,text,text) from public;
revoke execute on function public.undercover_join_room(text,text,text) from public;
revoke execute on function public.undercover_resume_session(uuid,uuid,text) from public;
revoke execute on function public.undercover_set_presence(uuid,uuid,text,boolean) from public;
revoke execute on function public.undercover_claim_host(uuid,uuid,text) from public;
revoke execute on function public.undercover_update_settings(uuid,uuid,text,text,integer,integer,text,text) from public;
revoke execute on function public.undercover_start_game(uuid,uuid,text,integer,integer,text,text) from public;
revoke execute on function public.undercover_get_my_card(uuid,uuid,text) from public;
revoke execute on function public.undercover_mark_ready(uuid,uuid,text) from public;
revoke execute on function public.undercover_open_voting(uuid,uuid,text) from public;
revoke execute on function public.undercover_get_my_vote(uuid,uuid,text) from public;
revoke execute on function public.undercover_cast_vote(uuid,uuid,uuid,text) from public;
revoke execute on function public.undercover_clear_vote(uuid,uuid,text) from public;
revoke execute on function public.undercover_finish_vote(uuid,uuid,text,boolean) from public;
revoke execute on function public.undercover_continue_after_result(uuid,uuid,text) from public;
revoke execute on function public.undercover_advance_round(uuid,uuid,text) from public;
revoke execute on function public.undercover_submit_white_guess(uuid,uuid,text,text) from public;
revoke execute on function public.undercover_leave_room(uuid,uuid,text) from public;
revoke execute on function public.undercover_reset_room(uuid,uuid,text) from public;
grant execute on function public.undercover_create_room(text,text,text) to anon,authenticated;
grant execute on function public.undercover_join_room(text,text,text) to anon,authenticated;
grant execute on function public.undercover_resume_session(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_set_presence(uuid,uuid,text,boolean) to anon,authenticated;
grant execute on function public.undercover_claim_host(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_update_settings(uuid,uuid,text,text,integer,integer,text,text) to anon,authenticated;
grant execute on function public.undercover_start_game(uuid,uuid,text,integer,integer,text,text) to anon,authenticated;
grant execute on function public.undercover_get_my_card(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_mark_ready(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_open_voting(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_get_my_vote(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_cast_vote(uuid,uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_clear_vote(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_finish_vote(uuid,uuid,text,boolean) to anon,authenticated;
grant execute on function public.undercover_continue_after_result(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_advance_round(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_submit_white_guess(uuid,uuid,text,text) to anon,authenticated;
grant execute on function public.undercover_leave_room(uuid,uuid,text) to anon,authenticated;
grant execute on function public.undercover_reset_room(uuid,uuid,text) to anon,authenticated;

do $$begin alter publication supabase_realtime add table public.undercover_rooms;
exception when duplicate_object then null; end$$;
do $$begin alter publication supabase_realtime add table public.undercover_players;
exception when duplicate_object then null; end$$;

-- Forza PostgREST a rileggere immediatamente le nuove firme RPC.
notify pgrst,'reload schema';
