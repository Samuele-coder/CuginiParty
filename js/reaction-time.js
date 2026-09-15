"use strict";

(function initReactionTime() {
    const arena = document.getElementById("reactionArena");
    if (!arena) return;
    const kicker = document.getElementById("reactionKicker");
    const title = document.getElementById("reactionTitle");
    const description = document.getElementById("reactionDescription");
    const attemptLabel = document.getElementById("reactionAttemptLabel");
    const lastResult = document.getElementById("reactionLastResult");
    const attemptsElement = document.getElementById("reactionAttempts");
    const recordElement = document.getElementById("reactionRecord");
    const sessionSize = 5;
    const storageKey = "cuginiparty_reaction_time_record_v1";
    let state = "ready";
    let attempts = [];
    let timerId = null;
    let startedAt = 0;
    let record = readRecord();

    function readRecord() { const value = Number(localStorage.getItem(storageKey)); return Number.isFinite(value) && value > 0 ? value : null; }
    function formatTime(value) { return value == null ? "—" : `${Math.round(value)} ms`; }
    function renderAttempts() {
        attemptsElement.innerHTML = "";
        for (let index = 0; index < sessionSize; index += 1) {
            const item = document.createElement("div"); item.className = "reaction-attempt";
            item.innerHTML = `<span>${index + 1}</span><strong>${formatTime(attempts[index])}</strong>`;
            attemptsElement.appendChild(item);
        }
        attemptLabel.textContent = attempts.length >= sessionSize ? "Sessione completata" : `Tentativo ${attempts.length + 1} di ${sessionSize}`;
        if (attempts.length) lastResult.textContent = `Ultimo: ${formatTime(attempts[attempts.length - 1])}`;
        else lastResult.textContent = "—";
        const best = attempts.length ? Math.min(...attempts) : null;
        const worst = attempts.length ? Math.max(...attempts) : null;
        const average = attempts.length ? attempts.reduce((sum, value) => sum + value, 0) / attempts.length : null;
        document.getElementById("reactionBest").textContent = formatTime(best);
        document.getElementById("reactionWorst").textContent = formatTime(worst);
        document.getElementById("reactionAverage").textContent = formatTime(average);
        recordElement.textContent = formatTime(record);
    }
    function setArena(nextState, nextKicker, nextTitle, nextDescription) {
        state = nextState; arena.className = `reaction-arena ${nextState}`; kicker.textContent = nextKicker; title.textContent = nextTitle; description.textContent = nextDescription;
    }
    function beginAttempt() {
        if (state !== "ready") return;
        setArena("waiting", "ASPETTA…", "Non cliccare ancora", "Il segnale arriva tra poco. Resta pronto.");
        const delay = 1500 + Math.random() * 3500;
        timerId = window.setTimeout(() => { state = "go"; startedAt = performance.now(); setArena("go", "CLICCA!", "ADESSO", "Tocca o clicca immediatamente l'area."); }, delay);
    }
    function handleFalseStart() {
        window.clearTimeout(timerId); timerId = null; setArena("too-soon", "TROPPO PRESTO!", "Hai anticipato il segnale", "Questo tentativo non vale. Clicca per riprovare.");
    }
    function recordAttempt() {
        const result = performance.now() - startedAt; attempts.push(result); timerId = null;
        if (record === null || result < record) { record = result; localStorage.setItem(storageKey, String(Math.round(record))); }
        renderAttempts();
        if (attempts.length === sessionSize) setArena("complete", "SESSIONE COMPLETATA", "Ottimo riflesso", "Premi Nuova sessione per riprovare.");
        else setArena("ready", `TENTATIVO ${attempts.length + 1} DI ${sessionSize}`, "Clicca per iniziare", "Ogni risultato deve essere valido.");
    }
    function handleArenaClick() { if (state === "ready") beginAttempt(); else if (state === "waiting") handleFalseStart(); else if (state === "too-soon") { setArena("ready", "PRONTO?", "Clicca per iniziare", "La sessione richiede 5 tempi validi."); beginAttempt(); } else if (state === "go") recordAttempt(); }
    function reset() { window.clearTimeout(timerId); timerId = null; attempts = []; setArena("ready", "PRONTO?", "Clicca per iniziare", "La sessione richiede 5 tempi validi."); renderAttempts(); }
    arena.addEventListener("click", handleArenaClick);
    document.getElementById("reactionRestart").addEventListener("click", reset);
    renderAttempts();
})();
