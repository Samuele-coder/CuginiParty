"use strict";

(function initSlidingPuzzle() {
    const boardElement = document.getElementById("slidingBoard");
    if (!boardElement) return;
    const storageKey = "cuginiparty_sliding_puzzle_bests_v1";
    let size = 3; let tiles = []; let moves = 0; let startedAt = null; let timerId = null; let finished = false; let bests = readBests();
    const messageElement = document.getElementById("slidingMessage");
    function readBests() { try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; } }
    function saveBests() { localStorage.setItem(storageKey, JSON.stringify(bests)); }
    function key() { return `${size}x${size}`; }
    function elapsedSeconds() { return startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000); }
    function formatTime(seconds) { const minutes = Math.floor(seconds / 60).toString().padStart(2, "0"); return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`; }
    function updateStats() { document.getElementById("slidingMoves").textContent = moves; document.getElementById("slidingTime").textContent = formatTime(elapsedSeconds()); document.getElementById("slidingBest").textContent = bests[key()]?.moves ?? "—"; boardElement.setAttribute("aria-label", `Puzzle ${size} per ${size}`); }
    function isSolved() { return tiles.every((tile, index) => tile === (index === tiles.length - 1 ? 0 : index + 1)); }
    function blankIndex() { return tiles.indexOf(0); }
    function neighbours(index) { const row = Math.floor(index / size); const column = index % size; return [row > 0 ? index - size : -1, row < size - 1 ? index + size : -1, column > 0 ? index - 1 : -1, column < size - 1 ? index + 1 : -1].filter(value => value >= 0); }
    function moveIndex(index, countMove = true) { const empty = blankIndex(); if (!neighbours(empty).includes(index)) return false; [tiles[index], tiles[empty]] = [tiles[empty], tiles[index]]; if (countMove) { if (startedAt === null) startedAt = Date.now(); moves += 1; } return true; }
    function shuffle() { tiles = Array.from({ length: size * size - 1 }, (_, index) => index + 1).concat(0); let previousBlank = -1; const total = size === 3 ? 80 : size === 4 ? 170 : 300; for (let count = 0; count < total; count += 1) { const options = neighbours(blankIndex()).filter(index => index !== previousBlank); const index = options[Math.floor(Math.random() * options.length)]; previousBlank = blankIndex(); moveIndex(index, false); } if (isSolved()) { const options = neighbours(blankIndex()); moveIndex(options[0], false); } }
    function render() { boardElement.innerHTML = ""; boardElement.style.setProperty("--tile-size", size); tiles.forEach((tile, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "sliding-tile"; button.setAttribute("role", "gridcell"); button.dataset.index = index; if (tile === 0) { button.classList.add("empty"); button.disabled = true; button.setAttribute("aria-label", "Spazio vuoto"); } else { const targetIndex = tile - 1; button.dataset.number = tile; button.style.setProperty("--tile-x", targetIndex % size); button.style.setProperty("--tile-y", Math.floor(targetIndex / size)); button.setAttribute("aria-label", `Tessera ${tile}, frammento immagine`); button.disabled = !neighbours(blankIndex()).includes(index) || finished; button.addEventListener("click", () => move(index)); } boardElement.appendChild(button); }); updateStats(); }
    function move(index) { if (finished || !moveIndex(index)) return; render(); if (isSolved()) finish(); }
    function finish() { finished = true; window.clearInterval(timerId); timerId = null; const seconds = elapsedSeconds(); const current = bests[key()]; if (!current || moves < current.moves || (moves === current.moves && seconds < current.seconds)) { bests[key()] = { moves, seconds }; saveBests(); messageElement.textContent = `Vittoria e nuovo record! ${moves} mosse in ${formatTime(seconds)}.`; } else messageElement.textContent = `Vittoria! ${moves} mosse in ${formatTime(seconds)}.`; messageElement.classList.add("success"); render(); }
    function newGame() { window.clearInterval(timerId); timerId = null; moves = 0; startedAt = null; finished = false; messageElement.classList.remove("success"); messageElement.textContent = "Riordina tutte le tessere."; shuffle(); render(); }
    document.querySelectorAll(".sliding-difficulties button").forEach(button => button.addEventListener("click", () => { size = Number(button.dataset.size); document.querySelectorAll(".sliding-difficulties button").forEach(item => item.classList.toggle("active", item === button)); newGame(); }));
    document.getElementById("slidingNew").addEventListener("click", newGame);
    timerId = window.setInterval(() => { if (startedAt !== null && !finished) updateStats(); }, 500);
    newGame();
})();
