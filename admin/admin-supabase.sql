-- =========================================================
-- CUGINIPARTY - ADMIN CENTER / SUPABASE
-- Eseguire una volta nel SQL Editor di Supabase.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- ADMIN USERS
-- ---------------------------------------------------------
create table if not exists public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    enabled boolean not null default true,
    created_at timestamptz not null default now()
);

-- Inserire QUI l'UUID dell'utente Supabase che deve essere Admin.
-- insert into public.admin_users (user_id) values ('UUID_DELL_ADMIN');

-- ---------------------------------------------------------
-- GLOBAL SITE SETTINGS
-- ---------------------------------------------------------
create table if not exists public.site_settings (
    id integer primary key default 1 check (id = 1),
    maintenance_enabled boolean not null default false,
    maintenance_title text not null default 'Manutenzione programmata',
    maintenance_message text not null default '',
    maintenance_end_time timestamptz,
    emergency_enabled boolean not null default false,
    total_block_enabled boolean not null default false,
    multiplayer_enabled boolean not null default true,
    new_rooms_enabled boolean not null default true,
    new_matches_enabled boolean not null default true,
    updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- PER-GAME SETTINGS
-- ---------------------------------------------------------
create table if not exists public.site_games (
    game_id text primary key,
    name text not null,
    enabled boolean not null default true,
    multiplayer_enabled boolean not null default true,
    new_rooms_enabled boolean not null default true,
    disabled_message text not null default 'Questo gioco è temporaneamente non disponibile.',
    updated_at timestamptz not null default now()
);

insert into public.site_games (game_id, name, multiplayer_enabled) values
    ('tris', 'Tris', true),
    ('uno', 'UNO', true),
    ('racing', 'Racing', true),
    ('memory', 'Memory', false),
    ('pizza', 'Pizza', false),
    ('balloons', 'Balloons', false),
    ('aquarium', 'Aquarium', false)
on conflict (game_id) do nothing;

-- ---------------------------------------------------------
-- SITE MESSAGES
-- ---------------------------------------------------------
create table if not exists public.site_messages (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('normal','important','urgent','banner','popup','scheduled')),
    target text not null default 'all' check (target in ('all','online','game')),
    game_id text references public.site_games(game_id) on delete set null,
    message text not null,
    active boolean not null default true,
    persistent boolean not null default false,
    scheduled_start timestamptz,
    scheduled_end timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- BLOCKED USERS
-- ---------------------------------------------------------
create table if not exists public.blocked_users (
    player_id uuid primary key,
    blocked_by uuid references auth.users(id) on delete set null,
    reason text,
    blocked_at timestamptz not null default now(),
    unblocked_at timestamptz
);

-- ---------------------------------------------------------
-- ADMIN AUDIT LOG
-- ---------------------------------------------------------
create table if not exists public.admin_logs (
    id uuid primary key default gen_random_uuid(),
    admin_user_id uuid references auth.users(id) on delete set null,
    action text not null,
    target text,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists site_games_updated_at on public.site_games;
create trigger site_games_updated_at
before update on public.site_games
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- RLS HELPERS
-- ---------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
          and enabled = true
    );
$$;

-- ---------------------------------------------------------
-- ENABLE RLS
-- ---------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_games enable row level security;
alter table public.site_messages enable row level security;
alter table public.blocked_users enable row level security;
alter table public.admin_logs enable row level security;

-- ---------------------------------------------------------
-- ADMIN USERS POLICIES
-- ---------------------------------------------------------
drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists admin_users_admin_write on public.admin_users;
create policy admin_users_admin_write
on public.admin_users for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------
-- PUBLIC READ / ADMIN WRITE: SITE SETTINGS
-- ---------------------------------------------------------
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------
-- PUBLIC READ / ADMIN WRITE: SITE GAMES
-- ---------------------------------------------------------
drop policy if exists site_games_public_read on public.site_games;
create policy site_games_public_read
on public.site_games for select
to anon, authenticated
using (true);

drop policy if exists site_games_admin_write on public.site_games;
create policy site_games_admin_write
on public.site_games for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------
-- PUBLIC READ ACTIVE MESSAGES / ADMIN FULL ACCESS
-- ---------------------------------------------------------
drop policy if exists site_messages_public_read on public.site_messages;
create policy site_messages_public_read
on public.site_messages for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists site_messages_admin_write on public.site_messages;
create policy site_messages_admin_write
on public.site_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------
-- BLOCKED USERS: ADMIN ONLY
-- ---------------------------------------------------------
drop policy if exists blocked_users_admin_all on public.blocked_users;
create policy blocked_users_admin_all
on public.blocked_users for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------
-- LOGS: ADMIN ONLY
-- ---------------------------------------------------------
drop policy if exists admin_logs_admin_all on public.admin_logs;
create policy admin_logs_admin_all
on public.admin_logs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------
-- REALTIME
-- Aggiunge le tabelle Admin alle pubblicazioni Realtime se non presenti.
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.site_settings;
alter publication supabase_realtime add table public.site_games;
alter publication supabase_realtime add table public.site_messages;
alter publication supabase_realtime add table public.admin_logs;

-- ---------------------------------------------------------
-- UTILITY: aggiorna/riattiva una configurazione senza cancellarla.
-- ---------------------------------------------------------
create or replace function public.admin_set_maintenance(
    p_enabled boolean,
    p_title text default null,
    p_message text default null,
    p_end_time timestamptz default null
)
returns public.site_settings
language plpgsql
security definer
set search_path = public
as $$
declare
    result public.site_settings;
begin
    if not public.is_admin() then
        raise exception 'admin_only';
    end if;

    update public.site_settings
    set maintenance_enabled = p_enabled,
        maintenance_title = coalesce(p_title, maintenance_title),
        maintenance_message = coalesce(p_message, maintenance_message),
        maintenance_end_time = p_end_time
    where id = 1
    returning * into result;

    insert into public.admin_logs (admin_user_id, action, target, details)
    values (auth.uid(), case when p_enabled then 'maintenance_enabled' else 'maintenance_disabled' end, 'site_settings', jsonb_build_object('end_time', p_end_time));

    return result;
end;
$$;
