"use strict";

(function initColorMatch() {
    const answersElement = document.getElementById("colorAnswers");
    if (!answersElement) return;
    const colors = [
        { id: "red", word: "ROSSO", value: "#df4e5f" }, { id: "blue", word: "BLU", value: "#3876dd" },
        { id: "green", word: "VERDE", value: "#249a63" }, { id: "yellow", word: "GIALLO", value: "#d79c24" },
        { id: "orange", word: "ARANCIONE", value: "#e47732" }, { id: "purple", word: "VIOLA", value: "#7b59c7" }
    ];
    const duration = 60;
    const highScoreKey = "cuginiparty_color_match_high_score_v1";
    let running = false; let timeLeft = duration; let timerId = null; let score = 0; let correct = 0; let wrong = 0; let combo = 0; let bestCombo = 0; let visualColor = null; let wordColor = null;
    let highScore = Number(localStorage.getItem(highScoreKey)) || 0;
    const stage = document.getElementById("colorStage"); const wordElement = document.getElementById("colorWord"); const feedback = document.getElementById("colorFeedback"); const startButton = document.getElementById("colorStart"); const summary = document.getElementById("colorSummary");
    function shuffle(list) { const copy = [...list]; for (let index = copy.length - 1; index > 0; index -= 1) { const random = Math.floor(Math.random() * (index + 1)); [copy[index], copy[random]] = [copy[random], copy[index]]; } return copy; }
    function renderButtons() { answersElement.innerHTML = ""; shuffle(colors).forEach(color => { const button = document.createElement("button"); button.type = "button"; button.className = "color-answer"; button.dataset.color = color.id; button.textContent = color.word; button.disabled = !running; button.addEventListener("click", () => answer(color.id)); answersElement.appendChild(button); }); }
    function nextRound() { const previous = visualColor?.id; visualColor = colors[Math.floor(Math.random() * colors.length)]; const options = colors.filter(color => color.id !== visualColor.id); wordColor = options[Math.floor(Math.random() * options.length)]; if (wordColor.id === previous && options.length > 1) wordColor = options[(options.indexOf(wordColor) + 1) % options.length]; wordElement.textContent = wordColor.word; wordElement.style.color = visualColor.value; feedback.textContent = "Scegli il colore, non la parola"; renderButtons(); }
    function updateToolbar() { document.getElementById("colorTime").textContent = timeLeft; document.getElementById("colorScore").textContent = score; document.getElementById("colorCombo").textContent = combo; document.getElementById("colorProgress").style.width = `${(timeLeft / duration) * 100}%`; }
    function answer(id) { if (!running) return; const isCorrect = id === visualColor.id; let feedbackText = ""; if (isCorrect) { correct += 1; combo += 1; bestCombo = Math.max(bestCombo, combo); const points = 10 + Math.min(combo - 1, 10) * 2; score += points; feedbackText = `Corretto! +${points}`; stage.classList.remove("is-wrong"); stage.classList.add("is-correct"); } else { wrong += 1; combo = 0; score = Math.max(0, score - 3); feedbackText = "Ops! Guarda il colore del testo."; stage.classList.remove("is-correct"); stage.classList.add("is-wrong"); } updateToolbar(); window.setTimeout(() => stage.classList.remove("is-correct", "is-wrong"), 230); nextRound(); feedback.textContent = feedbackText; }
    function finish() { if (!running) return; running = false; window.clearInterval(timerId); timerId = null; document.querySelectorAll(".color-answer").forEach(button => { button.disabled = true; }); highScore = Math.max(highScore, score); localStorage.setItem(highScoreKey, String(highScore)); const total = correct + wrong; document.getElementById("summaryScore").textContent = score; document.getElementById("summaryCorrect").textContent = correct; document.getElementById("summaryWrong").textContent = wrong; document.getElementById("summaryAccuracy").textContent = `${total ? Math.round(correct / total * 100) : 0}%`; document.getElementById("summaryCombo").textContent = bestCombo; document.getElementById("summaryHighScore").textContent = highScore; summary.hidden = false; startButton.textContent = "Gioca ancora"; feedback.textContent = "Tempo scaduto."; }
    function start() { window.clearInterval(timerId); running = true; timeLeft = duration; score = 0; correct = 0; wrong = 0; combo = 0; bestCombo = 0; summary.hidden = true; startButton.textContent = "Ricomincia"; updateToolbar(); nextRound(); timerId = window.setInterval(() => { timeLeft -= 1; updateToolbar(); if (timeLeft <= 0) finish(); }, 1000); }
    startButton.addEventListener("click", start); document.getElementById("colorPlayAgain").addEventListener("click", start); updateToolbar(); nextRound();
})();
