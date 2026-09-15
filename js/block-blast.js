"use strict";

/* =========================================================
   CONFIG
========================================================= */

const BB_BOARD_SIZE = 8;
const BB_SAVE_KEY = "cuginiparty_blockblast_save";
const BB_BEST_KEY = "cuginiparty_blockblast_highscore";
const BB_SAVE_VERSION = 2;
const BB_CLEAR_DELAY = 260;
const BB_CLEAR_ANIMATION_DELAY = 280;

const BB_SCORE = Object.freeze({
    POINTS_PER_CELL: 8,
    LINE_CLEAR_BASE: 100,
    MULTI_CLEAR_BONUS: 75,
    COMBO_BONUS: 40
});

const BB_COLORS = Object.freeze([
    "blue", "cyan", "purple", "pink", "yellow", "orange", "green"
]);

const BB_COLOR_VALUES = Object.freeze({
    blue: "linear-gradient(145deg,#62cfff,#238de9)",
    cyan: "linear-gradient(145deg,#67e8f9,#0891b2)",
    purple: "linear-gradient(145deg,#b69cff,#7658e7)",
    pink: "linear-gradient(145deg,#ff8da2,#e94768)",
    yellow: "linear-gradient(145deg,#ffe272,#efa628)",
    orange: "linear-gradient(145deg,#ffb45f,#ed7031)",
    green: "linear-gradient(145deg,#79e29b,#28a962)"
});


/* =========================================================
   SHAPES
========================================================= */

function normalizeShapeCells(cells) {
    const minRow = Math.min(...cells.map(([row]) => row));
    const minCol = Math.min(...cells.map(([, col]) => col));
    return cells.map(([row, col]) => [row - minRow, col - minCol]);
}

function bbShape(id, tier, cells) {
    const normalized = normalizeShapeCells(cells);
    return Object.freeze({
        id,
        tier,
        cells: Object.freeze(normalized),
        width: Math.max(...normalized.map((cell) => cell[1])) + 1,
        height: Math.max(...normalized.map((cell) => cell[0])) + 1
    });
}

const BB_SHAPES = Object.freeze([
    bbShape("single", "small", [[0, 0]]),
    bbShape("line-h-2", "small", [[0, 0], [0, 1]]),
    bbShape("line-v-2", "small", [[0, 0], [1, 0]]),
    bbShape("line-h-3", "small", [[0, 0], [0, 1], [0, 2]]),
    bbShape("line-v-3", "small", [[0, 0], [1, 0], [2, 0]]),
    bbShape("corner-br", "small", [[0, 0], [1, 0], [1, 1]]),
    bbShape("corner-bl", "small", [[0, 1], [1, 0], [1, 1]]),
    bbShape("corner-tr", "small", [[0, 0], [0, 1], [1, 0]]),
    bbShape("corner-tl", "small", [[0, 0], [0, 1], [1, 1]]),

    bbShape("line-h-4", "medium", [[0, 0], [0, 1], [0, 2], [0, 3]]),
    bbShape("line-v-4", "medium", [[0, 0], [1, 0], [2, 0], [3, 0]]),
    bbShape("square-2", "medium", [[0, 0], [0, 1], [1, 0], [1, 1]]),
    bbShape("l4-a", "medium", [[0, 0], [1, 0], [2, 0], [2, 1]]),
    bbShape("l4-b", "medium", [[0, 0], [0, 1], [0, 2], [1, 0]]),
    bbShape("l4-c", "medium", [[0, 0], [0, 1], [1, 1], [2, 1]]),
    bbShape("l4-d", "medium", [[0, 2], [1, 0], [1, 1], [1, 2]]),
    bbShape("t-up", "medium", [[0, 0], [0, 1], [0, 2], [1, 1]]),
    bbShape("t-down", "medium", [[0, 1], [1, 0], [1, 1], [1, 2]]),
    bbShape("t-left", "medium", [[0, 0], [1, 0], [1, 1], [2, 0]]),
    bbShape("t-right", "medium", [[0, 1], [1, 0], [1, 1], [2, 1]]),
    bbShape("z-h", "medium", [[0, 0], [0, 1], [1, 1], [1, 2]]),
    bbShape("s-h", "medium", [[0, 1], [0, 2], [1, 0], [1, 1]]),
    bbShape("z-v", "medium", [[0, 0], [1, 0], [1, 1], [2, 1]]),
    bbShape("s-v", "medium", [[0, 1], [1, 0], [1, 1], [2, 0]]),

    bbShape("line-h-5", "large", [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]),
    bbShape("line-v-5", "large", [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]),
    bbShape("l5-a", "large", [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]]),
    bbShape("l5-b", "large", [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]]),
    bbShape("l5-c", "large", [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1]]),
    bbShape("l5-d", "large", [[0, 3], [1, 0], [1, 1], [1, 2], [1, 3]]),
    bbShape("plus", "large", [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]]),
    bbShape("u-five", "large", [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]]),
    bbShape("square-3", "large", [
        [0, 0], [0, 1], [0, 2],
        [1, 0], [1, 1], [1, 2],
        [2, 0], [2, 1], [2, 2]
    ])
]);

const BB_SHAPE_MAP = new Map(BB_SHAPES.map((shape) => [shape.id, shape]));
const BB_TIER_WEIGHTS = Object.freeze({ small: 5, medium: 4, large: 1.6 });


/* =========================================================
   STATE
========================================================= */

const bbState = {
    board: createEmptyBoard(),
    score: 0,
    best: readBestScore(),
    bestAtStart: readBestScore(),
    combo: 0,
    pieces: [],
    setNumber: 0,
    gameOver: false,
    busy: false,
    selectedPieceIndex: null,
    placedCellKeys: new Set(),
    messageTimer: null,
    clearTimer: null
};

let bbPieceSequence = 0;
let bbDrag = null;
let bbPreviewKeys = new Set();
let bbPreviewLineKeys = new Set();
let bbPreviewValid = false;
let bbSuppressClickUntil = 0;
let bbDragFrame = 0;


/* =========================================================
   DOM / INIT
========================================================= */

const bbDom = {};

document.addEventListener("DOMContentLoaded", initializeBlockBlast);

function initializeBlockBlast() {
    bbDom.board = document.getElementById("blockBlastBoard");
    bbDom.tray = document.getElementById("blockBlastTray");
    bbDom.score = document.getElementById("blockBlastScore");
    bbDom.best = document.getElementById("blockBlastBest");
    bbDom.combo = document.getElementById("blockBlastCombo");
    bbDom.message = document.getElementById("blockBlastMessage");
    bbDom.newButton = document.getElementById("blockBlastNewButton");
    bbDom.overlay = document.getElementById("blockBlastGameOver");
    bbDom.finalScore = document.getElementById("blockBlastFinalScore");
    bbDom.finalBest = document.getElementById("blockBlastFinalBest");
    bbDom.recordBadge = document.getElementById("blockBlastRecordBadge");
    bbDom.replayButton = document.getElementById("blockBlastReplayButton");
    bbDom.ghost = document.getElementById("blockBlastDragGhost");

    if (!bbDom.board || !bbDom.tray) return;

    createBoardDom();
    bindBlockBlastEvents();
    runBlockBlastSelfChecks();

    if (!loadSavedGame()) {
        startNewGame(false);
    } else {
        renderAll();
        if (bbState.gameOver || !hasAnyValidMove()) showGameOver(false);
        else showMessage("Partita ripristinata");
    }
}

function bindBlockBlastEvents() {
    bbDom.newButton?.addEventListener("click", requestNewGame);
    bbDom.replayButton?.addEventListener("click", () => startNewGame(false));
    bbDom.tray.addEventListener("pointerdown", handlePiecePointerDown);
    bbDom.tray.addEventListener("lostpointercapture", handleLostPointerCapture);
    bbDom.tray.addEventListener("click", handlePieceClick);
    bbDom.board.addEventListener("click", handleBoardClick);
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) cancelDrag();
    });
}


/* =========================================================
   PURE BOARD LOGIC
========================================================= */

function createEmptyBoard() {
    return Array.from(
        { length: BB_BOARD_SIZE },
        () => Array(BB_BOARD_SIZE).fill(null)
    );
}

function canPlacePiece(piece, anchorRow, anchorCol) {
    const shape = piece?.cells ? piece : BB_SHAPE_MAP.get(piece?.shapeId);
    return canPlaceOnBoard(bbState.board, shape, anchorRow, anchorCol);
}

function canPlaceOnBoard(board, shape, anchorRow, anchorCol) {
    if (!shape || !Array.isArray(shape.cells)) return false;
    if (!Number.isInteger(anchorRow) || !Number.isInteger(anchorCol)) return false;
    if (!Array.isArray(board) || board.length !== BB_BOARD_SIZE) return false;

    for (const [relativeRow, relativeCol] of shape.cells) {
        const targetRow = anchorRow + relativeRow;
        const targetCol = anchorCol + relativeCol;

        if (targetRow < 0 || targetRow >= BB_BOARD_SIZE) return false;
        if (targetCol < 0 || targetCol >= BB_BOARD_SIZE) return false;
        if (!board[targetRow] || board[targetRow][targetCol]) return false;
    }

    return true;
}

function canPieceFitAnywhere(piece) {
    const shape = piece?.cells ? piece : BB_SHAPE_MAP.get(piece?.shapeId);
    return canPieceFitOnBoard(bbState.board, shape);
}

function canPieceFitOnBoard(board, shape) {
    if (!shape) return false;

    for (let row = 0; row <= BB_BOARD_SIZE - shape.height; row++) {
        for (let col = 0; col <= BB_BOARD_SIZE - shape.width; col++) {
            if (canPlaceOnBoard(board, shape, row, col)) return true;
        }
    }

    return false;
}

function hasAnyValidMove() {
    return hasAnyValidMoveFor(bbState.board, bbState.pieces);
}

function hasAnyValidMoveFor(board, pieces) {
    return Array.isArray(pieces) && pieces.some((pieceState) => {
        if (!pieceState || pieceState.used) return false;
        const shape = BB_SHAPE_MAP.get(pieceState.shapeId);
        return canPieceFitOnBoard(board, shape);
    });
}

function detectCompletedLines(board) {
    const rows = [];
    const columns = [];
    const cells = new Set();

    for (let row = 0; row < BB_BOARD_SIZE; row++) {
        if (board[row].every(Boolean)) rows.push(row);
    }

    for (let col = 0; col < BB_BOARD_SIZE; col++) {
        let complete = true;
        for (let row = 0; row < BB_BOARD_SIZE; row++) {
            if (!board[row][col]) {
                complete = false;
                break;
            }
        }
        if (complete) columns.push(col);
    }

    rows.forEach((row) => {
        for (let col = 0; col < BB_BOARD_SIZE; col++) cells.add(boardKey(row, col));
    });
    columns.forEach((col) => {
        for (let row = 0; row < BB_BOARD_SIZE; row++) cells.add(boardKey(row, col));
    });

    return { rows, columns, cells };
}


/* =========================================================
   PIECE GENERATION
========================================================= */

function makePieceId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    bbPieceSequence += 1;
    return `bb-${Date.now()}-${bbPieceSequence}`;
}

function generatePieceSet() {
    const pieces = [];

    while (pieces.length < 3) {
        let shape = weightedRandomShape();
        let attempts = 0;

        while (
            pieces.filter((piece) => piece.shapeId === shape.id).length >= 2 &&
            attempts < 12
        ) {
            shape = weightedRandomShape();
            attempts += 1;
        }

        pieces.push({
            id: makePieceId(),
            shapeId: shape.id,
            color: BB_COLORS[Math.floor(Math.random() * BB_COLORS.length)],
            used: false
        });
    }

    bbState.pieces = pieces;
    bbState.setNumber += 1;
    bbState.selectedPieceIndex = null;
}

function weightedRandomShape() {
    const total = BB_SHAPES.reduce(
        (sum, shape) => sum + BB_TIER_WEIGHTS[shape.tier],
        0
    );
    let roll = Math.random() * total;

    for (const shape of BB_SHAPES) {
        roll -= BB_TIER_WEIGHTS[shape.tier];
        if (roll <= 0) return shape;
    }

    return BB_SHAPES[0];
}


/* =========================================================
   RENDERING
========================================================= */

function createBoardDom() {
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < BB_BOARD_SIZE; row++) {
        for (let col = 0; col < BB_BOARD_SIZE; col++) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "block-blast-cell";
            cell.dataset.row = String(row);
            cell.dataset.col = String(col);
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("aria-label", `Riga ${row + 1}, colonna ${col + 1}, vuota`);
            fragment.appendChild(cell);
        }
    }

    bbDom.board.replaceChildren(fragment);
    bbDom.cells = [...bbDom.board.children];
}

function renderAll() {
    renderBoard();
    renderPieces();
    renderScore(false);
    renderCombo();
}

function renderBoard() {
    bbDom.cells.forEach((cell, index) => {
        const row = Math.floor(index / BB_BOARD_SIZE);
        const col = index % BB_BOARD_SIZE;
        const color = bbState.board[row][col];

        cell.className = "block-blast-cell";
        cell.style.removeProperty("--piece-color");
        cell.style.removeProperty("--preview-color");

        if (color) {
            cell.classList.add("is-filled");
            cell.style.setProperty("--piece-color", BB_COLOR_VALUES[color]);
            cell.setAttribute("aria-label", `Riga ${row + 1}, colonna ${col + 1}, occupata`);
        } else {
            cell.setAttribute("aria-label", `Riga ${row + 1}, colonna ${col + 1}, vuota`);
        }

        if (bbState.placedCellKeys.has(boardKey(row, col))) cell.classList.add("is-placed");
    });

    bbState.placedCellKeys.clear();
}

function renderPieces() {
    bbDom.tray.replaceChildren(...bbState.pieces.map((pieceState, index) => {
        const shape = BB_SHAPE_MAP.get(pieceState.shapeId);
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = `block-blast-piece-slot${pieceState.used ? " is-used" : ""}${bbState.selectedPieceIndex === index ? " is-selected" : ""}`;
        slot.dataset.pieceIndex = String(index);
        slot.disabled = pieceState.used || bbState.busy || bbState.gameOver;
        slot.setAttribute("aria-label", pieceState.used
            ? `Pezzo ${index + 1}, usato`
            : `Pezzo ${index + 1}, ${shape.cells.length} blocchi`);

        if (!pieceState.used && shape) {
            slot.insertAdjacentHTML("beforeend", shapeMarkup(shape, pieceState.color));
        }

        return slot;
    }));
}

function shapeMarkup(shape, color, cellClass = "block-blast-piece-cell") {
    const cells = shape.cells.map(([row, col]) => `
        <span class="${cellClass}" style="grid-row:${row + 1};grid-column:${col + 1};--piece-color:${BB_COLOR_VALUES[color]}"></span>
    `).join("");

    return `<span class="block-blast-piece-shape" style="grid-template-columns:repeat(${shape.width},var(--mini-cell));grid-template-rows:repeat(${shape.height},var(--mini-cell))" aria-hidden="true">${cells}</span>`;
}

function renderScore(animate = true) {
    bbDom.score.textContent = String(bbState.score);
    bbDom.best.textContent = String(bbState.best);

    if (animate) {
        bbDom.score.classList.remove("is-bumping");
        void bbDom.score.offsetWidth;
        bbDom.score.classList.add("is-bumping");
    }
}

function renderCombo() {
    bbDom.combo.hidden = bbState.combo < 2;
    if (bbState.combo >= 2) bbDom.combo.textContent = `COMBO x${bbState.combo}`;
}


/* =========================================================
   POINTER DRAG
========================================================= */

function handlePiecePointerDown(event) {
    const slot = event.target.closest("[data-piece-index]");
    if (!slot || slot.disabled || bbState.busy || bbState.gameOver) return;

    const pieceIndex = Number(slot.dataset.pieceIndex);
    const pieceState = bbState.pieces[pieceIndex];
    const shape = BB_SHAPE_MAP.get(pieceState?.shapeId);
    const shapeElement = slot.querySelector(".block-blast-piece-shape");
    if (!shape || !shapeElement || pieceState.used) return;

    event.preventDefault();
    cancelDrag();

    const rect = shapeElement.getBoundingClientRect();
    const relativeX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, .999);
    const relativeY = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, .999);

    bbState.selectedPieceIndex = pieceIndex;
    bbDrag = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        pieceIndex,
        shape,
        color: pieceState.color,
        grabX: relativeX * shape.width,
        grabY: relativeY * shape.height,
        grabCol: Math.min(shape.width - 1, Math.floor(relativeX * shape.width)),
        grabRow: Math.min(shape.height - 1, Math.floor(relativeY * shape.height)),
        clientX: event.clientX,
        clientY: event.clientY,
        candidateRow: null,
        candidateCol: null,
        valid: false,
        moved: false,
        source: slot
    };

    slot.classList.add("is-dragging");
    slot.setPointerCapture?.(event.pointerId);
    buildDragGhost(shape, pieceState.color);
    updateDragPosition();
}

function handlePointerMove(event) {
    if (!bbDrag || event.pointerId !== bbDrag.pointerId) return;
    event.preventDefault();

    if (Math.hypot(event.clientX - bbDrag.clientX, event.clientY - bbDrag.clientY) > 6) {
        bbDrag.moved = true;
    }

    bbDrag.clientX = event.clientX;
    bbDrag.clientY = event.clientY;

    if (!bbDragFrame) {
        bbDragFrame = requestAnimationFrame(() => {
            bbDragFrame = 0;
            updateDragPosition();
        });
    }
}

function handlePointerEnd(event) {
    if (!bbDrag || event.pointerId !== bbDrag.pointerId) return;
    event.preventDefault();
    bbDrag.clientX = event.clientX;
    bbDrag.clientY = event.clientY;
    updateDragPosition();

    const wasTap = !bbDrag.moved;
    const pieceIndex = bbDrag.pieceIndex;
    const placement = bbDrag.valid
        ? { index: pieceIndex, row: bbDrag.candidateRow, col: bbDrag.candidateCol }
        : null;

    finishDrag();
    bbSuppressClickUntil = performance.now() + 450;

    if (wasTap) {
        selectPiece(pieceIndex);
        return;
    }

    bbState.selectedPieceIndex = null;
    renderPieces();

    if (placement) {
        placePiece(placement.index, placement.row, placement.col);
    } else {
        showMessage("Qui il pezzo non entra");
        vibrate([15, 25, 15]);
    }
}

function handlePointerCancel(event) {
    if (!bbDrag || (event.pointerId != null && event.pointerId !== bbDrag.pointerId)) return;
    cancelDrag();
}

function handleLostPointerCapture(event) {
    if (bbDrag && event.pointerId === bbDrag.pointerId) cancelDrag();
}

function cancelDrag() {
    if (!bbDrag) return;
    finishDrag();
}

function finishDrag() {
    if (bbDrag?.source) bbDrag.source.classList.remove("is-dragging");
    bbDrag = null;
    clearPlacementPreview();
    bbDom.ghost?.classList.remove("is-visible");

    if (bbDragFrame) {
        cancelAnimationFrame(bbDragFrame);
        bbDragFrame = 0;
    }
}

function buildDragGhost(shape, color) {
    bbDom.ghost.innerHTML = shapeMarkup(shape, color, "block-blast-ghost-cell");
    const inner = bbDom.ghost.firstElementChild;
    if (inner) inner.classList.add("block-blast-drag-ghost-shape");
    bbDom.ghost.classList.add("is-visible");
}

function getBoardMetrics() {
    const first = bbDom.cells?.[0]?.getBoundingClientRect();
    const secondColumn = bbDom.cells?.[1]?.getBoundingClientRect();
    const secondRow = bbDom.cells?.[BB_BOARD_SIZE]?.getBoundingClientRect();
    const boardRect = bbDom.board.getBoundingClientRect();

    if (!first) return null;

    return {
        boardRect,
        cellWidth: first.width,
        cellHeight: first.height,
        pitchX: secondColumn ? secondColumn.left - first.left : first.width,
        pitchY: secondRow ? secondRow.top - first.top : first.height
    };
}

function getDragTouchOffset(pointerType) {
    if (pointerType === "mouse") return 0;
    return clamp(window.innerHeight * .11, 60, 96);
}

function updateDragPosition() {
    if (!bbDrag) return;

    const metrics = getBoardMetrics();
    if (!metrics) return;

    const { boardRect, cellWidth, cellHeight, pitchX, pitchY } = metrics;
    const touchOffset = getDragTouchOffset(bbDrag.pointerType);
    const effectiveX = bbDrag.clientX;
    const effectiveY = bbDrag.clientY - touchOffset;
    const pointerCol = Math.floor((effectiveX - boardRect.left) / pitchX);
    const pointerRow = Math.floor((effectiveY - boardRect.top) / pitchY);
    const candidateCol = pointerCol - bbDrag.grabCol;
    const candidateRow = pointerRow - bbDrag.grabRow;
    const nearBoard = candidateCol < BB_BOARD_SIZE &&
        candidateCol + bbDrag.shape.width > 0 &&
        candidateRow < BB_BOARD_SIZE &&
        candidateRow + bbDrag.shape.height > 0;

    const ghostCellWidth = clamp(cellWidth * .94, 28, 44);
    const ghostCellHeight = clamp(cellHeight * .94, 28, 44);
    const ghostX = bbDrag.clientX - bbDrag.grabX * ghostCellWidth;
    const ghostY = effectiveY - bbDrag.grabY * ghostCellHeight;

    bbDom.ghost.style.setProperty("--mini-cell", `${ghostCellWidth}px`);
    bbDom.ghost.style.setProperty("--ghost-row-cell", `${ghostCellHeight}px`);
    bbDom.ghost.style.transform = `translate3d(${ghostX}px,${ghostY}px,0) scale(1.04)`;

    bbDrag.candidateRow = nearBoard ? candidateRow : null;
    bbDrag.candidateCol = nearBoard ? candidateCol : null;
    bbDrag.valid = nearBoard && canPlacePiece(bbDrag.shape, candidateRow, candidateCol);
    showPlacementPreview(
        bbDrag.shape,
        candidateRow,
        candidateCol,
        nearBoard,
        bbDrag.valid,
        bbDrag.color
    );
}

function showPlacementPreview(shape, row, col, nearBoard, valid, color) {
    clearPlacementPreview();
    if (!nearBoard) return;

    bbPreviewValid = valid;
    const previewLineKeys = valid
        ? getPreviewLineKeys(shape, row, col, color)
        : new Set();

    previewLineKeys.forEach((key) => {
        const [lineRow, lineCol] = key.split(":").map(Number);
        const cell = getBoardCell(lineRow, lineCol);
        if (!cell) return;
        bbPreviewLineKeys.add(key);
        cell.classList.add("preview-line-ready");
        cell.style.setProperty("--preview-line-color", BB_COLOR_VALUES[color]);
    });

    shape.cells.forEach(([relativeRow, relativeCol]) => {
        const targetRow = row + relativeRow;
        const targetCol = col + relativeCol;
        if (targetRow < 0 || targetRow >= BB_BOARD_SIZE || targetCol < 0 || targetCol >= BB_BOARD_SIZE) return;

        const key = boardKey(targetRow, targetCol);
        const cell = getBoardCell(targetRow, targetCol);
        if (!cell) return;
        bbPreviewKeys.add(key);
        cell.classList.add(valid
            ? (previewLineKeys.has(key) ? "preview-line-ready" : "preview-valid")
            : "preview-invalid");
        cell.style.setProperty("--preview-color", BB_COLOR_VALUES[color]);
    });
}

function getPreviewLineKeys(shape, row, col, color) {
    const previewBoard = bbState.board.map((boardRow) => [...boardRow]);

    shape.cells.forEach(([relativeRow, relativeCol]) => {
        previewBoard[row + relativeRow][col + relativeCol] = color;
    });

    return detectCompletedLines(previewBoard).cells;
}

function clearPlacementPreview() {
    bbPreviewKeys.forEach((key) => {
        const [row, col] = key.split(":").map(Number);
        const cell = getBoardCell(row, col);
        cell?.classList.remove("preview-valid", "preview-invalid");
        cell?.style.removeProperty("--preview-color");
    });
    bbPreviewLineKeys.forEach((key) => {
        const [row, col] = key.split(":").map(Number);
        const cell = getBoardCell(row, col);
        cell?.classList.remove("preview-line-ready");
        cell?.style.removeProperty("--preview-line-color");
    });
    bbPreviewKeys.clear();
    bbPreviewLineKeys.clear();
    bbPreviewValid = false;
}


/* =========================================================
   TAP-TO-SELECT FALLBACK
========================================================= */

function handlePieceClick(event) {
    if (performance.now() < bbSuppressClickUntil) return;
    const slot = event.target.closest("[data-piece-index]");
    if (!slot || slot.disabled || bbState.busy || bbState.gameOver) return;
    selectPiece(Number(slot.dataset.pieceIndex));
}

function selectPiece(pieceIndex) {
    const piece = bbState.pieces[pieceIndex];
    if (!piece || piece.used || bbState.busy || bbState.gameOver) return;
    bbState.selectedPieceIndex = pieceIndex;
    renderPieces();
    showMessage("Pezzo selezionato: scegli una cella della griglia");
}

function handleBoardClick(event) {
    const cell = event.target.closest(".block-blast-cell");
    if (!cell || bbState.selectedPieceIndex === null || bbState.busy || bbState.gameOver) return;

    const pieceState = bbState.pieces[bbState.selectedPieceIndex];
    const shape = BB_SHAPE_MAP.get(pieceState?.shapeId);
    if (!shape || pieceState.used) return;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (!canPlacePiece(shape, row, col)) {
        cell.classList.add("preview-invalid");
        setTimeout(() => cell.classList.remove("preview-invalid"), 180);
        showMessage("Il pezzo non entra in questa posizione");
        vibrate(20);
        return;
    }

    placePiece(bbState.selectedPieceIndex, row, col);
}


/* =========================================================
   ATOMIC PLACEMENT / CLEAR PIPELINE
========================================================= */

function placePiece(pieceIndex, row, col) {
    if (bbState.busy || bbState.gameOver) return false;

    const pieceState = bbState.pieces[pieceIndex];
    const shape = BB_SHAPE_MAP.get(pieceState?.shapeId);
    if (!shape || pieceState.used || !canPlacePiece(shape, row, col)) return false;

    const coordinates = shape.cells.map(([relativeRow, relativeCol]) => ({
        row: row + relativeRow,
        col: col + relativeCol
    }));

    bbState.busy = true;
    bbState.selectedPieceIndex = null;
    bbState.placedCellKeys = new Set(coordinates.map(({ row: targetRow, col: targetCol }) => boardKey(targetRow, targetCol)));

    // The placement is all-or-nothing: canPlacePiece was confirmed above,
    // then every target coordinate is written without consulting the DOM.
    coordinates.forEach(({ row: targetRow, col: targetCol }) => {
        bbState.board[targetRow][targetCol] = pieceState.color;
    });
    pieceState.used = true;

    addScore(shape.cells.length * BB_SCORE.POINTS_PER_CELL);
    renderBoard();
    renderPieces();
    vibrate(12);

    const completed = detectCompletedLines(bbState.board);
    if (completed.rows.length || completed.columns.length) {
        resolveCompletedLines(completed);
    } else {
        bbState.combo = 0;
        renderCombo();
        showMessage("Bel piazzamento!");
        finalizeMove();
    }

    return true;
}

function resolveCompletedLines(completed) {
    const lineCount = completed.rows.length + completed.columns.length;
    bbState.combo += 1;

    const lineScore = lineCount * BB_SCORE.LINE_CLEAR_BASE +
        Math.max(0, lineCount - 1) * BB_SCORE.MULTI_CLEAR_BONUS +
        Math.max(0, bbState.combo - 1) * BB_SCORE.COMBO_BONUS;

    addScore(lineScore);
    renderCombo();

    showMessage(clearMessage(lineCount, bbState.combo));
    vibrate(lineCount > 1 ? [25, 20, 35] : 30);

    bbState.clearTimer = window.setTimeout(() => {
        completed.cells.forEach((key) => {
            const [row, col] = key.split(":").map(Number);
            const cell = getBoardCell(row, col);
            cell?.classList.add("is-clearing");
        });

        bbState.clearTimer = window.setTimeout(() => {
            completed.cells.forEach((key) => {
                const [row, col] = key.split(":").map(Number);
                bbState.board[row][col] = null;
            });

            bbState.clearTimer = null;
            bbState.placedCellKeys.clear();
            renderBoard();
            finalizeMove();
        }, BB_CLEAR_ANIMATION_DELAY);
    }, BB_CLEAR_DELAY);
}

function finalizeMove() {
    if (bbState.pieces.length === 3 && bbState.pieces.every((piece) => piece.used)) {
        generatePieceSet();
        showMessage("Nuovi pezzi!");
    }

    bbState.busy = false;
    renderPieces();
    saveGame();

    if (!hasAnyValidMove()) showGameOver(true);
}


/* =========================================================
   SCORE / FEEDBACK
========================================================= */

function addScore(points) {
    bbState.score += points;

    if (bbState.score > bbState.best) {
        bbState.best = bbState.score;
        writeBestScore(bbState.best);
    }

    renderScore(true);
}

function clearMessage(lineCount, combo) {
    if (lineCount >= 4) return "PERFECT! Quattro linee insieme";
    if (lineCount === 3) return "AMAZING! Tre linee insieme";
    if (lineCount === 2) return "GREAT! Doppia linea";
    if (combo >= 3) return `NICE! Combo x${combo}`;
    return "Linea completata!";
}

function showMessage(message) {
    if (!bbDom.message) return;
    bbDom.message.textContent = message;
    clearTimeout(bbState.messageTimer);
    bbState.messageTimer = window.setTimeout(() => {
        if (!bbState.gameOver) bbDom.message.textContent = "Trascina un pezzo sulla griglia";
    }, 1900);
}


/* =========================================================
   GAME OVER / NEW GAME
========================================================= */

function showGameOver(withFeedback) {
    if (bbState.busy || bbState.pieces.length !== 3) return;
    if (!bbState.gameOver && hasAnyValidMove()) return;

    cancelDrag();
    bbState.gameOver = true;
    bbState.selectedPieceIndex = null;
    saveGame();
    renderPieces();

    const isNewRecord = bbState.score > bbState.bestAtStart;
    bbDom.finalScore.textContent = String(bbState.score);
    bbDom.finalBest.textContent = String(bbState.best);
    bbDom.recordBadge.hidden = !isNewRecord;
    bbDom.overlay.hidden = false;
    bbDom.replayButton?.focus();

    if (withFeedback) vibrate([45, 35, 45]);
}

function requestNewGame() {
    if (bbState.busy) return;

    const hasProgress = bbState.score > 0 ||
        bbState.board.some((row) => row.some(Boolean)) ||
        bbState.pieces.some((piece) => piece.used);

    if (hasProgress && !bbState.gameOver && !window.confirm("Vuoi iniziare una nuova partita? I progressi attuali saranno persi.")) {
        return;
    }

    startNewGame(false);
}

function startNewGame(askConfirmation = false) {
    if (bbState.busy) return;
    if (askConfirmation && !window.confirm("Vuoi iniziare una nuova partita?")) return;

    cancelDrag();
    clearTimeout(bbState.messageTimer);
    clearTimeout(bbState.clearTimer);
    bbState.clearTimer = null;
    safeStorageRemove(BB_SAVE_KEY);

    bbState.board = createEmptyBoard();
    bbState.score = 0;
    bbState.best = readBestScore();
    bbState.bestAtStart = bbState.best;
    bbState.combo = 0;
    bbState.pieces = [];
    bbState.setNumber = 0;
    bbState.gameOver = false;
    bbState.busy = false;
    bbState.selectedPieceIndex = null;
    bbState.placedCellKeys.clear();

    generatePieceSet();
    bbDom.overlay.hidden = true;
    renderAll();
    showMessage("Trascina un pezzo sulla griglia");
    saveGame();
}


/* =========================================================
   SAVE / LOAD
========================================================= */

function saveGame() {
    const payload = {
        version: BB_SAVE_VERSION,
        board: bbState.board,
        score: bbState.score,
        bestAtStart: bbState.bestAtStart,
        combo: bbState.combo,
        pieces: bbState.pieces.map(({ id, shapeId, color, used }) => ({ id, shapeId, color, used })),
        setNumber: bbState.setNumber,
        gameOver: bbState.gameOver
    };

    try {
        localStorage.setItem(BB_SAVE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn("Salvataggio Block Blast non disponibile:", error);
    }
}

function loadSavedGame() {
    let saved;

    try {
        saved = JSON.parse(localStorage.getItem(BB_SAVE_KEY) || "null");
    } catch {
        safeStorageRemove(BB_SAVE_KEY);
        return false;
    }

    if (!isValidSave(saved)) {
        if (saved) safeStorageRemove(BB_SAVE_KEY);
        return false;
    }

    bbState.board = saved.board.map((row) => [...row]);
    bbState.score = saved.score;
    bbState.best = Math.max(readBestScore(), saved.score);
    bbState.bestAtStart = saved.bestAtStart;
    bbState.combo = saved.combo;
    bbState.pieces = saved.pieces.map((piece) => ({
        id: piece.id || makePieceId(),
        shapeId: piece.shapeId,
        color: piece.color,
        used: piece.used
    }));
    bbState.setNumber = saved.setNumber;
    bbState.gameOver = saved.gameOver;
    bbState.busy = false;
    bbState.selectedPieceIndex = null;
    bbState.placedCellKeys.clear();

    if (bbState.pieces.every((piece) => piece.used) && !bbState.gameOver) generatePieceSet();
    writeBestScore(bbState.best);
    return true;
}

function isValidSave(saved) {
    if (!saved || (saved.version !== 1 && saved.version !== BB_SAVE_VERSION)) return false;
    if (!Array.isArray(saved.board) || saved.board.length !== BB_BOARD_SIZE) return false;
    if (!saved.board.every((row) => Array.isArray(row) && row.length === BB_BOARD_SIZE && row.every((cell) => cell === null || BB_COLORS.includes(cell)))) return false;
    if (!Number.isSafeInteger(saved.score) || saved.score < 0) return false;
    if (!Number.isSafeInteger(saved.bestAtStart) || saved.bestAtStart < 0) return false;
    if (!Number.isSafeInteger(saved.combo) || saved.combo < 0) return false;
    if (!Number.isSafeInteger(saved.setNumber) || saved.setNumber < 0) return false;
    if (typeof saved.gameOver !== "boolean") return false;
    if (!Array.isArray(saved.pieces) || saved.pieces.length !== 3) return false;

    const ids = new Set();
    return saved.pieces.every((piece) => {
        if (!piece || typeof piece !== "object") return false;
        const idIsValid = saved.version === 1
            ? (!piece.id || typeof piece.id === "string")
            : (typeof piece.id === "string" && piece.id.length > 0);
        if (!idIsValid || (piece.id && ids.has(piece.id))) return false;
        if (piece.id) ids.add(piece.id);
        return BB_SHAPE_MAP.has(piece.shapeId) &&
            BB_COLORS.includes(piece.color) &&
            typeof piece.used === "boolean";
    });
}

function readBestScore() {
    try {
        const value = Number(localStorage.getItem(BB_BEST_KEY));
        return Number.isSafeInteger(value) && value >= 0 ? value : 0;
    } catch {
        return 0;
    }
}

function writeBestScore(score) {
    try {
        localStorage.setItem(BB_BEST_KEY, String(score));
    } catch (error) {
        console.warn("Record Block Blast non disponibile:", error);
    }
}

function safeStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // A storage failure should never break a new game.
    }
}


/* =========================================================
   SELF-CHECKS / UTILITIES
========================================================= */

function runBlockBlastSelfChecks() {
    try {
        const empty = createEmptyBoard();
        const line5 = BB_SHAPE_MAP.get("line-h-5");
        const single = BB_SHAPE_MAP.get("single");

        console.assert(canPlaceOnBoard(empty, single, 0, 0), "Block Blast: empty board check");
        console.assert(canPlaceOnBoard(empty, line5, 0, 3), "Block Blast: valid bounds check");
        console.assert(!canPlaceOnBoard(empty, line5, 0, 4), "Block Blast: horizontal bounds check");

        const collisionBoard = createEmptyBoard();
        collisionBoard[0][1] = "blue";
        console.assert(!canPlaceOnBoard(collisionBoard, line5, 0, 0), "Block Blast: collision check");

        const lineBoard = createEmptyBoard();
        lineBoard[3] = Array(BB_BOARD_SIZE).fill("blue");
        const lines = detectCompletedLines(lineBoard);
        console.assert(lines.rows.length === 1 && lines.rows[0] === 3, "Block Blast: row detection check");

        const crossBoard = createEmptyBoard();
        crossBoard[2] = Array(BB_BOARD_SIZE).fill("blue");
        for (let row = 0; row < BB_BOARD_SIZE; row++) crossBoard[row][5] = "purple";
        const cross = detectCompletedLines(crossBoard);
        console.assert(cross.rows.length === 1 && cross.columns.length === 1 && cross.cells.size === 15, "Block Blast: unique cross-clear check");
    } catch (error) {
        console.warn("Self-check Block Blast non disponibile:", error);
    }
}

function boardKey(row, col) {
    return `${row}:${col}`;
}

function getBoardCell(row, col) {
    return bbDom.cells?.[row * BB_BOARD_SIZE + col];
}

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function vibrate(pattern) {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
}
