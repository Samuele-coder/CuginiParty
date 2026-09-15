"use strict";

(function initHangman() {
    const wordElement = document.getElementById("hangmanWord");
    if (!wordElement) return;
    const keyboardElement = document.getElementById("hangmanKeyboard");
    const categoryElement = document.getElementById("hangmanCategory");
    const errorsElement = document.getElementById("hangmanErrors");
    const messageElement = document.getElementById("hangmanMessage");
    const storageKey = "cuginiparty_hangman_stats_v1";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const categories = {
        "Animali": ["GATTO", "CANE", "TIGRE", "ZEBRA", "LEONE", "ORSO", "PANDA", "VOLPE", "DELFINO", "CONIGLIO"],
        "Cibo": ["PIZZA", "PASTA", "GELATO", "TORTA", "MIELE", "BURRO", "OLIVA", "LIMONE", "BISCOTTO", "FORMAGGIO"],
        "Calcio": ["STADIO", "GOL", "PORTIERE", "ARBITRO", "SQUADRA", "TIFO", "CAMPO", "RIGORE", "PALLONE"],
        "Videogiochi": ["TETRIS", "SNAKE", "MINECRAFT", "ZELDA", "MARIO", "SONIC", "ARCADE", "JOYSTICK"],
        "Film": ["REGISTA", "ATTORE", "SCENA", "OSCAR", "CINEMA", "EROE", "COMMEDIA", "HORROR"],
        "Luoghi": ["ROMA", "MILANO", "MARE", "MONTAGNA", "ISOLA", "PIAZZA", "MUSEO", "DESERTO"],
        "Oggetti": ["TAVOLO", "PENNA", "BORSA", "CHIAVE", "LAMPADA", "SCARPA", "TELEFONO", "ZAINO"]
    };
    let word = ""; let category = ""; let guessed = new Set(); let errors = 0; let gameOver = false; let stats = readStats();
    function normalize(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); }
    function readStats() { try { return { played: 0, wins: 0, streak: 0, bestStreak: 0, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; } catch { return { played: 0, wins: 0, streak: 0, bestStreak: 0 }; } }
    function saveStats() { localStorage.setItem(storageKey, JSON.stringify(stats)); renderStats(); }
    function renderStats() { ["played", "wins", "streak", "bestStreak"].forEach(name => { const target = document.getElementById(`hangman${name[0].toUpperCase()}${name.slice(1)}`); if (target) target.textContent = stats[name]; }); }
    function renderWord() { wordElement.innerHTML = ""; [...word].forEach(letter => { const item = document.createElement("span"); item.className = "hangman-letter"; item.textContent = guessed.has(letter) ? letter : ""; item.setAttribute("aria-label", guessed.has(letter) ? letter : "lettera nascosta"); wordElement.appendChild(item); }); }
    function renderKeyboard() { keyboardElement.innerHTML = ""; alphabet.forEach(letter => { const button = document.createElement("button"); button.type = "button"; button.className = "hangman-key"; button.textContent = letter; button.dataset.letter = letter; button.disabled = guessed.has(letter) || gameOver; if (guessed.has(letter)) button.classList.add(word.includes(letter) ? "correct" : "wrong"); button.addEventListener("click", () => guessLetter(letter)); keyboardElement.appendChild(button); }); }
    function renderDrawing() { document.querySelectorAll(".hangman-part").forEach(part => part.classList.toggle("visible", Number(part.dataset.part) <= errors)); errorsElement.textContent = `Errori ${errors} / 6`; }
    function isSolved() { return [...new Set(word)].every(letter => guessed.has(letter)); }
    function finish(won) { gameOver = true; stats.played += 1; if (won) { stats.wins += 1; stats.streak += 1; stats.bestStreak = Math.max(stats.bestStreak, stats.streak); messageElement.textContent = `Vittoria! La parola era ${word}.`; } else { stats.streak = 0; messageElement.textContent = `Peccato: la parola era ${word}.`; } saveStats(); renderKeyboard(); }
    function guessLetter(letter) { if (gameOver || guessed.has(letter)) return; guessed.add(letter); if (!word.includes(letter)) errors += 1; renderWord(); renderKeyboard(); renderDrawing(); if (isSolved()) finish(true); else if (errors >= 6) finish(false); }
    function newWord() { const names = Object.keys(categories); category = names[Math.floor(Math.random() * names.length)]; const list = categories[category]; word = normalize(list[Math.floor(Math.random() * list.length)]); guessed = new Set(); errors = 0; gameOver = false; categoryElement.textContent = `Categoria: ${category}`; messageElement.textContent = "Scegli una lettera."; renderWord(); renderKeyboard(); renderDrawing(); }
    document.addEventListener("keydown", event => { if (event.ctrlKey || event.metaKey || event.altKey) return; const letter = normalize(event.key); if (/^[A-Z]$/.test(letter)) { event.preventDefault(); guessLetter(letter); } });
    document.getElementById("hangmanNew").addEventListener("click", newWord); renderStats(); newWord();
})();
