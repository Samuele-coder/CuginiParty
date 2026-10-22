# Racing 3D / Online — integrazione Admin Center

## Configurazione e badge

Identità unica: `site_games.game_id = racing`. Racing Online è una modalità, non un nuovo record del catalogo. URL del servizio: `https://cuginiparty-racing.guessmeapp.workers.dev`.

Il badge BETA predefinito era scritto sia nella Home sia nel normalizzatore pubblico, che sovrascriveva i badge Admin a ogni aggiornamento. Entrambe le imposizioni sono rimosse. Il record reale aveva già `badge = null`: non è stato cancellato alcun badge nel database. I badge scelti dall'Admin e le loro scadenze restano autorevoli, anche dopo reload.

L'icona Racing personalizzata non viene più sostituita da quella predefinita durante normalizzazione/rendering. Emoji e percorsi di asset locali sono supportati; i campi icona accettano fino a 240 caratteri. Il numero di ordinamento è modificabile nell'editor e in Applica TUTTE, viene salvato e viene rispettato sia in Admin sia nella Home; prima l'editor era disabilitato e l'ordine canonico prevaleva sul valore salvato.

Su richiesta dell'utente è stato modificato **soltanto** `site_games.racing.new_rooms_enabled`, da false a true, con rilettura di conferma. Multiplayer, nuove gare e blocchi globali erano già configurati per consentire di giocare: non sono stati alterati. Nessuna modifica a schema, policy RLS, altri giochi o altri progetti.

## Mappatura delle funzioni reali

| Area | Comportamento per Racing |
| --- | --- |
| Stato disponibile/manutenzione, enabled legacy | Home e pagine Racing/Online; pausa del gioco offline quando arriva un blocco; verifica autorevole del Worker per l'online. |
| Visibilità | Nasconde la card e blocca anche l'accesso diretto online lato server. |
| Pubblicazione programmata | `coming_soon` con auto-release e timestamp valido scaduto diventa disponibile, anche con enabled legacy false; UTC e fuso Europe/Rome testati. |
| Data e ora pubbliche | Campi esistenti mantenuti, distinti dal timestamp che governa l'auto-release. |
| Titolo, descrizione, icona, categoria, percorso | Persistiti tramite l'editor esistente e rispettati nella card. ID tecnico stabile `racing`. |
| Badge e scadenza | Nessun BETA forzato; badge personalizzati e scadenze rispettati. |
| Ordine | Input numerico nell'editor, campo opzionale nel massivo; valori salvati rispettati. |
| Selezione multipla / Applica TUTTE | Opera sui soli giochi selezionati, mantiene i campi non compilati; test con Racing e un secondo record isolato, reload e rilettura. |
| Globale tutti disponibili / tutti in manutenzione | I payload esistenti includono Racing; il Worker legge anche global_games_locked, non soltanto i flag del record. |
| Offline/emergenza/blocco totale | Blocchi globali rispettati dalla UI e dal Worker. |
| Manutenzione globale | Conserva la semantica esistente di avviso chiudibile; non viene trasformata in spegnimento indiscriminato. La manutenzione del singolo gioco invece blocca Racing. |
| Multiplayer ON/OFF | Globale e del gioco; controlli su HTTP, WebSocket, comandi e gare attive/restaurate. |
| Nuove stanze ON/OFF | Globale e del gioco; impedisce nuove creazioni, non ingresso o ripresa in stanze già esistenti. |
| Nuove gare ON/OFF | Il campo esistente è globale (`site_settings.new_matches_enabled`); blocca start/rivincite, senza interrompere una gara già in corso. Non è stata inventata una colonna omonima in site_games. |
| Messaggi/banner/popup mirati al gioco | La pagina Online risolve l'identità come `racing`, quindi riusa lo stesso targeting esistente. |
| Temi, preferenza chiaro/scuro | Stesso runtime e stessa persistenza già presenti; nessun secondo sistema di tema. |
| Statistiche e record | Offline conserva record locali; risultati Online autorevoli per stanza, non una nuova classifica permanente Supabase. |
| Sezioni UNO / Undercover Live / gestione partite UNO | Restano specifiche di quei protocolli e tabelle. Non vengono estese impropriamente al Worker Racing. |
| Gestione giocatori Supabase, ban/kick individuali e log | Operazioni esistenti non riscritte. Le identità ospite Racing sono per stanza: non si dichiara implementato un ban globale individuale o un browser Admin delle stanze Racing. I salvataggi catalogo continuano a usare il logging Admin esistente. |

## Enforcement del Worker

Il Worker legge direttamente `site_settings.id=1` e `site_games.game_id=racing` dalla Data API Supabase con la chiave **pubblicabile**, senza privilegi service-role e senza un altro client SDK. Le policy reali sono state ispezionate: lettura pubblica; scritture riservate a `is_admin()` per gli utenti autenticati. Le impostazioni inviate dal giocatore non vengono considerate come autorizzazione.

La stessa decisione è condivisa con i due controller Racing tramite `js/racing-admin-policy.js`. Il Worker applica il controllo prima di creazione HTTP, inizializzazione interna, upgrade WebSocket, join/resume e comandi. La creazione e start richiedono una lettura fresca; gli altri controlli usano record in cache per massimo 2 secondi. Le letture hanno timeout di 3 secondi: dati mancanti, duplicati, malformati o backend indisponibile non aprono il servizio.

Anche il ciclo di simulazione controlla le impostazioni, senza tick asincroni sovrapposti. Un blocco rigido o l'impossibilità di verificarlo interrompe la gara con motivazione esplicita e DNF per chi non era già arrivato: non basta neutralizzare il gas mentre i bot continuano. Una stanza attiva ripristinata non compie passi di fisica prima del controllo. La propagazione non è istantanea: cache e richiesta impongono una finestra nominale fino a circa 5 secondi, oltre agli eventuali ritardi della piattaforma.

La manutenzione globale informativa e il solo blocco di nuove stanze/gare non vengono interpretati come kill switch di una gara attiva. Rimangono invariati permessi host, ticket del creatore, token di ripresa, protocollo, 20 secondi di grace, checkpoint, punteggi e bot autorevoli.

La revisione indipendente ha evidenziato e fatto correggere due regressioni: il controllo offline ora rispetta un blocco noto anche se manca l'altro record Admin; il rate limit WebSocket misura l'arrivo dei messaggi, non la loro elaborazione dopo una lettura lenta. Una lettura di 2,4 secondi non espelle più un pilota legittimo che invia a 20 Hz.

## Test e confini della verifica

- `tests/racing-admin-policy.test.cjs`: blocchi globali/per gioco, creazione/start distinti, rilascio automatico, manutenzione globale informativa, record malformati/mancanti, indisponibilità, cache, dati parziali offline, ripristino di una gara bloccata.
- `tests/racing-admin-server.test.cjs`: vero workerd locale, richieste dirette e flag falsificati, socket aperto prima del blocco, resume con creazione chiusa, start negato, gara esistente preservata dal blocco nuove gare, kill multiplayer con DNF, handshake negato, indisponibilità e ripristino, input a 20 Hz durante letture lente.
- `tests/racing-admin-browser.test.cjs`: DOM Admin reale, fixture DB isolata persistente tra ricaricamenti, editor, campi, badge, visibilità, date/UTC, auto-release, multiselezione/Applica TUTTE, Home, identità condivisa, controlli Online e pausa offline anche con dati parziali.
- `tests/racing-online-browser.test.cjs`: due sessioni Chromium separate, tastiera/touch, snapshot condivisi, bot, reload/resume, risultati, rivincita senza bot e uscita. La verifica del movimento ora attende un vero pacchetto gas, per non scambiare una collisione del bot per input del giocatore.
- Suite motore, catalogo, gara completa WebSocket e browser offline rieseguite; controllo temi Racing/Online su 64 combinazioni; calendario eventi e regressioni minigiochi; controllo sintassi/riferimenti/segreti e build Wrangler dry-run.

I test di editor massivi e blocchi distruttivi usano fixture isolate: non sono stati alterati nome, badge, visibilità o disponibilità di produzione per simulare i casi. La sola modifica persistente reale delle impostazioni è l'abilitazione delle nuove stanze richiesta dall'utente. I test non equivalgono a una certificazione di ogni funzione Admin su un account umano reale.

Test pubblico esplicito (crea una stanza di collaudo temporanea, non va eseguito implicitamente): impostare `RACING_TEST_SERVER_URL` sull'URL esatto del Worker autorizzato ed eseguire `tests/racing-online-race.test.cjs`. Verifica una gara completa con due client WebSocket e un bot, gate e classifica identici. Non certifica due telefoni fisici su reti indipendenti.

Esito del collaudo pubblico su questa versione del Worker: PASS, due client con 21 gate ciascuno e classifica condivisa (33,09 s / 34,49 s / 35,59 s, bot incluso). Audit responsive globale finale: 27 pagine × 11 viewport × chiaro/scuro, nessun overflow, errore JavaScript o risorsa mancante.

## Pubblicazione

Il deploy del solo Worker Racing è stato autorizzato esplicitamente dall'utente dopo la richiesta iniziale. Si usa `server/racing/wrangler.toml`, nome `cuginiparty-racing`, `--keep-vars` per preservare le altre variabili e le stesse due classi Durable Object esistenti, senza migrazioni aggiuntive. Versione pubblicata: `cb205c8f-1039-430b-bcd8-3e74cbab809f`.

Il sito viene pubblicato soltanto tramite commit/push del repository CuginiParty su `main`, collegato a Pages `cuginiparty` con output `.`. Nessun deploy Pages manuale o modifica a GuessMe. Credenziali segrete, .env, cache, dipendenze locali e file temporanei restano esclusi.
