"use strict";

/* =========================================================
   CUGINIPARTY - RACING 2D
   PC + MOBILE LANDSCAPE
   ========================================================= */


/* =========================================================
   CONFIGURAZIONE
   ========================================================= */

const RACING_LAPS = 3;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 760;


/* =========================================================
   PISTA
   ========================================================= */

const TRACK = {
    outer: {
        x: 45,
        y: 45,
        width: 1110,
        height: 670
    },

    inner: {
        x: 285,
        y: 235,
        width: 630,
        height: 290
    }
};


/* =========================================================
   PARTENZA
   ========================================================= */

const START_POSITION = {
    x: 600,
    y: 145,
    angle: 0
};


/* =========================================================
   TRAGUARDO
   ========================================================= */

const FINISH_LINE = {
    x: 535,
    y: 50,
    width: 16,
    height: 180
};


/* =========================================================
   CHECKPOINT
   ========================================================= */

const CHECKPOINTS = [

    {
        x: 915,
        y: 150,
        width: 240,
        height: 24,
        direction: "down",
        label: "CP1"
    },

    {
        x: 850,
        y: 525,
        width: 24,
        height: 190,
        direction: "left",
        label: "CP2"
    },

    {
        x: 150,
        y: 525,
        width: 24,
        height: 190,
        direction: "left",
        label: "CP3"
    },

    {
        x: 45,
        y: 270,
        width: 240,
        height: 24,
        direction: "up",
        label: "CP4"
    },

    {
        x: 390,
        y: 45,
        width: 24,
        height: 190,
        direction: "right",
        label: "CP5"
    }

];


/* =========================================================
   POZZE D'OLIO
   ========================================================= */

const OIL_PUDDLES = [
    {
        x: 760,
        y: 150,
        radiusX: 34,
        radiusY: 20,
        strength: 0.035
    },

    {
        x: 980,
        y: 385,
        radiusX: 22,
        radiusY: 38,
        strength: 0.045
    },

    {
        x: 730,
        y: 595,
        radiusX: 38,
        radiusY: 20,
        strength: 0.040
    },

    {
        x: 410,
        y: 605,
        radiusX: 32,
        radiusY: 19,
        strength: 0.035
    },

    {
        x: 180,
        y: 430,
        radiusX: 21,
        radiusY: 38,
        strength: 0.045
    },

    {
        x: 240,
        y: 175,
        radiusX: 35,
        radiusY: 19,
        strength: 0.040
    },

    {
        x: 690,
        y: 190,
        radiusX: 28,
        radiusY: 17,
        strength: 0.030
    }
];


/* =========================================================
   OSTACOLI CASUALI
   ========================================================= */

const racingObstacles = [];

const OBSTACLE_CONFIG = {

    /*
       Numero desiderato di ostacoli.

       Le quattro zone sotto ne generano:
       3 + 4 + 3 + 3 = 13
    */

    total: 10,

    /*
       Distanza minima tra due ostacoli.
    */

    minDistance: 155,

    /*
       Raggio usato per la collisione.
    */

    obstacleRadius: 21,

    /*
       Zona libera attorno alla partenza.
    */

    startSafeDistance: 180,

    /*
       Zona libera attorno al traguardo.
    */

    finishSafeDistance: 130,

    /*
       Margine libero attorno ai checkpoint.
    */

    checkpointPadding: 65,

    /*
       Margine libero attorno alle pozze d'olio.
    */

    oilPadding: 45

};


/*
   Zone dove possono comparire gli ostacoli.

   Sono distribuite lungo tutto il circuito:
   - rettilineo superiore
   - rettilineo destro
   - rettilineo inferiore
   - rettilineo sinistro
*/

const OBSTACLE_SPAWN_ZONES = [

    {
        xMin: 330,
        xMax: 870,
        yMin: 105,
        yMax: 195,
        amount: 3
    },

    {
        xMin: 950,
        xMax: 1085,
        yMin: 285,
        yMax: 475,
        amount: 4
    },

    {
        xMin: 330,
        xMax: 870,
        yMin: 570,
        yMax: 650,
        amount: 3
    },

    {
        xMin: 110,
        xMax: 255,
        yMin: 285,
        yMax: 475,
        amount: 3
    }

];


/* =========================================================
   ALBERI
   ========================================================= */

const trees = [
    [35, 100],
    [105, 35],
    [215, 30],
    [330, 28],
    [455, 25],
    [760, 25],
    [900, 28],
    [1040, 32],
    [1170, 100],

    [1170, 275],
    [1170, 475],

    [1100, 735],
    [940, 735],
    [760, 735],
    [560, 735],
    [370, 735],
    [180, 735],

    [25, 650],
    [20, 500],
    [20, 300],
    [25, 180]
];


/* =========================================================
   DOM
   ========================================================= */

let racingCanvas;
let racingContext;

let racingStartScreen;
let racingGameScreen;
let racingVictoryScreen;

let startRacingButton;
let restartRacingButton;
let playAgainRacingButton;

let racingLapElement;
let racingTimeElement;
let racingBestLapElement;

let racingFinalTimeElement;
let racingFinalBestLapElement;

let racingTrackStatusText;


/* =========================================================
   STATO GENERALE
   ========================================================= */

let racingAnimationFrame = null;

let racingRunning = false;
let racingFinished = false;

let racingCountdownActive = false;
let racingCountdownValue = 0;
let racingCountdownTimer = null;

let racingStartTimestamp = 0;
let racingLastFrameTimestamp = 0;

let racingTotalElapsed = 0;
let racingLapStartTimestamp = 0;

let racingCurrentLap = 1;
let racingBestLap = null;

let racingCheckpointIndex = 0;

let racingPreviousX = START_POSITION.x;
let racingPreviousY = START_POSITION.y;

let racingFinishCooldown = 0;

let racingParticles = [];
let racingSkidMarks = [];

let racingShake = 0;


/* =========================================================
   INPUT PC
   ========================================================= */

const racingKeys = {
    up: false,
    down: false,
    left: false,
    right: false
};


/* =========================================================
   INPUT MOBILE
   ========================================================= */

const mobileControls = {
    active: false,
    pointerId: null,

    baseX: 0,
    baseY: 0,

    knobX: 0,
    knobY: 0,

    x: 0,
    y: 0,

    accelerator: false,
    acceleratorPointerId: null
};


/* =========================================================
   MACCHINA
   ========================================================= */

const racingCar = {

    x: START_POSITION.x,
    y: START_POSITION.y,

    width: 34,
    height: 72,

    angle: START_POSITION.angle,

    speed: 0,

    maxSpeed: 7.0,
    reverseSpeed: 2.1,

    acceleration: 0.13,
    braking: 0.21,
    friction: 0.045,

    turnSpeed: 0.055,

    steeringVisual: 0,

    wheelSpin: 0
};


/* =========================================================
   MOBILE DETECTION
   ========================================================= */

function isMobileDevice() {

    return (
        window.matchMedia("(pointer: coarse)").matches ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(
            navigator.userAgent
        )
    );

}


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeRacing
);


function initializeRacing() {

    racingCanvas =
        document.getElementById("racingCanvas");

    racingStartScreen =
        document.getElementById("racingStartScreen");

    racingGameScreen =
        document.getElementById("racingGameScreen");

    racingVictoryScreen =
        document.getElementById("racingVictoryScreen");

    startRacingButton =
        document.getElementById("startRacingButton");

    restartRacingButton =
        document.getElementById("restartRacingButton");

    playAgainRacingButton =
        document.getElementById("playAgainRacingButton");

    racingLapElement =
        document.getElementById("racingLap");

    racingTimeElement =
        document.getElementById("racingTime");

    racingBestLapElement =
        document.getElementById("racingBestLap");

    racingFinalTimeElement =
        document.getElementById("racingFinalTime");

    racingFinalBestLapElement =
        document.getElementById("racingFinalBestLap");

    racingTrackStatusText =
        document.getElementById("racingTrackStatusText");


    if (!racingCanvas) {
        return;
    }


    racingContext =
        racingCanvas.getContext("2d");


    setupCanvasResolution();

    initializeKeyboard();

    initializeMobileControls();

    initializeOrientationHandling();


    /* =====================================================
       PULSANTI
       ===================================================== */

    if (startRacingButton) {

        startRacingButton.addEventListener(
            "click",
            startRacingGame
        );

    }


    if (restartRacingButton) {

        restartRacingButton.addEventListener(
            "click",
            restartRacingGame
        );

    }


    if (playAgainRacingButton) {

        playAgainRacingButton.addEventListener(
            "click",
            startRacingGame
        );

    }


    resetRacingState();

    drawRacingScene();

}


/* =========================================================
   NUOVA GARA
   ========================================================= */

function restartRacingGame() {

    stopRacingGame();

    resetRacingState();

    startRacingGame();

}


/* =========================================================
   CANVAS HD
   ========================================================= */

function setupCanvasResolution() {

    if (!racingCanvas) {
        return;
    }


    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    racingCanvas.width =
        CANVAS_WIDTH * dpr;

    racingCanvas.height =
        CANVAS_HEIGHT * dpr;


    racingContext.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

}


window.addEventListener(
    "resize",
    () => {

        setupCanvasResolution();

    }
);


/* =========================================================
   ORIENTAMENTO MOBILE
   ========================================================= */

function initializeOrientationHandling() {

    if (!isMobileDevice()) {
        return;
    }


    window.addEventListener(
        "orientationchange",
        () => {

            setTimeout(
                () => {

                    setupCanvasResolution();

                },
                250
            );

        }
    );


    if (screen.orientation) {

        screen.orientation.addEventListener(
            "change",
            () => {

                setTimeout(
                    () => {

                        setupCanvasResolution();

                    },
                    150
                );

            }
        );

    }

}


/* =========================================================
   LANDSCAPE
   ========================================================= */

async function requestLandscape() {

    if (!isMobileDevice()) {
        return;
    }


    try {

        if (
            document.documentElement.requestFullscreen &&
            !document.fullscreenElement
        ) {

            await document.documentElement.requestFullscreen();

        }

    } catch (error) {
        /* Browser non compatibile. */
    }


    try {

        if (
            screen.orientation &&
            screen.orientation.lock
        ) {

            await screen.orientation.lock(
                "landscape"
            );

        }

    } catch (error) {
        /*
           iPhone/iOS spesso non permette
           il blocco automatico.
        */
    }


    setTimeout(
        setupCanvasResolution,
        300
    );

}


/* =========================================================
   START
   ========================================================= */

async function startRacingGame() {

    stopRacingGame();

    resetRacingState();

    /*
       NUOVA DISPOSIZIONE OSTACOLI
       AD OGNI GARA.
    */

    generateRacingObstacles();


    if (isMobileDevice()) {

        await requestLandscape();

    }


    if (racingStartScreen) {

        racingStartScreen.hidden = true;

    }


    if (racingVictoryScreen) {

        racingVictoryScreen.hidden = true;

    }


    if (racingGameScreen) {

        racingGameScreen.hidden = false;

    }


    setMobileControlsVisible(
        isMobileDevice()
    );


    racingRunning = true;

    racingFinished = false;

    racingCountdownActive = true;


    racingStartTimestamp = 0;

    racingLastFrameTimestamp =
        performance.now();

    racingLapStartTimestamp = 0;

    racingTotalElapsed = 0;


    updateRacingHUD();

    updateCheckpointStatus();


    racingAnimationFrame =
        requestAnimationFrame(
            racingGameLoop
        );


    startRacingCountdown();

}


/* =========================================================
   GENERAZIONE OSTACOLI
   ========================================================= */

function generateRacingObstacles() {

    racingObstacles.length = 0;


    for (
        const zone
        of OBSTACLE_SPAWN_ZONES
    ) {

        let placedInZone = 0;

        let attempts = 0;

        const maxAttempts =
            zone.amount * 100;


        while (
            placedInZone < zone.amount &&
            attempts < maxAttempts
        ) {

            attempts++;


            const x =
                zone.xMin +
                Math.random() *
                (
                    zone.xMax -
                    zone.xMin
                );


            const y =
                zone.yMin +
                Math.random() *
                (
                    zone.yMax -
                    zone.yMin
                );


            if (
                !isObstacleSpawnPositionValid(
                    x,
                    y
                )
            ) {

                continue;

            }


            const type =
                Math.random() < 0.5
                    ? "tire"
                    : "cone";


            racingObstacles.push({

                x,
                y,

                radius:
                    OBSTACLE_CONFIG.obstacleRadius,

                type,

                rotation:
                    Math.random() *
                    Math.PI *
                    2,

                hitUntil: 0

            });


            placedInZone++;

        }

    }

}


/* =========================================================
   CONTROLLO POSIZIONE OSTACOLO
   ========================================================= */

function isObstacleSpawnPositionValid(
    x,
    y
) {

    /*
       PARTENZA
    */

    const startDistance =
        Math.hypot(
            x -
            START_POSITION.x,

            y -
            START_POSITION.y
        );


    if (
        startDistance <
        OBSTACLE_CONFIG.startSafeDistance
    ) {

        return false;

    }


    /*
       TRAGUARDO
    */

    const finishCenterX =
        FINISH_LINE.x +
        FINISH_LINE.width / 2;

    const finishCenterY =
        FINISH_LINE.y +
        FINISH_LINE.height / 2;


    const finishDistance =
        Math.hypot(
            x -
            finishCenterX,

            y -
            finishCenterY
        );


    if (
        finishDistance <
        OBSTACLE_CONFIG.finishSafeDistance
    ) {

        return false;

    }


    /*
       CHECKPOINT
    */

    for (
        const checkpoint
        of CHECKPOINTS
    ) {

        const padding =
            OBSTACLE_CONFIG.checkpointPadding;


        const expanded = {

            x:
                checkpoint.x -
                padding,

            y:
                checkpoint.y -
                padding,

            width:
                checkpoint.width +
                padding * 2,

            height:
                checkpoint.height +
                padding * 2

        };


        if (
            pointInsideRectangle(
                x,
                y,
                expanded
            )
        ) {

            return false;

        }

    }


    /*
       POZZE D'OLIO
    */

    for (
        const oil
        of OIL_PUDDLES
    ) {

        const dx =
            (
                x -
                oil.x
            ) /
            (
                oil.radiusX +
                OBSTACLE_CONFIG.oilPadding
            );


        const dy =
            (
                y -
                oil.y
            ) /
            (
                oil.radiusY +
                OBSTACLE_CONFIG.oilPadding
            );


        if (
            dx * dx +
            dy * dy <=
            1
        ) {

            return false;

        }

    }


    /*
       ALTRI OSTACOLI
    */

    for (
        const obstacle
        of racingObstacles
    ) {

        const distance =
            Math.hypot(
                x -
                obstacle.x,

                y -
                obstacle.y
            );


        if (
            distance <
            OBSTACLE_CONFIG.minDistance
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   COLLISIONE OSTACOLI
   ========================================================= */

function checkRacingObstacles() {

    const now =
        performance.now();


    for (
        const obstacle
        of racingObstacles
    ) {

        const distance =
            Math.hypot(
                racingCar.x -
                obstacle.x,

                racingCar.y -
                obstacle.y
            );


        if (
            distance >
            racingCar.width / 2 +
            obstacle.radius
        ) {

            continue;

        }


        /*
           Evita che la stessa collisione
           venga ripetuta ogni frame.
        */

        if (
            now <
            obstacle.hitUntil
        ) {

            continue;

        }


        obstacle.hitUntil =
            now + 500;


        /*
           L'ostacolo rallenta la macchina.
           NON la blocca.
        */

        racingCar.speed *= 0.48;


        racingShake =
            Math.max(
                racingShake,
                4
            );


        createObstacleHitEffect(
            obstacle.x,
            obstacle.y
        );

    }

}


/* =========================================================
   EFFETTO COLLISIONE OSTACOLO
   ========================================================= */

function createObstacleHitEffect(
    x,
    y
) {

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        racingParticles.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                (
                    0.7 +
                    Math.random() *
                    1.4
                ),

            vy:
                Math.sin(angle) *
                (
                    0.7 +
                    Math.random() *
                    1.4
                ),

            size:
                2 +
                Math.random() *
                3,

            life:
                350 +
                Math.random() *
                300,

            alpha:
                0.85,

            type:
                "obstacle"

        });

    }

}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function startRacingCountdown() {

    clearCountdownTimer();


    racingCountdownValue = 3;


    showCountdown("3");


    racingCountdownTimer =
        setInterval(
            () => {

                racingCountdownValue--;


                if (
                    racingCountdownValue > 0
                ) {

                    showCountdown(
                        String(
                            racingCountdownValue
                        )
                    );

                    return;

                }


                showCountdown(
                    "VIA!",
                    true
                );


                racingCountdownActive =
                    false;


                const now =
                    performance.now();


                racingStartTimestamp =
                    now;

                racingLastFrameTimestamp =
                    now;

                racingLapStartTimestamp =
                    now;

                racingTotalElapsed = 0;


                /*
                   La macchina rimane ferma
                   fino a VIA!.
                */

                racingCar.speed = 0;

                clearRacingKeys();

                resetMobileJoystick();


                setTimeout(
                    hideCountdown,
                    700
                );


                clearCountdownTimer();

            },
            1000
        );

}


/* =========================================================
   COUNTDOWN UI
   ========================================================= */

let racingCountdownElement = null;


function createCountdownElement() {

    if (racingCountdownElement) {
        return;
    }


    racingCountdownElement =
        document.createElement("div");


    racingCountdownElement.id =
        "racingCountdownOverlay";


    racingCountdownElement.style.position =
        "fixed";

    racingCountdownElement.style.inset =
        "0";

    racingCountdownElement.style.display =
        "none";

    racingCountdownElement.style.alignItems =
        "center";

    racingCountdownElement.style.justifyContent =
        "center";

    racingCountdownElement.style.zIndex =
        "99999";

    racingCountdownElement.style.pointerEvents =
        "none";

    racingCountdownElement.style.fontFamily =
        "Arial, sans-serif";

    racingCountdownElement.style.fontWeight =
        "900";

    racingCountdownElement.style.fontSize =
        "clamp(80px, 18vw, 220px)";

    racingCountdownElement.style.color =
        "#ffffff";

    racingCountdownElement.style.textShadow =
        "0 8px 30px rgba(0,0,0,0.8), 0 0 30px rgba(220,38,38,0.7)";


    document.body.appendChild(
        racingCountdownElement
    );

}


function showCountdown(
    text,
    go = false
) {

    createCountdownElement();


    racingCountdownElement.textContent =
        text;


    racingCountdownElement.style.display =
        "flex";


    racingCountdownElement.style.color =
        go
            ? "#22c55e"
            : "#ffffff";


    racingCountdownElement.style.textShadow =
        go
            ? "0 8px 30px rgba(0,0,0,0.8), 0 0 35px rgba(34,197,94,0.8)"
            : "0 8px 30px rgba(0,0,0,0.8), 0 0 30px rgba(220,38,38,0.7)";

}


function hideCountdown() {

    if (!racingCountdownElement) {
        return;
    }


    racingCountdownElement.style.display =
        "none";

}


function clearCountdownTimer() {

    if (
        racingCountdownTimer !== null
    ) {

        clearInterval(
            racingCountdownTimer
        );

        racingCountdownTimer = null;

    }

}


/* =========================================================
   RESET
   ========================================================= */

function resetRacingState() {

    clearCountdownTimer();

    hideCountdown();


    racingCurrentLap = 1;

    racingBestLap = null;

    racingTotalElapsed = 0;

    racingStartTimestamp = 0;

    racingLastFrameTimestamp = 0;

    racingLapStartTimestamp = 0;

    racingCheckpointIndex = 0;

    racingFinishCooldown = 0;

    racingFinished = false;

    racingCountdownActive = false;

    racingCountdownValue = 0;


    racingPreviousX =
        START_POSITION.x;

    racingPreviousY =
        START_POSITION.y;


    racingCar.x =
        START_POSITION.x;

    racingCar.y =
        START_POSITION.y;

    racingCar.angle =
        START_POSITION.angle;

    racingCar.speed = 0;

    racingCar.steeringVisual = 0;

    racingCar.wheelSpin = 0;


    racingParticles = [];

    racingSkidMarks = [];

    racingShake = 0;


    /*
       Svuotiamo gli ostacoli.

       Verranno rigenerati da
       startRacingGame().
    */

    racingObstacles.length = 0;


    clearRacingKeys();

    resetMobileJoystick();

}


/* =========================================================
   LOOP
   ========================================================= */

function racingGameLoop(timestamp) {

    if (!racingRunning) {
        return;
    }


    const delta =
        Math.min(
            timestamp -
            racingLastFrameTimestamp,
            40
        );


    racingLastFrameTimestamp =
        timestamp;


    if (!racingCountdownActive) {

        if (
            racingStartTimestamp > 0
        ) {

            racingTotalElapsed =
                timestamp -
                racingStartTimestamp;

        }


        racingPreviousX =
            racingCar.x;

        racingPreviousY =
            racingCar.y;


        updateRacingCar(delta);

        updateRacingEffects(delta);

        checkRacingObstacles();

        checkRacingCheckpoints();

        checkRacingFinish();

        updateRacingHUD();

    } else {

        /*
           Durante il countdown
           la macchina è completamente ferma.
        */

        racingCar.speed = 0;

        updateRacingEffects(delta);

        updateRacingHUD();

    }


    drawRacingScene();


    if (racingRunning) {

        racingAnimationFrame =
            requestAnimationFrame(
                racingGameLoop
            );

    }

}


/* =========================================================
   FISICA MACCHINA
   ========================================================= */

function updateRacingCar(delta) {

    const dt =
        delta / 16.6667;


    /* =====================================================
       GUIDA MOBILE
       ===================================================== */

    if (isMobileDevice()) {

        const joystickX =
            mobileControls.x;

        const joystickY =
            mobileControls.y;


        /*
           Intensità del joystick.

           0 = centro
           1 = spinto completamente.
        */

        const joystickPower =
            Math.min(
                1,
                Math.hypot(
                    joystickX,
                    joystickY
                )
            );


        /*
           Piccola zona morta centrale.
           Evita movimenti casuali quando
           il dito è quasi al centro.
        */

        const deadZone = 0.12;


        if (
            joystickPower > deadZone
        ) {

            /*
               Ridistribuiamo il valore dopo
               la dead zone per avere una risposta
               progressiva.
            */

            const normalizedPower =
                (
                    joystickPower -
                    deadZone
                ) /
                (1 - deadZone);


            /*
               DIREZIONE REALE DEL JOYSTICK.

               atan2:
               X = destra/sinistra
               Y = alto/basso

               In canvas:
               Y negativo = alto
               Y positivo = basso
            */

            const targetAngle =
                Math.atan2(
                    joystickY,
                    joystickX
                );


            /*
               La macchina ruota gradualmente
               verso la direzione del joystick.

               Non facciamo uno snap immediato,
               così il movimento rimane fluido.
            */

            let angleDifference =
                targetAngle -
                racingCar.angle;


            while (
                angleDifference > Math.PI
            ) {

                angleDifference -=
                    Math.PI * 2;

            }


            while (
                angleDifference < -Math.PI
            ) {

                angleDifference +=
                    Math.PI * 2;

            }


            const mobileTurnSpeed =
                0.13 * dt;


            const maxTurn =
                mobileTurnSpeed *
                Math.max(
                    0.35,
                    normalizedPower
                );


            if (
                Math.abs(
                    angleDifference
                ) <= maxTurn
            ) {

                racingCar.angle =
                    targetAngle;

            } else {

                racingCar.angle +=
                    Math.sign(
                        angleDifference
                    ) *
                    maxTurn;

            }


            /*
               ACCELERAZIONE.

               Più spingi il joystick,
               più velocemente accelera.
            */

            racingCar.speed +=
                racingCar.acceleration *
                normalizedPower *
                dt;


        } else {

            /*
               Joystick al centro:
               la macchina rallenta naturalmente.
            */

            if (
                racingCar.speed > 0
            ) {

                racingCar.speed =
                    Math.max(
                        0,
                        racingCar.speed -
                        racingCar.friction *
                        dt
                    );

            } else if (
                racingCar.speed < 0
            ) {

                racingCar.speed =
                    Math.min(
                        0,
                        racingCar.speed +
                        racingCar.friction *
                        dt
                    );

            }

        }


        /*
           Limite velocità.
        */

        racingCar.speed =
            Math.max(
                -racingCar.reverseSpeed,
                Math.min(
                    racingCar.maxSpeed,
                    racingCar.speed
                )
            );


        /*
           OLIO.
        */

        const oil =
            getOilPuddleAt(
                racingCar.x,
                racingCar.y
            );


        if (oil) {

            racingCar.speed *=
                Math.max(
                    0.90,
                    1 -
                    oil.strength *
                    dt
                );

        }


        /*
           MOVIMENTO.

           L'angolo della macchina è esattamente
           la direzione del joystick.
        */

        const nextX =
            racingCar.x +
            Math.cos(
                racingCar.angle
            ) *
            racingCar.speed *
            dt;


        const nextY =
            racingCar.y +
            Math.sin(
                racingCar.angle
            ) *
            racingCar.speed *
            dt;


        if (
            isCarInsideTrack(
                nextX,
                nextY
            )
        ) {

            racingCar.x =
                nextX;

            racingCar.y =
                nextY;

        } else {

            racingCar.speed *=
                0.82;


            createDust(
                racingCar.x,
                racingCar.y,
                1
            );

        }


        racingCar.wheelSpin +=
            racingCar.speed *
            dt *
            0.25;


        /*
           Sterzo visivo delle ruote.
        */

        racingCar.steeringVisual =
            joystickX;


        return;

    }


    /* =====================================================
       GUIDA PC
       ===================================================== */

    const accelerating =
        racingKeys.up;


    if (accelerating) {

        racingCar.speed +=
            racingCar.acceleration *
            dt;

    }


    if (racingKeys.down) {

        if (
            racingCar.speed > 0
        ) {

            racingCar.speed -=
                racingCar.braking *
                dt;

        } else {

            racingCar.speed -=
                racingCar.acceleration *
                0.72 *
                dt;

        }

    }


    if (
        !accelerating &&
        !racingKeys.down
    ) {

        if (
            racingCar.speed > 0
        ) {

            racingCar.speed =
                Math.max(
                    0,
                    racingCar.speed -
                    racingCar.friction *
                    dt
                );

        } else if (
            racingCar.speed < 0
        ) {

            racingCar.speed =
                Math.min(
                    0,
                    racingCar.speed +
                    racingCar.friction *
                    dt
                );

        }

    }


    racingCar.speed =
        Math.max(
            -racingCar.reverseSpeed,

            Math.min(
                racingCar.maxSpeed,
                racingCar.speed
            )
        );


    /*
       OLIO
    */

    const oil =
        getOilPuddleAt(
            racingCar.x,
            racingCar.y
        );


    if (oil) {

        racingCar.speed *=
            Math.max(
                0.90,
                1 -
                oil.strength *
                dt
            );

    }


    /*
       STERZO PC
    */

    let steeringInput = 0;


    if (racingKeys.left) {
        steeringInput -= 1;
    }

    if (racingKeys.right) {
        steeringInput += 1;
    }


    if (
        Math.abs(
            racingCar.speed
        ) > 0.08
    ) {

        const direction =
            racingCar.speed >= 0
                ? 1
                : -1;


        if (
            Math.abs(
                steeringInput
            ) > 0.04
        ) {

            const steeringPower =
                Math.min(
                    1,
                    Math.abs(
                        steeringInput
                    )
                );


            racingCar.angle +=
                racingCar.turnSpeed *
                dt *
                steeringInput *
                direction *
                steeringPower;


            racingCar.steeringVisual =
                steeringInput;

        }

    }


    if (
        Math.abs(
            steeringInput
        ) < 0.04
    ) {

        racingCar.steeringVisual *=
            0.80;

    }


    /*
       MOVIMENTO PC
    */

    const nextX =
        racingCar.x +
        Math.cos(
            racingCar.angle
        ) *
        racingCar.speed *
        dt;


    const nextY =
        racingCar.y +
        Math.sin(
            racingCar.angle
        ) *
        racingCar.speed *
        dt;


    if (
        isCarInsideTrack(
            nextX,
            nextY
        )
    ) {

        racingCar.x =
            nextX;

        racingCar.y =
            nextY;

    } else {

        racingCar.speed *=
            0.82;


        createDust(
            racingCar.x,
            racingCar.y,
            1
        );

    }


    racingCar.wheelSpin +=
        racingCar.speed *
        dt *
        0.25;

}


/* =========================================================
   COLLISIONE PISTA
   ========================================================= */

function isCarInsideTrack(x, y) {

    const outer =
        TRACK.outer;

    const inner =
        TRACK.inner;


    const margin = 17;


    const insideOuter =
        x >=
            outer.x +
            margin &&

        x <=
            outer.x +
            outer.width -
            margin &&

        y >=
            outer.y +
            margin &&

        y <=
            outer.y +
            outer.height -
            margin;


    const insideInner =
        x >=
            inner.x -
            margin &&

        x <=
            inner.x +
            inner.width +
            margin &&

        y >=
            inner.y -
            margin &&

        y <=
            inner.y +
            inner.height +
            margin;


    return (
        insideOuter &&
        !insideInner
    );

}


/* =========================================================
   OLIO
   ========================================================= */

function getOilPuddleAt(x, y) {

    for (
        const oil
        of OIL_PUDDLES
    ) {

        const dx =
            (x - oil.x) /
            oil.radiusX;

        const dy =
            (y - oil.y) /
            oil.radiusY;


        if (
            dx * dx +
            dy * dy <=
            1
        ) {

            return oil;

        }

    }


    return null;

}


/* =========================================================
   CHECKPOINT
   ========================================================= */

function checkRacingCheckpoints() {

    if (racingFinished) {
        return;
    }


    if (
        racingCheckpointIndex >=
        CHECKPOINTS.length
    ) {
        return;
    }


    const checkpoint =
        CHECKPOINTS[
            racingCheckpointIndex
        ];


    if (!checkpoint) {
        return;
    }


    /*
     * Zona di rilevamento molto generosa.
     *
     * Non controlliamo più:
     * - direzione
     * - singolo frame
     * - intersezione di segmenti
     *
     * Controlliamo semplicemente se la macchina
     * è sufficientemente vicina alla zona del
     * checkpoint.
     */

    const padding = 65;


    const left =
        checkpoint.x -
        padding;

    const right =
        checkpoint.x +
        checkpoint.width +
        padding;

    const top =
        checkpoint.y -
        padding;

    const bottom =
        checkpoint.y +
        checkpoint.height +
        padding;


    const insideZone =
        racingCar.x >= left &&
        racingCar.x <= right &&
        racingCar.y >= top &&
        racingCar.y <= bottom;


    if (!insideZone) {
        return;
    }


    /*
     * Checkpoint superato.
     *
     * L'indice obbliga comunque a seguire:
     *
     * CP1 → CP2 → CP3 → CP4 → CP5
     */

    racingCheckpointIndex++;


    createCheckpointParticles(
        racingCar.x,
        racingCar.y
    );


    updateCheckpointStatus();

}


/* =========================================================
   TRAGUARDO
   ========================================================= */

function checkRacingFinish() {

    if (racingFinished) {
        return;
    }


    /*
       Il traguardo è valido solamente dopo
       aver completato tutti i checkpoint.
    */

    if (
        racingCheckpointIndex <
        CHECKPOINTS.length
    ) {

        return;
    }


    /*
       Il traguardo deve essere raggiunto
       all'interno della sua zona.
    */

    const finishLeft =
        FINISH_LINE.x - 30;

    const finishRight =
        FINISH_LINE.x +
        FINISH_LINE.width +
        30;

    const finishTop =
        FINISH_LINE.y - 30;

    const finishBottom =
        FINISH_LINE.y +
        FINISH_LINE.height +
        30;


    const insideFinishZone =
        racingCar.x >= finishLeft &&
        racingCar.x <= finishRight &&
        racingCar.y >= finishTop &&
        racingCar.y <= finishBottom;


    if (!insideFinishZone) {
        return;
    }


    /*
       PRIMO / SECONDO GIRO

       Passiamo semplicemente al giro successivo.
    */

    if (
        racingCurrentLap <
        RACING_LAPS
    ) {

        completeRacingLap();

        return;
    }


    /*
       TERZO GIRO

       Traguardo finale.
       Nessun cooldown.
       Nessun ritardo.
    */

    finishRacingGame();

}


/* =========================================================
   GIRO COMPLETATO
   ========================================================= */

function completeRacingLap() {

    const now =
        performance.now();


    const lapTime =
        now -
        racingLapStartTimestamp;


    if (
        racingBestLap === null ||
        lapTime < racingBestLap
    ) {

        racingBestLap =
            lapTime;

    }


    /*
       ULTIMO GIRO
    */

    if (
        racingCurrentLap >=
        RACING_LAPS
    ) {


        finishRacingGame();

        return;

    }


    /*
       GIRO SUCCESSIVO
    */

    racingCurrentLap++;


    racingLapStartTimestamp =
        now;


    racingCheckpointIndex = 0;


    racingFinishCooldown =
        now + 1200;


    createLapCompleteEffect(
        racingCar.x,
        racingCar.y
    );


    updateCheckpointStatus();

}


/* =========================================================
   STATUS
   ========================================================= */

function updateCheckpointStatus() {

    if (!racingTrackStatusText) {
        return;
    }


    if (
        racingCheckpointIndex <
        CHECKPOINTS.length
    ) {

        racingTrackStatusText.textContent =
            `Checkpoint ${
                racingCheckpointIndex + 1
            } / ${
                CHECKPOINTS.length
            }`;

    } else {

        racingTrackStatusText.textContent =
            "🏁 TRAGUARDO →";

    }

}


/* =========================================================
   FINE GARA
   ========================================================= */

function finishRacingGame() {

    if (racingFinished) {
        return;
    }


    racingFinished = true;

    racingRunning = false;

    racingCountdownActive = false;


    clearCountdownTimer();

    hideCountdown();


    setMobileControlsVisible(false);


    if (
        racingAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            racingAnimationFrame
        );

        racingAnimationFrame = null;

    }


    if (racingFinalTimeElement) {

        racingFinalTimeElement.textContent =
            formatRacingTime(
                racingTotalElapsed
            );

    }


    if (racingFinalBestLapElement) {

        racingFinalBestLapElement.textContent =
            racingBestLap !== null
                ? formatRacingTime(
                    racingBestLap
                )
                : "--:--.--";

    }


    if (racingGameScreen) {

        racingGameScreen.hidden = true;

    }


    if (racingVictoryScreen) {

        racingVictoryScreen.hidden = false;

    }

}


/* =========================================================
   STOP
   ========================================================= */

function stopRacingGame() {

    racingRunning = false;

    racingCountdownActive = false;


    clearCountdownTimer();

    hideCountdown();


    setMobileControlsVisible(false);


    if (
        racingAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            racingAnimationFrame
        );

        racingAnimationFrame = null;

    }


    clearRacingKeys();

    resetMobileJoystick();

}


/* =========================================================
   HUD
   ========================================================= */

function updateRacingHUD() {

    if (racingLapElement) {

        racingLapElement.textContent =
            `${racingCurrentLap} / ${RACING_LAPS}`;

    }


    if (racingTimeElement) {

        racingTimeElement.textContent =
            formatRacingTime(
                racingTotalElapsed
            );

    }


    if (racingBestLapElement) {

        racingBestLapElement.textContent =
            racingBestLap !== null
                ? formatRacingTime(
                    racingBestLap
                )
                : "--:--.--";

    }

}


/* =========================================================
   TEMPO
   ========================================================= */

function formatRacingTime(milliseconds) {

    const centiseconds =
        Math.floor(
            milliseconds / 10
        );


    const minutes =
        Math.floor(
            centiseconds / 6000
        );


    const seconds =
        Math.floor(
            (centiseconds % 6000) /
            100
        );


    const hundredths =
        centiseconds % 100;


    return (
        String(minutes).padStart(
            2,
            "0"
        ) +
        ":" +
        String(seconds).padStart(
            2,
            "0"
        ) +
        "." +
        String(hundredths).padStart(
            2,
            "0"
        )
    );

}


/* =========================================================
   SCENA
   ========================================================= */

function drawRacingScene() {

    if (!racingContext) {
        return;
    }


    racingContext.clearRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );


    racingContext.save();


    if (racingShake > 0) {

        racingContext.translate(
            (Math.random() - 0.5) *
                racingShake,

            (Math.random() - 0.5) *
                racingShake
        );

    }


    drawBackground();

    drawTrackShadow();

    drawTrack();

    drawTrackRoadDetails();

    drawTrees();

    drawOilPuddles();

    drawRacingObstacles();

    drawFinishLine();

    drawSkidMarks();

    drawParticles();

    drawCar();


    racingContext.restore();

}


/* =========================================================
   SFONDO
   ========================================================= */

function drawBackground() {

    const gradient =
        racingContext.createLinearGradient(
            0,
            0,
            0,
            CANVAS_HEIGHT
        );


    gradient.addColorStop(
        0,
        "#15803d"
    );

    gradient.addColorStop(
        0.5,
        "#166534"
    );

    gradient.addColorStop(
        1,
        "#064e3b"
    );


    racingContext.fillStyle =
        gradient;

    racingContext.fillRect(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );


    racingContext.save();

    racingContext.globalAlpha =
        0.08;

    racingContext.fillStyle =
        "#bbf7d0";


    for (
        let y = 0;
        y < CANVAS_HEIGHT;
        y += 32
    ) {

        racingContext.fillRect(
            0,
            y,
            CANVAS_WIDTH,
            13
        );

    }


    racingContext.restore();


    racingContext.save();

    racingContext.globalAlpha =
        0.13;

    racingContext.strokeStyle =
        "#bbf7d0";

    racingContext.lineWidth = 1;


    for (
        let y = 0;
        y < CANVAS_HEIGHT;
        y += 17
    ) {

        for (
            let x = 0;
            x < CANVAS_WIDTH;
            x += 21
        ) {

            const offset =
                (
                    x * 13 +
                    y * 7
                ) % 17;


            racingContext.beginPath();

            racingContext.moveTo(
                x + offset,
                y + 7
            );

            racingContext.lineTo(
                x + offset + 3,
                y
            );

            racingContext.stroke();

        }

    }


    racingContext.restore();

}


/* =========================================================
   OMBRA PISTA
   ========================================================= */

function drawTrackShadow() {

    racingContext.save();

    racingContext.shadowColor =
        "rgba(0,0,0,0.50)";

    racingContext.shadowBlur = 30;

    racingContext.shadowOffsetY = 15;

    racingContext.fillStyle =
        "#111827";

    racingContext.fillRect(
        TRACK.outer.x,
        TRACK.outer.y,
        TRACK.outer.width,
        TRACK.outer.height
    );

    racingContext.restore();

}


/* =========================================================
   PISTA
   ========================================================= */

function drawTrack() {

    racingContext.fillStyle =
        "#111827";

    racingContext.fillRect(
        TRACK.outer.x - 12,
        TRACK.outer.y - 12,
        TRACK.outer.width + 24,
        TRACK.outer.height + 24
    );


    const asphalt =
        racingContext.createLinearGradient(
            0,
            TRACK.outer.y,
            0,
            TRACK.outer.y +
                TRACK.outer.height
        );


    asphalt.addColorStop(
        0,
        "#484b53"
    );

    asphalt.addColorStop(
        0.5,
        "#272a30"
    );

    asphalt.addColorStop(
        1,
        "#35383f"
    );


    racingContext.fillStyle =
        asphalt;

    racingContext.fillRect(
        TRACK.outer.x,
        TRACK.outer.y,
        TRACK.outer.width,
        TRACK.outer.height
    );


    const grass =
        racingContext.createLinearGradient(
            0,
            TRACK.inner.y,
            0,
            TRACK.inner.y +
                TRACK.inner.height
        );


    grass.addColorStop(
        0,
        "#22a052"
    );

    grass.addColorStop(
        1,
        "#14532d"
    );


    racingContext.fillStyle =
        grass;

    racingContext.fillRect(
        TRACK.inner.x,
        TRACK.inner.y,
        TRACK.inner.width,
        TRACK.inner.height
    );


    racingContext.strokeStyle =
        "#f8fafc";

    racingContext.lineWidth = 7;


    racingContext.strokeRect(
        TRACK.outer.x,
        TRACK.outer.y,
        TRACK.outer.width,
        TRACK.outer.height
    );


    racingContext.strokeRect(
        TRACK.inner.x,
        TRACK.inner.y,
        TRACK.inner.width,
        TRACK.inner.height
    );


    drawKerb(
        TRACK.outer
    );

    drawKerb(
        TRACK.inner
    );


    racingContext.save();

    racingContext.globalAlpha =
        0.18;

    racingContext.strokeStyle =
        "#000000";

    racingContext.lineWidth = 18;

    racingContext.strokeRect(
        TRACK.inner.x + 5,
        TRACK.inner.y + 5,
        TRACK.inner.width - 10,
        TRACK.inner.height - 10
    );

    racingContext.restore();

}


/* =========================================================
   CORDOLI
   ========================================================= */

function drawKerb(rectangle) {

    racingContext.save();


    racingContext.lineWidth = 13;

    racingContext.strokeStyle =
        "#dc2626";

    racingContext.setLineDash([
        28,
        28
    ]);


    racingContext.strokeRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
    );


    racingContext.lineDashOffset =
        28;

    racingContext.strokeStyle =
        "#ffffff";


    racingContext.strokeRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
    );


    racingContext.restore();

}


/* =========================================================
   DETTAGLI STRADA
   ========================================================= */

function drawTrackRoadDetails() {

    racingContext.save();


    racingContext.strokeStyle =
        "rgba(255,255,255,0.20)";

    racingContext.lineWidth = 2;

    racingContext.setLineDash([
        30,
        25
    ]);


    racingContext.beginPath();

    racingContext.moveTo(
        315,
        160
    );

    racingContext.lineTo(
        900,
        160
    );

    racingContext.stroke();


    racingContext.beginPath();

    racingContext.moveTo(
        315,
        600
    );

    racingContext.lineTo(
        900,
        600
    );

    racingContext.stroke();


    racingContext.beginPath();

    racingContext.moveTo(
        205,
        270
    );

    racingContext.lineTo(
        205,
        515
    );

    racingContext.stroke();


    racingContext.beginPath();

    racingContext.moveTo(
        995,
        270
    );

    racingContext.lineTo(
        995,
        515
    );

    racingContext.stroke();


    racingContext.restore();


    drawRoadArrow(
        930,
        180,
        0
    );

    drawRoadArrow(
        1010,
        500,
        Math.PI / 2
    );

    drawRoadArrow(
        270,
        600,
        Math.PI
    );

    drawRoadArrow(
        180,
        390,
        -Math.PI / 2
    );

    drawRoadArrow(
        370,
        160,
        0
    );

}


/* =========================================================
   FRECCE
   ========================================================= */

function drawRoadArrow(
    x,
    y,
    angle
) {

    racingContext.save();


    racingContext.translate(
        x,
        y
    );


    racingContext.rotate(
        angle
    );


    racingContext.globalAlpha =
        0.18;

    racingContext.fillStyle =
        "#ffffff";


    racingContext.beginPath();

    racingContext.moveTo(
        18,
        0
    );

    racingContext.lineTo(
        -10,
        -12
    );

    racingContext.lineTo(
        -5,
        0
    );

    racingContext.lineTo(
        -10,
        12
    );

    racingContext.closePath();

    racingContext.fill();


    racingContext.restore();

}


/* =========================================================
   ALBERI
   ========================================================= */

function drawTrees() {

    trees.forEach(
        ([x, y]) => {

            drawTree(
                x,
                y
            );

        }
    );

}


function drawTree(x, y) {

    racingContext.save();


    racingContext.fillStyle =
        "rgba(0,0,0,0.24)";


    racingContext.beginPath();

    racingContext.ellipse(
        x + 5,
        y + 22,
        24,
        9,
        0,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.fillStyle =
        "#713f12";

    racingContext.fillRect(
        x - 5,
        y + 4,
        10,
        26
    );


    racingContext.fillStyle =
        "#052e16";


    racingContext.beginPath();

    racingContext.arc(
        x,
        y - 5,
        26,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.fillStyle =
        "#166534";


    racingContext.beginPath();

    racingContext.arc(
        x - 10,
        y - 9,
        16,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.fillStyle =
        "#22c55e";


    racingContext.beginPath();

    racingContext.arc(
        x + 9,
        y - 12,
        12,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.restore();

}


/* =========================================================
   TRAGUARDO
   ========================================================= */

function drawFinishLine() {

    const cellWidth =
        FINISH_LINE.width / 2;

    const cellHeight =
        FINISH_LINE.height / 12;


    racingContext.save();


    racingContext.fillStyle =
        "rgba(0,0,0,0.35)";


    racingContext.fillRect(
        FINISH_LINE.x + 5,
        FINISH_LINE.y + 5,
        FINISH_LINE.width,
        FINISH_LINE.height
    );


    for (
        let row = 0;
        row < 12;
        row++
    ) {

        for (
            let column = 0;
            column < 2;
            column++
        ) {

            racingContext.fillStyle =
                (
                    row +
                    column
                ) % 2 === 0
                    ? "#ffffff"
                    : "#111827";


            racingContext.fillRect(
                FINISH_LINE.x +
                    column *
                    cellWidth,

                FINISH_LINE.y +
                    row *
                    cellHeight,

                cellWidth + 1,

                cellHeight + 1
            );

        }

    }


    racingContext.strokeStyle =
        "#ffffff";

    racingContext.lineWidth = 2;


    racingContext.strokeRect(
        FINISH_LINE.x,
        FINISH_LINE.y,
        FINISH_LINE.width,
        FINISH_LINE.height
    );


    racingContext.restore();

}


/* =========================================================
   CHECKPOINT MARKERS
   ========================================================= */

function drawCheckpointMarkers() {
    /* Checkpoint invisibili */
}


/* =========================================================
   OLIO - DISEGNO
   ========================================================= */

function drawOilPuddles() {

    OIL_PUDDLES.forEach(
        oil => {

            racingContext.save();


            racingContext.fillStyle =
                "rgba(0,0,0,0.28)";


            racingContext.beginPath();

            racingContext.ellipse(
                oil.x + 3,
                oil.y + 4,
                oil.radiusX,
                oil.radiusY,
                -0.15,
                0,
                Math.PI * 2
            );

            racingContext.fill();


            const oilGradient =
                racingContext.createRadialGradient(
                    oil.x - 8,
                    oil.y - 5,
                    2,
                    oil.x,
                    oil.y,
                    oil.radiusX
                );


            oilGradient.addColorStop(
                0,
                "rgba(55,65,81,0.95)"
            );

            oilGradient.addColorStop(
                0.45,
                "rgba(17,24,39,0.90)"
            );

            oilGradient.addColorStop(
                1,
                "rgba(3,7,18,0.60)"
            );


            racingContext.fillStyle =
                oilGradient;


            racingContext.beginPath();

            racingContext.ellipse(
                oil.x,
                oil.y,
                oil.radiusX,
                oil.radiusY,
                -0.15,
                0,
                Math.PI * 2
            );

            racingContext.fill();


            racingContext.globalAlpha =
                0.38;

            racingContext.strokeStyle =
                "#a5b4fc";

            racingContext.lineWidth = 2;


            racingContext.beginPath();

            racingContext.ellipse(
                oil.x - 5,
                oil.y - 3,
                oil.radiusX * 0.55,
                oil.radiusY * 0.30,
                -0.25,
                0,
                Math.PI
            );

            racingContext.stroke();


            racingContext.strokeStyle =
                "#f9a8d4";


            racingContext.beginPath();

            racingContext.ellipse(
                oil.x + 7,
                oil.y + 4,
                oil.radiusX * 0.35,
                oil.radiusY * 0.20,
                -0.15,
                0,
                Math.PI
            );

            racingContext.stroke();


            racingContext.restore();

        }
    );

}


/* =========================================================
   OSTACOLI - DISEGNO
   ========================================================= */

function drawRacingObstacles() {

    racingObstacles.forEach(
        obstacle => {

            racingContext.save();


            racingContext.translate(
                obstacle.x,
                obstacle.y
            );


            racingContext.rotate(
                obstacle.rotation
            );


            /*
               OMBRA
            */

            racingContext.fillStyle =
                "rgba(0,0,0,0.30)";


            racingContext.beginPath();

            racingContext.ellipse(
                3,
                6,
                23,
                10,
                0,
                0,
                Math.PI * 2
            );

            racingContext.fill();


            if (
                obstacle.type ===
                "tire"
            ) {

                drawRacingTireObstacle();

            } else {

                drawRacingConeObstacle();

            }


            racingContext.restore();

        }
    );

}


/* =========================================================
   OSTACOLO - GOMMA
   ========================================================= */

function drawRacingTireObstacle() {

    racingContext.fillStyle =
        "#09090b";


    racingContext.beginPath();

    racingContext.arc(
        0,
        0,
        20,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.strokeStyle =
        "#27272a";

    racingContext.lineWidth = 3;

    racingContext.stroke();


    racingContext.fillStyle =
        "#52525b";


    racingContext.beginPath();

    racingContext.arc(
        0,
        0,
        8,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.fillStyle =
        "#09090b";


    racingContext.beginPath();

    racingContext.arc(
        0,
        0,
        4,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.strokeStyle =
        "rgba(255,255,255,0.16)";

    racingContext.lineWidth = 2;


    racingContext.beginPath();

    racingContext.arc(
        -4,
        -4,
        12,
        Math.PI * 1.1,
        Math.PI * 1.8
    );

    racingContext.stroke();

}


/* =========================================================
   OSTACOLO - CONO
   ========================================================= */

function drawRacingConeObstacle() {

    const coneGradient =
        racingContext.createLinearGradient(
            -14,
            -18,
            14,
            20
        );


    coneGradient.addColorStop(
        0,
        "#fb923c"
    );

    coneGradient.addColorStop(
        0.55,
        "#f97316"
    );

    coneGradient.addColorStop(
        1,
        "#c2410c"
    );


    racingContext.fillStyle =
        coneGradient;


    racingContext.beginPath();

    racingContext.moveTo(
        0,
        -22
    );

    racingContext.lineTo(
        14,
        18
    );

    racingContext.lineTo(
        -14,
        18
    );

    racingContext.closePath();

    racingContext.fill();


    racingContext.fillStyle =
        "#ffffff";

    racingContext.fillRect(
        -10,
        3,
        20,
        6
    );


    racingContext.fillStyle =
        "#c2410c";


    racingContext.fillRect(
        -17,
        17,
        34,
        6
    );


    racingContext.strokeStyle =
        "rgba(0,0,0,0.35)";

    racingContext.lineWidth = 2;

    racingContext.strokeRect(
        -17,
        17,
        34,
        6
    );

}


/* =========================================================
   MACCHINA
   ========================================================= */

function drawCar() {

    racingContext.save();


    racingContext.translate(
        racingCar.x,
        racingCar.y
    );


    racingContext.rotate(
        racingCar.angle +
        Math.PI / 2
    );


    const w =
        racingCar.width;


    /*
       SCIA
    */

    if (
        Math.abs(
            racingCar.speed
        ) > 4
    ) {

        racingContext.save();

        racingContext.globalAlpha =
            0.18;

        racingContext.strokeStyle =
            "#ffffff";

        racingContext.lineWidth = 2;


        for (
            let i = -2;
            i <= 2;
            i++
        ) {

            racingContext.beginPath();

            racingContext.moveTo(
                i * 8,
                34
            );

            racingContext.lineTo(
                i * 13,
                65
            );

            racingContext.stroke();

        }


        racingContext.restore();

    }


    /*
       OMBRA
    */

    racingContext.save();

    racingContext.translate(
        4,
        7
    );

    racingContext.fillStyle =
        "rgba(0,0,0,0.42)";

    racingContext.filter =
        "blur(4px)";


    racingContext.beginPath();

    racingContext.ellipse(
        0,
        4,
        24,
        38,
        0,
        0,
        Math.PI * 2
    );

    racingContext.fill();

    racingContext.restore();


    /*
       RUOTE
    */

    drawFormulaWheel(
        -20,
        -21,
        racingCar.steeringVisual
    );

    drawFormulaWheel(
        20,
        -21,
        racingCar.steeringVisual
    );

    drawFormulaWheel(
        -20,
        21,
        0
    );

    drawFormulaWheel(
        20,
        21,
        0
    );


    /*
       ALA ANTERIORE
    */

    racingContext.fillStyle =
        "#111827";

    racingContext.fillRect(
        -24,
        -35,
        48,
        5
    );


    racingContext.fillStyle =
        "#dc2626";

    racingContext.fillRect(
        -24,
        -39,
        48,
        4
    );


    /*
       MUSO
    */

    const noseGradient =
        racingContext.createLinearGradient(
            -8,
            -34,
            8,
            -18
        );


    noseGradient.addColorStop(
        0,
        "#fecaca"
    );

    noseGradient.addColorStop(
        0.45,
        "#ef4444"
    );

    noseGradient.addColorStop(
        1,
        "#991b1b"
    );


    racingContext.fillStyle =
        noseGradient;


    racingContext.beginPath();

    racingContext.moveTo(
        0,
        -37
    );

    racingContext.lineTo(
        9,
        -23
    );

    racingContext.lineTo(
        11,
        -7
    );

    racingContext.lineTo(
        -11,
        -7
    );

    racingContext.lineTo(
        -9,
        -23
    );

    racingContext.closePath();

    racingContext.fill();


    /*
       CORPO
    */

    const bodyGradient =
        racingContext.createLinearGradient(
            -w / 2,
            0,
            w / 2,
            0
        );


    bodyGradient.addColorStop(
        0,
        "#7f1d1d"
    );

    bodyGradient.addColorStop(
        0.18,
        "#dc2626"
    );

    bodyGradient.addColorStop(
        0.50,
        "#ef4444"
    );

    bodyGradient.addColorStop(
        0.78,
        "#dc2626"
    );

    bodyGradient.addColorStop(
        1,
        "#7f1d1d"
    );


    racingContext.fillStyle =
        bodyGradient;


    racingContext.beginPath();

    racingContext.moveTo(
        0,
        -29
    );

    racingContext.lineTo(
        13,
        -20
    );

    racingContext.lineTo(
        17,
        5
    );

    racingContext.lineTo(
        13,
        27
    );

    racingContext.lineTo(
        8,
        34
    );

    racingContext.lineTo(
        -8,
        34
    );

    racingContext.lineTo(
        -13,
        27
    );

    racingContext.lineTo(
        -17,
        5
    );

    racingContext.lineTo(
        -13,
        -20
    );

    racingContext.closePath();

    racingContext.fill();


    racingContext.strokeStyle =
        "#450a0a";

    racingContext.lineWidth = 2;

    racingContext.stroke();


    /*
       FIANCATE
    */

    racingContext.fillStyle =
        "#991b1b";


    racingContext.beginPath();

    racingContext.moveTo(
        -15,
        -5
    );

    racingContext.lineTo(
        -24,
        5
    );

    racingContext.lineTo(
        -18,
        22
    );

    racingContext.lineTo(
        -10,
        18
    );

    racingContext.closePath();

    racingContext.fill();


    racingContext.beginPath();

    racingContext.moveTo(
        15,
        -5
    );

    racingContext.lineTo(
        24,
        5
    );

    racingContext.lineTo(
        18,
        22
    );

    racingContext.lineTo(
        10,
        18
    );

    racingContext.closePath();

    racingContext.fill();


    /*
       COCKPIT
    */

    racingContext.fillStyle =
        "#09090b";


    racingContext.beginPath();

    racingContext.ellipse(
        0,
        -4,
        9,
        14,
        0,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    /*
       CASCO
    */

    const helmet =
        racingContext.createRadialGradient(
            -2,
            -8,
            1,
            2,
            -5,
            8
        );


    helmet.addColorStop(
        0,
        "#fef08a"
    );

    helmet.addColorStop(
        0.55,
        "#facc15"
    );

    helmet.addColorStop(
        1,
        "#a16207"
    );


    racingContext.fillStyle =
        helmet;


    racingContext.beginPath();

    racingContext.arc(
        0,
        -7,
        6,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    /*
       VISIERA
    */

    racingContext.fillStyle =
        "#111827";

    racingContext.fillRect(
        -5,
        -8,
        10,
        3
    );


    /*
       STRISCIA
    */

    racingContext.fillStyle =
        "rgba(255,255,255,0.82)";

    racingContext.fillRect(
        -2,
        -27,
        4,
        50
    );


    /*
       ALA POSTERIORE
    */

    racingContext.fillStyle =
        "#111827";

    racingContext.fillRect(
        -21,
        27,
        42,
        6
    );

    racingContext.fillRect(
        -17,
        23,
        4,
        12
    );

    racingContext.fillRect(
        13,
        23,
        4,
        12
    );


    /*
       LUCI
    */

    racingContext.fillStyle =
        "#fecaca";

    racingContext.fillRect(
        -9,
        24,
        5,
        3
    );

    racingContext.fillRect(
        4,
        24,
        5,
        3
    );


    /*
       NUMERO
    */

    racingContext.fillStyle =
        "#ffffff";

    racingContext.font =
        "900 9px Arial";

    racingContext.textAlign =
        "center";

    racingContext.textBaseline =
        "middle";

    racingContext.fillText(
        "7",
        0,
        18
    );


    racingContext.restore();

}


/* =========================================================
   RUOTE
   ========================================================= */

function drawFormulaWheel(
    x,
    y,
    steering
) {

    racingContext.save();


    racingContext.translate(
        x,
        y
    );


    racingContext.rotate(
        steering * 0.20
    );


    racingContext.fillStyle =
        "#09090b";


    racingContext.beginPath();

    racingContext.roundRect(
        -5,
        -10,
        10,
        20,
        3
    );

    racingContext.fill();


    racingContext.fillStyle =
        "#71717a";


    racingContext.beginPath();

    racingContext.ellipse(
        0,
        0,
        3,
        6,
        0,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.fillStyle =
        "#18181b";


    racingContext.beginPath();

    racingContext.ellipse(
        0,
        0,
        1.5,
        3,
        0,
        0,
        Math.PI * 2
    );

    racingContext.fill();


    racingContext.restore();

}


/* =========================================================
   EFFETTI
   ========================================================= */

function updateRacingEffects(delta) {

    racingShake *=
        0.86;


    racingSkidMarks =
        racingSkidMarks.filter(
            mark => {

                mark.alpha -=
                    delta *
                    0.00004;

                return mark.alpha > 0;

            }
        );


    racingParticles =
        racingParticles.filter(
            particle => {

                particle.x +=
                    particle.vx *
                    delta /
                    16.6667;

                particle.y +=
                    particle.vy *
                    delta /
                    16.6667;

                particle.life -=
                    delta;

                particle.size *=
                    0.998;

                return particle.life > 0;

            }
        );


    if (
        Math.abs(
            racingCar.speed
        ) > 3.5 &&

        (
            racingKeys.left ||
            racingKeys.right ||
            Math.abs(
                mobileControls.x
            ) > 0.45
        )
    ) {

        createSkidMark();

    }

}


/* =========================================================
   SKID MARK
   ========================================================= */

function createSkidMark() {

    const rear = 27;


    const cos =
        Math.cos(
            racingCar.angle
        );


    const sin =
        Math.sin(
            racingCar.angle
        );


    for (
        const side of [-1, 1]
    ) {

        racingSkidMarks.push({

            x:
                racingCar.x -
                cos * rear -
                sin * side * 10,

            y:
                racingCar.y -
                sin * rear +
                cos * side * 10,

            angle:
                racingCar.angle,

            alpha:
                0.20

        });

    }


    if (
        racingSkidMarks.length >
        150
    ) {

        racingSkidMarks.splice(
            0,
            20
        );

    }

}


/* =========================================================
   POLVERE
   ========================================================= */

function createDust(
    x,
    y,
    count
) {

    for (
        let i = 0;
        i < count;
        i++
    ) {

        racingParticles.push({

            x:
                x +
                (
                    Math.random() -
                    0.5
                ) *
                14,

            y:
                y +
                (
                    Math.random() -
                    0.5
                ) *
                14,

            vx:
                (
                    Math.random() -
                    0.5
                ) *
                0.8,

            vy:
                (
                    Math.random() -
                    0.5
                ) *
                0.8,

            size:
                2 +
                Math.random() *
                3,

            life:
                400 +
                Math.random() *
                300,

            alpha:
                0.30,

            type:
                "dust"

        });

    }

}


/* =========================================================
   PARTICELLE CHECKPOINT
   ========================================================= */

function createCheckpointParticles(
    x,
    y
) {

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        racingParticles.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                (
                    0.5 +
                    Math.random()
                ),

            vy:
                Math.sin(angle) *
                (
                    0.5 +
                    Math.random()
                ),

            size:
                2 +
                Math.random() *
                3,

            life:
                500 +
                Math.random() *
                400,

            alpha:
                0.70,

            type:
                "checkpoint"

        });

    }

}


/* =========================================================
   PARTICELLE GIRO
   ========================================================= */

function createLapCompleteEffect(
    x,
    y
) {

    for (
        let i = 0;
        i < 25;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        racingParticles.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                (
                    0.5 +
                    Math.random() *
                    1.5
                ),

            vy:
                Math.sin(angle) *
                (
                    0.5 +
                    Math.random() *
                    1.5
                ),

            size:
                2 +
                Math.random() *
                4,

            life:
                700 +
                Math.random() *
                500,

            alpha:
                0.85,

            type:
                "lap"

        });

    }

}


/* =========================================================
   DRAW SKID
   ========================================================= */

function drawSkidMarks() {

    racingContext.save();


    racingSkidMarks.forEach(
        mark => {

            racingContext.save();


            racingContext.translate(
                mark.x,
                mark.y
            );


            racingContext.rotate(
                mark.angle
            );


            racingContext.globalAlpha =
                mark.alpha;


            racingContext.fillStyle =
                "#09090b";


            racingContext.fillRect(
                -2,
                -4,
                4,
                9
            );


            racingContext.restore();

        }
    );


    racingContext.restore();

}


/* =========================================================
   DRAW PARTICELLE
   ========================================================= */

function drawParticles() {

    racingContext.save();


    racingParticles.forEach(
        particle => {

            const alpha =
                Math.max(
                    0,
                    Math.min(
                        1,
                        particle.life /
                        600
                    )
                ) *
                particle.alpha;


            racingContext.globalAlpha =
                alpha;


            if (
                particle.type ===
                "checkpoint"
            ) {

                racingContext.fillStyle =
                    "#22c55e";

            } else if (
                particle.type ===
                "lap"
            ) {

                racingContext.fillStyle =
                    "#60a5fa";

            } else if (
                particle.type ===
                "obstacle"
            ) {

                racingContext.fillStyle =
                    "#fb923c";

            } else {

                racingContext.fillStyle =
                    "#d1d5db";

            }


            racingContext.beginPath();

            racingContext.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );

            racingContext.fill();

        }
    );


    racingContext.restore();

}


/* =========================================================
   KEYBOARD
   ========================================================= */

function initializeKeyboard() {

    window.addEventListener(
        "keydown",
        event => {

            switch (
                event.key.toLowerCase()
            ) {

                case "arrowup":
                case "w":

                    racingKeys.up = true;

                    event.preventDefault();

                    break;


                case "arrowdown":
                case "s":

                    racingKeys.down = true;

                    event.preventDefault();

                    break;


                case "arrowleft":
                case "a":

                    racingKeys.left = true;

                    event.preventDefault();

                    break;


                case "arrowright":
                case "d":

                    racingKeys.right = true;

                    event.preventDefault();

                    break;

            }

        }
    );


    window.addEventListener(
        "keyup",
        event => {

            switch (
                event.key.toLowerCase()
            ) {

                case "arrowup":
                case "w":

                    racingKeys.up = false;

                    break;


                case "arrowdown":
                case "s":

                    racingKeys.down = false;

                    break;


                case "arrowleft":
                case "a":

                    racingKeys.left = false;

                    break;


                case "arrowright":
                case "d":

                    racingKeys.right = false;

                    break;

            }

        }
    );


    window.addEventListener(
        "blur",
        clearRacingKeys
    );

}


/* =========================================================
   MOBILE CONTROLS
   ========================================================= */

function initializeMobileControls() {

    if (!isMobileDevice()) {
        return;
    }


    createMobileControls();


    window.addEventListener(
        "pointerup",
        event => {

            if (
                mobileControls.pointerId ===
                event.pointerId
            ) {

                resetMobileJoystick();

            }


            if (
                mobileControls.acceleratorPointerId ===
                event.pointerId
            ) {

                mobileControls.accelerator =
                    false;

                mobileControls.acceleratorPointerId =
                    null;

                updateAcceleratorVisual();

            }

        }
    );


    window.addEventListener(
        "pointercancel",
        event => {

            if (
                mobileControls.pointerId ===
                event.pointerId
            ) {

                resetMobileJoystick();

            }


            if (
                mobileControls.acceleratorPointerId ===
                event.pointerId
            ) {

                mobileControls.accelerator =
                    false;

                mobileControls.acceleratorPointerId =
                    null;

                updateAcceleratorVisual();

            }

        }
    );

}


/* =========================================================
   CREA CONTROLLI MOBILE
   ========================================================= */

function createMobileControls() {

    if (
        document.getElementById(
            "racingMobileControls"
        )
    ) {
        return;
    }


    const controls =
        document.createElement("div");

    controls.id =
        "racingMobileControls";


    /*
     * JOYSTICK
     */

    const joystick =
        document.createElement("div");

    joystick.id =
        "racingJoystick";


    const joystickBase =
        document.createElement("div");

    joystickBase.id =
        "racingJoystickBase";


    const joystickKnob =
        document.createElement("div");

    joystickKnob.id =
        "racingJoystickKnob";


    joystickBase.appendChild(
        joystickKnob
    );

    joystick.appendChild(
        joystickBase
    );


    controls.appendChild(
        joystick
    );


    document.body.appendChild(
        controls
    );


    injectMobileControlsCSS();


    /*
     * JOYSTICK DOWN
     */

    joystickBase.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();


            mobileControls.active =
                true;

            mobileControls.pointerId =
                event.pointerId;


            joystickBase.setPointerCapture(
                event.pointerId
            );


            updateJoystickFromPointer(
                event,
                joystickBase
            );

        },
        {
            passive: false
        }
    );


    /*
     * JOYSTICK MOVE
     */

    joystickBase.addEventListener(
        "pointermove",
        event => {

            if (
                !mobileControls.active ||
                mobileControls.pointerId !==
                    event.pointerId
            ) {
                return;
            }


            event.preventDefault();


            updateJoystickFromPointer(
                event,
                joystickBase
            );

        },
        {
            passive: false
        }
    );


    /*
     * JOYSTICK UP
     */

    joystickBase.addEventListener(
        "pointerup",
        event => {

            event.preventDefault();

            resetMobileJoystick();

        },
        {
            passive: false
        }
    );


    /*
     * JOYSTICK CANCEL
     */

    joystickBase.addEventListener(
        "pointercancel",
        event => {

            event.preventDefault();

            resetMobileJoystick();

        },
        {
            passive: false
        }
    );

}


/* =========================================================
   CSS CONTROLLI MOBILE
   ========================================================= */

function injectMobileControlsCSS() {

    if (
        document.getElementById(
            "racingMobileControlsCSS"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");

    style.id =
        "racingMobileControlsCSS";


    style.textContent = `

        #racingMobileControls {
            position: fixed;
            inset: 0;
            z-index: 50000;
            pointer-events: none;
            display: none;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
        }

        #racingMobileControls.visible {
            display: block;
        }

        #racingJoystick {
            position: absolute;
            left: 12vw;
            bottom: 5vh;
            width: 180px;
            height: 180px;
            pointer-events: auto;
            touch-action: none;
        }

        #racingJoystickBase {
            position: absolute;
            left: 0;
            top: 0;
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background:
                radial-gradient(
                    circle at 35% 30%,
                    rgba(255,255,255,0.20),
                    rgba(255,255,255,0.08) 45%,
                    rgba(0,0,0,0.30)
                );
            border:
                3px solid
                rgba(255,255,255,0.35);
            box-shadow:
                inset 0 0 25px rgba(0,0,0,0.30),
                0 8px 30px rgba(0,0,0,0.35);
            touch-action: none;
        }

        #racingJoystickKnob {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 76px;
            height: 76px;
            transform:
                translate(-50%, -50%);
            border-radius: 50%;
            background:
                radial-gradient(
                    circle at 35% 30%,
                    #f8fafc,
                    #cbd5e1 48%,
                    #64748b 100%
                );
            border:
                3px solid
                rgba(255,255,255,0.75);
            box-shadow:
                0 7px 18px rgba(0,0,0,0.45);
            pointer-events: none;
        }

        #racingAccelerator {
            position: absolute;
            right: 4vw;
            bottom: 5vh;
            width: 150px;
            height: 190px;
            border: 3px solid rgba(255,255,255,0.40);
            border-radius: 34px;
            background:
                linear-gradient(
                    180deg,
                    rgba(34,197,94,0.92),
                    rgba(21,128,61,0.92)
                );
            box-shadow:
                0 10px 30px rgba(0,0,0,0.35),
                inset 0 5px 15px rgba(255,255,255,0.18);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            pointer-events: auto;
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
        }

        #racingAccelerator:active,
        #racingAccelerator.active {
            transform: scale(0.94);
            background:
                linear-gradient(
                    180deg,
                    rgba(74,222,128,0.98),
                    rgba(22,101,52,0.98)
                );
        }

        .racingAcceleratorIcon {
            font-size: 46px;
            line-height: 1;
            text-shadow:
                0 4px 8px rgba(0,0,0,0.30);
        }

        .racingAcceleratorText {
            font-family:
                Arial,
                sans-serif;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 2px;
        }

        @media (orientation: portrait) and (pointer: coarse) {

            #racingMobileControls::before {
                content:
                    "↻  RUOTA IL TELEFONO IN ORIZZONTALE";
                position: absolute;
                left: 50%;
                top: 50%;
                transform:
                    translate(-50%, -50%);
                width: min(90vw, 500px);
                padding: 25px;
                box-sizing: border-box;
                border-radius: 22px;
                background:
                    rgba(0,0,0,0.88);
                color: white;
                font-family:
                    Arial,
                    sans-serif;
                font-size:
                    clamp(18px, 5vw, 30px);
                font-weight: 900;
                text-align: center;
                z-index: 100;
                pointer-events: none;
            }

            #racingJoystick,
            #racingAccelerator {
                opacity: 0;
                pointer-events: none;
            }

        }

        @media (max-width: 700px) and (orientation: landscape) {

            #racingJoystick {
                left: 10vw;
                bottom: 4vh;
                width: 145px;
                height: 145px;
            }

            #racingJoystickBase {
                width: 145px;
                height: 145px;
            }

            #racingJoystickKnob {
                width: 62px;
                height: 62px;
            }

            #racingAccelerator {
                right: 3vw;
                bottom: 4vh;
                width: 115px;
                height: 145px;
                border-radius: 28px;
            }

            .racingAcceleratorIcon {
                font-size: 38px;
            }

            .racingAcceleratorText {
                font-size: 15px;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   VISIBILITÀ CONTROLLI
   ========================================================= */

function setMobileControlsVisible(
    visible
) {

    const controls =
        document.getElementById(
            "racingMobileControls"
        );


    if (!controls) {
        return;
    }


    if (visible) {

        controls.classList.add(
            "visible"
        );

    } else {

        controls.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   JOYSTICK
   ========================================================= */

function updateJoystickFromPointer(
    event,
    base
) {

    if (!base) {
        return;
    }


    const rect =
        base.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;

    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        event.clientX -
        centerX;

    let dy =
        event.clientY -
        centerY;


    /*
       Zona utile più grande:
       serve un movimento maggiore del dito
       per arrivare al massimo dello sterzo.
    */

    const radius =
        rect.width * 0.46;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    if (
        distance > radius
    ) {

        const scale =
            radius /
            distance;

        dx *= scale;
        dy *= scale;

    }


    /*
       Normalizzazione.
    */

    let inputX =
        dx / radius;

    let inputY =
        dy / radius;


    /*
       Zona morta centrale.
       Piccoli movimenti involontari
       non fanno sterzare la macchina.
    */

    const deadZone = 0.12;


    if (
        Math.abs(inputX) < deadZone
    ) {

        inputX = 0;

    } else {

        inputX =
            Math.sign(inputX) *
            (
                (
                    Math.abs(inputX) -
                    deadZone
                ) /
                (1 - deadZone)
            );

    }


    if (
        Math.abs(inputY) < deadZone
    ) {

        inputY = 0;

    } else {

        inputY =
            Math.sign(inputY) *
            (
                (
                    Math.abs(inputY) -
                    deadZone
                ) /
                (1 - deadZone)
            );

    }


    /*
       RIDUZIONE DELLA SENSIBILITÀ.

       Anche portando il dito a metà corsa,
       lo sterzo non arriva subito al massimo.

       0.70 = sensibilità più morbida.
    */

    const steeringSensitivity = 0.55;


    inputX *=
        steeringSensitivity;


    inputY *=
        steeringSensitivity;


    mobileControls.x =
        Math.max(
            -1,
            Math.min(
                1,
                inputX
            )
        );


    mobileControls.y =
        Math.max(
            -1,
            Math.min(
                1,
                inputY
            )
        );


    mobileControls.knobX =
        dx;

    mobileControls.knobY =
        dy;


    const knob =
        document.getElementById(
            "racingJoystickKnob"
        );


    if (knob) {

        knob.style.transform =
            `translate(
                calc(-50% + ${dx}px),
                calc(-50% + ${dy}px)
            )`;

    }

}


/* =========================================================
   RESET JOYSTICK
   ========================================================= */

function resetMobileJoystick() {

    mobileControls.active =
        false;

    mobileControls.pointerId =
        null;

    mobileControls.x = 0;

    mobileControls.y = 0;

    mobileControls.knobX = 0;

    mobileControls.knobY = 0;


    const knob =
        document.getElementById(
            "racingJoystickKnob"
        );


    if (knob) {

        knob.style.transform =
            "translate(-50%, -50%)";

    }

}


/* =========================================================
   ACCELERATORE VISIVO
   ========================================================= */

function updateAcceleratorVisual() {

    const accelerator =
        document.getElementById(
            "racingAccelerator"
        );


    if (!accelerator) {
        return;
    }


    if (
        mobileControls.accelerator
    ) {

        accelerator.classList.add(
            "active"
        );

    } else {

        accelerator.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   CLEAR INPUT
   ========================================================= */

function clearRacingKeys() {

    racingKeys.up = false;

    racingKeys.down = false;

    racingKeys.left = false;

    racingKeys.right = false;

}


/* =========================================================
   UTILITY
   ========================================================= */
function segmentIntersectsRectangle(
    x1,
    y1,
    x2,
    y2,
    rectangle
) {

    /*
     * Se uno dei due estremi è già dentro
     * il rettangolo, è sicuramente un passaggio.
     */

    if (
        pointInsideRectangle(
            x1,
            y1,
            rectangle
        ) ||

        pointInsideRectangle(
            x2,
            y2,
            rectangle
        )
    ) {

        return true;

    }


    /*
     * Calcoliamo l'intersezione del segmento
     * con i quattro lati del rettangolo.
     */

    const left =
        rectangle.x;

    const right =
        rectangle.x +
        rectangle.width;

    const top =
        rectangle.y;

    const bottom =
        rectangle.y +
        rectangle.height;


    /*
     * Segmento verticale.
     */

    if (
        x1 === x2
    ) {

        if (
            x1 < left ||
            x1 > right
        ) {

            return false;

        }


        return (
            Math.max(y1, y2) >= top &&
            Math.min(y1, y2) <= bottom
        );

    }


    /*
     * Segmento orizzontale.
     */

    if (
        y1 === y2
    ) {

        if (
            y1 < top ||
            y1 > bottom
        ) {

            return false;

        }


        return (
            Math.max(x1, x2) >= left &&
            Math.min(x1, x2) <= right
        );

    }


    /*
     * Parametro del segmento.
     */

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;


    /*
     * Intersezione con X sinistro.
     */

    const tLeft =
        (left - x1) /
        dx;

    if (
        tLeft >= 0 &&
        tLeft <= 1
    ) {

        const y =
            y1 +
            tLeft * dy;

        if (
            y >= top &&
            y <= bottom
        ) {

            return true;

        }

    }


    /*
     * Intersezione con X destro.
     */

    const tRight =
        (right - x1) /
        dx;

    if (
        tRight >= 0 &&
        tRight <= 1
    ) {

        const y =
            y1 +
            tRight * dy;

        if (
            y >= top &&
            y <= bottom
        ) {

            return true;

        }

    }


    /*
     * Intersezione con Y superiore.
     */

    const tTop =
        (top - y1) /
        dy;

    if (
        tTop >= 0 &&
        tTop <= 1
    ) {

        const x =
            x1 +
            tTop * dx;

        if (
            x >= left &&
            x <= right
        ) {

            return true;

        }

    }


    /*
     * Intersezione con Y inferiore.
     */

    const tBottom =
        (bottom - y1) /
        dy;

    if (
        tBottom >= 0 &&
        tBottom <= 1
    ) {

        const x =
            x1 +
            tBottom * dx;

        if (
            x >= left &&
            x <= right
        ) {

            return true;

        }

    }


    return false;

}

function pointInsideRectangle(
    x,
    y,
    rectangle
) {

    return (

        x >=
            rectangle.x &&

        x <=
            rectangle.x +
            rectangle.width &&

        y >=
            rectangle.y &&

        y <=
            rectangle.y +
            rectangle.height

    );

}
