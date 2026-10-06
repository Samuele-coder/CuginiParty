# RACING 3D — REPORT FINALE

Data: 1 ottobre 2026. Progetto: `C:/Users/EUR/Documents/giochi`.

Racing 3D V1 sostituisce Racing 2D su `games/racing.html`. Un solo motore, una sola card, `game_id = racing`, posizione storica #3. Sono stati evoluti motore, pista, vista e controllore del prototipo esistente; nessun framework nuovo. Nessun commit, push o deploy.

PASS significa verifica effettivamente eseguita nell'ambiente indicato, non certificazione su ogni dispositivo. Le prove browser sono Chromium con WebGL 2 software SwiftShader; le dimensioni mobile/tablet sono emulate. Le limitazioni hardware sono esplicite in fondo.

## FILE CREATI

Le rinomine DEV → definitivo sono elencate come creazione/eliminazione per rendere completo il confronto dei percorsi.

| File | Motivo preciso |
| --- | --- |
| `RACING_3D.md` | Documentazione definitiva di architettura, assi, controlli, IA, persistenza, modello visuale sostituibile e verifiche. |
| `RACING_3D_REPORT.md` | Questo report, inventario completo, evidenze e limiti dei test. |
| `css/racing-3d.css` | CSS definitivo derivato dal DEV: garage, selezioni, HUD/minimappa, risultati, touch, orientamento e token del tema esistente. |
| `js/racing-3d.js` | Controllore definitivo derivato dal DEV: navigazione, input, countdown, pausa, record, risultati, qualità, orientamento e ripristino WebGL. |
| `js/racing-3d-data.js` | Configurazioni condivise di cinque piste, sei auto, tre difficoltà, quattro qualità e superfici. |
| `js/racing-3d-models.js` | Sei silhouette low-poly originali, componenti/ruote nominati, materiali/geometrie riutilizzati e adapter visuale indipendente dalla fisica. |
| `js/racing-3d-environment.js` | Ambiente data-driven, terreno, tre alberi e due pini, props instanziati, skyline, canyon, neve, tunnel e ponti. |
| `js/racing-3d-storage.js` | Preferenze/record validati e versionati; gestione di dati corrotti e quota storage senza bloccare il gioco. |
| `js/racing-3d-audio.js` | Sintesi WebAudio locale di motore, countdown, urto e arrivo; riusa il setting audio CuginiParty. |
| `tests/racing-3d-catalog.test.cjs` | Test dei normalizzatori reali Home/Admin, card/ID/ordine, personalizzazioni, flag, batch vuoto, DOM e percorsi. |
| `tests/racing-3d-visual.test.cjs` | Prove WebGL/screenshot senza clock virtuale, cinque ambientazioni e perdita/ripristino del contesto. |

## FILE MODIFICATI

| File | Motivo preciso |
| --- | --- |
| `index.html` | Aggiornata esclusivamente la card Racing storica: titolo/descrizione, PNG Racing già presente, rimosso il duplicato DEV. Altre card e ordine relativo invariati. |
| `js/app.js` | Metadati Racing definitivi; eliminata voce DEV; conversione solo dei testi legacy di Racing, senza sovrascrivere testi personalizzati o flag. |
| `admin/admin.js` | Nome/descrizione Racing nei metadati Admin e normalizzazione del solo default legacy. ID, percorso, controllo disponibilità e batch restano quelli esistenti. |
| `css/style.css` | Rimossi soltanto selettori dell'icona/tag della card DEV eliminata. Nessun nuovo tema globale né cambiamento agli altri giochi. |
| `games/racing.html` | Pagina canonica definitiva al posto della pagina 2D: modalità, pista, garage, difficoltà, impostazioni, gara, pausa e risultati. |
| `js/racing-3d-engine.js` | Evoluzione del motore esistente: sterzo coerente/progressivo, superfici, collider, IA, recupero, gate ordinati, progressi, classifica e tempi. |
| `js/racing-3d-track.js` | Evoluzione del sistema pista: spline XYZ, lunghezza uniforme, quota, indice spaziale, racing line, gate e geometria condivisi per cinque configurazioni. |
| `js/racing-3d-view.js` | Evoluzione della vista: modelli/ambienti condivisi, garage responsive, camera smorzata, qualità, pooling, rilascio risorse e diagnostica. |
| `tests/racing-3d-engine.test.cjs` | Ampliata la suite originale a 15 gare complete e regressioni di guida, collisioni, IA, gate e storage. |
| `tests/racing-3d-browser.test.cjs` | Ampliata la suite originale a flussi completi, sette viewport nei due temi, multitouch reale CDP, gare e stabilità delle risorse. |

## FILE ELIMINATI

| File | Motivo |
| --- | --- |
| `RACING_3D_DEV.md` | Sostituito dalla documentazione definitiva. |
| `RACING_3D_DEV_REPORT.md` | Sostituito dal report definitivo; la separazione dal catalogo descritta nel vecchio report non è più attuale. |
| `css/racing-3d-dev.css` | Evoluto e trasferito in `css/racing-3d.css`. |
| `js/racing-3d-dev.js` | Evoluto e trasferito nel controllore canonico `js/racing-3d.js`. |
| `games/racing-3d-dev.html` | Pagina prototipo duplicata, sostituita da `games/racing.html`. |
| `js/racing.js` | Motore 2D non più referenziato dopo la migrazione verificata. |
| `css/racing.css` | Stili del 2D non più referenziati dopo la migrazione verificata. |

Solo i file Racing sostituiti sono stati rimossi. Copie recuperabili dei sorgenti iniziali e dei file eliminati: `C:/Users/EUR/AppData/Local/Temp/cuginiparty-racing-v1-backup-0204e4fe2a6142ab91abc35b38821ce2`.

## ASSET

| Tipo | Effettivamente aggiunto |
| --- | --- |
| Modelli | Sei auto procedurali originali STREET/GT/RALLY/MUSCLE/FORMULA/HYPER; alberi TREE_01/02/03 e PINE_01/02, rocce, cactus, cespugli, tribune, paddock, edifici, lampioni, chalet, portali, ponti e tunnel generati nel codice. Nessun file GLB. |
| Texture | NESSUNA. Colori, materiali, cielo sfumato e superfici procedurali locali. |
| Audio | NESSUN file audio. Sintesi WebAudio originale, attivata da gesto utente, regolata dal setting già esistente. |
| Preview | Nessun asset statico nuovo: anteprima garage 3D rotante e miniature/minimappa SVG derivate dalle piste. Gli screenshot di test sono esterni al progetto. |
| Icona | Riutilizzata `assets/racing-2d-icon.png`, contenuto invariato. |
| Libreria | Three.js e relativa licenza locali già presenti, non sostituiti. Nessun CDN o dipendenza runtime aggiunta. |

## MAPPE

| Mappa | Stato | Evidenze |
| --- | --- | --- |
| Grand Circuit | PASS | Layout completo, tribune/paddock, quota leggera, griglia, gate, 3 difficoltà e gara browser completa; screenshot WebGL. |
| Canyon Run | PASS | Layout proprio, sabbia, rocce/cactus, ponte sul dislivello e tunnel; gare complete e screenshot. |
| City Night | PASS | Layout proprio, edifici/finestre emissive, lampioni, ponte e tunnel; gare complete e screenshot. |
| Alpine/Snow | PASS | Layout proprio, maggior dislivello, neve/pini/chalet/tunnel; gare complete e screenshot. |
| Neon Speedway | PASS | Layout più veloce, portali/barriere emissive, skyline, ponte/tunnel; gare complete e screenshot. |

Le cinque configurazioni condividono spline, strada, gate, racing line e minimappa; non cinque motori separati. Terreno e placement tengono conto della distanza dalla carreggiata. Sono presenti banchine percorribili prima delle barriere visibili: uscire dall'asfalto costa tempo, non attiva un muro sul bordo della strada.

## GUIDA

| Controllo | Stato | Verifica |
| --- | --- | --- |
| Sterzo direzione corretta | PASS | Motore nei due sensi a 4/18/40 m/s; A/D reali nel browser; touch sinistra/destra con gas in tre fasce di velocità. Proiezione della camera verificata. |
| Sterzo progressivo | PASS | Target → smoothing esponenziale → angolo limitato → yaw; ritorno al centro dopo rilascio. |
| Sterzo alta velocità | PASS | Limite dipendente dalla velocità, nessuna rotazione istantanea; test a 40 m/s e touch sopra 30 m/s. |
| Accelerazione | PASS | Sei specifiche provate; countdown congela fisica/input fino alla partenza. |
| Frenata | PASS | Riduce velocità; tastiera e touch freno insieme allo sterzo verificati. |
| Retromarcia | PASS | Input freno/retro passa attraverso lo zero; prova motore per sei auto e input browser. |
| Grip | PASS | Aderenza laterale e drag per vettura/superficie; asfalto e banchine delle cinque mappe provati. |
| Drift | PASS | Deriva laterale limitata non nulla in curva; smorzamento verificato per tutte le auto. |
| Collisioni | PASS | Capsule auto-auto, perdita velocità, separazione; barriera ad alta velocità trattiene l'auto all'interno. Contatti nelle gare complete. |
| Recovery | PASS | Recupero manuale conserva il prossimo gate; IA fa prima retromarcia, senza reset nelle 15 gare normali. |

Causa dello sterzo invertito: forward locale +Z con chase camera dietro; il destro del pilota è -X, non +X. Convenzione unica: +Y alto, input positivo = destra del pilota, yaw negativo = destra. Fisica, ruote anteriori, camera, offset di corsia e minimappa seguono questa convenzione. Sterzo smorzato indipendente dai frame; fisica a passo fisso 1/60 s.

Auto distinte per velocità, accelerazione, grip, handling e silhouette; piccolo rollio/inclinazione visiva, leggera deriva e feedback d'urto. Collider separati dalla carrozzeria. Nessun marchio automobilistico reale.

## IA BOT

| Controllo | Stato | Evidenze |
| --- | --- | --- |
| Facile | PASS | Cinque gare intere con sei auto; ritmo più lento, frenate anticipate e traiettorie meno precise. |
| Normale | PASS | Cinque gare intere; tempi nettamente inferiori a Facile e sorpassi registrati. |
| Difficile | PASS | Cinque gare intere nel motore e cinque nel browser; frenata tardiva/curve più veloci, tutti arrivati. |
| Racing line | PASS | Linea precomputata vincolata alla carreggiata; gare attraverso tutti i gate, nessun salto. |
| Look-ahead | PASS | Obiettivo di sterzo/curvatura più avanti dipendente dalla velocità; completate sezioni tecniche e tornanti. |
| Braking | PASS | Curvatura e spazio di frenata determinano velocità obiettivo, non semplice velocità costante. |
| Sorpassi | PASS | 29 sorpassi conclusi conteggiati nelle 15 gare, oltre a tentativi non conclusi; test separato supera un avversario fermo senza reset. Non ogni singola gara contiene un sorpasso. |
| Traffic awareness | PASS | Controllo auto davanti/accanto, spazio di corsia, commit e cooldown; partenza con sei auto e traffico nelle gare. |
| Recovery | PASS | Manovra di retro mantenuta anche dopo la ripresa del movimento; fallback solo per blocco prolungato. Nessun recupero nelle gare ordinarie della suite. |
| Gara AI completa | PASS | 15 gare × 6 auto × 3 giri: 90 arrivi, 61 gate ordinati ciascuno, zero reset. |

Le difficoltà cambiano il modo di guidare, non soltanto la velocità massima:

- FACILE anticipa la frenata di 13 m, accetta meno accelerazione laterale (6,2), introduce piccoli errori più frequenti, lascia più spazio e si impegna meno nei sorpassi.
- NORMALE anticipa 7 m, percorre le curve con maggiore ritmo (8,5), segue la linea più precisamente, sorpassa e difende in modo moderato.
- DIFFICILE anticipa 3 m, affronta le curve più velocemente (10,5), commette errori rari, mantiene più a lungo la manovra di sorpasso e valuta spazio/traffico con minori margini.

Le personalità aggiungono variazioni di prudenza, precisione e aggressività. Bot e giocatore usano lo stesso motore e le stesse specifiche delle auto: niente boost, velocità gratuita o rubber banding.

Durante le prove sono stati corretti due problemi reali: collisioni contro il bordo che potevano spingere il muso fuori dalla barriera e stallo reciproco dei bot con input neutro. Il timer di blocco considera ora anche un bot che intende avanzare ma cede al traffico. Il peggior rapporto tra giro più lento e più veloce nelle gare finali è 1,40, non un giro perso in attesa.

### Risultati delle 15 gare complete

Tempi del primo/ultimo arrivo in secondi; ogni riga include sei auto, tre giri e zero reset. Il pilota di verifica guida STREET dalla sesta posizione attraverso input IA, non assegnazioni di coordinate o gate.

| Pista | Difficoltà | Primo / ultimo | Sorpassi conclusi | Stato |
| --- | --- | --- | --- | --- |
| Grand | Facile | 116,25 / 120,36 | 0 | PASS |
| Grand | Normale | 99,32 / 102,05 | 6 | PASS |
| Grand | Difficile | 89,73 / 102,52 | 2 | PASS |
| Canyon | Facile | 107,11 / 109,03 | 1 | PASS |
| Canyon | Normale | 92,26 / 93,67 | 2 | PASS |
| Canyon | Difficile | 84,15 / 85,30 | 2 | PASS |
| City | Facile | 127,36 / 131,62 | 1 | PASS |
| City | Normale | 109,73 / 111,75 | 1 | PASS |
| City | Difficile | 101,00 / 103,74 | 5 | PASS |
| Alpine | Facile | 118,39 / 120,81 | 1 | PASS |
| Alpine | Normale | 102,30 / 103,92 | 5 | PASS |
| Alpine | Difficile | 94,10 / 99,42 | 1 | PASS |
| Neon | Facile | 98,80 / 101,92 | 1 | PASS |
| Neon | Normale | 86,53 / 87,84 | 1 | PASS |
| Neon | Difficile | 79,66 / 85,14 | 0 | PASS |

## FUNZIONALITÀ

| Funzionalità | Stato | Verifica |
| --- | --- | --- |
| Garage | PASS | Anteprima rotante, sei selezioni, nome/descrizione/statistiche, inquadratura desktop/mobile. |
| 6 auto | PASS | Modelli renderizzati; ruote FL/FR/RL/RR, sei specifiche provate, scelta persistente. |
| 5 piste | PASS | Selezioni, cinque layout/ambienti, gare complete e immagini WebGL. |
| Race | PASS | Modalità → pista → auto → difficoltà → countdown → gara → risultati → rigioca/cambia pista/menu. |
| Time Trial | PASS | Gara completa da tastiera con sterzo modulato dal test attraverso i tasti reali; 3 giri, 61 gate, zero recuperi; un solo pilota, record distinti. |
| Checkpoint | PASS | Ordine, direzione e larghezza; passaggi contromano/tagli/gate fuori ordine rifiutati. |
| Giri | PASS | Tre giri completi, tempi giro e arrivo; niente incremento al semplice passaggio fuori sequenza. |
| Classifica | PASS | Avanzamento valido e tempi effettivi; aggiornata mentre gli altri piloti finiscono. |
| Minimappa | PASS | SVG derivato dalla stessa pista, indicatori delle auto e separazione dai controlli mobili. |
| Risultati | PASS | Tempi reali, record, classifica, replay, cambio pista e ritorno menu. |
| LocalStorage | PASS | Preferenze/record dopo reload, dati corrotti/invalidi e quota; nessuna chiave globale rinominata. |
| Pausa/orientamento | PASS | Freeze countdown/tempo/auto; portrait pausa automaticamente; landscape riprende solo se non era pausa manuale. |
| WebGL loss/restore | PASS | Contesto perso durante gara, stato congelato e grafica ricostruita, ripresa senza reload. |
| Console/caricamenti | PASS | Nessun errore JavaScript nei flussi; nessun errore HTTP locale nel caricamento canonico e ritorno Home dopo la pulizia. |

## DEVICE / RESPONSIVE / DARK MODE

| Verifica | Stato | Ambito |
| --- | --- | --- |
| Desktop | PASS | Chromium emulato: 1920×1080, 1366×768, 1024×768. |
| Tablet | PASS | Chromium emulato: 768×1024; orientamento e pausa verificati. |
| Mobile | PASS | Chromium emulato: 390×844, 844×390, 800×360. |
| Landscape | PASS | Gara, HUD, minimappa, touch visibili e dentro viewport. |
| Multitouch | PASS | Eventi touch reali CDP con due contatti, sterzo+gas e sterzo+freno, entrambi i sensi, cancellazione/rilascio; tre fasce 4,3 / 16,8 / 30,4 m/s. |
| Responsive | PASS | Tutte e sette le dimensioni in entrambi i temi, niente scroll orizzontale; touch ≥44 px e non sovrapposti a HUD/minimappa. |
| Tema chiaro/scuro | PASS | Sistema globale esistente, cambio live tra schede; menu, selezioni, garage, HUD, pausa e risultati. Il mondo 3D non cambia con il tema UI. |
| Contrasto testo | PASS | Misurato nel menu mobile: titolo 17,74:1 chiaro / 15,59:1 scuro; testo secondario 4,83:1 / 8,56:1; focus visibile del select. |
| Android/iOS reali | NON TESTATO | Nessun telefono/tablet fisico collegato; non si deduce compatibilità reale dall'emulazione. |
| Fullscreen su Safari/mobile reale | NON TESTATO | Pulsante con fallback disponibile, prove fisiche dei limiti del browser ancora necessarie. |
| Resa audio dagli altoparlanti | NON TESTATO | Sintesi implementata e setting riutilizzato, ma ascolto/volume su hardware reale non verificati. |

Screenshot nativi di cinque piste e menu/garage/impostazioni nei due temi: `C:/Users/EUR/AppData/Local/Temp/racing3d-visual-LN86rJ`.

## PERFORMANCE

Misurazioni reali della suite visuale senza clock virtuale: Chromium headless, WebGL 2 **software** SwiftShader, 844×390, qualità BASSA, DPR 1. Erano attive anche verifiche browser: questi numeri non misurano una GPU desktop o smartphone e non attestano il target 60 FPS.

| Pista | Draw calls/frame | Geometrie GPU | Triangoli/frame | Istanze | Texture GPU | FPS software osservati |
| --- | --- | --- | --- | --- | --- | --- |
| Grand | 101 | 44 | 60.004 | 1.837 | 0 | 11 |
| Canyon | 99 | 43 | 43.232 | 1.705 | 0 | 12 |
| City | 97 | 41 | 57.128 | 3.051 | 0 | 9 |
| Alpine | 102 | 44 | 45.184 | 1.863 | 0 | 11 |
| Neon | 97 | 41 | 42.200 | 1.807 | 0 | 12 |

| Verifica | Stato | Risultato |
| --- | --- | --- |
| Stabilità geometrie tra ricostruzioni | PASS | Cinque ritorni/ricostruzioni dell'anteprima: 8, 8, 8, 8, 8 geometrie GPU, non crescita progressiva. Scene gara poi liberate. |
| Texture esterne | PASS | Zero texture GPU in tutte le piste; nessun download di texture/modelli remoti. |
| Qualità | PASS | AUTO/BASSA/MEDIA/ALTA effettivamente selezionate; DPR/densità/particelle/distanza cambiano nella vista, non nel motore. |
| JavaScript heap quantitativo | NON TESTATO | API della memoria non disponibile nel browser di verifica (campi `null`); non si inventano MB né si certifica assenza assoluta di leak. |
| 60 FPS su hardware reale | NON TESTATO | Richiede misure su GPU e dispositivi fisici. SwiftShader a 9–12 FPS non soddisfa quel target e non è una misura hardware. |

Ottimizzazioni applicate: instancing di props/vegetazione/cordoli/finish, geometrie/materiali condivisi, carrozzerie statiche unite per materiale, due sole luci, nessun post-processing pesante, ombre economiche sotto auto, particelle a pool, indice spaziale pista, racing line precomputata, buffer di movimento per auto riutilizzati, rilascio risorse a cambio scena/chiusura.

## SUPABASE

**Supabase: NON MODIFICATO.** Nessun record scritto, schema cambiato, client aggiunto, RLS modificata o chiave sostituita.

Verificata in lettura la Home reale: 23 giochi, record Racing con `game_id = racing`, percorso `games/racing.html`, nome legacy nel database convertito solo in visualizzazione. `visible`, `enabled`, `status`, ordine, badge/scadenza, programmazione e auto-release mantenuti. Nessun record Racing DEV duplicato necessario.

I normalizzatori reali Home/Admin sono stati eseguiti in isolamento con default legacy, testi custom, categorie custom, nascosto/disabilitato, manutenzione, coming soon, date future e batch con campi vuoti. Le funzionalità di autenticazione/scrittura Admin non sono state cambiate, ma non sono state provate con una sessione Admin autenticata.

## MIGRAZIONE

| Controllo | Stato | Evidenze |
| --- | --- | --- |
| Racing 2D sostituito | PASS | Pagina canonica serve il 3D; vecchi JS/CSS senza referenze runtime rimossi dopo i test. |
| Racing 3D presente una sola volta | PASS | Unica card `racing`; card e metadati DEV eliminati; Home reale controllata. |
| Game ID stabile | PASS | `racing` in Home, Admin e normalizzatori; nessun nuovo record. |
| Ordine #3 | PASS | Dopo Tris e UNO; altre card conservano ordine relativo. |
| Home | PASS | Catalogo reale, titolo/descrizione/link/icon, apertura gioco e ritorno Home senza errori locali. |
| Admin: metadati e normalizzatori | PASS | Test dei sorgenti reali, flag/testi custom preservati, batch vuoto restituisce nessuna modifica. |
| Admin: sessione autenticata end-to-end | NON TESTATO | Nessuna sessione amministrativa utilizzata, nessuna scrittura effettuata. |

## DIFF COMPLETO E REGRESSIONI

Confronto SHA-256 con i 138 file presenti all'inizio della task: 11 creati, 10 modificati, 7 eliminati; 142 file finali. Nessun file aggiuntivo temporaneo nel progetto. Tutti gli altri file sono identici al baseline, comprese icone, altri giochi, Supabase, CSS Admin e tema globale già esistenti.

Controllati anche i diff di Home, Admin e stili globali: limitati ai metadati Racing e alla rimozione della card DEV. Sintassi verificata per 15 file JavaScript/test coinvolti; DOM con ID unici e binding/file referenziati esistenti. Non si dichiara un nuovo test di gameplay end-to-end per tutti gli altri giochi: la verifica di regressione qui è isolamento delle modifiche e identità dei loro file.

Patch completa rispetto alle copie iniziali: `C:/Users/EUR/AppData/Local/Temp/cuginiparty-racing-v1-backup-0204e4fe2a6142ab91abc35b38821ce2/RACING_3D_FINAL.diff`. Non essendoci un checkout `.git` nella directory, il confronto usa i sorgenti salvati prima degli interventi e non inventa uno stato Git pulito.

## EVIDENZE E RIPRODUZIONE

| Suite / verifica | Stato | Evidenza |
| --- | --- | --- |
| `tests/racing-3d-engine.test.cjs` | PASS | Ultima esecuzione conclusa: 15 gare complete, tutte le asserzioni di guida, collisioni, gate, IA e storage. |
| `tests/racing-3d-catalog.test.cjs` | PASS | Ultima esecuzione conclusa: catalogo, metadati, ID, batch, DOM e percorsi. |
| `tests/racing-3d-browser.test.cjs` | PASS | `C:/Users/EUR/AppData/Local/Temp/racing3d-v1-cgne2C/results.json`: viewport/temi, input, Time Trial e cinque gare complete browser, zero page errors. |
| `tests/racing-3d-visual.test.cjs` | PASS | `C:/Users/EUR/AppData/Local/Temp/racing3d-visual-LN86rJ/metrics.json` e screenshot, inclusa perdita/ripresa WebGL senza refresh. |
| Home reale dopo migrazione | PASS | `C:/Users/EUR/AppData/Local/Temp/racing-v1-home-final.png`; lettura catalogo reale, senza scritture DB. |
| Caricamento canonico dopo pulizia | PASS | Browser senza parametro debug, menu/garage/impostazioni, contrasto/focus e ritorno Home; nessun errore locale. |

Eseguire le suite con Node; browser/visual richiedono Playwright e Chromium nell'ambiente di test. La suite visuale usa il server locale `http://127.0.0.1:8770` (configurabile); le altre suite non richiedono deploy. Il debug è spento normalmente e abilitabile solo esplicitamente con `?debug=1`; `?debug=1&ai=1` è il pilota di verifica, non una seconda versione del gioco. Il test Time Trial invece aziona soltanto tastiera/touch di produzione.

## LIMITAZIONI

- Modelli e props procedurali low-poly, non GLB definitivi realizzati in Blender. Adapter e nomi delle ruote pronti; nessun loader GLB inutilizzato aggiunto e nessun import GLB effettivo testato.
- Fisica arcade su XZ con quota della strada: non simulazione completa di sospensioni, ribaltamenti o salti.
- Prestazioni a 60 FPS, feeling soggettivo di guida, compatibilità Safari/iOS/Android, fullscreen mobile e bilanciamento con giocatori umani richiedono prove su hardware reale. I risultati automatizzati non sostituiscono quelle prove.
- Sintesi audio implementata, ma ascolto e taratura del volume su altoparlanti reali non verificati.
- Test dei flag Admin effettuati sui normalizzatori reali; flusso autenticato e salvataggi Admin reali NON TESTATO. Nessuna modifica alle logiche di backend/auth.
- Stabilità risorse GPU verificata sulle ricostruzioni effettuate; misura quantitativa dell'heap JavaScript non disponibile, quindi non certificata.
- Nessun deploy eseguito: la migrazione è nel progetto locale e nella preview locale.

Nessun commit. Nessun push. Nessun deploy.
