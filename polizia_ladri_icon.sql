-- CuginiParty / Polizia e Ladri - icona catalogo
-- Patch additiva: aggiorna solo il vecchio segnaposto a pallino.
-- Eseguire nel Supabase SQL Editor dopo aver pubblicato assets/polizia-ladri-icon.svg.

update public.site_games
set icon = 'assets/polizia-ladri-icon.svg'
where game_id = 'polizia-ladri'
  and (icon is null or lower(btrim(icon)) in ('', 'pl') or btrim(icon) in ('◉', '●'));
