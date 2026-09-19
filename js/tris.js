/* ========================================
   CuginiParty - TRIS
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const cells = document.querySelectorAll(".tris-cell");
    const turnDisplay = document.getElementById("turnDisplay");
    const resultMessage = document.getElementById("resultMessage");

    const restartButton = document.getElementById("restartButton");
    const resetScoreButton = document.getElementById("resetScoreButton");

    const scoreXElement = document.getElementById("scoreX");
    const scoreOElement = document.getElementById("scoreO");
    const scoreDrawsElement = document.getElementById("scoreDraws");

    const modeButtons = document.querySelectorAll(".mode-button");

    const difficultyContainer =
        document.getElementById("difficultyContainer");

    const difficultySelect =
        document.getElementById("difficultySelect");


    /* ========================================
       STATO
    ======================================== */

    // IMPORTANTE:
    // Il tabellone DEVE avere esattamente 9 elementi.
    let board = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ];

    let currentPlayer = "X";
    let gameActive = true;
    let gameMode = "pvp";
    let difficulty = "medium";

    let scores = {
        X: 0,
        O: 0,
        draws: 0
    };


    /* ========================================
       COSTANTI
    ======================================== */

    const WINNING_COMBINATIONS = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]
    ];

    const STORAGE_KEY = "CuginiParty_tris_scores";


    /* ========================================
       LOCAL STORAGE
    ======================================== */

    function loadScores() {

        try {

            const savedScores =
                localStorage.getItem(STORAGE_KEY);

            if (!savedScores) {
                return;
            }

            const parsed =
                JSON.parse(savedScores);

            if (
                typeof parsed.X === "number" &&
                typeof parsed.O === "number" &&
                typeof parsed.draws === "number"
            ) {

                scores = parsed;

            }

        } catch (error) {

            console.error(
                "Errore caricamento punteggio Tris:",
                error
            );

        }

    }


    function saveScores() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(scores)
        );

    }


    /* ========================================
       AGGIORNA PUNTEGGIO
    ======================================== */

    function updateScoreDisplay() {

        scoreXElement.textContent = scores.X;
        scoreOElement.textContent = scores.O;
        scoreDrawsElement.textContent = scores.draws;

    }


    /* ========================================
       CAMBIA TURNO
    ======================================== */

    function updateTurnDisplay() {

        if (!gameActive) {
            return;
        }

        if (
            gameMode === "ai" &&
            currentPlayer === "O"
        ) {

            turnDisplay.textContent =
                "🤖 Il computer sta pensando...";

        } else {

            turnDisplay.textContent =
                `Turno di ${currentPlayer === "X" ? "❌" : "⭕"}`;

        }

    }


    /* ========================================
       RENDER BOARD
    ======================================== */

    function renderBoard() {

        cells.forEach((cell, index) => {

            const value = board[index];

            if (value === "X") {

                cell.textContent = "❌";

            } else if (value === "O") {

                cell.textContent = "⭕";

            } else {

                cell.textContent = "";

            }

            cell.classList.remove("x", "o");

            if (value === "X") {
                cell.classList.add("x");
            }

            if (value === "O") {
                cell.classList.add("o");
            }

            cell.disabled =
                value !== "" ||
                !gameActive ||
                (
                    gameMode === "ai" &&
                    currentPlayer === "O"
                );

        });

    }


    /* ========================================
       CONTROLLO VITTORIA
    ======================================== */

    function checkWinner() {

        for (const combination of WINNING_COMBINATIONS) {

            const [a, b, c] = combination;

            if (
                board[a] !== "" &&
                board[a] === board[b] &&
                board[a] === board[c]
            ) {

                return {
                    winner: board[a],
                    combination
                };

            }

        }

        if (!board.includes("")) {

            return {
                winner: "draw",
                combination: []
            };

        }

        return null;

    }


    /* ========================================
       FINE PARTITA
    ======================================== */

    function endGame(result) {

        gameActive = false;

        cells.forEach(cell => {
            cell.disabled = true;
        });


        if (result.winner === "draw") {

            scores.draws++;

            resultMessage.textContent =
                "🤝 Pareggio!";

        } else {

            scores[result.winner]++;

            const icon =
                result.winner === "X"
                    ? "❌"
                    : "⭕";

            let winnerName = icon;

            if (
                gameMode === "ai" &&
                result.winner === "O"
            ) {

                winnerName = "🤖 Computer";

            }

            resultMessage.textContent =
                `🏆 ${winnerName} ha vinto!`;

            result.combination.forEach(index => {

                cells[index].classList.add("winner");

            });

        }

        saveScores();
        updateScoreDisplay();

        turnDisplay.textContent =
            "Partita terminata";

    }


    /* ========================================
       MOSSA
    ======================================== */

    function makeMove(index, player) {

        if (!gameActive) {
            return false;
        }

        if (index < 0 || index > 8) {
            return false;
        }

        if (board[index] !== "") {
            return false;
        }

        board[index] = player;

        renderBoard();

        const result = checkWinner();

        if (result) {

            endGame(result);

            return true;

        }

        currentPlayer =
            player === "X"
                ? "O"
                : "X";

        updateTurnDisplay();
        renderBoard();

        return true;

    }


    /* ========================================
       CLICK CELLA
    ======================================== */

    function handleCellClick(event) {

        const index =
            Number(event.currentTarget.dataset.index);

        if (!gameActive) {
            return;
        }

        if (
            gameMode === "ai" &&
            currentPlayer === "O"
        ) {
            return;
        }

        const moveMade =
            makeMove(index, currentPlayer);

        if (
            moveMade &&
            gameActive &&
            gameMode === "ai" &&
            currentPlayer === "O"
        ) {

            setTimeout(() => {

                makeComputerMove();

            }, 450);

        }

    }


    /* ========================================
       MOSSE DISPONIBILI
    ======================================== */

    function getAvailableMoves() {

        const moves = [];

        board.forEach((value, index) => {

            if (value === "") {
                moves.push(index);
            }

        });

        return moves;

    }


    /* ========================================
       MOSSA RANDOM
    ======================================== */

    function getRandomMove() {

        const availableMoves =
            getAvailableMoves();

        if (availableMoves.length === 0) {
            return null;
        }

        const randomIndex =
            Math.floor(
                Math.random() * availableMoves.length
            );

        return availableMoves[randomIndex];

    }


    /* ========================================
       MOSSA VINCENTE
    ======================================== */

    function findWinningMove(player) {

        const availableMoves =
            getAvailableMoves();

        for (const index of availableMoves) {

            board[index] = player;

            const result = checkWinner();

            board[index] = "";

            if (
                result &&
                result.winner === player
            ) {

                return index;

            }

        }

        return null;

    }


    /* ========================================
       AI FACILE
    ======================================== */

    function getEasyMove() {

        return getRandomMove();

    }


    /* ========================================
       AI MEDIA
    ======================================== */

    function getMediumMove() {

        const winningMove =
            findWinningMove("O");

        if (winningMove !== null) {
            return winningMove;
        }

        const blockingMove =
            findWinningMove("X");

        if (blockingMove !== null) {
            return blockingMove;
        }

        if (board[4] === "") {
            return 4;
        }

        const corners =
            [0, 2, 6, 8]
                .filter(index => board[index] === "");

        if (corners.length > 0) {

            return corners[
                Math.floor(
                    Math.random() * corners.length
                )
            ];

        }

        return getRandomMove();

    }


    /* ========================================
       AI DIFFICILE - MINIMAX
    ======================================== */

    function minimax(newBoard, player) {

        const availableMoves = [];

        newBoard.forEach((value, index) => {

            if (value === "") {
                availableMoves.push(index);
            }

        });


        for (const combination of WINNING_COMBINATIONS) {

            const [a, b, c] = combination;

            if (
                newBoard[a] !== "" &&
                newBoard[a] === newBoard[b] &&
                newBoard[a] === newBoard[c]
            ) {

                if (newBoard[a] === "O") {
                    return { score: 10 };
                }

                if (newBoard[a] === "X") {
                    return { score: -10 };
                }

            }

        }


        if (availableMoves.length === 0) {

            return {
                score: 0
            };

        }


        const moves = [];


        for (const index of availableMoves) {

            const move = {};

            move.index = index;

            newBoard[index] = player;


            if (player === "O") {

                move.score =
                    minimax(
                        newBoard,
                        "X"
                    ).score;

            } else {

                move.score =
                    minimax(
                        newBoard,
                        "O"
                    ).score;

            }


            newBoard[index] = "";

            moves.push(move);

        }


        let bestMove;


        if (player === "O") {

            let bestScore = -Infinity;

            moves.forEach(move => {

                if (move.score > bestScore) {

                    bestScore = move.score;
                    bestMove = move;

                }

            });

        } else {

            let bestScore = Infinity;

            moves.forEach(move => {

                if (move.score < bestScore) {

                    bestScore = move.score;
                    bestMove = move;

                }

            });

        }


        return bestMove;

    }


    function getHardMove() {

        const result =
            minimax([...board], "O");

        return result.index;

    }


    /* ========================================
       MOSSA COMPUTER
    ======================================== */

    function makeComputerMove() {

        if (!gameActive) {
            return;
        }

        if (currentPlayer !== "O") {
            return;
        }


        let move;


        if (difficulty === "easy") {

            move = getEasyMove();

        } else if (difficulty === "medium") {

            move = getMediumMove();

        } else {

            move = getHardMove();

        }


        if (
            move !== null &&
            move !== undefined
        ) {

            makeMove(move, "O");

        }

    }


    /* ========================================
       NUOVA PARTITA
    ======================================== */

    function startNewGame() {

        board = [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ];

        currentPlayer =
            Math.random() < 0.5
                ? "X"
                : "O";

        gameActive = true;

        resultMessage.textContent = "";

        cells.forEach(cell => {

            cell.classList.remove("winner");

        });

        updateTurnDisplay();
        renderBoard();


        if (
            gameMode === "ai" &&
            currentPlayer === "O"
        ) {

            setTimeout(() => {

                makeComputerMove();

            }, 450);

        }

    }


    /* ========================================
       CAMBIO MODALITÀ
    ======================================== */

    function setGameMode(mode) {

        gameMode = mode;

        modeButtons.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );

        });


        if (mode === "ai") {

            difficultyContainer.classList.add("visible");

        } else {

            difficultyContainer.classList.remove("visible");

        }


        startNewGame();

    }


    /* ========================================
       EVENTI MODALITÀ
    ======================================== */

    modeButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                setGameMode(
                    button.dataset.mode
                );

            }
        );

    });


    /* ========================================
       CAMBIO DIFFICOLTÀ
    ======================================== */

    difficultySelect.addEventListener(
        "change",
        event => {

            difficulty =
                event.target.value;

            startNewGame();

        }
    );


    /* ========================================
       EVENTI CELLE
    ======================================== */

    cells.forEach(cell => {

        cell.addEventListener(
            "click",
            handleCellClick
        );

    });


    /* ========================================
       NUOVA PARTITA
    ======================================== */

    restartButton.addEventListener(
        "click",
        startNewGame
    );


    /* ========================================
       RESET PUNTEGGIO
    ======================================== */

    resetScoreButton.addEventListener(
        "click",
        () => {

            scores = {
                X: 0,
                O: 0,
                draws: 0
            };

            saveScores();
            updateScoreDisplay();

            startNewGame();

        }
    );


    /* ========================================
       AVVIO
    ======================================== */

    loadScores();

    updateScoreDisplay();

    startNewGame();

});