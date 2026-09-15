# Admin V2 Fast Audit

Legenda: `[x]` PASS verificato realmente · `[!]` FAIL riprodotto · `[ ]` NOT TESTED · `[~]` verifica parziale.

## Risultato corrente

- `[x]` Login Supabase reale e autorizzazione `public.admin_users`.
- `[x]` Dashboard Admin caricata.
- `[x]` Schema live verificato: `site_settings`, `site_games`, `site_messages` e tabelle live Admin interrogabili senza errori di colonna/schema cache.
- `[x]` Gioco E2E creato dall'interfaccia e presente nel DB con `disabled_message` non nullo.
- `[x]` Gioco E2E modificato dall'interfaccia e persistito nel DB.
- `[x]` Cicli DB maintenance ON/OFF/ON/OFF; `global_status` e `maintenance_enabled` coerenti.
- `[x]` Cicli DB global game lock LOCK/UNLOCK/LOCK/UNLOCK; gli status configurati dei giochi campione restano invariati.
- `[x]` Dopo il bootstrap UMD/cache-bust, il client pubblico ha riflesso catalogo, maintenance e global lock via Realtime.
- `[ ]` Bulk UNO/Undercover non eseguiti su dati live: richiedono staging o record E2E isolati per non chiudere stanze reali.

## Matrice comandi

| Comando | Handler | Query/RPC | Tabella/effetto | Esito |
|---|---|---|---|---|
| Login Admin | `checkExistingSession`, `login` | `auth.signInWithPassword`, SELECT `admin_users` | Auth + autorizzazione Admin | `[x]` PASS |
| Online / manutenzione / emergenza / blocco totale | `updateSettings`, comandi rapidi | UPDATE `site_settings` | Stato globale | `[x]` DB + maintenance public |
| Multiplayer / nuove stanze | `updateSettings` | UPDATE `site_settings` | Flag Undercover/UNO | `[ ]` browser |
| Global game lock | `toggleGlobalGamesLock` | UPDATE `site_settings.global_games_locked` | Override non distruttivo | `[x]` DB + public |
| Crea gioco | `saveGameFromEditor` | INSERT `site_games` | Nuovo record, `disabled_message=''` | `[x]` UI + DB |
| Modifica gioco | `saveGameFromEditor`, `updateGame` | UPDATE `site_games` | Nome, descrizione, categoria, badge, ordine, stato | `[x]` UI + DB |
| Stato gioco maintenance/available | `updateGame` | UPDATE `site_games` | Stato + compatibilità `enabled` | `[x]` DB + public |
| Visibilità gioco | `updateGame` | UPDATE `site_games.visible` | Card home | `[x]` DB + public |
| Annuncio | `createMessageFromForm`, `toggleMessage` | INSERT/UPDATE `site_messages` | Annuncio attivo/disattivo | `[ ]` |
| Elimina annuncio | `deleteMessage`, `deleteAllMessages` | DELETE `site_messages` | Eliminazione annunci | `[ ]` |
| Chiudi stanza UNO | `closeUnoRoom` | RPC `admin_close_uno_room` | Chiude una stanza | `[x]` contratto RPC con UUID inesistente; live non alterato |
| Chiudi tutte stanze UNO | `closeAllUnoRooms` | RPC `admin_close_all_uno_rooms` | Bulk distruttivo | `[ ]` NOT TESTED SAFELY |
| Chiudi tutte partite UNO | `closeAllMatches` | RPC `admin_close_all_uno_matches` | Riporta match in lobby | `[ ]` NOT TESTED SAFELY |
| Chiudi stanza Undercover | `closeUndercoverRoom` | RPC `admin_close_undercover_room` | Chiude una stanza | `[x]` contratto RPC con UUID inesistente; live non alterato |
| Chiudi tutte stanze Undercover | `closeAllUndercoverRooms` | RPC `admin_close_all_undercover_rooms` | Bulk distruttivo | `[ ]` NOT TESTED SAFELY |
| Chiudi tutte partite Undercover | `closeAllUndercoverMatches` | RPC `admin_close_all_undercover_matches` | Riporta match in lobby | `[ ]` NOT TESTED SAFELY |
| Blocca/sblocca giocatori | `blockPlayers`, `unblockPlayers`, `kickPlayers` | UPSERT/UPDATE `blocked_users`, `uno_players`, `undercover_players` | Moderazione | `[ ]` |
| Log Admin | `writeAdminLog`, `loadLogs` | INSERT/SELECT `admin_logs` | Audit azioni | `[~]` lettura/schema |
| Live Undercover/UNO | `loadUndercoverLive`, `loadUnoRooms` | SELECT room/player + Realtime | Monitoraggio | `[~]` query/schema; realtime pubblico non PASS |

## Bug trovati e correzioni

1. `site_games.disabled_message` riceveva `null` dal form. Il payload ora normalizza il valore a stringa vuota e la migrazione mantiene default/backfill/`NOT NULL`. Create e update E2E non hanno prodotto violazioni 23502.
2. I record custom venivano esclusi dal rendering Admin perché il filtro confrontava la mappa appena costruita invece dell'insieme degli ID built-in. Il catalogo ora mostra anche il gioco E2E.
3. Il global lock sovrascriveva lo stato individuale dei giochi. Ora usa `site_settings.global_games_locked`; il test DB ha preservato gli status di Tris, UNO e Tetris in due cicli.
4. Il bootstrap pubblico era fragile con script CDN/cache: una scheda poteva restare sul fallback statico. È stato reso esplicito il percorso UMD, aggiunto il guard del client e inserito il rendering delle card custom. Retest Realtime riuscito.

## Schema e sicurezza

- `admin/admin-supabase.sql` è una migrazione additiva/idempotente con `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, backfill sicuro, trigger, RLS, RPC e `NOTIFY pgrst, 'reload schema'`.
- La verifica live autenticata ha restituito HTTP 200 per le tabelle Admin e per le colonne esplicite di `site_settings`, `site_games` e `site_messages`, inclusi `global_games_locked` e `title`.
- RLS mantiene lettura pubblica solo delle configurazioni necessarie; scritture e RPC Admin richiedono `public.is_admin()`/utente autenticato. Nessun `service_role` nel frontend.
- Non sono presenti `DROP TABLE`, `DROP COLUMN` o `TRUNCATE` nella migrazione.

## Realtime e regressione

- I channel Admin hanno cleanup prima della risottoscrizione e stati `SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED` distinti nel codice.
- Regressione statica: `node --check` su `admin/admin.js` e `js/app.js`; nessun engine gameplay o SQL Undercover modificato.
- Regressione live: auth/admin, create/update gioco, disabled message, maintenance DB e global lock DB eseguiti senza errori schema cache/RLS/NOT NULL.

## Limitazioni

- La verifica public è stata completata per maintenance, catalogo custom, visible e global lock dopo il fix bootstrap.
- I bulk UNO/Undercover non sono stati eseguiti contro stanze reali. Serve staging o dati E2E isolati per classificarli PASS.
- Non è stato fatto commit, push o deploy.
