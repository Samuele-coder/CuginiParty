# Racing 3D — CuginiParty V1

Pagina canonica: `games/racing.html`. Una sola voce nel catalogo, terza dopo Tris e UNO, identificativo storico `racing`. Il collegamento resta lo stesso; le vecchie impostazioni Admin continuano ad applicarsi. Nome/descrizione standard di Racing 2D sono aggiornati solo in visualizzazione; eventuali testi personalizzati sono conservati. Nessuna migrazione del database.

## Avvio e controlli

Servire il progetto via HTTP e aprire `/games/racing.html`. Nessun bundler, framework o installazione di dipendenze per giocare. Richiede WebGL 2. Three.js r180 è già incluso localmente in `js/vendor/three/`, con licenza MIT; non è stato aggiornato.

W / freccia su: acceleratore. S / freccia giù: freno, poi retromarcia. A/D o frecce: sterzo progressivo. R: recupero all'ultimo gate valido, senza avanzare i checkpoint. Esc: pausa. Su touch si possono tenere sterzo e pedale contemporaneamente. In verticale la gara si ferma: ruotare per riprendere oppure tornare al menu. Una pausa manuale non viene annullata dalla rotazione. Fullscreen facoltativo dalle impostazioni.

## Modalità e contenuti

Gara: tre giri, giocatore dalla sesta casella e cinque rivali. I bot continuano dopo l'arrivo del giocatore, fino alla classifica completa con tempi reali. Time Trial: solo il giocatore, tre giri, record separati per giro e totale di ciascuna pista.

Garage: STREET, GT, RALLY, MUSCLE, FORMULA, HYPER, tutte disponibili. Modelli originali procedurali, sagome, cabine e dettagli differenti; sei profili di velocità/accelerazione/controllo. Nessun negozio o moneta.

Piste chiuse distinte: GRAND CIRCUIT (tribune/pit/settore tecnico), CANYON RUN (rocce/cactus/ponte/galleria), CITY NIGHT (palazzi/finestre/lampioni), ALPINE SNOW (quote/pini/chalet/montagne), NEON SPEEDWAY (tracciato veloce/portali/barriere emissive). Control point XYZ e spline sono la fonte comune di strada, cordoli, bordi, 20 gate ordinati, traiettoria IA e minimappa. Non sono cinque varianti cromatiche della stessa curva. Ponti non sovrapposti; nessuna simulazione di salti.

## Architettura e convenzioni

| Modulo | Responsabilità |
| --- | --- |
| js/racing-3d.js | DOM, menu, input, passo fisso, orientamento, risultati, record, integrazione tema/audio esistenti. |
| js/racing-3d-engine.js | Fisica, collisioni, IA, gate, giri, ranking e recupero. |
| js/racing-3d-track.js | Campionamento, indice spaziale, traiettoria precomputata e mesh stradale. |
| js/racing-3d-data.js | Cinque piste, sei auto, tre difficoltà, quattro qualità, superfici. |
| js/racing-3d-models.js | Modelli scolpiti a sezioni, carrozzerie unite per materiale e ruote articolate. |
| js/racing-3d-environment.js | Props istanziati, terreno e ambientazioni. |
| js/racing-3d-view.js | Renderer, camera, anteprima garage, particelle, qualità e rilascio risorse. |
| js/racing-3d-storage.js | Validazione e persistenza locale; errori/corruzione non bloccano la gara. |
| js/racing-3d-audio.js | Suoni originali sintetizzati, avviati solo dopo interazione. |

Unità SI: metri, secondi, m/s; HUD in km/h. +Y alto, +Z avanti, -X destra del pilota. Heading usa la rotazione Three.js attorno a Y: input destra positivo produce yaw negativo. Il vettore destra è (-cos heading, sin heading) sul piano XZ. La camera dietro +Z proietta questa direzione verso destra dello schermo. Ruote anteriori ruotano di -steering. Motore, IA, modello e camera usano la stessa convenzione; niente correzioni separate per tastiera/touch.

Passo fisso 1/60 s. Sterzo smorzato, limite dipendente dalla velocità, grip laterale e deriva contenuta, freno prima della retro. Asfalto normale, erba/sabbia/sterrato più lenti, neve meno aderente. Rallentamento fuori pista progressivo. Collider indipendenti dai modelli: capsule auto/auto e margine interno delle barriere, più ostacoli collocati fuori dall'asfalto. Collisioni senza grandi rimbalzi. Gate attraversati in ordine e in direzione corretta; recupero senza giri regalati.

### IA

Traiettoria limitata entro la carreggiata e rilassata prima della gara, look-ahead variabile con velocità, previsione di curvatura/frenata, controllo dello stesso motore del giocatore. Profili personali diversi per ritmo, ingresso curva e aggressività. Sorpasso con scelta lato, verifica del traffico, impegno e cooldown; difesa moderata sui rettilinei, niente weaving. Frenata per non tamponare. Piccoli errori deterministici, nessun rubber-banding, boost o trazione illimitata.

| Difficoltà | Comportamento |
| --- | --- |
| FACILE | Frenata anticipata di 13 m, minore precisione/velocità in curva, più piccoli errori, prudenza e maggiore spazio nei sorpassi. |
| NORMALE | Anticipo 7 m, ritmo sostenuto, precisione buona, sorpassi e difesa moderati. |
| DIFFICILE | Anticipo 3 m, frenata più tardiva, precisione elevata, uscite veloci, errori rari e maggiore impegno nel sorpasso. |

Un bot fermo tenta una manovra di retro di 1,1 s, non un reset immediato. Recupero solo per blocco prolungato (>10 s fermo o >14 s senza progresso valido). Nelle 15 gare normali della suite tutti terminano senza reset. Un test separato verifica il sorpasso di un avversario fermo.

### Risorse, qualità e camera

AUTO / BASSA / MEDIA / ALTA modificano DPR, densità degli oggetti, distanza e particelle, mai fisica o IA. AUTO può ridurre il dettaglio dopo campionamento prolungato. Geometrie/materiali condivisi dentro la scena e rilasciati a ogni ricostruzione; particelle a pool. Solo HemisphereLight + DirectionalLight, cielo procedurale sfumato e fog; niente point light per ogni finestra, texture esterne, bloom o shadow map costose. Camera smorzata, look-ahead, piccolo FOV dinamico e protezione dal terreno/ostacoli/tunnel. Anteprima garage rotante con inquadratura separata responsive.

`RacingView.setCarVisual(id, adapter)` accetta `{root, wheelPivots, wheelRollers, dispose}`. Ruote ordinate/nominabili Wheel_FL, Wheel_FR, Wheel_RL, Wheel_RR. Il modello importato deve essere normalizzato agli assi e ai metri sopra; l'adapter deve liberare solo le risorse di sua proprietà. I collider non dipendono dalla mesh. Nessun GLB disponibile nel repository: non è stato inventato né aggiunto un loader non utilizzato.

## Persistenza, tema e backend

Unica nuova chiave di preferenze Racing: `CuginiParty_racing3d_v1`, versione 1. Contiene auto, ultima pista, difficoltà, qualità e record per pista. I record Time Trial sono separati da quelli generici di giro. Nessuna chiave precedente è rinominata/rimossa.

Tema: riusa `body.dark-mode`, `CuginiParty_dark_mode`, `applyTheme` e token condivisi. Aggiornamento live fra schede; la scena 3D non viene ricolorata dal tema. Audio: stessa chiave `CuginiParty_audio_enabled`. Sintesi locale di motore/countdown/urto/arrivo, senza file audio di provenienza incerta. La perdita del contesto WebGL ferma la gara, ricostruisce la grafica al ripristino e permette di riprendere senza reload.

Nessun nuovo client Supabase, schema, tabella, query Racing o multiplayer. Controlli globali del sito e autorità dei flag Admin preservati: visible, enabled, status, badge/scadenza, categoria, ordinamento, manutenzione, programmazione e auto-release. I campi vuoti del batch restano 'lascia invariato'.

## Test

`node tests/racing-3d-engine.test.cjs`: 15 gare complete (cinque piste × tre difficoltà), sterzo in entrambi i sensi a tre velocità, superfici, deriva, freno/retro, barriere ad alta velocità, auto/auto, anti-taglio, recupero, modelli e storage.

`node tests/racing-3d-catalog.test.cjs`: ID/ordine/card unica, conversione dei soli default legacy, preservazione personalizzazioni/flag, batch vuoto, DOM e percorsi.

Con Playwright + Chromium nell'ambiente di verifica: `node tests/racing-3d-browser.test.cjs`. Server loopback temporaneo, WebGL 2 software reale, flussi UI, sette viewport chiaro/scuro, multitouch CDP, gara Time Trial da soli tasti di produzione, cinque gare IA intere renderizzate, risultati/record/rigioca/cambio pista e risorse. Clock virtuale: i suoi FPS NON misurano prestazioni hardware.

`node tests/racing-3d-visual.test.cjs` usa invece il server HTTP locale sulla porta 8770 e nessun clock virtuale: immagini di piste/menu/garage/impostazioni, controllo WebGL loss/restore. Server e percorso configurabili con RACING_ORIGIN / RACING_URL. Screenshot e dati dei test vengono salvati in directory temporanee, non nel progetto.

Debug OFF normalmente. `?debug=1` mostra numeri diagnostici, linea centrale e una copia read-only dello stato. `?debug=1&ai=1` abilita il pilota IA di verifica. Nessun comando per assegnare posizioni o gate tramite il debug.

## Limiti dichiarati

Guida arcade su XZ con quota stradale, non una simulazione di sospensioni/ribaltamenti. Modelli/props procedurali low-poly, non asset GLB professionali. Safari/iOS/Android reali, resa degli altoparlanti e 60 FPS su hardware fisico richiedono prove dedicate. Non si dichiara compatibilità/performance reale da emulazione. Vedere RACING_3D_REPORT.md per evidenze, diff e risultati effettivi. Nessun commit, push o deploy.
