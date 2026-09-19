"use strict";

(function initializeGuessWhoModule() {
    const roster = window.GUESS_WHO_CHARACTERS || [];
    const questions = window.GUESS_WHO_QUESTIONS || [];
    const byCharacterId = new Map(roster.map(character => [character.id, character]));
    const byQuestionId = new Map(questions.map(question => [question.id, question]));
    const storageKey = "CuginiParty_guess_who_session_v1";
    const audioStorageKey = "CuginiParty_audio_enabled";
    const supabaseUrl = "https://pzjbxrcxlztwjxetnzkw.supabase.co";
    const publishableKey = "sb_publishable_obaFQtUNuG3980ZkndTaCQ_bmc4QeHu";
    const db = typeof supabaseClient !== "undefined" ? supabaseClient : window.supabaseClient;
    if (db && !window.supabaseClient) window.supabaseClient = db;

    const state = {
        session: null,
        snapshot: null,
        eliminated: new Set(),
        selectedGuess: null,
        activeCategory: "Capelli",
        channel: null,
        pollTimer: null,
        heartbeatTimer: null,
        staleTimer: null,
        toastTimer: null,
        audioEnabled: localStorage.getItem(audioStorageKey) !== "false",
        audioContext: null,
        busy: false,
        lastVersion: -1
    };

    const $ = id => document.getElementById(id);
    const dom = {};
    const ids = [
        "entryScreen", "lobbyScreen", "gameScreen", "resultScreen", "createRoomForm", "joinRoomForm",
        "createRoomButton", "joinRoomButton", "joinCode", "roomCode", "copyCodeButton", "lobbyPlayers",
        "lobbyStatus", "startGameButton", "leaveLobbyButton", "opponentName", "opponentConnection", "turnPill",
        "turnKicker", "turnTitle", "secretButton", "secretThumb", "secretName", "secretPopover", "secretPortrait",
        "secretPopoverName", "closeSecretButton", "gameEvent", "gameEventLabel", "gameEventText", "incomingQuestion",
        "questionAuthor", "questionText", "answerActions", "answerHint", "historyButton", "historyCount", "remainingCount",
        "characterGrid", "askButton", "guessButton", "finishTurnButton", "mobileActions", "mobileAskButton",
        "mobileGuessButton", "mobileFinishButton", "sheetBackdrop", "questionSheet", "questionTabs", "questionList",
        "guessSheet", "guessGrid", "guessConfirm", "guessConfirmPortrait", "guessConfirmName", "cancelGuessButton",
        "confirmGuessButton", "historySheet", "historyList", "resultEyebrow", "resultTitle", "resultMessage",
        "resultCharacter", "resultStats", "rematchStatus", "rematchButton", "toast", "connectionBanner",
        "exitDisconnectedButton", "audioButton"
    ];

    function cacheDom() { ids.forEach(id => { dom[id] = $(id); }); }

    function showScreen(name) {
        ["entryScreen", "lobbyScreen", "gameScreen", "resultScreen"].forEach(id => {
            if (dom[id]) dom[id].hidden = id !== name;
        });
        dom.mobileActions.hidden = name !== "gameScreen";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
    }

    function naturalError(error) {
        const raw = String(error?.message || error || "").replace(/^.*?GW_/, "GW_");
        if (/guess_who_.*function|could not find the function|schema cache/i.test(raw)) {
            return "Il database di Indovina Chi non è ancora configurato.";
        }
        const messages = {
            GW_NAME_REQUIRED: "Inserisci un nome valido.",
            GW_ROOM_NOT_FOUND: "Questa stanza non esiste.",
            GW_ROOM_FULL: "La stanza è già piena.",
            GW_ROOM_STARTED: "La partita è già iniziata.",
            GW_ROOM_EXPIRED: "Questa stanza è scaduta.",
            GW_NOT_AUTHORIZED: "La sessione non è più valida.",
            GW_NOT_HOST: "Solo l'host può iniziare la partita.",
            GW_NEED_TWO_PLAYERS: "Servono esattamente due giocatori.",
            GW_NOT_YOUR_TURN: "Non è il tuo turno.",
            GW_INVALID_PHASE: "Questa azione non è disponibile adesso.",
            GW_MULTIPLAYER_DISABLED: "Il multiplayer è stato disattivato dall'amministratore.",
            GW_NEW_ROOMS_DISABLED: "In questo momento non si possono creare nuove stanze.",
            GW_INVALID_QUESTION: "Questa domanda non è valida.",
            GW_ALREADY_FINISHED: "La partita è già terminata."
        };
        const key = Object.keys(messages).find(code => raw.includes(code));
        return key ? messages[key] : "Qualcosa non ha funzionato. Riprova tra poco.";
    }

    function toast(message, tone = "normal") {
        clearTimeout(state.toastTimer);
        dom.toast.textContent = message;
        dom.toast.dataset.tone = tone;
        dom.toast.hidden = false;
        state.toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 3200);
    }

    function vibrate(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }

    function sound(type) {
        if (!state.audioEnabled || !(window.AudioContext || window.webkitAudioContext)) return;
        try {
            state.audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
            const context = state.audioContext;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const settings = {
                eliminate: [180, .05, "triangle"], restore: [330, .05, "sine"], question: [520, .08, "sine"],
                yes: [660, .13, "sine"], no: [190, .16, "square"], victory: [784, .28, "triangle"], defeat: [145, .3, "sawtooth"]
            }[type] || [300, .05, "sine"];
            oscillator.type = settings[2]; oscillator.frequency.value = settings[0];
            gain.gain.setValueAtTime(.045, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + settings[1]);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start(); oscillator.stop(context.currentTime + settings[1]);
        } catch (_) { /* Enhancement non essenziale. */ }
    }

    function setBusy(busy, button) {
        state.busy = busy;
        if (button) button.disabled = busy;
    }

    async function rpc(name, parameters) {
        if (!db) throw new Error("Supabase non è disponibile.");
        const result = await db.rpc(name, parameters);
        if (result.error) throw result.error;
        return result.data;
    }

    function saveSession() {
        if (!state.session) return localStorage.removeItem(storageKey);
        localStorage.setItem(storageKey, JSON.stringify({
            ...state.session,
            matchNumber: state.snapshot?.matchNumber || state.session.matchNumber || 0,
            eliminated: Array.from(state.eliminated)
        }));
    }

    function readSession() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || "null");
            return value?.roomId && value?.playerId && value?.token ? value : null;
        } catch (_) { return null; }
    }

    function clearSession() {
        localStorage.removeItem(storageKey);
        state.session = null;
        state.snapshot = null;
        state.eliminated.clear();
        stopRealtime();
    }

    function portrait(characterId, decorative = false) {
        return window.renderGuessWhoPortrait(byCharacterId.get(characterId), { decorative });
    }

    function renderPreviews() {
        document.querySelectorAll("[data-preview]").forEach(item => { item.innerHTML = portrait(item.dataset.preview, true); });
    }

    function renderBoard() {
        dom.characterGrid.innerHTML = roster.map(character => `
            <button type="button" class="guess-who-character-card ${state.eliminated.has(character.id) ? "is-eliminated" : ""}"
                data-character-id="${character.id}" aria-pressed="${state.eliminated.has(character.id)}" aria-label="${state.eliminated.has(character.id) ? "Ripristina" : "Escludi"} ${escapeHtml(character.name)}">
                ${portrait(character.id)}<strong>${escapeHtml(character.name)}</strong><span class="guess-who-card-overlay" aria-hidden="true">ESCLUSO</span>
            </button>`).join("");
        const remaining = roster.length - state.eliminated.size;
        dom.remainingCount.textContent = String(remaining);
    }

    function toggleCharacter(characterId) {
        if (!state.snapshot || state.snapshot.status !== "playing") return;
        if (state.eliminated.has(characterId)) {
            state.eliminated.delete(characterId); sound("restore"); vibrate(12);
        } else {
            state.eliminated.add(characterId); sound("eliminate"); vibrate(8);
        }
        saveSession();
        const card = dom.characterGrid.querySelector(`[data-character-id="${characterId}"]`);
        if (card) {
            const eliminated = state.eliminated.has(characterId);
            card.classList.toggle("is-eliminated", eliminated);
            card.setAttribute("aria-pressed", String(eliminated));
            card.setAttribute("aria-label", `${eliminated ? "Ripristina" : "Escludi"} ${byCharacterId.get(characterId)?.name || "personaggio"}`);
        }
        dom.remainingCount.textContent = String(roster.length - state.eliminated.size);
    }

    function players() { return state.snapshot?.players || []; }
    function me() { return players().find(player => player.id === state.session?.playerId); }
    function opponent() { return players().find(player => player.id !== state.session?.playerId); }
    function isMyTurn() { return state.snapshot?.currentTurnPlayerId === state.session?.playerId; }

    function renderLobby() {
        showScreen("lobbyScreen");
        dom.roomCode.textContent = state.snapshot.code;
        const items = players().slice(0, 2);
        while (items.length < 2) items.push(null);
        dom.lobbyPlayers.innerHTML = items.map((player, index) => player ? `
            <div class="guess-who-player-row"><span class="guess-who-player-avatar">${escapeHtml(player.name.slice(0, 1).toUpperCase())}</span><strong>${escapeHtml(player.name)}${player.id === state.snapshot.hostPlayerId ? " · Host" : ""}</strong><small>PRONTO ✓</small></div>` : `
            <div class="guess-who-player-row empty"><span class="guess-who-player-avatar">${index + 1}</span><strong>Posto libero</strong><small>IN ATTESA</small></div>`).join("");
        const amHost = state.snapshot.hostPlayerId === state.session.playerId;
        dom.lobbyStatus.textContent = items.filter(Boolean).length === 2
            ? (amHost ? "Siete in due. Puoi iniziare la partita." : `In attesa che ${players().find(player => player.id === state.snapshot.hostPlayerId)?.name || "l'host"} inizi…`)
            : "In attesa dell'avversario…";
        dom.startGameButton.hidden = !amHost;
        dom.startGameButton.disabled = players().length !== 2 || state.busy;
    }

    function renderSecret() {
        const secret = byCharacterId.get(state.snapshot?.mySecretId);
        if (!secret) return;
        dom.secretThumb.innerHTML = portrait(secret.id, true);
        dom.secretName.textContent = secret.name;
        dom.secretPortrait.innerHTML = portrait(secret.id);
        dom.secretPopoverName.textContent = secret.name;
    }

    function renderQuestionState() {
        const snapshot = state.snapshot;
        const pending = snapshot.pendingQuestion;
        const mine = isMyTurn();
        const myId = state.session.playerId;
        const amAsker = pending?.askerId === myId;
        const amAnswerer = pending && !amAsker;
        const canAct = snapshot.phase === "turn" && mine;
        const canFinish = snapshot.phase === "review" && amAsker;

        dom.turnPill.classList.toggle("is-waiting", !mine);
        dom.turnKicker.textContent = snapshot.phase === "question" ? "DOMANDA IN CORSO" : snapshot.phase === "review" ? "RISPOSTA RICEVUTA" : "TURNO";
        dom.turnTitle.textContent = mine ? "È IL TUO TURNO" : `TURNO DI ${opponent()?.name?.toUpperCase() || "AVVERSARIO"}`;
        [dom.askButton, dom.guessButton, dom.mobileAskButton, dom.mobileGuessButton].forEach((button, index) => {
            button.disabled = !canAct;
            if (index % 2 === 0) button.title = canAct ? "" : "Disponibile all'inizio del tuo turno";
        });
        dom.finishTurnButton.hidden = !canFinish;
        dom.mobileFinishButton.hidden = !canFinish;
        dom.mobileAskButton.hidden = canFinish;
        dom.mobileGuessButton.hidden = canFinish;

        dom.incomingQuestion.hidden = !pending || snapshot.phase === "turn";
        dom.answerActions.hidden = !(snapshot.phase === "question" && amAnswerer);
        dom.answerHint.hidden = !pending;
        dom.gameEvent.hidden = snapshot.phase !== "review" || typeof pending?.answer !== "boolean";
        if (pending) {
            const asker = players().find(player => player.id === pending.askerId);
            dom.questionAuthor.textContent = amAsker ? "HAI CHIESTO" : `${asker?.name?.toUpperCase() || "L'AVVERSARIO"} CHIEDE`;
            dom.questionText.textContent = pending.text;
            if (snapshot.phase === "question" && amAsker) dom.answerHint.textContent = "In attesa della risposta dell'avversario…";
            if (snapshot.phase === "review") dom.answerHint.textContent = amAsker ? "Abbassa manualmente i personaggi incompatibili, poi termina il turno." : "L'avversario sta aggiornando la sua griglia.";
        }
        if (snapshot.phase === "review" && typeof pending?.answer === "boolean") {
            dom.gameEvent.classList.toggle("is-no", !pending.answer);
            dom.gameEventText.textContent = pending.answer ? "SÌ" : "NO";
        }
        if (snapshot.phase === "question" && amAnswerer) {
            const question = byQuestionId.get(pending.key);
            const secret = byCharacterId.get(snapshot.mySecretId);
            const answer = question && secret ? secret[question.attribute] === question.expected : null;
            dom.answerActions.querySelectorAll("button").forEach(button => {
                const matches = button.dataset.answer === String(answer);
                button.classList.toggle("is-not-answer", !matches);
                button.setAttribute("aria-label", matches ? `Rispondi ${answer ? "sì" : "no"}, risposta verificata` : `Il gioco verificherà automaticamente la risposta`);
            });
        }
    }

    function renderHistory() {
        const history = state.snapshot?.history || [];
        dom.historyCount.textContent = String(history.length);
        dom.historyList.innerHTML = history.length ? history.slice().reverse().map(item => `
            <li class="${item.answer ? "" : "is-no"}"><span class="question-copy">${escapeHtml(item.text)}</span><span>${item.answer ? "SÌ" : "NO"}</span></li>`).join("") : '<li class="empty">Nessuna domanda ancora.</li>';
    }

    function renderGame() {
        showScreen("gameScreen");
        const rival = opponent();
        dom.opponentName.textContent = rival?.name || "Avversario";
        renderSecret();
        renderQuestionState();
        renderHistory();
        renderConnection();
    }

    function formatDuration(start, end) {
        const seconds = Math.max(0, Math.floor((new Date(end || Date.now()) - new Date(start || Date.now())) / 1000));
        const minutes = Math.floor(seconds / 60);
        return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
    }

    function renderResult() {
        showScreen("resultScreen");
        closeSheets();
        const won = state.snapshot.winnerPlayerId === state.session.playerId;
        const secret = byCharacterId.get(state.snapshot.opponentSecretId);
        dom.resultEyebrow.textContent = state.snapshot.resultReason === "wrong_guess" ? "TENTATIVO CONCLUSO" : "PERSONAGGIO SCOPERTO";
        dom.resultTitle.textContent = won ? (state.snapshot.resultReason === "correct_guess" ? "Hai indovinato!" : "Vittoria!") : "Partita persa";
        dom.resultMessage.textContent = won
            ? (state.snapshot.resultReason === "wrong_guess" ? `${opponent()?.name || "L'avversario"} ha tentato il personaggio sbagliato.` : `Hai scoperto il personaggio di ${opponent()?.name || "chi giocava con te"}.`)
            : (state.snapshot.resultReason === "wrong_guess" ? "Personaggio sbagliato: il rischio non ha pagato." : `${opponent()?.name || "L'avversario"} ha scoperto il tuo personaggio.`);
        dom.resultCharacter.innerHTML = secret ? `${portrait(secret.id)}<strong>${escapeHtml(secret.name)}</strong>` : "";
        const mine = me();
        dom.resultStats.innerHTML = [
            ["DOMANDE", mine?.questionsAsked ?? 0], ["TURNI", state.snapshot.turnCount ?? 0],
            ["ESCLUSI", state.eliminated.size], ["DURATA", formatDuration(state.snapshot.startedAt, state.snapshot.finishedAt)]
        ].map(([label, value]) => `<div class="guess-who-stat"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
        const readyCount = players().filter(player => player.readyRematch).length;
        dom.rematchButton.disabled = Boolean(me()?.readyRematch);
        dom.rematchButton.textContent = me()?.readyRematch ? "RIVINCITA RICHIESTA ✓" : "RIVINCITA";
        dom.rematchStatus.textContent = readyCount === 0 ? "La rivincita parte quando entrambi sono pronti." : readyCount === 1 ? "1 di 2 giocatori è pronto." : "Prepariamo la nuova partita…";
        if (state.lastRenderedStatus !== "finished") { sound(won ? "victory" : "defeat"); vibrate(won ? [25, 35, 25] : 35); }
    }

    function renderConnection() {
        const rival = opponent();
        if (!rival) { dom.connectionBanner.hidden = true; return; }
        const stale = !rival.connected || Date.now() - new Date(rival.lastSeen).getTime() > 28000;
        dom.opponentConnection.innerHTML = `<i></i> ${stale ? "Disconnesso" : "Online"}`;
        dom.opponentConnection.style.color = stale ? "var(--gw-orange)" : "";
        dom.connectionBanner.hidden = !stale || state.snapshot.status === "lobby";
    }

    function render() {
        if (!state.snapshot) return showScreen("entryScreen");
        const priorStatus = state.lastRenderedStatus;
        if (state.snapshot.status === "lobby") renderLobby();
        else if (state.snapshot.status === "playing") renderGame();
        else if (state.snapshot.status === "finished") renderResult();
        else { toast("La stanza è stata chiusa."); clearSession(); showScreen("entryScreen"); }
        state.lastRenderedStatus = state.snapshot.status;
        if (priorStatus === "lobby" && state.snapshot.status === "playing") {
            state.eliminated.clear(); renderBoard(); saveSession(); sound("question");
        }
    }

    async function refreshState(silent = false) {
        if (!state.session || state.busy && silent) return;
        try {
            const snapshot = await rpc("guess_who_get_state", {
                p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token
            });
            if (!snapshot) throw new Error("GW_NOT_AUTHORIZED");
            const oldMatch = Number(state.snapshot?.matchNumber || state.session.matchNumber || 0);
            state.snapshot = snapshot;
            if (Number(snapshot.matchNumber) !== oldMatch) { state.eliminated.clear(); renderBoard(); }
            state.lastVersion = Number(snapshot.version || 0);
            saveSession(); render();
        } catch (error) {
            if (!silent) toast(naturalError(error), "error");
            if (String(error?.message || "").includes("GW_NOT_AUTHORIZED")) { clearSession(); showScreen("entryScreen"); }
        }
    }

    function stopRealtime() {
        if (state.channel && db) db.removeChannel(state.channel);
        state.channel = null;
        clearInterval(state.pollTimer); clearInterval(state.heartbeatTimer); clearInterval(state.staleTimer);
        state.pollTimer = state.heartbeatTimer = state.staleTimer = null;
    }

    function startRealtime() {
        stopRealtime();
        if (!state.session || !db) return;
        state.channel = db.channel(`guess-who-${state.session.roomId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "guess_who_events", filter: `room_id=eq.${state.session.roomId}` }, () => refreshState(true))
            .subscribe(status => {
                if (status === "SUBSCRIBED") refreshState(true);
                if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) toast("Connessione instabile: provo a riconnettermi.");
            });
        state.pollTimer = setInterval(() => refreshState(true), 10000);
        state.heartbeatTimer = setInterval(() => setPresence(true), 12000);
        state.staleTimer = setInterval(renderConnection, 4000);
    }

    async function setPresence(connected) {
        if (!state.session) return;
        try {
            await rpc("guess_who_set_presence", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token, p_connected: connected });
        } catch (_) { /* Il polling recupera una disconnessione temporanea. */ }
    }

    async function enterSession(payload) {
        state.session = { roomId: payload.roomId, playerId: payload.playerId, token: payload.token, matchNumber: 0 };
        state.eliminated.clear(); saveSession(); renderBoard(); startRealtime(); await refreshState();
    }

    async function createRoom(event) {
        event.preventDefault();
        if (state.busy) return;
        const name = new FormData(event.currentTarget).get("name")?.trim();
        try {
            setBusy(true, dom.createRoomButton);
            const payload = await rpc("guess_who_create_room", { p_name: name });
            await enterSession(payload); toast("Stanza creata. Condividi il codice!");
        } catch (error) { toast(naturalError(error), "error"); }
        finally { setBusy(false, dom.createRoomButton); }
    }

    async function joinRoom(event) {
        event.preventDefault();
        if (state.busy) return;
        const data = new FormData(event.currentTarget);
        try {
            setBusy(true, dom.joinRoomButton);
            const payload = await rpc("guess_who_join_room", { p_name: data.get("name")?.trim(), p_code: data.get("code")?.trim().toUpperCase() });
            await enterSession(payload); toast("Sei entrato nella stanza.");
        } catch (error) { toast(naturalError(error), "error"); }
        finally { setBusy(false, dom.joinRoomButton); }
    }

    async function startGame() {
        if (state.busy) return;
        try {
            setBusy(true, dom.startGameButton);
            await rpc("guess_who_start_game", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token });
            await refreshState();
        } catch (error) { toast(naturalError(error), "error"); }
        finally { setBusy(false, dom.startGameButton); }
    }

    function openSheet(sheet) {
        closeSheets(); dom.sheetBackdrop.hidden = false; sheet.hidden = false; document.body.style.overflow = "hidden";
        sheet.querySelector("button")?.focus();
    }

    function closeSheets() {
        [dom.questionSheet, dom.guessSheet, dom.historySheet].forEach(sheet => { if (sheet) sheet.hidden = true; });
        if (dom.sheetBackdrop) dom.sheetBackdrop.hidden = true;
        document.body.style.overflow = "";
        dom.guessConfirm.hidden = true; state.selectedGuess = null;
    }

    function renderQuestionBuilder() {
        const categories = [...new Set(questions.map(question => question.category))];
        dom.questionTabs.innerHTML = categories.map(category => `<button type="button" role="tab" class="${category === state.activeCategory ? "is-active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category.toUpperCase())}</button>`).join("");
        const asked = new Set((state.snapshot?.history || []).filter(item => item.askerId === state.session.playerId).map(item => item.key));
        dom.questionList.innerHTML = questions.filter(question => question.category === state.activeCategory).map(question => `
            <button type="button" class="guess-who-question-option" data-question-id="${question.id}"><span>${escapeHtml(question.text)}</span>${asked.has(question.id) ? "<small>GIÀ CHIESTA</small>" : ""}</button>`).join("");
    }

    function showQuestionSheet() { if (!isMyTurn() || state.snapshot.phase !== "turn") return; renderQuestionBuilder(); openSheet(dom.questionSheet); }

    async function askQuestion(questionId) {
        if (state.busy) return;
        try {
            state.busy = true; closeSheets();
            await rpc("guess_who_ask_question", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token, p_question_key: questionId });
            sound("question"); vibrate(12); await refreshState();
        } catch (error) { toast(naturalError(error), "error"); }
        finally { state.busy = false; }
    }

    async function answerQuestion() {
        if (state.busy) return;
        try {
            state.busy = true;
            const result = await rpc("guess_who_answer_question", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token });
            sound(result?.answer ? "yes" : "no"); vibrate(15); await refreshState();
        } catch (error) { toast(naturalError(error), "error"); }
        finally { state.busy = false; }
    }

    async function finishTurn() {
        if (state.busy) return;
        try {
            state.busy = true;
            await rpc("guess_who_finish_turn", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token });
            await refreshState();
        } catch (error) { toast(naturalError(error), "error"); }
        finally { state.busy = false; }
    }

    function showGuessSheet() {
        if (!isMyTurn() || state.snapshot.phase !== "turn") return;
        const available = roster.filter(character => !state.eliminated.has(character.id));
        dom.guessGrid.innerHTML = available.map(character => `<button type="button" class="guess-who-guess-option" data-guess-id="${character.id}">${portrait(character.id)}<span>${escapeHtml(character.name)}</span></button>`).join("");
        openSheet(dom.guessSheet);
    }

    function selectGuess(characterId) {
        const character = byCharacterId.get(characterId);
        if (!character) return;
        state.selectedGuess = characterId;
        dom.guessConfirmPortrait.innerHTML = portrait(characterId);
        dom.guessConfirmName.textContent = character.name;
        dom.guessConfirm.hidden = false;
        dom.confirmGuessButton.focus();
    }

    async function confirmGuess() {
        if (!state.selectedGuess || state.busy) return;
        try {
            state.busy = true; dom.confirmGuessButton.disabled = true;
            await rpc("guess_who_make_guess", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token, p_character_id: state.selectedGuess });
            closeSheets(); await refreshState();
        } catch (error) { toast(naturalError(error), "error"); }
        finally { state.busy = false; dom.confirmGuessButton.disabled = false; }
    }

    async function requestRematch() {
        if (state.busy || me()?.readyRematch) return;
        try {
            state.busy = true;
            await rpc("guess_who_request_rematch", { p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token });
            await refreshState();
        } catch (error) { toast(naturalError(error), "error"); }
        finally { state.busy = false; }
    }

    async function leaveRoom() {
        if (!state.session) return;
        const session = { ...state.session };
        clearSession(); showScreen("entryScreen");
        try { await rpc("guess_who_leave_room", { p_room_id: session.roomId, p_player_id: session.playerId, p_token: session.token }); } catch (_) { /* Sessione locale già rimossa. */ }
    }

    async function copyCode() {
        const code = state.snapshot?.code || "";
        try { await navigator.clipboard.writeText(code); toast("Codice copiato!"); }
        catch (_) {
            const input = document.createElement("input"); input.value = code; document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove(); toast("Codice copiato!");
        }
    }

    function toggleSecret() {
        const opening = dom.secretPopover.hidden;
        dom.secretPopover.hidden = !opening;
        dom.secretButton.setAttribute("aria-expanded", String(opening));
    }

    function bindEvents() {
        dom.createRoomForm.addEventListener("submit", createRoom);
        dom.joinRoomForm.addEventListener("submit", joinRoom);
        dom.joinCode.addEventListener("input", event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5); });
        dom.copyCodeButton.addEventListener("click", copyCode);
        dom.startGameButton.addEventListener("click", startGame);
        dom.leaveLobbyButton.addEventListener("click", leaveRoom);
        dom.characterGrid.addEventListener("click", event => { const card = event.target.closest("[data-character-id]"); if (card) toggleCharacter(card.dataset.characterId); });
        [dom.askButton, dom.mobileAskButton].forEach(button => button.addEventListener("click", showQuestionSheet));
        [dom.guessButton, dom.mobileGuessButton].forEach(button => button.addEventListener("click", showGuessSheet));
        [dom.finishTurnButton, dom.mobileFinishButton].forEach(button => button.addEventListener("click", finishTurn));
        dom.answerActions.addEventListener("click", event => { if (event.target.closest("[data-answer]")) answerQuestion(); });
        dom.questionTabs.addEventListener("click", event => { const button = event.target.closest("[data-category]"); if (!button) return; state.activeCategory = button.dataset.category; renderQuestionBuilder(); });
        dom.questionList.addEventListener("click", event => { const button = event.target.closest("[data-question-id]"); if (button) askQuestion(button.dataset.questionId); });
        dom.guessGrid.addEventListener("click", event => { const button = event.target.closest("[data-guess-id]"); if (button) selectGuess(button.dataset.guessId); });
        dom.cancelGuessButton.addEventListener("click", () => { dom.guessConfirm.hidden = true; state.selectedGuess = null; });
        dom.confirmGuessButton.addEventListener("click", confirmGuess);
        dom.historyButton.addEventListener("click", () => { renderHistory(); openSheet(dom.historySheet); });
        dom.sheetBackdrop.addEventListener("click", closeSheets);
        document.querySelectorAll("[data-close-sheet]").forEach(button => button.addEventListener("click", closeSheets));
        dom.secretButton.addEventListener("click", toggleSecret);
        dom.closeSecretButton.addEventListener("click", toggleSecret);
        dom.rematchButton.addEventListener("click", requestRematch);
        dom.exitDisconnectedButton.addEventListener("click", () => { leaveRoom(); location.href = "../index.html"; });
        dom.audioButton.addEventListener("click", () => {
            state.audioEnabled = !state.audioEnabled; localStorage.setItem(audioStorageKey, String(state.audioEnabled));
            dom.audioButton.setAttribute("aria-pressed", String(state.audioEnabled));
            dom.audioButton.setAttribute("aria-label", state.audioEnabled ? "Disattiva audio" : "Attiva audio");
            if (state.audioEnabled) sound("restore");
        });
        document.addEventListener("keydown", event => { if (event.key === "Escape") { closeSheets(); if (!dom.secretPopover.hidden) toggleSecret(); } });
        window.addEventListener("online", () => { toast("Connessione ripristinata."); setPresence(true); refreshState(true); });
        window.addEventListener("pagehide", sendDisconnectBeacon);
    }

    function sendDisconnectBeacon() {
        if (!state.session) return;
        const body = JSON.stringify({ p_room_id: state.session.roomId, p_player_id: state.session.playerId, p_token: state.session.token, p_connected: false });
        fetch(`${supabaseUrl}/rest/v1/rpc/guess_who_set_presence`, {
            method: "POST", keepalive: true, headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, "Content-Type": "application/json" }, body
        }).catch(() => {});
    }

    async function restore() {
        const saved = readSession();
        if (!saved) return;
        state.session = { roomId: saved.roomId, playerId: saved.playerId, token: saved.token, matchNumber: saved.matchNumber || 0 };
        state.eliminated = new Set(Array.isArray(saved.eliminated) ? saved.eliminated.filter(id => byCharacterId.has(id)) : []);
        renderBoard(); startRealtime(); await refreshState(true);
        if (!state.snapshot) clearSession();
    }

    document.addEventListener("DOMContentLoaded", async () => {
        cacheDom(); renderPreviews(); renderBoard(); bindEvents();
        dom.audioButton.setAttribute("aria-pressed", String(state.audioEnabled));
        await restore();
    });
})();
