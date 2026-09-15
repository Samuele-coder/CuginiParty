"use strict";


/* =========================================================
   DIFFICOLTÀ
   ========================================================= */

const PIZZA_DIFFICULTIES = {

    easy: {
        name: "Facile",
        orderTime: 24,
        orders: 8,
        basePoints: 100,
        mistakePenalty: 15,
        perfectBonus: 50
    },

    medium: {
        name: "Medio",
        orderTime: 19,
        orders: 10,
        basePoints: 125,
        mistakePenalty: 20,
        perfectBonus: 65
    },

    hard: {
        name: "Difficile",
        orderTime: 15,
        orders: 12,
        basePoints: 160,
        mistakePenalty: 25,
        perfectBonus: 85
    }

};


/* =========================================================
   MODALITÀ TEMPO
   ========================================================= */

const PIZZA_TIME_MODES = {

    timed: {
        name: "Con tempo"
    },

    relaxed: {
        name: "Senza tempo"
    }

};


/* =========================================================
   INGREDIENTI
   ========================================================= */

const PIZZA_INGREDIENTS = {

    tomato: {
        name: "Pomodoro"
    },

    cheese: {
        name: "Mozzarella"
    },

    salami: {
        name: "Salame"
    },

    mushroom: {
        name: "Funghi"
    },

    olive: {
        name: "Olive"
    },

    pepper: {
        name: "Peperoni"
    },

    onion: {
        name: "Cipolla"
    },

    corn: {
        name: "Mais"
    },

    basil: {
        name: "Basilico"
    },

    chili: {
        name: "Peperoncino"
    }

};


/* =========================================================
   ORDINI
   ========================================================= */

const PIZZA_RECIPES = [

    {
        name: "Margherita",

        ingredients: [
            "tomato",
            "cheese",
            "basil"
        ]
    },

    {
        name: "Diavola",

        ingredients: [
            "tomato",
            "cheese",
            "salami",
            "chili"
        ]
    },

    {
        name: "Funghi",

        ingredients: [
            "tomato",
            "cheese",
            "mushroom"
        ]
    },

    {
        name: "Boscaiola",

        ingredients: [
            "tomato",
            "cheese",
            "mushroom",
            "onion"
        ]
    },

    {
        name: "Vegetariana",

        ingredients: [
            "tomato",
            "cheese",
            "mushroom",
            "olive",
            "pepper"
        ]
    },

    {
        name: "Pepperoni",

        ingredients: [
            "tomato",
            "cheese",
            "salami",
            "pepper"
        ]
    },

    {
        name: "Ortolana",

        ingredients: [
            "tomato",
            "cheese",
            "pepper",
            "onion",
            "corn"
        ]
    },

    {
        name: "Piccante",

        ingredients: [
            "tomato",
            "cheese",
            "olive",
            "chili"
        ]
    },

    {
        name: "Rustica",

        ingredients: [
            "tomato",
            "cheese",
            "salami",
            "onion",
            "olive"
        ]
    },

    {
        name: "Mediterranea",

        ingredients: [
            "tomato",
            "cheese",
            "olive",
            "basil"
        ]
    }

];


/* =========================================================
   DOM
   ========================================================= */

let pizzaStartScreen;
let pizzaGameScreen;
let pizzaEndScreen;

let pizzaStartButton;
let pizzaExitButton;
let pizzaCookButton;
let pizzaClearButton;
let pizzaAgainButton;
let pizzaMenuButton;

let pizzaDifficultyButtons;
let pizzaTimeModeButtons;

let pizzaOrderNumber;
let pizzaOrderName;
let pizzaOrderIngredients;

let pizzaTimer;
let pizzaTimerSection;
let pizzaTimerBarFill;

let pizzaScoreElement;
let pizzaComboElement;
let pizzaServedElement;

let pizzaIngredientsGrid;
let pizzaToppings;

let pizzaActionMessage;
let pizzaCookingOverlay;

let pizzaModeBadge;

let pizzaEndIcon;
let pizzaEndKicker;
let pizzaEndTitle;
let pizzaEndMessage;

let pizzaFinalScore;
let pizzaFinalServed;
let pizzaFinalCombo;
let pizzaFinalMistakes;
let pizzaEndBadge;


/* =========================================================
   STATO
   ========================================================= */

let pizzaSelectedDifficulty = "easy";

let pizzaSelectedTimeMode = "timed";

let pizzaCurrentOrder = null;

let pizzaCurrentOrderNumber = 0;

let pizzaSelectedIngredients = [];

let pizzaScore = 0;

let pizzaCombo = 0;

let pizzaBestCombo = 0;

let pizzaServed = 0;

let pizzaMistakes = 0;

let pizzaOrdersCompleted = 0;

let pizzaTimeRemaining = 0;

let pizzaTimerInterval = null;

let pizzaCooking = false;

let pizzaGameStarted = false;

let pizzaGameFinished = false;

let pizzaCookTimeout = null;


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializePizza
);


function initializePizza() {

    pizzaStartScreen =
        document.getElementById(
            "pizzaStartScreen"
        );

    pizzaGameScreen =
        document.getElementById(
            "pizzaGameScreen"
        );

    pizzaEndScreen =
        document.getElementById(
            "pizzaEndScreen"
        );


    pizzaStartButton =
        document.getElementById(
            "pizzaStartButton"
        );

    pizzaExitButton =
        document.getElementById(
            "pizzaExitButton"
        );

    pizzaCookButton =
        document.getElementById(
            "pizzaCookButton"
        );

    pizzaClearButton =
        document.getElementById(
            "pizzaClearButton"
        );

    pizzaAgainButton =
        document.getElementById(
            "pizzaAgainButton"
        );

    pizzaMenuButton =
        document.getElementById(
            "pizzaMenuButton"
        );


    pizzaDifficultyButtons =
        document.querySelectorAll(
            ".pizza-difficulty"
        );


    pizzaTimeModeButtons =
        document.querySelectorAll(
            ".pizza-time-option"
        );


    pizzaOrderNumber =
        document.getElementById(
            "pizzaOrderNumber"
        );

    pizzaOrderName =
        document.getElementById(
            "pizzaOrderName"
        );

    pizzaOrderIngredients =
        document.getElementById(
            "pizzaOrderIngredients"
        );


    pizzaTimer =
        document.getElementById(
            "pizzaTimer"
        );

    pizzaTimerSection =
        document.getElementById(
            "pizzaTimerSection"
        );

    pizzaTimerBarFill =
        document.getElementById(
            "pizzaTimerBarFill"
        );


    pizzaScoreElement =
        document.getElementById(
            "pizzaScore"
        );

    pizzaComboElement =
        document.getElementById(
            "pizzaCombo"
        );

    pizzaServedElement =
        document.getElementById(
            "pizzaServed"
        );


    pizzaIngredientsGrid =
        document.getElementById(
            "pizzaIngredientsGrid"
        );

    pizzaToppings =
        document.getElementById(
            "pizzaToppings"
        );


    pizzaActionMessage =
        document.getElementById(
            "pizzaActionMessage"
        );

    pizzaCookingOverlay =
        document.getElementById(
            "pizzaCookingOverlay"
        );


    pizzaModeBadge =
        document.getElementById(
            "pizzaModeBadge"
        );


    pizzaEndIcon =
        document.getElementById(
            "pizzaEndIcon"
        );

    pizzaEndKicker =
        document.getElementById(
            "pizzaEndKicker"
        );

    pizzaEndTitle =
        document.getElementById(
            "pizzaEndTitle"
        );

    pizzaEndMessage =
        document.getElementById(
            "pizzaEndMessage"
        );


    pizzaFinalScore =
        document.getElementById(
            "pizzaFinalScore"
        );

    pizzaFinalServed =
        document.getElementById(
            "pizzaFinalServed"
        );

    pizzaFinalCombo =
        document.getElementById(
            "pizzaFinalCombo"
        );

    pizzaFinalMistakes =
        document.getElementById(
            "pizzaFinalMistakes"
        );

    pizzaEndBadge =
        document.getElementById(
            "pizzaEndBadge"
        );


    if (!pizzaIngredientsGrid) {
        return;
    }


    initializePizzaDifficulty();

    initializePizzaTimeMode();

    initializePizzaButtons();

    renderPizzaIngredients();

    updatePizzaTimeModeUI();

}


/* =========================================================
   DIFFICOLTÀ
   ========================================================= */

function initializePizzaDifficulty() {

    pizzaDifficultyButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const difficulty =
                        button.dataset.difficulty;


                    if (
                        !PIZZA_DIFFICULTIES[
                            difficulty
                        ]
                    ) {

                        return;
                    }


                    pizzaSelectedDifficulty =
                        difficulty;


                    pizzaDifficultyButtons.forEach(
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
   TIME MODE
   ========================================================= */

function initializePizzaTimeMode() {

    pizzaTimeModeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const mode =
                        button.dataset.timeMode;


                    if (
                        !PIZZA_TIME_MODES[
                            mode
                        ]
                    ) {

                        return;
                    }


                    pizzaSelectedTimeMode =
                        mode;


                    pizzaTimeModeButtons.forEach(
                        item => {

                            item.classList.toggle(
                                "selected",
                                item === button
                            );

                        }
                    );


                    updatePizzaTimeModeUI();

                }
            );

        }
    );

}


/* =========================================================
   TIME MODE UI
   ========================================================= */

function updatePizzaTimeModeUI() {

    const timed =
        pizzaSelectedTimeMode === "timed";


    if (pizzaTimerSection) {

        pizzaTimerSection.classList.toggle(
            "hidden",
            !timed
        );

    }


    if (pizzaModeBadge) {

        pizzaModeBadge.textContent =
            timed
                ? "⏱️ Tempo"
                : "♾️ Senza tempo";

    }

}


/* =========================================================
   BUTTONS
   ========================================================= */

function initializePizzaButtons() {

    if (pizzaStartButton) {

        pizzaStartButton.addEventListener(
            "click",
            startPizzaGame
        );

    }


    if (pizzaExitButton) {

        pizzaExitButton.addEventListener(
            "click",
            showPizzaMenu
        );

    }


    if (pizzaCookButton) {

        pizzaCookButton.addEventListener(
            "click",
            cookPizza
        );

    }


    if (pizzaClearButton) {

        pizzaClearButton.addEventListener(
            "click",
            clearPizza
        );

    }


    if (pizzaAgainButton) {

        pizzaAgainButton.addEventListener(
            "click",
            startPizzaGame
        );

    }


    if (pizzaMenuButton) {

        pizzaMenuButton.addEventListener(
            "click",
            showPizzaMenu
        );

    }

}


/* =========================================================
   START
   ========================================================= */

function startPizzaGame() {

    stopPizzaTimer();

    clearPizzaCookTimeout();


    pizzaScore = 0;

    pizzaCombo = 0;

    pizzaBestCombo = 0;

    pizzaServed = 0;

    pizzaMistakes = 0;

    pizzaOrdersCompleted = 0;

    pizzaCurrentOrderNumber = 0;

    pizzaCurrentOrder = null;

    pizzaSelectedIngredients = [];

    pizzaCooking = false;

    pizzaGameStarted = true;

    pizzaGameFinished = false;


    if (pizzaStartScreen) {
        pizzaStartScreen.hidden = true;
    }


    if (pizzaEndScreen) {
        pizzaEndScreen.hidden = true;
    }


    if (pizzaGameScreen) {
        pizzaGameScreen.hidden = false;
    }


    updatePizzaTimeModeUI();

    updatePizzaHUD();


    nextPizzaOrder(
        getPizzaDifficulty()
    );

}


/* =========================================================
   NEXT ORDER
   ========================================================= */

function nextPizzaOrder(
    difficulty
) {

    clearPizzaCookTimeout();

    pizzaCooking = false;


    pizzaSelectedIngredients = [];


    hidePizzaCookingOverlay();


    if (
        pizzaOrdersCompleted >=
        difficulty.orders
    ) {

        finishPizzaGame(true);

        return;

    }


    let nextOrder =
        randomPizzaRecipe();


    if (
        pizzaCurrentOrder &&
        PIZZA_RECIPES.length > 1
    ) {

        let attempts = 0;


        while (
            nextOrder.name ===
            pizzaCurrentOrder.name &&
            attempts < 10
        ) {

            nextOrder =
                randomPizzaRecipe();

            attempts++;

        }

    }


    pizzaCurrentOrder =
        nextOrder;


    pizzaCurrentOrderNumber++;


    if (
        pizzaSelectedTimeMode ===
        "timed"
    ) {

        pizzaTimeRemaining =
            difficulty.orderTime;

    } else {

        pizzaTimeRemaining = 0;

    }


    renderCurrentPizzaOrder();

    renderPizzaIngredients();

    clearPizzaVisual();

    updatePizzaOrderChecks();

    updatePizzaCookButton();

    updatePizzaHUD();

    updatePizzaTimerBar();


    if (
        pizzaSelectedTimeMode ===
        "timed"
    ) {

        startPizzaTimer();

    } else {

        stopPizzaTimer();

    }

}


/* =========================================================
   RANDOM RECIPE
   ========================================================= */

function randomPizzaRecipe() {

    return PIZZA_RECIPES[
        Math.floor(
            Math.random() *
            PIZZA_RECIPES.length
        )
    ];

}


/* =========================================================
   DIFFICULTY
   ========================================================= */

function getPizzaDifficulty() {

    return PIZZA_DIFFICULTIES[
        pizzaSelectedDifficulty
    ];

}


/* =========================================================
   ORDER RENDER
   ========================================================= */

function renderCurrentPizzaOrder() {

    if (!pizzaCurrentOrder) {
        return;
    }


    if (pizzaOrderNumber) {

        pizzaOrderNumber.textContent =
            `Ordine #${pizzaCurrentOrderNumber}`;

    }


    if (pizzaOrderName) {

        pizzaOrderName.textContent =
            pizzaCurrentOrder.name;

    }


    if (pizzaOrderIngredients) {

        pizzaOrderIngredients.innerHTML = "";


        pizzaCurrentOrder.ingredients.forEach(
            ingredientId => {

                const ingredient =
                    PIZZA_INGREDIENTS[
                        ingredientId
                    ];


                if (!ingredient) {
                    return;
                }


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "pizza-required-ingredient";


                item.dataset.ingredient =
                    ingredientId;


                item.innerHTML =
                    `
                    <span>
                        ${getIngredientVisualMarkup(
                            ingredientId
                        )}
                    </span>

                    <span>
                        ${ingredient.name}
                    </span>
                    `;


                pizzaOrderIngredients.appendChild(
                    item
                );

            }
        );

    }

}


/* =========================================================
   INGREDIENT VISUAL MARKUP
   ========================================================= */

function getIngredientVisualMarkup(
    ingredientId
) {

    return `
        <span
            class="pizza-order-visual pizza-order-${ingredientId}"
            aria-hidden="true"
        ></span>
    `;

}


/* =========================================================
   INGREDIENT BUTTONS
   ========================================================= */

function renderPizzaIngredients() {

    if (!pizzaIngredientsGrid) {
        return;
    }


    pizzaIngredientsGrid.innerHTML = "";


    Object.entries(
        PIZZA_INGREDIENTS
    ).forEach(
        (
            [
                ingredientId,
                ingredient
            ]
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "pizza-ingredient";


            button.dataset.ingredient =
                ingredientId;


            const selected =
                pizzaSelectedIngredients.includes(
                    ingredientId
                );


            if (selected) {

                button.classList.add(
                    "selected"
                );

            }


            button.innerHTML =
                `
                <span
                    class="
                        pizza-ingredient-visual
                        ${ingredientId}
                    "
                    aria-hidden="true"
                ></span>

                <span class="pizza-ingredient-name">
                    ${ingredient.name}
                </span>

                <span
                    class="pizza-ingredient-count"
                    ${selected ? "" : "hidden"}
                >
                    ${selected ? "1" : "0"}
                </span>
                `;


            button.addEventListener(
                "click",
                () => {

                    addPizzaIngredient(
                        ingredientId
                    );

                }
            );


            pizzaIngredientsGrid.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   ADD INGREDIENT
   ========================================================= */

function addPizzaIngredient(ingredientId) {

    if (
        !pizzaGameStarted ||
        pizzaGameFinished ||
        pizzaCooking ||
        !pizzaCurrentOrder
    ) {
        return;
    }

    const ingredient =
        PIZZA_INGREDIENTS[ingredientId];

    if (!ingredient) {
        return;
    }

    // Ingrediente non richiesto
    if (
        !pizzaCurrentOrder.ingredients.includes(
            ingredientId
        )
    ) {

        pizzaMistakes++;

        pizzaCombo = 0;

        pizzaScore = Math.max(
            0,
            pizzaScore -
            getPizzaDifficulty().mistakePenalty
        );

        updatePizzaHUD();

        showPizzaActionMessage(
            `❌ ${ingredient.name} non serve`
        );

        return;
    }

    // Ingrediente già inserito
    if (
        pizzaSelectedIngredients.includes(
            ingredientId
        )
    ) {
        return;
    }

    pizzaSelectedIngredients.push(
        ingredientId
    );

    renderPizzaToppings();

    renderPizzaIngredients();

    updatePizzaOrderChecks();

    updatePizzaCookButton();

    showPizzaActionMessage(
        `✅ ${ingredient.name} aggiunto`
    );
}


/* =========================================================
   TOPPINGS
   ========================================================= */

function renderPizzaToppings() {

    if (!pizzaToppings) {
        return;
    }

    pizzaToppings.innerHTML = "";

    /*
     * POMODORO
     * Non è un topping.
     * È la passata che ricopre tutta la pizza.
     */
    const sauce =
        document.querySelector(
            ".pizza-sauce"
        );

    if (sauce) {

        sauce.classList.toggle(
            "active",
            pizzaSelectedIngredients.includes(
                "tomato"
            )
        );
    }


    /*
     * MOZZARELLA
     * Anche questa è uno strato completo.
     */
    const cheese =
        document.querySelector(
            ".pizza-cheese-layer"
        );

    if (cheese) {

        cheese.classList.toggle(
            "active",
            pizzaSelectedIngredients.includes(
                "cheese"
            )
        );
    }


    /*
     * Gli altri ingredienti vengono
     * distribuiti sopra la pizza.
     */

    const positions = [
        [18, 20, -8],
        [34, 17, 10],
        [52, 19, -5],
        [70, 22, 12],

        [25, 34, 15],
        [44, 32, -10],
        [62, 35, 8],
        [78, 37, -13],

        [17, 50, -8],
        [35, 49, 13],
        [53, 50, -7],
        [71, 51, 10],
        [84, 51, -5],

        [25, 67, 9],
        [44, 67, -12],
        [62, 68, 7],
        [78, 67, -10],

        [34, 81, 8],
        [53, 80, -7],
        [69, 79, 11]
    ];


    const ingredientAmounts = {

        salami: 7,
        mushroom: 7,
        olive: 8,
        pepper: 6,
        onion: 7,
        corn: 13,
        basil: 7,
        chili: 5

    };


    const ingredientOrder = [
        "salami",
        "mushroom",
        "olive",
        "pepper",
        "onion",
        "corn",
        "basil",
        "chili"
    ];


    /*
     * Disegniamo ogni ingrediente in
     * posizioni diverse, così non si
     * sovrappongono tutti nello stesso punto.
     */

    let globalIndex = 0;


    ingredientOrder.forEach(
        ingredientId => {

            if (
                !pizzaSelectedIngredients.includes(
                    ingredientId
                )
            ) {
                return;
            }


            const amount =
                ingredientAmounts[
                    ingredientId
                ] || 5;


            for (
                let i = 0;
                i < amount;
                i++
            ) {

                const position =
                    positions[
                        (
                            globalIndex + i * 3
                        ) %
                        positions.length
                    ];


                const topping =
                    document.createElement(
                        "span"
                    );


                topping.className =
                    `pizza-topping ${ingredientId}`;


                topping.style.left =
                    `${position[0]}%`;


                topping.style.top =
                    `${position[1]}%`;


                topping.style.setProperty(
                    "--rotation",
                    `${position[2]}deg`
                );


                /*
                 * Piccola variazione di posizione
                 * per rendere il risultato meno
                 * perfettamente geometrico.
                 */

                const randomX =
                    (Math.random() * 5) - 2.5;

                const randomY =
                    (Math.random() * 5) - 2.5;


                topping.style.marginLeft =
                    `${randomX}px`;


                topping.style.marginTop =
                    `${randomY}px`;


                pizzaToppings.appendChild(
                    topping
                );

            }


            globalIndex +=
                amount;

        }
    );

}


/* =========================================================
   ORDER CHECK
   ========================================================= */

function updatePizzaOrderChecks() {

    if (!pizzaOrderIngredients) {
        return;
    }


    pizzaOrderIngredients
        .querySelectorAll(
            "[data-ingredient]"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "done",
                    pizzaSelectedIngredients.includes(
                        item.dataset.ingredient
                    )
                );

            }
        );

}


/* =========================================================
   COOK BUTTON
   ========================================================= */

function updatePizzaCookButton() {

    if (!pizzaCookButton) {
        return;
    }


    if (!pizzaCurrentOrder) {

        pizzaCookButton.disabled =
            true;

        return;

    }


    const complete =
        pizzaCurrentOrder.ingredients.every(
            ingredient =>
                pizzaSelectedIngredients.includes(
                    ingredient
                )
        );


    pizzaCookButton.disabled =
        !complete;


    if (complete) {

        showPizzaActionMessage(
            "🔥 Pizza pronta: cuocila!"
        );

    }

}


/* =========================================================
   COOK
   ========================================================= */

function cookPizza() {

    if (
        !pizzaGameStarted ||
        pizzaGameFinished ||
        pizzaCooking ||
        !pizzaCurrentOrder
    ) {

        return;

    }


    if (
        pizzaCookButton &&
        pizzaCookButton.disabled
    ) {

        return;

    }


    pizzaCooking = true;


    if (pizzaCookButton) {
        pizzaCookButton.disabled = true;
    }


    if (pizzaClearButton) {
        pizzaClearButton.disabled = true;
    }


    if (pizzaIngredientsGrid) {

        pizzaIngredientsGrid
            .querySelectorAll("button")
            .forEach(
                button => {

                    button.disabled = true;

                }
            );

    }


    showPizzaCookingOverlay();


    showPizzaActionMessage(
        "🔥 La pizza è nel forno..."
    );


    pizzaCookTimeout =
        setTimeout(
            () => {

                pizzaCooking =
                    false;

                hidePizzaCookingOverlay();


                if (pizzaClearButton) {
                    pizzaClearButton.disabled = false;
                }


                evaluatePizzaOrder();

            },
            1400
        );

}


/* =========================================================
   EVALUATE
   ========================================================= */

function evaluatePizzaOrder() {

    if (!pizzaCurrentOrder) {
        return;
    }


    const required =
        pizzaCurrentOrder.ingredients;


    const correct =
        required.length ===
            pizzaSelectedIngredients.length &&

        required.every(
            ingredient =>
                pizzaSelectedIngredients.includes(
                    ingredient
                )
        );


    if (!correct) {

        pizzaMistakes++;

        pizzaCombo = 0;


        pizzaScore =
            Math.max(
                0,
                pizzaScore -
                getPizzaDifficulty().mistakePenalty
            );


        showPizzaActionMessage(
            "❌ La pizza non è corretta!"
        );


        pizzaSelectedIngredients = [];


        clearPizzaVisual();

        renderPizzaIngredients();

        updatePizzaOrderChecks();

        updatePizzaCookButton();

        updatePizzaHUD();


        return;

    }


    pizzaOrdersCompleted++;

    pizzaServed++;

    pizzaCombo++;

    pizzaBestCombo =
        Math.max(
            pizzaBestCombo,
            pizzaCombo
        );


    const difficulty =
        getPizzaDifficulty();


    let points =
        difficulty.basePoints;


    points +=
        Math.max(
            0,
            pizzaCombo - 1
        ) *
        25;


    if (
        pizzaSelectedTimeMode ===
        "timed"
    ) {

        points +=
            Math.round(
                pizzaTimeRemaining *
                4
            );

    }


    if (
        pizzaMistakes === 0
    ) {

        points +=
            difficulty.perfectBonus;

    }


    pizzaScore +=
        points;


    showPizzaActionMessage(
        `✅ Perfetta! +${points} punti`
    );


    updatePizzaHUD();


    setTimeout(
        () => {

            if (
                pizzaGameStarted &&
                !pizzaGameFinished
            ) {

                nextPizzaOrder(
                    difficulty
                );

            }

        },
        650
    );

}


/* =========================================================
   CLEAR
   ========================================================= */

function clearPizza() {

    if (
        !pizzaGameStarted ||
        pizzaCooking
    ) {

        return;

    }


    pizzaSelectedIngredients = [];


    clearPizzaVisual();

    renderPizzaIngredients();

    updatePizzaOrderChecks();

    updatePizzaCookButton();


    showPizzaActionMessage(
        "🧹 Pizza pulita"
    );

}


/* =========================================================
   CLEAR VISUAL
   ========================================================= */

function clearPizzaVisual() {

    if (pizzaToppings) {

        pizzaToppings.innerHTML = "";

    }


    const sauce =
        document.querySelector(
            ".pizza-sauce"
        );

    if (sauce) {

        sauce.classList.remove(
            "active"
        );

    }


    const cheese =
        document.querySelector(
            ".pizza-cheese-layer"
        );

    if (cheese) {

        cheese.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   TIMER
   ========================================================= */

function startPizzaTimer() {

    stopPizzaTimer();


    pizzaTimerInterval =
        setInterval(
            () => {

                if (
                    !pizzaGameStarted ||
                    pizzaGameFinished ||
                    pizzaCooking
                ) {

                    return;

                }


                pizzaTimeRemaining -=
                    0.1;


                pizzaTimeRemaining =
                    Math.max(
                        0,
                        pizzaTimeRemaining
                    );


                updatePizzaTimer();

                updatePizzaTimerBar();


                if (
                    pizzaTimeRemaining <=
                    0
                ) {

                    handlePizzaTimeout();

                }

            },
            100
        );

}


function stopPizzaTimer() {

    if (
        pizzaTimerInterval !==
        null
    ) {

        clearInterval(
            pizzaTimerInterval
        );

        pizzaTimerInterval =
            null;

    }

}


/* =========================================================
   TIMEOUT
   ========================================================= */

function handlePizzaTimeout() {

    if (
        !pizzaGameStarted ||
        pizzaGameFinished
    ) {

        return;

    }


    stopPizzaTimer();


    pizzaMistakes++;

    pizzaCombo = 0;


    showPizzaActionMessage(
        "⏰ Tempo scaduto!"
    );


    setTimeout(
        () => {

            if (
                pizzaGameStarted &&
                !pizzaGameFinished
            ) {

                nextPizzaOrder(
                    getPizzaDifficulty()
                );

            }

        },
        500
    );

}


/* =========================================================
   HUD
   ========================================================= */

function updatePizzaHUD() {

    if (pizzaScoreElement) {

        pizzaScoreElement.textContent =
            String(
                pizzaScore
            );

    }


    if (pizzaComboElement) {

        pizzaComboElement.textContent =
            `x${pizzaCombo}`;

    }


    if (pizzaServedElement) {

        pizzaServedElement.textContent =
            String(
                pizzaServed
            );

    }


    updatePizzaTimer();

}


/* =========================================================
   TIMER DISPLAY
   ========================================================= */

function updatePizzaTimer() {

    if (!pizzaTimer) {
        return;
    }


    if (
        pizzaSelectedTimeMode !==
        "timed"
    ) {

        pizzaTimer.textContent =
            "∞";

        return;

    }


    pizzaTimer.textContent =
        pizzaTimeRemaining.toFixed(
            1
        );

}


function updatePizzaTimerBar() {

    if (!pizzaTimerBarFill) {
        return;
    }


    if (
        pizzaSelectedTimeMode !==
        "timed"
    ) {

        pizzaTimerBarFill.style.width =
            "0%";

        return;

    }


    const difficulty =
        getPizzaDifficulty();


    const percentage =
        (
            pizzaTimeRemaining /
            difficulty.orderTime
        ) *
        100;


    pizzaTimerBarFill.style.width =
        `${Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        )}%`;

}


/* =========================================================
   ACTION MESSAGE
   ========================================================= */

function showPizzaActionMessage(
    message
) {

    if (!pizzaActionMessage) {
        return;
    }


    pizzaActionMessage.textContent =
        message;

}


/* =========================================================
   COOKING OVERLAY
   ========================================================= */

function showPizzaCookingOverlay() {

    if (!pizzaCookingOverlay) {
        return;
    }


    pizzaCookingOverlay.hidden =
        false;

}


function hidePizzaCookingOverlay() {

    if (!pizzaCookingOverlay) {
        return;
    }


    pizzaCookingOverlay.hidden =
        true;

}


/* =========================================================
   FINISH
   ========================================================= */

function finishPizzaGame(
    success
) {

    if (pizzaGameFinished) {
        return;
    }


    pizzaGameFinished =
        true;

    pizzaGameStarted =
        false;


    stopPizzaTimer();

    clearPizzaCookTimeout();


    if (pizzaGameScreen) {
        pizzaGameScreen.hidden = true;
    }


    if (pizzaEndScreen) {
        pizzaEndScreen.hidden = false;
    }


    if (success) {

        pizzaEndIcon.textContent =
            "🏆";

        pizzaEndKicker.textContent =
            "ORDINI COMPLETATI";

        pizzaEndTitle.textContent =
            "Servizio impeccabile!";

        pizzaEndMessage.textContent =
            "Hai completato tutto il turno della pizzeria.";

    } else {

        pizzaEndIcon.textContent =
            "🍕";

        pizzaEndKicker.textContent =
            "PIZZERIA CHIUSA";

        pizzaEndTitle.textContent =
            "Turno terminato";

        pizzaEndMessage.textContent =
            "Il servizio è terminato.";

    }


    if (pizzaFinalScore) {

        pizzaFinalScore.textContent =
            String(
                pizzaScore
            );

    }


    if (pizzaFinalServed) {

        pizzaFinalServed.textContent =
            String(
                pizzaServed
            );

    }


    if (pizzaFinalCombo) {

        pizzaFinalCombo.textContent =
            `x${pizzaBestCombo}`;

    }


    if (pizzaFinalMistakes) {

        pizzaFinalMistakes.textContent =
            String(
                pizzaMistakes
            );

    }


    if (pizzaEndBadge) {

        pizzaEndBadge.textContent =
            getPizzaPerformanceMessage();

    }

}


/* =========================================================
   PERFORMANCE
   ========================================================= */

function getPizzaPerformanceMessage() {

    if (
        pizzaBestCombo >= 8 &&
        pizzaMistakes <= 2
    ) {

        return "👨‍🍳 Master Chef!";

    }


    if (
        pizzaBestCombo >= 5
    ) {

        return "🔥 Pizzaiolo Pro!";

    }


    if (
        pizzaServed >= 7
    ) {

        return "⭐ Ottimo pizzaiolo!";

    }


    if (
        pizzaServed >= 4
    ) {

        return "👏 Bel lavoro!";

    }


    return "💪 Continua a impastare!";

}


/* =========================================================
   MENU
   ========================================================= */

function showPizzaMenu() {

    stopPizzaTimer();

    clearPizzaCookTimeout();


    pizzaGameStarted = false;

    pizzaGameFinished = false;

    pizzaCooking = false;


    hidePizzaCookingOverlay();


    if (pizzaGameScreen) {

        pizzaGameScreen.hidden =
            true;

    }


    if (pizzaEndScreen) {

        pizzaEndScreen.hidden =
            true;

    }


    if (pizzaStartScreen) {

        pizzaStartScreen.hidden =
            false;

    }

}


/* =========================================================
   COOK TIMEOUT
   ========================================================= */

function clearPizzaCookTimeout() {

    if (
        pizzaCookTimeout !==
        null
    ) {

        clearTimeout(
            pizzaCookTimeout
        );

        pizzaCookTimeout =
            null;

    }

}


/* =========================================================
   ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                pizzaGameStarted &&
                !pizzaGameFinished
            ) {

                showPizzaMenu();

            }

        }

    }
);