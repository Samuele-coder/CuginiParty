/* ========================================
CUGINIPARTY - UNO ONLINE
UNO.JS
Lobby + Multiplayer + Regole UNO
+ PRESENZA REALE GIOCATORI
======================================== */

console.log("🔥 UNO.JS CARICATO");

/* ========================================
STATO GLOBALE
======================================== */

let currentPlayer = null;
let currentRoom = null;
let players = [];

let isHost = false;
let isReady = false;

let roomChannel = null;
let playersChannel = null;

let rematchStarting = false;

/* ========================================
CONTROLLO ADMIN UNO
======================================== */

const UNO_PLAYER_STORAGE_KEY =
    "CuginiParty_uno_player_id";

let unoControlState = {

    initialized: false,

    multiplayerEnabled: true,

    roomCreationEnabled: true,

    gameEnabled: true,

    gameMultiplayerEnabled: true,

    gameRoomCreationEnabled: true,

    disabledMessage:
        "Questo gioco è temporaneamente disabilitato."

};

let unoControlRefreshTimer = null;
let unoBlockedCheckTimer = null;

let unoAdminControlChannel = null;

let forceExitInProgress = false;

/* ========================================
PRESENZA
======================================== */

let presenceInterval = null;

const PRESENCE_INTERVAL_MS = 30000;

/*
   Un giocatore viene considerato realmente
   online se last_seen è più recente di questo
   intervallo.
*/
const ONLINE_TIMEOUT_MS = 90000;


/* ========================================
ELEMENTI DOM
======================================== */

let nicknameInput;
let roomCodeInput;

let createRoomButton;
let joinRoomButton;

let startScreen;
let roomScreen;
let gameScreen;

let startError;
let roomError;
let gameError;

let roomCodeDisplay;
let gameRoomCode;

let playersList;
let playerCount;

let hostName;

let readyButton;
let hostControls;
let startGameButton;
let readyInfo;

let copyRoomCodeButton;
let leaveRoomButton;

let roomStatus;

let connectionDot;
let connectionText;

let gameTurnInfo;
let turnMessage;
let colorChoiceMessage;
let colorChoiceBall;
let colorChoiceBallIcon;
let colorChoicePlayer;
let colorChoiceColor;
let colorChoiceHideTimeout = null;

let drawCardButton;
let unoButton;
let colorPicker;


/* ========================================
COSTANTI UNO
======================================== */

const UNO_COLORS = [
    "red",
    "yellow",
    "green",
    "blue"
];

const UNO_WILD = "wild";


/* ========================================
AVVIO
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeUNO
);

function initializeUNO() {

    console.log(
        "🔥 DOMCONTENTLOADED UNO"
    );

    /* ========================================
       ELEMENTI DOM
    ======================================== */

    nicknameInput =
        document.getElementById(
            "nicknameInput"
        );

    roomCodeInput =
        document.getElementById(
            "roomCodeInput"
        );

    createRoomButton =
        document.getElementById(
            "createRoomButton"
        );

    joinRoomButton =
        document.getElementById(
            "joinRoomButton"
        );

    startScreen =
        document.getElementById(
            "startScreen"
        );

    roomScreen =
        document.getElementById(
            "roomScreen"
        );

    gameScreen =
        document.getElementById(
            "gameScreen"
        );

    startError =
        document.getElementById(
            "startError"
        );

    roomError =
        document.getElementById(
            "roomError"
        );

    gameError =
        document.getElementById(
            "gameError"
        );

    roomCodeDisplay =
        document.getElementById(
            "roomCodeDisplay"
        );

    gameRoomCode =
        document.getElementById(
            "gameRoomCode"
        );

    playersList =
        document.getElementById(
            "playersList"
        );

    playerCount =
        document.getElementById(
            "playerCount"
        );

    hostName =
        document.getElementById(
            "hostName"
        );

    readyButton =
        document.getElementById(
            "readyButton"
        );

    hostControls =
        document.getElementById(
            "hostControls"
        );

    startGameButton =
        document.getElementById(
            "startGameButton"
        );

    readyInfo =
        document.getElementById(
            "readyInfo"
        );

    copyRoomCodeButton =
        document.getElementById(
            "copyRoomCodeButton"
        );

    leaveRoomButton =
        document.getElementById(
            "leaveRoomButton"
        );

    roomStatus =
        document.getElementById(
            "roomStatus"
        );

    connectionDot =
        document.getElementById(
            "connectionDot"
        );

    connectionText =
        document.getElementById(
            "connectionText"
        );

    gameTurnInfo =
        document.getElementById(
            "gameTurnInfo"
        );

    turnMessage =
        document.getElementById(
            "turnMessage"
        );

    colorChoiceMessage =
        document.getElementById(
            "colorChoiceMessage"
        );

    colorChoiceBall =
        document.getElementById(
            "colorChoiceBall"
        );

    colorChoiceBallIcon =
        document.getElementById(
            "colorChoiceBallIcon"
        );

    colorChoicePlayer =
        document.getElementById(
            "colorChoicePlayer"
        );

    colorChoiceColor =
        document.getElementById(
            "colorChoiceColor"
        );

    drawCardButton =
        document.getElementById(
            "drawCardButton"
        );

    unoButton =
        document.getElementById(
            "unoButton"
        );

    colorPicker =
        document.getElementById(
            "colorPicker"
        );


    if (
        !createRoomButton ||
        !joinRoomButton
    ) {

        console.error(
            "❌ Pulsanti UNO non trovati."
        );

        return;
    }


    /* ========================================
       EVENTI PRINCIPALI
    ======================================== */

    createRoomButton.addEventListener(
        "click",
        createRoom
    );

    joinRoomButton.addEventListener(
        "click",
        joinRoom
    );


    if (readyButton) {

        readyButton.addEventListener(
            "click",
            toggleReady
        );
    }


    if (startGameButton) {

        startGameButton.addEventListener(
            "click",
            startGame
        );
    }


    if (copyRoomCodeButton) {

        copyRoomCodeButton.addEventListener(
            "click",
            copyRoomCode
        );
    }


    if (leaveRoomButton) {

        leaveRoomButton.addEventListener(
            "click",
            leaveRoom
        );
    }


    /* ========================================
       EVENTI GIOCO
    ======================================== */

    if (drawCardButton) {

        drawCardButton.addEventListener(
            "click",
            drawCard
        );
    }


    const drawPile =
        document.getElementById(
            "drawPile"
        );


    if (drawPile) {

        drawPile.addEventListener(
            "click",
            drawCard
        );
    }


    const passButton =
        document.getElementById(
            "passTurnButton"
        );


    if (passButton) {

        passButton.addEventListener(
            "click",
            passTurn
        );
    }


    if (unoButton) {

        unoButton.addEventListener(
            "click",
            callUno
        );
    }


    /* ========================================
       CODICE STANZA
    ======================================== */

    if (roomCodeInput) {

        roomCodeInput.addEventListener(
            "input",
            () => {

                roomCodeInput.value =
                    roomCodeInput.value
                        .toUpperCase()
                        .replace(
                            /[^A-Z0-9]/g,
                            ""
                        )
                        .slice(0, 6);

            }
        );
    }


    /* ========================================
       ENTER
    ======================================== */

    if (nicknameInput) {

        nicknameInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    createRoom();

                }

            }
        );
    }


    if (roomCodeInput) {

        roomCodeInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    joinRoom();

                }

            }
        );
    }


    /* ========================================
       CONNESSIONE
    ======================================== */

    updateConnectionStatus();


    window.addEventListener(
        "online",
        () => {

            setConnectionStatus(
                "online",
                "Online"
            );

            if (
                currentPlayer &&
                currentRoom
            ) {

                updatePlayerPresence();

            }

        }
    );


    window.addEventListener(
        "offline",
        () => {

            setConnectionStatus(
                "offline",
                "Offline"
            );

        }
    );


    updateDrawButtonState();
    updatePassButton();

    refreshUnoControls();

    setupUnoAdminRealtime();

    startUnoControlRefresh();

    console.log(
        "✅ UNO inizializzato correttamente"
    );
}


/* ========================================
CONNESSIONE
======================================== */

function updateConnectionStatus() {

    if (navigator.onLine) {

        setConnectionStatus(
            "online",
            "Online"
        );

    } else {

        setConnectionStatus(
            "offline",
            "Offline"
        );

    }

}


function setConnectionStatus(
    status,
    text
) {

    if (
        !connectionDot ||
        !connectionText
    ) {

        return;
    }


    connectionText.textContent =
        text;


    connectionDot.classList.remove(
        "status-online",
        "status-offline",
        "status-loading"
    );


    if (
        status === "online"
    ) {

        connectionDot.classList.add(
            "status-online"
        );

    } else if (
        status === "offline"
    ) {

        connectionDot.classList.add(
            "status-offline"
        );

    } else {

        connectionDot.classList.add(
            "status-loading"
        );

    }

}


/* ========================================
ID PLAYER
======================================== */

function generatePlayerId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }


    if (
        window.crypto &&
        typeof window.crypto.getRandomValues ===
            "function"
    ) {

        const bytes =
            new Uint8Array(16);


        window.crypto.getRandomValues(
            bytes
        );


        bytes[6] =
            (bytes[6] & 0x0f) | 0x40;


        bytes[8] =
            (bytes[8] & 0x3f) | 0x80;


        const hex =
            Array.from(bytes)
                .map(
                    byte =>
                        byte
                            .toString(16)
                            .padStart(
                                2,
                                "0"
                            )
                )
                .join("");


        return (
            hex.slice(0, 8) +
            "-" +
            hex.slice(8, 12) +
            "-" +
            hex.slice(12, 16) +
            "-" +
            hex.slice(16, 20) +
            "-" +
            hex.slice(20, 32)
        );

    }


    return (
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    ).replace(
        /[xy]/g,
        char => {

            const random =
                Math.floor(
                    Math.random() * 16
                );


            const value =
                char === "x"
                    ? random
                    : (random & 0x3) | 0x8;


            return value.toString(16);

        }
    );

}

function getPersistentPlayerId() {

    let playerId =
        localStorage.getItem(
            UNO_PLAYER_STORAGE_KEY
        );


    const isValidUuid =
        Boolean(
            playerId &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                playerId
            )
        );


    if (!isValidUuid) {

        playerId =
            generatePlayerId();


        localStorage.setItem(
            UNO_PLAYER_STORAGE_KEY,
            playerId
        );

    }


    return playerId;

}


/* ========================================
PRESENZA - HEARTBEAT
======================================== */

async function updatePlayerPresence() {

    if (
        !currentPlayer ||
        !currentRoom
    ) {

        return;
    }


    if (!navigator.onLine) {

        return;
    }


    const now =
        new Date().toISOString();


    try {

        const {
            error
        } =
            await supabaseClient
                .from("uno_players")
                .update({

                    connected:
                        true,

                    last_seen:
                        now

                })
                .eq(
                    "player_id",
                    currentPlayer.id
                )
                .eq(
                    "room_id",
                    currentRoom.id
                );


        if (error) {

            console.warn(
                "⚠️ HEARTBEAT PLAYER:",
                error
            );

            return;
        }


        /*
           La stanza viene considerata attiva
           quando un giocatore presente la aggiorna.
        */

        const {
            error:
                roomUpdateError
        } =
            await supabaseClient
                .from("uno_rooms")
                .update({

                    updated_at:
                        now

                })
                .eq(
                    "id",
                    currentRoom.id
                );


        if (roomUpdateError) {

            console.warn(
                "⚠️ HEARTBEAT ROOM:",
                roomUpdateError
            );
        }


    } catch (error) {

        console.warn(
            "⚠️ ERRORE HEARTBEAT:",
            error
        );

    }

}


/* ========================================
AVVIA HEARTBEAT
======================================== */

function startPresenceHeartbeat() {

    stopPresenceHeartbeat();


    /*
       Aggiornamento immediato.
    */

    updatePlayerPresence();


    /*
       Aggiornamento periodico.
    */

    presenceInterval =
        setInterval(
            updatePlayerPresence,
            PRESENCE_INTERVAL_MS
        );

}


/* ========================================
FERMA HEARTBEAT
======================================== */

function stopPresenceHeartbeat() {

    if (presenceInterval) {

        clearInterval(
            presenceInterval
        );

        presenceInterval =
            null;
    }

}


/* ========================================
SEGNA PLAYER OFFLINE
======================================== */

async function markCurrentPlayerOffline() {

    if (
        !currentPlayer ||
        !currentRoom
    ) {

        return;
    }


    try {

        await supabaseClient
            .from("uno_players")
            .update({

                connected:
                    false,

                last_seen:
                    null

            })
            .eq(
                "player_id",
                currentPlayer.id
            )
            .eq(
                "room_id",
                currentRoom.id
            );

    } catch (error) {

        console.warn(
            "⚠️ OFFLINE PLAYER:",
            error
        );

    }

}


/* ========================================
CONTROLLO STATO UNO DA ADMIN
======================================== */

async function refreshUnoControls() {

    try {

        const [
            settingsResult,
            gameResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("site_settings")
                    .select(
"multiplayer_enabled, new_rooms_enabled"
                    )
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle(),

                supabaseClient
                    .from("site_games")
                    .select(
"enabled, multiplayer_enabled, new_rooms_enabled, disabled_message"
                    )
                    .eq(
                        "game_id",
                        "uno"
                    )
                    .maybeSingle()

            ]);


        if (
            settingsResult.error
        ) {

            throw settingsResult.error;

        }


        if (
            gameResult.error
        ) {

            throw gameResult.error;

        }


        if (
            settingsResult.data
        ) {

            unoControlState.multiplayerEnabled =
                Boolean(
                    settingsResult.data
                        .multiplayer_enabled
                );

            unoControlState.roomCreationEnabled =
                Boolean(
                    settingsResult.data
                        .new_rooms_enabled
                );

        }


        if (
            gameResult.data
        ) {

            unoControlState.gameEnabled =
                Boolean(
                    gameResult.data.enabled
                );

            unoControlState.gameMultiplayerEnabled =
                Boolean(
                    gameResult.data
                        .multiplayer_enabled
                );

            unoControlState.gameRoomCreationEnabled =
                Boolean(
                    gameResult.data
                        .new_rooms_enabled
                );

            unoControlState.disabledMessage =
                gameResult.data.disabled_message ||
                "Questo gioco è temporaneamente disabilitato.";

        }


        unoControlState.initialized =
            true;


        applyUnoControlState();


        if (
            !isUnoMultiplayerAvailable()
        ) {

            if (
                currentRoom
            ) {

                await forceExitUno(
                    "Il multiplayer UNO è stato disattivato dall'amministratore."
                );

            }

        }

    } catch (error) {

        console.warn(
            "⚠️ Impossibile aggiornare i controlli Admin UNO:",
            error
        );


        /*
           Se non abbiamo ancora mai ricevuto
           una configurazione valida,
           blocchiamo le operazioni per sicurezza.
        */

        if (
            !unoControlState.initialized
        ) {

            unoControlState.initialized =
                false;

            disableUnoStartControls(
                "Impossibile verificare lo stato del gioco. Riprova tra poco."
            );

        }

    }

}


function isUnoGameEnabled() {

    return (
        unoControlState.gameEnabled === true
    );

}


function isUnoMultiplayerAvailable() {

    return (
        unoControlState.gameEnabled === true &&

        unoControlState.multiplayerEnabled === true &&

        unoControlState.gameMultiplayerEnabled === true
    );

}


function isUnoRoomCreationAvailable() {

    return (
        isUnoMultiplayerAvailable() &&

        unoControlState.roomCreationEnabled === true &&

        unoControlState.gameRoomCreationEnabled === true
    );

}


function disableUnoStartControls(
    message
) {

    if (createRoomButton) {

        createRoomButton.disabled =
            true;

        createRoomButton.title =
            message;

    }


    if (joinRoomButton) {

        joinRoomButton.disabled =
            true;

        joinRoomButton.title =
            message;

    }


    showUnoControlNotice(
        message
    );

}


function applyUnoControlState() {

    const gameEnabled =
        isUnoGameEnabled();


    const multiplayerEnabled =
        isUnoMultiplayerAvailable();


    const roomCreationEnabled =
        isUnoRoomCreationAvailable();


    if (
        createRoomButton
    ) {

        createRoomButton.disabled =
            !roomCreationEnabled;


        createRoomButton.title =
            roomCreationEnabled
                ? ""
                : (
                    gameEnabled
                        ? (
                            multiplayerEnabled
                                ? "La creazione di nuove stanze è stata disattivata dall'amministratore."
                                : "Il multiplayer UNO è stato disattivato dall'amministratore."
                        )
                        : unoControlState.disabledMessage
                );

    }


    if (
        joinRoomButton
    ) {

        joinRoomButton.disabled =
            !multiplayerEnabled;


        joinRoomButton.title =
            multiplayerEnabled
                ? ""
                : (
                    gameEnabled
                        ? "Il multiplayer UNO è stato disattivato dall'amministratore."
                        : unoControlState.disabledMessage
                );

    }


    if (
        !gameEnabled
    ) {

        showUnoControlNotice(
            unoControlState.disabledMessage
        );

        return;

    }


    if (
        !multiplayerEnabled
    ) {

        showUnoControlNotice(
            "Il multiplayer UNO è attualmente disattivato."
        );

        return;

    }


    if (
        !roomCreationEnabled
    ) {

        showUnoControlNotice(
            "La creazione di nuove stanze è attualmente disattivata."
        );

        return;

    }


    showUnoControlNotice(
        ""
    );

}


function showUnoControlNotice(
    message
) {

    let notice =
        document.getElementById(
            "unoControlNotice"
        );


    if (
        !message
    ) {

        if (notice) {

            notice.remove();

        }

        return;

    }


    if (
        !notice
    ) {

        notice =
            document.createElement(
                "div"
            );

        notice.id =
            "unoControlNotice";

        notice.className =
            "uno-message";

        notice.style.margin =
            "0 0 16px";

        notice.style.textAlign =
            "center";

        const target =
            startError
                ?.parentNode;


        if (target) {

            target.insertBefore(
                notice,
                startError
            );

        } else if (
            startScreen
        ) {

            startScreen.prepend(
                notice
            );

        }

    }


    notice.textContent =
        message;

}


async function checkUnoPlayerBlocked() {

    const playerId =
        getPersistentPlayerId();


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "is_uno_player_blocked",
                    {
                        p_player_id:
                            playerId
                    }
                );


        if (error) {

            console.warn(
                "⚠️ Controllo blocco giocatore:",
                error
            );

            return false;

        }


        return data === true;

    } catch (error) {

        console.warn(
            "⚠️ Errore controllo blocco:",
            error
        );

        return false;

    }

}


async function ensureUnoPlayerNotBlocked() {

    const blocked =
        await checkUnoPlayerBlocked();


    if (
        blocked
    ) {

        showError(
            startError,
            "Il tuo giocatore è stato bloccato dall'amministratore."
        );

        return false;

    }


    return true;

}


function startUnoBlockedCheck() {

    stopUnoBlockedCheck();


    unoBlockedCheckTimer =
        setInterval(
            async () => {

                if (
                    !currentPlayer ||
                    !currentRoom
                ) {

                    return;

                }


                const blocked =
                    await checkUnoPlayerBlocked();


                if (
                    blocked
                ) {

                    await forceExitUno(
                        "Il tuo giocatore è stato bloccato dall'amministratore."
                    );

                }

            },
            5000
        );

}


function stopUnoBlockedCheck() {

    if (
        unoBlockedCheckTimer
    ) {

        clearInterval(
            unoBlockedCheckTimer
        );

        unoBlockedCheckTimer =
            null;

    }

}


function setupUnoAdminRealtime() {

    if (
        unoAdminControlChannel
    ) {

        try {

            supabaseClient.removeChannel(
                unoAdminControlChannel
            );

        } catch {
            /* ignore */
        }

    }


    unoAdminControlChannel =
        supabaseClient
            .channel(
                "uno-admin-controls"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "site_settings"
                },
                async () => {

                    await refreshUnoControls();

                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "site_games"
                },
                async () => {

                    await refreshUnoControls();

                }
            )
            .subscribe();

}


function startUnoControlRefresh() {

    if (
        unoControlRefreshTimer
    ) {

        clearInterval(
            unoControlRefreshTimer
        );

    }


    unoControlRefreshTimer =
        setInterval(
            refreshUnoControls,
            10000
        );

}


async function preparePersistentPlayerForNewRoom(
    playerId
) {

    if (
        !playerId
    ) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("uno_players")
            .update({
                connected:
                    false,
                last_seen:
                    null
            })
            .eq(
                "player_id",
                playerId
            );


    if (error) {

        console.warn(
            "⚠️ PREPARAZIONE PLAYER:",
            error
        );

    }

}


async function forceExitUno(
    message
) {

    if (
        forceExitInProgress
    ) {

        return;

    }


    forceExitInProgress =
        true;


    const nickname =
        currentPlayer?.nickname ||
        nicknameInput?.value ||
        "";


    try {

        stopPresenceHeartbeat();
        stopUnoBlockedCheck();


        if (
            currentPlayer &&
            currentRoom
        ) {

            await markCurrentPlayerOffline();

        }


        if (
            roomChannel
        ) {

            try {

                await supabaseClient.removeChannel(
                    roomChannel
                );

            } catch {
                /* ignore */
            }

            roomChannel =
                null;

        }


        if (
            playersChannel
        ) {

            try {

                await supabaseClient.removeChannel(
                    playersChannel
                );

            } catch {
                /* ignore */
            }

            playersChannel =
                null;

        }


    } catch (error) {

        console.warn(
            "⚠️ FORCE EXIT UNO:",
            error
        );

    }


    currentPlayer =
        null;

    currentRoom =
        null;

    players =
        [];

    isHost =
        false;

    isReady =
        false;

    rematchStarting =
        false;


    if (
        roomScreen
    ) {

        roomScreen.hidden =
            true;

    }


    if (
        gameScreen
    ) {

        gameScreen.hidden =
            true;

    }


    if (
        startScreen
    ) {

        startScreen.hidden =
            false;

    }


    if (
        nicknameInput
    ) {

        nicknameInput.value =
            nickname;

    }


    if (
        roomCodeInput
    ) {

        roomCodeInput.value =
            "";

    }


    showError(
        startError,
        message
    );


    updateReadyButton();
    updateDrawButtonState();
    updatePassButton();

    forceExitInProgress =
        false;

}


/* ========================================
CREA STANZA
======================================== */


async function createRoom() {

    clearErrors();


    await refreshUnoControls();


    if (
        !isUnoGameEnabled()
    ) {

        showError(
            startError,
            unoControlState.disabledMessage
        );

        return;

    }


    if (
        !isUnoMultiplayerAvailable()
    ) {

        showError(
            startError,
            "Il multiplayer UNO è stato disattivato dall'amministratore."
        );

        return;

    }


    if (
        !isUnoRoomCreationAvailable()
    ) {

        showError(
            startError,
            "La creazione di nuove stanze è stata disattivata dall'amministratore."
        );

        return;

    }


    const notBlocked =
        await ensureUnoPlayerNotBlocked();


    if (
        !notBlocked
    ) {

        return;

    }


    const nickname =
        getNickname();


    if (!nickname) {
        return;
    }


    const persistentPlayerId =
        getPersistentPlayerId();


    setLoading(
        createRoomButton,
        true,
        "Creazione..."
    );


    try {

        await preparePersistentPlayerForNewRoom(
            persistentPlayerId
        );


        let roomCode =
            null;

        let codeAvailable =
            false;

        let attempts =
            0;


        while (
            !codeAvailable &&
            attempts < 10
        ) {

            attempts++;


            roomCode =
                generateRoomCode();


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("uno_rooms")
                    .select("id")
                    .eq(
                        "room_code",
                        roomCode
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!data) {

                codeAvailable =
                    true;

            }

        }


        if (
            !codeAvailable ||
            !roomCode
        ) {

            throw new Error(
                "Impossibile generare un codice stanza. Riprova."
            );

        }


        const {
            data:
                createdRoom,
            error:
                roomInsertError
        } =
            await supabaseClient
                .from("uno_rooms")
                .insert({

                    room_code:
                        roomCode,

                    host_id:
                        persistentPlayerId,

                    status:
                        "waiting",

                    updated_at:
                        new Date().toISOString()

                })
                .select()
                .single();


        if (roomInsertError) {
            throw roomInsertError;
        }


        currentRoom =
            createdRoom;


        const {
            error:
                playerInsertError
        } =
            await supabaseClient
                .from("uno_players")
                .insert({

                    room_id:
                        createdRoom.id,

                    player_id:
                        persistentPlayerId,

                    nickname:
                        nickname,

                    is_host:
                        true,

                    is_ready:
                        false,

                    connected:
                        true,

                    last_seen:
                        new Date().toISOString()

                });


        if (playerInsertError) {

            await supabaseClient
                .from("uno_rooms")
                .delete()
                .eq(
                    "id",
                    createdRoom.id
                );


            throw playerInsertError;

        }


        currentPlayer = {

            id:
                persistentPlayerId,

            nickname:
                nickname,

            room_id:
                createdRoom.id,

            room_code:
                createdRoom.room_code,

            is_host:
                true,

            is_ready:
                false

        };


        isHost =
            true;

        isReady =
            false;


        await openRoom(
            createdRoom
        );


    } catch (error) {

        console.error(
            "❌ CREATE ROOM:",
            error
        );


        showError(
            startError,
            getFriendlyError(
                error,
                "Errore durante la creazione della stanza."
            )
        );


    } finally {

        setLoading(
            createRoomButton,
            false,
            "🏠 Crea una stanza"
        );

    }

}


/* ========================================
ENTRA NELLA STANZA
======================================== */

async function joinRoom() {

    clearErrors();


    await refreshUnoControls();


    if (
        !isUnoGameEnabled()
    ) {

        showError(
            startError,
            unoControlState.disabledMessage
        );

        return;

    }


    if (
        !isUnoMultiplayerAvailable()
    ) {

        showError(
            startError,
            "Il multiplayer UNO è stato disattivato dall'amministratore."
        );

        return;

    }


    const notBlocked =
        await ensureUnoPlayerNotBlocked();


    if (
        !notBlocked
    ) {

        return;

    }


    const nickname =
        getNickname();


    if (!nickname) {
        return;
    }


    const roomCode =
        roomCodeInput.value
            .trim()
            .toUpperCase();


    if (
        roomCode.length !== 6
    ) {

        showError(
            startError,
            "Inserisci un codice stanza di 6 caratteri."
        );


        roomCodeInput.focus();


        return;
    }


    const persistentPlayerId =
        getPersistentPlayerId();


    setLoading(
        joinRoomButton,
        true,
        "Entrando..."
    );


    try {

        const {
            data:
                room,
            error:
                roomErrorDB
        } =
            await supabaseClient
                .from("uno_rooms")
                .select("*")
                .eq(
                    "room_code",
                    roomCode
                )
                .maybeSingle();


        if (roomErrorDB) {
            throw roomErrorDB;
        }


        if (!room) {

            throw new Error(
                `Stanza "${roomCode}" non trovata. Controlla il codice e riprova.`
            );

        }


        if (
            room.status !==
            "waiting"
        ) {

            if (
                room.status ===
                "playing"
            ) {

                throw new Error(
                    "La partita è già iniziata."
                );

            }


            if (
                room.status ===
                "finished"
            ) {

                throw new Error(
                    "Questa partita è terminata."
                );

            }


            if (
                room.status ===
                "closed"
            ) {

                throw new Error(
                    "Questa stanza è stata chiusa dall'amministratore."
                );

            }


            throw new Error(
                "La stanza non è disponibile."
            );

        }


        const {
            data:
                existingPlayers,
            error:
                playersError
        } =
            await supabaseClient
                .from("uno_players")
                .select("*")
                .eq(
                    "room_id",
                    room.id
                );


        if (playersError) {
            throw playersError;
        }


        const currentPlayers =
            existingPlayers || [];


        const now =
            Date.now();


        const activePlayers =
            currentPlayers.filter(
                player => {

                    if (
                        player.connected !==
                        true
                    ) {

                        return false;

                    }


                    if (
                        !player.last_seen
                    ) {

                        return false;

                    }


                    const lastSeen =
                        new Date(
                            player.last_seen
                        ).getTime();


                    if (
                        Number.isNaN(
                            lastSeen
                        )
                    ) {

                        return false;

                    }


                    return (
                        now -
                        lastSeen
                    ) <=
                    ONLINE_TIMEOUT_MS;

                }
            );


        if (
            activePlayers.length >= 4
        ) {

            throw new Error(
                "La stanza è piena. Massimo 4 giocatori."
            );

        }


        const nicknameExists =
            currentPlayers.some(
                player =>
                    String(
                        player.nickname
                    )
                        .toLowerCase() ===
                    nickname.toLowerCase() &&
                    player.connected === true
            );


        if (nicknameExists) {

            throw new Error(
                "Questo nickname è già utilizzato nella stanza."
            );

        }


        await preparePersistentPlayerForNewRoom(
            persistentPlayerId
        );


        /*
           Se il giocatore era già entrato
           in questa stanza in passato,
           riutilizziamo la riga.
        */

        const existingOwnPlayer =
            currentPlayers.find(
                player =>
                    player.player_id ===
                    persistentPlayerId
            );


        let playerInsertError =
            null;


        if (
            existingOwnPlayer
        ) {

            const {
                error
            } =
                await supabaseClient
                    .from("uno_players")
                    .update({

                        nickname:
                            nickname,

                        is_host:
                            false,

                        is_ready:
                            false,

                        connected:
                            true,

                        last_seen:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        existingOwnPlayer.id
                    );


            playerInsertError =
                error || null;

        } else {

            const {
                error
            } =
                await supabaseClient
                    .from("uno_players")
                    .insert({

                        room_id:
                            room.id,

                        player_id:
                            persistentPlayerId,

                        nickname:
                            nickname,

                        is_host:
                            false,

                        is_ready:
                            false,

                        connected:
                            true,

                        last_seen:
                            new Date().toISOString()

                    });


            playerInsertError =
                error || null;

        }


        if (
            playerInsertError
        ) {

            throw playerInsertError;

        }


        currentRoom =
            room;


        currentPlayer = {

            id:
                persistentPlayerId,

            nickname:
                nickname,

            room_id:
                room.id,

            room_code:
                room.room_code,

            is_host:
                false,

            is_ready:
                false

        };


        isHost =
            false;

        isReady =
            false;


        await openRoom(
            room
        );


    } catch (error) {

        console.error(
            "❌ JOIN ROOM:",
            error
        );


        showError(
            startError,
            getFriendlyError(
                error,
                "Errore durante l'accesso alla stanza."
            )
        );


    } finally {

        setLoading(
            joinRoomButton,
            false,
            "🚪 Entra"
        );

    }

}


/* ========================================
APRI STANZA
======================================== */

async function openRoom(
    room
) {

    currentRoom =
        room;


    if (startScreen) {
        startScreen.hidden = true;
    }


    if (roomScreen) {
        roomScreen.hidden = false;
    }


    if (gameScreen) {
        gameScreen.hidden = true;
    }


    if (roomCodeDisplay) {

        roomCodeDisplay.textContent =
            room.room_code;
    }


    if (gameRoomCode) {

        gameRoomCode.textContent =
            room.room_code;
    }


    if (roomStatus) {

        roomStatus.textContent =
            "In attesa";
    }


    updateHostControls();


    await loadPlayers();


    subscribeToRoom(
        room.id
    );


    subscribeToPlayers(
        room.id
    );


    /*
       AVVIAMO LA PRESENZA
       quando l'utente entra realmente
       nella stanza.
    */

    startPresenceHeartbeat();

    startUnoBlockedCheck();

}


/* ========================================
CARICA GIOCATORI
======================================== */

async function loadPlayers() {

    if (!currentRoom) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("uno_players")
            .select("*")
            .eq(
                "room_id",
                currentRoom.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(
            "❌ LOAD PLAYERS:",
            error
        );


        showError(
            roomError,
            error.message ||
            "Impossibile caricare i giocatori."
        );


        return;
    }


    const now =
        Date.now();


    players =
        (data || []).map(
            player => {

                const lastSeen =
                    player.last_seen
                        ? new Date(
                            player.last_seen
                        ).getTime()
                        : 0;


                const recentlyOnline =
                    Boolean(
                        player.connected
                    ) &&
                    lastSeen > 0 &&
                    (
                        now -
                        lastSeen
                    ) <=
                    ONLINE_TIMEOUT_MS;


                return {

                    ...player,

                    connected:
                        recentlyOnline

                };

            }
        );


    /*
       Se il giocatore corrente non esiste più
       nella stanza, lo facciamo uscire.
    */

    if (currentPlayer) {

        const databasePlayer =
            (data || []).find(
                player =>
                    player.player_id ===
                    currentPlayer.id
            );


        if (!databasePlayer) {

            await forceExitUno(
                "La tua presenza nella stanza non è più disponibile."
            );

            return;

        }


        /*
           Se l'Admin lo ha espulso,
           connected viene impostato false.
        */

        if (
            databasePlayer.connected ===
            false
        ) {

            await forceExitUno(
                "Sei stato espulso dalla stanza dall'amministratore."
            );

            return;

        }


        isReady =
            Boolean(
                databasePlayer.is_ready
            );


        isHost =
            Boolean(
                databasePlayer.is_host
            );

    }


    renderPlayers();


    if (
        currentRoom?.status ===
        "finished"
    ) {

        updateUnoRematchButton();

    }

}


/* ========================================
RENDER PLAYERS
======================================== */

function renderPlayers() {

    if (!playersList) {
        return;
    }


    playersList.innerHTML =
        "";


    players.forEach(
        player => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "uno-player-card";


            if (
                currentPlayer &&
                player.player_id ===
                    currentPlayer.id
            ) {

                card.classList.add(
                    "current-player"
                );

            }


            const avatar =
                document.createElement(
                    "div"
                );


            avatar.className =
                "uno-player-avatar";


            avatar.textContent =
                getPlayerInitial(
                    player.nickname
                );


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "uno-player-info";


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                player.nickname;


            const status =
                document.createElement(
                    "small"
                );


            status.textContent =
                player.connected
                    ? (
                        player.is_ready
                            ? "🟢 Pronto"
                            : "⚪ Non pronto"
                    )
                    : "🔴 Offline";


            info.appendChild(
                name
            );


            info.appendChild(
                status
            );


            const badges =
                document.createElement(
                    "div"
                );


            badges.className =
                "uno-player-badges";


            if (
                player.is_host
            ) {

                const hostBadge =
                    document.createElement(
                        "span"
                    );


                hostBadge.className =
                    "uno-player-badge";


                hostBadge.textContent =
                    "👑 Host";


                badges.appendChild(
                    hostBadge
                );

            }


            card.appendChild(
                avatar
            );


            card.appendChild(
                info
            );


            card.appendChild(
                badges
            );


            playersList.appendChild(
                card
            );

        }
    );


    if (playerCount) {

        playerCount.textContent =
            `${players.filter(
                player =>
                    player.connected
            ).length}/4`;
    }


    const host =
        players.find(
            player =>
                player.is_host &&
                player.connected
        );


    if (hostName) {

        hostName.textContent =
            host?.nickname ||
            "—";
    }


    updateReadyButton();
    updateReadyInfo();
    updateStartButton();
}


/* ========================================
READY
======================================== */

async function toggleReady() {

    if (
        !currentPlayer ||
        !currentRoom ||
        !readyButton
    ) {

        return;
    }


    const newReady =
        !isReady;


    try {

        readyButton.disabled =
            true;


        const {
            error
        } =
            await supabaseClient
                .from("uno_players")
                .update({

                    is_ready:
                        newReady,

                    connected:
                        true,

                    last_seen:
                        new Date().toISOString()

                })
                .eq(
                    "player_id",
                    currentPlayer.id
                )
                .eq(
                    "room_id",
                    currentRoom.id
                );


        if (error) {
            throw error;
        }


        isReady =
            newReady;


        const localPlayer =
            players.find(
                player =>
                    player.player_id ===
                    currentPlayer.id
            );


        if (localPlayer) {

            localPlayer.is_ready =
                newReady;

            localPlayer.connected =
                true;

        }


        updateReadyButton();
        updateReadyInfo();
        updateStartButton();


    } catch (error) {

        console.error(
            "❌ READY:",
            error
        );


        showError(
            roomError,
            getFriendlyError(
                error,
                "Impossibile modificare lo stato."
            )
        );


    } finally {

        readyButton.disabled =
            false;
    }

}


/* ========================================
READY BUTTON
======================================== */

function updateReadyButton() {

    if (!readyButton) {
        return;
    }


    if (isReady) {

        readyButton.textContent =
            "🔴 Non sono pronto";


        readyButton.classList.add(
            "ready-active"
        );

    } else {

        readyButton.textContent =
            "🟢 Sono pronto";


        readyButton.classList.remove(
            "ready-active"
        );

    }

}


/* ========================================
HOST CONTROLS
======================================== */

function updateHostControls() {

    if (!hostControls) {
        return;
    }


    hostControls.hidden =
        !isHost;
}


/* ========================================
INFO READY
======================================== */

function updateReadyInfo() {

    if (!readyInfo) {
        return;
    }


    const connectedPlayers =
        players.filter(
            player =>
                player.connected
        );


    if (
        connectedPlayers.length < 2
    ) {

        readyInfo.textContent =
            "Servono almeno 2 giocatori per iniziare.";


        return;
    }


    const readyPlayers =
        connectedPlayers.filter(
            player =>
                player.is_ready
        ).length;


    const allReady =
        connectedPlayers.length >= 2 &&
        readyPlayers ===
            connectedPlayers.length;


    readyInfo.textContent =
        allReady
            ? "✅ Tutti i giocatori sono pronti!"
            : `${readyPlayers}/${connectedPlayers.length} giocatori pronti.`;
}


/* ========================================
START BUTTON
======================================== */

function updateStartButton() {

    if (
        !startGameButton ||
        !isHost
    ) {

        return;
    }


    const connectedPlayers =
        players.filter(
            player =>
                player.connected
        );


    const allReady =
        connectedPlayers.length >= 2 &&
        connectedPlayers.every(
            player =>
                player.is_ready
        );


    startGameButton.disabled =
        !allReady;
}


/* ========================================
AVVIA PARTITA
======================================== */

async function startGame() {

    if (
        !isHost ||
        !currentRoom
    ) {

        return;
    }


    const connectedPlayers =
        players.filter(
            player =>
                player.connected
        );


    const allReady =
        connectedPlayers.length >= 2 &&
        connectedPlayers.every(
            player =>
                player.is_ready
        );


    if (!allReady) {

        showError(
            roomError,
            "Tutti i giocatori devono essere pronti."
        );


        return;
    }


    try {

        startGameButton.disabled =
            true;


        const gameState =
            createInitialUnoGame();


        const {
            error
        } =
            await supabaseClient
                .from("uno_rooms")
                .update({

                    status:
                        "playing",

                    game_state:
                        gameState,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    currentRoom.id
                );


        if (error) {
            throw error;
        }


        currentRoom.status =
            "playing";


        currentRoom.game_state =
            gameState;


        await showGameScreen();


    } catch (error) {

        console.error(
            "❌ ERRORE CREAZIONE PARTITA:",
            error
        );


        showError(
            roomError,
            getFriendlyError(
                error,
                "Impossibile avviare la partita."
            )
        );


        startGameButton.disabled =
            false;
    }

}


/* ========================================
SCHERMATA GIOCO
======================================== */

async function showGameScreen() {

    if (!gameScreen) {
        return;
    }


    if (startScreen) {
        startScreen.hidden = true;
    }


    if (roomScreen) {
        roomScreen.hidden = true;
    }


    gameScreen.hidden =
        false;


    if (
        gameRoomCode &&
        currentRoom
    ) {

        gameRoomCode.textContent =
            currentRoom.room_code;
    }


    if (
        currentRoom?.status ===
            "playing" ||
        currentRoom?.game_state?.status ===
            "playing"
    ) {

        const victoryScreen =
            document.getElementById(
                "unoVictoryScreen"
            );


        if (victoryScreen) {
            victoryScreen.remove();
        }

    }


    if (
        currentRoom?.game_state
    ) {

        if (gameTurnInfo) {

            gameTurnInfo.textContent =
                currentRoom.game_state.status ===
                    "finished"
                    ? "Partita terminata"
                    : "Partita in corso";
        }


        renderOpponentsArea();
        renderPlayerHand();
        renderDiscardPile();
        updateTurnMessage();
        updateDrawButtonState();
        updatePassButton();


    } else {

        if (gameTurnInfo) {

            gameTurnInfo.textContent =
                "Partita iniziata";
        }


        if (turnMessage) {

            turnMessage.textContent =
                "Preparazione della partita...";

        }

    }


    console.log(
        "🎮 SCHERMATA PARTITA"
    );
}


/* ========================================
REALTIME STANZA
======================================== */

function subscribeToRoom(
    roomId
) {

    if (roomChannel) {

        supabaseClient.removeChannel(
            roomChannel
        );


        roomChannel =
            null;
    }


    roomChannel =
        supabaseClient
            .channel(
                `uno-room-${roomId}`
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "UPDATE",

                    schema:
                        "public",

                    table:
                        "uno_rooms",

                    filter:
                        `id=eq.${roomId}`

                },
                async payload => {

                    currentRoom =
                        payload.new;


                    if (
                        payload.new.status ===
                        "closed"
                    ) {

                        await forceExitUno(
                            "Questa stanza è stata chiusa dall'amministratore."
                        );

                        return;

                    }


                    if (
                        payload.new.status ===
                        "waiting"
                    ) {

                        if (startScreen) {
                            startScreen.hidden = true;
                        }

                        if (roomScreen) {
                            roomScreen.hidden = false;
                        }

                        if (gameScreen) {
                            gameScreen.hidden = true;
                        }

                        if (roomStatus) {
                            roomStatus.textContent =
                                "In attesa";
                        }

                        await loadPlayers();

                        return;

                    }


                    if (
                        payload.new.status ===
                            "playing" ||
                        payload.new.status ===
                            "finished"
                    ) {

                        await showGameScreen();

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "📡 ROOM CHANNEL:",
                        status
                    );

                }
            );

}


/* ========================================
REALTIME PLAYERS
======================================== */

function subscribeToPlayers(
    roomId
) {

    if (playersChannel) {

        supabaseClient.removeChannel(
            playersChannel
        );


        playersChannel =
            null;
    }


    playersChannel =
        supabaseClient
            .channel(
                `uno-players-${roomId}`
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "uno_players",

                    filter:
                        `room_id=eq.${roomId}`

                },
                async () => {

                    await loadPlayers();


                    if (
                        currentRoom?.status ===
                        "finished"
                    ) {

                        updateUnoRematchButton();

                        await checkUnoRematchReady();

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "📡 PLAYERS CHANNEL:",
                        status
                    );

                }
            );
}


/* ========================================
COPIA CODICE
======================================== */

async function copyRoomCode() {

    if (
        !currentRoom ||
        !copyRoomCodeButton
    ) {

        return;
    }


    const code =
        currentRoom.room_code;


    try {

        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText ===
                "function"
        ) {

            await navigator.clipboard.writeText(
                code
            );

        } else {

            throw new Error(
                "Clipboard non disponibile"
            );
        }


        const original =
            copyRoomCodeButton.textContent;


        copyRoomCodeButton.textContent =
            "✅";


        setTimeout(
            () => {

                copyRoomCodeButton.textContent =
                    original;

            },
            1500
        );


    } catch (error) {

        console.error(
            "❌ COPY:",
            error
        );


        try {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                code;


            textarea.style.position =
                "fixed";


            textarea.style.left =
                "-9999px";


            document.body.appendChild(
                textarea
            );


            textarea.focus();
            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();


            copyRoomCodeButton.textContent =
                "✅";


            setTimeout(
                () => {

                    copyRoomCodeButton.textContent =
                        "📋";

                },
                1500
            );


        } catch (
            fallbackError
        ) {

            console.error(
                "❌ COPY FALLBACK:",
                fallbackError
            );

        }

    }

}


/* ========================================
ESCI DALLA STANZA
======================================== */

async function leaveRoom() {

    try {

        stopPresenceHeartbeat();
        stopUnoBlockedCheck();


        await markCurrentPlayerOffline();


        if (roomChannel) {

            await supabaseClient.removeChannel(
                roomChannel
            );


            roomChannel =
                null;

        }


        if (playersChannel) {

            await supabaseClient.removeChannel(
                playersChannel
            );


            playersChannel =
                null;

        }


    } catch (error) {

        console.error(
            "❌ LEAVE ROOM:",
            error
        );

    }


    currentPlayer =
        null;


    currentRoom =
        null;


    players =
        [];


    isHost =
        false;


    isReady =
        false;


    rematchStarting =
        false;


    if (colorPicker) {

        colorPicker.hidden =
            true;

    }


    document.body.classList.remove(
        "uno-color-picker-open"
    );


    if (roomScreen) {
        roomScreen.hidden = true;
    }


    if (gameScreen) {
        gameScreen.hidden = true;
    }


    if (startScreen) {
        startScreen.hidden = false;
    }


    /*
       Non cancelliamo più la riga
       da uno_players.

       Rimane come cronologia.
    */


    if (nicknameInput) {

        /*
           Manteniamo il nickname
           per la prossima stanza.
        */

        nicknameInput.value =
            nicknameInput.value.trim();

    }


    if (roomCodeInput) {
        roomCodeInput.value = "";
    }


    const victoryScreen =
        document.getElementById(
            "unoVictoryScreen"
        );


    if (victoryScreen) {
        victoryScreen.remove();
    }


    updateReadyButton();
    updateDrawButtonState();
    updatePassButton();

    clearErrors();

}


/* ========================================
NICKNAME
======================================== */

function getNickname() {

    if (!nicknameInput) {
        return null;
    }


    const nickname =
        nicknameInput.value.trim();


    if (!nickname) {

        showError(
            startError,
            "Inserisci un nickname."
        );


        nicknameInput.focus();


        return null;
    }


    if (
        nickname.length < 2
    ) {

        showError(
            startError,
            "Il nickname deve avere almeno 2 caratteri."
        );


        nicknameInput.focus();


        return null;
    }


    return nickname.slice(
        0,
        20
    );
}


/* ========================================
CODICE STANZA
======================================== */

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let code =
        "";


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                characters.length
            );


        code +=
            characters[randomIndex];

    }


    return code;
}


/* ========================================
INIZIALE PLAYER
======================================== */

function getPlayerInitial(
    nickname
) {

    if (
        !nickname ||
        nickname.length === 0
    ) {

        return "?";
    }


    return nickname
        .charAt(0)
        .toUpperCase();
}


/* ========================================
ERRORI
======================================== */

function showError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.hidden =
        false;
}


function clearErrors() {

    [
        startError,
        roomError,
        gameError
    ].forEach(
        element => {

            if (!element) {
                return;
            }


            element.textContent =
                "";


            element.hidden =
                true;

        }
    );
}


/* ========================================
ERRORI PIÙ CHIARI
======================================== */

function getFriendlyError(
    error,
    fallback
) {

    if (!error) {
        return fallback;
    }


    const message =
        String(
            error.message ||
            error
        );


    console.error(
        "🔴 ERRORE COMPLETO:",
        message
    );


    if (
        message.includes(
            "row-level security"
        )
    ) {

        return (
            "Supabase ha bloccato l'operazione per le autorizzazioni RLS."
        );
    }


    if (
        message.includes(
            "permission denied"
        )
    ) {

        return (
            "Permesso negato da Supabase. Controlla le policy RLS."
        );
    }


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "Impossibile collegarsi a Supabase. Controlla la connessione Internet."
        );
    }


    if (
        message.includes(
            "duplicate key"
        )
    ) {

        return (
            "Questo codice o questo giocatore esiste già. Riprova."
        );
    }


    return message ||
        fallback;
}


/* ========================================
LOADING BUTTON
======================================== */

function setLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.disabled =
            true;


        button.dataset.originalText =
            button.textContent;


        button.textContent =
            text;


    } else {

        button.disabled =
            false;


        button.textContent =
            text ||
            button.dataset.originalText;

    }

}


/* ========================================
UNO - MAZZO
======================================== */

function createUnoDeck() {

    const deck =
        [];


    UNO_COLORS.forEach(
        color => {

            deck.push({

                id:
                    generateCardId(),

                color:
                    color,

                type:
                    "number",

                value:
                    0

            });


            for (
                let number = 1;
                number <= 9;
                number++
            ) {

                for (
                    let copy = 0;
                    copy < 2;
                    copy++
                ) {

                    deck.push({

                        id:
                            generateCardId(),

                        color:
                            color,

                        type:
                            "number",

                        value:
                            number

                    });

                }

            }


            for (
                let i = 0;
                i < 2;
                i++
            ) {

                deck.push({

                    id:
                        generateCardId(),

                    color:
                        color,

                    type:
                        "skip",

                    value:
                        null

                });

            }


            for (
                let i = 0;
                i < 2;
                i++
            ) {

                deck.push({

                    id:
                        generateCardId(),

                    color:
                        color,

                    type:
                        "reverse",

                    value:
                        null

                });

            }


            for (
                let i = 0;
                i < 2;
                i++
            ) {

                deck.push({

                    id:
                        generateCardId(),

                    color:
                        color,

                    type:
                        "draw2",

                    value:
                        2

                });

            }

        }
    );


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        deck.push({

            id:
                generateCardId(),

            color:
                UNO_WILD,

            type:
                "wild",

            value:
                null

        });

    }


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        deck.push({

            id:
                generateCardId(),

            color:
                UNO_WILD,

            type:
                "wild_draw4",

            value:
                4

        });

    }


    return shuffleUnoDeck(
        deck
    );
}


/* ========================================
ID CARTA
======================================== */

function generateCardId() {

    return (
        "card-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


/* ========================================
MESCOLA
======================================== */

function shuffleUnoDeck(
    deck
) {

    const shuffled =
        [...deck];


    for (
        let i =
            shuffled.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            shuffled[i],
            shuffled[j]
        ] = [
            shuffled[j],
            shuffled[i]
        ];

    }


    return shuffled;
}


/* ========================================
VERIFICA MAZZO
======================================== */

function checkUnoDeck(
    deck
) {

    return (
        Array.isArray(deck) &&
        deck.length === 108
    );
}


/* ========================================
CREA PARTITA
======================================== */

function createInitialUnoGame() {

    const playerIds =
        players
            .filter(
                player =>
                    player.connected
            )
            .map(
                player =>
                    player.player_id
            );


    if (
        playerIds.length < 2
    ) {

        throw new Error(
            "Servono almeno 2 giocatori."
        );

    }


    let shuffledDeck;
    let hands;
    let validDistribution =
        false;


    for (
        let attempt = 0;
        attempt < 1000;
        attempt++
    ) {

        shuffledDeck =
            shuffleUnoDeck(
                createUnoDeck()
            );


        hands = {};


        playerIds.forEach(
            playerId => {

                hands[playerId] =
                    [];

            }
        );


        for (
            let round = 0;
            round < 7;
            round++
        ) {

            for (
                const playerId
                of playerIds
            ) {

                const card =
                    shuffledDeck.pop();


                if (card) {

                    hands[playerId]
                        .push(card);

                }

            }

        }


        validDistribution =
            playerIds.every(
                playerId => {

                    const heavyCards =
                        hands[playerId]
                            .filter(
                                card =>
                                    card.type ===
                                        "draw2" ||
                                    card.type ===
                                        "wild" ||
                                    card.type ===
                                        "wild_draw4"
                            );


                    return (
                        heavyCards.length <=
                        2
                    );

                }
            );


        if (
            validDistribution
        ) {

            break;
        }

    }


    let firstCardIndex =
        shuffledDeck.findIndex(
            card =>
                card.type ===
                "number"
        );


    if (
        firstCardIndex === -1
    ) {

        firstCardIndex =
            shuffledDeck.length - 1;

    }


    const firstCard =
        shuffledDeck.splice(
            firstCardIndex,
            1
        )[0];


    if (!firstCard) {

        throw new Error(
            "Impossibile creare la carta iniziale."
        );

    }


    return {

        deck:
            shuffledDeck,

        discardPile:
            [
                firstCard
            ],

        hands:
            hands,

        currentPlayerIndex:
            Math.floor(
                Math.random() *
                playerIds.length
            ),

        direction:
            1,

        currentColor:
            firstCard.color,

        status:
            "playing",

        winner:
            null,

        unoCalls:
            {},

        lastDrawnCardId:
            null,

        hasDrawnThisTurn:
            false,

        drawnCardPlayable:
            false,

        pendingDraw2:
            0,

        lastColorChoice:
            null

    };

}


/* ========================================
VERIFICA CARTA GIOCABILE
======================================== */

function isCardPlayable(
    card,
    gameState
) {

    if (
        !card ||
        !gameState
    ) {

        return false;
    }


    const topCard =
        gameState.discardPile?.[
            gameState.discardPile.length - 1
        ];


    if (!topCard) {
        return false;
    }


    if (
        Number(
            gameState.pendingDraw2 || 0
        ) > 0
    ) {

        return (
            card.type ===
            "draw2"
        );

    }


    if (
        card.type ===
        "wild"
    ) {

        return true;
    }


    if (
        card.type ===
        "wild_draw4"
    ) {

        return canPlayWildDrawFour(
            currentPlayer?.id,
            gameState
        );

    }


    if (
        card.color ===
        gameState.currentColor
    ) {

        return true;
    }


    if (
        card.type ===
            topCard.type &&
        card.type !==
            "number"
    ) {

        return true;
    }


    if (
        card.type ===
            "number" &&
        topCard.type ===
            "number" &&
        card.value ===
            topCard.value
    ) {

        return true;
    }


    return false;
}


/* ========================================
RENDER MANO
======================================== */

function renderPlayerHand() {

    const playerHandElement =
        document.getElementById(
            "playerHand"
        );


    const handCountElement =
        document.getElementById(
            "handCount"
        );


    if (
        !playerHandElement ||
        !handCountElement
    ) {

        return;

    }


    playerHandElement.innerHTML =
        "";


    if (
        !currentPlayer ||
        !currentRoom
    ) {

        handCountElement.textContent =
            "0";

        return;

    }


    const gameState =
        currentRoom.game_state;


    if (
        !gameState ||
        !gameState.hands
    ) {

        handCountElement.textContent =
            "0";

        return;

    }


    const hand =
        gameState.hands[
            currentPlayer.id
        ] || [];


    handCountElement.textContent =
        String(
            hand.length
        );


    hand.forEach(
        card => {

            playerHandElement.appendChild(
                createUnoCardElement(
                    card
                )
            );

        }
    );


    updatePlayableCards();

}


/* ========================================
RENDER AVVERSARI
======================================== */

function renderOpponentsArea() {

    const opponentsArea =
        document.getElementById(
            "opponentsArea"
        );


    if (
        !opponentsArea ||
        !currentPlayer ||
        !currentRoom
    ) {

        return;
    }


    opponentsArea.innerHTML =
        "";


    const gameState =
        currentRoom.game_state;


    if (
        !gameState ||
        !gameState.hands
    ) {

        return;
    }


    const currentTurnPlayer =
        players[
            gameState.currentPlayerIndex
        ];


    const opponents =
        players.filter(
            player =>
                player.player_id !==
                currentPlayer.id &&
                player.connected
        );


    opponents.forEach(
        player => {

            const opponent =
                document.createElement(
                    "div"
                );


            opponent.className =
                "uno-opponent";


            opponent.dataset.playerId =
                player.player_id;


            if (
                currentTurnPlayer &&
                currentTurnPlayer.player_id ===
                    player.player_id
            ) {

                opponent.classList.add(
                    "current-turn"
                );

            }


            const avatar =
                document.createElement(
                    "div"
                );


            avatar.className =
                "uno-player-avatar";


            avatar.textContent =
                getPlayerInitial(
                    player.nickname
                );


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "uno-opponent-name";


            name.textContent =
                player.nickname;


            const hand =
                Array.isArray(
                    gameState.hands[
                        player.player_id
                    ]
                )
                    ? gameState.hands[
                        player.player_id
                    ]
                    : [];


            const cardCount =
                document.createElement(
                    "div"
                );


            cardCount.className =
                "uno-opponent-count";


            cardCount.textContent =
                `${hand.length} carte`;


            const cardsContainer =
                document.createElement(
                    "div"
                );


            cardsContainer.className =
                "uno-opponent-cards";


            const visibleCards =
                Math.min(
                    hand.length,
                    10
                );


            for (
                let i = 0;
                i < visibleCards;
                i++
            ) {

                const cardBack =
                    document.createElement(
                        "span"
                    );


                cardBack.className =
                    "uno-opponent-card-back";


                const rotation =
                    (
                        i -
                        (visibleCards - 1) / 2
                    ) * 3;


                cardBack.style.setProperty(
                    "--card-rotation",
                    `${rotation}deg`
                );


                cardsContainer.appendChild(
                    cardBack
                );

            }


            if (
                hand.length > 10
            ) {

                const extra =
                    document.createElement(
                        "span"
                    );


                extra.className =
                    "uno-opponent-extra";


                extra.textContent =
                    `+${hand.length - 10}`;


                cardsContainer.appendChild(
                    extra
                );

            }


            opponent.appendChild(
                avatar
            );


            opponent.appendChild(
                name
            );


            opponent.appendChild(
                cardCount
            );


            opponent.appendChild(
                cardsContainer
            );


            opponentsArea.appendChild(
                opponent
            );

        }
    );
}


/* ========================================
CREA CARTA HTML
======================================== */

function createUnoCardElement(
    card
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "uno-play-card";


    button.dataset.cardId =
        card.id;


    button.addEventListener(
        "click",
        () => {

            if (!isMyTurn()) {
                return;
            }


            const state =
                currentRoom?.game_state;


            if (
                !isCardPlayable(
                    card,
                    state
                )
            ) {

                return;
            }


            if (
                state?.hasDrawnThisTurn ===
                    true &&
                state.lastDrawnCardId &&
                state.lastDrawnCardId !==
                    card.id
            ) {

                return;
            }


            playUnoCard(
                card
            );

        }
    );


    if (
        card.color ===
        "red"
    ) {

        button.classList.add(
            "red"
        );
    }


    if (
        card.color ===
        "yellow"
    ) {

        button.classList.add(
            "yellow"
        );
    }


    if (
        card.color ===
        "green"
    ) {

        button.classList.add(
            "green"
        );
    }


    if (
        card.color ===
        "blue"
    ) {

        button.classList.add(
            "blue"
        );
    }


    if (
        card.type ===
        "wild"
    ) {

        button.classList.add(
            "wild"
        );
    }


    if (
        card.type ===
        "wild_draw4"
    ) {

        button.classList.add(
            "wild_draw4"
        );
    }


    const inner =
        document.createElement(
            "span"
        );


    inner.className =
        "uno-card-inner";


    inner.textContent =
        getUnoCardLabel(
            card
        );


    button.appendChild(
        inner
    );


    return button;
}


/* ========================================
TESTO CARTA
======================================== */

function getUnoCardLabel(
    card
) {

    switch (
        card.type
    ) {

        case "number":
            return String(
                card.value
            );

        case "skip":
            return "⊘";

        case "reverse":
            return "↻";

        case "draw2":
            return "+2";

        case "wild":
            return "W";

        case "wild_draw4":
            return "+4";

        default:
            return "?";
    }

}


/* ========================================
RENDER SCARTI
======================================== */

function renderDiscardPile() {

    const discardElement =
        document.getElementById(
            "discardPile"
        );


    if (
        !discardElement ||
        !currentRoom
    ) {

        return;
    }


    discardElement.innerHTML =
        "";


    const gameState =
        currentRoom.game_state;


    if (
        !gameState ||
        !Array.isArray(
            gameState.discardPile
        ) ||
        gameState.discardPile.length === 0
    ) {

        return;
    }


    const topCard =
        gameState.discardPile[
            gameState.discardPile.length - 1
        ];


    const cardElement =
        createUnoCardElement(
            topCard
        );


    cardElement.setAttribute(
        "aria-disabled",
        "true"
    );


    cardElement.style.pointerEvents =
        "none";


    discardElement.appendChild(
        cardElement
    );

}


/* ========================================
GIOCA CARTA
======================================== */

async function playUnoCard(
    card
) {

    if (
        !currentRoom?.game_state ||
        !currentPlayer ||
        !isMyTurn()
    ) {

        return;
    }


    const gameState =
        structuredClone(
            currentRoom.game_state
        );


    if (
        !isCardPlayable(
            card,
            gameState
        )
    ) {

        return;
    }


    if (
        gameState.hasDrawnThisTurn ===
            true &&
        gameState.lastDrawnCardId &&
        gameState.lastDrawnCardId !==
            card.id
    ) {

        return;
    }


    const hand =
        gameState.hands[
            currentPlayer.id
        ];


    if (
        !Array.isArray(hand)
    ) {

        return;
    }


    const cardIndex =
        hand.findIndex(
            item =>
                item.id ===
                card.id
        );


    if (
        cardIndex === -1
    ) {

        return;
    }


    hand.splice(
        cardIndex,
        1
    );


    gameState.discardPile.push(
        card
    );


    if (
        gameState.unoCalls
    ) {

        delete gameState.unoCalls[
            currentPlayer.id
        ];
    }


    if (
        hand.length === 0
    ) {

        gameState.status =
            "finished";


        gameState.winner =
            currentPlayer.id;


        gameState.hasDrawnThisTurn =
            false;


        gameState.drawnCardPlayable =
            false;


        gameState.lastDrawnCardId =
            null;


        gameState.pendingDraw2 =
            0;


        await saveUnoGameState(
            gameState
        );


        return;
    }


    if (
        card.type === "wild" ||
        card.type === "wild_draw4"
    ) {

        currentRoom.game_state =
            gameState;


        renderPlayerHand();
        renderDiscardPile();
        renderOpponentsArea();


        showColorPicker(
            card,
            gameState
        );


        return;
    }


    gameState.currentColor =
        card.color;


    if (
        card.type ===
        "reverse"
    ) {

        gameState.direction *=
            -1;


        if (
            players.filter(
                player =>
                    player.connected
            ).length ===
            2
        ) {

            gameState.currentPlayerIndex =
                getNextPlayerIndex(
                    gameState,
                    2
                );

        } else {

            gameState.currentPlayerIndex =
                getNextPlayerIndex(
                    gameState
                );

        }

    } else if (
        card.type ===
        "skip"
    ) {

        gameState.currentPlayerIndex =
            getNextPlayerIndex(
                gameState,
                2
            );

    } else if (
        card.type ===
        "draw2"
    ) {

        gameState.pendingDraw2 =
            Number(
                gameState.pendingDraw2 || 0
            ) + 2;


        gameState.currentPlayerIndex =
            getNextPlayerIndex(
                gameState
            );

    } else {

        gameState.currentPlayerIndex =
            getNextPlayerIndex(
                gameState
            );

    }


    resetTurnDrawState(
        gameState
    );


    await saveUnoGameState(
        gameState
    );
}


/* ========================================
SALVA GAME STATE
======================================== */

async function saveUnoGameState(
    gameState
) {

    if (!currentRoom) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("uno_rooms")
                .update({

                    game_state:
                        gameState,

                    status:
                        gameState.status,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    currentRoom.id
                )
                .eq(
                    "status",
                    "playing"
                )
                .select()
                .maybeSingle();


        if (error) {
            throw error;
        }


        /*
           Se l'Admin ha chiuso la stanza mentre
           stavamo salvando lo stato della partita,
           l'UPDATE non modifica più la stanza.
        */

        if (!data) {

            if (
                currentRoom.status ===
                "closed"
            ) {

                await forceExitUno(
                    "Questa stanza è stata chiusa dall'amministratore."
                );

            }


            return null;

        }


        if (
            gameState.status ===
            "finished"
        ) {

            const {
                error:
                    resetReadyError
            } =
                await supabaseClient
                    .from("uno_players")
                    .update({

                        is_ready:
                            false

                    })
                    .eq(
                        "room_id",
                        currentRoom.id
                    );


            if (resetReadyError) {

                console.error(
                    "Errore reset ready post-partita:",
                    resetReadyError
                );

            }


            players.forEach(
                player => {

                    player.is_ready =
                        false;

                }
            );


            isReady =
                false;
        }


        currentRoom =
            data;


        updateTurnMessage();
        renderPlayerHand();
        renderDiscardPile();
        renderOpponentsArea();
        updateDrawButtonState();
        updatePassButton();


        if (
            gameState.status ===
            "finished"
        ) {

            updateUnoRematchButton();
        }


        return data;


    } catch (error) {

        console.error(
            "❌ ERRORE SALVATAGGIO PARTITA UNO:",
            error
        );


        showError(
            gameError,
            getFriendlyError(
                error,
                "Impossibile salvare lo stato della partita."
            )
        );


        return null;
    }

}


/* ========================================
È IL MIO TURNO?
======================================== */

function isMyTurn() {

    if (
        !currentPlayer ||
        !currentRoom?.game_state
    ) {

        return false;
    }


    const gameState =
        currentRoom.game_state;


    if (
        gameState.status !==
        "playing"
    ) {

        return false;
    }


    const connectedPlayers =
        players.filter(
            player =>
                player.connected
        );


    const currentTurnPlayer =
        connectedPlayers[
            gameState.currentPlayerIndex
        ] ||
        players[
            gameState.currentPlayerIndex
        ];


    if (!currentTurnPlayer) {
        return false;
    }


    return (
        currentTurnPlayer.player_id ===
        currentPlayer.id
    );
}


/* ========================================
PROSSIMO GIOCATORE
======================================== */

function getNextPlayerIndex(
    gameState,
    steps = 1
) {

    const activePlayers =
        players.filter(
            player =>
                player.connected
        );


    if (
        !gameState ||
        activePlayers.length === 0
    ) {

        return 0;
    }


    let index =
        gameState.currentPlayerIndex;


    for (
        let i = 0;
        i < steps;
        i++
    ) {

        index +=
            gameState.direction;


        if (
            index >=
            activePlayers.length
        ) {

            index = 0;
        }


        if (
            index < 0
        ) {

            index =
                activePlayers.length - 1;
        }

    }


    return index;
}


/* ========================================
RESET STATO PESCA
======================================== */

function resetTurnDrawState(
    gameState
) {

    gameState.hasDrawnThisTurn =
        false;


    gameState.drawnCardPlayable =
        false;


    gameState.lastDrawnCardId =
        null;
}


/* ========================================
AGGIORNA CARTE GIOCABILI
======================================== */

function updatePlayableCards() {

    const handElement =
        document.getElementById(
            "playerHand"
        );


    if (!handElement) {
        return;
    }


    const gameState =
        currentRoom?.game_state;


    const myTurn =
        isMyTurn();


    const cards =
        handElement.querySelectorAll(
            ".uno-play-card"
        );


    cards.forEach(
        cardElement => {

            const cardId =
                cardElement.dataset.cardId;


            const hand =
                gameState?.hands?.[
                    currentPlayer?.id
                ] || [];


            const card =
                hand.find(
                    item =>
                        item.id ===
                        cardId
                );


            let playable =
                myTurn &&
                Boolean(card) &&
                isCardPlayable(
                    card,
                    gameState
                );


            if (
                playable &&
                gameState?.hasDrawnThisTurn ===
                    true &&
                gameState.lastDrawnCardId &&
                gameState.lastDrawnCardId !==
                    cardId
            ) {

                playable =
                    false;
            }


            cardElement.setAttribute(
                "aria-disabled",
                playable
                    ? "false"
                    : "true"
            );


            cardElement.classList.toggle(
                "uno-card-playable",
                playable
            );


            cardElement.classList.toggle(
                "uno-card-not-playable",
                !playable
            );

        }
    );


    if (gameScreen) {

        gameScreen.classList.toggle(
            "uno-my-turn",
            myTurn
        );

    }

}


/* ========================================
SCEGLI COLORE
======================================== */

function showColorPicker(
    card,
    gameState
) {

    if (!colorPicker) {

        console.error(
            "❌ colorPicker non trovato."
        );


        return;
    }


    colorPicker.hidden =
        false;


    document.body.classList.add(
        "uno-color-picker-open"
    );


    const buttons =
        colorPicker.querySelectorAll(
            "[data-color]"
        );


    buttons.forEach(
        button => {

            button.classList.remove(
                "is-selected"
            );


            button.setAttribute(
                "aria-selected",
                "false"
            );


            button.disabled =
                false;

        }
    );


    buttons.forEach(
        button => {

            const selectedColor =
                button.dataset.color;


            const colorNames = {

                red:
                    "🔴 ROSSO",

                yellow:
                    "🟡 GIALLO",

                green:
                    "🟢 VERDE",

                blue:
                    "🔵 BLU"

            };


            button.setAttribute(
                "aria-label",
                `Scegli il colore ${colorNames[selectedColor] || selectedColor}`
            );


            button.onclick =
                async () => {

                    buttons.forEach(
                        otherButton => {

                            otherButton.disabled =
                                true;

                        }
                    );


                    if (
                        !UNO_COLORS.includes(
                            selectedColor
                        )
                    ) {

                        buttons.forEach(
                            otherButton => {

                                otherButton.disabled =
                                    false;

                            }
                        );


                        return;
                    }


                    button.classList.add(
                        "is-selected"
                    );


                    button.setAttribute(
                        "aria-selected",
                        "true"
                    );


                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                120
                            )
                    );


                    gameState.currentColor =
                        selectedColor;


                    gameState.lastColorChoice = {

                        playerId:
                            currentPlayer.id,

                        playerName:
                            currentPlayer.nickname,

                        color:
                            selectedColor,

                        colorLabel:
                            colorNames[
                                selectedColor
                            ],

                        timestamp:
                            Date.now()

                    };


                    updateColorChoiceMessage(
                        gameState.lastColorChoice
                    );


                    colorPicker.hidden =
                        true;


                    document.body.classList.remove(
                        "uno-color-picker-open"
                    );


                    if (
                        card.type ===
                        "wild_draw4"
                    ) {

                        const targetIndex =
                            getNextPlayerIndex(
                                gameState
                            );


                        const targetPlayer =
                            players.filter(
                                player =>
                                    player.connected
                            )[
                                targetIndex
                            ];


                        if (
                            targetPlayer
                        ) {

                            drawCardsForPlayer(
                                gameState,
                                targetPlayer.player_id,
                                4
                            );

                        }


                        gameState.currentPlayerIndex =
                            getNextPlayerIndex(
                                gameState,
                                2
                            );


                    } else {

                        gameState.currentPlayerIndex =
                            getNextPlayerIndex(
                                gameState
                            );

                    }


                    resetTurnDrawState(
                        gameState
                    );


                    await saveUnoGameState(
                        gameState
                    );

                };

        }
    );
}


function updateColorChoiceMessage(
    lastColorChoice
) {

    if (!colorChoiceMessage) {
        return;
    }


    if (!lastColorChoice) {

        if (
            colorChoiceHideTimeout
        ) {

            clearTimeout(
                colorChoiceHideTimeout
            );


            colorChoiceHideTimeout =
                null;
        }


        colorChoiceMessage.hidden =
            true;


        colorChoiceMessage.dataset.choiceKey =
            "";


        colorChoiceMessage.classList.remove(
            "uno-color-choice-show",
            "color-red",
            "color-yellow",
            "color-green",
            "color-blue"
        );


        if (colorChoiceBall) {

            colorChoiceBall.classList.remove(
                "color-red",
                "color-yellow",
                "color-green",
                "color-blue"
            );

        }


        return;
    }


    const colorData = {

        red: {
            name:
                "ROSSO",

            className:
                "color-red"
        },

        yellow: {
            name:
                "GIALLO",

            className:
                "color-yellow"
        },

        green: {
            name:
                "VERDE",

            className:
                "color-green"
        },

        blue: {
            name:
                "BLU",

            className:
                "color-blue"
        }

    };


    const selectedColor =
        colorData[
            lastColorChoice.color
        ];


    if (!selectedColor) {

        colorChoiceMessage.hidden =
            true;


        return;
    }


    const colorClasses = [

        "color-red",
        "color-yellow",
        "color-green",
        "color-blue"

    ];


    colorClasses.forEach(
        className => {

            colorChoiceMessage.classList.remove(
                className
            );

        }
    );


    colorChoiceMessage.classList.add(
        selectedColor.className
    );


    if (colorChoiceBall) {

        colorClasses.forEach(
            className => {

                colorChoiceBall.classList.remove(
                    className
                );

            }
        );


        colorChoiceBall.classList.add(
            selectedColor.className
        );

    }


    if (colorChoicePlayer) {

        colorChoicePlayer.textContent =
            lastColorChoice.playerName ||
            "Un giocatore";
    }


    if (colorChoiceColor) {

        colorChoiceColor.textContent =
            selectedColor.name;
    }


    colorChoiceMessage.hidden =
        false;


    const choiceKey =
        `${lastColorChoice.playerId}-${lastColorChoice.timestamp}`;


    const isNewChoice =
        colorChoiceMessage.dataset.choiceKey !==
        choiceKey;


    if (!isNewChoice) {
        return;
    }


    colorChoiceMessage.dataset.choiceKey =
        choiceKey;


    colorChoiceMessage.classList.remove(
        "uno-color-choice-show"
    );


    void colorChoiceMessage.offsetWidth;


    colorChoiceMessage.classList.add(
        "uno-color-choice-show"
    );


    if (
        colorChoiceHideTimeout
    ) {

        clearTimeout(
            colorChoiceHideTimeout
        );
    }


    colorChoiceHideTimeout =
        setTimeout(
            () => {

                if (!colorChoiceMessage) {
                    return;
                }


                colorChoiceMessage.classList.remove(
                    "uno-color-choice-show"
                );


                setTimeout(
                    () => {

                        if (
                            !colorChoiceMessage
                        ) {
                            return;
                        }


                        if (
                            colorChoiceMessage.dataset.choiceKey !==
                            choiceKey
                        ) {

                            return;
                        }


                        colorChoiceMessage.hidden =
                            true;

                    },
                    350
                );

            },
            4000
        );
}


/* ========================================
VERIFICA +4
======================================== */

function canPlayWildDrawFour(
    playerId,
    gameState
) {

    const hand =
        gameState?.hands?.[
            playerId
        ] || [];


    return !hand.some(
        card => {

            if (
                card.type ===
                    "wild" ||
                card.type ===
                    "wild_draw4"
            ) {

                return false;
            }


            return (
                card.color ===
                gameState.currentColor
            );

        }
    );
}


/* ========================================
AGGIORNA MESSAGGIO TURNO
======================================== */

function updateTurnMessage() {

    if (!currentRoom?.game_state) {
        return;
    }


    const gameState =
        currentRoom.game_state;


    const lastColorChoice =
        gameState.lastColorChoice;


    updateColorChoiceMessage(
        lastColorChoice || null
    );


    if (
        gameState.status ===
        "finished"
    ) {

        const winner =
            players.find(
                player =>
                    player.player_id ===
                    gameState.winner
            );


        if (turnMessage) {

            turnMessage.textContent =
                winner
                    ? `🏆 ${winner.nickname} ha vinto!`
                    : "🏆 Partita terminata!";

        }


        if (gameTurnInfo) {

            gameTurnInfo.textContent =
                "Partita terminata";
        }


        if (gameScreen) {

            gameScreen.classList.remove(
                "uno-my-turn"
            );

        }


        showUnoVictoryScreen(
            winner
        );


        updateUnoRematchButton();


        return;
    }


    const activePlayers =
        players.filter(
            player =>
                player.connected
        );


    const currentTurnPlayer =
        activePlayers[
            gameState.currentPlayerIndex
        ] ||
        players[
            gameState.currentPlayerIndex
        ];


    if (!currentTurnPlayer) {
        return;
    }


    const myTurn =
        currentTurnPlayer.player_id ===
        currentPlayer?.id;


    const pendingDraw2 =
        Number(
            gameState.pendingDraw2 || 0
        );


    if (turnMessage) {

        if (myTurn) {

            if (
                pendingDraw2 > 0
            ) {

                turnMessage.textContent =
                    `⚠️ +${pendingDraw2} da pescare — puoi giocare un altro +2 oppure pescare tutte le carte`;

            } else {

                turnMessage.textContent =
                    "🎯 È il tuo turno!";

            }

        } else {

            turnMessage.textContent =
                pendingDraw2 > 0
                    ? `Turno di ${currentTurnPlayer.nickname} — penalità +${pendingDraw2}`
                    : `Turno di ${currentTurnPlayer.nickname}`;

        }

    }


    if (gameTurnInfo) {

        if (myTurn) {

            gameTurnInfo.textContent =
                pendingDraw2 > 0
                    ? `Penalità +${pendingDraw2}`
                    : "Il tuo turno";

        } else {

            gameTurnInfo.textContent =
                `Turno di ${currentTurnPlayer.nickname}`;

        }

    }


    updatePlayableCards();
}


/* ========================================
SCHERMATA VITTORIA
======================================== */

function showUnoVictoryScreen(
    winner
) {

    if (!gameScreen) {
        return;
    }


    let victoryScreen =
        document.getElementById(
            "unoVictoryScreen"
        );


    if (!victoryScreen) {

        victoryScreen =
            document.createElement(
                "div"
            );


        victoryScreen.id =
            "unoVictoryScreen";


        victoryScreen.className =
            "uno-victory-screen";


        victoryScreen.innerHTML = `

            <div class="uno-victory-glow"></div>

            <div class="uno-victory-confetti"></div>

            <div class="uno-victory-card">

                <div class="uno-victory-trophy">
                    🏆
                </div>

                <div class="uno-victory-small-title">
                    PARTITA TERMINATA
                </div>

                <h1 class="uno-victory-title">
                    HAI VINTO!
                </h1>

                <p class="uno-victory-winner">
                    ${escapeHtml(
                        winner?.nickname ||
                        "Vincitore"
                    )}
                </p>

                <div class="uno-victory-divider"></div>

                <p class="uno-victory-message">
                    Hai lasciato tutti gli avversari
                    senza carte.
                </p>

                <div class="uno-victory-actions">

                    <button
                        type="button"
                        id="unoRematchButton"
                        class="uno-victory-button primary"
                    >
                        🔄 Rivincita · 0/2
                    </button>

                    <button
                        type="button"
                        id="unoVictoryLobbyButton"
                        class="uno-victory-button secondary"
                    >
                        🚪 Torna alla lobby
                    </button>

                </div>

            </div>
        `;


        gameScreen.appendChild(
            victoryScreen
        );


        const rematchButton =
            document.getElementById(
                "unoRematchButton"
            );


        const lobbyButton =
            document.getElementById(
                "unoVictoryLobbyButton"
            );


        if (rematchButton) {

            rematchButton.addEventListener(
                "click",
                handleUnoRematch
            );

        }


        if (lobbyButton) {

            lobbyButton.addEventListener(
                "click",
                closeUnoVictoryAndLobby
            );

        }

    }


    const isWinner =
        winner &&
        currentPlayer &&
        winner.player_id ===
            currentPlayer.id;


    const title =
        victoryScreen.querySelector(
            ".uno-victory-title"
        );


    const message =
        victoryScreen.querySelector(
            ".uno-victory-message"
        );


    const trophy =
        victoryScreen.querySelector(
            ".uno-victory-trophy"
        );


    if (title) {

        title.textContent =
            isWinner
                ? "HAI VINTO!"
                : "HAI PERSO!";

    }


    if (message) {

        message.textContent =
            isWinner
                ? "Hai lasciato tutti gli avversari senza carte."
                : `${winner?.nickname || "Un avversario"} ha conquistato la vittoria.`;

    }


    if (trophy) {

        trophy.textContent =
            isWinner
                ? "🏆"
                : "😢";

    }


    updateUnoRematchButton();


    requestAnimationFrame(
        () => {

            victoryScreen.classList.add(
                "visible"
            );

        }
    );


    createUnoConfetti();
}


/* ========================================
PESCA CARTA
======================================== */

async function drawCard() {

    if (
        !currentRoom?.game_state ||
        !currentPlayer ||
        !isMyTurn()
    ) {

        return;
    }


    const gameState =
        structuredClone(
            currentRoom.game_state
        );


    const playerId =
        currentPlayer.id;


    if (
        !gameState.hands[playerId]
    ) {

        gameState.hands[playerId] =
            [];

    }


    if (
        gameState.hasDrawnThisTurn ===
        true
    ) {

        return;
    }


    const pendingDraw2 =
        Number(
            gameState.pendingDraw2 || 0
        );


    if (
        pendingDraw2 > 0
    ) {

        drawCardsForPlayer(
            gameState,
            playerId,
            pendingDraw2
        );


        console.log(
            `🃏 ${currentPlayer.nickname} pesca ${pendingDraw2} carte per la penalità +2.`
        );


        gameState.pendingDraw2 =
            0;


        gameState.currentPlayerIndex =
            getNextPlayerIndex(
                gameState
            );


        resetTurnDrawState(
            gameState
        );


        await saveUnoGameState(
            gameState
        );


        return;
    }


    if (
        !Array.isArray(
            gameState.deck
        ) ||
        gameState.deck.length === 0
    ) {

        refillUnoDeck(
            gameState
        );

    }


    if (
        !gameState.deck?.length
    ) {

        showError(
            gameError,
            "Non ci sono carte disponibili da pescare."
        );


        return;
    }


    const drawnCard =
        gameState.deck.pop();


    if (!drawnCard) {
        return;
    }


    gameState.hands[
        playerId
    ].push(
        drawnCard
    );


    gameState.hasDrawnThisTurn =
        true;


    gameState.lastDrawnCardId =
        drawnCard.id;


    gameState.drawnCardPlayable =
        isCardPlayable(
            drawnCard,
            gameState
        );


    currentRoom.game_state =
        gameState;


    await saveUnoGameState(
        gameState
    );
}


/* ========================================
RICARICA MAZZO
======================================== */

function refillUnoDeck(
    gameState
) {

    if (
        !gameState ||
        !Array.isArray(
            gameState.discardPile
        ) ||
        gameState.discardPile.length <=
            1
    ) {

        return;
    }


    const topCard =
        gameState.discardPile[
            gameState.discardPile.length - 1
        ];


    const cardsToRecycle =
        gameState.discardPile.slice(
            0,
            -1
        );


    gameState.discardPile =
        [
            topCard
        ];


    cardsToRecycle.forEach(
        card => {

            if (
                card.type ===
                    "wild" ||
                card.type ===
                    "wild_draw4"
            ) {

                card.color =
                    UNO_WILD;
            }


            gameState.deck.push(
                card
            );

        }
    );


    gameState.deck =
        shuffleUnoDeck(
            gameState.deck
        );


    console.log(
        "🔄 Mazzo ricreato:",
        gameState.deck.length,
        "carte"
    );
}


/* ========================================
PESCA - STATO PULSANTE
======================================== */

function updateDrawButtonState() {

    const state =
        currentRoom?.game_state;


    const canDraw =
        isMyTurn() &&
        state?.hasDrawnThisTurn !==
            true;


    const pendingDraw2 =
        Number(
            state?.pendingDraw2 || 0
        );


    if (drawCardButton) {

        drawCardButton.disabled =
            !canDraw;


        drawCardButton.textContent =
            pendingDraw2 > 0
                ? `Pesca ${pendingDraw2} carte`
                : "Pesca carta";

    }


    const drawPile =
        document.getElementById(
            "drawPile"
        );


    if (drawPile) {

        drawPile.disabled =
            !canDraw;


        drawPile.setAttribute(
            "aria-disabled",
            canDraw
                ? "false"
                : "true"
        );


        drawPile.style.pointerEvents =
            canDraw
                ? "auto"
                : "none";


        const drawLabel =
            drawPile.querySelector(
                "small"
            );


        if (drawLabel) {

            drawLabel.textContent =
                pendingDraw2 > 0
                    ? `Pesca ${pendingDraw2}`
                    : "Pesca";

        }

    }

}


/* ========================================
PASSO
======================================== */

function updatePassButton() {

    const passButton =
        document.getElementById(
            "passTurnButton"
        );


    if (!passButton) {
        return;
    }


    const state =
        currentRoom?.game_state;


    const pendingDraw2 =
        Number(
            state?.pendingDraw2 || 0
        );


    const canPass =
        isMyTurn() &&
        state?.hasDrawnThisTurn ===
            true &&
        pendingDraw2 === 0;


    passButton.hidden =
        !canPass;


    passButton.disabled =
        !canPass;
}


async function passTurn() {

    if (
        !currentRoom?.game_state ||
        !currentPlayer ||
        !isMyTurn()
    ) {

        return;
    }


    const gameState =
        structuredClone(
            currentRoom.game_state
        );


    if (
        Number(
            gameState.pendingDraw2 || 0
        ) > 0
    ) {

        return;
    }


    if (
        gameState.hasDrawnThisTurn !==
        true
    ) {

        return;
    }


    gameState.currentPlayerIndex =
        getNextPlayerIndex(
            gameState
        );


    resetTurnDrawState(
        gameState
    );


    await saveUnoGameState(
        gameState
    );
}


/* ========================================
PULSANTE UNO
======================================== */

async function callUno() {

    if (
        !currentPlayer ||
        !currentRoom?.game_state
    ) {

        return;
    }


    const gameState =
        structuredClone(
            currentRoom.game_state
        );


    const hand =
        gameState.hands[
            currentPlayer.id
        ] || [];


    if (
        hand.length !== 1
    ) {

        return;
    }


    if (!gameState.unoCalls) {

        gameState.unoCalls =
            {};

    }


    gameState.unoCalls[
        currentPlayer.id
    ] = true;


    await saveUnoGameState(
        gameState
    );


    if (unoButton) {

        unoButton.textContent =
            "✅ UNO!";


        setTimeout(
            () => {

                if (unoButton) {

                    unoButton.textContent =
                        "UNO!";

                }

            },
            1200
        );

    }
}


/* ========================================
PESCA CARTE +2 / +4
======================================== */

function drawCardsForPlayer(
    gameState,
    playerId,
    amount
) {

    if (
        !gameState ||
        !playerId ||
        amount <= 0
    ) {

        return;
    }


    if (
        !gameState.hands[playerId]
    ) {

        gameState.hands[playerId] =
            [];

    }


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        if (
            !gameState.deck?.length
        ) {

            refillUnoDeck(
                gameState
            );

        }


        if (
            !gameState.deck?.length
        ) {

            break;
        }


        const card =
            gameState.deck.pop();


        if (card) {

            gameState.hands[
                playerId
            ].push(
                card
            );

        }

    }
}


/* ========================================
RIVINCITA
======================================== */

async function handleUnoRematch() {

    if (
        !currentRoom ||
        !currentPlayer
    ) {

        return;
    }


    if (
        currentRoom.status !==
        "finished"
    ) {

        return;
    }


    const myPlayer =
        players.find(
            player =>
                player.player_id ===
                currentPlayer.id
        );


    if (!myPlayer) {

        showError(
            gameError,
            "Giocatore non trovato."
        );


        return;
    }


    if (
        Boolean(
            myPlayer.is_ready
        )
    ) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("uno_players")
                .update({

                    is_ready:
                        true,

                    connected:
                        true,

                    last_seen:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    myPlayer.id
                );


        if (error) {
            throw error;
        }


        myPlayer.is_ready =
            true;


        isReady =
            true;


        updateUnoRematchButton();


        await checkUnoRematchReady();


    } catch (error) {

        console.error(
            "❌ ERRORE RIVINCITA UNO:",
            error
        );


        showError(
            gameError,
            getFriendlyError(
                error,
                "Impossibile confermare la rivincita."
            )
        );


        myPlayer.is_ready =
            false;


        isReady =
            false;


        updateUnoRematchButton();

    }

}


/* ========================================
AGGIORNA PULSANTE RIVINCITA
======================================== */

function updateUnoRematchButton() {

    const button =
        document.getElementById(
            "unoRematchButton"
        );


    if (!button) {
        return;
    }


    const activePlayers =
        players.filter(
            player =>
                player.connected
        );


    const totalPlayers =
        activePlayers.length;


    const readyPlayers =
        activePlayers.filter(
            player =>
                Boolean(
                    player.is_ready
                )
        ).length;


    const myPlayer =
        players.find(
            player =>
                player.player_id ===
                currentPlayer?.id
        );


    const isMyReady =
        Boolean(
            myPlayer?.is_ready
        );


    button.textContent =
        isMyReady
            ? `✓ Pronto · ${readyPlayers}/${totalPlayers}`
            : `🔄 Rivincita · ${readyPlayers}/${totalPlayers}`;


    button.classList.toggle(
        "is-ready",
        isMyReady
    );


    button.disabled =
        false;
}


/* ========================================
CONTROLLA SE TUTTI SONO PRONTI
======================================== */

async function checkUnoRematchReady() {

    if (
        !currentRoom ||
        !currentPlayer
    ) {

        return;
    }


    if (!isHost) {
        return;
    }


    if (
        currentRoom.status !==
        "finished"
    ) {

        return;
    }


    if (rematchStarting) {
        return;
    }


    try {

        const {
            data:
                roomPlayers,
            error
        } =
            await supabaseClient
                .from("uno_players")
                .select("*")
                .eq(
                    "room_id",
                    currentRoom.id
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {
            throw error;
        }


        if (
            !roomPlayers ||
            roomPlayers.length === 0
        ) {

            return;
        }


        players =
            roomPlayers;


        const activePlayers =
            roomPlayers.filter(
                player =>
                    player.connected
            );


        const totalPlayers =
            activePlayers.length;


        const readyPlayers =
            activePlayers.filter(
                player =>
                    Boolean(
                        player.is_ready
                    )
            ).length;


        if (
            totalPlayers < 2 ||
            readyPlayers < totalPlayers
        ) {

            updateUnoRematchButton();


            return;
        }


        rematchStarting =
            true;


        updateUnoRematchButton();


        const newGameState =
            createInitialUnoGame();


        const {
            data,
            error:
                updateError
        } =
            await supabaseClient
                .from("uno_rooms")
                .update({

                    status:
                        "playing",

                    game_state:
                        newGameState,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    currentRoom.id
                )
                .eq(
                    "status",
                    "finished"
                )
                .select()
                .single();


        if (updateError) {
            throw updateError;
        }


        if (!data) {

            rematchStarting =
                false;


            updateUnoRematchButton();


            return;
        }


        currentRoom =
            data;


        await showGameScreen();


        rematchStarting =
            false;


    } catch (error) {

        console.error(
            "❌ ERRORE AVVIO RIVINCITA UNO:",
            error
        );


        rematchStarting =
            false;


        showError(
            gameError,
            getFriendlyError(
                error,
                "Impossibile avviare la rivincita."
            )
        );


        updateUnoRematchButton();
    }
}


/* ========================================
TORNA ALLA LOBBY
======================================== */

async function closeUnoVictoryAndLobby() {

    if (!currentRoom) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("uno_rooms")
                .update({

                    status:
                        "waiting",

                    game_state:
                        null,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    currentRoom.id
                );


        if (error) {
            throw error;
        }


        const {
            error:
                readyError
        } =
            await supabaseClient
                .from("uno_players")
                .update({

                    is_ready:
                        false,

                    connected:
                        true,

                    last_seen:
                        new Date().toISOString()

                })
                .eq(
                    "room_id",
                    currentRoom.id
                );


        if (readyError) {

            console.error(
                "⚠️ RESET READY LOBBY:",
                readyError
            );

        }


        players.forEach(
            player => {

                player.is_ready =
                    false;

            }
        );


        isReady =
            false;


        rematchStarting =
            false;


        if (colorPicker) {

            colorPicker.hidden =
                true;
        }


        document.body.classList.remove(
            "uno-color-picker-open"
        );


        if (colorChoiceMessage) {

            colorChoiceMessage.hidden =
                true;


            colorChoiceMessage.dataset.choiceKey =
                "";


            colorChoiceMessage.classList.remove(
                "uno-color-choice-show",
                "color-red",
                "color-yellow",
                "color-green",
                "color-blue"
            );

        }


        if (colorChoiceBall) {

            colorChoiceBall.classList.remove(
                "color-red",
                "color-yellow",
                "color-green",
                "color-blue"
            );

        }


        if (colorChoiceBallIcon) {

            colorChoiceBallIcon.textContent =
                "";

        }


        if (colorChoicePlayer) {

            colorChoicePlayer.textContent =
                "-";

        }


        if (colorChoiceColor) {

            colorChoiceColor.textContent =
                "-";

        }


        const victoryScreen =
            document.getElementById(
                "unoVictoryScreen"
            );


        if (victoryScreen) {

            victoryScreen.classList.remove(
                "visible"
            );


            setTimeout(
                () => {

                    if (
                        victoryScreen.parentNode
                    ) {

                        victoryScreen.remove();
                    }

                },
                300
            );

        }


        if (roomScreen) {
            roomScreen.hidden = false;
        }


        if (gameScreen) {
            gameScreen.hidden = true;
        }


        if (roomStatus) {

            roomStatus.textContent =
                "In attesa";

        }


        updateReadyButton();
        updateReadyInfo();
        updateStartButton();


    } catch (error) {

        console.error(
            "❌ ERRORE RITORNO LOBBY:",
            error
        );


        showError(
            gameError,
            getFriendlyError(
                error,
                "Impossibile tornare alla lobby."
            )
        );

    }
}


/* ========================================
ESCAPE HTML
======================================== */

function escapeHtml(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;
}


/* ========================================
CONFETTI
======================================== */

function createUnoConfetti() {

    const container =
        document.querySelector(
            ".uno-victory-confetti"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const symbols = [

        "✦",
        "◆",
        "●",
        "★",
        "✧"

    ];


    for (
        let i = 0;
        i < 55;
        i++
    ) {

        const piece =
            document.createElement(
                "span"
            );


        piece.textContent =
            symbols[
                Math.floor(
                    Math.random() *
                    symbols.length
                )
            ];


        piece.style.left =
            `${Math.random() * 100}%`;


        piece.style.animationDelay =
            `${Math.random() * 2}s`;


        piece.style.animationDuration =
            `${2.5 + Math.random() * 2.5}s`;


        piece.style.setProperty(
            "--confetti-x",
            `${(Math.random() - 0.5) * 180}px`
        );


        container.appendChild(
            piece
        );

    }
}


/* ========================================
CHIUSURA PAGINA / TAB
======================================== */

window.addEventListener(
    "pagehide",
    () => {

        stopPresenceHeartbeat();
        stopUnoBlockedCheck();


        if (
            currentPlayer &&
            currentRoom
        ) {

            markCurrentPlayerOffline();

        }

    }
);


/* ========================================
VISIBILITY
======================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            /*
               Quando l'utente torna sulla scheda,
               aggiorniamo subito i controlli Admin.
            */

            refreshUnoControls();


            /*
               Se è dentro una stanza,
               aggiorniamo immediatamente la presenza.
            */

            if (
                currentPlayer &&
                currentRoom
            ) {

                updatePlayerPresence();


                /*
                   Controlliamo anche se il giocatore
                   è stato bloccato dall'Admin.
                */

                checkUnoPlayerBlocked();

            }

        }

    }
);
