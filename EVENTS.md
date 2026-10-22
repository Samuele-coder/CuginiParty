# Temi ed Eventi — CuginiParty

## Attivazione nel progetto esistente

1. Sul progetto Supabase attuale la migrazione **è già applicata**, versione `20261018171104`, nome `cuginiparty_theme_events_v1`. Per una nuova installazione eseguire **solo `admin/events.sql`** dopo la configurazione Admin. Non occorre rieseguire la migrazione generale su un database già configurato.
2. Aprire `admin/index.html` e accedere con un account già autorizzato in `admin_users`.
3. Aprire **Temi ed Eventi**, espandere **Modifica evento**, scegliere modalità, date/ore e priorità. Salvare con **Salva per tutti**.

La migrazione è stata applicata tramite il collegamento Supabase al progetto verificato `pzjbxrcxlztwjxetnzkw` (CuginiParty). Le impostazioni esistenti e i due trigger originali sono rimasti invariati; verificati privilegi e rifiuto delle chiamate anonime. Su altre installazioni non migrate il salvataggio mostra un messaggio esplicito, senza ripiego meno protetto.

Il tema pubblico resta normale finché l’Admin non pubblica un evento. Nessuna festività è stata attivata di nascosto nel database reale.

## Calendario e conflitti

Sono disponibili Halloween, Natale, Epifania/Befana, Pasqua, Capodanno, Carnevale, San Valentino e Ferragosto, con varianti compatibili col tema chiaro/scuro esistente.

- **Disattivato:** evento escluso.
- **Manuale:** pubblicazione controllata dalla casella di attivazione.
- **Programmato:** intervallo data/ora, inizio incluso e fine esclusa.
- **Annuale:** periodo fisso anche a cavallo d’anno, oppure relativo alla Pasqua gregoriana o al martedì grasso (47 giorni prima di Pasqua, rito romano).

Le date relative sono configurabili con giorni prima/dopo l’evento. Non si assume un unico calendario di Carnevale per ogni tradizione locale. Il calendario delle ricorrenze mobili viene ricalcolato per l’anno effettivo, non copiato dal 2026.

Fuso: **Europe/Rome**, con conversione tramite `Intl.DateTimeFormat`, non offset fisso UTC+1. Gli orari inesistenti nel salto primaverile sono rifiutati. Nell’ora autunnale ripetuta si usa la prima occorrenza. Per le ricorrenze annuali è consigliato mantenere la mezzanotte; il salvataggio controlla anche gli anni successivi per intercettare collisioni con il cambio d’ora.

Prevale il numero di priorità più alto. A parità di priorità, l’ID alfabeticamente precedente: il criterio è esplicitato nell’editor. Non vengono sovrapposti due temi.

Il PC Admin non deve restare acceso: la configurazione è condivisa nel database e ogni visitatore risolve il calendario al caricamento e ai confini temporali, usando l’orologio server quando la migrazione è installata. Anche una pagina già aperta torna automaticamente al tema normale a fine evento, preservando la chiave e la preferenza `CuginiParty_dark_mode`.

## Persistenza e sicurezza

Unico dato aggiunto: `site_settings.value.theme_events`, versione 1. Nessuna nuova tabella, nessun secondo client Supabase, nessuna modifica allo schema multiplayer.

`admin/events.sql` aggiunge funzioni e un trigger limitati ai temi:

- `admin_save_theme_events`: verifica `public.is_admin()` lato database, valida otto eventi noti, conserva le altre chiavi JSON e i flag globali, rileva aggiornamenti concorrenti tramite `updated_at`.
- `guard_theme_events`: protegge anche l’UPDATE diretto del campo stagionale in presenza di eventuali vecchie policy permissive.
- `validate_theme_events`: controlla struttura, dimensione, ID, modalità, intervalli e valori ammessi.
- `theme_events_clock`: sola lettura pubblica dell’ora server, senza credenziali privilegiate.

L’editor usa soltanto la funzione protetta, non un UPDATE diretto di ripiego. Nessuna chiave `service_role`. Le impostazioni pubbliche contengono soltanto configurazione grafica e calendario. Le politiche Admin esistenti non vengono sostituite o allargate.

## Anteprima privata

I pulsanti di anteprima richiedono una sessione Admin verificata con `is_admin()` dal server. La bozza resta in **sessionStorage**, non viene salvata nelle impostazioni pubbliche e scade dopo due ore. La navigazione nella stessa scheda mantiene l’anteprima anche nei giochi; una scheda indipendente continua a vedere il tema pubblico.

**Anteprima Home** e **Anteprima Racing** navigano nella stessa scheda; da Home si può aprire qualsiasi altro gioco. **Termina** ripristina il tema pubblico. Le anteprime non modificano le partite degli altri utenti.

## Grafica ed effetti

### Palette ufficiale unica (aggiornamento 21 ottobre 2026)

Ogni festività usa ora un’unica palette di `officialPalette()` in `js/events-scenes.js`: pannelli scuri distinti dall’illustrazione, testo avorio, accenti luminosi e bordi leggibili. Anche l’Admin usa questa stessa edizione. La classe `dark-mode` è forzata soltanto come modalità effettiva mentre l’evento è attivo, per riutilizzare gli stili esistenti senza un secondo sistema tema.

`applyTheme()` conserva la scelta personale attraverso `effectiveDark()`. La chiave esistente `CuginiParty_dark_mode` non viene riscritta dal runtime stagionale: cambiare preferenza durante un evento non ne cambia i colori; al termine torna l’ultima scelta personale. Un avviso nelle impostazioni Home e in Temi ed Eventi chiarisce questo comportamento. Calendario, anteprima privata, salvataggio e autorizzazioni restano invariati.

Il runtime è condiviso attraverso `js/app.js`; l’Admin importa lo stesso modulo. `css/events.css` è caricato una sola volta per documento. Gli adattamenti dei token personalizzati di Tetris, Cube Rush, Indovina Chi e Undercover e i selettori HUD/dialog assicurano continuità anche fuori dalla Home.

Otto fondali illustrati originali trasformano realmente Home e menu: Halloween arancio, inverno natalizio, tetti della Befana, giardino pasquale, città di Capodanno, Carnevale veneziano, rose di San Valentino e costa estiva. Le immagini locali in `assets/events/` hanno versioni WebP 1536×1024 e 900×600. Fantasma e Befana hanno cutout trasparenti dedicati. `ARTWORK.json` conserva i prompt esatti e la provenienza; non sono usati asset remoti o librerie grafiche aggiuntive.

`js/events-scenes.js` gestisce solo la presentazione: fondale, elementi in primo piano, due separatori illustrati nel catalogo e dettagli del footer. L’Admin usa gli stessi fondali con campioni dei componenti e descrizioni degli effetti. Nei giochi cambiano interfacce, menu, pannelli e HUD; le animazioni atmosferiche sono riservate alla Home, senza intercettare input. Racing mostra il fondale nel menu ma mantiene libera l’anteprima del garage. Nessuna decorazione viene disegnata nei canvas o nel mondo 3D. Carte UNO, indicatori funzionali, torce, avversari e oggetti di gioco non vengono ricolorati.

Budget massimo dodici particelle DOM e un passaggio occasionale; meno con dispositivi deboli/risparmio dati. Nessun ciclo JavaScript per fotogramma: animazioni CSS su trasformazione/opacità. `prefers-reduced-motion` spegne le animazioni, conservando il paesaggio. Nelle impostazioni Home si può scegliere Automatici/Ridotti/Disattivati: è una preferenza locale per gli effetti, non il salvataggio del tema pubblico. I tre controlli Admin statiche/particelle/animazioni restano indipendenti.

## Test e limiti

- `node tests/events.test.cjs`: calendario, DST, precedenze e impronte/terreno delle cinque piste.
- `node tests/events-scenes.test.cjs`: otto scene, undici formati, chiaro/scuro, riduzione effetti, ripristino esatto del design normale, anteprime Admin e avvio/pausa Racing. `EVENT_SCENE_IDS=halloween` permette la verifica iniziale di Halloween.
- `node tests/events-ui-audit.cjs`: 23 giochi × otto eventi × due temi × mobile/desktop; diagnostica dei colori UI calcolati, overflow e screenshot. Non sostituisce una certificazione WCAG dei fondali/gradienti.
- `node tests/events-browser.test.cjs`: editor, anteprima, otto eventi nelle pagine, calendario live, motion e touch/viewport Polizia e Ladri. Supabase è sostituito da una fixture dichiarata, senza scritture reali.
- `node tests/platform-layout-audit.cjs`: 26 pagine, undici viewport, due temi di base. `AUDIT_STRICT=1` rende bloccanti gli sforamenti e gli errori.
- `node tests/events-database.test.cjs`: esecuzione reale del SQL su PostgreSQL/WASM isolato, con ruoli anon/non-Admin/Admin e policy legacy volutamente permissiva. Richiede **solo nell’ambiente di test** PGlite, o `PGLITE_MODULE` diretto al suo `dist/index.cjs`. Nessuna dipendenza runtime è aggiunta al sito. [API ufficiale](https://pglite.dev/docs/api).
- Restano disponibili le suite Racing e Indovina Chi già presenti.

Le prove Chromium e CDP touch non certificano Safari/iOS/Android fisici o 60 FPS su un telefono. SQL e ruoli sono stati provati nel precedente intervento, senza ulteriori modifiche al backend per la nuova grafica. Non è stato usato né impersonato un account Admin reale per pubblicare una festività. Il nuovo frontend è ancora locale: nessun commit, push o deploy. Vedere `EVENTS_VISUAL_REPORT.md` per l’intervento grafico attuale; `EVENTS_REPORT.md` conserva il report precedente.
