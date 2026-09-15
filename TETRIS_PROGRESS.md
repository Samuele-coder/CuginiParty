# CuginiParty — Tetris progress

## Scope

Implementazione del nuovo gioco Tetris nella copia ricevuta con `giochi (3).zip`.
Sono stati toccati solo Tetris e la relativa scheda nella home. Block Blast, gli altri giochi, Supabase e lo schema dati non sono stati modificati.

## Stato

- [x] Analisi della struttura esistente, dei riferimenti globali e di un gioco già presente.
- [x] Pagina `games/tetris.html` con layout desktop/mobile, HUD, hold, prossimi pezzi, overlay pausa/game over e controlli touch.
- [x] Stile isolato in `css/tetris.css`, con dark mode e responsive senza overflow orizzontale intenzionale.
- [x] Motore in `js/tetris.js`: griglia 10×20 con righe nascoste, 7-bag, coda di 5 pezzi, sette tetramini, collisioni, SRS/wall-kick, gravità, lock delay, ghost, soft drop, hard drop e hold.
- [x] Punteggio centralizzato per righe, T-spin, combo, back-to-back, perfect clear, livelli e record locale.
- [x] Attivazione della scheda Tetris in `index.html` preservando l’icona esistente.
- [x] Controlli tastiera, controlli touch con ripetizione per spostamento/discesa, pausa su `P`/`Escape` e pausa automatica quando la pagina viene nascosta.

## Verifiche

- `node --check js/tetris.js` — superato.
- `node --check js/app.js` — superato.
- Self-check all’avvio — superato: 7-bag, quattro celle per pezzo, rotazione completa e collisione laterale.
- Verifica browser locale — superata: caricamento, rendering canvas, 5 anteprime, hard drop, movimento, rotazione, hold, pausa/ripresa e assenza di errori runtime. È rimasto solo il warning atteso di `app.js` sull’assenza del client Supabase nella pagina statica.

## Note / limitazioni

- Il salvataggio persistente richiesto riguarda il record tramite `localStorage` con chiave `cuginiparty_tetris_highscore`; la partita in corso non viene ripristinata dopo un refresh.
- Il test manuale mobile dipende dal viewport disponibile nel browser di verifica; il layout è comunque definito con breakpoint dedicati e controlli touch nativi.
- Non sono state eseguite operazioni Git, commit, push o pubblicazione.
