# Block Blast — registro tecnico

## Obiettivo

Integrare in CuginiParty un Block Blast 8×8 completo, responsive, accessibile, salvabile e utilizzabile con mouse, touch e penna.

## Architettura

- HTML semantico nella pagina gioco.
- CSS dedicato, compatibile con il tema globale `body.dark-mode`.
- JavaScript vanilla con stato centrale; DOM separato dalla logica.
- Board DOM 8×8 e Pointer Events per il trascinamento.
- `localStorage` per partita e record.

## File interessati

- `games/block-blast.html`
- `css/block-blast.css`
- `js/block-blast.js`
- `index.html`
- `BLOCK_BLAST_PROGRESS.md`

## Stato fasi

- [x] Fase 1 — analisi home, pagine gioco, navigazione, responsive e dark mode
- [x] Fase 2 — definizione dei file e dell’architettura
- [~] Fase 3 — creazione pagina, stile e logica di gioco
- [ ] Fase 4 — attivazione card nella home
- [ ] Fase 5 — verifica necessità modifiche a `style.css`
- [ ] Fase 6 — controlli statici e test della logica
- [ ] Fase 7 — correzione bug emersi
- [ ] Fase 8 — verifica responsive/mobile
- [ ] Fase 9 — verifica salvataggio e game over
- [ ] Fase 10 — riepilogo finale

## Decisioni tecniche

- Riutilizzare l’icona Block Blast già presente in `style.css`.
- Non usare canvas o librerie esterne.
- Usare coordinate relative normalizzate per tutte le forme.
- Usare una copia logica della board per preview, piazzamento, clear e game over.
- Posizionare il pezzo trascinato sopra il dito con offset adattivo.

## Funzioni principali

- [ ] In attesa dell’implementazione della fase 3.

## Problemi noti

- [ ] Nessuno rilevato in questa fase.

## Test eseguiti

- [x] Card anteprima esistente individuata.
- [x] Icona personalizzata esistente individuata.
- [x] Convenzioni di navigazione e tema verificate.

## Test mancanti

- [ ] Tutti i test di gameplay, persistenza, pointer e responsive.

## Prossimo task preciso

Creare i tre file dedicati con board, pezzi, drag, punteggio, salvataggio e game over.
