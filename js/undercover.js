"use strict";


/* =========================================================
   DOM
========================================================= */

const screens = {

    mode: document.getElementById("modeScreen"),
    onlineEntry: document.getElementById("onlineEntryScreen"),
    onlineLobby: document.getElementById("onlineLobbyScreen"),
    onlineWaiting: document.getElementById("onlineWaitingScreen"),
    setup: document.getElementById("setupScreen"),
    players: document.getElementById("playersScreen"),
    reveal: document.getElementById("revealScreen"),
    card: document.getElementById("cardScreen"),
    roundStart: document.getElementById("roundStartScreen"),
    voting: document.getElementById("votingScreen"),
    voteResult: document.getElementById("voteResultScreen"),
    whiteGuess: document.getElementById("whiteGuessScreen"),
    victory: document.getElementById("victoryScreen")

};


const els = {

    localModeButton:
        document.getElementById("localModeButton"),

    onlineModeButton:
        document.getElementById("onlineModeButton"),

    onlineCreateName:
        document.getElementById("onlineCreateName"),

    createOnlineRoomButton:
        document.getElementById("createOnlineRoomButton"),

    onlineJoinName:
        document.getElementById("onlineJoinName"),

    onlineRoomCodeInput:
        document.getElementById("onlineRoomCodeInput"),

    joinOnlineRoomButton:
        document.getElementById("joinOnlineRoomButton"),

    onlineEntryMessage:
        document.getElementById("onlineEntryMessage"),

    onlineEntryBackButton:
        document.getElementById("onlineEntryBackButton"),

    onlineConnectionStatus:
        document.getElementById("onlineConnectionStatus"),

    onlineRoomCodeDisplay:
        document.getElementById("onlineRoomCodeDisplay"),

    copyOnlineRoomCodeButton:
        document.getElementById("copyOnlineRoomCodeButton"),

    onlinePlayerCount:
        document.getElementById("onlinePlayerCount"),

    onlinePlayerList:
        document.getElementById("onlinePlayerList"),

    onlineSettingsPanel:
        document.getElementById("onlineSettingsPanel"),

    onlineSettingsHint:
        document.getElementById("onlineSettingsHint"),

    onlineRoleMode:
        document.getElementById("onlineRoleMode"),

    onlineUndercoverCount:
        document.getElementById("onlineUndercoverCount"),

    onlineMrWhiteCount:
        document.getElementById("onlineMrWhiteCount"),

    onlineDifficulty:
        document.getElementById("onlineDifficulty"),

    onlineCategory:
        document.getElementById("onlineCategory"),

    onlineRoleSummary:
        document.getElementById("onlineRoleSummary"),

    onlineLobbyMessage:
        document.getElementById("onlineLobbyMessage"),

    leaveOnlineRoomButton:
        document.getElementById("leaveOnlineRoomButton"),

    startOnlineGameButton:
        document.getElementById("startOnlineGameButton"),

    onlineWaitingBadge:
        document.getElementById("onlineWaitingBadge"),

    onlineWaitingTitle:
        document.getElementById("onlineWaitingTitle"),

    onlineWaitingDescription:
        document.getElementById("onlineWaitingDescription"),

    onlineWaitingMessage:
        document.getElementById("onlineWaitingMessage"),

    leaveOnlineGameButton:
        document.getElementById("leaveOnlineGameButton"),

    backToGamesButton:
        document.getElementById("backToGamesButton"),


    playerCount:
        document.getElementById("playerCount"),

    undercoverCount:
        document.getElementById("undercoverCount"),

    mrWhiteCount:
        document.getElementById("mrWhiteCount"),

    difficulty:
        document.getElementById("difficulty"),


    setupBackButton:
        document.getElementById("setupBackButton"),

    setupNextButton:
        document.getElementById("setupNextButton"),


    playerNameList:
        document.getElementById("playerNameList"),

    playersBackButton:
        document.getElementById("playersBackButton"),

    startGameButton:
        document.getElementById("startGameButton"),


    revealBadge:
        document.getElementById("revealBadge"),

    revealPlayerName:
        document.getElementById("revealPlayerName"),

    showCardButton:
        document.getElementById("showCardButton"),


    privateRole:
        document.getElementById("privateRole"),

    privateIcon:
        document.getElementById("privateIcon"),

    privateWord:
        document.getElementById("privateWord"),

    privateDescription:
        document.getElementById("privateDescription"),

    hideCardButton:
        document.getElementById("hideCardButton"),


    roundStartBadge:
        document.getElementById("roundStartBadge"),

    roundPlayerList:
        document.getElementById("roundPlayerList"),

    startRoundButton:
        document.getElementById("startRoundButton"),


    votingRoundNumber:
        document.getElementById("votingRoundNumber"),

    votingTitle:
        document.getElementById("votingTitle"),

    votingDescription:
        document.getElementById("votingDescription"),

    votingList:
        document.getElementById("votingList"),

    onlineVoteFeedback:
        document.getElementById("onlineVoteFeedback"),

    onlinePersonalVoteActions:
        document.getElementById("onlinePersonalVoteActions"),

    cancelOnlineVoteButton:
        document.getElementById("cancelOnlineVoteButton"),

    skipOnlineVoteButton:
        document.getElementById("skipOnlineVoteButton"),

    voteTotal:
        document.getElementById("voteTotal"),

    startVotingButton:
        document.getElementById("startVotingButton"),

    finishVotingButton:
        document.getElementById("finishVotingButton"),


    voteResultBadge:
        document.getElementById("voteResultBadge"),

    voteResultIcon:
        document.getElementById("voteResultIcon"),

    voteResultTitle:
        document.getElementById("voteResultTitle"),

    eliminatedCard:
        document.getElementById("eliminatedCard"),

    eliminatedLabel:
        document.getElementById("eliminatedLabel"),

    eliminatedPlayerName:
        document.getElementById("eliminatedPlayerName"),

    revealedRole:
        document.getElementById("revealedRole"),

    resultVoteSummary:
        document.getElementById("resultVoteSummary"),

    continueAfterVoteButton:
        document.getElementById("continueAfterVoteButton"),


    whiteGuessInput:
        document.getElementById("whiteGuessInput"),

    whiteGuessLabel:
        document.getElementById("whiteGuessLabel"),

    whiteGuessButton:
        document.getElementById("whiteGuessButton"),

    whiteGuessContinueButton:
        document.getElementById("whiteGuessContinueButton"),

    whiteGuessResult:
        document.getElementById("whiteGuessResult"),

    whiteGuessTitle:
        document.getElementById("whiteGuessTitle"),


    victoryIcon:
        document.getElementById("victoryIcon"),

    victoryTitle:
        document.getElementById("victoryTitle"),

    victoryDescription:
        document.getElementById("victoryDescription"),

    victorySummary:
        document.getElementById("victorySummary"),

    victoryMenuButton:
        document.getElementById("victoryMenuButton"),

    restartGameButton:
        document.getElementById("restartGameButton")

};


/* =========================================================
   PAROLE
========================================================= */

const LOCAL_WORD_PAIRS = [

    {
        category: "Cibo",
        civilian: "Pizza",
        undercover: "Focaccia",
        difficulty: "easy"
    },

    {
        category: "Cibo",
        civilian: "Pasta",
        undercover: "Lasagna",
        difficulty: "easy"
    },

    {
        category: "Cibo",
        civilian: "Hamburger",
        undercover: "Cheeseburger",
        difficulty: "normal"
    },

    {
        category: "Cibo",
        civilian: "Gelato",
        undercover: "Sorbetto",
        difficulty: "normal"
    },

    {
        category: "Casa",
        civilian: "Divano",
        undercover: "Poltrona",
        difficulty: "easy"
    },

    {
        category: "Casa",
        civilian: "Doccia",
        undercover: "Vasca",
        difficulty: "easy"
    },

    {
        category: "Abbigliamento",
        civilian: "Jeans",
        undercover: "Pantaloni",
        difficulty: "easy"
    },

    {
        category: "Sport",
        civilian: "Tennis",
        undercover: "Padel",
        difficulty: "normal"
    },

    {
        category: "Sport",
        civilian: "Calcio",
        undercover: "Calcetto",
        difficulty: "easy"
    },

    {
        category: "Trasporti",
        civilian: "Auto",
        undercover: "Taxi",
        difficulty: "easy"
    },

    {
        category: "Animali",
        civilian: "Cane",
        undercover: "Lupo",
        difficulty: "normal"
    },

    {
        category: "Animali",
        civilian: "Gatto",
        undercover: "Tigre",
        difficulty: "normal"
    },

    {
        category: "Natura",
        civilian: "Mare",
        undercover: "Oceano",
        difficulty: "normal"
    },

    {
        category: "Viaggi",
        civilian: "Hotel",
        undercover: "Resort",
        difficulty: "normal"
    },

    {
        category: "Tecnologia",
        civilian: "Telefono",
        undercover: "Smartphone",
        difficulty: "easy"
    },

    {
        category: "Musica",
        civilian: "Chitarra",
        undercover: "Ukulele",
        difficulty: "normal"
    },

    {
        category: "Cinema",
        civilian: "Film",
        undercover: "Serie",
        difficulty: "easy"
    },

    {
        category: "Feste",
        civilian: "Compleanno",
        undercover: "Matrimonio",
        difficulty: "normal"
    },

    {
        category: "Cucina",
        civilian: "Forchetta",
        undercover: "Coltello",
        difficulty: "easy"
    },

    {
        category: "Bagno",
        civilian: "Asciugamano",
        undercover: "Accappatoio",
        difficulty: "normal"
    },

    {
        category: "Scuola",
        civilian: "Matita",
        undercover: "Penna",
        difficulty: "easy"
    },

    {
        category: "Famiglia",
        civilian: "Fratello",
        undercover: "Cugino",
        difficulty: "normal"
    },

    {
        category: "Vacanze",
        civilian: "Mare",
        undercover: "Piscina",
        difficulty: "easy"
    },

    {
        category: "Mestieri",
        civilian: "Medico",
        undercover: "Infermiere",
        difficulty: "normal"
    }

];


/* =========================================================
   SUPABASE / ONLINE
========================================================= */

const SUPABASE_URL =
    "https://pzjbxrcxlztwjxetnzkw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_obaFQtUNuG3980ZkndTaCQ_bmc4QeHu";

const supabaseClient =
    window.supabase?.createClient
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        )
        : null;


function getOnlineClientId() {

    const storageKey =
        "cuginiparty_undercover_client_id";

    let clientId =
        localStorage.getItem(storageKey);


    if (!clientId) {

        clientId =
            createPlayerId();

        localStorage.setItem(
            storageKey,
            clientId
        );

    }


    return clientId;

}


const onlineGame = {

    roomId: null,

    roomCode: null,

    playerId: null,

    clientId: null,

    isHost: false,

    channel: null,

    room: null,

    players: [],

    publicState: null,

    myCard: null,

    ready: false,

    selectedVote: null,

    voteSkipped: false,

    voteKey: null,

    voteSaving: false,

    reconnectTimer: null,

    leaving: false

};


/* =========================================================
   GAME STATE
========================================================= */

const game = {

    mode: null,

    playerCount: 0,

    undercoverCount: 1,

    mrWhiteCount: 1,

    difficulty: "normal",

    players: [],

    wordPair: null,

    revealIndex: 0,

    round: 1,

    votingStarted: false,

    votes: {},

    eliminatedPlayer: null,

    voteTied: false,

    tiedPlayerIds: [],

    whiteGuessOutcome: null,

    finished: false

};


/* =========================================================
   SCREEN
========================================================= */

function showScreen(name) {

    Object.values(screens).forEach((screen) => {

        if (screen) {
            screen.classList.add("hidden");
        }

    });


    if (screens[name]) {

        screens[name].classList.remove("hidden");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    game.mode = null;

    game.playerCount = 5;

    game.undercoverCount = 1;

    game.mrWhiteCount = 1;

    game.difficulty = "normal";

    game.players = [];

    game.wordPair = null;

    game.revealIndex = 0;

    game.round = 1;

    game.votingStarted = false;

    game.votes = {};

    game.eliminatedPlayer = null;

    game.voteTied = false;

    game.tiedPlayerIds = [];

    game.whiteGuessOutcome = null;

    game.finished = false;


    els.playerCount.value = "5";

    els.undercoverCount.value = "1";

    els.mrWhiteCount.value = "1";

    els.difficulty.value = "normal";

    els.playerNameList.innerHTML = "";


    els.whiteGuessInput.value = "";

    els.whiteGuessInput.disabled = false;

    els.whiteGuessLabel.classList.remove("hidden");

    els.whiteGuessButton.disabled = false;

    els.whiteGuessButton.classList.remove("hidden");

    els.whiteGuessContinueButton.classList.add("hidden");

    els.whiteGuessResult.className =
        "white-guess-result hidden";

    els.whiteGuessResult.textContent = "";

    els.victoryMenuButton.textContent = "Menu";

    els.restartGameButton.textContent = "Giochiamo ancora →";

    els.restartGameButton.disabled = false;


    syncRoleLimits("playerCount");

}


/* =========================================================
   HELPERS
========================================================= */

function shuffle(array) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [copy[i], copy[j]] =
            [copy[j], copy[i]];

    }

    return copy;

}


function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "");

}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function getAlivePlayers() {

    return game.players.filter(
        (player) => player.alive
    );

}


function countAliveRole(role) {

    return getAlivePlayers()
        .filter(
            (player) =>
                player.role === role
        ).length;

}


function createPlayerId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {

        return window.crypto.randomUUID();

    }


    return `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;

}


const INITIAL_ROLE_BALANCE_MESSAGE =
    "Servono più Civili dei ruoli speciali. Riduci il numero di Undercover o Mr. White.";


function getMaxInitialSpecialCount(playerCount) {

    return Math.max(
        0,
        Math.floor((playerCount - 1) / 2)
    );

}


function hasValidInitialRoleBalance(
    playerCount,
    undercoverCount,
    mrWhiteCount
) {

    const specialCount =
        undercoverCount + mrWhiteCount;

    const civilianCount =
        playerCount - specialCount;

    return Number.isInteger(playerCount) &&
        Number.isInteger(undercoverCount) &&
        Number.isInteger(mrWhiteCount) &&
        undercoverCount >= 0 &&
        mrWhiteCount >= 1 &&
        mrWhiteCount <= 2 &&
        civilianCount > specialCount;

}


function getAutomaticRoleCounts(playerCount) {

    let undercoverCount = 0;
    let mrWhiteCount = 1;

    if (playerCount >= 19) undercoverCount = 5;
    else if (playerCount >= 16) undercoverCount = 4;
    else if (playerCount >= 13) undercoverCount = 3;
    else if (playerCount >= 8) undercoverCount = 2;
    else if (playerCount >= 5) undercoverCount = 1;

    if (playerCount >= 10) mrWhiteCount = 2;

    const specialCount = undercoverCount + mrWhiteCount;
    const civilianCount = playerCount - specialCount;

    return {
        undercoverCount,
        mrWhiteCount,
        civilianCount,
        isValid: hasValidInitialRoleBalance(
            playerCount,
            undercoverCount,
            mrWhiteCount
        )
    };

}


function syncRoleLimits(changedField) {

    const playerCount =
        Number(els.playerCount.value);


    let undercoverCount =
        Number(els.undercoverCount.value);


    let mrWhiteCount =
        Number(els.mrWhiteCount.value);


    const maxSpecialRoles =
        getMaxInitialSpecialCount(playerCount);


    undercoverCount =
        Math.min(undercoverCount, maxSpecialRoles);

    mrWhiteCount =
        Math.max(
            1,
            Math.min(mrWhiteCount, maxSpecialRoles, 2)
        );


    if (
        undercoverCount + mrWhiteCount >
        maxSpecialRoles
    ) {

        if (changedField === "undercover") {

            undercoverCount =
                Math.max(
                    0,
                    maxSpecialRoles - mrWhiteCount
                );

        }

        else {

            undercoverCount =
                Math.max(
                    0,
                    maxSpecialRoles - mrWhiteCount
                );

        }

    }


    els.undercoverCount.value =
        String(undercoverCount);

    els.mrWhiteCount.value =
        String(mrWhiteCount);


    [...els.undercoverCount.options].forEach(
        (option) => {

            option.disabled =
                Number(option.value) + mrWhiteCount >
                maxSpecialRoles;

        }
    );


    [...els.mrWhiteCount.options].forEach(
        (option) => {

            option.disabled =
                Number(option.value) + undercoverCount >
                maxSpecialRoles;

        }
    );

}


/* =========================================================
   ONLINE HELPERS
========================================================= */

function setOnlineMessage(element, message = "", type = "") {

    if (!element) return;


    element.textContent = message;

    element.classList.remove(
        "hidden",
        "is-error",
        "is-success"
    );


    if (!message) {

        element.classList.add("hidden");

        return;

    }


    if (type === "error") {

        element.classList.add("is-error");

    }


    if (type === "success") {

        element.classList.add("is-success");

    }

}


function setOnlineConnectionStatus(text, state = "") {

    if (!els.onlineConnectionStatus) return;


    els.onlineConnectionStatus.textContent = text;

    els.onlineConnectionStatus.classList.remove(
        "is-online",
        "is-offline"
    );


    if (state === "online") {

        els.onlineConnectionStatus.classList.add(
            "is-online"
        );

    }


    if (state === "offline") {

        els.onlineConnectionStatus.classList.add(
            "is-offline"
        );

    }

}


function normalizeRoomCode(value) {

    return String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);

}


function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";


    for (let i = 0; i < 6; i++) {

        code +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

    }


    return code;

}


function setOnlineButtonsBusy(isBusy) {

    if (els.createOnlineRoomButton) {

        els.createOnlineRoomButton.disabled =
            isBusy;

    }


    if (els.joinOnlineRoomButton) {

        els.joinOnlineRoomButton.disabled =
            isBusy;

    }

}


function resetOnlineState() {

    if (
        onlineGame.channel &&
        supabaseClient
    ) {

        supabaseClient.removeChannel(
            onlineGame.channel
        );

    }


    onlineGame.roomId = null;

    onlineGame.roomCode = null;

    onlineGame.playerId = null;

    onlineGame.clientId = null;

    onlineGame.isHost = false;

    onlineGame.channel = null;

    onlineGame.room = null;

    onlineGame.players = [];

    onlineGame.publicState = null;

    onlineGame.myCard = null;

    onlineGame.ready = false;

    onlineGame.selectedVote = null;
    onlineGame.voteSkipped = false;

    onlineGame.voteKey = null;

    onlineGame.voteSaving = false;

    onlineGame.leaving = false;

    if (onlineGame.reconnectTimer) {
        clearTimeout(onlineGame.reconnectTimer);
        onlineGame.reconnectTimer = null;
    }


    if (els.onlineRoomCodeDisplay) {

        els.onlineRoomCodeDisplay.textContent =
            "———";

    }


    if (els.onlinePlayerCount) {

        els.onlinePlayerCount.textContent =
            "0 giocatori";

    }


    if (els.onlinePlayerList) {

        els.onlinePlayerList.innerHTML = "";

    }

    if (els.onlineWaitingBadge) {

        els.onlineWaitingBadge.textContent = "Online";

    }


    setOnlineConnectionStatus(
        "Connessione…"
    );

    setOnlineMessage(
        els.onlineLobbyMessage
    );

    setOnlineMessage(
        els.onlineVoteFeedback
    );

}


function unwrapRpcJson(data) {

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    return data || null;

}


async function loadOnlineRoomAndPlayer(roomId, playerId) {

    const [roomResult, playerResult] = await Promise.all([
        supabaseClient
            .from("undercover_rooms")
            .select("*")
            .eq("id", roomId)
            .maybeSingle(),
        supabaseClient
            .from("undercover_players")
            .select("id,player_id,room_id,nickname,name,is_host,connected,joined_at,updated_at")
            .eq("room_id", roomId)
            .eq("player_id", playerId)
            .maybeSingle()
    ]);

    if (roomResult.error) throw roomResult.error;
    if (playerResult.error) throw playerResult.error;
    if (!roomResult.data || !playerResult.data) {
        throw new Error("La sessione online non Ã¨ piÃ¹ disponibile.");
    }

    return {
        room: roomResult.data,
        player: playerResult.data
    };

}


async function createUniqueOnlineRoom(name, clientId) {

    for (let attempt = 0; attempt < 8; attempt++) {

        const code =
            generateRoomCode();


        const { data, error } = await supabaseClient.rpc(
            "undercover_create_room",
            {
                p_room_code: code,
                p_name: name,
                p_client_id: clientId
            }
        );


        if (!error && data) {

            const session = unwrapRpcJson(data);
            return loadOnlineRoomAndPlayer(
                session.room_id,
                session.player_id
            );

        }


        if (error?.code !== "23505") {

            throw error;

        }

    }


    throw new Error(
        "Non sono riuscito a generare un codice stanza unico. Riprova."
    );

}


async function loadOnlinePlayers() {

    if (
        !supabaseClient ||
        !onlineGame.roomId
    ) {

        return;

    }


    const { data, error } =
        await supabaseClient
            .from("undercover_players")
            .select("id,player_id,room_id,nickname,name,is_host,connected,joined_at,updated_at")
            .eq(
                "room_id",
                onlineGame.roomId
            )
            .order(
                "joined_at",
                { ascending: true }
            );


    if (error) {

        console.error(
            "Errore caricamento giocatori online:",
            error
        );

        setOnlineMessage(
            els.onlineLobbyMessage,
            "Impossibile aggiornare la lista dei giocatori.",
            "error"
        );

        return;

    }


    onlineGame.players = (data || []).map((player) => ({
        ...player,
        id: player.player_id,
        name: player.nickname || player.name || "Giocatore"
    }));

    const currentPlayer = onlineGame.players.find(
        (player) => String(player.id) === String(onlineGame.playerId)
    );

    onlineGame.isHost = currentPlayer?.is_host === true;

    if (onlineGame.reconnectTimer) {
        clearTimeout(onlineGame.reconnectTimer);
        onlineGame.reconnectTimer = null;
    }

    const currentHost = onlineGame.players.find((player) => player.is_host === true);
    if (
        currentPlayer?.connected !== false &&
        !onlineGame.isHost &&
        currentHost?.connected === false
    ) {
        onlineGame.reconnectTimer = setTimeout(async () => {
            try {
                const { error } = await supabaseClient.rpc("undercover_claim_host", {
                    p_room_id: onlineGame.roomId,
                    p_player_id: onlineGame.playerId,
                    p_client_id: onlineGame.clientId
                });
                if (error) throw error;
                await loadOnlinePlayers();
                await syncOnlineRoom();
            }
            catch (error) {
                console.warn("Trasferimento host non riuscito:", error);
            }
        }, 16000);
    }

    renderOnlinePlayers(onlineGame.players);
    updateOnlineLobbyPermissions();

    if (game.mode === "online" && onlineGame.room?.status !== "lobby") {
        const phase = onlineGame.publicState?.phase;
        if (phase === "round") renderOnlineRound();
        else if (phase === "voting") renderOnlineVoting();
        else if (phase === "result") renderOnlineResult();
        else if (phase === "closed") showOnlineClosed();
        else if (phase === "victory") showOnlineVictory();
    }

}


function renderOnlinePlayers(players) {

    if (!els.onlinePlayerList) return;


    els.onlinePlayerCount.textContent =
        `${players.length} ${
            players.length === 1
                ? "giocatore"
                : "giocatori"
        }`;


    if (!players.length) {

        els.onlinePlayerList.innerHTML = `

            <div class="online-player-row is-offline">
                <span class="online-player-presence"></span>
                <span class="online-player-name">
                    Nessun giocatore
                </span>
            </div>

        `;

        return;

    }


    els.onlinePlayerList.innerHTML =
        players.map(
            (player) => {

                const connected =
                    player.connected !== false;


                return `

                    <div
                        class="online-player-row ${connected ? "" : "is-offline"}"
                    >

                        <span
                            class="online-player-presence"
                            aria-hidden="true"
                        ></span>

                        <span class="online-player-name">
                            ${escapeHtml(player.name)}
                        </span>

                        ${
                            player.is_host
                                ? '<span class="online-player-badge">HOST</span>'
                                : ""
                        }

                        <span class="online-player-state">
                            ${connected ? "ONLINE" : "OFFLINE"}
                        </span>

                    </div>

                `;

            }
        ).join("");

}


function updateOnlineLobbyPermissions() {

    const playerCount = onlineGame.players.filter(
        (player) => player.connected !== false
    ).length;

    const roleMode =
        els.onlineRoleMode?.value === "manual"
            ? "manual"
            : "auto";

    if (roleMode === "auto") {
        const automatic = getAutomaticRoleCounts(playerCount);
        els.onlineUndercoverCount.value = String(automatic.undercoverCount);
        els.onlineMrWhiteCount.value = String(automatic.mrWhiteCount);
    }

    els.onlineRoleMode.disabled = !onlineGame.isHost;
    els.onlineUndercoverCount.disabled =
        !onlineGame.isHost || roleMode === "auto";
    els.onlineMrWhiteCount.disabled =
        !onlineGame.isHost || roleMode === "auto";
    els.onlineDifficulty.disabled = !onlineGame.isHost;
    els.onlineCategory.disabled = !onlineGame.isHost;


    if (els.onlineSettingsHint) {

        els.onlineSettingsHint.textContent =
            onlineGame.isHost
                ? "Sei l’host della stanza"
                : "Solo l’host può modificarla";

    }


    if (els.onlineRoleSummary) {
        const undercoverCount = Number(els.onlineUndercoverCount?.value || 0);
        const mrWhiteCount = Number(els.onlineMrWhiteCount?.value || 0);
        const civilianCount = playerCount - undercoverCount - mrWhiteCount;

        els.onlineRoleSummary.innerHTML = `
            <strong>Configurazione ${roleMode === "auto" ? "automatica" : "manuale"}</strong>
            <p>${playerCount} giocatori · ${Math.max(0, civilianCount)} Civili · ${undercoverCount} Undercover · ${mrWhiteCount} Mr. White</p>
        `;
    }

    if (els.startOnlineGameButton) {
        const undercoverCount = Number(els.onlineUndercoverCount?.value || 0);
        const mrWhiteCount = Number(els.onlineMrWhiteCount?.value || 0);
        const maxSpecialRoles = getMaxInitialSpecialCount(playerCount);
        const validBalance = hasValidInitialRoleBalance(
            playerCount,
            undercoverCount,
            mrWhiteCount
        );

        [...(els.onlineUndercoverCount?.options || [])].forEach(
            (option) => {
                option.disabled =
                    Number(option.value) !== 0 &&
                    Number(option.value) + mrWhiteCount > maxSpecialRoles;
            }
        );

        [...(els.onlineMrWhiteCount?.options || [])].forEach(
            (option) => {
                option.disabled =
                    Number(option.value) !== 0 &&
                    Number(option.value) + undercoverCount > maxSpecialRoles;
            }
        );

        els.startOnlineGameButton.disabled =
            !onlineGame.isHost ||
            playerCount < 3 ||
            !validBalance;

        els.startOnlineGameButton.title = !onlineGame.isHost
            ? "Solo l’host può avviare la partita"
            : playerCount < 3
                ? "Servono almeno 3 giocatori connessi"
                : validBalance
                    ? "Avvia la partita"
                    : INITIAL_ROLE_BALANCE_MESSAGE;

        if (playerCount >= 3 && !validBalance) {
            setOnlineMessage(
                els.onlineLobbyMessage,
                INITIAL_ROLE_BALANCE_MESSAGE,
                "error"
            );
        }
        else if (
            els.onlineLobbyMessage?.textContent.trim() ===
            INITIAL_ROLE_BALANCE_MESSAGE
        ) {
            setOnlineMessage(els.onlineLobbyMessage);
        }

    }

}


async function subscribeToOnlineRoom() {

    if (
        !supabaseClient ||
        !onlineGame.roomId
    ) {

        return;

    }


    if (onlineGame.channel) {

        await supabaseClient.removeChannel(
            onlineGame.channel
        );

        onlineGame.channel = null;

    }


    setOnlineConnectionStatus(
        "Connessione…"
    );


    onlineGame.channel =
        supabaseClient
            .channel(
                `undercover-room-${onlineGame.roomId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "undercover_players",
                    filter: `room_id=eq.${onlineGame.roomId}`
                },
                () => {

                    loadOnlinePlayers();

                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "undercover_rooms",
                    filter: `id=eq.${onlineGame.roomId}`
                },
                (payload) => {

                    if (
                        payload.eventType === "DELETE"
                    ) {

                        setOnlineConnectionStatus(
                            "Stanza chiusa",
                            "offline"
                        );

                        setOnlineMessage(
                            els.onlineLobbyMessage,
                            "La stanza è stata chiusa.",
                            "error"
                        );

                    }

                    else if (payload.new) {
                        syncOnlineRoom(payload.new).catch((error) => {
                            console.error("Errore sincronizzazione partita online:", error);
                            setOnlineMessage(els.onlineLobbyMessage, error.message || "Errore di sincronizzazione.", "error");
                        });
                    }

                }
            )
            .subscribe(
                (status) => {

                    if (status === "SUBSCRIBED") {

                        setOnlineConnectionStatus(
                            "Connesso",
                            "online"
                        );

                    }

                    else if (
                        status === "CHANNEL_ERROR" ||
                        status === "TIMED_OUT"
                    ) {

                        setOnlineConnectionStatus(
                            "Problema di connessione",
                            "offline"
                        );

                    }

                    else if (status === "CLOSED") {

                        setOnlineConnectionStatus(
                            "Disconnesso",
                            "offline"
                        );

                    }

                }
            );

}


async function enterOnlineLobby(room, player, clientId = null) {

    onlineGame.roomId = room.id;

    onlineGame.roomCode = room.room_code;

    onlineGame.room = room;

    onlineGame.playerId = player.player_id;

    onlineGame.clientId = clientId || player.client_id || getOnlineClientId();

    onlineGame.isHost =
        player.is_host === true;

    localStorage.setItem("cuginiparty_undercover_online_session", JSON.stringify({
        roomId: room.id,
        roomCode: room.room_code,
        playerId: player.player_id,
        clientId: onlineGame.clientId
    }));


    els.onlineRoomCodeDisplay.textContent =
        room.room_code;

    if (els.onlineRoleMode) {
        els.onlineRoleMode.value =
            room.role_mode === "manual" ? "manual" : "auto";
    }


    if (els.onlineUndercoverCount) {

        els.onlineUndercoverCount.value =
            String(
                room.undercover_count ?? 1
            );

    }


    if (els.onlineMrWhiteCount) {

        els.onlineMrWhiteCount.value =
            String(
                room.mr_white_count ?? 1
            );

    }


    if (els.onlineDifficulty) {

        els.onlineDifficulty.value =
            room.difficulty || "normal";

    }


    if (els.onlineCategory) {

        els.onlineCategory.value =
            room.category || "";

    }


    updateOnlineLobbyPermissions();

    try {
        const { data: categories } = await supabaseClient.from("undercover_categories").select("id,name").order("name");
        if (els.onlineCategory && categories?.length) {
            els.onlineCategory.innerHTML = `<option value="">Casuale</option>` + categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("");
            els.onlineCategory.value = room.category || "";
        }
    } catch (error) {
        console.warn("Categorie Undercover non disponibili:", error);
    }

    showScreen("onlineLobby");

    await loadOnlinePlayers();

    await subscribeToOnlineRoom();

    await syncOnlineRoom(room);

}


async function createOnlineRoom() {

    if (!supabaseClient) {

        setOnlineMessage(
            els.onlineEntryMessage,
            "Supabase non è stato caricato. Controlla lo script CDN nell’HTML.",
            "error"
        );

        return;

    }


    const name =
        els.onlineCreateName.value.trim();


    if (!name) {

        setOnlineMessage(
            els.onlineEntryMessage,
            "Inserisci il tuo nome prima di creare la stanza.",
            "error"
        );

        els.onlineCreateName.focus();

        return;

    }


    setOnlineButtonsBusy(true);

    setOnlineMessage(
        els.onlineEntryMessage,
        "Creazione stanza…"
    );


    try {

        const clientId =
            getOnlineClientId();


        const { room, player } =
            await createUniqueOnlineRoom(name, clientId);


        game.mode = "online";

        await enterOnlineLobby(
            room,
            player,
            clientId
        );

    }

    catch (error) {

        console.error(
            "Errore creazione stanza:",
            error
        );

        setOnlineMessage(
            els.onlineEntryMessage,
            error?.message ||
                "Non sono riuscito a creare la stanza.",
            "error"
        );

    }

    finally {

        setOnlineButtonsBusy(false);

    }

}


async function joinOnlineRoomLegacy() {

    if (!supabaseClient) {

        setOnlineMessage(
            els.onlineEntryMessage,
            "Supabase non è stato caricato. Controlla lo script CDN nell’HTML.",
            "error"
        );

        return;

    }


    const name =
        els.onlineJoinName.value.trim();

    const code =
        normalizeRoomCode(
            els.onlineRoomCodeInput.value
        );


    els.onlineRoomCodeInput.value = code;


    if (!name) {

        setOnlineMessage(
            els.onlineEntryMessage,
            "Inserisci il tuo nome.",
            "error"
        );

        els.onlineJoinName.focus();

        return;

    }


    if (code.length !== 6) {

        setOnlineMessage(
            els.onlineEntryMessage,
            "Inserisci un codice stanza valido di 6 caratteri.",
            "error"
        );

        els.onlineRoomCodeInput.focus();

        return;

    }


    setOnlineButtonsBusy(true);

    setOnlineMessage(
        els.onlineEntryMessage,
        "Ricerca stanza…"
    );


    try {

        const { data: room, error: roomError } =
            await supabaseClient
                .from("undercover_rooms")
                .select("*")
                .eq("room_code", code)
                .maybeSingle();


        if (roomError) {

            throw roomError;

        }


        if (!room) {

            throw new Error(
                "Stanza non trovata. Controlla il codice."
            );

        }


        if (room.status !== "lobby") {

            throw new Error(
                "La partita in questa stanza è già iniziata."
            );

        }


        const { data: currentPlayers, error: playersError } =
            await supabaseClient
                .from("undercover_players")
                .select("id, player_id, nickname, name, client_id, is_host, connected")
                .eq("room_id", room.id);


        if (playersError) {

            throw playersError;

        }


        const clientId =
            getOnlineClientId();


        let player =
            (currentPlayers || []).find(
                (candidate) =>
                    candidate.client_id === clientId
            );


        const duplicateName =
            (currentPlayers || []).find(
                (candidate) =>
                    candidate.player_id !== player?.player_id &&
                    normalizeText(candidate.nickname || candidate.name) ===
                        normalizeText(name)
            );


        if (duplicateName) {

            throw new Error(
                "Questo nome è già usato nella stanza. Scegline un altro."
            );

        }


        if (player) {

            const { data: updatedPlayer, error: updateError } =
                await supabaseClient
                    .from("undercover_players")
                    .update({
                        nickname: name,
                        name,
                        connected: true
                    })
                    .eq("player_id", player.player_id)
                    .select()
                    .single();


            if (updateError) {

                throw updateError;

            }


            player = updatedPlayer;

        }

        else {

            const { data: createdPlayer, error: insertError } =
                await supabaseClient
                    .from("undercover_players")
                    .insert({
                    room_id: room.id,
                    player_id: clientId,
                    nickname: name,
                    name,
                        client_id: clientId,
                        is_host: false,
                        connected: true
                    })
                    .select()
                    .single();


            if (insertError) {

                throw insertError;

            }


            player = createdPlayer;

        }


        game.mode = "online";

        await enterOnlineLobby(
            room,
            player
        );

    }

    catch (error) {

        console.error(
            "Errore ingresso stanza:",
            error
        );

        setOnlineMessage(
            els.onlineEntryMessage,
            error?.message ||
                "Non sono riuscito a entrare nella stanza.",
            "error"
        );

    }

    finally {

        setOnlineButtonsBusy(false);

    }

}


async function joinOnlineRoom() {

    if (!supabaseClient) {
        setOnlineMessage(
            els.onlineEntryMessage,
            "Supabase non disponibile. Controlla lo script CDN.",
            "error"
        );
        return;
    }

    const name = els.onlineJoinName.value.trim();
    const code = normalizeRoomCode(els.onlineRoomCodeInput.value);
    els.onlineRoomCodeInput.value = code;

    if (!name) {
        setOnlineMessage(els.onlineEntryMessage, "Inserisci il tuo nome.", "error");
        els.onlineJoinName.focus();
        return;
    }

    if (code.length !== 6) {
        setOnlineMessage(
            els.onlineEntryMessage,
            "Inserisci un codice stanza valido di 6 caratteri.",
            "error"
        );
        els.onlineRoomCodeInput.focus();
        return;
    }

    setOnlineButtonsBusy(true);
    setOnlineMessage(els.onlineEntryMessage, "Ricerca stanza...");

    try {
        const clientId = getOnlineClientId();
        const { data, error } = await supabaseClient.rpc(
            "undercover_join_room",
            {
                p_room_code: code,
                p_name: name,
                p_client_id: clientId
            }
        );

        if (error) throw error;

        const session = unwrapRpcJson(data);
        if (!session?.room_id || !session?.player_id) {
            throw new Error("La stanza non ha restituito una sessione valida.");
        }

        const loaded = await loadOnlineRoomAndPlayer(
            session.room_id,
            session.player_id
        );

        game.mode = "online";
        await enterOnlineLobby(loaded.room, loaded.player, clientId);
    }
    catch (error) {
        console.error("Errore ingresso stanza:", error);
        setOnlineMessage(
            els.onlineEntryMessage,
            error?.message || "Non sono riuscito a entrare nella stanza.",
            "error"
        );
    }
    finally {
        setOnlineButtonsBusy(false);
    }

}


async function leaveOnlineRoomLegacy() {

    if (
        supabaseClient &&
        onlineGame.playerId
    ) {

        try {

            const { data: remaining } = await supabaseClient.from("undercover_players").select("player_id,client_id").eq("room_id", onlineGame.roomId).neq("player_id", onlineGame.playerId).order("joined_at", { ascending: true });
            if (onlineGame.isHost && remaining?.length) {
                const nextHost = remaining[0];
                await supabaseClient.from("undercover_players").update({ is_host: false }).eq("room_id", onlineGame.roomId);
                await supabaseClient.from("undercover_players").update({ is_host: true }).eq("player_id", nextHost.player_id);
                await supabaseClient.from("undercover_rooms").update({ host_player_id: nextHost.player_id }).eq("id", onlineGame.roomId);
            }
            await supabaseClient.from("undercover_players").delete().eq("player_id", onlineGame.playerId);
            if (onlineGame.isHost && !remaining?.length) await supabaseClient.from("undercover_rooms").delete().eq("id", onlineGame.roomId);

        }

        catch (error) {

            console.error(
                "Errore uscita stanza:",
                error
            );

        }

    }


    resetOnlineState();

    localStorage.removeItem("cuginiparty_undercover_online_session");

    resetGame();

    showScreen("mode");

}


async function leaveOnlineRoom() {

    if (onlineGame.leaving) return;
    onlineGame.leaving = true;

    try {
        if (
            supabaseClient &&
            onlineGame.roomId &&
            onlineGame.playerId &&
            onlineGame.clientId
        ) {
            const { error } = await supabaseClient.rpc(
                "undercover_leave_room",
                {
                    p_room_id: onlineGame.roomId,
                    p_player_id: onlineGame.playerId,
                    p_client_id: onlineGame.clientId
                }
            );

            if (error) throw error;
        }
    }
    catch (error) {
        console.error("Errore uscita stanza:", error);
    }

    resetOnlineState();
    localStorage.removeItem("cuginiparty_undercover_online_session");
    resetGame();
    showScreen("mode");

}


/* =========================================================
   ONLINE GAMEPLAY
   The room row contains only public state. Secret cards are
   read through the SQL function documented in undercover_online.sql.
========================================================= */

function getOnlinePublicState(room) {
    const allowedPhases = new Set([
        "lobby",
        "revealing",
        "round",
        "voting",
        "result",
        "white_guess",
        "victory",
        "closed"
    ]);
    const value = room?.game_state;
    const state = value && typeof value === "object"
        ? { ...value }
        : typeof value === "string"
            ? (() => { try { return JSON.parse(value); } catch { return {}; } })()
            : {};
    // Una chiusura dell'amministratore ha priorità anche sui record creati
    // dalla versione precedente, che potevano avere status="victory".
    const adminClosed = state.adminClosed === true || room?.status === "closed";
    const roomPhase = adminClosed
        ? "closed"
        : allowedPhases.has(room?.status)
            ? room.status
            : "lobby";
    if (Object.keys(state).length) return { ...state, phase: roomPhase };
    return { phase: roomPhase, round: 1, aliveIds: [], readyIds: [] };
}

function onlineStateIds(state, key) {
    return Array.isArray(state?.[key]) ? state[key].map(String) : [];
}

function onlinePlayerById(id) {
    return onlineGame.players.find((player) => String(player.id) === String(id));
}

function onlineAlivePlayers() {
    const ids = new Set(onlineStateIds(onlineGame.publicState, "aliveIds"));
    return onlineGame.players.filter((player) => ids.has(String(player.id)));
}

function onlineIsHost() {
    return onlineGame.isHost === true;
}

function setOnlineWaiting(title, description, message = "") {
    els.onlineWaitingTitle.textContent = title;
    els.onlineWaitingDescription.textContent = description;
    setOnlineMessage(els.onlineWaitingMessage, message);
    showScreen("onlineWaiting");
}

function showOnlineClosed() {
    const reason = onlineGame.publicState?.adminCloseReason;
    const fallback = reason === "match"
        ? "L’amministratore ha chiuso la partita e la stanza."
        : "L’amministratore ha chiuso la stanza.";
    const message = onlineGame.publicState?.adminCloseMessage || fallback;
    setOnlineConnectionStatus("Stanza chiusa", "offline");
    if (els.onlineWaitingBadge) els.onlineWaitingBadge.textContent = "Chiusura amministratore";
    setOnlineWaiting("Stanza chiusa", message);
}

async function loadOnlineCard() {
    if (!supabaseClient || !onlineGame.roomId || !onlineGame.playerId) return null;
    const { data, error } = await supabaseClient.rpc("undercover_get_my_card", {
        p_room_id: onlineGame.roomId,
        p_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId
    });
    if (error) throw error;
    onlineGame.myCard = Array.isArray(data) ? data[0] || null : data;
    return onlineGame.myCard;
}

async function loadOnlineOwnVote() {
    if (!supabaseClient || !onlineGame.roomId || !onlineGame.playerId) return null;
    const { data, error } = await supabaseClient.rpc("undercover_get_my_vote", {
        p_room_id: onlineGame.roomId,
        p_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId
    });
    if (error) throw error;
    const value = unwrapRpcJson(data);
    onlineGame.selectedVote = value?.target_player_id || value || null;
    onlineGame.voteSkipped = value?.skipped === true;
    return onlineGame.selectedVote;
}

function renderOnlineCard(card) {
    if (!card) return;
    const role = card.role;
    els.privateRole.textContent = role === "civilian" ? "CIVILE" : role === "undercover" ? "UNDERCOVER" : "MR. WHITE";
    els.privateIcon.textContent = role === "civilian" ? "👤" : role === "undercover" ? "🕵️" : "🤍";
    els.privateWord.textContent = card.word || "???";
    els.privateDescription.textContent = role === "civilian" ? "La stessa parola è stata data agli altri Civili." : role === "undercover" ? "La tua parola è simile a quella dei Civili." : "Non hai ricevuto nessuna parola. Cerca di capire di cosa stanno parlando.";
    showScreen("card");
}

async function markOnlineReady() {
    if (!onlineGame.roomId || !onlineGame.playerId) return;
    const { error } = await supabaseClient.rpc("undercover_mark_ready", {
        p_room_id: onlineGame.roomId,
        p_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId
    });
    if (error) throw error;
    onlineGame.ready = true;
    setOnlineWaiting("Carta confermata", "Attendi che tutti i giocatori confermino la propria carta.");
}

function renderOnlineRound() {
    const state = onlineGame.publicState || {};
    game.round = Number(state.round || 1);
    els.roundStartBadge.textContent = `🔥 ROUND ${game.round}`;
    els.roundPlayerList.innerHTML = onlineAlivePlayers().map((player) => `
        <div class="round-player-item"><strong>${escapeHtml(player.name)}</strong><span>● VIVO</span></div>
    `).join("");
    els.startRoundButton.textContent = onlineIsHost() ? "Inizia la votazione" : "Attendi l’host";
    els.startRoundButton.disabled = !onlineIsHost();
    showScreen("roundStart");
}

function renderOnlineVoting() {
    const state = onlineGame.publicState || {};
    const alive = onlineAlivePlayers();
    const selected = onlineGame.selectedVote;
    const candidateIds = onlineStateIds(state, "candidateIds");
    const candidateSet = candidateIds.length ? new Set(candidateIds) : null;
    const selectedPlayer = selected ? onlinePlayerById(selected) : null;
    els.votingRoundNumber.textContent = state.round || 1;
    els.votingTitle.textContent = "Votazione online";
    els.onlinePersonalVoteActions.classList.remove("hidden");
    els.cancelOnlineVoteButton.disabled = onlineGame.voteSaving || (!onlineGame.selectedVote && !onlineGame.voteSkipped);
    els.skipOnlineVoteButton.disabled = onlineGame.voteSaving;
    els.votingDescription.textContent = "Scegli una persona viva. Puoi cambiare il voto finché la votazione resta aperta.";
    els.votingList.innerHTML = alive.filter((player) =>
        String(player.id) !== String(onlineGame.playerId) &&
        (!candidateSet || candidateSet.has(String(player.id)))
    ).map((player) => `
        <button type="button" class="online-vote-option ${String(selected) === String(player.id) ? "is-selected" : ""}" data-online-vote-id="${player.id}" ${onlineGame.voteSaving ? "disabled" : ""}>
            ${String(selected) === String(player.id) ? "✓ " : ""}${escapeHtml(player.name)}
        </button>
    `).join("");
    const count = Number(state.votesSubmitted || 0);
    els.voteTotal.textContent = `${count} / ${alive.length}`;
    els.startVotingButton.classList.add("hidden");
    els.finishVotingButton.classList.toggle("hidden", !onlineIsHost());
    els.finishVotingButton.disabled = !onlineIsHost() || count < 1;
    els.finishVotingButton.textContent = count < alive.length
        ? `Concludi ora (${count}/${alive.length})`
        : "Concludi votazione";

    setOnlineMessage(
        els.onlineVoteFeedback,
        onlineGame.voteSaving
            ? "Registrazione del voto…"
        : onlineGame.voteSkipped
            ? "✓ Hai saltato il voto"
            : selectedPlayer
                ? `✓ Hai votato ${selectedPlayer.name}`
                : "Scegli chi votare, annulla il voto oppure salta il voto.",
        (selectedPlayer || onlineGame.voteSkipped) && !onlineGame.voteSaving ? "success" : ""
    );

    showScreen("voting");
}

function renderOnlineResult() {
    const state = onlineGame.publicState || {};
    const tiedIds = onlineStateIds(state, "tiedIds");
    const eliminated = onlinePlayerById(state.eliminatedId);
    game.voteTied = state.phase === "result" && tiedIds.length > 1;
    game.tiedPlayerIds = tiedIds;
    game.eliminatedPlayer = eliminated ? { ...eliminated, role: state.eliminatedRole } : null;
    if (state.skippedVote) {
        els.voteResultBadge.textContent = "⏭️ VOTO SALTATO";
        els.voteResultIcon.textContent = "⏭️";
        els.voteResultTitle.textContent = "Nessun voto registrato";
        els.eliminatedCard.classList.add("is-tie");
        els.eliminatedLabel.textContent = "VOTAZIONE SALTATA";
        els.eliminatedPlayerName.textContent = "Nessun giocatore eliminato";
        els.revealedRole.classList.add("hidden");
        els.continueAfterVoteButton.textContent = onlineIsHost() ? "CONTINUA →" : "Attendi l’host";
        els.continueAfterVoteButton.disabled = !onlineIsHost();
    } else if (game.voteTied) {
        els.voteResultBadge.textContent = "⚖️ VOTAZIONE IN PARITÀ";
        els.voteResultIcon.textContent = "⚖️";
        els.voteResultTitle.textContent = "Nessun eliminato";
        els.eliminatedCard.classList.add("is-tie");
        els.eliminatedLabel.textContent = "PARI MERITO";
        els.eliminatedPlayerName.textContent = tiedIds.map((id) => onlinePlayerById(id)?.name).filter(Boolean).join(" • ");
        els.revealedRole.classList.add("hidden");
        els.continueAfterVoteButton.textContent = onlineIsHost() ? "RIPETI VOTAZIONE →" : "Attendi l’host";
        els.continueAfterVoteButton.disabled = !onlineIsHost();
    } else if (eliminated) {
        els.voteResultBadge.textContent = "✅ VOTAZIONE CONCLUSA";
        els.voteResultIcon.textContent = "🎯";
        els.voteResultTitle.textContent = "Risultato della votazione";
        els.eliminatedCard.classList.remove("is-tie");
        els.eliminatedLabel.textContent = "È STATO ELIMINATO";
        els.eliminatedPlayerName.textContent = eliminated.name;
        els.revealedRole.classList.remove("hidden");
        els.revealedRole.textContent = state.eliminatedRole === "civilian" ? "👤 CIVILE" : state.eliminatedRole === "undercover" ? "🕵️ UNDERCOVER" : "🤍 MR. WHITE";
        els.continueAfterVoteButton.textContent = onlineIsHost() ? "CONTINUA →" : "Attendi l’host";
        els.continueAfterVoteButton.disabled = !onlineIsHost();
    }
    const totals = state.voteTotals || {};
    els.resultVoteSummary.innerHTML = onlineGame.players.map((player) => `
        <div class="result-vote-row"><span>${escapeHtml(player.name)}</span><strong>${Number(totals[player.id] || 0)}</strong></div>
    `).join("");
    showScreen("voteResult");
}

async function updateOnlineRoom(patch) {
    void patch;
    throw new Error("Gli aggiornamenti di partita devono passare dalle RPC autorevoli.");
}

async function syncOnlineRoom(room = null) {
    if (!supabaseClient || !onlineGame.roomId) return;
    if (!room) {
        const result = await supabaseClient.from("undercover_rooms").select("*").eq("id", onlineGame.roomId).maybeSingle();
        if (result.error) throw result.error;
        room = result.data;
    }
    if (!room) {
        setOnlineWaiting("Stanza non disponibile", "La stanza è stata chiusa o non è più raggiungibile.", "error");
        return;
    }
    onlineGame.room = room;
    onlineGame.publicState = getOnlinePublicState(room);
    if (room.status === "lobby") {
        els.onlineRoleMode.value = room.role_mode === "manual" ? "manual" : "auto";
        els.onlineUndercoverCount.value = String(room.undercover_count ?? 1);
        els.onlineMrWhiteCount.value = String(room.mr_white_count ?? 1);
        els.onlineDifficulty.value = room.difficulty || "normal";
        els.onlineCategory.value = room.category || "";
        await loadOnlinePlayers();
        updateOnlineLobbyPermissions();
        showScreen("onlineLobby");
        return;
    }

    if (onlineGame.publicState.phase === "closed") {
        showOnlineClosed();
        return;
    }

    if (!onlineGame.myCard && !["victory", "closed"].includes(onlineGame.publicState.phase)) {
        try {
            await loadOnlineCard();
        }
        catch (error) {
            setOnlineWaiting(
                "Carta privata non disponibile",
                "Completa la configurazione SQL indicata nel riepilogo.",
                error.message
            );
            return;
        }
    }

    if (onlineGame.publicState.phase === "revealing") {
        const readyIds = onlineStateIds(onlineGame.publicState, "readyIds");
        if (!readyIds.includes(String(onlineGame.playerId))) {
            renderOnlineCard(onlineGame.myCard);
        } else {
            setOnlineWaiting("Attendi gli altri", "La carta è stata confermata su questo dispositivo.");
        }
        return;
    }
    if (onlineGame.publicState.phase === "round") { renderOnlineRound(); return; }
    if (onlineGame.publicState.phase === "voting") {
        const voteKey = `${onlineGame.publicState.round || 1}:${onlineGame.publicState.voteRound || 0}`;
        if (onlineGame.voteKey !== voteKey) {
            onlineGame.voteKey = voteKey;
            onlineGame.selectedVote = null;
            onlineGame.voteSkipped = false;
            try { await loadOnlineOwnVote(); } catch (error) { console.warn("Voto personale non disponibile:", error); }
        }
        renderOnlineVoting();
        return;
    }
    if (onlineGame.publicState.phase === "result") { renderOnlineResult(); return; }
    if (onlineGame.publicState.phase === "white_guess") { renderOnlineWhiteGuess(); return; }
    if (onlineGame.publicState.phase === "victory") { showOnlineVictory(); }
}

async function startOnlineGame() {
    if (!onlineIsHost()) return;

    const players = onlineGame.players.filter((player) => player.connected !== false);
    const roleMode = els.onlineRoleMode.value === "manual" ? "manual" : "auto";
    const automatic = getAutomaticRoleCounts(players.length);
    const undercoverCount = roleMode === "auto"
        ? automatic.undercoverCount
        : Number(els.onlineUndercoverCount.value);
    const mrWhiteCount = roleMode === "auto"
        ? automatic.mrWhiteCount
        : Number(els.onlineMrWhiteCount.value);

    if (
        players.length < 3 ||
        !hasValidInitialRoleBalance(
            players.length,
            undercoverCount,
            mrWhiteCount
        )
    ) {
        setOnlineMessage(
            els.onlineLobbyMessage,
            players.length < 3
                ? "Servono almeno 3 giocatori connessi."
                : INITIAL_ROLE_BALANCE_MESSAGE,
            "error"
        );
        return;
    }

    els.startOnlineGameButton.disabled = true;

    try {
        const { error } = await supabaseClient.rpc("undercover_start_game", {
            p_room_id: onlineGame.roomId,
            p_host_player_id: onlineGame.playerId,
            p_client_id: onlineGame.clientId,
            p_undercover_count: undercoverCount,
            p_mr_white_count: mrWhiteCount,
            p_difficulty: els.onlineDifficulty.value,
            p_category: els.onlineCategory.value || null
        });
        if (error) throw error;
    }
    finally {
        updateOnlineLobbyPermissions();
    }
}


async function startOnlineVoting() {
    if (!onlineIsHost()) return;
    const { error } = await supabaseClient.rpc("undercover_open_voting", { p_room_id: onlineGame.roomId, p_host_player_id: onlineGame.playerId, p_client_id: onlineGame.clientId });
    if (error) throw error;
}

async function castOnlineVote(targetId) {
    const state = onlineGame.publicState || {};
    const aliveIds = new Set(onlineStateIds(state, "aliveIds"));
    const candidateIds = onlineStateIds(state, "candidateIds");
    const candidateSet = candidateIds.length ? new Set(candidateIds) : null;
    const voterId = String(onlineGame.playerId);
    const normalizedTargetId = String(targetId);

    if (
        onlineGame.voteSaving ||
        state.phase !== "voting" ||
        normalizedTargetId === voterId ||
        !aliveIds.has(voterId) ||
        !aliveIds.has(normalizedTargetId) ||
        (candidateSet && !candidateSet.has(normalizedTargetId))
    ) {
        setOnlineMessage(
            els.onlineVoteFeedback,
            "Questo voto non è valido.",
            "error"
        );
        return;
    }

    const previousVote = onlineGame.selectedVote;
    const previousSkipped = onlineGame.voteSkipped;
    onlineGame.selectedVote = normalizedTargetId;
    onlineGame.voteSkipped = false;
    onlineGame.voteSaving = true;
    renderOnlineVoting();

    const { data, error } = await supabaseClient.rpc("undercover_cast_vote", {
        p_room_id: onlineGame.roomId,
        p_voter_player_id: onlineGame.playerId,
        p_target_player_id: normalizedTargetId,
        p_client_id: onlineGame.clientId
    });

    if (error) {
        onlineGame.selectedVote = previousVote;
        onlineGame.voteSkipped = previousSkipped;
        onlineGame.voteSaving = false;
        renderOnlineVoting();
        throw error;
    }

    onlineGame.voteSaving = false;
    const nextState = unwrapRpcJson(data);

    if (nextState?.phase) {
        await syncOnlineRoom({
            ...onlineGame.room,
            status: nextState.phase,
            game_state: nextState
        });
    }
    else {
        await syncOnlineRoom();
    }
}

async function clearOnlineVote() {
    if (onlineGame.voteSaving || (!onlineGame.selectedVote && !onlineGame.voteSkipped)) return;
    onlineGame.voteSaving = true;
    renderOnlineVoting();
    const { error } = await supabaseClient.rpc("undercover_clear_vote", {
        p_room_id: onlineGame.roomId,
        p_voter_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId
    });
    onlineGame.voteSaving = false;
    if (error) throw error;
    onlineGame.selectedVote = null;
    onlineGame.voteSkipped = false;
    await syncOnlineRoom();
}

async function skipOnlineVote() {
    if (onlineGame.voteSaving) return;
    const previousVote = onlineGame.selectedVote;
    const previousSkipped = onlineGame.voteSkipped;
    onlineGame.voteSaving = true;
    onlineGame.selectedVote = null;
    onlineGame.voteSkipped = true;
    renderOnlineVoting();
    const { data, error } = await supabaseClient.rpc("undercover_cast_vote", {
        p_room_id: onlineGame.roomId,
        p_voter_player_id: onlineGame.playerId,
        p_target_player_id: null,
        p_client_id: onlineGame.clientId
    });
    onlineGame.voteSaving = false;
    if (error) {
        onlineGame.selectedVote = previousVote;
        onlineGame.voteSkipped = previousSkipped;
        throw error;
    }
    const nextState = unwrapRpcJson(data);
    if (nextState?.phase) await syncOnlineRoom({ ...onlineGame.room, status: nextState.phase, game_state: nextState });
    else await syncOnlineRoom();
}

async function finishOnlineVoting() {
    if (!onlineIsHost()) return;
    const { error } = await supabaseClient.rpc("undercover_finish_vote", { p_room_id: onlineGame.roomId, p_host_player_id: onlineGame.playerId, p_client_id: onlineGame.clientId, p_force: true });
    if (error) throw error;
}

async function advanceOnlineRound() {
    if (!onlineIsHost()) return;
    const state = onlineGame.publicState || {};
    const { data, error } = await supabaseClient.rpc("undercover_advance_round", {
        p_room_id: onlineGame.roomId,
        p_host_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId
    });
    if (error) throw error;
    if (data) await syncOnlineRoom({ ...onlineGame.room, game_state: data });
    else await syncOnlineRoom();
}

async function continueOnlineResult() {
    if (!onlineIsHost()) return;
    const { data, error } = await supabaseClient.rpc(
        "undercover_continue_after_result",
        {
            p_room_id: onlineGame.roomId,
            p_host_player_id: onlineGame.playerId,
            p_client_id: onlineGame.clientId
        }
    );
    if (error) throw error;
    if (data) await syncOnlineRoom({ ...onlineGame.room, game_state: data });
    else await syncOnlineRoom();
}


async function submitOnlineWhiteGuess() {
    const guess = normalizeText(els.whiteGuessInput.value);
    if (!guess) return;
    const { data, error } = await supabaseClient.rpc("undercover_submit_white_guess", {
        p_room_id: onlineGame.roomId,
        p_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId,
        p_guess: guess
    });
    if (error) throw error;
    if (data) await syncOnlineRoom({ ...onlineGame.room, game_state: data });
    else await syncOnlineRoom();
}

function renderOnlineWhiteGuess() {
    const state = onlineGame.publicState || {};
    const isWhite = onlineGame.myCard?.role === "mrwhite" && String(state.whitePlayerId) === String(onlineGame.playerId);
    els.whiteGuessTitle.textContent = isWhite ? "Ultima possibilità" : "Mr. White sta pensando";
    els.whiteGuessLabel.classList.toggle("hidden", !isWhite);
    els.whiteGuessInput.classList.toggle("hidden", !isWhite);
    els.whiteGuessButton.classList.toggle("hidden", !isWhite);
    els.whiteGuessInput.disabled = !isWhite;
    els.whiteGuessButton.disabled = !isWhite;
    els.whiteGuessContinueButton.classList.add("hidden");
    setOnlineMessage(els.whiteGuessResult, isWhite ? "Indovina la parola dei Civili." : "Attendi il tentativo di Mr. White.");
    showScreen("whiteGuess");
}

function showOnlineVictory() {
    const winner = onlineGame.publicState?.winner || "special";
    game.wordPair = {
        civilian: onlineGame.publicState?.civilianWord || "la parola segreta",
        undercover: onlineGame.publicState?.undercoverWord || "-"
    };
    showVictory(winner === "civilians" ? "civilians" : winner === "white" ? "white_guess" : "special");
    els.victoryMenuButton.textContent = "Esci dalla stanza";
    els.restartGameButton.textContent = onlineIsHost() ? "Nuova partita →" : "Attendi l’host";
    els.restartGameButton.disabled = !onlineIsHost();
}

async function restoreOnlineSessionLegacy() {
    if (!supabaseClient) return;
    let session;
    try { session = JSON.parse(localStorage.getItem("cuginiparty_undercover_online_session") || "null"); } catch { session = null; }
    if (!session?.roomId || !session?.clientId) return;
    const roomResult = await supabaseClient.from("undercover_rooms").select("*").eq("id", session.roomId).maybeSingle();
    if (roomResult.error || !roomResult.data) { localStorage.removeItem("cuginiparty_undercover_online_session"); return; }
    const playerResult = await supabaseClient.from("undercover_players").select("*").eq("room_id", session.roomId).eq("client_id", session.clientId).maybeSingle();
    if (playerResult.error || !playerResult.data) { localStorage.removeItem("cuginiparty_undercover_online_session"); return; }
    await supabaseClient.from("undercover_players").update({ connected: true }).eq("player_id", playerResult.data.player_id);
    game.mode = "online";
    await enterOnlineLobby(roomResult.data, playerResult.data);
}


async function setOnlinePresence(connected) {
    if (!supabaseClient || !onlineGame.roomId || !onlineGame.playerId) return;
    const { error } = await supabaseClient.rpc("undercover_set_presence", {
        p_room_id: onlineGame.roomId,
        p_player_id: onlineGame.playerId,
        p_client_id: onlineGame.clientId,
        p_connected: connected
    });
    if (error) throw error;
}


async function restoreOnlineSession() {
    if (!supabaseClient) return;

    let session;
    try {
        session = JSON.parse(
            localStorage.getItem("cuginiparty_undercover_online_session") || "null"
        );
    }
    catch {
        session = null;
    }

    if (!session?.roomId || !session?.playerId || !session?.clientId) return;

    const { data, error } = await supabaseClient.rpc("undercover_resume_session", {
        p_room_id: session.roomId,
        p_player_id: session.playerId,
        p_client_id: session.clientId
    });

    if (error || !data) {
        localStorage.removeItem("cuginiparty_undercover_online_session");
        return;
    }

    const loaded = await loadOnlineRoomAndPlayer(session.roomId, session.playerId);
    game.mode = "online";
    await enterOnlineLobby(loaded.room, loaded.player, session.clientId);
}


/* =========================================================
   MODE
========================================================= */

els.localModeButton.addEventListener(
    "click",
    () => {

        resetOnlineState();

        resetGame();

        game.mode = "local";

        showScreen("setup");

    }
);


els.onlineModeButton.addEventListener(
    "click",
    () => {

        resetOnlineState();

        resetGame();

        game.mode = "online";

        setOnlineMessage(
            els.onlineEntryMessage
        );

        showScreen("onlineEntry");

    }
);


els.onlineEntryBackButton.addEventListener(
    "click",
    () => {

        resetOnlineState();

        resetGame();

        showScreen("mode");

    }
);


els.createOnlineRoomButton.addEventListener(
    "click",
    createOnlineRoom
);


els.joinOnlineRoomButton.addEventListener(
    "click",
    joinOnlineRoom
);


els.onlineRoomCodeInput.addEventListener(
    "input",
    () => {

        els.onlineRoomCodeInput.value =
            normalizeRoomCode(
                els.onlineRoomCodeInput.value
            );

    }
);


els.onlineRoomCodeInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            joinOnlineRoom();

        }

    }
);


els.onlineJoinName.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            joinOnlineRoom();

        }

    }
);


els.onlineCreateName.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            createOnlineRoom();

        }

    }
);


els.copyOnlineRoomCodeButton.addEventListener(
    "click",
    async () => {

        if (!onlineGame.roomCode) return;


        try {

            await navigator.clipboard.writeText(
                onlineGame.roomCode
            );

            setOnlineMessage(
                els.onlineLobbyMessage,
                "Codice copiato negli appunti.",
                "success"
            );

        }

        catch {

            setOnlineMessage(
                els.onlineLobbyMessage,
                    `Codice stanza: ${onlineGame.roomCode}`,
                "success"
            );

        }

    }
);


els.leaveOnlineRoomButton.addEventListener(
    "click",
    leaveOnlineRoom
);

els.leaveOnlineGameButton.addEventListener(
    "click",
    leaveOnlineRoom
);


els.startOnlineGameButton.addEventListener(
    "click",
    () => startOnlineGame().catch((error) => setOnlineMessage(els.onlineLobbyMessage, error.message || "Impossibile avviare la partita.", "error"))
);

[els.onlineRoleMode, els.onlineUndercoverCount, els.onlineMrWhiteCount, els.onlineDifficulty, els.onlineCategory].forEach((control) => {
    control?.addEventListener("change", async () => {
        if (!onlineIsHost() || !onlineGame.roomId) return;

        const roleMode =
            els.onlineRoleMode.value === "manual"
                ? "manual"
                : "auto";

        if (roleMode === "auto") {
            const automatic = getAutomaticRoleCounts(
                onlineGame.players.filter(
                    (player) => player.connected !== false
                ).length
            );
            els.onlineUndercoverCount.value = String(automatic.undercoverCount);
            els.onlineMrWhiteCount.value = String(automatic.mrWhiteCount);
        }

        try {
            const { error } = await supabaseClient.rpc("undercover_update_settings", {
                p_room_id: onlineGame.roomId,
                p_host_player_id: onlineGame.playerId,
                p_client_id: onlineGame.clientId,
                p_role_mode: roleMode,
                p_undercover_count: Number(els.onlineUndercoverCount.value),
                p_mr_white_count: Number(els.onlineMrWhiteCount.value),
                p_difficulty: els.onlineDifficulty.value,
                p_category: els.onlineCategory.value || null
            });
            if (error) throw error;
            await syncOnlineRoom();
        } catch (error) {
            setOnlineMessage(els.onlineLobbyMessage, error.message || "Impossibile salvare la configurazione.", "error");
        }
    });
});


els.backToGamesButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../index.html";

    }
);


/* =========================================================
   SETUP
========================================================= */

els.playerCount.addEventListener(
    "change",
    () => syncRoleLimits("playerCount")
);


els.undercoverCount.addEventListener(
    "change",
    () => syncRoleLimits("undercover")
);


els.mrWhiteCount.addEventListener(
    "change",
    () => syncRoleLimits("mrWhite")
);


els.setupBackButton.addEventListener(
    "click",
    () => {

        showScreen("mode");

    }
);


els.setupNextButton.addEventListener(
    "click",
    () => {

        syncRoleLimits("playerCount");

        const playerCount =
            Number(
                els.playerCount.value
            );

        const undercoverCount =
            Number(
                els.undercoverCount.value
            );

        const mrWhiteCount =
            Number(
                els.mrWhiteCount.value
            );


        if (
            !Number.isInteger(playerCount) ||
            !Number.isInteger(undercoverCount) ||
            !Number.isInteger(mrWhiteCount) ||
            playerCount < 3 ||
            playerCount > 20 ||
            undercoverCount < 0 ||
            mrWhiteCount < 1 ||
            mrWhiteCount > 2
        ) {

            alert(
                "La configurazione scelta non è valida."
            );

            return;

        }


        if (!hasValidInitialRoleBalance(
            playerCount,
            undercoverCount,
            mrWhiteCount
        )) {

            alert(
                INITIAL_ROLE_BALANCE_MESSAGE
            );

            return;

        }


        game.playerCount =
            playerCount;

        game.undercoverCount =
            undercoverCount;

        game.mrWhiteCount =
            mrWhiteCount;

        game.difficulty =
            els.difficulty.value;


        generatePlayerInputs();

        showScreen("players");

    }
);


/* =========================================================
   PLAYERS
========================================================= */

function generatePlayerInputs() {

    els.playerNameList.innerHTML = "";


    for (
        let i = 0;
        i < game.playerCount;
        i++
    ) {

        const row =
            document.createElement("div");

        row.className =
            "player-name-row";


        row.innerHTML = `

            <div class="player-name-number">
                ${i + 1}
            </div>

            <input
                type="text"
                class="player-name-input"
                data-player-index="${i}"
                maxlength="18"
                autocomplete="off"
                placeholder="Nome giocatore ${i + 1}"
            >

        `;


        els.playerNameList.appendChild(row);

    }

}


els.playersBackButton.addEventListener(
    "click",
    () => {

        showScreen("setup");

    }
);


/* =========================================================
   START GAME
========================================================= */

els.startGameButton.addEventListener(
    "click",
    () => {

        const inputs =
            [
                ...document.querySelectorAll(
                    ".player-name-input"
                )
            ];


        const names =
            inputs.map(
                (input) =>
                    input.value.trim()
            );


        if (
            names.some(
                (name) => !name
            )
        ) {

            alert(
                "Inserisci tutti i nomi dei giocatori."
            );

            return;

        }


        const normalizedNames =
            names.map(normalizeText);


        if (
            new Set(
                normalizedNames
            ).size !== names.length
        ) {

            alert(
                "I nomi dei giocatori devono essere tutti diversi."
            );

            return;

        }


        createPlayers(names);

        chooseWordPair();

        prepareReveal();

    }
);


/* =========================================================
   CREATE PLAYERS
========================================================= */

function createPlayers(names) {

    const indexes =
        shuffle(
            names.map(
                (_, index) => index
            )
        );


    const undercoverIndexes =
        indexes.slice(
            0,
            game.undercoverCount
        );


    const whiteStart =
        game.undercoverCount;


    const whiteEnd =
        whiteStart +
        game.mrWhiteCount;


    const whiteIndexes =
        indexes.slice(
            whiteStart,
            whiteEnd
        );


    game.players =
        names.map(
            (name, index) => {

                let role =
                    "civilian";


                if (
                    undercoverIndexes.includes(
                        index
                    )
                ) {

                    role =
                        "undercover";

                }


                if (
                    whiteIndexes.includes(
                        index
                    )
                ) {

                    role =
                        "mrwhite";

                }


                return {

                    id:
                        createPlayerId(),

                    name,

                    role,

                    alive: true

                };

            }
        );

}


/* =========================================================
   WORD
========================================================= */

function chooseWordPair() {

    const pairDifficulty =
        game.difficulty === "hard"
            ? "normal"
            : game.difficulty;


    const filtered =
        LOCAL_WORD_PAIRS.filter(
            (pair) => {

                return (
                    pair.difficulty ===
                    pairDifficulty
                );

            }
        );


    const pool =
        filtered.length
            ? filtered
            : LOCAL_WORD_PAIRS;


    game.wordPair =
        pool[
            Math.floor(
                Math.random() *
                pool.length
            )
        ];

}


/* =========================================================
   REVEAL
========================================================= */

function prepareReveal() {

    game.revealIndex = 0;

    updateRevealScreen();

    showScreen("reveal");

}


function updateRevealScreen() {

    const player =
        game.players[
            game.revealIndex
        ];


    if (!player) {

        startFirstRound();

        return;

    }


    els.revealBadge.textContent =
        `🃏 CARTA ${game.revealIndex + 1} / ${game.players.length}`;


    els.revealPlayerName.textContent =
        player.name;

}


els.showCardButton.addEventListener(
    "click",
    () => {

        const player =
            game.players[
                game.revealIndex
            ];


        if (!player) return;


        renderPrivateCard(player);

        showScreen("card");

    }
);


/* =========================================================
   PRIVATE CARD
========================================================= */

function renderPrivateCard(player) {

    if (
        player.role ===
        "civilian"
    ) {

        els.privateRole.textContent =
            "CIVILE";

        els.privateIcon.textContent =
            "👤";

        els.privateWord.textContent =
            game.wordPair.civilian;

        els.privateDescription.textContent =
            "La stessa parola è stata data agli altri Civili.";

        return;

    }


    if (
        player.role ===
        "undercover"
    ) {

        els.privateRole.textContent =
            "UNDERCOVER";

        els.privateIcon.textContent =
            "🕵️";

        els.privateWord.textContent =
            game.wordPair.undercover;

        els.privateDescription.textContent =
            "La tua parola è simile a quella dei Civili.";

        return;

    }


    els.privateRole.textContent =
        "MR. WHITE";

    els.privateIcon.textContent =
        "🤍";

    els.privateWord.textContent =
        "???";

    els.privateDescription.textContent =
        "Non hai ricevuto nessuna parola. Cerca di capire di cosa stanno parlando.";

}


els.hideCardButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            markOnlineReady().catch((error) => setOnlineMessage(els.onlineWaitingMessage, error.message || "Impossibile confermare la carta.", "error"));
            return;
        }

        game.revealIndex++;


        if (
            game.revealIndex >=
            game.players.length
        ) {

            startFirstRound();

            return;

        }


        updateRevealScreen();

        showScreen("reveal");

    }
);


/* =========================================================
   ROUND START
========================================================= */

function startFirstRound() {

    game.round = 1;

    game.votingStarted = false;

    game.votes = {};

    game.eliminatedPlayer = null;

    game.voteTied = false;

    game.tiedPlayerIds = [];

    renderRoundStart();

    showScreen("roundStart");

}


function startNextRound() {

    game.round++;

    game.votingStarted = false;

    game.votes = {};

    game.eliminatedPlayer = null;

    game.voteTied = false;

    game.tiedPlayerIds = [];

    renderRoundStart();

    showScreen("roundStart");

}


function renderRoundStart() {

    els.roundStartBadge.textContent =
        `🔥 ROUND ${game.round}`;


    const alivePlayers =
        getAlivePlayers();


    els.roundPlayerList.innerHTML =
        alivePlayers.map(
            (player) => {

                return `

                    <div
                        class="round-player-item"
                    >

                        <strong>
                            ${escapeHtml(
                                player.name
                            )}
                        </strong>

                        <span>
                            ● VIVO
                        </span>

                    </div>

                `;

            }
        ).join("");

}


els.startRoundButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            startOnlineVoting().catch((error) => setOnlineMessage(els.onlineWaitingMessage, error.message || "Impossibile iniziare la votazione.", "error"));
            return;
        }

        beginVotingPhase();

    }
);


/* =========================================================
   VOTING START
========================================================= */

function beginVotingPhase(isRevote = false) {

    els.onlinePersonalVoteActions.classList.add("hidden");

    const revoteCandidateIds =
        isRevote ? [...game.tiedPlayerIds] : [];

    game.votingStarted = false;

    game.votes = {};

    game.eliminatedPlayer = null;

    game.voteTied = false;

    game.tiedPlayerIds = revoteCandidateIds;


    getAlivePlayers()
        .filter((player) =>
            !revoteCandidateIds.length || revoteCandidateIds.includes(player.id)
        )
        .forEach(
        (player) => {

            game.votes[player.id] = 0;

        }
    );


    els.votingRoundNumber.textContent =
        game.round;


    els.votingTitle.textContent =
        isRevote
            ? "Ripetete la votazione"
            : "Inizia la votazione";


    els.votingDescription.textContent =
        isRevote
            ? "Il voto precedente è terminato in parità. Decidete di nuovo a voce, poi registrate i nuovi voti."
            : "Discutete a voce e decidete chi votare. Quando siete pronti, iniziate la votazione.";


    els.startVotingButton.textContent =
        isRevote
            ? "INIZIA NUOVA VOTAZIONE"
            : "INIZIA VOTAZIONE";


    els.startVotingButton.classList.remove(
        "hidden"
    );

    els.finishVotingButton.classList.add(
        "hidden"
    );


    els.finishVotingButton.disabled = true;


    renderVotingList();

    showScreen("voting");

}


els.startVotingButton.addEventListener(
    "click",
    () => {

        game.votingStarted = true;


        els.votingTitle.textContent =
            "Registrate i voti";


        els.votingDescription.textContent =
            "Il possessore del telefono registra qui i voti decisi dal gruppo.";


        els.startVotingButton.classList.add(
            "hidden"
        );

        els.finishVotingButton.classList.remove(
            "hidden"
        );



        renderVotingList();

    }
);


/* =========================================================
   VOTING LIST
========================================================= */

function renderVotingList() {

    const alivePlayers =
        getAlivePlayers().filter((player) =>
            !game.tiedPlayerIds.length || game.tiedPlayerIds.includes(player.id)
        );


    const total =
        getVoteTotal();


    els.votingList.innerHTML =
        alivePlayers.map(
            (player) => {

                const count =
                    game.votes[player.id] ||
                    0;


                return `

                    <div
                        class="voting-row"
                    >

                        <strong
                            class="voting-player-name"
                        >
                            ${escapeHtml(
                                player.name
                            )}
                        </strong>

                        <div
                            class="voting-controls"
                        >

                            <button
                                class="vote-button vote-minus"
                                type="button"
                                data-action="minus"
                                data-id="${player.id}"
                                aria-label="Rimuovi un voto a ${escapeHtml(player.name)}"
                                ${
                                    !game.votingStarted || count <= 0
                                        ? "disabled"
                                        : ""
                                }
                            >
                                −
                            </button>

                            <span
                                class="vote-count"
                            >
                                ${count}
                            </span>

                            <button
                                class="vote-button vote-plus"
                                type="button"
                                data-action="plus"
                                data-id="${player.id}"
                                aria-label="Aggiungi un voto a ${escapeHtml(player.name)}"
                                ${
                                    !game.votingStarted || total >= getAlivePlayers().length
                                        ? "disabled"
                                        : ""
                                }
                            >
                                +
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");


    updateVoteTotal();

}


els.votingList.addEventListener(
    "click",
    (event) => {

        const onlineVote = event.target.closest("[data-online-vote-id]");
        if (onlineVote && game.mode === "online") {
            castOnlineVote(onlineVote.dataset.onlineVoteId).catch((error) =>
                setOnlineMessage(
                    els.onlineVoteFeedback,
                    error.message || "Impossibile registrare il voto.",
                    "error"
                )
            );
            return;
        }

        const button =
            event.target.closest(".vote-button");


        if (
            !button ||
            !els.votingList.contains(button) ||
            button.disabled ||
            !game.votingStarted
        ) {

            return;

        }


        const id =
            button.dataset.id;


        if (
            !Object.prototype.hasOwnProperty.call(
                game.votes,
                id
            )
        ) {

            return;

        }


        if (
            button.dataset.action === "plus" &&
            getVoteTotal() < getAlivePlayers().length
        ) {

            game.votes[id]++;

        }


        if (button.dataset.action === "minus") {

            game.votes[id] =
                Math.max(0, game.votes[id] - 1);

        }


        renderVotingList();

    }
);


function getVoteTotal() {

    return Object.values(game.votes)
        .reduce(
            (sum, value) => sum + value,
            0
        );

}


function updateVoteTotal() {

    const total =
        getVoteTotal();


    const requiredVotes =
        getAlivePlayers().length;


    els.voteTotal.textContent =
        `${total} / ${requiredVotes}`;


    els.finishVotingButton.disabled =
        !game.votingStarted ||
        total !== requiredVotes;

}


/* =========================================================
   FINISH VOTING
========================================================= */

els.finishVotingButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            finishOnlineVoting().catch((error) => setOnlineMessage(els.onlineVoteFeedback, error.message || "Impossibile concludere la votazione.", "error"));
            return;
        }

        if (
            !game.votingStarted
        ) {

            return;

        }


        const total =
            getVoteTotal();


        if (
            total !==
            getAlivePlayers().length
        ) {

            alert(
                "Registra un voto per ogni giocatore ancora in partita."
            );

            return;

        }


        processVoting();

    }
);


/* =========================================================
   PROCESS VOTING
========================================================= */

function processVoting() {

    const alivePlayers =
        getAlivePlayers();


    let maxVotes = 0;


    alivePlayers.forEach(
        (player) => {

            const votes =
                game.votes[player.id] ||
                0;


            if (
                votes >
                maxVotes
            ) {

                maxVotes =
                    votes;

            }

        }
    );


    if (maxVotes <= 0) {

        return;

    }


    const candidates =
        alivePlayers.filter(
            (player) =>
                (
                    game.votes[player.id] ||
                    0
                ) === maxVotes
        );


    if (candidates.length > 1) {

        game.eliminatedPlayer = null;

        game.voteTied = true;

        game.tiedPlayerIds =
            candidates.map(
                (player) => player.id
            );


        renderVoteResult();

        showScreen("voteResult");

        return;

    }


    const eliminated =
        candidates[0];


    eliminated.alive =
        false;


    game.eliminatedPlayer =
        eliminated;

    game.voteTied = false;

    game.tiedPlayerIds = [];


    renderVoteResult();

    showScreen("voteResult");

}


/* =========================================================
   VOTE RESULT
========================================================= */

function renderVoteResult() {

    const player =
        game.eliminatedPlayer;


    if (game.voteTied) {

        const tiedNames =
            game.players
                .filter(
                    (candidate) =>
                        game.tiedPlayerIds.includes(candidate.id)
                )
                .map(
                    (candidate) => candidate.name
                );


        els.voteResultBadge.textContent =
            "⚖️ VOTAZIONE IN PARITÀ";

        els.voteResultIcon.textContent =
            "⚖️";

        els.voteResultTitle.textContent =
            "Nessun eliminato";

        els.eliminatedCard.classList.add(
            "is-tie"
        );

        els.eliminatedLabel.textContent =
            "PARI MERITO";

        els.eliminatedPlayerName.textContent =
            tiedNames.join(" • ");

        els.revealedRole.classList.add(
            "hidden"
        );

        els.continueAfterVoteButton.textContent =
            "RIPETI VOTAZIONE →";

    }


    else if (player) {

        els.voteResultBadge.textContent =
            "✅ VOTAZIONE CONCLUSA";

        els.voteResultIcon.textContent =
            "🎯";

        els.voteResultTitle.textContent =
            "Risultato della votazione";

        els.eliminatedCard.classList.remove(
            "is-tie"
        );

        els.eliminatedLabel.textContent =
            "È STATO ELIMINATO";

        els.eliminatedPlayerName.textContent =
            player.name;

        els.revealedRole.classList.remove(
            "hidden"
        );

        els.continueAfterVoteButton.textContent =
            "CONTINUA →";


        if (player.role === "civilian") {

            els.revealedRole.textContent =
                "👤 CIVILE";

        }

        else if (player.role === "undercover") {

            els.revealedRole.textContent =
                "🕵️ UNDERCOVER";

        }

        else {

            els.revealedRole.textContent =
                "🤍 MR. WHITE";

        }

    }


    const players =
        game.players
            .filter(
                (playerResult) =>
                    Object.prototype.hasOwnProperty.call(
                        game.votes,
                        playerResult.id
                    )
            )
            .sort(
            (a, b) => {

                return (
                    (
                        game.votes[b.id] ||
                        0
                    ) -
                    (
                        game.votes[a.id] ||
                        0
                    )
                );

            }
            );


    els.resultVoteSummary.innerHTML =
        players.map(
            (playerResult) => {

                return `

                    <div
                        class="result-vote-row"
                    >

                        <span>
                            ${escapeHtml(
                                playerResult.name
                            )}
                        </span>

                        <strong>
                            ${game.votes[playerResult.id] || 0}
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   CONTINUE AFTER VOTE
========================================================= */

els.continueAfterVoteButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            continueOnlineResult().catch((error) =>
                setOnlineMessage(
                    els.onlineWaitingMessage,
                    error.message || "Impossibile proseguire la partita.",
                    "error"
                )
            );
            return;
        }

        if (false && game.mode === "online") {
            if (!onlineIsHost()) return;
            if (game.voteTied) {
                const state = { ...(onlineGame.publicState || {}), phase: "voting", tiedIds: [], votesSubmitted: 0, voteTotals: {}, votesByPlayer: {} };
                updateOnlineRoom({ game_state: state }).catch((error) => setOnlineMessage(els.onlineLobbyMessage, error.message || "Impossibile ripetere la votazione.", "error"));
                return;
            }
            const state = onlineGame.publicState || {};
            if (state.eliminatedRole === "mrwhite") {
                updateOnlineRoom({ game_state: { ...state, phase: "white_guess", whitePlayerId: state.eliminatedId } }).catch((error) => setOnlineMessage(els.onlineLobbyMessage, error.message || "Impossibile passare al tentativo di Mr. White.", "error"));
            } else {
                advanceOnlineRound().catch((error) => setOnlineMessage(els.onlineLobbyMessage, error.message || "Impossibile avviare il round successivo.", "error"));
            }
            return;
        }

        if (game.voteTied) {

            beginVotingPhase(true);

            return;

        }


        const eliminated =
            game.eliminatedPlayer;


        if (!eliminated) {

            return;

        }


        if (
            eliminated.role ===
            "mrwhite"
        ) {

            prepareWhiteGuess();

            return;

        }


        if (
            checkVictory()
        ) {

            return;

        }


        startNextRound();

    }
);


/* =========================================================
   CHECK VICTORY
========================================================= */

function checkVictory() {

    const civilians =
        countAliveRole(
            "civilian"
        );

    const undercovers =
        countAliveRole(
            "undercover"
        );

    const white =
        countAliveRole(
            "mrwhite"
        );


    const special =
        undercovers +
        white;


    if (
        civilians <= 0
    ) {

        showVictory(
            "special"
        );

        return true;

    }


    if (
        special <= 0
    ) {

        showVictory(
            "civilians"
        );

        return true;

    }


    if (
        special >= civilians
    ) {

        showVictory(
            "special"
        );

        return true;

    }


    return false;

}


/* =========================================================
   MR WHITE
========================================================= */

function prepareWhiteGuess() {

    game.whiteGuessOutcome = null;


    els.whiteGuessInput.value = "";

    els.whiteGuessLabel.classList.remove("hidden");

    els.whiteGuessInput.disabled = false;

    els.whiteGuessResult.className =
        "white-guess-result hidden";

    els.whiteGuessResult.textContent =
        "";


    els.whiteGuessButton.disabled = false;

    els.whiteGuessButton.classList.remove(
        "hidden"
    );

    els.whiteGuessContinueButton.classList.add(
        "hidden"
    );


    els.whiteGuessTitle.textContent =
        `${game.eliminatedPlayer.name}: ultima possibilità`;


    showScreen("whiteGuess");

}


els.whiteGuessButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            submitOnlineWhiteGuess().catch((error) => setOnlineMessage(els.whiteGuessResult, error.message || "Impossibile registrare il tentativo.", "error"));
            return;
        }

        if (game.whiteGuessOutcome) {

            return;

        }


        const guess =
            normalizeText(
                els.whiteGuessInput.value
            );


        if (!guess) {

            alert(
                "Inserisci una parola."
            );

            return;

        }


        const correct =
            normalizeText(
                game.wordPair.civilian
            );


        els.whiteGuessInput.disabled = true;

        els.whiteGuessButton.disabled = true;

        els.whiteGuessButton.classList.add(
            "hidden"
        );

        els.whiteGuessContinueButton.classList.remove(
            "hidden"
        );


        if (
            guess === correct
        ) {

            game.whiteGuessOutcome =
                "correct";

            els.whiteGuessResult.className =
                "white-guess-result success";


            els.whiteGuessResult.textContent =
                `🎯 Esatto! La parola era "${game.wordPair.civilian}".`;


            els.whiteGuessContinueButton.textContent =
                "MOSTRA LA VITTORIA →";


            return;

        }


        game.whiteGuessOutcome =
            "wrong";


        els.whiteGuessResult.className =
            "white-guess-result failure";


        els.whiteGuessResult.textContent =
            `❌ Risposta sbagliata. La parola civile era "${game.wordPair.civilian}".`;


        els.whiteGuessContinueButton.textContent =
            "CONTINUA →";

    }
);


els.whiteGuessInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            els.whiteGuessButton.click();

        }

    }
);


els.whiteGuessContinueButton.addEventListener(
    "click",
    () => {

        if (game.whiteGuessOutcome === "correct") {

            showVictory("white_guess");

            return;

        }


        if (game.whiteGuessOutcome !== "wrong") {

            return;

        }


        if (checkVictory()) {

            return;

        }


        startNextRound();

    }
);


/* =========================================================
   VICTORY
========================================================= */

function showVictory(type) {

    game.finished = true;


    if (
        type ===
        "civilians"
    ) {

        els.victoryIcon.textContent =
            "👥";

        els.victoryTitle.textContent =
            "Vittoria dei Civili!";

        els.victoryDescription.textContent =
            "Avete eliminato tutti gli Impostori.";

        els.victorySummary.innerHTML = `

            <strong>
                🏆 I Civili hanno vinto!
            </strong>

            <br><br>

            La parola civile era:

            <strong>
                ${escapeHtml(
                    game.wordPair.civilian
                )}
            </strong>

        `;

    }


    else if (
        type ===
        "special"
    ) {

        els.victoryIcon.textContent =
            "🕵️";

        els.victoryTitle.textContent =
            "Vittoria degli Impostori!";

        els.victoryDescription.textContent =
            "Gli Impostori hanno raggiunto la parità con i Civili.";

        els.victorySummary.innerHTML = `

            <strong>
                🕵️ Gli Impostori hanno vinto!
            </strong>

            <br><br>

            Parola Civile:

            <strong>
                ${escapeHtml(
                    game.wordPair.civilian
                )}
            </strong>

            <br>

            Parola Undercover:

            <strong>
                ${escapeHtml(
                    game.wordPair.undercover
                )}
            </strong>

        `;

    }


    else if (
        type ===
        "white_guess"
    ) {

        els.victoryIcon.textContent =
            "🤍";

        els.victoryTitle.textContent =
            "Mr. White ha vinto!";

        els.victoryDescription.textContent =
            "Ha indovinato la parola dei Civili.";

        els.victorySummary.innerHTML = `

            <strong>
                🤍 Mr. White ha vinto!
            </strong>

            <br><br>

            La parola era:

            <strong>
                ${escapeHtml(
                    game.wordPair.civilian
                )}
            </strong>

        `;

    }


    showScreen("victory");

}


/* =========================================================
   MENU
========================================================= */

els.victoryMenuButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            leaveOnlineRoom();
            return;
        }

        resetGame();

        showScreen("mode");

    }
);


/* =========================================================
   RESTART
========================================================= */

els.restartGameButton.addEventListener(
    "click",
    () => {

        if (game.mode === "online") {
            if (!onlineIsHost()) return;
            supabaseClient.rpc("undercover_reset_room", {
                p_room_id: onlineGame.roomId,
                p_host_player_id: onlineGame.playerId,
                p_client_id: onlineGame.clientId
            }).then(({ error }) => {
                if (error) throw error;
            }).catch((error) =>
                setOnlineMessage(
                    els.onlineWaitingMessage,
                    error.message || "Impossibile preparare una nuova partita.",
                    "error"
                )
            );
            return;
        }

        resetGame();

        game.mode = "local";

        showScreen("setup");

    }
);


/* =========================================================
   INIT
========================================================= */

window.addEventListener("pagehide", () => {
    if (
        game.mode !== "online" ||
        onlineGame.leaving ||
        !onlineGame.roomId ||
        !onlineGame.playerId ||
        !onlineGame.clientId
    ) return;

    fetch(`${SUPABASE_URL}/rest/v1/rpc/undercover_set_presence`, {
        method: "POST",
        keepalive: true,
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            p_room_id: onlineGame.roomId,
            p_player_id: onlineGame.playerId,
            p_client_id: onlineGame.clientId,
            p_connected: false
        })
    }).catch(() => {});
});

window.addEventListener("pageshow", () => {
    if (game.mode !== "online" || !onlineGame.playerId) return;
    setOnlinePresence(true).catch(() => {});
});

window.addEventListener("offline", () =>
    setOnlineConnectionStatus("Disconnesso", "offline")
);

els.cancelOnlineVoteButton.addEventListener("click", () => {
    clearOnlineVote().catch((error) => setOnlineMessage(els.onlineVoteFeedback, error.message || "Impossibile annullare il voto.", "error"));
});

els.skipOnlineVoteButton.addEventListener("click", () => {
    skipOnlineVote().catch((error) => setOnlineMessage(els.onlineVoteFeedback, error.message || "Impossibile saltare il voto.", "error"));
});


window.addEventListener("online", () => {
    setOnlineConnectionStatus("Riconnessione...");
    setOnlinePresence(true)
        .then(() => subscribeToOnlineRoom())
        .then(() => syncOnlineRoom())
        .catch(() => setOnlineConnectionStatus("Problema di connessione", "offline"));
});

resetGame();

showScreen("mode");

restoreOnlineSession().catch((error) => {
    console.warn("Ripristino sessione Undercover non riuscito:", error);
});
