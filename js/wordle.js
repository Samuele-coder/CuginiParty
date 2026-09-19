"use strict";

(function initWordle() {
    const boardElement = document.getElementById("wordleBoard");
    if (!boardElement) return;

    const statusElement = document.getElementById("wordleStatus");
    const keyboardElement = document.getElementById("wordleKeyboard");
    const newGameButton = document.getElementById("wordleNewGame");
    const storageKey = "cuginiparty_wordle_stats_v1";
    const solutions = [
        "ACETO", "AGAVE", "ALIBI", "AMICO", "ANIMA", "AROMA", "ASILO", "ATLETA",
        "AUDIO", "AVENA", "BAFFO", "BANCO", "BARCA", "BEVANDA", "BISONTE", "BORSA", "BRAVO", "CALDO",
        "CAMPO", "CANTO", "CARNE", "CARTA", "CASCO", "CENA", "CERTO", "CIELO", "CINEMA", "CIRCO",
        "COLPA", "CORDA", "CORNO", "CREDO", "CUORE", "DANZA", "DEBITO", "DENTE", "DOCCE", "DONNA",
        "DRAGO", "ERRORE", "FANGO", "FARLO", "FESTA", "FIATO", "FIUME", "FOGLIA", "FORMA", "FORTE",
        "FRENO", "FRODE", "FUOCO", "GAMBA", "GATTO", "GENIO", "GIARDINO", "GIOCO", "GOMMA", "GRANO",
        "GUANTO", "IDEA", "ISOLA", "LAMPO", "LARGO", "LATTE", "LEGNO", "LIMONE", "LOTTA", "LUOGO",
        "MADRE", "MAGIA", "MANO", "MARE", "MARZO", "MIELE", "MONDO", "MONTE", "MOTTO", "MURO",
        "NAVE", "NEVE", "NOTTE", "NUVOLA", "ODIO", "OLIVA", "ONDA", "OPERA", "OROLOGIO", "PALLA",
        "PANE", "PAPPA", "PARCO", "PARTE", "PENNA", "PESCA", "PIANO", "PIETRA", "PIZZA", "POETA",
        "PORTA", "PRATO", "PREMIO", "RADIO", "REGNO", "RETE", "RISATA", "ROBOT", "ROCCIA", "RUOTA",
        "SABATO", "SALSA", "SALTO", "SCALA", "SCOPA", "SERRA", "SOGNO", "SOLE", "SUONO", "TAVOLO",
        "TEMPO", "TERRA", "TETTO", "TIGRE", "TORRE", "TRENO", "TRAVE", "URLO", "VANGA", "VAPORE",
        "VASCA", "VERDE", "VETRO", "VINO", "VOCE", "ZAINO", "ZEBRA"
    ].filter(word => word.length === 5);
    const keyRows = [["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]];
    let solution = "";
    let guess = "";
    let row = 0;
    let gameOver = false;
    let stats = readStats();
    const keyboardState = new Map();

    function readStats() {
        try { return { played: 0, wins: 0, streak: 0, bestStreak: 0, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; }
        catch { return { played: 0, wins: 0, streak: 0, bestStreak: 0 }; }
    }

    function saveStats() { localStorage.setItem(storageKey, JSON.stringify(stats)); updateStats(); }
    function updateStats() {
        ["played", "wins", "streak", "bestStreak"].forEach(name => { const element = document.getElementById(`wordle${name[0].toUpperCase()}${name.slice(1)}`); if (element) element.textContent = stats[name]; });
    }
    function chooseSolution() {
        let next = solutions[Math.floor(Math.random() * solutions.length)];
        while (solutions.length > 1 && next === solution) next = solutions[Math.floor(Math.random() * solutions.length)];
        return next;
    }
    function createBoard() {
        boardElement.innerHTML = "";
        for (let index = 0; index < 30; index += 1) {
            const cell = document.createElement("div");
            cell.className = "wordle-cell";
            cell.dataset.index = String(index % 5);
            boardElement.appendChild(cell);
        }
    }
    function renderKeyboard() {
        keyboardElement.innerHTML = "";
        keyRows.forEach(keys => {
            const line = document.createElement("div");
            line.className = "wordle-keyboard-row";
            keys.forEach(key => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "wordle-key";
                if (key.length > 1) button.classList.add("wide");
                button.dataset.key = key;
                button.textContent = key === "BACKSPACE" ? "⌫" : key;
                button.setAttribute("aria-label", key === "BACKSPACE" ? "Cancella" : key === "ENTER" ? "Invia parola" : `Lettera ${key}`);
                button.addEventListener("click", () => handleKey(key));
                line.appendChild(button);
            });
            keyboardElement.appendChild(line);
        });
    }
    function handleKey(key) {
        if (gameOver) return;
        if (key === "ENTER") submitGuess();
        else if (key === "BACKSPACE") { guess = guess.slice(0, -1); renderCurrentGuess(); }
        else if (/^[A-Z]$/.test(key) && guess.length < 5) { guess += key; renderCurrentGuess(); }
    }
    function renderCurrentGuess() {
        for (let index = 0; index < 5; index += 1) {
            const cell = boardElement.children[row * 5 + index];
            cell.textContent = guess[index] || "";
            cell.classList.toggle("filled", Boolean(guess[index]));
        }
    }
    function evaluateGuess(value) {
        const result = Array(5).fill("absent");
        const remaining = {};
        for (let index = 0; index < 5; index += 1) {
            if (value[index] === solution[index]) result[index] = "correct";
            else remaining[solution[index]] = (remaining[solution[index]] || 0) + 1;
        }
        for (let index = 0; index < 5; index += 1) {
            if (result[index] === "correct") continue;
            const letter = value[index];
            if (remaining[letter] > 0) { result[index] = "present"; remaining[letter] -= 1; }
        }
        return result;
    }
    function updateKeyboard(value, result) {
        const rank = { absent: 1, present: 2, correct: 3 };
        value.split("").forEach((letter, index) => {
            const old = keyboardState.get(letter) || "";
            if (!old || rank[result[index]] > rank[old]) keyboardState.set(letter, result[index]);
        });
        keyboardState.forEach((state, letter) => { const button = keyboardElement.querySelector(`[data-key="${letter}"]`); if (button) { button.classList.remove("correct", "present", "absent"); button.classList.add(state); } });
    }
    function submitGuess() {
        if (guess.length !== 5) { statusElement.textContent = "Servono esattamente 5 lettere."; return; }
        const value = guess;
        const result = evaluateGuess(value);
        for (let index = 0; index < 5; index += 1) {
            const cell = boardElement.children[row * 5 + index];
            cell.classList.remove("filled");
            cell.classList.add(result[index]);
            cell.style.setProperty("--index", index);
        }
        updateKeyboard(value, result);
        row += 1;
        guess = "";
        if (value === solution) finish(true);
        else if (row === 6) finish(false);
        else { statusElement.textContent = "Continua: usa i colori come indizio."; renderCurrentGuess(); }
    }
    function finish(won) {
        gameOver = true;
        stats.played += 1;
        if (won) { stats.wins += 1; stats.streak += 1; stats.bestStreak = Math.max(stats.bestStreak, stats.streak); statusElement.textContent = `Bravissimo! Hai trovato ${solution}.`; }
        else { stats.streak = 0; statusElement.textContent = `Partita finita. La soluzione era ${solution}.`; }
        saveStats();
    }
    function newGame() {
        solution = chooseSolution(); guess = ""; row = 0; gameOver = false; keyboardState.clear();
        createBoard(); renderKeyboard(); renderCurrentGuess(); statusElement.textContent = "Indovina la parola in 6 tentativi.";
    }
    document.addEventListener("keydown", event => { if (event.ctrlKey || event.metaKey || event.altKey) return; const key = event.key.toUpperCase(); if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) { event.preventDefault(); handleKey(key === "BACKSPACE" ? "BACKSPACE" : key); } });
    newGameButton.addEventListener("click", newGame);
    updateStats(); newGame();
})();
