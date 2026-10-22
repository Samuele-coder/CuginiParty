# Wordle — restyling classico e tentativi liberi

## Ambito

Intervento limitato a Wordle e ai suoi test. Confronto SHA-256 con lo stato iniziale della richiesta: quattro file modificati, due creati, nessuno eliminato. Le modifiche preesistenti nel resto del repository sono state conservate; nessun altro gioco, stile globale, icona, client o schema Supabase è stato modificato in questa richiesta. Nessun commit, push o deploy.

## Risultato

- Qualsiasi sequenza A–Z della lunghezza richiesta viene accettata, anche quando si riprende una partita salvata. Il lessico italiano esistente serve soltanto a scegliere e validare le parole segrete.
- Conservate lunghezze 4/5/6/7/8, scelta casuale, varietà delle soluzioni, numero di tentativi e storico delle parole recenti.
- Algoritmo a due passaggi per le ripetizioni mantenuto: prima posizioni esatte, poi occorrenze residue.
- Colori funzionali fissi: verde `#6AAA64`, giallo `#C9B458`, grigio `#787C7E`. Lettere `#101010`: contrasto rispettivamente 6,84:1, 9,20:1 e 4,52:1. Hover e pressione non scuriscono i colori; i tasti bloccati non vengono sbiaditi dal CSS dark globale.
- Caselle quadrate, pop sulla sola lettera appena inserita, bordo più evidente e ritorno allo stato vuoto dopo Cancella.
- Flip 3D nativo con `rotateX`, prospettiva e backface nascosta, controllato tramite Web Animations API: 140 ms in uscita, colore applicato solo a 90°, 140 ms in entrata, pausa di 35 ms tra caselle. Sequenza da sinistra a destra, nessuna ricostruzione o rianimazione delle righe già completate.
- Riga incompleta: shake e “Non abbastanza lettere”, senza consumare tentativi.
- Vittoria: tutti i flip terminano prima di messaggio/statistiche e salto verde scaglionato; sconfitta: soluzione mostrata solo dopo l'ultimo flip.
- Tastiera a tre righe, Invio, Cancella SVG, feedback touch/fisico; priorità verde > giallo > grigio.
- Durante flip/salto sono bloccati tastiera, doppio invio, Nuova partita e selettori. Cambio pagina, visibilità e reduced-motion cancellano gli effetti pendenti e consolidano il tentativo già inviato.
- Stesse chiavi `cuginiparty_wordle_stats_v1` e `cuginiparty_wordle_round_v2`, stessi contatori e dati aggiuntivi esistenti preservati. Metadati facoltativi del round impediscono il doppio conteggio al reload, anche durante una rivelazione vincente; compatibilità con i vecchi round versione 2.

## File modificati

- `css/wordle.css`: restyling circoscritto, griglia e tastiera responsive, colori funzionali indipendenti dai temi, contrasto e focus.
- `games/wordle.html`: intestazione compatta, descrizioni aggiornate, suggerimento sui tentativi liberi, semantica della griglia e pulsante secondario.
- `js/wordle.js`: eliminazione del controllo lessicale sui tentativi, fasi e animazioni sincronizzate, tastiera SVG, ripristino e conteggio protetti.
- `tests/update-browser.test.cjs`: aggiornate soltanto le aspettative Wordle per i tentativi liberi e l'attesa delle nuove animazioni; controlli degli altri giochi invariati.

## File creati

- `tests/wordle-classic.test.cjs`: test browser dedicati al comportamento richiesto.
- `WORDLE_REPORT.md`: questo resoconto.

## File eliminati

NESSUNO.

## Test realmente eseguiti

Tutti i seguenti controlli sono passati. I test browser usano Chromium locale e una fixture isolata, senza scritture sul backend reale.

1. `tests/wordle-classic.test.cjs`: 13 gruppi di verifiche, comprendenti tentativi fuori dizionario, ripetizioni, pop, cancellazione, shake, input bloccati, sequenza e punto di cambio colore dei flip nativi, salto vincente, sconfitta, priorità verde e giallo della tastiera, statistiche, reload durante la vittoria e salvataggi precedenti.
2. Nella stessa suite: cambio live a reduced-motion, evento di uscita pagina, assenza di animazioni residue e di callback che colorino una nuova partita.
3. Nella stessa suite: 4–8 lettere × sei viewport (320×568, 360×800, 390×844, 844×390, 768×1024, 1366×768); caselle quadrate, altezza tasti almeno 44 px, nessuna casella/tasto fuori schermo e nessun overflow orizzontale.
4. Nella stessa suite: tema normale e tutti gli otto temi speciali, con entrambe le preferenze chiaro/scuro; palette funzionale esatta e contrasto delle lettere risultanti almeno 4,5:1. Touch emulato con veri eventi tap su lettere, Cancella SVG e Invio.
5. `tests/events-ui-audit.cjs` con `EVENT_UI_ROUTES=wordle` e `CONTRAST_STRICT=1`: 32 combinazioni (375×667/1366×768 × due preferenze × otto temi), zero problemi di contrasto segnalati dall'audit, zero overflow, errori JavaScript o risorse mancanti. È un controllo dei colori UI calcolati, non una certificazione WCAG completa.
6. `tests/update-browser.test.cjs`: passati Wordle (cinque lunghezze × cinque dimensioni, casuale, duplicati, salvataggi), regressioni già presenti di Water Sort, temi condivisi e controlli Heist. Nessuna modifica agli altri giochi.
7. `tests/minigames-expanded.test.cjs`: normalizzazione, unicità delle 1.185 parole esistenti, pool per lunghezza e duplicati; controllo ID univoci e percorsi HTML, oltre alle regressioni già presenti di Water Sort.
8. `node --check` su `js/wordle.js`, `tests/wordle-classic.test.cjs`, `tests/update-browser.test.cjs`; `git -c core.whitespace=cr-at-eol diff --check`: nessun errore. Git segnala soltanto avvisi sulla conversione LF/CRLF di file già presenti nella working tree.

Artefatti del test dedicato (screenshot normale desktop/mobile, Halloween mobile, risultati e tempi effettivi dei flip): `C:/Users/EUR/AppData/Local/Temp/cuginiparty-wordle-classic-JPsnLm/`.

Audit dei temi: `C:/Users/EUR/AppData/Local/Temp/cuginiparty-ui-fvEJzZ/`. Regressioni browser condivise: `C:/Users/EUR/AppData/Local/Temp/cuginiparty-update-dBJohq/`.

## Limiti e problemi residui

Nessun problema emerso nei test eseguiti. Dispositivi fisici, Safari/iOS e Firefox non testati: mobile e touch sono emulati in Chromium. Lo scorrimento verticale resta disponibile per griglie lunghe e schermate basse; nessun vincolo artificiale che tagli tastiera o statistiche. Il dizionario esistente non è stato ampliato o modificato in questa richiesta.
