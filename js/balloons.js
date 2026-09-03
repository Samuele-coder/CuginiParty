"use strict";


/* =========================================================
   DIFFICOLTÀ
========================================================= */

const BALLOONS_DIFFICULTIES = {

    easy: {
        name: "Facile",
        gameTime: 50,
        spawnEvery: 850,
        minFloatTime: 6.2,
        maxFloatTime: 8.5,
        maxOnScreen: 7,
        bombChance: 0.08
    },

    medium: {
        name: "Medio",
        gameTime: 45,
        spawnEvery: 650,
        minFloatTime: 5.0,
        maxFloatTime: 6.8,
        maxOnScreen: 9,
        bombChance: 0.12
    },

    hard: {
        name: "Difficile",
        gameTime: 40,
        spawnEvery: 480,
        minFloatTime: 3.9,
        maxFloatTime: 5.3,
        maxOnScreen: 11,
        bombChance: 0.16
    }

};


/* =========================================================
   DOM
========================================================= */

let balloonsStartScreen;
let balloonsGameScreen;
let balloonsEndScreen;

let balloonsStartButton;
let balloonsExitButton;
let balloonsAgainButton;
let balloonsMenuButton;

let balloonsDifficultyButtons;

let balloonsScoreElement;
let balloonsComboElement;
let balloonsPoppedElement;
let balloonsTimerElement;

let balloonsProgressFill;
let balloonsLevelElement;
let balloonsMessageElement;

let balloonsArena;
let balloonsContainer;

let balloonsPopFlash;
let balloonsComboPopup;

let balloonsEndIcon;
let balloonsEndTitle;
let balloonsEndMessage;

let balloonsFinalScore;
let balloonsFinalPopped;
let balloonsFinalCombo;
let balloonsFinalBombs;
let balloonsEndBadge;


/* =========================================================
   STATO
========================================================= */

let balloonsSelectedDifficulty = "easy";

let balloonsScore = 0;
let balloonsCombo = 0;
let balloonsBestCombo = 0;

let balloonsPopped = 0;
let balloonsBombsHit = 0;

let balloonsTimeRemaining = 0;
let balloonsLevel = 1;

let balloonsGameStarted = false;
let balloonsGameFinished = false;

let balloonsTimerInterval = null;
let balloonsSpawnInterval = null;

let balloonsActiveCount = 0;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeBalloons
);


function initializeBalloons() {

    balloonsStartScreen =
        document.getElementById(
            "balloonsStartScreen"
        );

    balloonsGameScreen =
        document.getElementById(
            "balloonsGameScreen"
        );

    balloonsEndScreen =
        document.getElementById(
            "balloonsEndScreen"
        );


    balloonsStartButton =
        document.getElementById(
            "balloonsStartButton"
        );

    balloonsExitButton =
        document.getElementById(
            "balloonsExitButton"
        );

    balloonsAgainButton =
        document.getElementById(
            "balloonsAgainButton"
        );

    balloonsMenuButton =
        document.getElementById(
            "balloonsMenuButton"
        );


    balloonsDifficultyButtons =
        document.querySelectorAll(
            ".balloons-difficulty"
        );


    balloonsScoreElement =
        document.getElementById(
            "balloonsScore"
        );

    balloonsComboElement =
        document.getElementById(
            "balloonsCombo"
        );

    balloonsPoppedElement =
        document.getElementById(
            "balloonsPopped"
        );

    balloonsTimerElement =
        document.getElementById(
            "balloonsTimer"
        );


    balloonsProgressFill =
        document.getElementById(
            "balloonsProgressFill"
        );

    balloonsLevelElement =
        document.getElementById(
            "balloonsLevel"
        );

    balloonsMessageElement =
        document.getElementById(
            "balloonsMessage"
        );


    balloonsArena =
        document.getElementById(
            "balloonsArena"
        );

    balloonsContainer =
        document.getElementById(
            "balloonsContainer"
        );


    balloonsPopFlash =
        document.getElementById(
            "balloonsPopFlash"
        );

    balloonsComboPopup =
        document.getElementById(
            "balloonsComboPopup"
        );


    balloonsEndIcon =
        document.getElementById(
            "balloonsEndIcon"
        );

    balloonsEndTitle =
        document.getElementById(
            "balloonsEndTitle"
        );

    balloonsEndMessage =
        document.getElementById(
            "balloonsEndMessage"
        );


    balloonsFinalScore =
        document.getElementById(
            "balloonsFinalScore"
        );

    balloonsFinalPopped =
        document.getElementById(
            "balloonsFinalPopped"
        );

    balloonsFinalCombo =
        document.getElementById(
            "balloonsFinalCombo"
        );

    balloonsFinalBombs =
        document.getElementById(
            "balloonsFinalBombs"
        );

    balloonsEndBadge =
        document.getElementById(
            "balloonsEndBadge"
        );


    if (!balloonsArena || !balloonsContainer) {
        return;
    }


    /*
     * Durante il gioco impediamo al browser
     * di interpretare il tocco come scroll/zoom.
     */
    balloonsArena.style.touchAction =
        "none";

    balloonsContainer.style.touchAction =
        "none";


    initializeBalloonsDifficulty();

    initializeBalloonsButtons();

    initializeBalloonsTouch();

    updateBalloonsHUD();

}


/* =========================================================
   TOUCH / MOUSE
========================================================= */

function initializeBalloonsTouch() {

    /*
     * Un solo sistema di input.
     *
     * Non ascoltiamo il click del singolo
     * palloncino.
     *
     * Intercettiamo il tocco a livello
     * document e troviamo il palloncino
     * più vicino.
     */

    document.addEventListener(
        "pointerdown",
        handleBalloonsPointerDown,
        {
            passive: false,
            capture: true
        }
    );

}


function handleBalloonsPointerDown(
    event
) {

    if (
        !balloonsGameStarted ||
        balloonsGameFinished ||
        !balloonsContainer ||
        !balloonsArena
    ) {
        return;
    }


    /*
     * Mouse:
     * accettiamo solo il tasto sinistro.
     */

    if (
        event.pointerType === "mouse" &&
        event.button !== 0
    ) {
        return;
    }


    /*
     * Coordinate del tocco.
     */

    const touchX =
        event.clientX;

    const touchY =
        event.clientY;


    const balloons =
        Array.from(
            balloonsContainer.querySelectorAll(
                ".play-balloon"
            )
        );


    if (
        balloons.length === 0
    ) {
        return;
    }


    let bestBalloon = null;
    let bestDistance = Infinity;


    balloons.forEach(
        balloon => {

            if (
                balloon.classList.contains(
                    "popping"
                )
            ) {
                return;
            }

            if (
                balloon.classList.contains(
                    "bomb-hit"
                )
            ) {
                return;
            }


            const rect =
                balloon.getBoundingClientRect();


            /*
             * Centro esatto del palloncino.
             */

            const centerX =
                rect.left +
                rect.width / 2;

            const centerY =
                rect.top +
                rect.height / 2;


            const dx =
                touchX - centerX;

            const dy =
                touchY - centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            const isBomb =
                balloon.dataset.type ===
                "bomb";


            /*
             * AREA DI TOCCO
             *
             * Normali:
             * molto generosa, pensata per
             * un bambino piccolo.
             *
             * Bombe:
             * più precisa.
             */

            const normalHitRadius =
                Math.max(
                    rect.width,
                    rect.height
                ) * 1.35;


            const bombHitRadius =
                Math.max(
                    rect.width,
                    rect.height
                ) * 0.55;


            const hitRadius =
                isBomb
                    ? bombHitRadius
                    : normalHitRadius;


            if (
                distance <= hitRadius &&
                distance < bestDistance
            ) {

                bestBalloon =
                    balloon;

                bestDistance =
                    distance;

            }

        }
    );


    if (!bestBalloon) {
        return;
    }


    /*
     * Evitiamo che il browser faccia
     * azioni indesiderate sul touch.
     */

    event.preventDefault();
    event.stopPropagation();


    /*
     * Bomba.
     */

    if (
        bestBalloon.dataset.type ===
        "bomb"
    ) {

        hitBomb(
            bestBalloon
        );

        return;
    }


    /*
     * Palloncino normale / bonus.
     */

    popBalloon(
        bestBalloon
    );

}


/* =========================================================
   DIFFICOLTÀ
========================================================= */

function initializeBalloonsDifficulty() {

    balloonsDifficultyButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const difficulty =
                        button.dataset.difficulty;


                    if (
                        !BALLOONS_DIFFICULTIES[
                            difficulty
                        ]
                    ) {
                        return;
                    }


                    balloonsSelectedDifficulty =
                        difficulty;


                    balloonsDifficultyButtons.forEach(
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

function initializeBalloonsButtons() {

    balloonsStartButton?.addEventListener(
        "click",
        startBalloonsGame
    );


    balloonsExitButton?.addEventListener(
        "click",
        showBalloonsMenu
    );


    balloonsAgainButton?.addEventListener(
        "click",
        startBalloonsGame
    );


    balloonsMenuButton?.addEventListener(
        "click",
        showBalloonsMenu
    );

}


/* =========================================================
   START GAME
========================================================= */

function startBalloonsGame() {

    stopBalloonsTimers();

    clearBalloonsContainer();


    balloonsScore = 0;
    balloonsCombo = 0;
    balloonsBestCombo = 0;

    balloonsPopped = 0;
    balloonsBombsHit = 0;

    balloonsLevel = 1;

    balloonsActiveCount = 0;

    balloonsGameStarted = true;
    balloonsGameFinished = false;


    const difficulty =
        getBalloonsDifficulty();


    balloonsTimeRemaining =
        difficulty.gameTime;


    if (balloonsStartScreen) {
        balloonsStartScreen.hidden = true;
    }


    if (balloonsEndScreen) {
        balloonsEndScreen.hidden = true;
    }


    if (balloonsGameScreen) {
        balloonsGameScreen.hidden = false;
    }


    updateBalloonsHUD();


    updateBalloonsMessage(
        "Scoppia più palloncini possibile!"
    );


    /*
     * Spawn iniziale.
     */

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        setTimeout(
            () => {

                if (
                    balloonsGameStarted &&
                    !balloonsGameFinished
                ) {

                    spawnBalloon();

                }

            },
            i * 180
        );

    }


    /*
     * Spawn continuo.
     */

    balloonsSpawnInterval =
        setInterval(
            () => {

                if (
                    !balloonsGameStarted ||
                    balloonsGameFinished
                ) {
                    return;
                }


                const currentDifficulty =
                    getBalloonsDifficulty();


                if (
                    balloonsActiveCount <
                    currentDifficulty.maxOnScreen
                ) {

                    spawnBalloon();

                }

            },
            difficulty.spawnEvery
        );


    /*
     * Timer.
     */

    balloonsTimerInterval =
        setInterval(
            () => {

                if (
                    !balloonsGameStarted ||
                    balloonsGameFinished
                ) {
                    return;
                }


                balloonsTimeRemaining--;


                balloonsTimeRemaining =
                    Math.max(
                        0,
                        balloonsTimeRemaining
                    );


                updateBalloonsHUD();


                if (
                    balloonsTimeRemaining <= 0
                ) {

                    finishBalloonsGame();

                }

            },
            1000
        );

}


/* =========================================================
   SPAWN BALLOON
========================================================= */

function spawnBalloon() {

    if (
        !balloonsContainer ||
        !balloonsGameStarted ||
        balloonsGameFinished
    ) {
        return;
    }


    const difficulty =
        getBalloonsDifficulty();


    if (
        balloonsActiveCount >=
        difficulty.maxOnScreen
    ) {
        return;
    }


    balloonsActiveCount++;


    const balloon =
        document.createElement(
            "div"
        );


    const type =
        getRandomBalloonType(
            difficulty
        );


    const size =
        randomNumber(
            55,
            82
        );


    const left =
        randomNumber(
            4,
            91
        );


    const floatTime =
        randomNumber(
            difficulty.minFloatTime,
            difficulty.maxFloatTime
        );


    const rotation =
        randomNumber(
            -5,
            5
        );


    balloon.className =
        `play-balloon ${type.className}`;


    balloon.dataset.type =
        type.type;


    balloon.dataset.value =
        String(
            type.value
        );


    balloon.style.setProperty(
        "--size",
        `${size}px`
    );


    balloon.style.setProperty(
        "--left",
        `${left}%`
    );


    balloon.style.setProperty(
        "--float-time",
        `${floatTime}s`
    );


    balloon.style.setProperty(
        "--rotation",
        `${rotation}deg`
    );


    balloon.innerHTML = `
        <span class="play-balloon-shape">
            <span class="play-balloon-highlight"></span>
        </span>
    `;


    /*
     * IMPORTANTE:
     *
     * Non allarghiamo il palloncino con
     * padding o margin.
     *
     * La sua dimensione visiva rimane
     * esattamente quella originale.
     *
     * La zona di tocco viene gestita
     * da handleBalloonsPointerDown().
     */


    balloon.addEventListener(
        "animationend",
        event => {

            if (
                event.animationName !==
                "balloonRise"
            ) {
                return;
            }


            removeBalloon(
                balloon
            );

        }
    );


    balloonsContainer.appendChild(
        balloon
    );

}


/* =========================================================
   RANDOM BALLOON TYPE
========================================================= */

function getRandomBalloonType(
    difficulty
) {

    /*
     * BOMBA
     */

    if (
        Math.random() <
        difficulty.bombChance
    ) {

        return {
            type: "bomb",
            className: "bomb",
            value: 0
        };

    }


    /*
     * RAINBOW
     */

    if (
        Math.random() <
        0.055
    ) {

        return {
            type: "rainbow",
            className: "rainbow",
            value: 80
        };

    }


    /*
     * GOLD
     */

    if (
        Math.random() <
        0.10
    ) {

        return {
            type: "gold",
            className: "gold",
            value: 35
        };

    }


    /*
     * BALLOON NORMALI
     */

    const colors = [
        "red",
        "blue",
        "yellow",
        "green",
        "purple",
        "orange"
    ];


    const color =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];


    return {
        type: "normal",
        className: color,
        value: 10
    };

}


/* =========================================================
   POP BALLOON
========================================================= */

function popBalloon(
    balloon
) {

    if (
        !balloon ||
        balloon.classList.contains(
            "popping"
        ) ||
        balloon.classList.contains(
            "bomb-hit"
        )
    ) {
        return;
    }


    const type =
        balloon.dataset.type;


    /*
     * BOMBA
     */

    if (
        type === "bomb"
    ) {

        hitBomb(
            balloon
        );

        return;

    }


    const baseValue =
        Number(
            balloon.dataset.value
        ) || 0;


    balloonsPopped++;

    balloonsCombo++;


    balloonsBestCombo =
        Math.max(
            balloonsBestCombo,
            balloonsCombo
        );


    /*
     * Bonus combo.
     */

    let multiplier = 1;


    if (
        balloonsCombo >= 3
    ) {

        multiplier +=
            Math.min(
                2,
                Math.floor(
                    balloonsCombo / 3
                ) * 0.25
            );

    }


    const earned =
        Math.round(
            baseValue *
            multiplier
        );


    balloonsScore +=
        earned;


    balloon.classList.add(
        "popping"
    );


    showPopEffect();


    showComboPopup(
        type,
        earned
    );


    updateBalloonsLevel();

    updateBalloonsHUD();


    setTimeout(
        () => {

            removeBalloon(
                balloon
            );

        },
        210
    );

}


/* =========================================================
   HIT BOMB
========================================================= */

function hitBomb(
    balloon
) {

    if (
        !balloon ||
        balloon.classList.contains(
            "bomb-hit"
        )
    ) {
        return;
    }


    balloonsBombsHit++;


    balloonsCombo = 0;


    balloonsScore =
        Math.max(
            0,
            balloonsScore - 50
        );


    balloon.classList.add(
        "bomb-hit"
    );


    showComboPopup(
        "bomb",
        -50
    );


    updateBalloonsMessage(
        "💣 Boom! Hai preso una bomba!"
    );


    updateBalloonsHUD();


    setTimeout(
        () => {

            removeBalloon(
                balloon
            );

        },
        290
    );

}


/* =========================================================
   REMOVE BALLOON
========================================================= */

function removeBalloon(
    balloon
) {

    if (
        !balloon ||
        !balloon.parentElement
    ) {
        return;
    }


    balloon.remove();


    balloonsActiveCount =
        Math.max(
            0,
            balloonsActiveCount - 1
        );

}


/* =========================================================
   LEVEL
========================================================= */

function updateBalloonsLevel() {

    const newLevel =
        Math.floor(
            balloonsPopped / 10
        ) + 1;


    if (
        newLevel ===
        balloonsLevel
    ) {
        return;
    }


    balloonsLevel =
        newLevel;


    updateBalloonsMessage(
        `⚡ Livello ${balloonsLevel}! Vanno più veloci!`
    );

}


/* =========================================================
   HUD
========================================================= */

function updateBalloonsHUD() {

    if (balloonsScoreElement) {

        balloonsScoreElement.textContent =
            formatNumber(
                balloonsScore
            );

    }


    if (balloonsComboElement) {

        balloonsComboElement.textContent =
            `x${balloonsCombo}`;

    }


    if (balloonsPoppedElement) {

        balloonsPoppedElement.textContent =
            String(
                balloonsPopped
            );

    }


    if (balloonsTimerElement) {

        balloonsTimerElement.textContent =
            String(
                balloonsTimeRemaining
            );

    }


    if (
        balloonsProgressFill
    ) {

        const difficulty =
            getBalloonsDifficulty();


        const percentage =
            (
                balloonsTimeRemaining /
                difficulty.gameTime
            ) * 100;


        balloonsProgressFill.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    percentage
                )
            )}%`;

    }


    if (
        balloonsLevelElement
    ) {

        balloonsLevelElement.textContent =
            String(
                balloonsLevel
            );

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function updateBalloonsMessage(
    message
) {

    if (!balloonsMessageElement) {
        return;
    }


    balloonsMessageElement.textContent =
        message;

}


/* =========================================================
   POP FLASH
========================================================= */

function showPopEffect() {

    if (!balloonsPopFlash) {
        return;
    }


    balloonsPopFlash.classList.remove(
        "active"
    );


    void balloonsPopFlash.offsetWidth;


    balloonsPopFlash.classList.add(
        "active"
    );

}


/* =========================================================
   COMBO POPUP
========================================================= */

function showComboPopup(
    type,
    earned
) {

    if (!balloonsComboPopup) {
        return;
    }


    if (
        type === "bomb"
    ) {

        balloonsComboPopup.textContent =
            "💣 -50";

    } else if (
        type === "rainbow"
    ) {

        balloonsComboPopup.textContent =
            `🌈 +${earned}`;

    } else if (
        type === "gold"
    ) {

        balloonsComboPopup.textContent =
            `⭐ +${earned}`;

    } else if (
        balloonsCombo >= 5
    ) {

        balloonsComboPopup.textContent =
            `🔥 COMBO x${balloonsCombo}`;

    } else {

        balloonsComboPopup.textContent =
            `+${earned}`;

    }


    balloonsComboPopup.classList.remove(
        "active"
    );


    void balloonsComboPopup.offsetWidth;


    balloonsComboPopup.classList.add(
        "active"
    );

}


/* =========================================================
   FINISH
========================================================= */

function finishBalloonsGame() {

    if (
        balloonsGameFinished
    ) {
        return;
    }


    balloonsGameFinished = true;
    balloonsGameStarted = false;


    stopBalloonsTimers();

    clearBalloonsContainer();


    if (balloonsGameScreen) {

        balloonsGameScreen.hidden =
            true;

    }


    if (balloonsEndScreen) {

        balloonsEndScreen.hidden =
            false;

    }


    const performance =
        getBalloonsPerformance();


    if (balloonsEndIcon) {

        balloonsEndIcon.textContent =
            performance.icon;

    }


    if (balloonsEndTitle) {

        balloonsEndTitle.textContent =
            performance.title;

    }


    if (balloonsEndMessage) {

        balloonsEndMessage.textContent =
            performance.message;

    }


    if (balloonsFinalScore) {

        balloonsFinalScore.textContent =
            formatNumber(
                balloonsScore
            );

    }


    if (balloonsFinalPopped) {

        balloonsFinalPopped.textContent =
            String(
                balloonsPopped
            );

    }


    if (balloonsFinalCombo) {

        balloonsFinalCombo.textContent =
            `x${balloonsBestCombo}`;

    }


    if (balloonsFinalBombs) {

        balloonsFinalBombs.textContent =
            String(
                balloonsBombsHit
            );

    }


    if (balloonsEndBadge) {

        balloonsEndBadge.textContent =
            performance.badge;

    }

}


/* =========================================================
   PERFORMANCE
========================================================= */

function getBalloonsPerformance() {

    if (
        balloonsScore >= 2500
    ) {

        return {

            icon: "👑",

            title: "SEI UN MOSTRO!",

            message:
                "Hai fatto un punteggio assurdo. Nessun palloncino era al sicuro.",

            badge:
                "👑 Balloon Legend"

        };

    }


    if (
        balloonsScore >= 1700
    ) {

        return {

            icon: "🏆",

            title: "Grandissimo!",

            message:
                "Hai dominato il campo dei palloncini.",

            badge:
                "🔥 Balloon Master"

        };

    }


    if (
        balloonsScore >= 1000
    ) {

        return {

            icon: "⭐",

            title: "Ottimo lavoro!",

            message:
                "Hai una bella mano con i palloncini.",

            badge:
                "🎈 Balloon Pro"

        };

    }


    if (
        balloonsScore >= 500
    ) {

        return {

            icon: "👏",

            title: "Bel risultato!",

            message:
                "Ancora qualche combo e puoi fare ancora meglio.",

            badge:
                "🎈 Balloon Hunter"

        };

    }


    return {

        icon: "🎈",

        title: "Puoi fare di meglio!",

        message:
            "Prova a rischiare un po' di più e cerca i palloncini bonus.",

        badge:
            "💪 Balloon Rookie"

    };

}


/* =========================================================
   MENU
========================================================= */

function showBalloonsMenu() {

    stopBalloonsTimers();

    clearBalloonsContainer();


    balloonsGameStarted = false;
    balloonsGameFinished = false;


    if (balloonsGameScreen) {

        balloonsGameScreen.hidden =
            true;

    }


    if (balloonsEndScreen) {

        balloonsEndScreen.hidden =
            true;

    }


    if (balloonsStartScreen) {

        balloonsStartScreen.hidden =
            false;

    }

}


/* =========================================================
   STOP TIMERS
========================================================= */

function stopBalloonsTimers() {

    if (
        balloonsTimerInterval !==
        null
    ) {

        clearInterval(
            balloonsTimerInterval
        );

        balloonsTimerInterval =
            null;

    }


    if (
        balloonsSpawnInterval !==
        null
    ) {

        clearInterval(
            balloonsSpawnInterval
        );

        balloonsSpawnInterval =
            null;

    }

}


/* =========================================================
   CLEAR ARENA
========================================================= */

function clearBalloonsContainer() {

    if (balloonsContainer) {

        balloonsContainer.innerHTML =
            "";

    }


    balloonsActiveCount =
        0;

}


/* =========================================================
   GET DIFFICULTY
========================================================= */

function getBalloonsDifficulty() {

    return BALLOONS_DIFFICULTIES[
        balloonsSelectedDifficulty
    ];

}


/* =========================================================
   RANDOM NUMBER
========================================================= */

function randomNumber(
    min,
    max
) {

    return Math.random() *
        (max - min) +
        min;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "it-IT"
    ).format(
        value
    );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            balloonsGameStarted &&
            !balloonsGameFinished
        ) {

            showBalloonsMenu();

        }

    }
);