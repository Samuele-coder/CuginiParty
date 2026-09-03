"use strict";


/* =========================================================
   CONFIGURAZIONE
========================================================= */

const AQUARIUM_GAME_TIME = 60;

const AQUARIUM_FISH = [
    "🐠",
    "🐟",
    "🐡",
    "🦈",
    "🐬",
    "🐳"
];

const AQUARIUM_OBJECT_TYPES = {
    star: {
        value: 25
    },

    goldStar: {
        value: 60
    },

    treasure: {
        value: 150
    },

    bubble: {
        value: 10
    }
};


/* =========================================================
   DOM
========================================================= */

let aquariumStartScreen;
let aquariumGameScreen;
let aquariumEndScreen;

let aquariumStartButton;
let aquariumGameExitButton;
let aquariumAgainButton;

let aquariumScoreElement;
let aquariumComboElement;
let aquariumTreasuresElement;
let aquariumTimerElement;

let aquariumMessageElement;
let aquariumLevelElement;
let aquariumProgressFill;

let aquariumArena;
let aquariumObjects;
let aquariumEffects;
let aquariumTouchHint;

let aquariumEndIcon;
let aquariumEndTitle;
let aquariumEndMessage;

let aquariumFinalScore;
let aquariumFinalCombo;
let aquariumFinalTreasures;
let aquariumEndBadge;


/* =========================================================
   STATO
========================================================= */

let aquariumScore = 0;
let aquariumCombo = 0;
let aquariumBestCombo = 0;

let aquariumTreasures = 0;

let aquariumTimeRemaining =
    AQUARIUM_GAME_TIME;

let aquariumLevel = 1;

let aquariumGameStarted = false;
let aquariumGameFinished = false;

let aquariumTimerInterval = null;
let aquariumSpawnInterval = null;

let aquariumObjectsCount = 0;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAquarium
);


function initializeAquarium() {

    aquariumStartScreen =
        document.getElementById(
            "aquariumStartScreen"
        );

    aquariumGameScreen =
        document.getElementById(
            "aquariumGameScreen"
        );

    aquariumEndScreen =
        document.getElementById(
            "aquariumEndScreen"
        );


    aquariumStartButton =
        document.getElementById(
            "aquariumStartButton"
        );

    aquariumGameExitButton =
        document.getElementById(
            "aquariumGameExitButton"
        );

    aquariumAgainButton =
        document.getElementById(
            "aquariumAgainButton"
        );


    aquariumScoreElement =
        document.getElementById(
            "aquariumScore"
        );

    aquariumComboElement =
        document.getElementById(
            "aquariumCombo"
        );

    aquariumTreasuresElement =
        document.getElementById(
            "aquariumTreasures"
        );

    aquariumTimerElement =
        document.getElementById(
            "aquariumTimer"
        );


    aquariumMessageElement =
        document.getElementById(
            "aquariumMessage"
        );

    aquariumLevelElement =
        document.getElementById(
            "aquariumLevel"
        );

    aquariumProgressFill =
        document.getElementById(
            "aquariumProgressFill"
        );


    aquariumArena =
        document.getElementById(
            "aquariumArena"
        );

    aquariumObjects =
        document.getElementById(
            "aquariumObjects"
        );

    aquariumEffects =
        document.getElementById(
            "aquariumEffects"
        );

    aquariumTouchHint =
        document.getElementById(
            "aquariumTouchHint"
        );


    aquariumEndIcon =
        document.getElementById(
            "aquariumEndIcon"
        );

    aquariumEndTitle =
        document.getElementById(
            "aquariumEndTitle"
        );

    aquariumEndMessage =
        document.getElementById(
            "aquariumEndMessage"
        );


    aquariumFinalScore =
        document.getElementById(
            "aquariumFinalScore"
        );

    aquariumFinalCombo =
        document.getElementById(
            "aquariumFinalCombo"
        );

    aquariumFinalTreasures =
        document.getElementById(
            "aquariumFinalTreasures"
        );

    aquariumEndBadge =
        document.getElementById(
            "aquariumEndBadge"
        );


    if (
        !aquariumArena ||
        !aquariumObjects
    ) {
        return;
    }


    aquariumArena.style.touchAction =
        "none";


    initializeAquariumButtons();

    initializeAquariumTouch();

    updateAquariumHUD();

}


/* =========================================================
   BUTTONS
========================================================= */

function initializeAquariumButtons() {

    /*
     * Entra nell'acquario.
     */

    aquariumStartButton?.addEventListener(
        "click",
        startAquariumGame
    );


    /*
     * Esci durante il gioco:
     * torna alla schermata iniziale
     * dell'Acquario.
     */

    aquariumGameExitButton?.addEventListener(
        "click",
        showAquariumMenu
    );


    /*
     * Gioca ancora:
     * nuova partita.
     */

    aquariumAgainButton?.addEventListener(
        "click",
        startAquariumGame
    );

}


/* =========================================================
   INPUT
========================================================= */

function initializeAquariumTouch() {

    aquariumArena.addEventListener(
        "pointerdown",
        handleAquariumPointerDown,
        {
            passive: false
        }
    );

}


function handleAquariumPointerDown(
    event
) {

    if (
        !aquariumGameStarted ||
        aquariumGameFinished
    ) {
        return;
    }


    if (
        event.pointerType === "mouse" &&
        event.button !== 0
    ) {
        return;
    }


    const touchX =
        event.clientX;

    const touchY =
        event.clientY;


    const objects =
        Array.from(
            aquariumObjects.querySelectorAll(
                ".aquarium-object"
            )
        );


    let closestObject = null;
    let closestDistance = Infinity;


    objects.forEach(
        object => {

            if (
                object.dataset.active !== "true"
            ) {
                return;
            }


            const objectRect =
                object.getBoundingClientRect();


            const centerX =
                objectRect.left +
                objectRect.width / 2;

            const centerY =
                objectRect.top +
                objectRect.height / 2;


            const dx =
                touchX - centerX;

            const dy =
                touchY - centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            const type =
                object.dataset.type;


            let hitRadius = 55;


            if (
                type === "treasure"
            ) {
                hitRadius = 75;
            }


            if (
                type === "goldStar"
            ) {
                hitRadius = 65;
            }


            if (
                distance <= hitRadius &&
                distance < closestDistance
            ) {

                closestObject =
                    object;

                closestDistance =
                    distance;

            }

        }
    );


    if (!closestObject) {
        return;
    }


    event.preventDefault();
    event.stopPropagation();


    collectAquariumObject(
        closestObject
    );

}


/* =========================================================
   START
========================================================= */

function startAquariumGame() {

    stopAquariumTimers();

    clearAquariumObjects();


    aquariumScore = 0;
    aquariumCombo = 0;
    aquariumBestCombo = 0;

    aquariumTreasures = 0;

    aquariumLevel = 1;

    aquariumTimeRemaining =
        AQUARIUM_GAME_TIME;

    aquariumObjectsCount = 0;

    aquariumGameStarted = true;
    aquariumGameFinished = false;


    if (aquariumStartScreen) {
        aquariumStartScreen.hidden = true;
    }

    if (aquariumEndScreen) {
        aquariumEndScreen.hidden = true;
    }

    if (aquariumGameScreen) {
        aquariumGameScreen.hidden = false;
    }


    if (aquariumTouchHint) {

        aquariumTouchHint.hidden = false;

        setTimeout(
            () => {

                if (
                    aquariumTouchHint
                ) {

                    aquariumTouchHint.hidden =
                        true;

                }

            },
            4000
        );

    }


    updateAquariumMessage(
        "Trova le stelle magiche! ✨"
    );


    updateAquariumHUD();


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        createFish(true);

    }


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        createMagicStar();

    }


    createBubble();
    createBubble();


    aquariumSpawnInterval =
        setInterval(
            () => {

                if (
                    !aquariumGameStarted ||
                    aquariumGameFinished
                ) {
                    return;
                }

                spawnAquariumObject();

            },
            1300
        );


    aquariumTimerInterval =
        setInterval(
            () => {

                if (
                    !aquariumGameStarted ||
                    aquariumGameFinished
                ) {
                    return;
                }


                aquariumTimeRemaining--;


                aquariumTimeRemaining =
                    Math.max(
                        0,
                        aquariumTimeRemaining
                    );


                updateAquariumHUD();


                if (
                    aquariumTimeRemaining <= 0
                ) {

                    finishAquariumGame();

                }

            },
            1000
        );

}


/* =========================================================
   FISH
========================================================= */

function createFish(
    initial = false
) {

    const fish =
        document.createElement(
            "div"
        );


    const size =
        randomNumber(
            47,
            78
        );


    const x =
        randomNumber(
            7,
            93
        );


    const y =
        randomNumber(
            20,
            74
        );


    const swimTime =
        randomNumber(
            4.5,
            8.5
        );


    const emoji =
        AQUARIUM_FISH[
            Math.floor(
                Math.random() *
                AQUARIUM_FISH.length
            )
        ];


    fish.className =
        "aquarium-object aquarium-fish";


    fish.dataset.type =
        "fish";


    fish.dataset.active =
        "true";


    fish.style.setProperty(
        "--x",
        `${x}%`
    );

    fish.style.setProperty(
        "--y",
        `${y}%`
    );

    fish.style.setProperty(
        "--size",
        `${size + 25}px`
    );

    fish.style.setProperty(
        "--fish-size",
        `${size}px`
    );

    fish.style.setProperty(
        "--swim-time",
        `${swimTime}s`
    );


    fish.innerHTML = `
        <span class="aquarium-fish-emoji">
            ${emoji}
        </span>
    `;


    fish.dataset.value =
        initial
            ? "5"
            : String(
                Math.random() < .18
                    ? 20
                    : 5
            );


    aquariumObjects.appendChild(
        fish
    );

    aquariumObjectsCount++;

}


/* =========================================================
   STELLA
========================================================= */

function createMagicStar() {

    const star =
        document.createElement(
            "div"
        );


    const isGold =
        Math.random() < 0.18;


    const x =
        randomNumber(
            8,
            92
        );


    const y =
        randomNumber(
            18,
            70
        );


    star.className =
        `aquarium-object aquarium-star ${
            isGold ? "aquarium-gold-star" : ""
        }`;


    star.dataset.type =
        isGold
            ? "goldStar"
            : "star";


    star.dataset.active =
        "true";


    star.style.setProperty(
        "--x",
        `${x}%`
    );


    star.style.setProperty(
        "--y",
        `${y}%`
    );


    star.style.setProperty(
        "--size",
        "70px"
    );


    star.innerHTML = `
        <span class="aquarium-object-content aquarium-star-content">
            ${isGold ? "🌟" : "⭐"}
        </span>
    `;


    aquariumObjects.appendChild(
        star
    );

}


/* =========================================================
   TREASURE
========================================================= */

function createTreasure() {

    const treasure =
        document.createElement(
            "div"
        );


    const x =
        randomNumber(
            12,
            88
        );


    const y =
        randomNumber(
            32,
            70
        );


    treasure.className =
        "aquarium-object aquarium-treasure";


    treasure.dataset.type =
        "treasure";


    treasure.dataset.active =
        "true";


    treasure.style.setProperty(
        "--x",
        `${x}%`
    );


    treasure.style.setProperty(
        "--y",
        `${y}%`
    );


    treasure.style.setProperty(
        "--size",
        "85px"
    );


    treasure.innerHTML = `
        <span class="aquarium-object-content aquarium-treasure-content">
            💎
        </span>
    `;


    aquariumObjects.appendChild(
        treasure
    );

}


/* =========================================================
   BUBBLE
========================================================= */

function createBubble() {

    const bubble =
        document.createElement(
            "div"
        );


    const x =
        randomNumber(
            5,
            95
        );


    const y =
        randomNumber(
            50,
            90
        );


    const bubbleTime =
        randomNumber(
            3.5,
            6
        );


    bubble.className =
        "aquarium-object aquarium-bubble";


    bubble.dataset.type =
        "bubble";


    bubble.dataset.active =
        "true";


    bubble.style.setProperty(
        "--x",
        `${x}%`
    );


    bubble.style.setProperty(
        "--y",
        `${y}%`
    );


    bubble.style.setProperty(
        "--size",
        "55px"
    );


    bubble.style.setProperty(
        "--bubble-time",
        `${bubbleTime}s`
    );


    bubble.innerHTML = `
        <span class="aquarium-object-content aquarium-bubble-content"></span>
    `;


    aquariumObjects.appendChild(
        bubble
    );


    setTimeout(
        () => {

            if (
                bubble.parentElement
            ) {

                bubble.remove();

            }

        },
        bubbleTime * 1000 + 300
    );

}


/* =========================================================
   RANDOM SPAWN
========================================================= */

function spawnAquariumObject() {

    const chance =
        Math.random();


    if (
        chance < 0.40
    ) {

        createMagicStar();

    } else if (
        chance < 0.56
    ) {

        createBubble();

    } else if (
        chance < 0.68
    ) {

        createFish();

    } else if (
        chance < 0.77
    ) {

        createTreasure();

    }

}


/* =========================================================
   COLLECT
========================================================= */

function collectAquariumObject(
    object
) {

    if (
        !object ||
        object.dataset.active !== "true"
    ) {
        return;
    }


    object.dataset.active =
        "false";


    const type =
        object.dataset.type;


    let value = 0;


    if (
        type === "fish"
    ) {

        value =
            Number(
                object.dataset.value
            ) || 5;

    } else if (
        type === "star"
    ) {

        value =
            AQUARIUM_OBJECT_TYPES.star.value;

    } else if (
        type === "goldStar"
    ) {

        value =
            AQUARIUM_OBJECT_TYPES.goldStar.value;

    } else if (
        type === "treasure"
    ) {

        value =
            AQUARIUM_OBJECT_TYPES.treasure.value;

        aquariumTreasures++;

    } else if (
        type === "bubble"
    ) {

        value =
            AQUARIUM_OBJECT_TYPES.bubble.value;

    }


    aquariumCombo++;


    aquariumBestCombo =
        Math.max(
            aquariumBestCombo,
            aquariumCombo
        );


    let multiplier = 1;


    if (
        aquariumCombo >= 3
    ) {

        multiplier =
            Math.min(
                3,
                1 +
                (
                    Math.floor(
                        aquariumCombo / 3
                    ) * 0.25
                )
            );

    }


    const earned =
        Math.round(
            value * multiplier
        );


    aquariumScore +=
        earned;


    if (
        type === "treasure"
    ) {

        updateAquariumMessage(
            "💎 HAI TROVATO UN TESORO!"
        );

    } else if (
        type === "goldStar"
    ) {

        updateAquariumMessage(
            "🌟 STELLA MAGICA!"
        );

    } else if (
        aquariumCombo >= 8
    ) {

        updateAquariumMessage(
            `🔥 COMBO x${aquariumCombo}!`
        );

    } else {

        updateAquariumMessage(
            "✨ Bravissimo!"
        );

    }


    createMagicBurst(
        object,
        earned
    );


    object.style.pointerEvents =
        "none";

    object.style.transition =
        "transform .25s ease, opacity .25s ease";

    object.style.transform =
        "translate(-50%, -50%) scale(1.5)";

    object.style.opacity =
        "0";


    setTimeout(
        () => {

            if (
                object.parentElement
            ) {

                object.remove();

            }

        },
        280
    );


    updateAquariumLevel();

    updateAquariumHUD();

}


/* =========================================================
   EFFECT
========================================================= */

function createMagicBurst(
    object,
    earned
) {

    const objectRect =
        object.getBoundingClientRect();

    const arenaRect =
        aquariumArena.getBoundingClientRect();


    const x =
        (
            (
                objectRect.left +
                objectRect.width / 2
            ) -
            arenaRect.left
        ) /
        arenaRect.width *
        100;


    const y =
        (
            (
                objectRect.top +
                objectRect.height / 2
            ) -
            arenaRect.top
        ) /
        arenaRect.height *
        100;


    const burst =
        document.createElement(
            "div"
        );


    burst.className =
        "magic-burst";


    burst.style.setProperty(
        "--x",
        `${x}%`
    );


    burst.style.setProperty(
        "--y",
        `${y}%`
    );


    burst.textContent =
        earned >= 100
            ? "💎✨"
            : earned >= 50
                ? "🌟"
                : "✨";


    aquariumEffects.appendChild(
        burst
    );


    setTimeout(
        () => {

            burst.remove();

        },
        900
    );

}


/* =========================================================
   LEVEL
========================================================= */

function updateAquariumLevel() {

    const newLevel =
        Math.floor(
            aquariumScore / 250
        ) + 1;


    if (
        newLevel ===
        aquariumLevel
    ) {
        return;
    }


    aquariumLevel =
        newLevel;


    updateAquariumMessage(
        `🌊 Livello ${aquariumLevel}! L'acquario diventa sempre più magico!`
    );

}


/* =========================================================
   HUD
========================================================= */

function updateAquariumHUD() {

    if (
        aquariumScoreElement
    ) {

        aquariumScoreElement.textContent =
            formatAquariumNumber(
                aquariumScore
            );

    }


    if (
        aquariumComboElement
    ) {

        aquariumComboElement.textContent =
            `x${aquariumCombo}`;

    }


    if (
        aquariumTreasuresElement
    ) {

        aquariumTreasuresElement.textContent =
            String(
                aquariumTreasures
            );

    }


    if (
        aquariumTimerElement
    ) {

        aquariumTimerElement.textContent =
            String(
                aquariumTimeRemaining
            );

    }


    if (
        aquariumLevelElement
    ) {

        aquariumLevelElement.textContent =
            `Livello ${aquariumLevel}`;

    }


    if (
        aquariumProgressFill
    ) {

        const percentage =
            (
                aquariumTimeRemaining /
                AQUARIUM_GAME_TIME
            ) * 100;


        aquariumProgressFill.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    percentage
                )
            )}%`;

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function updateAquariumMessage(
    message
) {

    if (
        aquariumMessageElement
    ) {

        aquariumMessageElement.textContent =
            message;

    }

}


/* =========================================================
   FINE
========================================================= */

function finishAquariumGame() {

    if (
        aquariumGameFinished
    ) {
        return;
    }


    aquariumGameFinished =
        true;

    aquariumGameStarted =
        false;


    stopAquariumTimers();


    clearAquariumObjects();


    if (
        aquariumGameScreen
    ) {

        aquariumGameScreen.hidden =
            true;

    }


    if (
        aquariumEndScreen
    ) {

        aquariumEndScreen.hidden =
            false;

    }


    const performance =
        getAquariumPerformance();


    if (
        aquariumEndIcon
    ) {

        aquariumEndIcon.textContent =
            performance.icon;

    }


    if (
        aquariumEndTitle
    ) {

        aquariumEndTitle.textContent =
            performance.title;

    }


    if (
        aquariumEndMessage
    ) {

        aquariumEndMessage.textContent =
            performance.message;

    }


    if (
        aquariumFinalScore
    ) {

        aquariumFinalScore.textContent =
            formatAquariumNumber(
                aquariumScore
            );

    }


    if (
        aquariumFinalCombo
    ) {

        aquariumFinalCombo.textContent =
            `x${aquariumBestCombo}`;

    }


    if (
        aquariumFinalTreasures
    ) {

        aquariumFinalTreasures.textContent =
            String(
                aquariumTreasures
            );

    }


    if (
        aquariumEndBadge
    ) {

        aquariumEndBadge.textContent =
            performance.badge;

    }

}


/* =========================================================
   PERFORMANCE
========================================================= */

function getAquariumPerformance() {

    if (
        aquariumScore >= 2500
    ) {

        return {

            icon: "👑",

            title: "RE DEL MARE!",

            message:
                "Hai riempito l'acquario di una magia incredibile!",

            badge:
                "👑 Ocean Legend"

        };

    }


    if (
        aquariumScore >= 1700
    ) {

        return {

            icon: "💎",

            title: "INCREDIBILE!",

            message:
                "Hai trovato tantissimi tesori e stelle magiche!",

            badge:
                "💎 Treasure Master"

        };

    }


    if (
        aquariumScore >= 1000
    ) {

        return {

            icon: "🌟",

            title: "BRAVISSIMO!",

            message:
                "I pesci adorano il loro nuovo amico!",

            badge:
                "🌟 Magic Diver"

        };

    }


    if (
        aquariumScore >= 500
    ) {

        return {

            icon: "🐠",

            title: "OTTIMO LAVORO!",

            message:
                "Hai portato tanta magia nell'acquario.",

            badge:
                "🐠 Ocean Friend"

        };

    }


    return {

        icon: "🫧",

        title: "CHE BELLO!",

        message:
            "L'acquario ti aspetta per una nuova avventura!",

        badge:
            "🫧 Little Diver"

    };

}


/* =========================================================
   MENU ACQUARIO
========================================================= */

function showAquariumMenu() {

    stopAquariumTimers();

    clearAquariumObjects();


    aquariumGameStarted =
        false;

    aquariumGameFinished =
        false;


    if (
        aquariumGameScreen
    ) {

        aquariumGameScreen.hidden =
            true;

    }


    if (
        aquariumEndScreen
    ) {

        aquariumEndScreen.hidden =
            true;

    }


    if (
        aquariumStartScreen
    ) {

        aquariumStartScreen.hidden =
            false;

    }

}


/* =========================================================
   STOP TIMERS
========================================================= */

function stopAquariumTimers() {

    if (
        aquariumTimerInterval !==
        null
    ) {

        clearInterval(
            aquariumTimerInterval
        );

        aquariumTimerInterval =
            null;

    }


    if (
        aquariumSpawnInterval !==
        null
    ) {

        clearInterval(
            aquariumSpawnInterval
        );

        aquariumSpawnInterval =
            null;

    }

}


/* =========================================================
   CLEAR
========================================================= */

function clearAquariumObjects() {

    if (
        aquariumObjects
    ) {

        aquariumObjects.innerHTML =
            "";

    }


    if (
        aquariumEffects
    ) {

        aquariumEffects.innerHTML =
            "";

    }


    aquariumObjectsCount =
        0;

}


/* =========================================================
   RANDOM
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
   FORMAT
========================================================= */

function formatAquariumNumber(
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
            aquariumGameStarted &&
            !aquariumGameFinished
        ) {

            showAquariumMenu();

        }

    }
);
