"use strict";

/* CuginiParty — Tetris
 * Canvas renderer + state-driven vanilla JS engine.
 */

const BOARD_WIDTH = 10;
const VISIBLE_ROWS = 20;
const HIDDEN_ROWS = 2;
const BOARD_HEIGHT = VISIBLE_ROWS + HIDDEN_ROWS;
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const CLEAR_ANIMATION_MS = 220;
const HIGH_SCORE_KEY = "cuginiparty_tetris_highscore";

const PIECE_TYPES = ["I", "J", "L", "O", "S", "T", "Z"];

const PIECES = {
    I: {
        color: "#39c6e8",
        matrix: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    J: {
        color: "#4e7df4",
        matrix: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    L: {
        color: "#ff9d3c",
        matrix: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    O: {
        color: "#f5c842",
        matrix: [
            [1, 1],
            [1, 1]
        ]
    },
    S: {
        color: "#4bdb92",
        matrix: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },
    T: {
        color: "#a56cf2",
        matrix: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },
    Z: {
        color: "#f35d73",
        matrix: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    }
};

/* SRS kick offsets use the specification's y-up coordinate system. */
const JLSTZ_KICKS = {
    "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

const I_KICKS = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

const LINE_POINTS = [0, 100, 300, 500, 800];
const T_SPIN_POINTS = [400, 800, 1200, 1600];

const dom = {
    board: document.getElementById("tetrisBoard"),
    boardStatus: document.getElementById("tetrisBoardStatus"),
    message: document.getElementById("tetrisMessage"),
    score: document.getElementById("tetrisScore"),
    best: document.getElementById("tetrisBest"),
    lines: document.getElementById("tetrisLines"),
    level: document.getElementById("tetrisLevel"),
    linesToNext: document.getElementById("tetrisLinesToNext"),
    levelProgress: document.getElementById("tetrisLevelProgress"),
    streak: document.getElementById("tetrisStreak"),
    streakDetail: document.getElementById("tetrisStreakDetail"),
    holdPreview: document.getElementById("tetrisHoldPreview"),
    holdButton: document.getElementById("tetrisHoldButton"),
    nextQueue: document.getElementById("tetrisNextQueue"),
    newButton: document.getElementById("tetrisNewButton"),
    overlay: document.getElementById("tetrisOverlay"),
    overlayIcon: document.getElementById("tetrisOverlayIcon"),
    overlayTitle: document.getElementById("tetrisOverlayTitle"),
    overlayText: document.getElementById("tetrisOverlayText"),
    overlayPrimary: document.getElementById("tetrisOverlayPrimary"),
    overlayNew: document.getElementById("tetrisOverlayNew"),
    recordBadge: document.getElementById("tetrisRecordBadge"),
    finalScore: document.getElementById("tetrisFinalScore"),
    finalLines: document.getElementById("tetrisFinalLines"),
    finalLevel: document.getElementById("tetrisFinalLevel")
};

const state = {
    board: createBoard(),
    active: null,
    queue: [],
    bag: [],
    hold: null,
    canHold: true,
    score: 0,
    best: readHighScore(),
    newRecord: false,
    lines: 0,
    level: 1,
    combo: -1,
    backToBack: false,
    lastActionWasRotate: false,
    gravityTimer: 0,
    lockTimer: 0,
    lockResets: 0,
    grounded: false,
    softDropHeld: false,
    paused: false,
    gameOver: false,
    busy: false,
    clearRows: [],
    clearTimer: 0,
    pendingClear: null,
    cellSize: 30,
    canvasWidth: 300,
    canvasHeight: 600
};

const ctx = dom.board.getContext("2d");
const heldControls = new Map();
let lastFrameTime = performance.now();

function createBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => createEmptyRow());
}

function createEmptyRow() {
    return Array(BOARD_WIDTH).fill(null);
}

function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function refillQueue() {
    while (state.queue.length < 7) {
        if (state.bag.length === 0) {
            state.bag = shuffle(PIECE_TYPES);
        }
        state.queue.push(state.bag.shift());
    }
}

function getMatrix(type, rotation = 0) {
    let matrix = PIECES[type].matrix.map((row) => row.slice());
    const turns = type === "O" ? 0 : rotation % 4;
    for (let turn = 0; turn < turns; turn += 1) {
        matrix = rotateMatrixClockwise(matrix);
    }
    return matrix;
}

function rotateMatrixClockwise(matrix) {
    const size = matrix.length;
    const rotated = Array.from({ length: size }, () => Array(size).fill(0));
    for (let row = 0; row < size; row += 1) {
        for (let column = 0; column < size; column += 1) {
            rotated[column][size - row - 1] = matrix[row][column];
        }
    }
    return rotated;
}

function createPiece(type, rotation = 0) {
    const size = getMatrix(type, rotation).length;
    return {
        type,
        rotation,
        x: Math.floor((BOARD_WIDTH - size) / 2),
        y: 0
    };
}

function canPlace(piece, x = piece.x, y = piece.y, rotation = piece.rotation) {
    const matrix = getMatrix(piece.type, rotation);
    for (let row = 0; row < matrix.length; row += 1) {
        for (let column = 0; column < matrix[row].length; column += 1) {
            if (!matrix[row][column]) {
                continue;
            }
            const boardX = x + column;
            const boardY = y + row;
            if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                return false;
            }
            if (boardY >= 0 && state.board[boardY][boardX]) {
                return false;
            }
        }
    }
    return true;
}

function getKickTests(type, from, to) {
    if (type === "O") {
        return [[0, 0]];
    }
    const table = type === "I" ? I_KICKS : JLSTZ_KICKS;
    return table[`${from}>${to}`] || [[0, 0]];
}

function updateGroundState(resetIfGrounded = false) {
    if (!state.active) {
        state.grounded = false;
        state.lockTimer = 0;
        return;
    }

    const isGrounded = !canPlace(state.active, state.active.x, state.active.y + 1, state.active.rotation);
    if (!isGrounded) {
        state.grounded = false;
        state.lockTimer = 0;
        state.lockResets = 0;
        return;
    }

    if (!state.grounded) {
        state.grounded = true;
        state.lockTimer = 0;
        state.lockResets = 0;
    } else if (resetIfGrounded && state.lockResets < MAX_LOCK_RESETS) {
        state.lockTimer = 0;
        state.lockResets += 1;
    }
}

function moveHorizontal(direction) {
    if (!isPlayable()) {
        return false;
    }
    const nextX = state.active.x + direction;
    if (!canPlace(state.active, nextX, state.active.y, state.active.rotation)) {
        return false;
    }
    state.active.x = nextX;
    state.lastActionWasRotate = false;
    updateGroundState(true);
    render();
    return true;
}

function softDrop() {
    if (!isPlayable()) {
        return false;
    }
    if (!canPlace(state.active, state.active.x, state.active.y + 1, state.active.rotation)) {
        updateGroundState(false);
        return false;
    }
    state.active.y += 1;
    state.score += 1;
    state.lastActionWasRotate = false;
    updateGroundState(false);
    updateUI();
    render();
    return true;
}

function hardDrop() {
    if (!isPlayable()) {
        return;
    }
    let distance = 0;
    while (canPlace(state.active, state.active.x, state.active.y + 1, state.active.rotation)) {
        state.active.y += 1;
        distance += 1;
    }
    state.score += distance * 2;
    updateUI();
    lockActive(true);
}

function rotateActive(direction = 1) {
    if (!isPlayable()) {
        return false;
    }
    if (state.active.type === "O") {
        state.active.rotation = (state.active.rotation + direction + 4) % 4;
        state.lastActionWasRotate = true;
        updateGroundState(true);
        render();
        return true;
    }

    const from = state.active.rotation;
    const to = (from + direction + 4) % 4;
    const tests = getKickTests(state.active.type, from, to);
    for (const [kickX, kickYUp] of tests) {
        const candidateX = state.active.x + kickX;
        const candidateY = state.active.y - kickYUp;
        if (canPlace(state.active, candidateX, candidateY, to)) {
            state.active.x = candidateX;
            state.active.y = candidateY;
            state.active.rotation = to;
            state.lastActionWasRotate = true;
            updateGroundState(true);
            render();
            return true;
        }
    }
    return false;
}

function getGhostY() {
    if (!state.active) {
        return null;
    }
    let ghostY = state.active.y;
    while (canPlace(state.active, state.active.x, ghostY + 1, state.active.rotation)) {
        ghostY += 1;
    }
    return ghostY;
}

function detectTSpin(piece) {
    if (!piece || piece.type !== "T" || !state.lastActionWasRotate) {
        return false;
    }
    const pivotX = piece.x + 1;
    const pivotY = piece.y + 1;
    let occupiedCorners = 0;
    for (const [offsetX, offsetY] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x = pivotX + offsetX;
        const y = pivotY + offsetY;
        if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || state.board[y][x]) {
            occupiedCorners += 1;
        }
    }
    return occupiedCorners >= 3;
}

function mergeActivePiece(piece) {
    const matrix = getMatrix(piece.type, piece.rotation);
    let toppedOut = false;
    for (let row = 0; row < matrix.length; row += 1) {
        for (let column = 0; column < matrix[row].length; column += 1) {
            if (!matrix[row][column]) {
                continue;
            }
            const boardX = piece.x + column;
            const boardY = piece.y + row;
            if (boardY < HIDDEN_ROWS) {
                toppedOut = true;
            }
            if (boardX >= 0 && boardX < BOARD_WIDTH && boardY >= 0 && boardY < BOARD_HEIGHT) {
                state.board[boardY][boardX] = piece.type;
            }
        }
    }
    return toppedOut;
}

function getCompleteRows() {
    const rows = [];
    for (let row = 0; row < BOARD_HEIGHT; row += 1) {
        if (state.board[row].every(Boolean)) {
            rows.push(row);
        }
    }
    return rows;
}

function lockActive(isHardDrop = false) {
    if (!state.active || state.busy || state.gameOver) {
        return;
    }
    const lockedPiece = { ...state.active };
    const tSpin = detectTSpin(lockedPiece);
    const toppedOut = mergeActivePiece(lockedPiece);
    const completeRows = getCompleteRows();
    state.active = null;
    state.grounded = false;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.gravityTimer = 0;

    if (completeRows.length > 0) {
        state.busy = true;
        state.clearRows = completeRows;
        state.clearTimer = CLEAR_ANIMATION_MS;
        state.pendingClear = {
            rows: completeRows.length,
            tSpin,
            toppedOut,
            hardDrop: isHardDrop
        };
        setMessage(tSpin ? "T-SPIN! Pulisci la griglia…" : `${completeRows.length} ${completeRows.length === 1 ? "riga" : "righe"} in chiusura…`, "good");
        render();
        return;
    }

    if (tSpin) {
        state.score += T_SPIN_POINTS[0] * state.level;
        setMessage("T-SPIN!", "good");
        updateUI();
    } else {
        setMessage("Continua così.");
    }
    finishPiece(toppedOut);
}

function finishClear() {
    const pending = state.pendingClear;
    if (!pending) {
        state.busy = false;
        return;
    }

    const rowsToClear = new Set(state.clearRows);
    state.board = state.board.filter((_, rowIndex) => !rowsToClear.has(rowIndex));
    while (state.board.length < BOARD_HEIGHT) {
        state.board.unshift(createEmptyRow());
    }

    const oldLevel = state.level;
    state.lines += pending.rows;
    state.level = Math.floor(state.lines / 10) + 1;

    const basePoints = pending.tSpin ? T_SPIN_POINTS[pending.rows] : LINE_POINTS[pending.rows];
    const qualified = pending.tSpin || pending.rows === 4;
    let multiplier = 1;
    if (qualified) {
        if (state.backToBack) {
            multiplier = 1.5;
        }
        state.backToBack = true;
    } else {
        state.backToBack = false;
    }

    state.score += Math.round(basePoints * oldLevel * multiplier);
    state.combo = state.combo < 0 ? 0 : state.combo + 1;
    if (state.combo > 0) {
        state.score += 50 * state.combo * oldLevel;
    }

    const perfectClear = state.board.every((row) => row.every((cell) => !cell));
    if (perfectClear) {
        state.score += 350 * oldLevel;
    }

    state.clearRows = [];
    state.clearTimer = 0;
    state.pendingClear = null;
    state.busy = false;
    updateUI();

    const label = pending.tSpin ? `T-SPIN +${pending.rows}` : `${pending.rows} ${pending.rows === 1 ? "riga" : "righe"}`;
    const extras = [
        qualified && state.backToBack && multiplier > 1 ? "B2B" : "",
        state.combo > 0 ? `COMBO x${state.combo + 1}` : "",
        perfectClear ? "PERFECT CLEAR" : ""
    ].filter(Boolean);
    setMessage(extras.length ? `${label} · ${extras.join(" · ")}` : `${label} completata${pending.rows > 1 ? "e" : ""}`, "good");

    if (state.level > oldLevel) {
        setMessage(`Livello ${state.level}! ${extras.join(" · ")}`.trim(), "good");
    }
    finishPiece(pending.toppedOut);
}

function finishPiece(toppedOut) {
    if (toppedOut) {
        endGame();
        return;
    }
    state.lastActionWasRotate = false;
    spawnNextPiece();
    updateUI();
    render();
}

function getGravityInterval() {
    return Math.max(55, 800 * Math.pow(0.82, state.level - 1));
}

function update(delta) {
    if (state.busy) {
        state.clearTimer -= delta;
        if (state.clearTimer <= 0) {
            finishClear();
        }
        return;
    }
    if (!state.active) {
        return;
    }

    state.gravityTimer += delta;
    const gravityInterval = getGravityInterval();
    while (state.gravityTimer >= gravityInterval) {
        state.gravityTimer -= gravityInterval;
        if (canPlace(state.active, state.active.x, state.active.y + 1, state.active.rotation)) {
            state.active.y += 1;
        } else {
            break;
        }
    }

    updateGroundState(false);
    if (state.grounded) {
        state.lockTimer += delta;
        if (state.lockTimer >= LOCK_DELAY_MS) {
            lockActive();
        }
    }
}

function spawnNextPiece() {
    refillQueue();
    const type = state.queue.shift();
    refillQueue();
    state.active = createPiece(type);
    state.canHold = true;
    state.gravityTimer = 0;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.grounded = false;
    state.lastActionWasRotate = false;

    if (!canPlace(state.active)) {
        endGame();
    }
}

function holdPiece() {
    if (!isPlayable() || !state.canHold) {
        if (state.canHold === false && isPlayable()) {
            setMessage("La riserva si usa una volta per pezzo.", "warning");
        }
        return;
    }
    const currentType = state.active.type;
    if (state.hold === null) {
        state.hold = currentType;
        spawnNextPiece();
    } else {
        const heldType = state.hold;
        state.hold = currentType;
        state.active = createPiece(heldType);
        state.gravityTimer = 0;
        state.lockTimer = 0;
        state.lockResets = 0;
        state.grounded = false;
        state.lastActionWasRotate = false;
        if (!canPlace(state.active)) {
            endGame();
        }
    }
    state.canHold = false;
    setMessage("Pezzo in riserva.");
    updateUI();
    render();
}

function isPlayable() {
    return Boolean(state.active) && !state.paused && !state.gameOver && !state.busy;
}

function getLevelProgress() {
    return (state.lines % 10) / 10 * 100;
}

function formatNumber(value) {
    return value.toLocaleString("it-IT");
}

function setMessage(text, tone = "") {
    dom.message.textContent = text;
    dom.message.classList.toggle("is-good", tone === "good");
    dom.message.classList.toggle("is-warning", tone === "warning");
    dom.boardStatus.textContent = text;
}

function updateUI() {
    dom.score.textContent = formatNumber(state.score);
    dom.best.textContent = formatNumber(Math.max(state.best, state.score));
    dom.lines.textContent = String(state.lines);
    dom.level.textContent = String(state.level);
    dom.linesToNext.textContent = String(state.level * 10 - state.lines);
    dom.levelProgress.style.width = `${getLevelProgress()}%`;
    dom.holdButton.disabled = !state.canHold || state.gameOver || state.paused || state.busy;

    if (state.combo >= 0) {
        dom.streak.textContent = `COMBO x${state.combo + 1}`;
        dom.streakDetail.textContent = state.backToBack ? "B2B attivo" : "Catena di righe";
    } else if (state.backToBack) {
        dom.streak.textContent = "B2B";
        dom.streakDetail.textContent = "Bonus attivo";
    } else {
        dom.streak.textContent = "—";
        dom.streakDetail.textContent = "Combo pronta";
    }

    if (state.score > state.best) {
        state.newRecord = true;
        state.best = state.score;
        saveHighScore(state.best);
        dom.score.classList.remove("is-bumping");
        void dom.score.offsetWidth;
        dom.score.classList.add("is-bumping");
    }
    renderPreviews();
}

function readHighScore() {
    try {
        const value = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
        return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
        return 0;
    }
}

function saveHighScore(value) {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch {
        /* localStorage can be unavailable in private or embedded contexts. */
    }
}

function renderPreviews() {
    renderPreview(dom.holdPreview, state.hold, "Nessun pezzo in riserva");
    dom.nextQueue.innerHTML = "";
    state.queue.slice(0, 5).forEach((type, index) => {
        const item = document.createElement("div");
        item.className = "tetris-next-item";
        item.setAttribute("aria-label", `Prossimo pezzo ${index + 1}: ${type}`);
        const preview = document.createElement("div");
        preview.className = "tetris-preview";
        renderPreview(preview, type, "");
        item.append(preview);
        dom.nextQueue.append(item);
    });
}

function renderPreview(container, type, emptyLabel) {
    container.innerHTML = "";
    container.style.removeProperty("--preview-color");
    if (!type) {
        container.setAttribute("aria-label", emptyLabel);
        container.classList.add("is-empty");
        return;
    }
    container.classList.remove("is-empty");
    container.style.setProperty("--preview-color", PIECES[type].color);
    container.setAttribute("aria-label", `Pezzo ${type}`);
    const matrix = getMatrix(type, 0);
    const cells = [];
    matrix.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
        if (filled) {
            cells.push([columnIndex, rowIndex]);
        }
    }));
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    const maxY = Math.max(...cells.map(([, y]) => y));
    const offsetX = Math.floor((4 - (maxX - minX + 1)) / 2) - minX;
    const offsetY = Math.floor((4 - (maxY - minY + 1)) / 2) - minY;
    for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
            const cell = document.createElement("span");
            cell.className = "tetris-preview-cell";
            if (matrix[row - offsetY]?.[column - offsetX]) {
                cell.classList.add("is-filled");
            }
            container.append(cell);
        }
    }
}

function resizeCanvas() {
    const parentWidth = dom.board.parentElement?.clientWidth || 300;
    const cssWidth = Math.max(220, Math.min(410, parentWidth - 12));
    const cssHeight = cssWidth * 2;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    dom.board.width = Math.round(cssWidth * devicePixelRatio);
    dom.board.height = Math.round(cssHeight * devicePixelRatio);
    dom.board.style.width = `${cssWidth}px`;
    dom.board.style.height = `${cssHeight}px`;
    state.cellSize = cssWidth / BOARD_WIDTH;
    state.canvasWidth = cssWidth;
    state.canvasHeight = cssHeight;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    render();
}

function roundRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
}

function drawBlock(column, visibleRow, type, alpha = 1, ghost = false) {
    const size = state.cellSize;
    const x = column * size + 1.3;
    const y = visibleRow * size + 1.3;
    const blockSize = size - 2.6;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (ghost) {
        roundRectPath(ctx, x + 2, y + 2, blockSize - 4, blockSize - 4, Math.max(4, size * .12));
        ctx.fillStyle = "rgba(153, 183, 255, .18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(188, 210, 255, .55)";
        ctx.lineWidth = Math.max(1, size * .06);
        ctx.stroke();
        ctx.restore();
        return;
    }

    const color = PIECES[type].color;
    const gradient = ctx.createLinearGradient(x, y, x + blockSize, y + blockSize);
    gradient.addColorStop(0, lighten(color, .34));
    gradient.addColorStop(.35, color);
    gradient.addColorStop(1, darken(color, .25));
    roundRectPath(ctx, x, y, blockSize, blockSize, Math.max(4, size * .12));
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.2)";
    ctx.lineWidth = Math.max(1, size * .035);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.28)";
    roundRectPath(ctx, x + blockSize * .14, y + blockSize * .12, blockSize * .55, blockSize * .13, blockSize * .06);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.16)";
    roundRectPath(ctx, x + blockSize * .16, y + blockSize * .78, blockSize * .68, blockSize * .08, blockSize * .04);
    ctx.fill();
    ctx.restore();
}

function drawBoardBackground() {
    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    ctx.fillStyle = "#111936";
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);
    for (let visibleRow = 0; visibleRow < VISIBLE_ROWS; visibleRow += 1) {
        for (let column = 0; column < BOARD_WIDTH; column += 1) {
            const x = column * state.cellSize;
            const y = visibleRow * state.cellSize;
            ctx.fillStyle = (visibleRow + column) % 2 === 0 ? "rgba(33, 48, 91, .62)" : "rgba(26, 40, 79, .62)";
            ctx.fillRect(x, y, state.cellSize, state.cellSize);
            ctx.strokeStyle = "rgba(163, 190, 255, .095)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + .5, y + .5, state.cellSize - 1, state.cellSize - 1);
        }
    }
}

function render() {
    if (!ctx) {
        return;
    }
    drawBoardBackground();
    for (let boardRow = HIDDEN_ROWS; boardRow < BOARD_HEIGHT; boardRow += 1) {
        const visibleRow = boardRow - HIDDEN_ROWS;
        for (let column = 0; column < BOARD_WIDTH; column += 1) {
            if (state.board[boardRow][column]) {
                drawBlock(column, visibleRow, state.board[boardRow][column]);
            }
        }
    }

    if (state.active) {
        const ghostY = getGhostY();
        const ghostMatrix = getMatrix(state.active.type, state.active.rotation);
        for (let row = 0; row < ghostMatrix.length; row += 1) {
            for (let column = 0; column < ghostMatrix[row].length; column += 1) {
                if (ghostMatrix[row][column] && ghostY + row >= HIDDEN_ROWS) {
                    drawBlock(state.active.x + column, ghostY + row - HIDDEN_ROWS, state.active.type, .95, true);
                }
            }
        }
        const activeMatrix = getMatrix(state.active.type, state.active.rotation);
        for (let row = 0; row < activeMatrix.length; row += 1) {
            for (let column = 0; column < activeMatrix[row].length; column += 1) {
                if (activeMatrix[row][column] && state.active.y + row >= HIDDEN_ROWS) {
                    drawBlock(state.active.x + column, state.active.y + row - HIDDEN_ROWS, state.active.type);
                }
            }
        }
    }

    if (state.clearRows.length) {
        const pulse = .45 + Math.sin(state.clearTimer / 22) * .18;
        state.clearRows.forEach((boardRow) => {
            if (boardRow < HIDDEN_ROWS) {
                return;
            }
            const visibleRow = boardRow - HIDDEN_ROWS;
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
            ctx.fillRect(0, visibleRow * state.cellSize, state.canvasWidth, state.cellSize);
            ctx.fillStyle = `rgba(110, 222, 255, ${Math.max(.2, pulse - .1)})`;
            ctx.fillRect(0, visibleRow * state.cellSize + state.cellSize * .38, state.canvasWidth, state.cellSize * .24);
            ctx.restore();
        });
    }
}

function showOverlay(mode) {
    const gameOver = mode === "gameover";
    dom.overlay.hidden = false;
    dom.overlayIcon.textContent = gameOver ? "◆" : "Ⅱ";
    dom.overlayTitle.textContent = gameOver ? "Game Over" : "Partita in pausa";
    dom.overlayText.textContent = gameOver ? "La pila ha raggiunto la zona superiore." : "La griglia è congelata. Riprendi quando vuoi.";
    dom.overlayPrimary.textContent = gameOver ? "Rigioca" : "Riprendi";
    dom.overlayPrimary.hidden = false;
    dom.recordBadge.hidden = !(gameOver && state.newRecord);
    dom.finalScore.textContent = formatNumber(state.score);
    dom.finalLines.textContent = String(state.lines);
    dom.finalLevel.textContent = String(state.level);
}

function hideOverlay() {
    dom.overlay.hidden = true;
}

function endGame() {
    state.gameOver = true;
    state.paused = false;
    state.busy = false;
    state.clearRows = [];
    state.pendingClear = null;
    if (state.score > state.best) {
        state.newRecord = true;
        state.best = state.score;
        saveHighScore(state.best);
    }
    setMessage("Game over. Riprova a battere il record.", "warning");
    updateUI();
    showOverlay("gameover");
    render();
}

function togglePause(force) {
    if (state.gameOver || state.busy) {
        return;
    }
    const nextPaused = typeof force === "boolean" ? force : !state.paused;
    state.paused = nextPaused;
    if (state.paused) {
        showOverlay("pause");
        setMessage("Pausa.");
    } else {
        hideOverlay();
        setMessage("Ripresa.");
        dom.board.focus({ preventScroll: true });
    }
    updateUI();
    render();
}

function startNewGame() {
    state.board = createBoard();
    state.active = null;
    state.queue = [];
    state.bag = [];
    state.hold = null;
    state.canHold = true;
    state.score = 0;
    state.newRecord = false;
    state.lines = 0;
    state.level = 1;
    state.combo = -1;
    state.backToBack = false;
    state.lastActionWasRotate = false;
    state.gravityTimer = 0;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.grounded = false;
    state.paused = false;
    state.gameOver = false;
    state.busy = false;
    state.clearRows = [];
    state.clearTimer = 0;
    state.pendingClear = null;
    refillQueue();
    spawnNextPiece();
    hideOverlay();
    setMessage("Sposta il pezzo e completa le righe.");
    updateUI();
    render();
    dom.board.focus({ preventScroll: true });
}

function performAction(action) {
    switch (action) {
        case "left":
            moveHorizontal(-1);
            break;
        case "right":
            moveHorizontal(1);
            break;
        case "down":
            softDrop();
            break;
        case "rotate":
            rotateActive(1);
            break;
        case "rotate-left":
            rotateActive(-1);
            break;
        case "drop":
            hardDrop();
            break;
        case "hold":
            holdPiece();
            break;
        case "pause":
            togglePause();
            break;
        default:
            break;
    }
}

function setupKeyboard() {
    document.addEventListener("keydown", (event) => {
        const key = event.key;
        const actionByKey = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowDown: "down",
            ArrowUp: "rotate",
            x: "rotate",
            X: "rotate",
            z: "rotate-left",
            Z: "rotate-left",
            c: "hold",
            C: "hold",
            Shift: "hold",
            p: "pause",
            P: "pause",
            Escape: "pause",
            " ": "drop"
        };
        const action = actionByKey[key];
        if (!action) {
            return;
        }
        event.preventDefault();
        if (event.repeat && ["drop", "hold", "pause", "rotate", "rotate-left"].includes(action)) {
            return;
        }
        performAction(action);
    });
}

function setupTouchControls() {
    document.querySelectorAll("[data-action]").forEach((button) => {
        const action = button.dataset.action;
        button.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            button.setPointerCapture?.(event.pointerId);
            performAction(action);
            if (["left", "right", "down"].includes(action) && !heldControls.has(event.pointerId)) {
                const interval = action === "down" ? 65 : 95;
                const timer = window.setInterval(() => performAction(action), interval);
                heldControls.set(event.pointerId, timer);
            }
        });
        const release = (event) => {
            const timer = heldControls.get(event.pointerId);
            if (timer) {
                window.clearInterval(timer);
                heldControls.delete(event.pointerId);
            }
        };
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
    });
    window.addEventListener("pointerup", releaseHeldControls);
    window.addEventListener("pointercancel", releaseHeldControls);
}

function releaseHeldControls() {
    heldControls.forEach((timer) => window.clearInterval(timer));
    heldControls.clear();
}

function setupButtons() {
    dom.newButton.addEventListener("click", startNewGame);
    dom.holdButton.addEventListener("click", holdPiece);
    dom.overlayNew.addEventListener("click", startNewGame);
    dom.overlayPrimary.addEventListener("click", () => {
        if (state.gameOver) {
            startNewGame();
        } else {
            togglePause(false);
        }
    });
    dom.board.addEventListener("pointerdown", () => dom.board.focus({ preventScroll: true }));
}

function setupVisibility() {
    document.addEventListener("visibilitychange", () => {
        releaseHeldControls();
        if (document.hidden && !state.gameOver && !state.paused && !state.busy) {
            togglePause(true);
        }
    });
    window.addEventListener("blur", releaseHeldControls);
}

function lighten(hex, amount) {
    return mixColor(hex, "#ffffff", amount);
}

function darken(hex, amount) {
    return mixColor(hex, "#07102c", amount);
}

function mixColor(first, second, amount) {
    const parse = (value) => value.match(/\w\w/g).map((part) => Number.parseInt(part, 16));
    const a = parse(first);
    const b = parse(second);
    const channels = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
    return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function runSelfChecks() {
    const sampleBag = shuffle(PIECE_TYPES);
    if (sampleBag.length !== 7 || new Set(sampleBag).size !== 7) {
        throw new Error("Tetris 7-bag self-check failed");
    }
    PIECE_TYPES.forEach((type) => {
        if (getMatrix(type, 0).flat().filter(Boolean).length !== 4) {
            throw new Error(`Tetris piece self-check failed: ${type}`);
        }
        if (getMatrix(type, 4).toString() !== getMatrix(type, 0).toString()) {
            throw new Error(`Tetris rotation self-check failed: ${type}`);
        }
    });
    const probe = createPiece("T");
    if (!canPlace(probe) || canPlace(probe, -1, probe.y, probe.rotation)) {
        throw new Error("Tetris collision self-check failed");
    }
}

function gameLoop(now) {
    const delta = Math.min(now - lastFrameTime, 120);
    lastFrameTime = now;
    if (!state.paused && !state.gameOver) {
        update(delta);
    }
    render();
    window.requestAnimationFrame(gameLoop);
}

runSelfChecks();
setupKeyboard();
setupTouchControls();
setupButtons();
setupVisibility();
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
startNewGame();
window.requestAnimationFrame(gameLoop);
