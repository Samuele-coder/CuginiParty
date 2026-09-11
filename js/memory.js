"use strict";


/* =========================================================
   CONFIGURAZIONE
   ========================================================= */

const MEMORY_DIFFICULTIES = {

    easy: {
        name: "Facile",
        rows: 4,
        columns: 4,
        pairs: 8,
        timeMultiplier: 1
    },

    medium: {
        name: "Medio",
        rows: 4,
        columns: 5,
        pairs: 10,
        timeMultiplier: 1.25
    },

    hard: {
        name: "Difficile",
        rows: 6,
        columns: 6,
        pairs: 18,
        timeMultiplier: 1.55
    }

};


const MEMORY_SYMBOLS = [

    "🍕",
    "🍔",
    "🍟",
    "🍩",
    "🍦",
    "🍪",
    "🍉",
    "🍓",
    "🍒",
    "🍋",
    "🥝",
    "🍇",
    "⚽",
    "🏀",
    "🎮",
    "🎧",
    "🎸",
    "🎯",
    "🚗",
    "🚀",
    "🐶",
    "🐱",
    "🦊",
    "🐼",
    "🐸",
    "🦄",
    "🐳",
    "🦖",
    "🌈",
    "🔥",
    "⭐",
    "💎",
    "👑",
    "🎁",
    "❤️",
    "💜",
    "💙",
    "💚"

];


/* =========================================================
   DOM
   ========================================================= */

let memoryStartScreen;
let memoryGameScreen;
let memoryVictoryScreen;

let memoryStartButton;
let memoryAgainButton;
let memoryMenuButton;
let memoryBackButton;

let memoryDifficultySelector;
let memoryDifficultyLabel;

let memoryBoard;

let memoryTimeElement;
let memoryMovesElement;
let memoryPairsElement;
let memoryScoreElement;

let memoryProgressBar;

let memoryFinalTimeElement;
let memoryFinalMovesElement;
let memoryFinalScoreElement;
let memoryFinalDifficultyElement;
let memoryPerformanceBadge;


/* =========================================================
   STATO
   ========================================================= */

let memorySelectedDifficulty = "easy";

let memoryCards = [];

let memoryFirstCard = null;
let memorySecondCard = null;

let memoryLocked = false;

let memoryMoves = 0;
let memoryMatchedPairs = 0;
let memoryScore = 0;

let memoryElapsedSeconds = 0;

let memoryTimerInterval = null;

let memoryGameStarted = false;
let memoryGameFinished = false;


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeMemory
);


function initializeMemory() {

    memoryStartScreen =
        document.getElementById(
            "memoryStartScreen"
        );

    memoryGameScreen =
        document.getElementById(
            "memoryGameScreen"
        );

    memoryVictoryScreen =
        document.getElementById(
            "memoryVictoryScreen"
        );


    memoryStartButton =
        document.getElementById(
            "memoryStartButton"
        );

    memoryAgainButton =
        document.getElementById(
            "memoryAgainButton"
        );

    memoryMenuButton =
        document.getElementById(
            "memoryMenuButton"
        );

    memoryBackButton =
        document.getElementById(
            "memoryBackButton"
        );


    memoryDifficultySelector =
        document.getElementById(
            "memoryDifficultySelector"
        );

    memoryDifficultyLabel =
        document.getElementById(
            "memoryDifficultyLabel"
        );


    memoryBoard =
        document.getElementById(
            "memoryBoard"
        );


    memoryTimeElement =
        document.getElementById(
            "memoryTime"
        );

    memoryMovesElement =
        document.getElementById(
            "memoryMoves"
        );

    memoryPairsElement =
        document.getElementById(
            "memoryPairs"
        );

    memoryScoreElement =
        document.getElementById(
            "memoryScore"
        );


    memoryProgressBar =
        document.getElementById(
            "memoryProgressBar"
        );


    memoryFinalTimeElement =
        document.getElementById(
            "memoryFinalTime"
        );

    memoryFinalMovesElement =
        document.getElementById(
            "memoryFinalMoves"
        );

    memoryFinalScoreElement =
        document.getElementById(
            "memoryFinalScore"
        );

    memoryFinalDifficultyElement =
        document.getElementById(
            "memoryFinalDifficulty"
        );

    memoryPerformanceBadge =
        document.getElementById(
            "memoryPerformanceBadge"
        );


    if (!memoryBoard) {
        return;
    }


    initializeDifficultySelection();

    initializeMemoryButtons();

}


/* =========================================================
   DIFFICOLTÀ
   ========================================================= */

function initializeDifficultySelection() {

    if (!memoryDifficultySelector) {
        return;
    }


    const difficultyButtons =
        memoryDifficultySelector.querySelectorAll(
            "[data-difficulty]"
        );


    difficultyButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const difficulty =
                        button.dataset.difficulty;


                    if (
                        !MEMORY_DIFFICULTIES[
                            difficulty
                        ]
                    ) {

                        return;

                    }


                    memorySelectedDifficulty =
                        difficulty;


                    difficultyButtons.forEach(
                        item => {

                            item.classList.toggle(
                                "selected",
                                item === button
                            );

                        }
                    );

                }
            );

        }
    );

}


/* =========================================================
   BUTTONS
   ========================================================= */

function initializeMemoryButtons() {

    if (memoryStartButton) {

        memoryStartButton.addEventListener(
            "click",
            startMemoryGame
        );

    }


    if (memoryAgainButton) {

        memoryAgainButton.addEventListener(
            "click",
            startMemoryGame
        );

    }


    if (memoryMenuButton) {

        memoryMenuButton.addEventListener(
            "click",
            showMemoryMenu
        );

    }


    if (memoryBackButton) {

        memoryBackButton.addEventListener(
            "click",
            showMemoryMenu
        );

    }

}


/* =========================================================
   START
   ========================================================= */

function startMemoryGame() {

    stopMemoryTimer();


    const difficulty =
        MEMORY_DIFFICULTIES[
            memorySelectedDifficulty
        ];


    if (!difficulty) {
        return;
    }


    memoryGameStarted = true;
    memoryGameFinished = false;

    memoryLocked = false;

    memoryFirstCard = null;
    memorySecondCard = null;

    memoryMoves = 0;
    memoryMatchedPairs = 0;
    memoryScore = 0;

    memoryElapsedSeconds = 0;


    if (memoryStartScreen) {
        memoryStartScreen.hidden = true;
    }


    if (memoryVictoryScreen) {
        memoryVictoryScreen.hidden = true;
    }


    if (memoryGameScreen) {
        memoryGameScreen.hidden = false;
    }


    if (memoryDifficultyLabel) {

        memoryDifficultyLabel.textContent =
            difficulty.name;

    }


    setupMemoryBoard(
        difficulty
    );


    updateMemoryHUD();

    startMemoryTimer();

}


/* =========================================================
   SETUP BOARD
   ========================================================= */

function setupMemoryBoard(
    difficulty
) {

    if (!memoryBoard) {
        return;
    }


    memoryCards = [];


    memoryBoard.className =
        "memory-board";


    if (
        memorySelectedDifficulty ===
        "easy"
    ) {

        memoryBoard.classList.add(
            "easy"
        );

    } else if (
        memorySelectedDifficulty ===
        "medium"
    ) {

        memoryBoard.classList.add(
            "medium"
        );

    } else {

        memoryBoard.classList.add(
            "hard"
        );

    }


    const symbols =
        MEMORY_SYMBOLS.slice(
            0,
            difficulty.pairs
        );


    const deck = [];


    symbols.forEach(
        (
            symbol,
            pairIndex
        ) => {

            deck.push({

                id:
                    `${pairIndex}-a`,

                pairId:
                    pairIndex,

                symbol

            });


            deck.push({

                id:
                    `${pairIndex}-b`,

                pairId:
                    pairIndex,

                symbol

            });

        }
    );


    shuffleArray(
        deck
    );


    memoryBoard.innerHTML = "";


    deck.forEach(
        cardData => {

            const card =
                createMemoryCard(
                    cardData
                );


            memoryBoard.appendChild(
                card
            );


            memoryCards.push({
                element: card,
                ...cardData
            });

        }
    );


    updateMemoryProgress();

}


/* =========================================================
   CREATE CARD
   ========================================================= */

function createMemoryCard(
    cardData
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";

    button.className =
        "memory-card";

    button.dataset.pairId =
        String(
            cardData.pairId
        );

    button.setAttribute(
        "aria-label",
        "Carta coperta"
    );


    button.innerHTML = `
        <span class="memory-card-inner">

            <span class="memory-card-face memory-card-back">
                🧠
            </span>

            <span class="memory-card-face memory-card-front">
                ${cardData.symbol}
            </span>

        </span>
    `;


    button.addEventListener(
        "click",
        () => {

            handleMemoryCardClick(
                button
            );

        }
    );


    return button;

}


/* =========================================================
   CLICK CARD
   ========================================================= */

function handleMemoryCardClick(
    cardElement
) {

    if (
        memoryLocked ||
        memoryGameFinished
    ) {

        return;

    }


    if (
        cardElement.classList.contains(
            "flipped"
        ) ||
        cardElement.classList.contains(
            "matched"
        )
    ) {

        return;

    }


    if (
        memoryFirstCard ===
        cardElement
    ) {

        return;

    }


    flipMemoryCard(
        cardElement
    );


    if (!memoryFirstCard) {

        memoryFirstCard =
            cardElement;

        return;

    }


    memorySecondCard =
        cardElement;


    memoryMoves++;


    updateMemoryHUD();


    const firstPair =
        memoryFirstCard.dataset.pairId;

    const secondPair =
        memorySecondCard.dataset.pairId;


    if (
        firstPair ===
        secondPair
    ) {

        handleMemoryMatch();

    } else {

        handleMemoryMismatch();

    }

}


/* =========================================================
   FLIP
   ========================================================= */

function flipMemoryCard(
    cardElement
) {

    cardElement.classList.add(
        "flipped"
    );


    cardElement.setAttribute(
        "aria-label",
        "Carta scoperta"
    );

}


/* =========================================================
   MATCH
   ========================================================= */

function handleMemoryMatch() {

    const first =
        memoryFirstCard;

    const second =
        memorySecondCard;


    first.classList.add(
        "matched"
    );

    second.classList.add(
        "matched"
    );


    first.disabled = true;
    second.disabled = true;


    memoryMatchedPairs++;


    addMemoryMatchScore();


    memoryFirstCard = null;
    memorySecondCard = null;


    updateMemoryHUD();


    if (
        memoryMatchedPairs >=
        getCurrentDifficulty().pairs
    ) {

        finishMemoryGame();

    }

}


/* =========================================================
   MISMATCH
   ========================================================= */

function handleMemoryMismatch() {

    const first =
        memoryFirstCard;

    const second =
        memorySecondCard;


    memoryLocked = true;


    first.classList.add(
        "wrong"
    );

    second.classList.add(
        "wrong"
    );


    setTimeout(
        () => {

            first.classList.remove(
                "wrong"
            );

            second.classList.remove(
                "wrong"
            );


            first.classList.remove(
                "flipped"
            );

            second.classList.remove(
                "flipped"
            );


            first.setAttribute(
                "aria-label",
                "Carta coperta"
            );

            second.setAttribute(
                "aria-label",
                "Carta coperta"
            );


            memoryFirstCard = null;
            memorySecondCard = null;

            memoryLocked = false;

        },
        720
    );

}


/* =========================================================
   SCORE
   ========================================================= */

function addMemoryMatchScore() {

    const difficulty =
        getCurrentDifficulty();


    let matchPoints;


    if (
        memorySelectedDifficulty ===
        "easy"
    ) {

        matchPoints = 100;

    } else if (
        memorySelectedDifficulty ===
        "medium"
    ) {

        matchPoints = 140;

    } else {

        matchPoints = 190;

    }


    const efficiency =
        Math.max(
            0.35,
            1 -
            (
                memoryMoves -
                memoryMatchedPairs
            ) *
            0.025
        );


    matchPoints =
        Math.round(
            matchPoints *
            efficiency
        );


    memoryScore +=
        matchPoints;


    updateMemoryProgress();

}


/* =========================================================
   CURRENT DIFFICULTY
   ========================================================= */

function getCurrentDifficulty() {

    return MEMORY_DIFFICULTIES[
        memorySelectedDifficulty
    ];

}


/* =========================================================
   TIMER
   ========================================================= */

function startMemoryTimer() {

    stopMemoryTimer();


    memoryTimerInterval =
        setInterval(
            () => {

                if (
                    !memoryGameStarted ||
                    memoryGameFinished
                ) {

                    return;

                }


                memoryElapsedSeconds++;


                updateMemoryTime();

            },
            1000
        );

}


function stopMemoryTimer() {

    if (
        memoryTimerInterval !==
        null
    ) {

        clearInterval(
            memoryTimerInterval
        );

        memoryTimerInterval =
            null;

    }

}


/* =========================================================
   TIME
   ========================================================= */

function updateMemoryTime() {

    if (!memoryTimeElement) {
        return;
    }


    memoryTimeElement.textContent =
        formatMemoryTime(
            memoryElapsedSeconds
        );

}


function formatMemoryTime(
    totalSeconds
) {

    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds %
        60;


    return (
        String(minutes).padStart(
            2,
            "0"
        ) +
        ":" +
        String(seconds).padStart(
            2,
            "0"
        )
    );

}


/* =========================================================
   HUD
   ========================================================= */

function updateMemoryHUD() {

    updateMemoryTime();


    if (memoryMovesElement) {

        memoryMovesElement.textContent =
            String(
                memoryMoves
            );

    }


    if (memoryPairsElement) {

        memoryPairsElement.textContent =
            `${memoryMatchedPairs} / ${
                getCurrentDifficulty().pairs
            }`;

    }


    if (memoryScoreElement) {

        memoryScoreElement.textContent =
            String(
                memoryScore
            );

    }


    updateMemoryProgress();

}


function updateMemoryProgress() {

    if (!memoryProgressBar) {
        return;
    }


    const difficulty =
        getCurrentDifficulty();


    const progress =
        (
            memoryMatchedPairs /
            difficulty.pairs
        ) *
        100;


    memoryProgressBar.style.width =
        `${progress}%`;

}


/* =========================================================
   FINISH
   ========================================================= */

function finishMemoryGame() {

    if (memoryGameFinished) {
        return;
    }


    memoryGameFinished = true;
    memoryGameStarted = false;


    stopMemoryTimer();


    const difficulty =
        getCurrentDifficulty();


    memoryScore =
        calculateFinalMemoryScore(
            difficulty
        );


    if (memoryFinalTimeElement) {

        memoryFinalTimeElement.textContent =
            formatMemoryTime(
                memoryElapsedSeconds
            );

    }


    if (memoryFinalMovesElement) {

        memoryFinalMovesElement.textContent =
            String(
                memoryMoves
            );

    }


    if (memoryFinalScoreElement) {

        memoryFinalScoreElement.textContent =
            String(
                memoryScore
            );

    }


    if (memoryFinalDifficultyElement) {

        memoryFinalDifficultyElement.textContent =
            difficulty.name;

    }


    updateMemoryPerformance(
        difficulty
    );


    if (memoryGameScreen) {
        memoryGameScreen.hidden = true;
    }


    if (memoryVictoryScreen) {
        memoryVictoryScreen.hidden = false;
    }

}


/* =========================================================
   FINAL SCORE
   ========================================================= */

function calculateFinalMemoryScore(
    difficulty
) {

    const timePenalty =
        Math.floor(
            memoryElapsedSeconds *
            (
                memorySelectedDifficulty ===
                "easy"
                    ? 1.2
                    : memorySelectedDifficulty ===
                        "medium"
                        ? 1.5
                        : 1.9
            )
        );


    const movePenalty =
        Math.max(
            0,
            memoryMoves -
            difficulty.pairs
        ) *
        (
            memorySelectedDifficulty ===
            "easy"
                ? 8
                : memorySelectedDifficulty ===
                    "medium"
                    ? 10
                    : 13
        );


    return Math.max(
        0,
        memoryScore -
        timePenalty -
        movePenalty +
        difficulty.pairs * 25
    );

}


/* =========================================================
   PERFORMANCE
   ========================================================= */

function updateMemoryPerformance(
    difficulty
) {

    if (!memoryPerformanceBadge) {
        return;
    }


    const idealMoves =
        difficulty.pairs;


    const extraMoves =
        memoryMoves -
        idealMoves;


    const averageTime =
        memoryElapsedSeconds /
        Math.max(
            1,
            difficulty.pairs
        );


    let message;


    if (
        extraMoves <= 2 &&
        averageTime < 4
    ) {

        message =
            "🧠 Memoria fenomenale!";

    } else if (
        extraMoves <= 5 &&
        averageTime < 7
    ) {

        message =
            "🔥 Partita fantastica!";

    } else if (
        extraMoves <= 10
    ) {

        message =
            "👏 Bel lavoro!";

    } else {

        message =
            "💪 Continua ad allenarti!";

    }


    memoryPerformanceBadge.textContent =
        message;

}


/* =========================================================
   MENU
   ========================================================= */

function showMemoryMenu() {

    stopMemoryTimer();


    memoryGameStarted = false;
    memoryGameFinished = false;

    memoryLocked = false;

    memoryFirstCard = null;
    memorySecondCard = null;


    if (memoryGameScreen) {
        memoryGameScreen.hidden = true;
    }


    if (memoryVictoryScreen) {
        memoryVictoryScreen.hidden = true;
    }


    if (memoryStartScreen) {
        memoryStartScreen.hidden = false;
    }

}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffleArray(
    array
) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (
                    i + 1
                )
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}