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