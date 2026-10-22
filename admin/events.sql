-- CuginiParty / Temi ed Eventi. Additive, idempotent migration.
-- Run once in the Supabase SQL editor before enabling global event saves.
-- Reuses site_settings.value and the existing public.is_admin().
begin;
alter table public.site_settings add column if not exists value jsonb;

create or replace function public.validate_theme_events(p_config jsonb)
returns void language plpgsql immutable set search_path = public, pg_temp as $$
declare e jsonb; a jsonb; fx jsonb; md text;
begin
    if jsonb_typeof(p_config) is distinct from 'object' or p_config->>'version' is distinct from '1'
       or jsonb_typeof(p_config->'events') is distinct from 'array' or octet_length(p_config::text)>16000
       or (p_config-array['version','events'])<>'{}'::jsonb then
        raise exception using errcode='22023',message='Configurazione temi non valida';
    end if;
    if jsonb_array_length(p_config->'events')<>8
       or (select count(distinct v->>'id') from jsonb_array_elements(p_config->'events') v)<>8 then
        raise exception using errcode='22023',message='Sono richiesti gli otto eventi previsti';
    end if;
    for e in select value from jsonb_array_elements(p_config->'events') loop
        a=e->'annual'; fx=e->'effects';
        if coalesce(e->>'id','') not in ('halloween','christmas','epiphany','easter','newyear','carnival','valentine','summer')
           or coalesce(e->>'mode','') not in ('off','manual','scheduled','annual')
           or jsonb_typeof(e->'manualActive') is distinct from 'boolean'
           or jsonb_typeof(e->'priority') is distinct from 'number'
           or (e->>'priority')::numeric not between 0 and 1000
           or (e->>'priority')::numeric<>trunc((e->>'priority')::numeric)
           or jsonb_typeof(a) is distinct from 'object' or jsonb_typeof(fx) is distinct from 'object'
           or (e-array['id','mode','manualActive','priority','startAt','endAt','annual','effects'])<>'{}'::jsonb then
            raise exception using errcode='22023',message='Evento non valido';
        end if;
        if coalesce(a->>'anchor','') not in ('fixed','easter','carnival')
           or coalesce(a->>'startTime','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
           or coalesce(a->>'endTime','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
           or jsonb_typeof(a->'startOffset') is distinct from 'number'
           or jsonb_typeof(a->'endOffset') is distinct from 'number'
           or (a->>'startOffset')::numeric not between -90 and 90
           or (a->>'endOffset')::numeric not between -90 and 90
           or (a->>'startOffset')::numeric<>trunc((a->>'startOffset')::numeric)
           or (a->>'endOffset')::numeric<>trunc((a->>'endOffset')::numeric)
           or (a-array['anchor','startMonthDay','endMonthDay','startOffset','endOffset','startTime','endTime'])<>'{}'::jsonb then
            raise exception using errcode='22023',message='Calendario annuale non valido';
        end if;
        foreach md in array array[a->>'startMonthDay',a->>'endMonthDay'] loop
            if md is null or md !~ '^[0-9]{2}-[0-9]{2}$' then raise exception using errcode='22023',message='Data annuale non valida';end if;
            perform make_date(2000,substring(md,1,2)::integer,substring(md,4,2)::integer);
        end loop;
        if e->>'mode'='annual' and a->>'anchor'<>'fixed' and (a->>'endOffset')::numeric<=(a->>'startOffset')::numeric then
            raise exception using errcode='22023',message='La fine annuale deve seguire l’inizio';
        end if;
        if e->>'mode'='scheduled' and (e->>'startAt' is null or e->>'endAt' is null
           or (e->>'startAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' or (e->>'endAt') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$'
           or (e->>'endAt')::timestamptz<=(e->>'startAt')::timestamptz) then
            raise exception using errcode='22023',message='Intervallo programmato non valido';
        end if;
        if jsonb_typeof(fx->'static') is distinct from 'boolean'
           or jsonb_typeof(fx->'particles') is distinct from 'boolean'
           or jsonb_typeof(fx->'special') is distinct from 'boolean'
           or jsonb_typeof(fx->'intensity') is distinct from 'number'
           or (fx->>'intensity')::numeric not between 0 and 100
           or coalesce(fx->>'quality','') not in ('auto','reduced','off')
           or (fx-array['static','particles','special','intensity','quality'])<>'{}'::jsonb then
            raise exception using errcode='22023',message='Effetti non validi';
        end if;
    end loop;
end;
$$;

-- Defence in depth: even a legacy permissive UPDATE policy cannot alter the
-- seasonal configuration without the real existing admin membership check.
create or replace function public.guard_theme_events()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
    if (new.value::jsonb->'theme_events') is distinct from (case when tg_op='UPDATE' then old.value::jsonb->'theme_events' else null end) then
        if not public.is_admin() then raise exception using errcode='42501',message='Temi ed Eventi: autorizzazione Admin richiesta';end if;
        if new.value::jsonb->'theme_events' is not null then perform public.validate_theme_events(new.value::jsonb->'theme_events');end if;
    end if;
    return new;
end;
$$;
drop trigger if exists site_settings_theme_events_guard on public.site_settings;
create trigger site_settings_theme_events_guard before insert or update of value on public.site_settings for each row execute function public.guard_theme_events();

create or replace function public.admin_save_theme_events(p_config jsonb,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare saved public.site_settings%rowtype;
begin
    if not public.is_admin() then raise exception using errcode='42501',message='Operazione riservata agli amministratori autorizzati';end if;
    perform public.validate_theme_events(p_config);
    update public.site_settings set value=jsonb_set(coalesce(value::jsonb,'{}'::jsonb),'{theme_events}',p_config,true),updated_at=clock_timestamp()
        where id=1 and updated_at is not distinct from p_expected_updated_at and (value is null or jsonb_typeof(value::jsonb)='object') returning * into saved;
    if not found then raise exception using errcode='40001',message='Impostazioni modificate da un’altra sessione. Ricarica prima di salvare';end if;
    return jsonb_build_object('id',saved.id,'value',saved.value,'updated_at',saved.updated_at);
end;
$$;
revoke all on function public.admin_save_theme_events(jsonb,timestamptz) from public,anon;
grant execute on function public.admin_save_theme_events(jsonb,timestamptz) to authenticated;
revoke all on function public.validate_theme_events(jsonb) from public,anon;
grant execute on function public.validate_theme_events(jsonb) to authenticated;
create or replace function public.theme_events_clock()
returns timestamptz language sql stable set search_path = pg_catalog as $$ select now(); $$;
revoke all on function public.theme_events_clock() from public;
grant execute on function public.theme_events_clock() to anon,authenticated;
notify pgrst,'reload schema';
commit;
