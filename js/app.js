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
                "Admin/index.html";

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

                sessionStorage.setItem(
                    CUGINIPARTY_MAINTENANCE_SESSION_KEY,
                    "true"
                );

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
        message.scheduled_at
    ) {

        const scheduledTime =
            new Date(
                message.scheduled_at
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
        message.expires_at
    ) {

        const expiresTime =
            new Date(
                message.expires_at
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
        message.target_game
    ) {

        const currentGame =
            getCurrentGameId();


        if (
            currentGame !==
            String(
                message.target_game
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
                .from("admin_games")
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
                "CuginiParty admin_games:",
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


    const maintenance =
        Boolean(
            settings.maintenance_enabled
        );


    const emergency =
        Boolean(
            settings.emergency_enabled
        );


    const totalBlock =
        Boolean(
            settings.total_block_enabled
        );


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


        const alreadySeen =
            sessionStorage.getItem(
                CUGINIPARTY_MAINTENANCE_SESSION_KEY
            ) === "true";


        if (!alreadySeen) {

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
                .from("admin_settings")
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
                    room_creation_enabled,
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
                "CuginiParty admin_settings:",
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
                .from("admin_messages")
                .select(`
                    id,
                    type,
                    title,
                    message,
                    active,
                    persistent,
                    target_game,
                    online_only,
                    scheduled_at,
                    expires_at,
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
                "CuginiParty admin_messages:",
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
                        "admin_settings"
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
                        "admin_messages"
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
                        "admin_games"
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