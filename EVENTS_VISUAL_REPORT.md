# CuginiParty — Edizioni speciali illustrate

## Consegna

Trasformazione grafica degli otto eventi esistenti, senza ricreare il sistema di gestione. Nessuna festività pubblicata; nessun nuovo dato o schema Supabase, commit, push o deploy.

La working copy conteneva già le modifiche del precedente intervento, documentate in `EVENTS_REPORT.md`. Sono state conservate. L’inventario qui sotto distingue esclusivamente i file di **questa fase grafica**: 7 modificati, 23 creati, nessuno eliminato.

## Perché prima il risultato era debole

Il precedente runtime aggiungeva tre simboli molto piccoli nell’hero, un ornamento di 22 px sui titoli e una cornice animata alta appena 5 px. Il fondale restava sostanzialmente quello normale; non esistevano scene illustrate, profondità o componenti con una lavorazione riconoscibile. Halloween aveva inoltre una base prevalentemente viola.

Ora il sistema di calendario, autorizzazione e pubblicazione resta lo stesso. La nuova presentazione vive in `js/events-scenes.js`, con palette, paesaggi, figure, composizione e anteprime comuni. Non esiste un secondo stato del tema, client backend o sistema di persistenza.

## Direzione artistica

| Evento | Ambientazione | Movimento e componenti |
| --- | --- | --- |
| Halloween | Cielo arancio, zucche grandi illuminate, alberi, ragnatele, luna, castello e villaggio su più piani | Pipistrelli, fantasma illustrato trasparente, bagliori; bordi asimmetrici e pulsanti crema |
| Natale | Villaggio alpino innevato, abeti, lucine, ghirlande, regali e finestre calde | Nevicata leggera; dettagli rosso/verde/oro e bordatura festiva |
| Epifania / Befana | Tetti italiani, cielo stellato, luna, calze e lanterne | Befana illustrata con scopa e sciarpa, passaggio occasionale; oro e indaco |
| Pasqua | Giardino primaverile, fiori, prati, uova dipinte e conigli | Petali e farfalle; superfici chiare, verdi e angoli morbidi |
| Capodanno | Città sul fiume, ponte, blu notte, oro e argento | Scintille e fuochi occasionali, cornici interne sottili |
| Carnevale | Venezia, maschere lavorate, drappi, piume e nastri | Coriandoli e figure sospese; accenti alternati oro/teal/magenta |
| San Valentino | Giardino di rose, arco fiorito, cuori di velluto e luci calde | Petali e cuori fluttuanti; rosso rosato e superfici morbide |
| Ferragosto | Costa mediterranea, mare turchese, palme, ombrelloni e conchiglie | Riflessi e movimento leggero; dettagli marini e bordi doppi |

I fondali principali sono illustrazioni originali generate con lo strumento immagini integrato, non emoji o icone di libreria ingrandite. I prompt esatti sono in `assets/events/ARTWORK.json`. Fantasma e Befana sono asset separati con trasparenza reale, verificata e conservata in WebP. Gli SVG originali restano solo per dettagli secondari leggeri. Non sono stati scaricati asset stock né aggiunte librerie runtime.

### Home

- Header, logo, hero, pulsanti, card, menu, impostazioni e footer coerenti con l’edizione.
- Paesaggio ampio nell’hero e fondale atmosferico dietro il catalogo.
- Due fasce illustrate distribuite nel catalogo, con ritagli diversi del paesaggio.
- Le fasce sono pseudo-elementi CSS della griglia: non diventano card e non possono essere spostate dal riordino dei giochi già esistente. Nessuna modifica a `js/app.js` in questa fase.
- Su mobile il testo resta su una superficie leggibile e il paesaggio si compone nella parte inferiore, mantenendo gli elementi principali. Nessuna decorazione intercetta clic o touch.
- A fine evento vengono rimossi elementi, attributi e variabili della scena. Il confronto automatico conferma il ripristino dei colori/sfondi normali e dei collegamenti originali.

### Giochi

Adattati token, superfici, pulsanti, input, intestazioni, HUD e contenitori di pausa/risultato delle UI condivise e personalizzate. Il menu Racing mostra l’ambiente illustrato; il garage conserva la visualizzazione delle auto. Il fondale delle altre pagine è volutamente molto attenuato. Nei giochi non viene mostrato lo strato atmosferico animato della Home.

Polizia e Ladri mantiene la sua interfaccia notturna anche con preferenza chiara, per non mettere le etichette bianche su fondi chiari. Le etichette UI prima hardcoded in viola seguono l’accento stagionale. I colori funzionali di Reaction Time, carte UNO, X/O, pezzi, personaggi, canvas, torce, mappe e piste non sono riscritti dal nuovo modulo.

Le regole stilistiche coprono anche contenitori nascosti di pausa, vittoria, sconfitta, lobby e impostazioni; non è stata giocata ogni combinazione di schermata finale/multiplayer. La tabella test si riferisce ai casi realmente aperti e controllati, non a una certificazione di tutte le partite possibili.

### Admin

Ogni evento ha una miniatura con il **fondale effettivo**, un campione di card/pulsante e la descrizione degli effetti previsti. Queste miniature sono statiche; i pulsanti di anteprima privata mostrano l’esperienza completa con animazioni e la preferenza chiaro/scuro corrente. Restano gli otto editor, le quattro modalità, date personalizzate, priorità e salvataggio protetto.

## Prestazioni e responsive

- Fondali desktop 1536×1024: 265.928–399.554 byte per scena.
- Fondali mobile 900×600: 95.938–143.092 byte per scena.
- Fantasma 15.650 byte; Befana 54.640 byte, entrambi con alpha.
- Totale dei 18 WebP nel repository: **3.593.964 byte**, non scaricati tutti da ogni visitatore. Le pagine pubbliche richiedono l’illustrazione del solo tema attivo; l’Admin carica progressivamente le miniature.
- CSS seleziona la risoluzione mobile; nessuna libreria pesante, video o ciclo JavaScript aggiunto per fotogramma.
- Al massimo 12 particelle e un elemento di passaggio. Su risparmio dati/dispositivi deboli gli effetti si riducono; su telefono vengono inoltre nascosti dettagli secondari.
- `prefers-reduced-motion`, effetti locali disattivati e qualità off fermano il movimento senza cancellare il fondale statico.
- I controlli Admin statiche/particelle/animazioni restano separati.
- Breakpoint della griglia Home riutilizzati: 950 e 700 px. Composizione della scena mobile a 767 px; nessuna proliferazione di breakpoint.

## Test eseguiti

Ambiente: Chromium headless con WebGL software, browser reale automatizzato e fixture backend dichiarata. Le fixture non sono Supabase di produzione e non pubblicano eventi.

| Controllo | Esito | Evidenza |
| --- | --- | --- |
| Halloween verificato prima degli altri sette eventi | PASS | Home, Admin e Racing; artefatti iniziali `cuginiparty-scenes-MiGouG` |
| Otto scene Home, 11 formati, chiaro/scuro | PASS | 176 combinazioni, `cuginiparty-scenes-VuM8qs/results.json` |
| Tutti gli eventi sulle 26 pagine, mobile/desktop | PASS | 832 combinazioni; riesecuzione finale `cuginiparty-events-vlMnjL/results.json`, nessun errore o file mancante |
| Layout normale 26 pagine × 11 formati × 2 temi | PASS | 572 combinazioni, `cuginiparty-layout-h1wAjC/audit.json`, nessuno sforamento/errore/404 |
| Identificatori eventi e palette | PASS | 8 ID invariati; 32 coppie testo/superficie e pulsante primario ≥4,5:1; minimo primario 6,29:1 |
| Riduzione movimento, qualità, controlli effetti e ripristino normale | PASS | Test dedicato Halloween finale `cuginiparty-scenes-50kuDb/results.json` |
| Riordino catalogo | PASS | Eseguita la funzione esistente; nessun elemento non-gioco fra i figli DOM della griglia, link e ordine invariati |
| Anteprime Admin | PASS | Otto fondali decodificati, campioni UI, editor accessibili desktop/mobile |
| Racing: menu otto temi, garage, avvio gara e pausa | PASS | Avvio reale con tempo browser controllato; nessuna intercettazione dei controlli da decorazioni |
| Calendario, DST, precedenze, fine evento | PASS | `tests/events.test.cjs`; nessuna modifica a `js/events-calendar.js` |
| Racing: logica/archivio/catalogo | PASS | 15 gare AI complete, 90 arrivi, 61 gate per auto, nessun reset; test catalogo e storage |
| Indovina Chi: DOM, roster, catalogo e privacy statici | PASS | `tests/guess-who-static.test.cjs` |
| Audit finale colori UI dei 23 giochi | PASS | 736 combinazioni; `cuginiparty-ui-xMJ5P8/audit.json`, zero casi gravi rilevati, zero errori e file mancanti |
| Sintassi dei sette JS/CJS modificati/creati | PASS | Controllo sintassi eseguito |
| Safari/iOS/Android fisici e GPU reale | NON TESTATO | Nessuna dichiarazione di 60 FPS o certificazione su telefoni fisici |
| Pubblicazione con account Admin reale | NON TESTATO | Non richiesta; nessun evento attivato e nessuna scrittura backend |

Dimensioni: 320×568, 375×667, 390×844, 430×932, 667×375, 844×390, 932×430, 768×1024, 1024×768, 1366×768 e 1920×1080.

La diagnostica dei colori calcolati cerca casi gravi sotto 2,7:1 nei testi UI visibili, a transizioni terminate. Non equivale a una certificazione WCAG di immagini, gradienti, stati nascosti o grafica di gioco. Le palette comuni sono controllate separatamente a 4,5:1. I primi audit hanno individuato etichette hardcoded e l’interferenza sul fondo Heist, corretti prima della verifica conclusiva.

Gli artefatti sono nelle cartelle `C:/Users/EUR/AppData/Local/Temp/` con i nomi riportati nella tabella. Non sono dipendenze del sito. La verifica aggiunta del menu mobile Impostazioni e del selettore effetti è inclusa nella prova Halloween finale `cuginiparty-scenes-50kuDb`.

### Copertura dei giochi

PASS si riferisce alle UI iniziali realmente aperte con otto eventi, tema chiaro/scuro e viewport 375×667 e 1366×768, comprese diagnostica colori e assenza di overflow. Non indica che siano state giocate tutte le modalità o tutti i risultati multiplayer.

| Gioco | Temi UI | Mobile |
| --- | --- | --- |
| Tris | PASS | PASS |
| UNO | PASS | PASS |
| Racing 3D | PASS | PASS |
| Memory | PASS | PASS |
| Prepara la Pizza | PASS | PASS |
| Scoppia i Palloncini | PASS | PASS |
| Acquario Magico | PASS | PASS |
| Undercover | PASS | PASS |
| Block Blast | PASS | PASS |
| Tetris | PASS | PASS |
| Wordle | PASS | PASS |
| Reaction Time | PASS | PASS |
| Color Match | PASS | PASS |
| Impiccato | PASS | PASS |
| Snake | PASS | PASS |
| Sliding Puzzle | PASS | PASS |
| Number Merge | PASS | PASS |
| Water Sort | PASS | PASS |
| Darts | PASS | PASS |
| Cube Rush | PASS | PASS |
| Polizia e Ladri | PASS | PASS |
| Indovina Chi | PASS | PASS |
| Gatto e Topo | PASS | PASS |

Nel repository attuale non è presente una seconda pagina Racing 2D: l’entrypoint canonico `games/racing.html` contiene Racing 3D. È stato testato quello reale, senza inventare un gioco mancante.

## File modificati in questa fase: 7

| File | Motivo |
| --- | --- |
| `admin/events-admin.js` | Sostituzione dei piccoli swatch con vere anteprime illustrate, senza cambiare form, autenticazione o salvataggio |
| `css/events.css` | Composizione delle otto edizioni, componenti, UI giochi, responsive, contrasto ed effetti |
| `js/events-runtime.js` | Collegamento del nuovo livello visivo al calendario esistente, palette della scena e pulizia al ripristino |
| `tests/events-browser.test.cjs` | Verifica del nuovo strato di particelle al posto della vecchia cornice |
| `tests/platform-test-server.cjs` | MIME corretto per WebP nel server di test |
| `EVENTS.md` | Documentazione della nuova presentazione e delle prove |
| `EVENTS_REPORT.md` | Nota che distingue il precedente report infrastrutturale da questa nuova fase grafica |

## File creati in questa fase: 23

| File | Scopo |
| --- | --- |
| `js/events-scenes.js` | Palette, composizione delle scene, figure e miniature condivise |
| `tests/events-scenes.test.cjs` | Test dedicati a scene, motion, ripristino, catalogo, impostazioni, Admin e Racing |
| `tests/events-ui-audit.cjs` | Audit di tutte le UI iniziali dei giochi e screenshot; modalità rigorosa con `CONTRAST_STRICT=1` |
| `assets/events/ARTWORK.json` | Provenienza, prompt esatti, dimensioni e nomi di tutti gli asset |
| `assets/events/halloween-wide.webp` | Fondale Halloween desktop |
| `assets/events/halloween-mobile.webp` | Fondale Halloween mobile |
| `assets/events/christmas-wide.webp` | Fondale Natale desktop |
| `assets/events/christmas-mobile.webp` | Fondale Natale mobile |
| `assets/events/epiphany-wide.webp` | Fondale Befana desktop |
| `assets/events/epiphany-mobile.webp` | Fondale Befana mobile |
| `assets/events/easter-wide.webp` | Fondale Pasqua desktop |
| `assets/events/easter-mobile.webp` | Fondale Pasqua mobile |
| `assets/events/newyear-wide.webp` | Fondale Capodanno desktop |
| `assets/events/newyear-mobile.webp` | Fondale Capodanno mobile |
| `assets/events/carnival-wide.webp` | Fondale Carnevale desktop |
| `assets/events/carnival-mobile.webp` | Fondale Carnevale mobile |
| `assets/events/valentine-wide.webp` | Fondale San Valentino desktop |
| `assets/events/valentine-mobile.webp` | Fondale San Valentino mobile |
| `assets/events/summer-wide.webp` | Fondale Ferragosto desktop |
| `assets/events/summer-mobile.webp` | Fondale Ferragosto mobile |
| `assets/events/ghost.webp` | Fantasma illustrato trasparente |
| `assets/events/befana.webp` | Befana illustrata trasparente |
| `EVENTS_VISUAL_REPORT.md` | Questo report |

## File eliminati

NESSUNO.

## Limiti e prova locale

Non sono stati modificati in questa fase motore fisico, mappe, piste, dati auto, punteggi, salvataggi, logica Admin, multiplayer o schema/configurazioni Supabase. Le icone originali dei giochi sono invariate. Nessuna riscrittura di Home o giochi e nessun `!important` nel CSS degli eventi.

Non sono state giocate tutte le sessioni multiplayer né aperti tramite gameplay tutti i risultati/modal di ogni minigioco. Non sono stati usati telefoni fisici, Safari o Firefox. Le miniature Admin non simulano da sole il movimento: usare l’anteprima privata completa.

Per vedere il risultato senza pubblicarlo: **Admin → Temi ed Eventi → Anteprima Home** del tema desiderato. Dalla stessa scheda si può navigare nei giochi; **Termina** ripristina l’aspetto pubblico. Non è necessario applicare altro SQL per questa trasformazione grafica.
