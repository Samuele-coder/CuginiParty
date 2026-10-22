# CuginiParty — Temi, stabilità e controlli: report finale

> Report del precedente intervento infrastrutturale. La descrizione della prima grafica minimale qui conservata è stata superata dalla trasformazione illustrata documentata in `EVENTS_VISUAL_REPORT.md`. Le evidenze SQL e i fix ai giochi restano riferiti a quel precedente intervento, non sono nuove modifiche di questa fase grafica.

Data: 18 ottobre 2026. Progetto locale: `C:/Users/EUR/Documents/giochi`. Baseline Git: `9907c3ba83dabc99fd221cbe3e04b360600ca8fa`.

## Stato della consegna

Implementazione locale completata e verificata nei casi descritti. **Migrazione Supabase applicata** al progetto CuginiParty `pzjbxrcxlztwjxetnzkw`: `20261018171104_cuginiparty_theme_events_v1`. Nessun evento pubblicato automaticamente e nessuna modifica ai valori delle impostazioni esistenti. **Nessun commit, push o deploy del frontend.**

Per usare l’editor aprire l’Admin locale con un account già autorizzato; in produzione occorre pubblicare successivamente i file frontend. Non è stato effettuato un accesso impersonando un Admin reale e non è stata attivata una festività senza una scelta dell’utente.

## 1. Problemi reali individuati

- Tetris: su 320/375/390/430 px le anteprime dei prossimi pezzi uscivano da una card larga un terzo della sidebar. Lo scroll della pagina era già nascosto e non rendeva visibile il difetto: corretto il dimensionamento della griglia, non aggiunto overflow hidden.
- Polizia e Ladri: il resize seguiva solo window, non le variazioni del viewport visibile, e imponeva almeno 320×240 al canvas anche quando lo spazio disponibile era minore. La normale rotazione Chromium non riproduceva da sola il problema segnalato; viewport ridotto/offset sono stati provati separatamente. Non si attribuisce a un telefono fisico una prova mai effettuata.
- Racing: protezione touch incompleta a livello del contenitore in gara, selezione/callout non coperti sui fallback WebKit; controlli testuali/simbolici anziché SVG coerenti.
- Alpine: due delle sedici impronte originali delle montagne interferivano col circuito. Distanze minime originali 32,32 m e 18,70 m, contro 42,50 m necessari per raggio 35 m + semilarghezza pista. Il solo offset dal tratto generatore non proteggeva dai tornanti vicini.
- Terreno Racing: griglia grossolana e interpolazione vicino alle curve potevano attraversare la strada; i props devono poggiare sul terreno realmente triangolato, non solo sull’altezza analitica.
- Pagina alternativa `polizia-ladri.html`: percorsi da pagina annidata (`../`) nella pagina alla radice, fragili fuori dall’hosting alla root.
- Footer, etichette sidebar Admin ed etichetta Darts: contrasto insufficiente in alcuni stati.
- Impostazioni Home: popup senza limite verticale adeguato per viewport bassi.
- Icone Home: i refresh ricreavano il nodo immagine anche quando il percorso non cambiava; ora viene riutilizzato.

## 2. Temi speciali e Admin

| Tema | Identità implementata | UI locale |
| --- | --- | --- |
| Halloween | Viola, arancione, zucca, pipistrello e fantasma SVG | PASS |
| Natale | Verde/rosso/oro, albero, fiocchi, stelle e dettaglio luci | PASS |
| Epifania / Befana | Toni stellati, calza, stella e scopa SVG | PASS |
| Pasqua | Pastelli, uovo, fiore e coniglietto | PASS |
| Capodanno | Notte/oro/argento, scintille, stelle e coriandoli | PASS |
| Carnevale | Colori vivaci, maschera, coriandoli e nastro | PASS |
| San Valentino | Rosa/rosso/viola, cuori, fiori e scintille | PASS |
| Ferragosto | Turchese/azzurro/giallo, sole, onde e conchiglia | PASS |

Il sistema conserva `body.dark-mode` e `CuginiParty_dark_mode`: non introduce una preferenza chiaro/scuro concorrente. Palette ed effetti sono centralizzati; varianti chiare e scure mantengono leggibilità. Decorazioni vettoriali, pulsanti, intestazioni, card, menu, HUD/dialog e schermate finali ricevono dettagli stagionali. Sono presenti adattatori per UI personalizzate, compresi Tetris, Cube Rush, Indovina Chi e Undercover. Il runtime è caricato in Home, Admin, 23 giochi e nell’entrypoint alternativo Polizia e Ladri.

L’Admin mostra otto schede con anteprima specifica, modalità/stato/date e **Modifica evento**. Supporta disattivato, manuale, programmato e annuale. Date/orari sono Europe/Rome; fine esclusa. Pasqua viene calcolata per l’anno corrente; Carnevale usa martedì grasso del rito romano con offset personalizzabili. I periodi fissi possono attraversare Capodanno. Priorità configurabile, un solo vincitore; parità risolta stabilmente per ID alfabetico.

Le configurazioni persistono in `site_settings.value.theme_events`, non in localStorage. Pubblicazione/calendario vengono risolti dai visitatori usando le impostazioni condivise e l’ora server: il PC Admin può essere spento. Timer locali aggiornano le pagine già aperte; a scadenza torna il tema normale rispettando la preferenza personale.

Anteprima privata: verifica della sessione e di `is_admin()`, bozza in sessionStorage per due ore, stessa scheda su Home e giochi. Una scheda indipendente continua a vedere il tema pubblico. Nessun UPDATE viene fatto dai pulsanti di anteprima.

Provato anche il bootstrap SDK ritardato delle pagine di gioco: l’anteprima attende il client già previsto da app.js e non viene cancellata prima che la connessione sia pronta. Una sola richiesta SDK e un solo client verificati nel caso Racing.

Effetti separabili: statici, particelle, animazioni, intensità e qualità. Budget massimo dieci particelle DOM, ridotto su dispositivi deboli/risparmio dati. `prefers-reduced-motion` spegne animazioni e particelle. Le impostazioni Home consentono anche Automatici/Ridotti/Disattivati. La cornice animata è nascosta durante Racing/Heist; nessuna decorazione viene disegnata dentro i canvas o sulla pista. Carte UNO, torce, skin, nemici e colori funzionali restano quelli dei giochi.

## 3. Persistenza, autorizzazioni e database reale

La migrazione riusa il campo JSON e `is_admin()` già esistenti. Non crea nuove tabelle, non cambia il client Supabase, non modifica ruoli utente, policy multiplayer o configurazioni di autenticazione.

- RPC `admin_save_theme_events`: autorizzazione server, validazione limitata agli otto eventi previsti, conservazione delle altre chiavi/flag, confronto di updated_at e aggiornamento atomico.
- Trigger `site_settings_theme_events_guard`: protegge il campo anche da un UPDATE diretto, senza affidarsi soltanto all’editor.
- Orologio pubblico `theme_events_clock`: ora server senza segreti o dati amministrativi.
- Nessun fallback di scrittura meno protetto. Su installazioni non migrate compare l’indicazione esplicita di eseguire `admin/events.sql`.

Verifiche reali dopo migrazione: funzione/guardia presenti, anon senza privilegio di esecuzione sul salvataggio, utenti autenticati ammessi alla funzione ma sottoposti al controllo Admin, due trigger originali preservati. Chiamata HTTP anonima respinta con **401 / 42501**; orologio HTTP **200**. Controllo SQL in ruolo authenticated senza identità Admin: rifiuto prima di qualsiasi scrittura, transazione annullata.

Digest della riga impostazioni prima/dopo: `ba49cc59dded4879492561da84a655ba`, identico. `theme_events` non pubblicato. La migrazione ha aggiunto soltanto gli oggetti necessari; nessun salvataggio/progresso o stato partita è stato modificato.

## 4. Undici verifiche generali

| Area | Esito verificato / intervento |
| --- | --- |
| Overflow orizzontale | PASS: 26 pagine × 11 dimensioni × 2 temi di base, 572 casi; rilevati anche discendenti fuori schermo, non soltanto scrollWidth. |
| Responsive | PASS nei viewport emulati indicati; Heist attivo con touch su tutte le undici dimensioni. |
| Pulsanti/link | PASS per risorse/ID/path e flussi esercitati; non certificato ogni singolo pulsante condizionato da partite multiplayer reali. |
| Dark mode | Verificati titoli/UI, varianti degli otto eventi e controlli; corretti i difetti trovati. Non è una certificazione WCAG automatica di ogni pixel/gradiente. |
| Asset | PASS: 26 HTML con risorse locali esistenti; nessun 404 locale nei flussi. Nessuna nuova dipendenza da modelli/immagini remoti. |
| JS/CSS/caricamento | PASS: sintassi di 18 file JS/test coinvolti, ID unici, zero page errors nei test finali. |
| Spacing/dimensioni | Fix mirati a Tetris, popup Home e schede Admin; nuovi controlli/azioni almeno 44 px dove appropriato. |
| Contrasto | Footer/sidebar/Darts corretti, palette UI leggibili e input stagionali coerenti. |
| Animazioni | Bounded budget, reduced-motion reale, nessun nuovo animation loop JS stagionale. |
| Asset/performance | Riuso del nodo immagine, decoding asincrono, lazy fuori dai primi tre giochi; nessuna ricompressione distruttiva né modifica delle icone. |
| Form/validazione | PASS nei flussi Admin provati (date invertite, ora DST inesistente, migrazione mancante) e nickname/codice UNO; stanze reali multiutente NON TESTATO. |

Viewport: 320×568, 375×667, 390×844, 430×932, 667×375, 844×390, 932×430, 768×1024, 1024×768, 1366×768, 1920×1080.

## 5. Polizia e Ladri

La superficie di gioco ora segue width/height e offset di visualViewport, osserva le variazioni delle barre e del contenitore, ridimensiona dopo la rotazione e non impone dimensioni minime più grandi dello spazio. Joystick resettato alla rotazione per non conservare un comando obsoleto; movimento, polizia, torce, collisioni e obiettivi invariati.

Test su contesto touch: undici dimensioni, canvas a misura, joystick/interazione accessibili, partita ancora running/non-paused/non-ended dopo ogni rotazione. Provato anche viewport visibile 667×210 con offset superiore 30 px. Standard Chromium prima del fix non riproduceva da solo il problema originale: Safari/iOS fisico resta NON TESTATO.

## 6. Racing 3D

Quattro SVG originali senza emoji: sinistra/destra e pedali freno/gas, etichette accessibili, feedback pressione e safe area. Gestione pointer, multitouch e tastiera preservata.

Il contenitore in racing/countdown usa touch-action none, user-select e touch-callout mirati. Fallback per gesture/doppio tap/selectstart/drag/contextmenu solo durante la gara; form editabili esclusi. Nei menu touch-action torna auto. Rimossi anche i vecchi blocchi di zoom globali nelle pagine Cube Rush/Gatto e Topo/Heist, che conservano le protezioni delle superfici di gioco.

Prova CDP: pinch 1,5× non cambia visualViewport.scale (resta 1), due contatti sterzo/gas vengono annullati correttamente, selezione vuota. Selezione del nickname UNO resta funzionante. Questo non equivale a una prova fisica iOS.

Mappe: posizionamento delle grandi impronte rispetto a tutti i tratti, sedici montagne Alpine mantenute fuori strada, props ancorati al terreno triangolato. Vengono abbassati soltanto i triangoli che attraverserebbero strada/banchine, senza scavare un fossato sotto l’intera pista.

| Circuito | Impronte controllate (qualità alta) | Terreno massimo rispetto alla strada | Esito |
| --- | --- | --- | --- |
| Grand | 127 | -0,104 m | PASS |
| Canyon | 18 grandi formazioni | -0,115 m | PASS |
| City | 126 | -0,105 m | PASS |
| Alpine | 150, incluse 16 montagne | -0,105 m | PASS |
| Neon | 130 | -0,103 m | PASS |

Motore, fisica, velocità, bot, racing line, checkpoint, storage e specifiche auto non sono cambiati. Le 15 gare complete della suite terminano con 90 arrivi e zero reset. Anche Time Trial da tastiera e cinque gare complete renderizzate passano.

## 7. Test eseguiti

| Suite / verifica | Stato | Ambito |
| --- | --- | --- |
| events.test.cjs | PASS | Otto eventi, date, DST, precedenze, ricorrenze e geometrie delle cinque piste. |
| events-database.test.cjs | PASS | SQL reale su PostgreSQL isolato: migrazione ripetuta, anon/non-Admin respinti anche con policy permissiva, Admin save/read, CAS, dati errati e JSON/JSONB. |
| events-browser.test.cjs | PASS | Editor fixture e 832 casi evento/pagina/viewport/tema, anteprime, scadenza live, motion, Heist touch, form UNO. |
| platform-layout-audit.cjs, strict | PASS | 572 casi senza sforamenti, zero errori e risorse mancanti. |
| racing-3d-engine.test.cjs | PASS | 15 gare complete, guida, gate, recovery e persistenza. |
| racing-3d-browser.test.cjs | PASS | Tastiera/touch a tre velocità, sette viewport, Time Trial, cinque gare intere, replay e risorse. |
| racing-3d-visual.test.cjs | PASS | Cinque scene native, menu/garage/settings, WebGL loss/restore senza reload. |
| racing-3d-catalog.test.cjs | PASS | Racing unico #3, ID/badge, metadati e flag preservati. |
| guess-who-static.test.cjs | PASS | Roster, DOM, file, catalogo, privacy esistenti. |
| SQL produzione: migrazione/permessi/clock | PASS | Schema verificato sul progetto corretto; nessun tema attivato. |
| Admin reale: pubblicare un evento con login utente | NON TESTATO | Nessuna sessione Admin reale usata né impersonata. Percorso positivo provato in DB isolato e UI fixture. |
| Safari/iOS/Android fisici | NON TESTATO | Dispositivi e browser non disponibili; WebKit/Firefox non installati. |
| Ogni partita e azione multiplayer reale | NON TESTATO | Nessuna modifica alla logica multiplayer; test di form e UI non sostituiscono una partita multiutente. |

Artefatti esterni al progetto:

- Temi/editor finali: `C:/Users/EUR/AppData/Local/Temp/cuginiparty-events-vIcIdL/results.json` e otto screenshot Home dedicati.
- Layout finale: `C:/Users/EUR/AppData/Local/Temp/cuginiparty-layout-KTSmJG/audit.json`.
- Gara browser: `C:/Users/EUR/AppData/Local/Temp/racing3d-v1-5kNVeP/results.json`.
- Scene native: `C:/Users/EUR/AppData/Local/Temp/racing3d-visual-vQMsZD/metrics.json` e immagini.

Il test database usa PGlite 0.5.10 scaricato con verifica dell’integrità soltanto in una directory temporanea esterna; non è una dipendenza del sito. [API ufficiale usata per la verifica](https://pglite.dev/docs/api).

## 8. Prestazioni misurate, non stimate

Chromium headless, WebGL 2 **software**, qualità bassa, 844×390, DPR 1. Non sono misure di un telefono/GPU reale né certificano 60 FPS; il carico dei test concorrenti influisce sui risultati.

| Circuito | Draw calls | Geometrie | Triangoli | Istanze | FPS software osservati |
| --- | --- | --- | --- | --- | --- |
| Grand | 103 | 44 | 60.340 | 1.837 | 25 |
| Canyon | 101 | 43 | 43.568 | 1.705 | 20 |
| City | 97 | 41 | 57.128 | 3.051 | 16 |
| Alpine | 104 | 44 | 45.520 | 1.863 | 23 |
| Neon | 99 | 41 | 42.536 | 1.807 | 22 |

Cinque ricostruzioni dell’anteprima: geometrie GPU 8/8/8/8/8, texture GPU zero. Heap JS quantitativo NON TESTATO: API memoria non disponibile. Il nuovo sistema di effetti non aggiunge texture o luci 3D.

## 9. Inventario completo

18 file modificati, 12 creati, nessun file eliminato. Nessun asset bitmap alterato. Le copie/screenshot/dipendenze di verifica sono esterne al progetto.

### FILE MODIFICATI

| File | Motivo |
| --- | --- |
| `admin/admin-supabase.sql` | Campo JSON value anche nelle installazioni Admin nuove; nessuna modifica alle policy o alle tabelle multiplayer. |
| `admin/admin.css` | Etichette sidebar con il token di testo secondario leggibile, invece del grigio a basso contrasto. |
| `admin/admin.js` | Ponte verso client/stato Admin esistenti e notifica delle impostazioni al runtime stagionale; autenticazione originale invariata. |
| `admin/index.html` | Voce e sezione Temi ed Eventi, moduli, stati, priorità e caricamento dell’editor dedicato. |
| `css/darts.css` | Colore leggibile dell’etichetta superiore in dark mode, anche su sfondo stagionale. |
| `css/polizia-ladri.css` | Canvas e stage seguono dimensioni/offset del viewport visibile; protezione callout limitata al gameplay. |
| `css/racing-3d.css` | Aspetto sportivo dei quattro controlli SVG; touch/selection/callout protetti solo in gara, campi editabili esclusi. |
| `css/style.css` | Popup impostazioni scrollabile verticalmente nelle altezze ridotte, contrasto footer migliorato e riduzione delle animazioni Home secondo la preferenza di sistema. |
| `css/tetris.css` | Card dei prossimi pezzi a tutta riga su mobile e colonne minmax: elimina la causa delle anteprime fuori schermo. |
| `games/cube-rush.html` | Rimosso il blocco globale dello zoom; il canvas mantiene la propria gestione touch. |
| `games/gatto-topo.html` | Rimosso il blocco globale dello zoom; protezioni della sola superficie di gioco preservate. |
| `games/polizia-ladri.html` | Viewport accessibile senza maximum-scale; il gameplay ha protezioni proprie. |
| `games/racing.html` | Quattro SVG coerenti per destra/sinistra, pedale acceleratore e freno, con etichette accessibili. |
| `js/app.js` | Caricamento centralizzato degli eventi e notifica del catalogo impostazioni; immagini asincrone/lazy con riuso del nodo già presente. |
| `js/polizia-ladri.js` | Resize su visualViewport, scroll, orientamento e ResizeObserver; tolti minimi artificiali del canvas; reset joystick condiviso senza cambiare movimento. |
| `js/racing-3d-environment.js` | Ingombri rispetto all’intero circuito, montagne preservate ma riposizionate, appoggio props sul terreno e triangoli conformati sotto la strada. |
| `js/racing-3d.js` | Fallback per gesti, selezione e trascinamento accidentali, circoscritti a gara/countdown; input originali mantenuti. |
| `polizia-ladri.html` | Stessa correzione viewport dell’entrypoint canonico, più percorsi CSS/JS/Home corretti per la pagina alla radice. |

### FILE CREATI

| File | Motivo |
| --- | --- |
| `EVENTS.md` | Guida d’uso, architettura, migrazione, calendario, sicurezza e riproduzione dei test. |
| `EVENTS_REPORT.md` | Questo report con inventario completo ed evidenze. |
| `admin/events-admin.js` | Editor degli otto eventi, bozza, anteprime private, validazione, conflitti e salvataggio via RPC protetta. |
| `admin/events.sql` | Migrazione additiva dei soli temi: validazione, guardia DB, RPC Admin e orologio pubblico. |
| `css/events.css` | Identità stagionali e adattatori delle interfacce, senza cambiare canvas, carte o mondo 3D. |
| `js/events-calendar.js` | Otto definizioni, normalizzazione, calendario Roma, Pasqua/Carnevale, finestre annuali e priorità. |
| `js/events-runtime.js` | Applicazione condivisa, effetti SVG, timer di calendario, riduzione effetti e anteprima di sessione autorizzata. |
| `tests/events-browser.test.cjs` | Editor e anteprima, 832 combinazioni stagionali, timer, reduced motion, validazioni e Heist touch. |
| `tests/events-database.test.cjs` | Migrazione reale su PostgreSQL isolato, permessi, scritture, conflitti, configurazioni errate e JSON/JSONB. |
| `tests/events.test.cjs` | Calendario, DST e controllo geometrico di ingombri/terreno sulle cinque piste. |
| `tests/platform-layout-audit.cjs` | Audit di overflow effettivi dei discendenti, non soltanto dello scroll radice. |
| `tests/platform-test-server.cjs` | Server statico di verifica e fixture Supabase dichiarata, senza dati o credenziali reali. |

### FILE ELIMINATI

NESSUNO.

## 10. Diff e problemi residui

Diff finale verificato, comprese sintassi, ID e percorsi dei 26 HTML. Nessuna modifica a motore/track/data/storage Racing, Supabase client, UNO/Undercover JS o asset. Il controllo whitespace considera correttamente le convenzioni CRLF del progetto. Nessun reset distruttivo, commit, push o deploy.

[Patch completa locale](C:/Users/EUR/AppData/Local/Temp/cuginiparty-events-final.diff), inclusi i file nuovi non ancora aggiunti a Git.

Resta da pubblicare il frontend locale se si desidera l’aggiornamento sul sito live. La migrazione database è già applicata, ma non è stato scelto né pubblicato un calendario per conto dell’utente: tutti i temi restano disattivati in assenza di una configurazione Admin. L’attivazione automatica funzionerà dopo che un Admin avrà salvato le proprie modalità/date.

Limiti dichiarati: nessun test fisico Safari/iOS/Android, nessuna certificazione 60 FPS hardware, nessuna partita reale multiutente completa, nessuna certificazione di tutti gli stati dinamici possibili o conformità WCAG integrale. Le decorazioni sono intenzionalmente leggere e limitate all’UI: non sono state introdotte nevicate a tutto schermo, post-processing o elementi che coprono il gameplay.
