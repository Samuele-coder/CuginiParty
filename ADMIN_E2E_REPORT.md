# CuginiParty Admin E2E Report

## Ambiente test

- Server HTTP locale: `http://127.0.0.1:8765/`.
- Admin e Home aperti in schede browser distinte.
- Verifiche Supabase programmatiche eseguite con l'account Admin E2E fornito, senza `service_role`.
- Dati creati: un solo record `e2e-test-game-1789143893421`, riutilizzato per i test e infine nascosto (`visible=false`) come cleanup reversibile.

## Login

- Supabase Auth: PASS.
- `admin_users` authorization: PASS (`user_id` autenticato presente e `enabled=true`).
- Dashboard caricata: PASS.

## Bug trovati

| Sintomo | Causa | Correzione | Test | Risultato |
|---|---|---|---|---|
| Violazione `disabled_message NOT NULL` | Il form inviava `null` | Normalizzazione frontend + default/backfill SQL | Create/update E2E | PASS |
| Gioco custom assente nelle card Admin | Filtro custom errato in `loadGames` | Filtro contro gli ID built-in | Reload Admin | PASS |
| Global lock distruggeva gli status individuali | UPDATE massivo su `site_games` | Override `site_settings.global_games_locked` | 2 cicli DB lock/unlock | PASS |
| Public non rifletteva settings remote | Bootstrap CDN/cache fragile nella scheda browser e assenza di card custom dinamiche | Bootstrap UMD esplicito + guard client + card dinamica | Reload/retest public Realtime | PASS |

## Command Matrix

| Comando | UI | Backend | DB verificato | Public verificato | Cicli | Esito |
|---|---|---|---|---|---:|---|
| Login Admin | PASS | PASS | PASS | N/A | 1 | PASS |
| Dashboard | PASS | PASS | PASS | N/A | 1 | PASS |
| Create game E2E | PASS | PASS | PASS | PASS dopo retest card custom | 1 | PASS |
| Modify game E2E | PASS | PASS | PASS | NOT TESTED | 1 | PASS |
| `disabled_message` non nullo | PASS | PASS | PASS | N/A | 2 | PASS |
| Maintenance globale | PASS | PASS | PASS | PASS Realtime | 2 | PASS |
| Global games lock | NOT TESTED UI | PASS | PASS | PASS Realtime | 2 | PASS |
| Single game maintenance | NOT TESTED UI | PASS | PASS | PASS Realtime | 1 | PASS |
| Visible ON/OFF/ON | NOT TESTED UI | PASS | PASS | PASS Realtime | 1 | PASS |
| Announcements | NOT TESTED | NOT TESTED | schema PASS | NOT TESTED | 0 | NOT TESTED |
| Undercover realtime | NOT TESTED | NOT TESTED | schema PASS | NOT TESTED | 0 | NOT TESTED |
| UNO bulk rooms | NOT TESTED | RPC presente | NOT TESTED safely | NOT TESTED | 0 | NOT TESTED |
| UNO bulk matches | NOT TESTED | RPC presente | NOT TESTED safely | NOT TESTED | 0 | NOT TESTED |
| Undercover bulk rooms | NOT TESTED | RPC presente | NOT TESTED safely | NOT TESTED | 0 | NOT TESTED |
| Undercover bulk matches | NOT TESTED | RPC presente | NOT TESTED safely | NOT TESTED | 0 | NOT TESTED |
| Admin card light/dark | PASS | N/A | N/A | N/A | 2 | PASS |

## Schema

- Migration canonica: `admin/admin-supabase.sql`.
- Colonne live verificate: `site_settings.global_games_locked`, `site_messages.title`, `site_messages.target` e tutti i campi usati da Admin V2 in `site_games`/`site_settings`/`site_messages`.
- `site_games.disabled_message` resta `NOT NULL` con default `''`.
- RLS: lettura pubblica limitata alle configurazioni necessarie; scrittura Admin tramite utente autenticato autorizzato. Le policy Undercover legacy sono preservate.
- RPC Admin presenti e protette: chiusura singola/totale room e match UNO/Undercover.
- La migrazione contiene `NOTIFY pgrst, 'reload schema'`; dopo una nuova esecuzione può essere necessario attendere il refresh cache e ricaricare il browser.

## Realtime

- Channel Admin censiti: settings, games, messages, Undercover rooms/players.
- Cleanup precedente alla risottoscrizione: presente nel codice.
- Stati gestiti: `SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`.
- Verifica public realtime: PASS per `site_settings` e `site_games`; la scheda ha ricevuto maintenance, lock e transizioni card senza reload intermedio.

## Test di regressione

- Global maintenance 2 cicli completi DB + public Realtime: PASS.
- Global game lock 2 cicli DB: PASS; status configurati preservati.
- Create/modify game: PASS UI + DB.
- Visible e single-game maintenance: PASS DB + public Realtime; announcements: NOT TESTED.
- Undercover e UNO: query/schema/RPC auditati; bulk live non eseguiti per sicurezza.
- Light/dark Admin cards: PASS.
- `node --check` Admin/app: PASS.
- Nessun errore live osservato per schema cache, colonna inesistente, RLS o `NOT NULL` nei flussi autenticati eseguiti.

## Limitazioni

- Non posso dichiarare la suite Admin completa PASS: announcements, Undercover realtime e bulk live restano non testati.
- I comandi bulk richiedono staging o fixture E2E isolate prima di una verifica distruttiva.
- Nessun commit, push o deploy eseguito; gameplay, Block Blast, Tetris e Undercover SQL non sono stati modificati.
