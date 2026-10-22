# Racing Online — integrazione e limiti reali

## Aggiornamento pubblicazione — 22 ottobre 2026

Il Worker è stato pubblicato separatamente ed è già configurato in `js/racing-online-config.js`: `https://cuginiparty-racing.guessmeapp.workers.dev`. Verificato il preflight CORS dall'origine reale `https://cuginiparty.pages.dev` (HTTP 204 e origine esatta). La pubblicazione GitHub del sito non richiede e non esegue un nuovo deploy del Worker. Pages `cuginiparty` usa il branch di produzione `main` e la cartella pubblicata `.`.

Le sezioni successive descrivono lo stato e i collaudi del 21 ottobre, prima della pubblicazione separata del servizio: le indicazioni “endpoint vuoto” e “non pubblicato” sono storiche, non la configurazione attuale. Il test su dispositivi fisici/reti Internet differenti resta distinto dal collaudo locale e dal controllo CORS.

Stato al 21 ottobre 2026: implementato e collaudato **in locale** nel runtime Workers/workerd, anche con due browser isolati. **Non pubblicato, non configurato con un endpoint pubblico, non dichiarato completo su Internet.** Nessun servizio Cloudflare è stato creato; nessun deploy, commit o push. Le modalità offline restano nella pagina originale.

## Perché non riutilizzare il canale UNO

L’ispezione di sola lettura del progetto Supabase esistente ha trovato UNO, Undercover e Indovina Chi, non un coordinatore Racing. Una lobby e una simulazione di guida autorevole hanno esigenze diverse: non sono state alterate le loro tabelle, policy o funzioni.

Il limite documentato Realtime Free è 100 messaggi/secondo fra invii e consegne, condiviso dal progetto. Sei piloti a 20 aggiornamenti/secondo supererebbero già tale soglia prima del fan-out. Realtime da solo non convaliderebbe fisica, checkpoint e risultati. [Quote Supabase](https://supabase.com/docs/guides/realtime/limits).

## Architettura implementata

- Worker HTTP: `POST /rooms`, `GET /rooms/CODICE/socket`. Codice casuale di 8 caratteri, senza caratteri ambigui. Accesso ospite, senza account.
- Un Durable Object SQLite per stanza. Un solo `RacingEngine`, passo fisso 60 Hz; snapshot 20 Hz. Stessa pista/fisica offline, attraverso due sole estensioni opzionali: giri configurabili e mappa dei comandi per auto. I valori predefiniti offline restano invariati.
- 2–6 auto complessive: soltanto amici oppure amici e bot configurati dall’host. Anche un amico + almeno un bot. Cinque circuiti, sei auto selezionabili, 1–9 giri, tre difficoltà bot.
- Host, nickname, auto, pronto, avvio condiviso, checkpoint ordinati, giri, classifica live/finale, ritiri, rivincita e ritorno alla lobby. L’ingresso di un amico riduce i bot se serve a rispettare sei posti e azzera gli stati pronto.
- Il client invia **soltanto sterzo/gas/freno**: niente posizioni, giri, vittorie o punteggi dichiarati dal dispositivo. Il server simula anche i bot e convalida gli arrivi.
- Client grafico separato, stesso renderer/modelli e comandi offline. Buffer di interpolazione 100 ms; extrapolazione limitata a 100 ms, senza simulazione fisica locale concorrente. I recuperi interrompono l’interpolazione. Nessuna promessa di assenza assoluta di scatti su reti instabili.
- Il menu online non ferma gli altri. Input vecchi oltre 500 ms diventano neutri. Disconnessione: 20 secondi per riprendere la sessione; poi ritiro e passaggio dell’host a un partecipante connesso. Token conservato in sessionStorage, mai nell’URL. La sequenza dei comandi riparte correttamente alla riconnessione.
- Checkpoint dello stato ogni 5 secondi e a ogni modifica lobby. Ripristino dopo riavvio del Durable Object: possono andare persi gli ultimi 5 secondi, non è una garanzia zero-loss. Ultime 10 classifiche nella stanza, non nel profilo Supabase. Scadenza assoluta stanza 2 ore; pulizia anticipata dopo abbandono. Nessuna classifica globale permanente.

## Confini di sicurezza

Origini ammesse esatte, nessun wildcard, nessuna configurazione di origine = rifiuto. Ticket casuale separato riserva il ruolo host al creatore. Token ospiti lunghi casuali, soltanto hash SHA-256 nello stato persistito; niente token negli snapshot pubblici. Comandi privilegiati verificati sul server, configurazione allowlist, input numerici limitati, sequenza/numero gara contro i replay. Payload massimo 1 KiB, 40 messaggi/secondo per socket, massimo 12 socket inclusi handshake. Limiti iniziali per IP (hash, non IP memorizzato): 10 creazioni/ora e 60 tentativi connessione/minuto. Non è un sistema anti-DDoS completo; prevedere monitoraggio e protezioni Cloudflare in un eventuale rilascio pubblico.

La pagina è una modalità di `game_id=racing`, non una nuova voce Home. Riusa gli overlay Admin esistenti e controlla i flag pubblici multiplayer/creazione/nuove gare prima delle azioni UI. Questi flag nel browser **non sono un’autorizzazione di sicurezza del Worker**: un eventuale interruttore Admin server-side del nuovo servizio richiede un’integrazione ulteriore, non viene finto come esistente.

## Costi e pubblicazione: serve autorizzazione

I Durable Object SQLite risultano disponibili anche su Workers Free. La documentazione indica 100.000 richieste/giorno e 13.000 GB-s/giorno; il traffico WebSocket entrante ha una conversione 20:1 per il conteggio DO. Il timer di una gara impedisce l’ibernazione durante la simulazione: **non è multiplayer gratuito illimitato**. Verificare piano, CPU, storage e consumo reali dell’account prima di attivarlo. Nessun piano a pagamento o servizio ricorrente è stato sottoscritto. [Prezzi e quote Cloudflare](https://developers.cloudflare.com/durable-objects/platform/pricing/), [WebSocket e ibernazione](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

Solo dopo esplicita autorizzazione:

1. Verificare l’account/piano Cloudflare e il dominio pubblico effettivo di CuginiParty. Non sono stati inventati account ID o URL.
2. Impostare `ALLOWED_ORIGINS` in `server/racing/wrangler.toml`, con le origini esatte separate da virgole, senza slash finale. Le origini preview vanno autorizzate una per una, se desiderate.
3. Pubblicare il Worker con Wrangler, separatamente da Pages. Il file contiene la migrazione **Cloudflare** `v1` per le due classi SQLite; è soltanto preparata, non applicata. Non è SQL Supabase.
4. Inserire l’URL HTTPS risultante in `js/racing-online-config.js`. È un URL pubblico, non una chiave segreta. Attualmente è vuoto: il sito mostra un messaggio esplicito e non tenta di creare false stanze.
5. Pubblicare i file statici solo quando autorizzato; verificare CORS/WebSocket dal dominio reale, due dispositivi fisici su reti diverse, latenza/perdita pacchetti, riconnessione, sei piloti, giri completi e risultati.

## Test riproducibili

Nessuna dipendenza aggiunta al sito. Per i test locali installare in una cartella temporanea esterna `miniflare`, `esbuild`, `ws` e renderli risolvibili da Node attraverso `NODE_PATH`; Playwright/Chromium sono richiesti per i test browser. Versioni esatte usate nel collaudo sono nel report dell’aggiornamento. Non è necessario un login Cloudflare né Supabase reale. Il bundle del Worker è circa 372 KB non compresso, senza renderer Three/WebGL lato server.

```text
node tests/racing-online-core.test.cjs
node tests/racing-online-browser.test.cjs
node tests/racing-online-race.test.cjs
node tests/racing-3d-engine.test.cjs
node tests/racing-3d-browser.test.cjs
```

`racing-online-browser` avvia il vero workerd locale, due contesti Chromium separati (desktop e telefono emulato), prova lobby, tastiera/touch, stessi snapshot, bot, ricaricamento/ripresa, risultati dopo interruzione, rivincita solo amici e uscita. `racing-online-race` guida due client WebSocket automatici fino a un vero arrivo, inviando soltanto input e attraversando 21 gate ciascuno. Non sono test di telefoni fisici, di Internet pubblico o di saturazione del piano gratuito.
