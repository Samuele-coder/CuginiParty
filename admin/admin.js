"use strict";

/* =========================================================
   CUGINIPARTY - ADMIN CENTER
========================================================= */

const SUPABASE_URL =
    "https://pzjbxrcxlztwjxetnzkw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_obaFQtUNuG3980ZkndTaCQ_bmc4QeHu";

const adminDb =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );




/* =========================================================
   CONFIGURAZIONE
========================================================= */

const CONFIG = {

    activeRoomMaxAgeMs:
        5 * 60 * 1000,

    onlinePlayerMaxAgeMs:
        90 * 1000,

    refreshIntervalMs:
        15 * 1000

};


/* =========================================================
   GIOCHI
========================================================= */

const GAMES = [
    {
        id: "tris",
        name: "Tris",
        icon: "❌⭕"
    },
    {
        id: "uno",
        name: "UNO",
        icon: "🃏"
    },
    {
        id: "racing",
        name: "Racing 2D",
        icon: "🏎️"
    },
    {
        id: "memory",
        name: "Memory",
        icon: "🧠"
    },
    {
        id: "pizza",
        name: "Prepara la Pizza",
        icon: "🍕"
    },
    {
        id: "balloons",
        name: "Scoppia i Palloncini",
        icon: "🎈"
    },
    {
        id: "aquarium",
        name: "Acquario Magico",
        icon: "🐠"
    }
];


/* =========================================================
   STATO
========================================================= */

const state = {

    settings: null,

    games: [],

    messages: [],

    unoRooms: [],

    unoPlayers: [],

    blockedUsers: [],

    logs: [],

    currentUser: null,

    currentAdminId: null,

    realtimeChannels: [],

    refreshTimer: null,

    currentSection: "dashboard"

};


/* =========================================================
   ELEMENTI LOGIN
========================================================= */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );

const adminApp =
    document.getElementById(
        "adminApp"
    );

const loginEmailInput =
    document.getElementById(
        "adminEmail"
    );

const loginPasswordInput =
    document.getElementById(
        "adminPassword"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const togglePasswordButton =
    document.getElementById(
        "togglePassword"
    );


/* =========================================================
   UTILITY DOM
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function setText(
    id,
    value
) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "";

}


function escapeHtml(
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


/* =========================================================
   NORMALIZZA NICKNAME
========================================================= */

function normalizeNickname(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


function getDisplayNickname(
    value
) {

    const nickname =
        String(
            value ?? ""
        )
            .trim();

    return nickname ||
        "Utente";

}


function formatDate(
    value
) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleString(
        "it-IT",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


function isRecent(
    value,
    maxAge
) {

    if (!value) {
        return false;
    }

    const time =
        new Date(
            value
        ).getTime();

    if (
        Number.isNaN(time)
    ) {
        return false;
    }

    return (
        Date.now() -
        time
    ) <= maxAge;

}


function toIsoOrNull(
    localDateTime
) {

    if (!localDateTime) {
        return null;
    }

    const date =
        new Date(
            localDateTime
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date.toISOString();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "adminToastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "adminToastContainer";

        container.className =
            "admin-toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `admin-toast admin-toast-${type}`;

    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =========================================================
   ERRORI
========================================================= */

function getErrorMessage(
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


    if (
        message.includes(
            "row-level security policy"
        )
    ) {

        return (
            "Supabase ha bloccato l'operazione. " +
            "Verifica le autorizzazioni RLS della tabella."
        );

    }


    if (
        message.includes(
            "Invalid login credentials"
        )
    ) {

        return (
            "Email o password non corretti."
        );

    }


    if (
        message.includes(
            "Email not confirmed"
        )
    ) {

        return (
            "L'email dell'account non è stata confermata."
        );

    }


    return (
        message ||
        fallback
    );

}


function handleError(
    error,
    fallback
) {

    console.error(
        fallback,
        error
    );


    showToast(
        getErrorMessage(
            error,
            fallback
        ),
        "error"
    );

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
    message
) {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        message;

    loginError.classList.add(
        "visible"
    );

}


function clearLoginError() {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        "";

    loginError.classList.remove(
        "visible"
    );

}


/* =========================================================
   MOSTRA / NASCONDI ADMIN
========================================================= */

function showAdminApp() {

    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

    }


    if (adminApp) {

        adminApp.classList.remove(
            "hidden"
        );

    }

}


function showLoginScreen() {

    if (loginScreen) {

        loginScreen.classList.remove(
            "hidden"
        );

    }


    if (adminApp) {

        adminApp.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   VERIFICA ADMIN
========================================================= */

async function verifyCurrentAdmin() {

    const {
        data,
        error
    } =
        await adminDb.auth.getUser();


    if (error) {
        throw error;
    }


    if (!data?.user) {
        return false;
    }


    const {
        data:
            adminRecord,
        error:
            adminError
    } =
        await adminDb
            .from("admin_users")
            .select(
                "user_id"
            )
            .eq(
                "user_id",
                data.user.id
            )
            .maybeSingle();


    if (adminError) {
        throw adminError;
    }


    if (!adminRecord) {

        await adminDb.auth.signOut();

        throw new Error(
            "Questo account non è autorizzato come Admin."
        );
    }


    state.currentUser =
        data.user;

    state.currentAdminId =
        data.user.id;


    return true;

}


/* =========================================================
   LOGIN
========================================================= */

async function loginAdmin() {

    clearLoginError();

    const email =
        loginEmailInput?.value.trim() || "";

    const password =
        loginPasswordInput?.value || "";


    if (!email) {

        showLoginError(
            "Inserisci l'email."
        );

        loginEmailInput?.focus();

        return;

    }


    if (!password) {

        showLoginError(
            "Inserisci la password."
        );

        loginPasswordInput?.focus();

        return;

    }


    if (loginButton) {

        loginButton.disabled = true;

        loginButton.textContent =
            "🔄 Accesso...";

    }


    try {

        console.log(
            "🔐 Tentativo login Admin..."
        );


        const {
            data,
            error
        } =
            await adminDb.auth.signInWithPassword({

                email: email,
                password: password

            });


        if (error) {
            throw error;
        }


        if (!data?.user) {

            throw new Error(
                "adminDb non ha restituito un utente."
            );

        }


        console.log(
            "✅ Login adminDb riuscito:",
            data.user.email
        );


        const isAdmin =
            await verifyCurrentAdmin();


        if (!isAdmin) {

            throw new Error(
                "Questo account non è autorizzato come Admin."
            );

        }


        console.log(
            "✅ Utente verificato come Admin."
        );


        showAdminApp();


        await initializeAdminCenter();


    } catch (error) {

        console.error(
            "❌ ERRORE LOGIN ADMIN:",
            error
        );


        showLoginError(
            getErrorMessage(
                error,
                "Impossibile effettuare l'accesso."
            )
        );


        try {

            await adminDb.auth.signOut();

        } catch (signOutError) {

            console.warn(
                "Errore signOut:",
                signOutError
            );

        }


    } finally {

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "🔓 Accedi al pannello";

        }

    }

}


/* =========================================================
   SESSIONE ESISTENTE
========================================================= */

async function checkExistingSession() {

    try {

        const isAdmin =
            await verifyCurrentAdmin();


        if (isAdmin) {

            showAdminApp();

            await initializeAdminCenter();

            return;

        }


        showLoginScreen();


    } catch (error) {

        console.log(
            "Nessuna sessione Admin valida:",
            error
        );

        showLoginScreen();

    }

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

if (togglePasswordButton) {

    togglePasswordButton.addEventListener(
        "click",
        () => {

            if (!loginPasswordInput) {
                return;
            }


            const show =
                loginPasswordInput.type ===
                "password";


            loginPasswordInput.type =
                show
                    ? "text"
                    : "password";


            togglePasswordButton.textContent =
                show
                    ? "🙈"
                    : "👁️";


            togglePasswordButton.setAttribute(
                "aria-label",
                show
                    ? "Nascondi password"
                    : "Mostra password"
            );

        }
    );

}


if (loginButton) {

    loginButton.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();
            event.stopPropagation();

            await loginAdmin();

        }
    );

}


/* =========================================================
   LOGIN FORM - BLOCCA IL SUBMIT NORMALE
========================================================= */

const loginForm =
    loginButton?.closest("form");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();
            event.stopPropagation();

            await loginAdmin();

        }
    );

}


if (loginEmailInput) {

    loginEmailInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                loginAdmin();

            }

        }
    );

}


if (loginPasswordInput) {

    loginPasswordInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                loginAdmin();

            }

        }
    );

}


/* =========================================================
   NAVIGAZIONE SIDEBAR
========================================================= */

function activateSection(
    sectionName
) {

    state.currentSection =
        sectionName;


    document
        .querySelectorAll(
            ".sidebar-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                        sectionName
                );

            }
        );


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(
            section => {

                section.classList.toggle(
                    "active",
                    section.dataset.sectionContent ===
                        sectionName
                );

            }
        );

}


document
    .querySelectorAll(
        ".sidebar-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    activateSection(
                        button.dataset.section
                    );

                }
            );

        }
    );


/* =========================================================
   SETTINGS
========================================================= */

async function ensureSettingsRow() {

    const {
        data,
        error
    } =
        await adminDb
            .from("admin_settings")
            .select("*")
            .eq(
                "id",
                1
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    if (data) {

        state.settings =
            data;

        return data;

    }


    const defaults = {

        id: 1,

        maintenance_enabled:
            false,

        maintenance_title:
            "Manutenzione in corso",

        maintenance_message:
            "CuginiParty è temporaneamente in manutenzione.",

        maintenance_end_time:
            null,

        emergency_enabled:
            false,

        total_block_enabled:
            false,

        multiplayer_enabled:
            true,

        room_creation_enabled:
            true,

        global_status:
            "online"

    };


    const {
        data:
            inserted,
        error:
            insertError
    } =
        await adminDb
            .from("admin_settings")
            .insert(
                defaults
            )
            .select()
            .single();


    if (insertError) {
        throw insertError;
    }


    state.settings =
        inserted;


    return inserted;

}


async function loadSettings() {

    try {

        await ensureSettingsRow();

        renderSettings();

    } catch (error) {

        handleError(
            error,
            "Impossibile caricare admin_settings."
        );

    }

}


function renderSettings() {

    const settings =
        state.settings;


    if (!settings) {
        return;
    }


    const maintenanceToggle =
        $("maintenanceToggle");


    if (maintenanceToggle) {

        maintenanceToggle.checked =
            Boolean(
                settings.maintenance_enabled
            );

    }


    const emergencyToggle =
        $("emergencyToggle");


    if (emergencyToggle) {

        emergencyToggle.checked =
            Boolean(
                settings.emergency_enabled
            );

    }


    const totalBlockToggle =
        $("totalBlockToggle");


    if (totalBlockToggle) {

        totalBlockToggle.checked =
            Boolean(
                settings.total_block_enabled
            );

    }


    const multiplayerToggle =
        $("multiplayerToggle");


    if (multiplayerToggle) {

        multiplayerToggle.checked =
            Boolean(
                settings.multiplayer_enabled
            );

    }


    const roomCreationToggle =
        $("roomCreationToggle");


    if (roomCreationToggle) {

        roomCreationToggle.checked =
            Boolean(
                settings.room_creation_enabled
            );

    }


    const titleInput =
        $("maintenanceTitle");


    if (titleInput) {

        titleInput.value =
            settings.maintenance_title ||
            "";

    }


    const messageInput =
        $("maintenanceMessage");


    if (messageInput) {

        messageInput.value =
            settings.maintenance_message ||
            "";

    }


    const emergencyTitleInput =
        $("emergencyTitle");


    if (emergencyTitleInput) {

        emergencyTitleInput.value =
            settings.emergency_title ||
            "CuginiParty è in modalità emergenza";

    }


    const emergencyMessageInput =
        $("emergencyMessage");


    if (emergencyMessageInput) {

        emergencyMessageInput.value =
            settings.emergency_message ||
            "I giochi e le attività online sono temporaneamente bloccati.";

    }


    const endInput =
        $("maintenanceEnd");


    if (
        endInput &&
        settings.maintenance_end_time
    ) {

        const date =
            new Date(
                settings.maintenance_end_time
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            const local =
                new Date(
                    date.getTime() -
                    date.getTimezoneOffset() *
                    60000
                );


            endInput.value =
                local
                    .toISOString()
                    .slice(
                        0,
                        16
                    );

        }

    } else if (endInput) {

        endInput.value =
            "";

    }


    renderGlobalStatus(
        settings.global_status
    );

}


/* =========================================================
   UPDATE SETTINGS
========================================================= */

async function updateSettings(
    changes,
    logAction = null
) {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_settings")
                .update(
                    changes
                )
                .eq(
                    "id",
                    1
                )
                .select()
                .single();


        console.log(
            "📡 RISPOSTA UPDATE SETTINGS:",
            {
                changes,
                data,
                error
            }
        );


        if (error) {
            throw error;
        }


        state.settings =
            data;


        renderSettings();


        if (logAction) {

            await writeAdminLog(
                logAction,
                "settings",
                "1",
                changes
            );

        }


        return data;

    } catch (error) {

        handleError(
            error,
            "Impossibile aggiornare le impostazioni."
        );


        return null;

    }

}


/* =========================================================
   GLOBAL STATUS
========================================================= */

function getStatusLabel(
    status
) {

    switch (status) {

        case "online":
            return "ONLINE";

        case "maintenance":
            return "MANUTENZIONE";

        case "emergency":
            return "EMERGENZA";

        case "offline":
            return "BLOCCATO";

        default:
            return "SCONOSCIUTO";

    }

}


function renderGlobalStatus(
    status
) {

    const statusText =
        getStatusLabel(
            status
        );


    setText(
        "dashboardSiteStatus",
        statusText
    );


    setText(
        "globalStatusPill",
        statusText
    );


    const pill =
        $("globalStatusPill");


    if (pill) {

        pill.classList.remove(
            "online",
            "maintenance",
            "emergency",
            "offline"
        );


        pill.classList.add(
            status === "maintenance"
                ? "maintenance"
                : status === "emergency"
                    ? "emergency"
                    : status === "offline"
                        ? "offline"
                        : "online"
        );

    }


    const healthSite =
        $("healthSite");


    if (healthSite) {

        healthSite.textContent =
            status === "online"
                ? "Operativo"
                : status === "maintenance"
                    ? "Manutenzione"
                    : status === "emergency"
                        ? "Emergenza"
                        : "Bloccato";

    }

}


/* =========================================================
   🟢 TUTTO ONLINE
========================================================= */

async function commandOnline() {

    const confirmed =
        window.confirm(
            "Impostare CuginiParty completamente ONLINE?"
        );


    if (!confirmed) {
        return;
    }


    const result =
        await updateSettings(
            {

                maintenance_enabled:
                    false,

                emergency_enabled:
                    false,

                total_block_enabled:
                    false,

                multiplayer_enabled:
                    true,

                room_creation_enabled:
                    true,

                global_status:
                    "online"

            },
            "Attivazione totale ONLINE"
        );


    if (!result) {
        return;
    }


    showToast(
        "🟢 CuginiParty è completamente ONLINE."
    );


    await reloadDashboard();

}


/* =========================================================
   🟡 MANUTENZIONE
========================================================= */

async function commandMaintenance() {

    const confirmed =
        window.confirm(
            "Attivare la modalità MANUTENZIONE?"
        );


    if (!confirmed) {
        return;
    }


    const title =
        $("maintenanceTitle")
            ?.value
            .trim() ||
        "Manutenzione in corso";


    const message =
        $("maintenanceMessage")
            ?.value
            .trim() ||
        "CuginiParty è temporaneamente in manutenzione.";


    const end =
        toIsoOrNull(
            $("maintenanceEnd")
                ?.value ||
            ""
        );


    const result =
        await updateSettings(
            {

                maintenance_enabled:
                    true,

                emergency_enabled:
                    false,

                total_block_enabled:
                    false,

                global_status:
                    "maintenance",

                maintenance_title:
                    title,

                maintenance_message:
                    message,

                maintenance_end_time:
                    end

            },
            "Attivazione manutenzione"
        );


    if (!result) {
        return;
    }


    showToast(
        "🟡 Modalità manutenzione attivata."
    );


    await reloadDashboard();

}


/* =========================================================
   🔴 EMERGENZA
========================================================= */

async function commandEmergency() {

    const confirmed =
        window.confirm(
            "ATTENZIONE!\n\n" +
            "L'emergenza bloccherà giochi, " +
            "multiplayer e creazione di nuove stanze.\n\n" +
            "Continuare?"
        );


    if (!confirmed) {
        return;
    }


    const title =
        $("emergencyTitle")
            ?.value
            .trim() ||
        "CuginiParty è in modalità emergenza";


    const message =
        $("emergencyMessage")
            ?.value
            .trim() ||
        "I giochi e le attività online sono temporaneamente bloccati.";


    const result =
        await updateSettings(
            {

                maintenance_enabled:
                    false,

                emergency_enabled:
                    true,

                total_block_enabled:
                    false,

                multiplayer_enabled:
                    false,

                room_creation_enabled:
                    false,

                global_status:
                    "emergency",

                emergency_title:
                    title,

                emergency_message:
                    message

            },
            "Attivazione emergenza"
        );


    if (!result) {
        return;
    }


    showToast(
        "🔴 EMERGENZA ATTIVATA.",
        "error"
    );


    await reloadDashboard();

}


/* =========================================================
   BLOCCO TOTALE
========================================================= */

async function commandTotalBlock() {

    const confirmed =
        window.confirm(
            "ATTENZIONE!\n\n" +
            "Il blocco totale impedirà l'accesso al sito.\n\n" +
            "Continuare?"
        );


    if (!confirmed) {
        return;
    }


    const result =
        await updateSettings(
            {

                total_block_enabled:
                    true,

                maintenance_enabled:
                    false,

                emergency_enabled:
                    false,

                multiplayer_enabled:
                    false,

                room_creation_enabled:
                    false,

                global_status:
                    "offline"

            },
            "Attivazione blocco totale"
        );


    if (!result) {
        return;
    }


    showToast(
        "🔴 BLOCCO TOTALE ATTIVATO.",
        "error"
    );


    await reloadDashboard();

}


/* =========================================================
   DISATTIVA MANUTENZIONE
========================================================= */

async function disableMaintenance() {

    const result =
        await updateSettings(
            {

                maintenance_enabled:
                    false,

                global_status:
                    "online"

            },
            "Disattivazione manutenzione"
        );


    if (!result) {
        return;
    }


    showToast(
        "Manutenzione disattivata."
    );

}


/* =========================================================
   SALVA MANUTENZIONE
========================================================= */

const saveMaintenanceButton =
    $("saveMaintenanceButton");


if (saveMaintenanceButton) {

    saveMaintenanceButton.addEventListener(
        "click",
        async () => {

            const title =
                $("maintenanceTitle")
                    ?.value
                    .trim() ||
                "Manutenzione in corso";


            const message =
                $("maintenanceMessage")
                    ?.value
                    .trim() ||
                "CuginiParty è temporaneamente in manutenzione.";


            const end =
                toIsoOrNull(
                    $("maintenanceEnd")
                        ?.value ||
                    ""
                );


            const result =
                await updateSettings(
                    {

                        maintenance_title:
                            title,

                        maintenance_message:
                            message,

                        maintenance_end_time:
                            end

                    },
                    "Aggiornamento configurazione manutenzione"
                );


            if (result) {

                showToast(
                    "Configurazione manutenzione salvata."
                );

            }

        }
    );

}


/* =========================================================
   SALVA CONFIGURAZIONE EMERGENZA
========================================================= */

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "#saveEmergencyButton"
            );

        if (!button) {
            return;
        }


        event.preventDefault();


        const titleInput =
            $("emergencyTitle");

        const messageInput =
            $("emergencyMessage");


        const title =
            titleInput?.value.trim() ||
            "CuginiParty è in modalità emergenza";


        const message =
            messageInput?.value.trim() ||
            "I giochi e le attività online sono temporaneamente bloccati.";


        console.log(
            "🚨 SALVATAGGIO EMERGENZA",
            {
                title,
                message
            }
        );


        button.disabled =
            true;

        button.textContent =
            "🔄 Salvataggio...";


        try {

            const result =
                await updateSettings(
                    {
                        emergency_title:
                            title,

                        emergency_message:
                            message
                    },
                    "Aggiornamento configurazione emergenza"
                );


            if (!result) {
                return;
            }


            state.settings =
                result;


            renderSettings();


            showToast(
                "🚨 Configurazione emergenza salvata."
            );


        } catch (error) {

            console.error(
                "❌ ERRORE CONFIGURAZIONE EMERGENZA:",
                error
            );


            showToast(
                getErrorMessage(
                    error,
                    "Impossibile salvare la configurazione."
                ),
                "error"
            );


        } finally {

            button.disabled =
                false;

            button.textContent =
                "💾 Salva configurazione emergenza";

        }

    }
);


/* =========================================================
   TOGGLE SISTEMA
========================================================= */

const maintenanceToggle =
    $("maintenanceToggle");


if (maintenanceToggle) {

    maintenanceToggle.addEventListener(
        "change",
        async () => {

            if (
                maintenanceToggle.checked
            ) {

                await commandMaintenance();

            } else {

                await disableMaintenance();

            }

        }
    );

}


const emergencyToggle =
    $("emergencyToggle");


if (emergencyToggle) {

    emergencyToggle.addEventListener(
        "change",
        async () => {

            if (
                emergencyToggle.checked
            ) {

                await commandEmergency();

            } else {

                await updateSettings(
                    {

                        emergency_enabled:
                            false,

                        global_status:
                            "online",

                        multiplayer_enabled:
                            true,

                        room_creation_enabled:
                            true

                    },
                    "Disattivazione emergenza"
                );

            }

        }
    );

}


const totalBlockToggle =
    $("totalBlockToggle");


if (totalBlockToggle) {

    totalBlockToggle.addEventListener(
        "change",
        async () => {

            if (
                totalBlockToggle.checked
            ) {

                await commandTotalBlock();

            } else {

                await updateSettings(
                    {

                        total_block_enabled:
                            false,

                        global_status:
                            "online",

                        multiplayer_enabled:
                            true,

                        room_creation_enabled:
                            true

                    },
                    "Disattivazione blocco totale"
                );

            }

        }
    );

}


const multiplayerToggle =
    $("multiplayerToggle");


if (multiplayerToggle) {

    multiplayerToggle.addEventListener(
        "change",
        async () => {

            await updateSettings(
                {

                    multiplayer_enabled:
                        multiplayerToggle.checked

                },
                "Modifica multiplayer globale"
            );

        }
    );

}


const roomCreationToggle =
    $("roomCreationToggle");


if (roomCreationToggle) {

    roomCreationToggle.addEventListener(
        "change",
        async () => {

            await updateSettings(
                {

                    room_creation_enabled:
                        roomCreationToggle.checked

                },
                "Modifica creazione stanze globale"
            );

        }
    );

}


/* =========================================================
   COMANDI RAPIDI
========================================================= */

const quickOnlineButton =
    document.querySelector(
        '[data-command="online"]'
    );

const quickMaintenanceButton =
    document.querySelector(
        '[data-command="maintenance"]'
    );

const quickEmergencyButton =
    document.querySelector(
        '[data-command="emergency"]'
    );


if (quickOnlineButton) {

    quickOnlineButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            console.log(
                "🟢 TUTTO ONLINE premuto"
            );

            await commandOnline();

        }
    );

}


if (quickMaintenanceButton) {

    quickMaintenanceButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            console.log(
                "🟡 MANUTENZIONE premuto"
            );

            await commandMaintenance();

        }
    );

}


if (quickEmergencyButton) {

    quickEmergencyButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            console.log(
                "🔴 EMERGENZA premuto"
            );

            await commandEmergency();

        }
    );

}


/* =========================================================
   GIOCHI
========================================================= */

async function loadGames() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_games")
                .select("*")
                .order(
                    "game_name",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            const defaults =
                GAMES.map(
                    game => ({

                        game_id:
                            game.id,

                        game_name:
                            game.name,

                        enabled:
                            true,

                        multiplayer_enabled:
                            true,

                        room_creation_enabled:
                            true,

                        disabled_message:
                            "Questo gioco è temporaneamente disabilitato."

                    })
                );


            const {
                data:
                    inserted,
                error:
                    insertError
            } =
                await adminDb
                    .from("admin_games")
                    .insert(
                        defaults
                    )
                    .select();


            if (insertError) {
                throw insertError;
            }


            state.games =
                inserted ||
                defaults;

        } else {

            state.games =
                data;

        }


        renderGames();


        setText(
            "dashboardGames",
            String(
                state.games.filter(
                    game =>
                        game.enabled
                ).length
            )
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare i giochi."
        );

    }

}


function renderGames() {

    const container =
        $("gamesGrid");


    if (!container) {
        return;
    }


    container.innerHTML =
        state.games
            .map(
                game => `

                    <article class="panel-card">

                        <div class="panel-header">

                            <div class="panel-title">

                                <div class="panel-title-icon">
                                    ${escapeHtml(
                                        getGameIcon(
                                            game.game_id
                                        )
                                    )}
                                </div>

                                <div>

                                    <h3>
                                        ${escapeHtml(
                                            game.game_name
                                        )}
                                    </h3>

                                    <p>
                                        ${
                                            game.enabled
                                                ? "🟢 Gioco attivo"
                                                : "🔴 Gioco disabilitato"
                                        }
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div class="admin-game-controls">

                            <label class="admin-switch">

                                <input
                                    type="checkbox"
                                    data-game-field="enabled"
                                    data-game-id="${escapeHtml(game.game_id)}"
                                    ${game.enabled ? "checked" : ""}
                                >

                                <span></span>

                            </label>

                            <label class="check-option">

                                <input
                                    type="checkbox"
                                    data-game-field="multiplayer_enabled"
                                    data-game-id="${escapeHtml(game.game_id)}"
                                    ${game.multiplayer_enabled ? "checked" : ""}
                                >

                                <span>
                                    Multiplayer
                                </span>

                            </label>

                            <label class="check-option">

                                <input
                                    type="checkbox"
                                    data-game-field="room_creation_enabled"
                                    data-game-id="${escapeHtml(game.game_id)}"
                                    ${game.room_creation_enabled ? "checked" : ""}
                                >

                                <span>
                                    Nuove stanze
                                </span>

                            </label>

                        </div>

                        <div class="form-group">

                            <label>
                                Messaggio quando disabilitato
                            </label>

                            <input
                                class="form-input"
                                type="text"
                                data-game-field="disabled_message"
                                data-game-id="${escapeHtml(game.game_id)}"
                                value="${escapeHtml(game.disabled_message || "")}"
                            >

                        </div>

                    </article>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-game-field]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "change",
                    async () => {

                        const gameId =
                            element.dataset.gameId;

                        const field =
                            element.dataset.gameField;

                        const value =
                            element.type ===
                                "checkbox"
                                ? element.checked
                                : element.value;

                        await updateGame(
                            gameId,
                            {
                                [field]:
                                    value
                            }
                        );

                    }
                );

            }
        );

}


function getGameIcon(
    gameId
) {

    return (
        GAMES.find(
            game =>
                game.id ===
                gameId
        )?.icon ||
        "🎮"
    );

}


async function updateGame(
    gameId,
    changes
) {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_games")
                .update(
                    changes
                )
                .eq(
                    "game_id",
                    gameId
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        const index =
            state.games.findIndex(
                game =>
                    game.game_id ===
                    gameId
            );


        if (index !== -1) {

            state.games[index] =
                data;

        }


        renderGames();


        await writeAdminLog(
            "Modifica gioco",
            "game",
            gameId,
            changes
        );


        showToast(
            "Impostazioni gioco aggiornate."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile modificare il gioco."
        );

    }

}


/* =========================================================
   MESSAGGI
========================================================= */

async function loadMessages() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_messages")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {
            throw error;
        }


        state.messages =
            data || [];


        renderMessages();
        renderDashboardMessages();

    } catch (error) {

        handleError(
            error,
            "Impossibile caricare i messaggi."
        );

    }

}


function renderMessages() {

    const container =
        $("messagesList");


    if (!container) {
        return;
    }


    if (
        state.messages.length ===
        0
    ) {

        container.innerHTML =
            `

                <div class="empty-state">

                    <div class="empty-icon">
                        📢
                    </div>

                    <h3>
                        Nessun messaggio
                    </h3>

                    <p>
                        Non ci sono ancora comunicazioni.
                    </p>

                </div>

            `;

        return;

    }


    container.innerHTML =
        state.messages
            .map(
                message => `

                    <div
                        class="admin-message-row"
                    >

                        <div>

                            <strong>
                                ${escapeHtml(
                                    message.title ||
                                    getMessageTypeLabel(
                                        message.type
                                    )
                                )}
                            </strong>

                            <p>
                                ${escapeHtml(
                                    message.message
                                )}
                            </p>

                            <small>

                                ${escapeHtml(
                                    getMessageTypeLabel(
                                        message.type
                                    )
                                )}

                                ·

                                ${
                                    message.active
                                        ? "🟢 Attivo"
                                        : "⚪ Disattivato"
                                }

                                ${
                                    message.target_game
                                        ? ` · ${escapeHtml(message.target_game)}`
                                        : ""
                                }

                                ${
                                    message.scheduled_at
                                        ? ` · Programmato: ${escapeHtml(formatDate(message.scheduled_at))}`
                                        : ""
                                }

                            </small>

                        </div>

                        <div>

                            <button
                                class="small-button"
                                type="button"
                                data-message-action="toggle"
                                data-message-id="${escapeHtml(message.id)}"
                            >
                                ${
                                    message.active
                                        ? "Disattiva"
                                        : "Attiva"
                                }
                            </button>

                            <button
                                class="danger-small-button"
                                type="button"
                                data-message-action="delete"
                                data-message-id="${escapeHtml(message.id)}"
                            >
                                Elimina
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-message-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const action =
                            button.dataset.messageAction;

                        const messageId =
                            button.dataset.messageId;


                        if (
                            action ===
                            "toggle"
                        ) {

                            await toggleMessage(
                                messageId
                            );

                        }


                        if (
                            action ===
                            "delete"
                        ) {

                            await deleteMessage(
                                messageId
                            );

                        }

                    }
                );

            }
        );

}


function renderDashboardMessages() {

    const container =
        $("dashboardMessages");


    if (!container) {
        return;
    }


    const activeMessages =
        state.messages.filter(
            message => {

                if (!message.active) {
                    return false;
                }


                if (
                    message.expires_at &&
                    new Date(
                        message.expires_at
                    ).getTime() <
                    Date.now()
                ) {

                    return false;
                }


                return true;

            }
        );


    if (
        activeMessages.length ===
        0
    ) {

        container.innerHTML =
            "<p>Nessun messaggio attivo.</p>";

        return;

    }


    container.innerHTML =
        activeMessages
            .slice(
                0,
                5
            )
            .map(
                message => `

                    <div class="admin-message-row">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    message.title ||
                                    "Comunicazione"
                                )}
                            </strong>

                            <p>
                                ${escapeHtml(
                                    message.message
                                )}
                            </p>

                        </div>

                    </div>

                `
            )
            .join("");

}


function getMessageTypeLabel(
    type
) {

    switch (type) {

        case "important":
            return "⚠️ Importante";

        case "urgent":
            return "🚨 Urgente";

        case "popup":
            return "🪟 Popup globale";

        case "banner":
            return "📌 Banner";

        case "maintenance":
            return "🔧 Manutenzione";

        default:
            return "📢 Messaggio";

    }

}


/* =========================================================
   CREA MESSAGGIO
========================================================= */

async function createMessageFromForm() {

    const type =
        $("messageType")
            ?.value ||
        "normal";


    const title =
        $("messageTitle")
            ?.value
            .trim() ||
        "";


    const message =
        $("messageContent")
            ?.value
            .trim() ||
        "";


    const target =
        $("messageTarget")
            ?.value ||
        "all";


    const targetGame =
        target ===
            "game"
            ? (
                $("messageGame")
                    ?.value ||
                null
            )
            : null;


    const scheduledAt =
        toIsoOrNull(
            $("messageSchedule")
                ?.value ||
            ""
        );


    const persistent =
        Boolean(
            $("messagePersistent")
                ?.checked
        );


    const active =
        $("messageActive")
        ? Boolean(
            $("messageActive")
                .checked
        )
        : true;


    if (!message) {

        showToast(
            "Scrivi un messaggio prima di pubblicarlo.",
            "error"
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_messages")
                .insert({

                    type,

                    title,

                    message,

                    active,

                    persistent,

                    target_game:
                        targetGame,

                    online_only:
                        target ===
                        "online",

                    scheduled_at:
                        scheduledAt,

                    expires_at:
                        null

                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        state.messages.unshift(
            data
        );


        renderMessages();
        renderDashboardMessages();


        await writeAdminLog(
            "Creazione messaggio",
            "message",
            data.id,
            {

                type,

                title,

                target

            }
        );


        clearMessageForm();


        showToast(
            "📢 Messaggio pubblicato."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile pubblicare il messaggio."
        );

    }

}


function clearMessageForm() {

    [
        "messageTitle",
        "messageContent",
        "messageSchedule"

    ].forEach(
        id => {

            const element =
                $(id);

            if (element) {

                element.value =
                    "";

            }

        }
    );


    const persistent =
        $("messagePersistent");


    if (persistent) {

        persistent.checked =
            false;

    }


    const active =
        $("messageActive");


    if (active) {

        active.checked =
            true;

    }

}


/* =========================================================
   MOSTRA/NASCONDI SELETTORE GIOCO
========================================================= */

const messageTarget =
    $("messageTarget");


const messageGameWrapper =
    $("messageGameWrapper");


if (messageTarget) {

    messageTarget.addEventListener(
        "change",
        () => {

            if (!messageGameWrapper) {
                return;
            }


            messageGameWrapper.classList.toggle(
                "hidden",
                messageTarget.value !==
                    "game"
            );

        }
    );

}


/* =========================================================
   PULSANTE PUBBLICA
========================================================= */

const publishMessageButton =
    $("publishMessageButton");


if (publishMessageButton) {

    publishMessageButton.addEventListener(
        "click",
        createMessageFromForm
    );

}


const refreshMessagesButton =
    $("refreshMessagesButton");


if (refreshMessagesButton) {

    refreshMessagesButton.addEventListener(
        "click",
        loadMessages
    );

}


/* =========================================================
   ELIMINA TUTTI I MESSAGGI
========================================================= */

const deleteAllMessagesButton =
    $("deleteAllMessagesButton");


if (deleteAllMessagesButton) {

    deleteAllMessagesButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "ATTENZIONE!\n\n" +
                    "Stai per eliminare DEFINITIVAMENTE tutti i messaggi.\n\n" +
                    "L'operazione non può essere annullata.\n\n" +
                    "Continuare?"
                );


            if (!confirmed) {
                return;
            }


            deleteAllMessagesButton.disabled =
                true;

            deleteAllMessagesButton.textContent =
                "🔄 Eliminazione...";


            try {

                const {
                    error
                } =
                    await adminDb
                        .from("admin_messages")
                        .delete()
                        .gt(
                            "id",
                            0
                        );


                if (error) {
                    throw error;
                }


                state.messages =
                    [];


                renderMessages();
                renderDashboardMessages();


                await writeAdminLog(
                    "Eliminazione di tutti i messaggi",
                    "messages"
                );


                showToast(
                    "🗑️ Tutti i messaggi sono stati eliminati."
                );


            } catch (error) {

                handleError(
                    error,
                    "Impossibile eliminare tutti i messaggi."
                );


            } finally {

                deleteAllMessagesButton.disabled =
                    false;

                deleteAllMessagesButton.textContent =
                    "🗑️ Elimina tutti i messaggi";

            }

        }
    );

}


async function toggleMessage(
    messageId
) {

    const message =
        state.messages.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    messageId
                )
        );


    if (!message) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_messages")
                .update({

                    active:
                        !message.active

                })
                .eq(
                    "id",
                    messageId
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        const index =
            state.messages.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        messageId
                    )
            );


        if (index !== -1) {

            state.messages[index] =
                data;

        }


        renderMessages();
        renderDashboardMessages();


        await writeAdminLog(
            "Modifica stato messaggio",
            "message",
            messageId,
            {
                active:
                    data.active
            }
        );


        showToast(
            data.active
                ? "Messaggio attivato."
                : "Messaggio disattivato."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile modificare il messaggio."
        );

    }

}


async function deleteMessage(
    messageId
) {

    const confirmed =
        window.confirm(
            "Eliminare definitivamente questo messaggio?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await adminDb
                .from("admin_messages")
                .delete()
                .eq(
                    "id",
                    messageId
                );


        if (error) {
            throw error;
        }


        state.messages =
            state.messages.filter(
                item =>
                    String(
                        item.id
                    ) !==
                    String(
                        messageId
                    )
            );


        renderMessages();
        renderDashboardMessages();


        await writeAdminLog(
            "Eliminazione messaggio",
            "message",
            messageId
        );


        showToast(
            "Messaggio eliminato."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile eliminare il messaggio."
        );

    }

}


/* =========================================================
   UNO ROOMS
========================================================= */

async function loadUnoRooms() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("uno_rooms")
                .select(
                    "id, room_code, host_id, status, created_at, updated_at"
                )
                .in(
                    "status",
                    [
                        "waiting",
                        "playing"
                    ]
                )
                .order(
                    "updated_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {
            throw error;
        }


        state.unoRooms =
            data || [];


        renderUnoRooms();


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare le stanze UNO."
        );

    }

}


function getActiveUnoRooms() {

    return state.unoRooms.filter(
        room =>

            (
                room.status ===
                "waiting" ||

                room.status ===
                "playing"
            )

            &&

            isRecent(
                room.updated_at,
                CONFIG.activeRoomMaxAgeMs
            )
    );

}


function getActiveUnoPlayers() {

    const activeRoomIds =
        new Set(
            getActiveUnoRooms()
                .map(
                    room =>
                        String(
                            room.id
                        )
                )
        );


    return state.unoPlayers.filter(
        player => {

            if (
                !player.connected
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


            const recentlySeen =
                (
                    Date.now() -
                    lastSeen
                ) <=
                CONFIG.onlinePlayerMaxAgeMs;


            return (
                recentlySeen &&
                activeRoomIds.has(
                    String(
                        player.room_id
                    )
                )
            );

        }
    );

}


function renderUnoRooms() {

    const container =
        $("unoRoomsList");


    if (!container) {
        return;
    }


    const activeRooms =
        getActiveUnoRooms();


    setText(
        "unoRoomCount",
        String(
            activeRooms.length
        )
    );


    setText(
        "unoPlayingCount",
        String(
            activeRooms.filter(
                room =>
                    room.status ===
                    "playing"
            ).length
        )
    );


    setText(
        "unoPlayersCount",
        String(
            getActiveUnoPlayers().length
        )
    );


    setText(
        "dashboardRooms",
        String(
            activeRooms.length
        )
    );


    if (
        activeRooms.length ===
        0
    ) {

        container.innerHTML =
            `

                <div class="empty-state">

                    <div class="empty-icon">
                        🏠
                    </div>

                    <h3>
                        Nessuna stanza UNO attiva
                    </h3>

                    <p>
                        Al momento non ci sono stanze attive.
                    </p>

                </div>

            `;

        return;

    }


    container.innerHTML =
        activeRooms
            .map(
                room => {

                    const playersInRoom =
                        state.unoPlayers.filter(
                            player =>
                                String(
                                    player.room_id
                                ) ===
                                String(
                                    room.id
                                ) &&
                                player.connected &&
                                player.last_seen &&
                                isRecent(
                                    player.last_seen,
                                    CONFIG.onlinePlayerMaxAgeMs
                                )
                        );


                    return `

                        <div class="admin-room-row">

                            <div>

                                <strong>
                                    🏠 ${escapeHtml(room.room_code)}
                                </strong>

                                <small>

                                    ${
                                        room.status ===
                                        "playing"
                                            ? "🎮 In partita"
                                            : "⏳ In attesa"
                                    }

                                    ·

                                    ${playersInRoom.length}
                                    giocatori

                                    ·

                                    Aggiornata
                                    ${escapeHtml(
                                        formatDate(
                                            room.updated_at
                                        )
                                    )}

                                </small>

                            </div>

                            <div>

                                <button
                                    class="small-button"
                                    type="button"
                                    data-uno-action="restart"
                                    data-room-id="${escapeHtml(room.id)}"
                                >
                                    Riavvia
                                </button>

                                <button
                                    class="danger-small-button"
                                    type="button"
                                    data-uno-action="close"
                                    data-room-id="${escapeHtml(room.id)}"
                                >
                                    Chiudi
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-uno-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const action =
                            button.dataset.unoAction;

                        const roomId =
                            button.dataset.roomId;


                        if (
                            action ===
                            "restart"
                        ) {

                            await restartUnoRoom(
                                roomId
                            );

                        }


                        if (
                            action ===
                            "close"
                        ) {

                            await closeUnoRoom(
                                roomId
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   UNO PLAYERS
========================================================= */

async function loadUnoPlayers() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("uno_players")
                .select(
                    "id, room_id, player_id, nickname, is_host, is_ready, connected, last_seen, created_at"
                );


        if (error) {
            throw error;
        }


        state.unoPlayers =
            data || [];


        renderPlayers();


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare i giocatori UNO."
        );

    }

}


/* =========================================================
   ONLINE PLAYERS
========================================================= */

function renderOnlinePlayers() {

    const online =
        getActiveUnoPlayers();


    setText(
        "dashboardOnlinePlayers",
        String(
            online.length
        )
    );


    setText(
        "statsOnline",
        String(
            online.length
        )
    );


}


/* =========================================================
   PLAYER LIST
========================================================= */

function renderPlayers() {

    const container =
        $("playersList");


    if (!container) {
        return;
    }


    const blockedIds =
        new Set(
            state.blockedUsers
                .map(
                    user =>
                        String(
                            user.player_id
                        )
                )
        );


    const search =
        (
            $("playerSearch")
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const filter =
        $("playerFilter")
            ?.value ||
        "all";


    /*
       Raggruppiamo per nickname.
       In questo modo:
       Davide
       davide
       DAVIDE
       vengono mostrati come un solo giocatore.
    */

    const grouped =
        new Map();


    state.unoPlayers.forEach(
        player => {

            const nicknameKey =
                normalizeNickname(
                    player.nickname
                );


            if (!nicknameKey) {
                return;
            }


            if (
                !grouped.has(
                    nicknameKey
                )
            ) {

                grouped.set(
                    nicknameKey,
                    []
                );

            }


            grouped
                .get(
                    nicknameKey
                )
                .push(
                    player
                );

        }
    );


    const activePlayers =
        getActiveUnoPlayers();


    const uniquePlayers =
        Array.from(
            grouped.entries()
        )
            .map(
                ([nicknameKey, history]) => {

                    const sortedHistory =
                        [...history]
                            .sort(
                                (a, b) => {

                                    const aTime =
                                        new Date(
                                            a.last_seen ||
                                            a.created_at ||
                                            0
                                        ).getTime();


                                    const bTime =
                                        new Date(
                                            b.last_seen ||
                                            b.created_at ||
                                            0
                                        ).getTime();


                                    return bTime -
                                        aTime;

                                }
                            );


                    const latest =
                        sortedHistory[0];


                    const playerIds =
                        [
                            ...new Set(
                                history
                                    .map(
                                        player =>
                                            player.player_id
                                    )
                                    .filter(
                                        playerId =>
                                            playerId
                                    )
                                    .map(
                                        playerId =>
                                            String(
                                                playerId
                                            )
                                    )
                            )
                        ];


                    const isBlocked =
                        playerIds.some(
                            playerId =>
                                blockedIds.has(
                                    playerId
                                )
                        );


                    const isOnline =
                        activePlayers.some(
                            player =>
                                playerIds.includes(
                                    String(
                                        player.player_id
                                    )
                                )
                        );


                    return {

                        playerId:
                            playerIds[0] ||
                            nicknameKey,

                        playerIds,

                        nicknameKey,

                        latest,

                        history:
                            sortedHistory,

                        isBlocked,

                        isOnline

                    };

                }
            )
            .filter(
                player => {

                    if (
                        filter ===
                        "online" &&
                        !player.isOnline
                    ) {

                        return false;

                    }


                    if (
                        filter ===
                        "blocked" &&
                        !player.isBlocked
                    ) {

                        return false;

                    }


                    if (search) {

                        const haystack =
                            `${player.latest?.nickname || ""} ${player.nicknameKey}`
                                .toLowerCase();


                        if (
                            !haystack.includes(
                                search
                            )
                        ) {

                            return false;

                        }

                    }


                    return true;

                }
            )
            .sort(
                (a, b) => {

                    const aTime =
                        a.latest?.last_seen
                            ? new Date(
                                a.latest.last_seen
                            ).getTime()
                            : new Date(
                                a.latest?.created_at || 0
                            ).getTime();


                    const bTime =
                        b.latest?.last_seen
                            ? new Date(
                                b.latest.last_seen
                            ).getTime()
                            : new Date(
                                b.latest?.created_at || 0
                            ).getTime();


                    return bTime -
                        aTime;

                }
            );


    if (
        uniquePlayers.length ===
        0
    ) {

        container.innerHTML =
            "<p>Nessun giocatore trovato.</p>";

        return;

    }


    container.innerHTML =
        uniquePlayers
            .map(
                player => {

                    const nickname =
                        getDisplayNickname(
                            player.latest?.nickname
                        );


                    const historyHtml =
                        player.history
                            .map(
                                session => `

                                    <div
                                        style="
                                            padding:10px 0;
                                            border-top:1px solid rgba(255,255,255,0.08);
                                        "
                                    >

                                        <strong>
                                            ${escapeHtml(
                                                session.nickname ||
                                                nickname
                                            )}
                                        </strong>

                                        <small
                                            style="
                                                display:block;
                                                margin-top:4px;
                                                opacity:0.7;
                                            "
                                        >

                                            Stanza:
                                            ${escapeHtml(
                                                String(
                                                    session.room_id || ""
                                                ).slice(
                                                    0,
                                                    8
                                                )
                                            )}

                                            ·

                                            Ingresso:
                                            ${escapeHtml(
                                                formatDate(
                                                    session.created_at
                                                )
                                            )}

                                            ·

                                            ${
                                                session.connected
                                                    ? "🟢 Attualmente online"
                                                    : "⚪ Offline"
                                            }

                                        </small>

                                    </div>

                                `
                            )
                            .join("");


                    return `

                        <div class="admin-player-row">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        nickname
                                    )}
                                </strong>

                                <small>

                                    ${
                                        player.isOnline
                                            ? "🟢 Online"
                                            : "⚪ Offline"
                                    }

                                    ·

                                    ${
                                        player.history.length
                                    }
                                    partecipazioni

                                    ·

                                    ${
                                        player.isBlocked
                                            ? "🔒 Bloccato"
                                            : "✅ Non bloccato"
                                    }

                                </small>


                                <details
                                    style="
                                        margin-top:10px;
                                    "
                                >

                                    <summary
                                        style="
                                            cursor:pointer;
                                            font-weight:700;
                                        "
                                    >
                                        📜 Mostra cronologia
                                    </summary>

                                    <div
                                        style="
                                            margin-top:8px;
                                        "
                                    >
                                        ${historyHtml}
                                    </div>

                                </details>

                            </div>


                            <div>

                                ${
                                    player.isBlocked
                                        ? `
                                            <button
                                                class="small-button"
                                                type="button"
                                                data-player-action="unblock"
                                                data-player-ids="${escapeHtml(player.playerIds.join(","))}"
                                            >
                                                Sblocca
                                            </button>
                                        `
                                        : `
                                            <button
                                                class="danger-small-button"
                                                type="button"
                                                data-player-action="block"
                                                data-player-ids="${escapeHtml(player.playerIds.join(","))}"
                                                data-player-nickname="${escapeHtml(nickname)}"
                                            >
                                                Blocca
                                            </button>
                                        `
                                }


                                ${
                                    player.isOnline
                                        ? `
                                            <button
                                                class="small-button"
                                                type="button"
                                                data-player-action="kick"
                                                data-player-ids="${escapeHtml(player.playerIds.join(","))}"
                                            >
                                                Espelli
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-player-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const action =
                            button.dataset.playerAction;


                        const playerIds =
                            (
                                button.dataset.playerIds ||
                                ""
                            )
                                .split(",")
                                .map(
                                    playerId =>
                                        playerId.trim()
                                )
                                .filter(Boolean);


                        const nickname =
                            button.dataset.playerNickname ||
                            "";


                        if (
                            action ===
                            "block"
                        ) {

                            await blockPlayers(
                                playerIds,
                                nickname
                            );

                        }


                        if (
                            action ===
                            "unblock"
                        ) {

                            await unblockPlayers(
                                playerIds
                            );

                        }


                        if (
                            action ===
                            "kick"
                        ) {

                            await kickPlayers(
                                playerIds
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   BLOCKED USERS
========================================================= */

async function loadBlockedUsers() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_blocked_users")
                .select("*")
                .order(
                    "blocked_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {
            throw error;
        }


        state.blockedUsers =
            data || [];


        renderBlockedUsers();
        renderPlayers();


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare gli utenti bloccati."
        );

    }

}


function renderBlockedUsers() {

    /*
       La versione attuale del tuo HTML non ha
       una sezione dedicata agli utenti bloccati.
       Lo stato rimane comunque caricato e
       utilizzato nella schermata Giocatori.
    */

}


/* =========================================================
   BLOCK PLAYERS
========================================================= */

async function blockPlayers(
    playerIds,
    nickname
) {

    const reason =
        window.prompt(
            "Motivo del blocco:",
            "Violazione delle regole"
        );


    if (reason === null) {
        return;
    }


    if (
        !playerIds ||
        playerIds.length === 0
    ) {

        showToast(
            "Nessun ID giocatore disponibile.",
            "error"
        );

        return;

    }


    try {

        for (
            const playerId of playerIds
        ) {

            const {
                error
            } =
                await adminDb
                    .from("admin_blocked_users")
                    .upsert(
                        {

                            player_id:
                                playerId,

                            nickname:
                                nickname,

                            reason:
                                reason,

                            blocked_by:
                                state.currentAdminId

                        },
                        {
                            onConflict:
                                "player_id"
                        }
                    );


            if (error) {
                throw error;
            }

        }


        const {
            error:
                playersError
        } =
            await adminDb
                .from("uno_players")
                .update({

                    connected:
                        false,

                    last_seen:
                        null

                })
                .in(
                    "player_id",
                    playerIds
                );


        if (playersError) {
            throw playersError;
        }


        await writeAdminLog(
            "Blocco giocatore",
            "player",
            nickname,
            {
                nickname,
                reason,
                player_ids:
                    playerIds
            }
        );


        await loadBlockedUsers();
        await loadUnoPlayers();
        await loadStats();


        showToast(
            "🔒 Giocatore bloccato."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile bloccare il giocatore."
        );

    }

}


/* =========================================================
   UNBLOCK PLAYERS
========================================================= */

async function unblockPlayers(
    playerIds
) {

    if (
        !playerIds ||
        playerIds.length === 0
    ) {

        showToast(
            "Nessun ID giocatore disponibile.",
            "error"
        );

        return;

    }


    try {

        const {
            error
        } =
            await adminDb
                .from("admin_blocked_users")
                .delete()
                .in(
                    "player_id",
                    playerIds
                );


        if (error) {
            throw error;
        }


        await writeAdminLog(
            "Sblocco giocatore",
            "player",
            playerIds.join(","),
            {
                player_ids:
                    playerIds
            }
        );


        await loadBlockedUsers();


        showToast(
            "🔓 Giocatore sbloccato."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile sbloccare il giocatore."
        );

    }

}


/* =========================================================
   KICK PLAYERS
========================================================= */

async function kickPlayers(
    playerIds
) {

    const confirmed =
        window.confirm(
            "Espellere questo giocatore?"
        );


    if (!confirmed) {
        return;
    }


    if (
        !playerIds ||
        playerIds.length === 0
    ) {

        showToast(
            "Nessun ID giocatore disponibile.",
            "error"
        );

        return;

    }


    try {

        const {
            error
        } =
            await adminDb
                .from("uno_players")
                .update({

                    connected:
                        false,

                    last_seen:
                        null

                })
                .in(
                    "player_id",
                    playerIds
                );


        if (error) {
            throw error;
        }


        await writeAdminLog(
            "Espulsione giocatore",
            "player",
            playerIds.join(","),
            {
                player_ids:
                    playerIds
            }
        );


        await loadUnoPlayers();
        await loadStats();


        showToast(
            "👢 Giocatore espulso."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile espellere il giocatore."
        );

    }

}


/* =========================================================
   CLOSE UNO ROOM
========================================================= */

async function closeUnoRoom(
    roomId
) {

    const confirmed =
        window.confirm(
            "Chiudere questa stanza UNO?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await adminDb
                .from("uno_rooms")
                .update({

                    status:
                        "closed",

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    roomId
                );


        if (error) {
            throw error;
        }


        await adminDb
            .from("uno_players")
            .update({

                connected:
                    false,

                last_seen:
                    null

            })
            .eq(
                "room_id",
                roomId
            );


        await writeAdminLog(
            "Chiusura stanza UNO",
            "uno_room",
            roomId
        );


        await reloadUno();


        showToast(
            "Stanza UNO chiusa."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile chiudere la stanza UNO."
        );

    }

}


/* =========================================================
   CLOSE ALL UNO ROOMS
========================================================= */

async function closeAllUnoRooms() {

    const activeRooms =
        getActiveUnoRooms();


    if (
        activeRooms.length ===
        0
    ) {

        showToast(
            "Non ci sono stanze UNO attive."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Chiudere tutte le ${activeRooms.length} stanze UNO attive?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const roomIds =
            activeRooms.map(
                room =>
                    room.id
            );


        const {
            error
        } =
            await adminDb
                .from("uno_rooms")
                .update({

                    status:
                        "closed",

                    updated_at:
                        new Date().toISOString()

                })
                .in(
                    "id",
                    roomIds
                );


        if (error) {
            throw error;
        }


        await adminDb
            .from("uno_players")
            .update({

                connected:
                    false,

                last_seen:
                    null

            })
            .in(
                "room_id",
                roomIds
            );


        await writeAdminLog(
            "Chiusura tutte le stanze UNO",
            "uno",
            null,
            {
                rooms:
                    activeRooms.length
            }
        );


        await reloadUno();


        showToast(
            "Tutte le stanze UNO sono state chiuse."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile chiudere tutte le stanze UNO."
        );

    }

}


/* =========================================================
   RESTART UNO
========================================================= */

async function restartUnoRoom(
    roomId
) {

    const confirmed =
        window.confirm(
            "Riavviare questa stanza UNO?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await adminDb
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
                    roomId
                );


        if (error) {
            throw error;
        }


        const {
            error:
                playersError
        } =
            await adminDb
                .from("uno_players")
                .update({

                    is_ready:
                        false

                })
                .eq(
                    "room_id",
                    roomId
                );


        if (playersError) {
            throw playersError;
        }


        await writeAdminLog(
            "Riavvio stanza UNO",
            "uno_room",
            roomId
        );


        await reloadUno();


        showToast(
            "Stanza UNO riavviata."
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile riavviare la stanza UNO."
        );

    }

}


/* =========================================================
   PULSANTE CHIUDI TUTTE UNO
========================================================= */

const closeAllUnoButton =
    $("closeAllUnoButton");


if (closeAllUnoButton) {

    closeAllUnoButton.addEventListener(
        "click",
        closeAllUnoRooms
    );

}


const refreshUnoButton =
    $("refreshUnoButton");


if (refreshUnoButton) {

    refreshUnoButton.addEventListener(
        "click",
        reloadUno
    );

}


/* =========================================================
   PLAYERS REFRESH / SEARCH
========================================================= */

const refreshPlayersButton =
    $("refreshPlayersButton");


if (refreshPlayersButton) {

    refreshPlayersButton.addEventListener(
        "click",
        async () => {

            await loadUnoPlayers();
            await loadBlockedUsers();
            await loadStats();

        }
    );

}


const playerSearch =
    $("playerSearch");


if (playerSearch) {

    playerSearch.addEventListener(
        "input",
        renderPlayers
    );

}


const playerFilter =
    $("playerFilter");


if (playerFilter) {

    playerFilter.addEventListener(
        "change",
        renderPlayers
    );

}


/* =========================================================
   STATS
========================================================= */

async function loadStats() {

    try {

        const [
            roomsResult,
            playersResult,
            activeRoomsResult
        ] =
            await Promise.all([

                adminDb
                    .from("uno_rooms")
                    .select(
                        "id, status, updated_at"
                    ),

                adminDb
                    .from("uno_players")
                    .select(
                        "nickname"
                    ),

                adminDb
                    .from("uno_rooms")
                    .select(
                        "id, status, updated_at"
                    )
                    .in(
                        "status",
                        [
                            "waiting",
                            "playing"
                        ]
                    )

            ]);


        if (roomsResult.error) {
            throw roomsResult.error;
        }


        if (playersResult.error) {
            throw playersResult.error;
        }


        if (activeRoomsResult.error) {
            throw activeRoomsResult.error;
        }


        const activeRooms =
            (
                activeRoomsResult.data ||
                []
            ).filter(
                room =>
                    isRecent(
                        room.updated_at,
                        CONFIG.activeRoomMaxAgeMs
                    )
            );


        const onlinePlayers =
            getActiveUnoPlayers();


        /*
           Contiamo i nickname unici.
           Quindi più righe con lo stesso nickname
           vengono conteggiate come un solo giocatore.
        */

        const uniqueNicknames =
            new Set(
                (
                    playersResult.data ||
                    []
                )
                    .map(
                        player =>
                            normalizeNickname(
                                player.nickname
                            )
                    )
                    .filter(
                        nickname =>
                            nickname
                    )
            );


        setText(
            "statsMatches",
            String(
                activeRooms.filter(
                    room =>
                        room.status ===
                        "playing"
                ).length
            )
        );


        setText(
            "statsPlayers",
            String(
                uniqueNicknames.size
            )
        );


        setText(
            "statsRooms",
            String(
                activeRooms.length
            )
        );


        setText(
            "statsOnline",
            String(
                onlinePlayers.length
            )
        );


        setText(
            "dashboardOnlinePlayers",
            String(
                onlinePlayers.length
            )
        );


        setText(
            "dashboardRooms",
            String(
                activeRooms.length
            )
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare le statistiche."
        );

    }

}


/* =========================================================
   STATS GIOCHI
========================================================= */

function renderStatsGames() {

    const container =
        $("statsGamesList");


    if (!container) {
        return;
    }


    container.innerHTML =
        state.games
            .map(
                game => `

                    <div class="admin-game-row">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    getGameIcon(
                                        game.game_id
                                    )
                                )}
                                ${escapeHtml(
                                    game.game_name
                                )}
                            </strong>

                            <small>
                                ${
                                    game.enabled
                                        ? "🟢 Attivo"
                                        : "🔴 Disabilitato"
                                }
                            </small>

                        </div>

                    </div>

                `
            )
            .join("");

}


const refreshStatsButton =
    $("refreshStatsButton");


if (refreshStatsButton) {

    refreshStatsButton.addEventListener(
        "click",
        async () => {

            await loadStats();
            renderStatsGames();
            await loadRecentRooms();

        }
    );

}


/* =========================================================
   RECENT ROOMS
========================================================= */

async function loadRecentRooms() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("uno_rooms")
                .select(
                    "id, room_code, status, created_at, updated_at"
                )
                .order(
                    "updated_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    20
                );


        if (error) {
            throw error;
        }


        const containers = [

            $("recentRoomsList")

        ].filter(Boolean);


        containers.forEach(
            container => {

                if (
                    !data ||
                    data.length ===
                    0
                ) {

                    container.innerHTML =
                        "<p>Nessuna stanza recente.</p>";

                    return;

                }


                container.innerHTML =
                    data
                        .map(
                            room => `

                                <div class="admin-room-row">

                                    <div>

                                        <strong>
                                            🏠 ${escapeHtml(room.room_code)}
                                        </strong>

                                        <small>
                                            ${escapeHtml(room.status)}
                                            ·
                                            ${escapeHtml(
                                                formatDate(
                                                    room.updated_at
                                                )
                                            )}
                                        </small>

                                    </div>

                                </div>

                            `
                        )
                        .join("");

            }
        );


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare le stanze recenti."
        );

    }

}


/* =========================================================
   LOGS
========================================================= */

async function writeAdminLog(
    action,
    targetType = null,
    targetId = null,
    details = {}
) {

    try {

        const {
            error
        } =
            await adminDb
                .from("admin_logs")
                .insert({

                    action,

                    target_type:
                        targetType,

                    target_id:
                        targetId !==
                            null &&
                        targetId !==
                            undefined
                            ? String(
                                targetId
                            )
                            : null,

                    details:
                        details ||
                        {},

                    admin_identifier:
                        state.currentUser
                            ?.email ||
                        state.currentAdminId

                });


        if (error) {

            console.warn(
                "⚠️ Admin log:",
                error
            );

        }

    } catch (error) {

        console.warn(
            "⚠️ Errore salvataggio log:",
            error
        );

    }

}


async function loadLogs() {

    try {

        const {
            data,
            error
        } =
            await adminDb
                .from("admin_logs")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    100
                );


        if (error) {
            throw error;
        }


        state.logs =
            data || [];


        renderLogs();


    } catch (error) {

        handleError(
            error,
            "Impossibile caricare i log Admin."
        );

    }

}


function renderLogs() {

    const container =
        $("logsList");


    if (!container) {
        return;
    }


    if (
        state.logs.length ===
        0
    ) {

        container.innerHTML =
            "<p>Nessuna attività registrata.</p>";

        return;

    }


    container.innerHTML =
        state.logs
            .map(
                log => `

                    <div class="admin-log-row">

                        <strong>
                            ${escapeHtml(
                                log.action
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                formatDate(
                                    log.created_at
                                )
                            )}
                        </small>

                    </div>

                `
            )
            .join("");

}


const refreshLogsButton =
    $("refreshLogsButton");


if (refreshLogsButton) {

    refreshLogsButton.addEventListener(
        "click",
        loadLogs
    );

}


/* =========================================================
   HEALTH
========================================================= */

async function checkSystemHealth() {

    const start =
        performance.now();


    try {

        const {
            error
        } =
            await adminDb
                .from("admin_settings")
                .select(
                    "id"
                )
                .eq(
                    "id",
                    1
                )
                .limit(
                    1
                );


        if (error) {
            throw error;
        }


        const latency =
            Math.round(
                performance.now() -
                start
            );


        setText(
            "healthadminDb",
            `Connesso · ${latency} ms`
        );


        const adminDbHealth =
            $("healthadminDb");


        if (adminDbHealth) {

            adminDbHealth.dataset.status =
                "online";

        }


        const healthSite =
            $("healthSite");


        if (healthSite) {

            healthSite.textContent =
                state.settings?.global_status ===
                    "online"
                    ? "Operativo"
                    : getStatusLabel(
                        state.settings
                            ?.global_status
                    );

        }


    } catch (error) {

        console.error(
            "Health adminDb:",
            error
        );


        setText(
            "healthadminDb",
            "Errore"
        );

    }

}


/* =========================================================
   REALTIME
========================================================= */

function setRealtimeStatus(
    status
) {

    const badge =
        $("realtimeBadge");


    const health =
        $("healthRealtime");


    if (
        status ===
        "SUBSCRIBED"
    ) {

        if (badge) {

            badge.classList.add(
                "active"
            );

        }


        if (health) {

            health.textContent =
                "Attivo";

        }

    } else if (
        status ===
        "CHANNEL_ERROR" ||
        status ===
        "TIMED_OUT"
    ) {

        if (badge) {

            badge.classList.remove(
                "active"
            );

        }


        if (health) {

            health.textContent =
                "Errore";

        }

    } else {

        if (health) {

            health.textContent =
                "Connessione...";

        }

    }

}


function stopRealtime() {

    state.realtimeChannels.forEach(
        channel => {

            try {

                adminDb.removeChannel(
                    channel
                );

            } catch {

                /* ignore */

            }

        }
    );


    state.realtimeChannels =
        [];

}


function setupRealtime() {

    stopRealtime();


    const settingsChannel =
        adminDb
            .channel(
                "admin-settings-channel"
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
                async () => {

                    await loadSettings();

                }
            )
            .subscribe(
                status => {

                    setRealtimeStatus(
                        status
                    );

                }
            );


    const messagesChannel =
        adminDb
            .channel(
                "admin-messages-channel"
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

                    await loadMessages();

                }
            )
            .subscribe();


    const gamesChannel =
        adminDb
            .channel(
                "admin-games-channel"
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

                    await loadGames();
                    renderStatsGames();

                }
            )
            .subscribe();


    const roomsChannel =
        adminDb
            .channel(
                "admin-uno-rooms-channel"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",
                    schema:
                        "public",
                    table:
                        "uno_rooms"
                },
                async () => {

                    await loadUnoRooms();
                    await loadStats();

                }
            )
            .subscribe();


    const playersChannel =
        adminDb
            .channel(
                "admin-uno-players-channel"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",
                    schema:
                        "public",
                    table:
                        "uno_players"
                },
                async () => {

                    await loadUnoPlayers();
                    await loadStats();

                }
            )
            .subscribe();


    state.realtimeChannels.push(

        settingsChannel,
        messagesChannel,
        gamesChannel,
        roomsChannel,
        playersChannel

    );

}


/* =========================================================
   RELOAD UNO
========================================================= */

async function reloadUno() {

    await Promise.all([

        loadUnoRooms(),

        loadUnoPlayers(),

        loadBlockedUsers()

    ]);


    renderOnlinePlayers();


    await loadStats();

}


/* =========================================================
   RELOAD DASHBOARD
========================================================= */

async function reloadDashboard() {

    await Promise.all([

        loadSettings(),

        loadGames(),

        loadMessages(),

        reloadUno(),

        loadRecentRooms(),

        loadLogs(),

        checkSystemHealth()

    ]);


    renderStatsGames();

}


/* =========================================================
   RELOAD BUTTON HEADER
========================================================= */

const reloadConfigButton =
    $("reloadConfigButton");


if (reloadConfigButton) {

    reloadConfigButton.addEventListener(
        "click",
        async () => {

            await reloadDashboard();

            showToast(
                "🔄 Configurazione aggiornata."
            );

        }
    );

}


/* =========================================================
   DANGER ACTIONS
========================================================= */

const blockAllGamesButton =
    $("blockAllGamesButton");


if (blockAllGamesButton) {

    blockAllGamesButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "Bloccare TUTTI i giochi?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const {
                    error
                } =
                    await adminDb
                        .from("admin_games")
                        .update({
                            enabled:
                                false
                        })
                        .neq(
                            "game_id",
                            ""
                        );


                if (error) {
                    throw error;
                }


                await writeAdminLog(
                    "Blocco di tutti i giochi",
                    "games"
                );


                await loadGames();


                showToast(
                    "⛔ Tutti i giochi sono stati bloccati.",
                    "error"
                );


            } catch (error) {

                handleError(
                    error,
                    "Impossibile bloccare tutti i giochi."
                );

            }

        }
    );

}


const closeAllRoomsButton =
    $("closeAllRoomsButton");


if (closeAllRoomsButton) {

    closeAllRoomsButton.addEventListener(
        "click",
        closeAllUnoRooms
    );

}


/* =========================================================
   MATCH BUTTONS
========================================================= */

const closeAllMatchesButton =
    $("closeAllMatchesButton");

const closeAllMatchesButtonTop =
    $("closeAllMatchesButtonTop");


async function closeAllMatches() {

    /*
       Nel sistema attuale le partite multiplayer
       gestite dal backend sono le stanze UNO.
       Quindi il comando deve chiudere realmente
       tutte le stanze UNO attive.
    */

    await closeAllUnoRooms();

}


if (closeAllMatchesButton) {

    closeAllMatchesButton.addEventListener(
        "click",
        closeAllMatches
    );

}


if (closeAllMatchesButtonTop) {

    closeAllMatchesButtonTop.addEventListener(
        "click",
        closeAllMatches
    );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    $("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "Uscire dalla Modalità Admin?"
                );


            if (!confirmed) {
                return;
            }


            stopRealtime();


            if (
                state.refreshTimer
            ) {

                clearInterval(
                    state.refreshTimer
                );

            }


            try {

                await adminDb.auth.signOut();

            } finally {

                window.location.href =
                    "../index.html";

            }

        }
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

adminDb.auth.onAuthStateChange(
    (
        event
    ) => {

        if (
            event ===
            "SIGNED_OUT"
        ) {

            stopRealtime();


            if (
                state.refreshTimer
            ) {

                clearInterval(
                    state.refreshTimer
                );

            }


            showLoginScreen();

        }

    }
);


/* =========================================================
   AUTO REFRESH
========================================================= */

function startAutoRefresh() {

    if (
        state.refreshTimer
    ) {

        clearInterval(
            state.refreshTimer
        );

    }


    state.refreshTimer =
        setInterval(
            async () => {

                try {

                    await loadUnoRooms();
                    await loadUnoPlayers();
                    await loadStats();

                } catch (error) {

                    console.error(
                        "Auto refresh Admin:",
                        error
                    );

                }

            },
            CONFIG.refreshIntervalMs
        );

}


/* =========================================================
   INIZIALIZZAZIONE ADMIN CENTER
========================================================= */

let adminInitialized =
    false;


async function initializeAdminCenter() {

    if (
        adminInitialized
    ) {

        return;

    }


    adminInitialized =
        true;


    try {

        setText(
            "adminUserEmail",
            state.currentUser?.email ||
            "Admin"
        );


        await reloadDashboard();


        setupRealtime();


        startAutoRefresh();


        showToast(
            "✅ Admin Center caricato."
        );


    } catch (error) {

        adminInitialized =
            false;


        handleError(
            error,
            "Impossibile inizializzare l'Admin Center."
        );

    }

}


/* =========================================================
   AVVIO
========================================================= */

checkExistingSession();