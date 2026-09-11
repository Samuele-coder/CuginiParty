"use strict";

/* =========================================================
   ELEMENTI DOM
========================================================= */

const settingsButton =
    document.getElementById("settingsButton");

const mobileSettingsButton =
    document.getElementById("mobileSettingsButton");

const settingsModal =
    document.getElementById("settingsModal");

const closeSettingsButton =
    document.getElementById("closeSettingsButton");

const closeSettingsButtonBottom =
    document.getElementById("closeSettingsButtonBottom");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mobileMenu =
    document.getElementById("mobileMenu");

const audioToggle =
    document.getElementById("audioToggle");

const themeToggle =
    document.getElementById("themeToggle");

const adminModeButton =
    document.getElementById("adminModeButton");


/* =========================================================
   STORAGE KEYS
========================================================= */

const STORAGE_KEYS = {
    audio: "CuginiParty_audio_enabled",
    darkMode: "CuginiParty_dark_mode"
};


/* =========================================================
   SETTINGS MODAL
========================================================= */

function openSettings() {

    if (!settingsModal) {
        return;
    }

    settingsModal.classList.add(
        "open"
    );

    settingsModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


function closeSettings() {

    if (!settingsModal) {
        return;
    }

    settingsModal.classList.remove(
        "open"
    );

    settingsModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {

    if (!mobileMenu) {
        return;
    }

    mobileMenu.classList.toggle(
        "open"
    );
}


function closeMobileMenu() {

    if (!mobileMenu) {
        return;
    }

    mobileMenu.classList.remove(
        "open"
    );
}


/* =========================================================
   AUDIO
========================================================= */

function loadAudioSetting() {

    if (!audioToggle) {
        return;
    }

    const savedAudio =
        localStorage.getItem(
            STORAGE_KEYS.audio
        );

    if (savedAudio === null) {

        audioToggle.checked =
            true;

        return;
    }

    audioToggle.checked =
        savedAudio === "true";
}


function saveAudioSetting() {

    if (!audioToggle) {
        return;
    }

    const isAudioEnabled =
        audioToggle.checked;

    localStorage.setItem(
        STORAGE_KEYS.audio,
        String(
            isAudioEnabled
        )
    );
}


/* =========================================================
   DARK MODE
========================================================= */

function applyTheme(
    isDark
) {

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    if (themeToggle) {

        themeToggle.checked =
            isDark;
    }
}


function loadThemeSetting() {

    const savedTheme =
        localStorage.getItem(
            STORAGE_KEYS.darkMode
        );

    const isDark =
        savedTheme === "true";

    applyTheme(
        isDark
    );
}


function saveThemeSetting() {

    if (!themeToggle) {
        return;
    }

    const isDark =
        themeToggle.checked;

    localStorage.setItem(
        STORAGE_KEYS.darkMode,
        String(
            isDark
        )
    );

    applyTheme(
        isDark
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        openSettings
    );
}


if (mobileSettingsButton) {

    mobileSettingsButton.addEventListener(
        "click",
        () => {

            closeMobileMenu();

            openSettings();
        }
    );
}


if (closeSettingsButton) {

    closeSettingsButton.addEventListener(
        "click",
        closeSettings
    );
}


if (closeSettingsButtonBottom) {

    closeSettingsButtonBottom.addEventListener(
        "click",
        closeSettings
    );
}


if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        toggleMobileMenu
    );
}


if (audioToggle) {

    audioToggle.addEventListener(
        "change",
        saveAudioSetting
    );
}


if (themeToggle) {

    themeToggle.addEventListener(
        "change",
        saveThemeSetting
    );
}


/* =========================================================
   PULSANTE MODALITÀ ADMIN
========================================================= */

if (adminModeButton) {

    adminModeButton.addEventListener(
        "click",
        () => {

            closeSettings();

            window.location.href =
                "admin/index.html";

        }
    );
}


/* =========================================================
   CHIUSURA MODAL CLICCANDO FUORI
========================================================= */

if (settingsModal) {

    settingsModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                settingsModal
            ) {

                closeSettings();
            }
        }
    );
}


/* =========================================================
   TASTO ESC
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            closeSettings();

            if (
                typeof closeAdminLogin ===
                "function"
            ) {

                closeAdminLogin();

            }

            closeMobileMenu();
        }
    }
);


/* =========================================================
   CHIUSURA MENU MOBILE
========================================================= */

document
    .querySelectorAll(
        ".mobile-menu a"
    )
    .forEach(
        (link) => {

            link.addEventListener(
                "click",
                closeMobileMenu
            );
        }
    );


/* =========================================================
   INIZIALIZZAZIONE
========================================================= */

function initializeApp() {

    loadAudioSetting();

    loadThemeSetting();

}


initializeApp();


/* =========================================================
   CUGINIPARTY - GLOBAL ADMIN CONTROL
   Stato globale + messaggi Admin
========================================================= */

const CUGINIPARTY_ADMIN_REFRESH_MS = 15000;

const CUGINIPARTY_MAINTENANCE_SESSION_KEY =
    "CuginiParty_maintenance_seen";

const CUGINIPARTY_SEEN_MESSAGES_KEY =
    "CuginiParty_seen_public_messages";

const CUGINIPARTY_CLOSED_POPUPS_KEY =
    "CuginiParty_closed_public_popups";


let cuginiPartyAdminSettings = null;
let cuginiPartyAdminMessages = [];

let cuginiPartyAdminRealtime = null;
let cuginiPartyMessagesRealtime = null;
let cuginiPartyGamesRealtime = null;

let cuginiPartyAdminRefreshTimer = null;

// Stato del ciclo corrente: il dismiss vale solo finché la manutenzione
// resta attiva. Non viene usato come stato globale persistente del sito.
let cuginiPartyMaintenanceCycleActive = false;
let cuginiPartyMaintenanceDismissed = false;
let cuginiPartyMaintenanceCycleToken = null;


/* =========================================================
   STORAGE
========================================================= */

function getSessionArray(
    key
) {

    try {

        const value =
            sessionStorage.getItem(
                key
            );

        if (!value) {
            return [];
        }

        const parsed =
            JSON.parse(
                value
            );

        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    } catch {

        return [];

    }

}


function setSessionArray(
    key,
    value
) {

    try {

        sessionStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

    } catch {

        /* ignore */

    }

}


function hasSeenMessage(
    messageId,
    type
) {

    const key =
        `${type}:${messageId}`;

    return getSessionArray(
        CUGINIPARTY_SEEN_MESSAGES_KEY
    ).includes(
        key
    );

}


function markMessageSeen(
    messageId,
    type
) {

    const key =
        `${type}:${messageId}`;

    const seen =
        getSessionArray(
            CUGINIPARTY_SEEN_MESSAGES_KEY
        );


    if (
        !seen.includes(
            key
        )
    ) {

        seen.push(
            key
        );

    }


    setSessionArray(
        CUGINIPARTY_SEEN_MESSAGES_KEY,
        seen
    );

}


function hasClosedPopup(
    messageId
) {

    return getSessionArray(
        CUGINIPARTY_CLOSED_POPUPS_KEY
    ).includes(
        String(
            messageId
        )
    );

}


function markPopupClosed(
    messageId
) {

    const closed =
        getSessionArray(
            CUGINIPARTY_CLOSED_POPUPS_KEY
        );


    const id =
        String(
            messageId
        );


    if (
        !closed.includes(
            id
        )
    ) {

        closed.push(
            id
        );

    }


    setSessionArray(
        CUGINIPARTY_CLOSED_POPUPS_KEY,
        closed
    );

}


/* =========================================================
   OVERLAY GLOBALE
========================================================= */

function createAdminGlobalOverlay() {

    let overlay =
        document.getElementById(
            "cuginiparty-admin-global-overlay"
        );


    if (overlay) {
        return overlay;
    }


    overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "cuginiparty-admin-global-overlay";


    overlay.innerHTML = `
        <div class="cuginiparty-admin-global-box">

            <div
                id="cuginiparty-admin-global-icon"
                class="cuginiparty-admin-global-icon"
            >
                🔧
            </div>

            <div
                id="cuginiparty-admin-global-status"
                class="cuginiparty-admin-global-status"
            >
                CUGINIPARTY
            </div>

            <h1 id="cuginiparty-admin-global-title">
                Servizio temporaneamente non disponibile
            </h1>

            <p id="cuginiparty-admin-global-message">
                Stiamo aggiornando CuginiParty.
            </p>

            <div
                id="cuginiparty-admin-global-end"
                class="cuginiparty-admin-global-end"
            ></div>

            <button
                id="cuginiparty-admin-global-close"
                class="cuginiparty-admin-global-close"
                type="button"
            >
                Continua comunque
            </button>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    const closeButton =
        document.getElementById(
            "cuginiparty-admin-global-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                overlay.dataset.dismissed =
                    "true";

                overlay.classList.remove(
                    "visible"
                );

                cuginiPartyMaintenanceDismissed = true;

                try {
                    sessionStorage.setItem(
                        CUGINIPARTY_MAINTENANCE_SESSION_KEY,
                        cuginiPartyMaintenanceCycleToken || "active"
                    );
                } catch {
                    /* storage non disponibile: il dismiss resta in memoria */
                }

            }
        );

    }


    return overlay;

}


/* =========================================================
   OVERLAY GIOCO BLOCCATO
========================================================= */

function createGameBlockedOverlay() {

    let overlay =
        document.getElementById(
            "cuginiparty-game-blocked-overlay"
        );


    if (overlay) {
        return overlay;
    }


    overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "cuginiparty-game-blocked-overlay";


    overlay.innerHTML = `
        <div class="cuginiparty-game-blocked-box">

            <div
                id="cuginiparty-game-blocked-icon"
                class="cuginiparty-game-blocked-icon"
            >
                🎮
            </div>

            <div
                class="cuginiparty-game-blocked-status"
            >
                GIOCO NON DISPONIBILE
            </div>

            <h1
                id="cuginiparty-game-blocked-title"
            >
                Gioco Chiuso
            </h1>

            <p
                id="cuginiparty-game-blocked-message"
            >
                Questo gioco è temporaneamente non disponibile.
            </p>

            <button
                type="button"
                class="cuginiparty-game-blocked-close"
                id="cuginiparty-game-blocked-home"
            >
                Torna alla Home
            </button>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    const homeButton =
        document.getElementById(
            "cuginiparty-game-blocked-home"
        );


    if (homeButton) {

        homeButton.addEventListener(
            "click",
            () => {

                const isHome =
                    window.location.pathname === "/" ||
                    window.location.pathname.endsWith(
                        "/index.html"
                    );


                if (isHome) {

                    overlay.classList.remove(
                        "visible"
                    );

                    return;

                }


                window.location.href =
                    "../index.html";

            }
        );

    }


    return overlay;

}


/* =========================================================
   CONTAINER MESSAGGI
========================================================= */

function createPublicMessageContainers() {

    let normalContainer =
        document.getElementById(
            "cuginiparty-public-normal-container"
        );


    if (!normalContainer) {

        normalContainer =
            document.createElement(
                "div"
            );

        normalContainer.id =
            "cuginiparty-public-normal-container";

        normalContainer.className =
            "cuginiparty-public-message-stack cuginiparty-public-message-stack-normal";

        document.body.appendChild(
            normalContainer
        );

    }


    let importantContainer =
        document.getElementById(
            "cuginiparty-public-important-container"
        );


    if (!importantContainer) {

        importantContainer =
            document.createElement(
                "div"
            );

        importantContainer.id =
            "cuginiparty-public-important-container";

        importantContainer.className =
            "cuginiparty-public-message-stack cuginiparty-public-message-stack-important";

        document.body.appendChild(
            importantContainer
        );

    }


    let urgentContainer =
        document.getElementById(
            "cuginiparty-public-urgent-container"
        );


    if (!urgentContainer) {

        urgentContainer =
            document.createElement(
                "div"
            );

        urgentContainer.id =
            "cuginiparty-public-urgent-container";

        urgentContainer.className =
            "cuginiparty-public-message-stack cuginiparty-public-message-stack-urgent";

        document.body.appendChild(
            urgentContainer
        );

    }


    let bannerContainer =
        document.getElementById(
            "cuginiparty-public-banner-container"
        );


    if (!bannerContainer) {

        bannerContainer =
            document.createElement(
                "div"
            );

        bannerContainer.id =
            "cuginiparty-public-banner-container";

        bannerContainer.className =
            "cuginiparty-public-banner-container";

        document.body.appendChild(
            bannerContainer
        );

    }


    let popupContainer =
        document.getElementById(
            "cuginiparty-public-popup-container"
        );


    if (!popupContainer) {

        popupContainer =
            document.createElement(
                "div"
            );

        popupContainer.id =
            "cuginiparty-public-popup-container";

        popupContainer.className =
            "cuginiparty-public-popup-container";

        document.body.appendChild(
            popupContainer
        );

    }


    return {
        normalContainer,
        importantContainer,
        urgentContainer,
        bannerContainer,
        popupContainer
    };

}


/* =========================================================
   UTILITY
========================================================= */

function escapeHtmlForPublic(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function getCurrentGameId() {

    const path =
        window.location.pathname
            .toLowerCase();


    const match =
        path.match(
            /\/games\/([^/]+)\.html$/
        );


    if (!match) {
        return null;
    }


    return match[1];

}


function isHomePage() {

    const pathname =
        window.location.pathname
            .toLowerCase();


    return (
        pathname === "/" ||
        pathname.endsWith("/index.html") ||
        !pathname.includes("/games/")
    );

}


function isPublicMessageVisible(
    message
) {

    if (
        !message ||
        !message.active
    ) {

        return false;

    }


    if (
        message.scheduled_start
    ) {

        const scheduledTime =
            new Date(
                message.scheduled_start
            ).getTime();


        if (
            Number.isNaN(
                scheduledTime
            ) ||
            scheduledTime >
                Date.now()
        ) {

            return false;

        }

    }


    if (
        message.scheduled_end
    ) {

        const expiresTime =
            new Date(
                message.scheduled_end
            ).getTime();


        if (
            Number.isNaN(
                expiresTime
            ) ||
            expiresTime <=
                Date.now()
        ) {

            return false;

        }

    }


    if (
        message.game_id
    ) {

        const currentGame =
            getCurrentGameId();


        if (
            currentGame !==
            String(
                message.game_id
            ).toLowerCase()
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   CREA MESSAGGIO STANDARD
========================================================= */

function createStandardPublicMessage(
    message
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "cuginiparty-public-message";


    item.classList.add(
        `message-${message.type || "normal"}`
    );


    item.dataset.messageId =
        String(
            message.id
        );


    const icon =
        message.type === "important"
            ? "⚠️"
            : message.type === "urgent"
                ? "🚨"
                : "📢";


    item.innerHTML = `
        <div class="cuginiparty-public-message-icon">
            ${icon}
        </div>

        <div class="cuginiparty-public-message-content">

            <div class="cuginiparty-public-message-title">
                ${escapeHtmlForPublic(
                    message.title ||
                    "Comunicazione CuginiParty"
                )}
            </div>

            <div class="cuginiparty-public-message-text">
                ${escapeHtmlForPublic(
                    message.message ||
                    ""
                )}
            </div>

        </div>

        <button
            type="button"
            class="cuginiparty-public-message-close"
            aria-label="Chiudi messaggio"
        >
            ×
        </button>
    `;


    const closeButton =
        item.querySelector(
            ".cuginiparty-public-message-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                item.remove();

            }
        );

    }


    return item;

}


/* =========================================================
   RENDER MESSAGGI
========================================================= */

function renderPublicMessages() {

    const {
        normalContainer,
        importantContainer,
        urgentContainer,
        bannerContainer,
        popupContainer
    } =
        createPublicMessageContainers();


    const visibleMessages =
        cuginiPartyAdminMessages
            .filter(
                isPublicMessageVisible
            );


    const normalMessages =
        visibleMessages.filter(
            message =>
                (
                    message.type === "normal" ||
                    !message.type
                )
        );


    const importantMessages =
        visibleMessages.filter(
            message =>
                message.type === "important"
        );


    const urgentMessages =
        visibleMessages.filter(
            message =>
                message.type === "urgent"
        );


    const bannerMessages =
        visibleMessages.filter(
            message =>
                message.type === "banner"
        );


    const popupMessages =
        visibleMessages.filter(
            message =>
                message.type === "popup"
        );


    /* =====================================================
       NORMALE
       Una volta per sessione.
       Se è già presente nel DOM, NON lo ricreiamo.
    ===================================================== */

    normalMessages.forEach(
        message => {

            const messageId =
                String(
                    message.id
                );


            const existing =
                normalContainer.querySelector(
                    `[data-message-id="${messageId}"]`
                );


            if (existing) {

                return;

            }


            if (
                hasSeenMessage(
                    message.id,
                    "normal"
                )
            ) {

                return;

            }


            const item =
                createStandardPublicMessage(
                    message
                );


            normalContainer.appendChild(
                item
            );


            markMessageSeen(
                message.id,
                "normal"
            );

        }
    );


    /* =====================================================
       IMPORTANTE
       Una volta per sessione.
    ===================================================== */

    importantMessages.forEach(
        message => {

            const messageId =
                String(
                    message.id
                );


            const existing =
                importantContainer.querySelector(
                    `[data-message-id="${messageId}"]`
                );


            if (existing) {

                return;

            }


            if (
                hasSeenMessage(
                    message.id,
                    "important"
                )
            ) {

                return;

            }


            const item =
                createStandardPublicMessage(
                    message
                );


            importantContainer.appendChild(
                item
            );


            markMessageSeen(
                message.id,
                "important"
            );

        }
    );


    /* =====================================================
       URGENTE
       Una volta per sessione.
       Un nuovo messaggio urgente può comparire
       immediatamente tramite Realtime.
    ===================================================== */

    urgentMessages.forEach(
        message => {

            const messageId =
                String(
                    message.id
                );


            const existing =
                urgentContainer.querySelector(
                    `[data-message-id="${messageId}"]`
                );


            if (existing) {

                return;

            }


            if (
                hasSeenMessage(
                    message.id,
                    "urgent"
                )
            ) {

                return;

            }


            const item =
                createStandardPublicMessage(
                    message
                );


            urgentContainer.appendChild(
                item
            );


            markMessageSeen(
                message.id,
                "urgent"
            );

        }
    );


    /* =====================================================
       BANNER
       Rimane finché il messaggio è attivo.
    ===================================================== */

    const activeBannerIds =
        new Set(
            bannerMessages.map(
                message =>
                    String(
                        message.id
                    )
            )
        );


    bannerContainer
        .querySelectorAll(
            "[data-message-id]"
        )
        .forEach(
            element => {

                const id =
                    String(
                        element.dataset.messageId
                    );


                if (
                    !activeBannerIds.has(
                        id
                    )
                ) {

                    element.remove();

                }

            }
        );


    bannerMessages.forEach(
        message => {

            const messageId =
                String(
                    message.id
                );


            const existing =
                bannerContainer.querySelector(
                    `[data-message-id="${messageId}"]`
                );


            if (existing) {

                return;

            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "cuginiparty-public-banner";


            item.dataset.messageId =
                messageId;


            item.innerHTML = `
                <div class="cuginiparty-public-banner-icon">
                    📌
                </div>

                <div class="cuginiparty-public-banner-content">

                    <strong>
                        ${escapeHtmlForPublic(
                            message.title ||
                            "Comunicazione CuginiParty"
                        )}
                    </strong>

                    <span>
                        ${escapeHtmlForPublic(
                            message.message ||
                            ""
                        )}
                    </span>

                </div>
            `;


            bannerContainer.appendChild(
                item
            );

        }
    );


    /* =====================================================
       POPUP
       Rimane finché l'utente lo chiude.
       NON viene ricreato ad ogni refresh.
    ===================================================== */

    const activePopupIds =
        new Set(
            popupMessages.map(
                message =>
                    String(
                        message.id
                    )
            )
        );


    popupContainer
        .querySelectorAll(
            "[data-message-id]"
        )
        .forEach(
            element => {

                const id =
                    String(
                        element.dataset.messageId
                    );


                if (
                    !activePopupIds.has(
                        id
                    ) ||
                    hasClosedPopup(id)
                ) {

                    element.remove();

                }

            }
        );


    popupMessages.forEach(
        message => {

            if (
                hasClosedPopup(
                    message.id
                )
            ) {

                return;

            }


            const messageId =
                String(
                    message.id
                );


            const existing =
                popupContainer.querySelector(
                    `[data-message-id="${messageId}"]`
                );


            if (existing) {

                return;

            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "cuginiparty-public-popup-backdrop";


            item.dataset.messageId =
                messageId;


            item.innerHTML = `
                <div
                    class="cuginiparty-public-popup"
                    role="dialog"
                    aria-modal="true"
                >

                    <div
                        class="cuginiparty-public-popup-icon"
                    >
                        📢
                    </div>

                    <div
                        class="cuginiparty-public-popup-title"
                    >
                        ${escapeHtmlForPublic(
                            message.title ||
                            "Comunicazione CuginiParty"
                        )}
                    </div>

                    <div
                        class="cuginiparty-public-popup-text"
                    >
                        ${escapeHtmlForPublic(
                            message.message ||
                            ""
                        )}
                    </div>

                    <button
                        type="button"
                        class="cuginiparty-public-popup-close"
                    >
                        Chiudi
                    </button>

                </div>
            `;


            const closeButton =
                item.querySelector(
                    ".cuginiparty-public-popup-close"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    () => {

                        markPopupClosed(
                            message.id
                        );

                        item.remove();

                    }
                );

            }


            popupContainer.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   CONTROLLO GIOCHI
========================================================= */

let cuginiPartyAdminGames = [];


function getAdminGameById(
    gameId
) {

    if (!gameId) {
        return null;
    }


    return cuginiPartyAdminGames.find(
        game =>
            String(
                game.game_id
            ).toLowerCase() ===
            String(
                gameId
            ).toLowerCase()
    ) || null;

}


function getGameLinkId(
    link
) {

    if (!link) {
        return null;
    }


    const href =
        link.getAttribute(
            "href"
        );


    if (!href) {
        return null;
    }


    const match =
        href.match(
            /(?:^|\/)games\/([^/?#]+)\.html(?:[?#].*)?$/i
        );


    if (!match) {
        return null;
    }


    return String(
        match[1]
    ).toLowerCase();

}


function getGameActionElement(
    link
) {

    if (!link) {
        return null;
    }


    const candidates =
        link.querySelectorAll(
            "button, .game-button, .play-button, span, strong"
        );


    for (
        const candidate of candidates
    ) {

        const text =
            String(
                candidate.textContent ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            text === "GIOCA" ||
            text === "PLAY"
        ) {

            return candidate;

        }

    }


    return null;

}


function applyGameLinkState(
    link,
    game
) {

    const disabled =
        Boolean(
            game &&
            game.enabled === false
        );


    const actionElement =
        getGameActionElement(
            link
        );


    if (
        disabled
    ) {

        if (
            !link.dataset.cuginiPartyOriginalText
        ) {

            link.dataset.cuginiPartyOriginalText =
                actionElement
                    ? actionElement.textContent
                    : link.textContent;

        }


        if (actionElement) {

            actionElement.textContent =
                "Gioco Chiuso";

        } else {

            link.textContent =
                "Gioco Chiuso";

        }


        link.dataset.cuginiPartyGameBlocked =
            "true";


        link.setAttribute(
            "aria-disabled",
            "true"
        );


        link.classList.add(
            "cuginiparty-game-link-blocked"
        );


        link.style.pointerEvents =
            "none";


        link.style.cursor =
            "not-allowed";


        return;

    }


    if (
        link.dataset.cuginiPartyOriginalText
    ) {

        if (actionElement) {

            actionElement.textContent =
                link.dataset.cuginiPartyOriginalText;

        } else {

            link.textContent =
                link.dataset.cuginiPartyOriginalText;

        }

    }


    delete link.dataset.cuginiPartyOriginalText;


    link.dataset.cuginiPartyGameBlocked =
        "false";


    link.removeAttribute(
        "aria-disabled"
    );


    link.classList.remove(
        "cuginiparty-game-link-blocked"
    );


    link.style.pointerEvents =
        "";


    link.style.cursor =
        "";

}


function renderGameLinkStates() {

    const links =
        document.querySelectorAll(
            "a[href]"
        );


    links.forEach(
        link => {

            const gameId =
                getGameLinkId(
                    link
                );


            if (!gameId) {
                return;
            }


            const game =
                getAdminGameById(
                    gameId
                );


            if (!game) {
                return;
            }


            applyGameLinkState(
                link,
                game
            );

        }
    );

}


function showGameBlockedOverlay(
    game
) {

    if (
        isHomePage()
    ) {

        return;

    }


    const currentGame =
        getCurrentGameId();


    if (!currentGame) {
        return;
    }


    const gameSettings =
        game ||
        getAdminGameById(
            currentGame
        );


    if (
        !gameSettings ||
        gameSettings.enabled !== false
    ) {

        hideGameBlockedOverlay();

        return;

    }


    const overlay =
        createGameBlockedOverlay();


    const icon =
        document.getElementById(
            "cuginiparty-game-blocked-icon"
        );

    const title =
        document.getElementById(
            "cuginiparty-game-blocked-title"
        );

    const message =
        document.getElementById(
            "cuginiparty-game-blocked-message"
        );


    if (icon) {

        icon.textContent =
            "⛔";

    }


    if (title) {

        title.textContent =
            "Gioco Chiuso";

    }


    if (message) {

        message.textContent =
            gameSettings.disabled_message ||
            "Questo gioco è temporaneamente non disponibile.";

    }


    overlay.classList.add(
        "visible"
    );

}


function hideGameBlockedOverlay() {

    const overlay =
        document.getElementById(
            "cuginiparty-game-blocked-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "visible"
    );

}


function applyCuginiPartyGameSettings(
    games
) {

    cuginiPartyAdminGames =
        Array.isArray(
            games
        )
            ? games
            : [];


    renderGameLinkStates();


    const currentGame =
        getCurrentGameId();


    if (!currentGame) {

        hideGameBlockedOverlay();

        return;

    }


    const game =
        getAdminGameById(
            currentGame
        );


    if (
        game &&
        game.enabled === false
    ) {

        showGameBlockedOverlay(
            game
        );

    } else {

        hideGameBlockedOverlay();

    }

}


async function loadCuginiPartyAdminGames() {

    if (
        !window.supabaseClient
    ) {

        return [];

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("site_games")
                .select(`
                    game_id,
                    enabled,
                    disabled_message,
                    updated_at
                `)
                .order(
                    "game_id",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "CuginiParty site_games:",
                error
            );

            return [];

        }


        cuginiPartyAdminGames =
            data || [];


        applyCuginiPartyGameSettings(
            cuginiPartyAdminGames
        );


        return cuginiPartyAdminGames;

    } catch (error) {

        console.error(
            "CuginiParty giochi:",
            error
        );

        return [];

    }

}


/* =========================================================
   CSS
========================================================= */

function injectAdminGlobalStyles() {

    if (
        document.getElementById(
            "cuginiparty-admin-global-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "cuginiparty-admin-global-styles";


    style.textContent = `

        /* =============================================
           OVERLAY MANUTENZIONE / EMERGENZA
        ============================================= */

        #cuginiparty-admin-global-overlay {

            position: fixed;
            inset: 0;
            z-index: 999999;

            display: none;

            align-items: center;
            justify-content: center;

            padding: 24px;

            background:
                rgba(8, 10, 20, 0.92);

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);

            box-sizing: border-box;

        }


        #cuginiparty-admin-global-overlay.visible {

            display: flex;

        }


        .cuginiparty-admin-global-box {

            width: min(
                620px,
                100%
            );

            max-width:
                100%;

            box-sizing:
                border-box;

            padding: 42px;

            border-radius: 28px;

            text-align: center;

            background:
                linear-gradient(
                    145deg,
                    rgba(35, 38, 58, 0.98),
                    rgba(18, 20, 34, 0.98)
                );

            border:
                1px solid
                rgba(255,255,255,0.12);

            box-shadow:
                0 30px 90px
                rgba(0,0,0,0.55);

            color:
                #ffffff;

        }


        .cuginiparty-admin-global-icon {

            font-size:
                64px;

            margin-bottom:
                14px;

        }


        .cuginiparty-admin-global-status {

            font-size:
                16px;

            font-weight:
                900;

            letter-spacing:
                0.12em;

            opacity:
                0.72;

            margin-bottom:
                12px;

        }


        .cuginiparty-admin-global-box h1 {

            margin:
                0 0 14px;

            font-size:
                clamp(28px, 5vw, 44px);

            line-height:
                1.08;

            overflow-wrap:
                anywhere;

        }


        .cuginiparty-admin-global-box p {

            margin:
                0 auto 18px;

            max-width:
                520px;

            line-height:
                1.6;

            color:
                rgba(255,255,255,0.72);

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

        }


        .cuginiparty-admin-global-end {

            margin-bottom:
                22px;

            font-size:
                14px;

            color:
                rgba(255,255,255,0.58);

        }


        .cuginiparty-admin-global-close {

            border:
                0;

            border-radius:
                14px;

            padding:
                16px 30px;

            font-size:
                17px;

            font-weight:
                800;

            cursor:
                pointer;

            background:
                rgba(255,255,255,0.10);

            color:
                #ffffff;

        }


        .cuginiparty-admin-global-close:hover {

            background:
                rgba(255,255,255,0.16);

        }


        #cuginiparty-admin-global-overlay.blocked
        .cuginiparty-admin-global-close {

            display:
                none;

        }


        /* =============================================
           GIOCO BLOCCATO
        ============================================= */

        #cuginiparty-game-blocked-overlay {

            position:
                fixed;

            inset:
                0;

            z-index:
                999999;

            display:
                none;

            align-items:
                center;

            justify-content:
                center;

            padding:
                24px;

            box-sizing:
                border-box;

            background:
                rgba(8,10,20,0.94);

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);

        }


        #cuginiparty-game-blocked-overlay.visible {

            display:
                flex;

        }


        .cuginiparty-game-blocked-box {

            width:
                min(
                    620px,
                    100%
                );

            max-width:
                100%;

            box-sizing:
                border-box;

            padding:
                42px;

            border-radius:
                28px;

            text-align:
                center;

            background:
                linear-gradient(
                    145deg,
                    rgba(35,38,58,0.98),
                    rgba(18,20,34,0.98)
                );

            border:
                1px solid
                rgba(255,255,255,0.12);

            box-shadow:
                0 30px 90px
                rgba(0,0,0,0.55);

            color:
                #ffffff;

        }


        .cuginiparty-game-blocked-icon {

            font-size:
                64px;

            margin-bottom:
                14px;

        }


        .cuginiparty-game-blocked-status {

            font-size:
                16px;

            font-weight:
                900;

            letter-spacing:
                0.12em;

            opacity:
                0.72;

            margin-bottom:
                12px;

        }


        .cuginiparty-game-blocked-box h1 {

            margin:
                0 0 14px;

            font-size:
                clamp(30px, 5vw, 46px);

            line-height:
                1.08;

            overflow-wrap:
                anywhere;

        }


        .cuginiparty-game-blocked-box p {

            margin:
                0 auto 24px;

            max-width:
                520px;

            line-height:
                1.6;

            color:
                rgba(255,255,255,0.74);

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

        }


        .cuginiparty-game-blocked-close {

            border:
                0;

            border-radius:
                14px;

            padding:
                15px 28px;

            font-size:
                16px;

            font-weight:
                800;

            cursor:
                pointer;

            background:
                rgba(255,255,255,0.12);

            color:
                #ffffff;

        }


        .cuginiparty-game-blocked-close:hover {

            background:
                rgba(255,255,255,0.17);

        }


        /* =============================================
           LINK GIOCO BLOCCATO
        ============================================= */

        .cuginiparty-game-link-blocked {

            opacity:
                0.62;

        }


        /* =============================================
           CONTENITORI MESSAGGI
        ============================================= */

        .cuginiparty-public-message-stack {

            position:
                fixed;

            top:
                88px;

            left:
                50%;

            transform:
                translateX(-50%);

            width:
                min(720px, calc(100vw - 32px));

            max-width:
                calc(100vw - 32px);

            box-sizing:
                border-box;

            display:
                flex;

            flex-direction:
                column;

            gap:
                12px;

            z-index:
                999996;

            pointer-events:
                none;

        }


        /* =============================================
           MESSAGGI NORMALI / IMPORTANTI / URGENTI
        ============================================= */

        .cuginiparty-public-message {

            display:
                flex;

            align-items:
                flex-start;

            gap:
                14px;

            width:
                100%;

            max-width:
                100%;

            box-sizing:
                border-box;

            padding:
                17px 18px;

            border-radius:
                18px;

            color:
                #ffffff;

            box-shadow:
                0 18px 50px
                rgba(0,0,0,0.28);

            backdrop-filter:
                blur(14px);

            pointer-events:
                auto;

        }


        .message-normal {

            background:
                rgba(30,34,52,0.97);

            border:
                1px solid
                rgba(255,255,255,0.12);

        }


        .message-important {

            background:
                rgba(112,82,16,0.97);

            border:
                1px solid
                rgba(255,208,82,0.55);

        }


        .message-urgent {

            background:
                rgba(120,30,32,0.98);

            border:
                1px solid
                rgba(255,105,105,0.65);

            box-shadow:
                0 18px 55px
                rgba(150,20,20,0.34);

        }


        .cuginiparty-public-message-icon {

            flex:
                0 0 auto;

            font-size:
                28px;

            line-height:
                1;

        }


        .cuginiparty-public-message-content {

            flex:
                1 1 auto;

            min-width:
                0;

            width:
                0;

            max-width:
                100%;

            box-sizing:
                border-box;

        }


        .cuginiparty-public-message-title {

            font-size:
                16px;

            font-weight:
                900;

            margin-bottom:
                5px;

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

        }


        .cuginiparty-public-message-text {

            line-height:
                1.5;

            color:
                rgba(255,255,255,0.80);

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

            white-space:
                normal;

        }


        .cuginiparty-public-message-close {

            flex:
                0 0 auto;

            border:
                0;

            background:
                transparent;

            color:
                rgba(255,255,255,0.72);

            font-size:
                24px;

            line-height:
                1;

            cursor:
                pointer;

            padding:
                0;

        }


        /* =============================================
           BANNER
        ============================================= */

        .cuginiparty-public-banner-container {

            position:
                fixed;

            top:
                0;

            left:
                0;

            right:
                0;

            width:
                100%;

            box-sizing:
                border-box;

            z-index:
                999997;

            display:
                flex;

            flex-direction:
                column;

            gap:
                2px;

            pointer-events:
                none;

        }


        .cuginiparty-public-banner {

            display:
                flex;

            align-items:
                flex-start;

            gap:
                12px;

            width:
                100%;

            max-width:
                100%;

            box-sizing:
                border-box;

            padding:
                12px 20px;

            background:
                rgba(41,121,255,0.97);

            color:
                #ffffff;

            box-shadow:
                0 8px 28px
                rgba(0,0,0,0.22);

            pointer-events:
                auto;

        }


        .cuginiparty-public-banner-icon {

            flex:
                0 0 auto;

            font-size:
                22px;

            line-height:
                1.3;

        }


        .cuginiparty-public-banner-content {

            flex:
                1 1 auto;

            min-width:
                0;

            width:
                0;

            max-width:
                100%;

            box-sizing:
                border-box;

            display:
                flex;

            flex-direction:
                column;

            gap:
                2px;

        }


        .cuginiparty-public-banner-content strong {

            font-weight:
                900;

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

        }


        .cuginiparty-public-banner-content span {

            line-height:
                1.35;

            opacity:
                0.92;

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

            white-space:
                normal;

        }


        /* =============================================
           POPUP
        ============================================= */

        .cuginiparty-public-popup-container {

            position:
                fixed;

            inset:
                0;

            z-index:
                999998;

            pointer-events:
                none;

        }


        .cuginiparty-public-popup-backdrop {

            position:
                absolute;

            inset:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            padding:
                24px;

            box-sizing:
                border-box;

            background:
                rgba(8,10,20,0.74);

            backdrop-filter:
                blur(10px);

            -webkit-backdrop-filter:
                blur(10px);

            pointer-events:
                auto;

        }


        .cuginiparty-public-popup {

            width:
                min(560px, calc(100vw - 32px));

            max-width:
                100%;

            max-height:
                calc(100vh - 48px);

            box-sizing:
                border-box;

            padding:
                34px;

            border-radius:
                26px;

            text-align:
                center;

            overflow-y:
                auto;

            overflow-x:
                hidden;

            background:
                linear-gradient(
                    145deg,
                    rgba(30,34,52,0.99),
                    rgba(16,18,30,0.99)
                );

            border:
                1px solid
                rgba(255,255,255,0.14);

            box-shadow:
                0 30px 90px
                rgba(0,0,0,0.52);

            color:
                #ffffff;

        }


        .cuginiparty-public-popup-icon {

            font-size:
                52px;

            margin-bottom:
                12px;

        }


        .cuginiparty-public-popup-title {

            font-size:
                28px;

            font-weight:
                900;

            margin-bottom:
                10px;

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

        }


        .cuginiparty-public-popup-text {

            line-height:
                1.6;

            color:
                rgba(255,255,255,0.76);

            margin-bottom:
                24px;

            max-width:
                100%;

            overflow-wrap:
                anywhere;

            word-break:
                break-word;

            white-space:
                normal;

        }


        .cuginiparty-public-popup-close {

            border:
                0;

            border-radius:
                14px;

            padding:
                13px 28px;

            font-size:
                16px;

            font-weight:
                800;

            cursor:
                pointer;

            background:
                rgba(255,255,255,0.12);

            color:
                #ffffff;

        }


        /* =============================================
           MOBILE
        ============================================= */

        @media (max-width: 600px) {

            .cuginiparty-admin-global-box {

                width:
                    100%;

                padding:
                    30px 22px;

                border-radius:
                    22px;

            }


            .cuginiparty-game-blocked-box {

                width:
                    100%;

                padding:
                    30px 22px;

                border-radius:
                    22px;

            }


            .cuginiparty-public-message-stack {

                top:
                    76px;

                width:
                    calc(100vw - 20px);

                max-width:
                    calc(100vw - 20px);

            }


            .cuginiparty-public-message {

                padding:
                    14px;

                gap:
                    10px;

            }


            .cuginiparty-public-message-icon {

                font-size:
                    24px;

            }


            .cuginiparty-public-message-title {

                font-size:
                    15px;

            }


            .cuginiparty-public-message-text {

                font-size:
                    14px;

            }


            .cuginiparty-public-banner {

                padding:
                    10px 12px;

            }


            .cuginiparty-public-banner-content {

                font-size:
                    14px;

            }


            .cuginiparty-public-popup-backdrop {

                padding:
                    12px;

            }


            .cuginiparty-public-popup {

                width:
                    calc(100vw - 24px);

                max-height:
                    calc(100vh - 24px);

                padding:
                    26px 20px;

            }


            .cuginiparty-public-popup-title {

                font-size:
                    23px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   FORMAT DATA
========================================================= */

function formatAdminEndTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return (
        "Fine prevista: " +
        date.toLocaleString(
            "it-IT",
            {
                dateStyle:
                    "short",

                timeStyle:
                    "short"
            }
        )
    );

}


/* =========================================================
   APPLICA IMPOSTAZIONI GLOBALI
========================================================= */

function applyCuginiPartyAdminSettings(
    settings
) {

    if (!settings) {
        return;
    }


    cuginiPartyAdminSettings =
        settings;


    const overlay =
        createAdminGlobalOverlay();


    const icon =
        document.getElementById(
            "cuginiparty-admin-global-icon"
        );

    const status =
        document.getElementById(
            "cuginiparty-admin-global-status"
        );

    const title =
        document.getElementById(
            "cuginiparty-admin-global-title"
        );

    const message =
        document.getElementById(
            "cuginiparty-admin-global-message"
        );

    const end =
        document.getElementById(
            "cuginiparty-admin-global-end"
        );


    const declaredStatus = String(settings.global_status || "").toLowerCase();
    const totalBlock = settings.total_block_enabled === true || declaredStatus === "offline";
    const emergency = !totalBlock && (settings.emergency_enabled === true || declaredStatus === "emergency");
    const maintenance = !totalBlock && !emergency && (
        settings.maintenance_enabled === true || declaredStatus === "maintenance"
    );


    /* Il dismiss vale solo per il ciclo attivo; il passaggio a ONLINE
       azzera esplicitamente lo stato, così una nuova attivazione riapre
       sempre l'overlay anche dopo più cicli Realtime consecutivi. */
    if (!maintenance) {

        cuginiPartyMaintenanceCycleActive = false;
        cuginiPartyMaintenanceDismissed = false;
        cuginiPartyMaintenanceCycleToken = null;

        try {

            sessionStorage.removeItem(
                CUGINIPARTY_MAINTENANCE_SESSION_KEY
            );

        } catch {

            /* storage non disponibile: l'overlay resta comunque idempotente */

        }

    }


    /* =============================================
       BLOCCO TOTALE
    ============================================= */

    if (totalBlock) {

        overlay.classList.add(
            "visible",
            "blocked"
        );


        overlay.dataset.dismissed =
            "false";


        icon.textContent =
            "⛔";

        status.textContent =
            "ACCESSO BLOCCATO";

        title.textContent =
            "CuginiParty è temporaneamente bloccato";

        message.textContent =
            "L'accesso al sito è stato temporaneamente disabilitato dall'amministratore.";

        end.textContent =
            "";

        return;

    }


    /* =============================================
       EMERGENZA
    ============================================= */

    if (emergency) {

        overlay.classList.add(
            "visible",
            "blocked"
        );


        overlay.dataset.dismissed =
            "false";


        icon.textContent =
            "🚨";

        status.textContent =
            "EMERGENZA";

        title.textContent =
            settings.emergency_title ||
            "CuginiParty è in modalità emergenza";

        message.textContent =
            settings.emergency_message ||
            "I giochi e le attività online sono temporaneamente bloccati.";

        end.textContent =
            "";

        return;

    }


    /* =============================================
       MANUTENZIONE
    ============================================= */

    if (maintenance) {

        overlay.classList.remove(
            "blocked"
        );

        const nextCycleToken = String(
            settings.updated_at ||
            `${settings.maintenance_title || ""}|${settings.maintenance_message || ""}|${settings.maintenance_end_time || ""}`
        );

        if (
            !cuginiPartyMaintenanceCycleActive ||
            cuginiPartyMaintenanceCycleToken !== nextCycleToken
        ) {
            cuginiPartyMaintenanceCycleActive = true;
            cuginiPartyMaintenanceCycleToken = nextCycleToken;
            try {
                cuginiPartyMaintenanceDismissed =
                    sessionStorage.getItem(CUGINIPARTY_MAINTENANCE_SESSION_KEY) === nextCycleToken;
            } catch {
                cuginiPartyMaintenanceDismissed = false;
            }
        }

        if (!cuginiPartyMaintenanceDismissed) {

            overlay.classList.add(
                "visible"
            );

            overlay.dataset.dismissed =
                "false";

        } else {

            overlay.classList.remove(
                "visible"
            );

            overlay.dataset.dismissed =
                "true";

        }


        icon.textContent =
            "🔧";

        status.textContent =
            "MANUTENZIONE";

        title.textContent =
            settings.maintenance_title ||
            "Manutenzione in corso";

        message.textContent =
            settings.maintenance_message ||
            "CuginiParty è temporaneamente in manutenzione.";

        end.textContent =
            formatAdminEndTime(
                settings.maintenance_end_time
            );

        return;

    }


    /* =============================================
       ONLINE
    ============================================= */

    overlay.classList.remove(
        "visible",
        "blocked"
    );

    overlay.dataset.dismissed =
        "false";


    /* Il blocco globale giochi dipende dalle settings, non dai record
       individuali: al cambio settings aggiorna anche card e gioco aperto. */
    if (typeof renderGameLinkStates === "function") {
        renderGameLinkStates();
    }

    const currentGameId =
        typeof getCurrentGameId === "function"
            ? getCurrentGameId()
            : null;

    if (currentGameId && typeof showGameBlockedOverlay === "function") {
        showGameBlockedOverlay(getPublicGameRecord(currentGameId));
    }

}


/* =========================================================
   CARICA SETTINGS
========================================================= */

async function loadCuginiPartyAdminSettings() {

    if (
        !window.supabaseClient
    ) {

        console.warn(
            "CuginiParty: supabaseClient non disponibile."
        );

        return null;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("site_settings")
                .select(`
                    id,
                    maintenance_enabled,
                    maintenance_title,
                    maintenance_message,
                    maintenance_end_time,
                    emergency_enabled,
                    emergency_title,
                    emergency_message,
                    total_block_enabled,
                    multiplayer_enabled,
                    new_rooms_enabled,
                    global_status,
                    updated_at
                `)
                .eq(
                    "id",
                    1
                )
                .maybeSingle();


        if (error) {

            console.error(
                "CuginiParty site_settings:",
                error
            );

            return null;

        }


        if (!data) {
            return null;
        }


        applyCuginiPartyAdminSettings(
            data
        );


        return data;

    } catch (error) {

        console.error(
            "CuginiParty stato globale:",
            error
        );

        return null;

    }

}


/* =========================================================
   CARICA MESSAGGI
========================================================= */

async function loadCuginiPartyAdminMessages() {

    if (
        !window.supabaseClient
    ) {

        return [];

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("site_messages")
                .select(`
                    id,
                    type,
                    title,
                    message,
                    active,
                    persistent,
                    target,
                    game_id,
                    scheduled_start,
                    scheduled_end,
                    created_at
                `)
                .eq(
                    "active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                "CuginiParty site_messages:",
                error
            );

            return [];

        }


        cuginiPartyAdminMessages =
            data || [];


        renderPublicMessages();


        return cuginiPartyAdminMessages;


    } catch (error) {

        console.error(
            "CuginiParty messaggi:",
            error
        );

        return [];

    }

}


/* =========================================================
   REALTIME SETTINGS
========================================================= */

function startCuginiPartyAdminRealtime() {

    if (
        !window.supabaseClient
    ) {

        return;

    }


    if (
        cuginiPartyAdminRealtime
    ) {

        try {

            window.supabaseClient
                .removeChannel(
                    cuginiPartyAdminRealtime
                );

        } catch {

            /* ignore */

        }

    }


    cuginiPartyAdminRealtime =
        window.supabaseClient
            .channel(
                "cuginiparty-public-admin-settings"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "site_settings"
                },
                payload => {

                    const nextSettings =
                        payload.new;


                    if (
                        nextSettings &&
                        Number(
                            nextSettings.id
                        ) ===
                            1
                    ) {

                        applyCuginiPartyAdminSettings(
                            nextSettings
                        );

                    }

                }
            )
            .subscribe();

}


/* =========================================================
   REALTIME MESSAGGI
========================================================= */

function startCuginiPartyMessagesRealtime() {

    if (
        !window.supabaseClient
    ) {

        return;

    }


    if (
        cuginiPartyMessagesRealtime
    ) {

        try {

            window.supabaseClient
                .removeChannel(
                    cuginiPartyMessagesRealtime
                );

        } catch {

            /* ignore */

        }

    }


    cuginiPartyMessagesRealtime =
        window.supabaseClient
            .channel(
                "cuginiparty-public-admin-messages"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "site_messages"
                },
                async () => {

                    await loadCuginiPartyAdminMessages();

                }
            )
            .subscribe();

}


/* =========================================================
   REALTIME GIOCHI
========================================================= */

function startCuginiPartyGamesRealtime() {

    if (
        !window.supabaseClient
    ) {

        return;

    }


    if (
        cuginiPartyGamesRealtime
    ) {

        try {

            window.supabaseClient
                .removeChannel(
                    cuginiPartyGamesRealtime
                );

        } catch {

            /* ignore */

        }

    }


    cuginiPartyGamesRealtime =
        window.supabaseClient
            .channel(
                "cuginiparty-public-admin-games"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "site_games"
                },
                async () => {

                    await loadCuginiPartyAdminGames();

                }
            )
            .subscribe();

}


/* =========================================================
   AVVIO
========================================================= */

/* =========================================================
   PUBLIC ADMIN V2 ADAPTER
   Legge lo schema site_* e lascia intatto il fallback statico.
========================================================= */

const CUGINIPARTY_PUBLIC_STATUSES = ["available", "coming_soon", "maintenance"];
let cuginiPartyPublicAdminV2Records = [];
const cuginiPartyPublicStaticCards = new Map();

function publicGameMeta(gameId) {
    const fallback = {
        game_id: gameId,
        name: gameId,
        enabled: true,
        visible: true,
        status: "available"
    };
    const card = Array.from(document.querySelectorAll("[data-game-id]")).find(item => item.dataset.gameId === gameId);
    if (card) {
        fallback.name = card.querySelector("h3")?.textContent.trim() || fallback.name;
        fallback.path = card.querySelector("a[href]")?.getAttribute("href") || null;
        fallback.description = card.querySelector(".game-card-content p")?.textContent.trim() || "";
    }
    return fallback;
}

function normalizePublicGame(game) {
    const gameId = String(game.game_id || "").trim().toLowerCase();
    const fallback = publicGameMeta(gameId);
    const rawStatus = String(game.status || "").toLowerCase();
    const status = CUGINIPARTY_PUBLIC_STATUSES.includes(rawStatus)
        ? rawStatus
        : (game.enabled === false ? "maintenance" : "available");
    return {
        ...fallback,
        ...game,
        game_id: gameId || fallback.game_id,
        visible: game.visible !== false,
        status
    };
}

function effectivePublicGameStatus(game) {
    if (
        game.auto_release &&
        game.scheduled_release_at &&
        new Date(game.scheduled_release_at).getTime() <= Date.now()
    ) return "available";
    return CUGINIPARTY_PUBLIC_STATUSES.includes(game.status) ? game.status : (game.enabled === false ? "maintenance" : "available");
}

function publicStatusLabel(status) {
    return status === "coming_soon" ? "IN ARRIVO" : status === "maintenance" ? "MANUTENZIONE" : "GIOCA";
}

function publicFormatReleaseDate(game) {
    if (!game.release_date && !game.scheduled_release_at) return "";
    const scheduled = game.scheduled_release_at ? new Date(game.scheduled_release_at) : null;
    let date = scheduled;

    if (game.release_date) {
        const match = String(game.release_date).match(/^(\d{4})-(\d{2})-(\d{2})/);
        date = match
            ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
            : new Date(game.release_date);
    }

    if (Number.isNaN(date.getTime())) return "";
    const formattedDate = date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const releaseTime = game.release_time
        ? String(game.release_time).slice(0, 5)
        : (scheduled
            ? scheduled.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
            : "");
    return releaseTime ? `${formattedDate} · ${releaseTime}` : formattedDate;
}

function getPublicGameRecord(gameId) {
    return cuginiPartyPublicAdminV2Records.find(game => String(game.game_id).toLowerCase() === String(gameId).toLowerCase()) || null;
}

function capturePublicStaticGameCards() {
    const grid = document.querySelector(".games-grid");
    if (!grid) return;

    Array.from(grid.querySelectorAll(":scope > [data-game-id]:not(.dynamic-game-card)"))
        .forEach((card, index) => {
            const gameId = String(card.dataset.gameId || "").trim().toLowerCase();
            if (!gameId || cuginiPartyPublicStaticCards.has(gameId)) return;
            card.dataset.gameId = gameId;
            const link = card.querySelector("a[href]");
            cuginiPartyPublicStaticCards.set(gameId, {
                card,
                index,
                className: card.className,
                hidden: card.hidden,
                title: card.querySelector(".game-card-content h3")?.textContent || "",
                description: card.querySelector(".game-card-content > p")?.textContent || "",
                category: card.querySelector(".game-tag")?.textContent || "",
                href: link?.getAttribute("href") || "",
                linkHtml: link?.innerHTML || ""
            });
        });
}

function restorePublicStaticGameCard(gameId) {
    const snapshot = cuginiPartyPublicStaticCards.get(gameId);
    if (!snapshot?.card?.isConnected) return;

    const { card } = snapshot;
    card.className = snapshot.className;
    card.hidden = snapshot.hidden;
    card.querySelectorAll(
        ".dynamic-construction-tape, .dynamic-game-badge, .dynamic-game-state-label, .dynamic-game-release-date, .dynamic-game-maintenance-message"
    ).forEach(item => item.remove());

    const title = card.querySelector(".game-card-content h3");
    const description = card.querySelector(".game-card-content > p");
    const category = card.querySelector(".game-tag");
    const link = card.querySelector("a[href]");
    if (title) title.textContent = snapshot.title;
    if (description) description.textContent = snapshot.description;
    if (category) category.textContent = snapshot.category;
    if (link) {
        link.setAttribute("href", snapshot.href);
        link.innerHTML = snapshot.linkHtml;
        link.classList.remove("coming-soon-button", "cuginiparty-game-link-blocked");
        link.removeAttribute("aria-disabled");
        link.style.pointerEvents = "";
        link.style.cursor = "";
        delete link.dataset.cuginiPartyGameBlocked;
        delete link.dataset.cuginiPartyOriginalHref;
        delete link.dataset.cuginiPartyOriginalText;
    }
}

function publicCategoryLabel(category) {
    const value = String(category || "Gioco").trim() || "Gioco";
    return /^\p{Extended_Pictographic}/u.test(value) ? value : `🎮 ${value}`;
}

function setPublicGameActionLabel(link, label, showArrow) {
    if (!link) return;
    const action = getGameActionElement(link);

    if (!action || action === link) {
        let textNode = Array.from(link.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (!textNode) {
            textNode = document.createTextNode("");
            link.insertBefore(textNode, link.firstChild);
        }
        textNode.nodeValue = `${label} `;
        const arrow = link.querySelector(":scope > span");
        if (arrow) {
            arrow.textContent = "→";
            arrow.hidden = !showArrow;
        }
        return;
    }

    action.textContent = label;
}

function ensurePublicConstructionTape(card, className, text) {
    let tape = card.querySelector(`.${className}`);
    if (!tape) {
        tape = document.createElement("div");
        tape.className = `construction-tape ${className} dynamic-construction-tape`;
        tape.innerHTML = `<span>${text}</span><span>${text}</span><span>${text}</span>`;
        card.appendChild(tape);
    } else {
        tape.querySelectorAll("span").forEach(span => { span.textContent = text; });
    }
}

function updatePublicCard(card, game) {
    const status = effectivePublicGameStatus(game);
    const content = card.querySelector(".game-card-content");
    if (!content) return;

    card.hidden = game.visible === false;
    card.classList.toggle("game-card-coming-soon", status !== "available");
    card.classList.toggle("game-card-maintenance", status === "maintenance");

    if (typeof game.name === "string" && game.name) {
        const title = content.querySelector("h3");
        if (title) title.textContent = game.name;
    }

    if (typeof game.description === "string") {
        const description = content.querySelector(":scope > p");
        if (description) description.textContent = game.description;
    }

    if (typeof game.category === "string" && game.category.trim()) {
        const category = card.querySelector(".game-tag");
        if (category) category.textContent = publicCategoryLabel(game.category);
    }

    let badge = card.querySelector(".dynamic-game-badge");
    const badgeActive = game.badge && (!game.badge_expires_at || new Date(game.badge_expires_at).getTime() > Date.now());
    if (badgeActive) {
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "dynamic-game-badge";
            content.insertBefore(badge, content.querySelector("h3"));
        }
        badge.textContent = game.badge;
    } else if (badge) {
        badge.remove();
    }
    let stateLabel = card.querySelector(".dynamic-game-state-label");
    if (status !== "available") {
        if (!stateLabel) {
            stateLabel = document.createElement("div");
            stateLabel.className = "coming-soon-label dynamic-game-state-label";
            content.insertBefore(stateLabel, content.querySelector("h3"));
        }
        stateLabel.textContent = status === "maintenance" ? "MANUTENZIONE" : "IN ARRIVO";
        ensurePublicConstructionTape(card, "construction-tape-top", status === "maintenance" ? "MANUTENZIONE" : "LAVORI IN CORSO");
        ensurePublicConstructionTape(card, "construction-tape-bottom", status === "maintenance" ? "MANUTENZIONE" : "LAVORI IN CORSO");

        let release = card.querySelector(".dynamic-game-release-date");
        const releaseText = status === "coming_soon" ? publicFormatReleaseDate(game) : "";
        if (releaseText) {
            if (!release) {
                release = document.createElement("div");
                release.className = "game-release-date dynamic-game-release-date";
                content.insertBefore(release, card.querySelector(".game-card-footer"));
            }
            release.innerHTML = `<span>Disponibile dal</span><strong>${escapeHtmlForPublic(releaseText)}</strong>`;
        } else if (release) release.remove();

        let maintenanceMessage = card.querySelector(".dynamic-game-maintenance-message");
        const messageText = status === "maintenance"
            ? String(game.maintenance_message || game.disabled_message || "").trim()
            : "";
        if (messageText) {
            if (!maintenanceMessage) {
                maintenanceMessage = document.createElement("p");
                maintenanceMessage.className = "dynamic-game-maintenance-message";
                content.insertBefore(maintenanceMessage, card.querySelector(".game-card-footer"));
            }
            maintenanceMessage.textContent = messageText;
        } else if (maintenanceMessage) {
            maintenanceMessage.remove();
        }
    } else {
        card.querySelectorAll(
            ".dynamic-construction-tape, .dynamic-game-state-label, .dynamic-game-release-date, .dynamic-game-maintenance-message"
        ).forEach(item => item.remove());
    }
}

function getGameActionElement(link) {
    if (!link) return null;
    const ownText = String(link.textContent || "").trim().toUpperCase();
    if (ownText === "GIOCA" || ownText.startsWith("GIOCA ") || ownText === "PLAY") return link;
    const candidates = link.querySelectorAll("button, .game-button, .play-button, span, strong");
    return Array.from(candidates).find(candidate => {
        const text = String(candidate.textContent || "").trim().toUpperCase();
        return text === "GIOCA" || text === "PLAY";
    }) || null;
}

function applyGameLinkState(link, game) {
    const status = effectivePublicGameStatus(game);
    const disabled = game.visible === false || status !== "available";

    if (disabled) {
        setPublicGameActionLabel(
            link,
            game.visible === false ? "NON DISPONIBILE" : publicStatusLabel(status),
            false
        );
        link.dataset.cuginiPartyGameBlocked = "true";
        link.setAttribute("aria-disabled", "true");
        link.classList.add("cuginiparty-game-link-blocked", "coming-soon-button");
        link.style.pointerEvents = "none";
        link.style.cursor = "not-allowed";
        return;
    }
    link.dataset.cuginiPartyGameBlocked = "false";
    link.removeAttribute("aria-disabled");
    link.classList.remove("cuginiparty-game-link-blocked", "coming-soon-button");
    link.style.pointerEvents = "";
    link.style.cursor = "";
    if (game.path) link.setAttribute("href", game.path);
    setPublicGameActionLabel(link, "GIOCA", true);
}

function createPublicDynamicGameCard(game) {
    const card = document.createElement("article");
    card.className = "game-card dynamic-game-card";
    card.dataset.gameId = String(game.game_id || "").toLowerCase();

    const icon = document.createElement("div");
    icon.className = "game-card-icon dynamic-game-icon";
    icon.textContent = game.icon || "🎮";

    const content = document.createElement("div");
    content.className = "game-card-content";

    const title = document.createElement("h3");
    title.textContent = game.name || game.game_id || "Gioco";

    const description = document.createElement("p");
    description.textContent = game.description || "Scopri questo nuovo gioco di CuginiParty.";

    const footer = document.createElement("div");
    footer.className = "game-card-footer";

    const tag = document.createElement("span");
    tag.className = "game-tag";
    tag.textContent = publicCategoryLabel(game.category);

    const link = document.createElement("a");
    link.className = "play-button";
    link.href = game.path || "#";
    link.textContent = "GIOCA ";
    const arrow = document.createElement("span");
    arrow.textContent = "→";
    link.appendChild(arrow);

    footer.append(tag, link);
    content.append(title, description, footer);
    card.append(icon, content);
    return card;
}

function ensurePublicDynamicGameCards() {
    const grid = document.querySelector(".games-grid");
    if (!grid) return;

    capturePublicStaticGameCards();
    const recordsById = new Map(
        cuginiPartyPublicAdminV2Records.map(game => [game.game_id, game])
    );
    const occupiedIds = new Set(cuginiPartyPublicStaticCards.keys());

    grid.querySelectorAll(":scope > .dynamic-game-card").forEach(card => {
        const gameId = String(card.dataset.gameId || "").toLowerCase();
        if (!recordsById.has(gameId) || occupiedIds.has(gameId)) {
            card.remove();
            return;
        }
        occupiedIds.add(gameId);
    });

    cuginiPartyPublicAdminV2Records.forEach(game => {
        if (!game.game_id || occupiedIds.has(game.game_id)) return;
        grid.appendChild(createPublicDynamicGameCard(game));
        occupiedIds.add(game.game_id);
    });
}

function renderGameLinkStates() {
    capturePublicStaticGameCards();

    cuginiPartyPublicStaticCards.forEach((snapshot, gameId) => {
        if (!getPublicGameRecord(gameId)) restorePublicStaticGameCard(gameId);
    });

    ensurePublicDynamicGameCards();

    document.querySelectorAll("[data-game-id]").forEach(card => {
        const game = getPublicGameRecord(card.dataset.gameId);
        if (!game) return;
        if (!card.classList.contains("dynamic-game-card")) {
            restorePublicStaticGameCard(game.game_id);
        }
        updatePublicCard(card, game);
        const link = card.querySelector("a[href]");
        if (link) applyGameLinkState(link, game);
    });
    const grid = document.querySelector(".games-grid");
    if (grid) {
        const order = new Map(cuginiPartyPublicAdminV2Records.map((game, index) => [game.game_id, [Number(game.sort_order) || 0, index]]));
        Array.from(grid.children).sort((a, b) => {
            const leftStatic = cuginiPartyPublicStaticCards.get(a.dataset.gameId)?.index ?? 9999;
            const rightStatic = cuginiPartyPublicStaticCards.get(b.dataset.gameId)?.index ?? 9999;
            const left = order.get(a.dataset.gameId) || [Number.MAX_SAFE_INTEGER, leftStatic];
            const right = order.get(b.dataset.gameId) || [Number.MAX_SAFE_INTEGER, rightStatic];
            return left[0] - right[0] || left[1] - right[1];
        }).forEach(card => grid.appendChild(card));
    }
}

function showGameBlockedOverlay(game) {
    if (isHomePage()) return;
    const current = getCurrentGameId();
    const settings = game || getPublicGameRecord(current);
    if (!settings || (settings.visible !== false && effectivePublicGameStatus(settings) === "available")) {
        hideGameBlockedOverlay();
        return;
    }
    const overlay = createGameBlockedOverlay();
    const status = settings.visible === false ? "Gioco non disponibile" : effectivePublicGameStatus(settings) === "coming_soon" ? "Gioco in arrivo" : "Gioco in manutenzione";
    const icon = document.getElementById("cuginiparty-game-blocked-icon");
    const title = document.getElementById("cuginiparty-game-blocked-title");
    const message = document.getElementById("cuginiparty-game-blocked-message");
    if (icon) icon.textContent = settings.visible === false ? "🙈" : effectivePublicGameStatus(settings) === "coming_soon" ? "🚧" : "🔧";
    if (title) title.textContent = status;
    if (message) message.textContent = settings.maintenance_message || settings.disabled_message || (effectivePublicGameStatus(settings) === "coming_soon" ? "Questo gioco non è ancora disponibile." : "Questo gioco è temporaneamente non disponibile.");
    overlay.classList.add("visible");
}

function applyCuginiPartyGameSettings(games) {
    cuginiPartyAdminGames = Array.isArray(games) ? games : [];
    cuginiPartyPublicAdminV2Records = cuginiPartyAdminGames.map(normalizePublicGame);
    renderGameLinkStates();
    const current = getCurrentGameId();
    if (current) showGameBlockedOverlay(getPublicGameRecord(current));
    else hideGameBlockedOverlay();
}

function isPublicMessageVisible(message) {
    if (!message || !message.active) return false;
    const start = message.scheduled_start;
    const end = message.scheduled_end;
    if (start && (Number.isNaN(new Date(start).getTime()) || new Date(start).getTime() > Date.now())) return false;
    if (end && (Number.isNaN(new Date(end).getTime()) || new Date(end).getTime() <= Date.now())) return false;
    const targetGame = message.game_id;
    if ((message.target === "game" || targetGame) && targetGame && String(targetGame).toLowerCase() !== String(getCurrentGameId() || "").toLowerCase()) return false;
    return true;
}

async function loadCuginiPartyAdminSettings() {
    if (!window.supabaseClient) return null;
    try {
        const result = await window.supabaseClient.from("site_settings").select("*").eq("id", 1).maybeSingle();
        if (result.error) throw result.error;
        if (result.data) {
            cuginiPartyAdminSettings = result.data;
            applyCuginiPartyAdminSettings(result.data);
        }
        return result.data || null;
    } catch (error) {
        console.warn("CuginiParty site_settings non disponibile:", error.message || error);
        return null;
    }
}

async function loadCuginiPartyAdminGames() {
    if (!window.supabaseClient) return [];
    try {
        const result = await window.supabaseClient.from("site_games").select("*").order("sort_order", { ascending: true }).order("game_id", { ascending: true });
        if (result.error) throw result.error;
        applyCuginiPartyGameSettings(result.data || []);
        return result.data || [];
    } catch (error) {
        console.warn("CuginiParty site_games non disponibile; uso il catalogo statico.", error.message || error);
        return [];
    }
}

async function loadCuginiPartyAdminMessages() {
    if (!window.supabaseClient) return [];
    try {
        const result = await window.supabaseClient.from("site_messages").select("id,type,title,target,game_id,message,active,persistent,scheduled_start,scheduled_end,created_at").eq("active", true).order("created_at", { ascending: false });
        if (result.error) throw result.error;
        cuginiPartyAdminMessages = (result.data || []).map(message => ({ ...message, title: message.title || "Comunicazione CuginiParty" }));
        renderPublicMessages();
        return cuginiPartyAdminMessages;
    } catch (error) {
        console.warn("CuginiParty site_messages non disponibile:", error.message || error);
        return [];
    }
}

function startCuginiPartyAdminRealtime() {
    if (!window.supabaseClient) return;
    if (cuginiPartyAdminRealtime) { try { window.supabaseClient.removeChannel(cuginiPartyAdminRealtime); } catch { /* ignore */ } }
    cuginiPartyAdminRealtime = window.supabaseClient.channel("cuginiparty-public-site-settings").on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, payload => {
        if (payload.new && Number(payload.new.id) === 1) applyCuginiPartyAdminSettings(payload.new);
        else loadCuginiPartyAdminSettings();
    }).subscribe(status => {
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) console.warn(`Realtime site_settings: ${status}`);
    });
}

function startCuginiPartyMessagesRealtime() {
    if (!window.supabaseClient) return;
    if (cuginiPartyMessagesRealtime) { try { window.supabaseClient.removeChannel(cuginiPartyMessagesRealtime); } catch { /* ignore */ } }
    cuginiPartyMessagesRealtime = window.supabaseClient.channel("cuginiparty-public-site-messages").on("postgres_changes", { event: "*", schema: "public", table: "site_messages" }, loadCuginiPartyAdminMessages).subscribe(status => {
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) console.warn(`Realtime site_messages: ${status}`);
    });
}

function startCuginiPartyGamesRealtime() {
    if (!window.supabaseClient) return;
    if (cuginiPartyGamesRealtime) { try { window.supabaseClient.removeChannel(cuginiPartyGamesRealtime); } catch { /* ignore */ } }
    cuginiPartyGamesRealtime = window.supabaseClient.channel("cuginiparty-public-site-games").on("postgres_changes", { event: "*", schema: "public", table: "site_games" }, loadCuginiPartyAdminGames).subscribe(status => {
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) console.warn(`Realtime site_games: ${status}`);
    });
}

async function initCuginiPartyAdminControl() {

    injectAdminGlobalStyles();

    createAdminGlobalOverlay();

    createGameBlockedOverlay();

    createPublicMessageContainers();


    await Promise.all([
        loadCuginiPartyAdminSettings(),
        loadCuginiPartyAdminMessages(),
        loadCuginiPartyAdminGames()
    ]);


    startCuginiPartyAdminRealtime();

    startCuginiPartyMessagesRealtime();

    startCuginiPartyGamesRealtime();


    if (
        cuginiPartyAdminRefreshTimer
    ) {

        clearInterval(
            cuginiPartyAdminRefreshTimer
        );

    }


    cuginiPartyAdminRefreshTimer =
        setInterval(
            async () => {

                await loadCuginiPartyAdminSettings();

                await loadCuginiPartyAdminMessages();

                await loadCuginiPartyAdminGames();

            },
            CUGINIPARTY_ADMIN_REFRESH_MS
        );

}

function stopCuginiPartyAdminControl() {
    if (cuginiPartyAdminRefreshTimer) {
        clearInterval(cuginiPartyAdminRefreshTimer);
        cuginiPartyAdminRefreshTimer = null;
    }

    [cuginiPartyAdminRealtime, cuginiPartyMessagesRealtime, cuginiPartyGamesRealtime]
        .filter(Boolean)
        .forEach(channel => {
            try { window.supabaseClient?.removeChannel(channel); } catch { /* ignore */ }
        });
    cuginiPartyAdminRealtime = null;
    cuginiPartyMessagesRealtime = null;
    cuginiPartyGamesRealtime = null;
}

window.addEventListener("pagehide", stopCuginiPartyAdminControl, { once: true });


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initCuginiPartyAdminControl
    );

} else {

    initCuginiPartyAdminControl();

}
