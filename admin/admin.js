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
                "user_id,enabled"
            )
            .eq(
                "user_id",
                data.user.id
            )
            .maybeSingle();


    if (adminError) {
        throw adminError;
    }


    if (!adminRecord || adminRecord.enabled !== true) {

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


/* Il submit del form gestisce anche Invio. Listener keydown separati
   causavano due richieste di login per la stessa azione. */


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
            .from(ADMIN_V2_TABLES.settings)
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

        new_rooms_enabled:
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
            .from(ADMIN_V2_TABLES.settings)
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
            "Impossibile caricare site_settings."
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
                settings.new_rooms_enabled
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
                .from(ADMIN_V2_TABLES.settings)
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

                new_rooms_enabled:
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

                new_rooms_enabled:
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

                new_rooms_enabled:
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

                        new_rooms_enabled:
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

                        new_rooms_enabled:
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

                    new_rooms_enabled:
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
                .from(ADMIN_V2_TABLES.games)
                .select("*")
                .order(
                    "name",
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

                        name:
                            game.name,

                        enabled:
                            true,

                        multiplayer_enabled:
                            true,

                        new_rooms_enabled:
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
                    .from(ADMIN_V2_TABLES.games)
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
                                            game.name
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
                                    data-game-field="new_rooms_enabled"
                                    data-game-id="${escapeHtml(game.game_id)}"
                                    ${game.new_rooms_enabled ? "checked" : ""}
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
                .from(ADMIN_V2_TABLES.games)
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
                .from(ADMIN_V2_TABLES.messages)
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
                                    message.game_id
                                        ? ` · ${escapeHtml(message.game_id)}`
                                        : ""
                                }

                                ${
                                    message.scheduled_start
                                        ? ` · Programmato: ${escapeHtml(formatDate(message.scheduled_start))}`
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
                    message.scheduled_end &&
                    new Date(
                        message.scheduled_end
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
                .from(ADMIN_V2_TABLES.messages)
                .insert({

                    type,

                    title,

                    message,

                    active,

                    persistent,

                    target,
                    game_id:
                        target === "game" ? targetGame : null,
                    scheduled_start:
                        scheduledAt,
                    scheduled_end:
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
                        .from(ADMIN_V2_TABLES.messages)
                        .delete()
                        .not(
                            "id",
                            "is",
                            null
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
                .from(ADMIN_V2_TABLES.messages)
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
                .from(ADMIN_V2_TABLES.messages)
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
                .from(ADMIN_V2_TABLES.blocked)
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
                    .from(ADMIN_V2_TABLES.blocked)
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
                .from(ADMIN_V2_TABLES.blocked)
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
                                    game.name
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

                    admin_user_id:
                        state.currentAdminId,

                    action,

                    target:
                        targetId !== null && targetId !== undefined
                            ? `${targetType || "admin"}:${String(targetId)}`
                            : targetType,

                    details:
                        details ||
                        {}

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
            .from(ADMIN_V2_TABLES.settings)
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
            "healthSupabase",
            `Connesso · ${latency} ms`
        );


        const adminDbHealth =
            $("healthSupabase");


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
            "healthSupabase",
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
                status === "TIMED_OUT" ? "Timeout" : "Errore";

        }

    } else if (status === "CLOSED") {

        if (badge) {
            badge.classList.remove("active");
        }

        if (health) {
            health.textContent = "Disconnesso";
        }

    } else {

        if (badge) {
            badge.classList.remove("active");
        }

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
                        ADMIN_V2_TABLES.settings
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
                        ADMIN_V2_TABLES.messages
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
                        ADMIN_V2_TABLES.games
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
                        .from(ADMIN_V2_TABLES.games)
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

/* =========================================================
   ADMIN V2 COMPATIBILITY LAYER
   Usa lo schema site_* già presente nello SQL del progetto.
   Le funzioni legacy sopra restano disponibili; queste definizioni
   vengono risolte per ultime e alimentano l'interfaccia V2.
========================================================= */

const ADMIN_V2_TABLES = Object.freeze({
    settings: "site_settings",
    games: "site_games",
    messages: "site_messages",
    blocked: "blocked_users",
    logs: "admin_logs"
});

const ADMIN_V2_STATUSES = [
    "available",
    "coming_soon",
    "maintenance"
];

const ADMIN_V2_GAME_META = [
    { id: "tris", name: "Tris", icon: "❌⭕", category: "Party", path: "games/tris.html", description: "Sfida un amico o affronta il computer nel classico gioco del Tris." },
    { id: "uno", name: "UNO", icon: "🃏", category: "Party", path: "games/uno.html", description: "Gioca a UNO con i tuoi amici online e sfidali in stanze private.", multiplayer: true, rooms: true },
    { id: "racing", name: "Racing 2D", icon: "🏎️", category: "Arcade", path: "games/racing.html", description: "Corri, schiva gli ostacoli e raggiungi il traguardo nel minor tempo possibile." },
    { id: "memory", name: "Memory", icon: "🧠", category: "Puzzle", path: "games/memory.html", description: "Trova tutte le coppie di carte nel minor numero di mosse possibile." },
    { id: "pizza", name: "Prepara la Pizza", icon: "🍕", category: "Cucina", path: "games/pizza.html", description: "Prepara gli ordini dei clienti, cucina le pizze e guadagna!" },
    { id: "balloons", name: "Scoppia i Palloncini", icon: "🎈", category: "Arcade", path: "games/balloons.html", description: "Scoppia più palloncini possibile prima che il tempo finisca." },
    { id: "aquarium", name: "Acquario Magico", icon: "🐠", category: "Relax", path: "games/aquarium.html", description: "Esplora l'acquario, raccogli stelle magiche e trova tesori nascosti." },
    { id: "undercover", name: "Undercover", icon: "🕵️", category: "Party", path: "games/undercover.html", description: "Scopri chi ha una parola diversa, sullo stesso telefono oppure online.", multiplayer: true, rooms: true },
    { id: "block-blast", name: "Block Blast", icon: "🧩", category: "Puzzle", path: "games/block-blast.html", description: "Posiziona i blocchi, completa righe e colonne e cerca di ottenere il punteggio più alto." },
    { id: "tetris", name: "Tetris", icon: "🧱", category: "Puzzle", path: "games/tetris.html", description: "Incastra i tetramini, completa le righe e resisti mentre la velocità aumenta." }
];

let adminV2Bound = false;
let adminV2UndercoverRooms = [];
let adminV2UndercoverPlayers = [];
const adminV2PendingActions = new Set();
let adminV2ConfirmOpen = false;

function adminV2Meta(gameId) {
    return ADMIN_V2_GAME_META.find(item => item.id === gameId) || {
        id: gameId,
        name: gameId,
        icon: "🎮",
        category: "Altro",
        path: `games/${gameId}.html`,
        description: ""
    };
}

function adminV2NormalizeGame(game) {
    const meta = adminV2Meta(game.game_id);
    const status = ADMIN_V2_STATUSES.includes(game.status)
        ? game.status
        : (game.enabled === false ? "maintenance" : "available");

    return {
        ...meta,
        ...game,
        game_id: game.game_id || meta.id,
        name: game.name || meta.name,
        icon: game.icon || meta.icon || "🎮",
        path: game.path ?? meta.path,
        description: game.description ?? meta.description,
        category: game.category ?? meta.category,
        status,
        visible: game.visible !== false,
        enabled: game.enabled !== false,
        multiplayer_enabled: game.multiplayer_enabled ?? Boolean(meta.multiplayer),
        new_rooms_enabled: game.new_rooms_enabled ?? Boolean(meta.rooms),
        sort_order: Number.isFinite(Number(game.sort_order)) ? Number(game.sort_order) : 0
    };
}

function adminV2EffectiveStatus(game, now = new Date()) {
    if (
        game.auto_release &&
        game.scheduled_release_at &&
        new Date(game.scheduled_release_at).getTime() <= now.getTime()
    ) {
        return "available";
    }
    return ADMIN_V2_STATUSES.includes(game.status) ? game.status : (game.enabled === false ? "maintenance" : "available");
}

function adminV2StatusLabel(status) {
    return {
        available: "Disponibile",
        coming_soon: "In arrivo",
        maintenance: "Manutenzione"
    }[status] || "Stato sconosciuto";
}

function adminV2DateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function adminV2IsoInput(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function adminV2FormatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
}

async function adminV2SafeRead(table, columns, configure) {
    try {
        let query = adminDb.from(table).select(columns);
        if (typeof configure === "function") query = configure(query);
        const result = await query;
        if (result.error) throw result.error;
        return result.data || [];
    } catch (error) {
        console.warn(`Admin V2: tabella ${table} non disponibile.`, error.message || error);
        return [];
    }
}

async function ensureSettingsRow() {
    const result = await adminDb
        .from(ADMIN_V2_TABLES.settings)
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (result.error) throw result.error;
    if (result.data) return result.data;

    const inserted = await adminDb
        .from(ADMIN_V2_TABLES.settings)
        .insert({ id: 1, global_status: "online" })
        .select("*")
        .single();

    if (inserted.error) throw inserted.error;
    return inserted.data;
}

async function loadSettings() {
    try {
        state.settings = await ensureSettingsRow();
        renderSettings();
        return state.settings;
    } catch (error) {
        handleError(error, "Impossibile caricare site_settings.");
        return null;
    }
}

function renderSettings() {
    const settings = state.settings || {};
    const values = {
        maintenanceToggle: settings.maintenance_enabled,
        emergencyToggle: settings.emergency_enabled,
        totalBlockToggle: settings.total_block_enabled,
        multiplayerToggle: settings.multiplayer_enabled,
        roomCreationToggle: settings.new_rooms_enabled,
        maintenanceTitle: settings.maintenance_title || "",
        maintenanceMessage: settings.maintenance_message || "",
        maintenanceEnd: adminV2DateInput(settings.maintenance_end_time),
        emergencyTitle: settings.emergency_title || "",
        emergencyMessage: settings.emergency_message || ""
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = $(id);
        if (!element) return;
        if (element.type === "checkbox") element.checked = Boolean(value);
        else element.value = value;
    });

    renderGlobalStatus();
}

function adminV2SettingPayload(changes) {
    const next = { ...changes };
    return next;
}

async function updateSettings(changes) {
    const payload = adminV2SettingPayload(changes);
    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.settings)
            .update(payload)
            .eq("id", 1)
            .select("*")
            .single();
        if (result.error) throw result.error;
        state.settings = result.data;
        renderSettings();
        await writeAdminLog("Aggiornamento impostazioni globali", "site_settings", "1", payload);
        showToast("✅ Impostazioni aggiornate.");
        return result.data;
    } catch (error) {
        handleError(error, "Impossibile aggiornare le impostazioni.");
        await loadSettings();
        return null;
    }
}

function adminV2Confirm(message) {
    return window.confirm(message);
}

function adminV2DoubleConfirm(firstMessage, secondMessage) {
    return adminV2Confirm(firstMessage) && adminV2Confirm(secondMessage);
}

function adminV2ConfirmAction({
    title,
    message,
    confirmLabel = "CONFERMA",
    cancelLabel = "ANNULLA",
    icon = "⚠️"
}) {
    const modal = $("confirmModal");
    const acceptButton = $("confirmAccept");
    const cancelButton = $("confirmCancel");

    if (!modal || !acceptButton || !cancelButton) {
        return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }

    if (adminV2ConfirmOpen) return Promise.resolve(false);
    adminV2ConfirmOpen = true;

    setText("confirmTitle", title);
    setText("confirmMessage", message);
    setText("confirmIcon", icon);
    acceptButton.textContent = confirmLabel;
    cancelButton.textContent = cancelLabel;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    return new Promise(resolve => {
        let settled = false;

        const finish = accepted => {
            if (settled) return;
            settled = true;
            adminV2ConfirmOpen = false;
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
            acceptButton.removeEventListener("click", accept);
            cancelButton.removeEventListener("click", cancel);
            modal.removeEventListener("click", backdrop);
            document.removeEventListener("keydown", keyboard);
            resolve(accepted);
        };

        const accept = () => finish(true);
        const cancel = () => finish(false);
        const backdrop = event => {
            if (event.target === modal) finish(false);
        };
        const keyboard = event => {
            if (event.key === "Escape") finish(false);
        };

        acceptButton.addEventListener("click", accept);
        cancelButton.addEventListener("click", cancel);
        modal.addEventListener("click", backdrop);
        document.addEventListener("keydown", keyboard);
        cancelButton.focus();
    });
}

function adminV2SetButtonsBusy(ids, busy, busyLabel = "Operazione in corso…") {
    ids.forEach(id => {
        const button = $(id);
        if (!button) return;
        if (busy) {
            if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
            button.disabled = true;
            button.textContent = `⏳ ${busyLabel}`;
        } else {
            button.disabled = false;
            if (button.dataset.originalLabel) {
                button.textContent = button.dataset.originalLabel;
                delete button.dataset.originalLabel;
            }
        }
    });
}

async function commandOnline() {
    if (!adminV2Confirm("Riportare tutto online e disattivare manutenzione, emergenza e blocco totale?")) return;
    await updateSettings({ maintenance_enabled: false, emergency_enabled: false, total_block_enabled: false, global_status: "online" });
}

async function commandMaintenance() {
    if (!adminV2Confirm("Attivare la manutenzione pubblica? L'Admin resterà accessibile.")) return;
    await updateSettings({ maintenance_enabled: true, emergency_enabled: false, total_block_enabled: false, global_status: "maintenance" });
}

async function commandEmergency() {
    if (!adminV2Confirm("Attivare l'emergenza e bloccare le attività pubbliche?")) return;
    await updateSettings({ maintenance_enabled: false, emergency_enabled: true, total_block_enabled: false, global_status: "emergency" });
}

async function commandTotalBlock() {
    if (!adminV2Confirm("ATTENZIONE: bloccare completamente il sito pubblico?")) return;
    await updateSettings({ maintenance_enabled: false, emergency_enabled: false, total_block_enabled: true, global_status: "offline" });
}

async function makeAllGamesAvailable() {
    if (!await adminV2ConfirmAction({
        title: "Rendere tutti i giochi disponibili?",
        message: "Tutti i giochi verranno resi disponibili.\nI giochi nascosti resteranno nascosti.",
        confirmLabel: "RENDI DISPONIBILI",
        icon: "🟢"
    })) return;

    if (adminV2PendingActions.has("all-games-status")) return;
    adminV2PendingActions.add("all-games-status");

    const buttonIds = ["makeAllGamesAvailableButton", "makeAllGamesMaintenanceButton"];
    adminV2SetButtonsBusy(buttonIds, true, "Aggiornamento giochi");
    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.games)
            .update({ status: "available", enabled: true })
            .not("game_id", "is", null)
            .select("game_id,status,enabled,visible");
        if (result.error) throw result.error;

        await loadGames();
        await writeAdminLog(
            "Rendi tutti i giochi disponibili",
            "site_games",
            null,
            { status: "available", enabled: true, updated_games: result.data?.length || 0 }
        );
        showToast("✅ Tutti i giochi sono ora disponibili.");
    } catch (error) {
        handleError(error, "Impossibile rendere disponibili tutti i giochi.");
    } finally {
        adminV2PendingActions.delete("all-games-status");
        adminV2SetButtonsBusy(buttonIds, false);
    }
}

async function makeAllGamesMaintenance() {
    if (!await adminV2ConfirmAction({
        title: "Bloccare tutti i giochi?",
        message: "Tutti i giochi verranno messi in manutenzione.\nI giochi nascosti resteranno nascosti.",
        confirmLabel: "BLOCCA TUTTI",
        icon: "🔴"
    })) return;

    if (adminV2PendingActions.has("all-games-status")) return;
    adminV2PendingActions.add("all-games-status");

    const buttonIds = ["makeAllGamesAvailableButton", "makeAllGamesMaintenanceButton"];
    adminV2SetButtonsBusy(buttonIds, true, "Blocco giochi");
    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.games)
            .update({ status: "maintenance", enabled: false })
            .not("game_id", "is", null)
            .select("game_id,status,enabled,visible");
        if (result.error) throw result.error;

        await loadGames();
        await writeAdminLog(
            "Blocca tutti i giochi",
            "site_games",
            null,
            { status: "maintenance", enabled: false, updated_games: result.data?.length || 0 }
        );
        showToast("✅ Tutti i giochi sono ora in manutenzione.");
    } catch (error) {
        handleError(error, "Impossibile mettere tutti i giochi in manutenzione.");
    } finally {
        adminV2PendingActions.delete("all-games-status");
        adminV2SetButtonsBusy(buttonIds, false);
    }
}

async function disableMaintenance() {
    await updateSettings({ maintenance_enabled: false, global_status: "online" });
}

function getStatusLabel() {
    const settings = state.settings || {};
    if (settings.total_block_enabled) return "OFFLINE";
    if (settings.emergency_enabled) return "EMERGENZA";
    if (settings.maintenance_enabled) return "MANUTENZIONE";
    return "ONLINE";
}

function renderGlobalStatus() {
    const label = getStatusLabel();
    const pill = $("globalStatusPill");
    const status = $("dashboardSiteStatus");
    if (pill) {
        pill.className = `status-pill ${label === "ONLINE" ? "online" : "offline"}`;
        pill.innerHTML = `<span></span>${label}`;
    }
    setText("dashboardSiteStatus", label);
}

async function loadGames() {
    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.games)
            .select("*")
            .order("sort_order", { ascending: true })
            .order("game_id", { ascending: true });
        if (result.error) throw result.error;
        const records = result.data || [];
        const byId = new Map(records.map(game => [game.game_id, adminV2NormalizeGame(game)]));
        const staticGameIds = new Set(ADMIN_V2_GAME_META.map(meta => meta.id));
        state.games = ADMIN_V2_GAME_META.map((meta, index) => byId.get(meta.id) || adminV2NormalizeGame({
            game_id: meta.id,
            name: meta.name,
            enabled: true,
            visible: true,
            status: "available",
            path: meta.path,
            description: meta.description,
            category: meta.category,
            multiplayer_enabled: Boolean(meta.multiplayer),
            new_rooms_enabled: Boolean(meta.rooms),
            sort_order: index
        }));
        records.filter(game => !staticGameIds.has(game.game_id)).forEach(game => state.games.push(adminV2NormalizeGame(game)));
        state.games.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "it"));
        renderGames();
        renderStatsGames();
        updateDashboardGameMetrics();
        return state.games;
    } catch (error) {
        console.warn("Admin V2 catalogo non raggiungibile:", error.message || error);
        state.games = ADMIN_V2_GAME_META.map((meta, index) => adminV2NormalizeGame({
            game_id: meta.id,
            name: meta.name,
            enabled: true,
            visible: true,
            status: "available",
            path: meta.path,
            description: meta.description,
            category: meta.category,
            multiplayer_enabled: Boolean(meta.multiplayer),
            new_rooms_enabled: Boolean(meta.rooms),
            sort_order: index
        }));
        renderGames();
        updateDashboardGameMetrics();
        return state.games;
    }
}

function updateDashboardGameMetrics() {
    const games = state.games || [];
    const now = new Date();
    const available = games.filter(game => game.visible && adminV2EffectiveStatus(game, now) === "available").length;
    const pending = games.filter(game => ["coming_soon", "maintenance"].includes(adminV2EffectiveStatus(game, now))).length;
    const hidden = games.filter(game => game.visible === false).length;
    setText("dashboardAvailableGames", String(available));
    setText("dashboardPendingGames", String(pending));
    setText("dashboardHiddenGames", String(hidden));
    setText("dashboardGames", String(available));
}

function renderGames() {
    const container = $("gamesGrid");
    if (!container) return;
    const now = new Date();
    container.innerHTML = (state.games || []).map(game => {
        const status = adminV2EffectiveStatus(game, now);
        const badge = game.badge && (!game.badge_expires_at || new Date(game.badge_expires_at).getTime() > now.getTime()) ? game.badge : "";
        return `
            <article class="admin-game-card admin-v2-game-card ${game.visible ? "" : "is-hidden"}" data-game-id="${escapeHtml(game.game_id)}">
                <div class="admin-game-card-header">
                    <div class="admin-game-card-icon">${escapeHtml(game.icon || "🎮")}</div>
                    <div class="admin-game-card-heading">
                        <h3>${escapeHtml(game.name)}</h3>
                        <span>${escapeHtml(game.category || "Altro")} · ${escapeHtml(game.game_id)}</span>
                    </div>
                    ${badge ? `<span class="admin-game-badge">${escapeHtml(badge)}</span>` : ""}
                </div>
                <p class="admin-game-description">${escapeHtml(game.description || "Nessuna descrizione.")}</p>
                <div class="admin-v2-game-meta">
                    <span class="status-pill game-status-${escapeHtml(status)}"><span></span>${escapeHtml(adminV2StatusLabel(status))}</span>
                    <span class="admin-visibility-label">${game.visible ? "👁️ Visibile" : "🙈 Nascosto"}</span>
                </div>
                <div class="admin-v2-game-controls">
                    <label class="admin-inline-field">Stato
                        <select class="form-input compact-input" data-game-status>
                            ${ADMIN_V2_STATUSES.map(item => `<option value="${item}" ${item === status ? "selected" : ""}>${adminV2StatusLabel(item)}</option>`).join("")}
                        </select>
                    </label>
                    <label class="check-option compact-check">
                        <input type="checkbox" data-game-visible ${game.visible ? "checked" : ""}>
                        <span>Visibile</span>
                    </label>
                </div>
                <div class="admin-game-card-footer">
                    <small>Ordine ${escapeHtml(String(game.sort_order))}${game.path ? ` · ${escapeHtml(game.path)}` : " · percorso non impostato"}</small>
                    <div class="admin-game-card-actions">
                        <button class="small-button danger-button" type="button" data-action="delete-game">🗑️ Elimina</button>
                        <button class="small-button" type="button" data-action="edit-game">✏️ Modifica</button>
                    </div>
                </div>
            </article>`;
    }).join("");
}

function openGameEditor(gameId = null) {
    const editor = $("gameEditor");
    if (!editor) return;
    const game = gameId ? state.games.find(item => item.game_id === gameId) : null;
    const value = game || adminV2NormalizeGame({
        game_id: "",
        name: "",
        status: "coming_soon",
        enabled: false,
        visible: true,
        sort_order: (state.games || []).length,
        path: "",
        description: "",
        category: ""
    });
    const fields = {
        gameOriginalId: value.game_id || "",
        gameId: value.game_id || "",
        gameName: value.name || "",
        gameIcon: value.icon || "🎮",
        gameCategory: value.category || "",
        gamePath: value.path || "",
        gameDescription: value.description || "",
        gameStatus: value.status || "available",
        gameBadge: value.badge || "",
        gameBadgeExpiresAt: adminV2DateInput(value.badge_expires_at),
        gameReleaseDate: value.release_date || "",
        gameReleaseTime: value.release_time ? String(value.release_time).slice(0, 5) : "",
        gameSortOrder: value.sort_order ?? 0,
        gameMaintenanceMessage: value.maintenance_message || value.disabled_message || "",
        gameScheduledReleaseAt: adminV2DateInput(value.scheduled_release_at)
    };
    Object.entries(fields).forEach(([id, inputValue]) => {
        const element = $(id);
        if (element) element.value = inputValue;
    });

    const gameIdInput = $("gameId");
    if (gameIdInput) {
        gameIdInput.readOnly = Boolean(game);
        gameIdInput.title = game
            ? "L'ID tecnico è stabile e non può essere modificato."
            : "Identificatore tecnico stabile del gioco.";
    }

    const deleteButton = $("deleteGameButton");
    if (deleteButton) deleteButton.hidden = !game;
    [
        ["gameVisible", value.visible !== false],
        ["gameAutoRelease", Boolean(value.auto_release)],
        ["gameMultiplayerEnabled", Boolean(value.multiplayer_enabled)],
        ["gameNewRoomsEnabled", Boolean(value.new_rooms_enabled)]
    ].forEach(([id, checked]) => {
        const element = $(id);
        if (element) element.checked = checked;
    });
    setText("gameEditorHeading", game ? `Modifica ${game.name}` : "Aggiungi gioco");
    editor.hidden = false;
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeGameEditor() {
    const editor = $("gameEditor");
    if (editor) editor.hidden = true;
}

async function updateGame(gameId, changes, legacyValue) {
    const payload = typeof changes === "string" ? { [changes]: legacyValue } : { ...changes };
    if (Object.prototype.hasOwnProperty.call(payload, "status")) {
        payload.status = ADMIN_V2_STATUSES.includes(payload.status) ? payload.status : "available";
        payload.enabled = payload.status === "available";
    }
    if (Object.prototype.hasOwnProperty.call(payload, "visible")) payload.visible = Boolean(payload.visible);
    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.games)
            .update(payload)
            .eq("game_id", gameId)
            .select("*")
            .single();
        if (result.error) throw result.error;
        await writeAdminLog("Aggiornamento gioco", "site_games", gameId, payload);
        await loadGames();
        showToast("🎮 Gioco aggiornato.");
        return result.data;
    } catch (error) {
        handleError(error, "Impossibile aggiornare il gioco. Verifica di aver eseguito la migrazione Admin V2.");
        return null;
    }
}

function adminV2ReadEditor() {
    const gameId = $("gameId")?.value.trim().toLowerCase() || "";
    const name = $("gameName")?.value.trim() || "";
    const path = $("gamePath")?.value.trim() || null;
    if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(gameId)) throw new Error("L'ID tecnico può contenere solo lettere minuscole, numeri, _ e -.");
    if (!name) throw new Error("Inserisci il nome pubblico del gioco.");
    if (path && (path.startsWith("http") || path.includes("..") || !path.endsWith(".html"))) throw new Error("Il percorso deve essere un file HTML locale, senza URL esterni o '..'.");
    const status = $("gameStatus")?.value || "available";
    if (status === "available" && !path) throw new Error("Un gioco disponibile deve avere un percorso HTML valido.");
    const maintenanceMessage = $("gameMaintenanceMessage")?.value.trim() || "";
    return {
        game_id: gameId,
        name,
        icon: $("gameIcon")?.value.trim() || "🎮",
        category: $("gameCategory")?.value.trim() || null,
        path,
        description: $("gameDescription")?.value.trim() || null,
        status,
        enabled: status === "available",
        visible: Boolean($("gameVisible")?.checked),
        badge: $("gameBadge")?.value.trim() || null,
        badge_expires_at: adminV2IsoInput($("gameBadgeExpiresAt")?.value),
        release_date: $("gameReleaseDate")?.value || null,
        release_time: $("gameReleaseTime")?.value || null,
        sort_order: Math.max(0, Number.parseInt($("gameSortOrder")?.value || "0", 10) || 0),
        maintenance_message: maintenanceMessage || null,
        disabled_message: maintenanceMessage || "Questo gioco è temporaneamente non disponibile.",
        scheduled_release_at: adminV2IsoInput($("gameScheduledReleaseAt")?.value),
        auto_release: Boolean($("gameAutoRelease")?.checked),
        multiplayer_enabled: Boolean($("gameMultiplayerEnabled")?.checked),
        new_rooms_enabled: Boolean($("gameNewRoomsEnabled")?.checked)
    };
}

async function saveGameFromEditor() {
    const button = $("saveGameButton");
    try {
        const payload = adminV2ReadEditor();
        const originalId = $("gameOriginalId")?.value.trim() || "";
        if (button) button.disabled = true;
        let result;
        if (originalId) {
            result = await adminDb.from(ADMIN_V2_TABLES.games).update(payload).eq("game_id", originalId).select("*").single();
        } else {
            result = await adminDb.from(ADMIN_V2_TABLES.games).insert(payload).select("*").single();
        }
        if (result.error) throw result.error;
        await writeAdminLog(originalId ? "Modifica gioco" : "Creazione gioco", "site_games", payload.game_id, payload);
        closeGameEditor();
        await loadGames();
        showToast(originalId ? "✅ Gioco salvato." : "✅ Gioco aggiunto.");
    } catch (error) {
        const duplicate = error?.code === "23505" || /duplicate key|already exists|unique/i.test(error?.message || "");
        showToast(duplicate ? "Esiste già un gioco con questo ID." : (error.message || "Impossibile salvare il gioco."), "error");
    } finally {
        if (button) button.disabled = false;
    }
}

async function deleteGame(gameId) {
    if (!gameId || adminV2PendingActions.has(`delete-game:${gameId}`)) return;

    const game = (state.games || []).find(item => item.game_id === gameId);
    if (!game) {
        showToast("Gioco non trovato nel catalogo.", "error");
        return;
    }

    if (!await adminV2ConfirmAction({
        title: "Eliminare questo gioco?",
        message: `Stai per eliminare "${game.name}" dal catalogo di CuginiParty.\n\nQuesta operazione rimuoverà il gioco dall'Admin e dalla Home.\n\nI file HTML/CSS/JS del gioco NON verranno eliminati.`,
        confirmLabel: "ELIMINA",
        icon: "🗑️"
    })) return;

    adminV2PendingActions.add(`delete-game:${gameId}`);
    const cardButton = Array.from(document.querySelectorAll("#gamesGrid [data-game-id]"))
        .find(card => card.dataset.gameId === gameId)
        ?.querySelector("[data-action='delete-game']");
    const editorButton = $("deleteGameButton");
    const busyButtons = [cardButton, editorButton].filter(Boolean);
    busyButtons.forEach(button => {
        button.disabled = true;
        button.dataset.originalLabel = button.textContent;
        button.textContent = "⏳ Eliminazione…";
    });

    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.games)
            .delete()
            .eq("game_id", gameId)
            .select("game_id")
            .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) throw new Error("Supabase non ha eliminato alcun record.");

        state.games = (state.games || []).filter(item => item.game_id !== gameId);
        renderGames();
        renderStatsGames();
        updateDashboardGameMetrics();
        closeGameEditor();
        await writeAdminLog("Eliminazione gioco", "site_games", gameId, { name: game.name });
        await loadGames();
        showToast(`✅ ${game.name} è stato eliminato dal catalogo.`);
    } catch (error) {
        handleError(error, "Impossibile eliminare il gioco.");
    } finally {
        adminV2PendingActions.delete(`delete-game:${gameId}`);
        busyButtons.forEach(button => {
            button.disabled = false;
            if (button.dataset.originalLabel) {
                button.textContent = button.dataset.originalLabel;
                delete button.dataset.originalLabel;
            }
        });
    }
}

function renderStatsGames() {
    const container = $("statsGamesList");
    if (!container) return;
    container.innerHTML = (state.games || []).map(game => `
        <div class="admin-game-row">
            <div><strong>${escapeHtml(game.icon || "🎮")} ${escapeHtml(game.name)}</strong><small>${escapeHtml(adminV2StatusLabel(adminV2EffectiveStatus(game)))}</small></div>
        </div>`).join("");
}

async function loadMessages() {
    try {
        const result = await adminDb
            .from(ADMIN_V2_TABLES.messages)
            .select("id,type,title,target,game_id,message,active,persistent,scheduled_start,scheduled_end,created_at")
            .order("created_at", { ascending: false });
        if (result.error) throw result.error;
        state.messages = (result.data || []).map(message => ({
            ...message,
            title: message.title || "Avviso CuginiParty",
            game_id: message.game_id,
            scheduled_start: message.scheduled_start,
            scheduled_end: message.scheduled_end
        }));
        renderMessages();
        renderDashboardMessages();
        return state.messages;
    } catch (error) {
        handleError(error, "Impossibile caricare site_messages.");
        state.messages = [];
        renderMessages();
        renderDashboardMessages();
        return [];
    }
}

function renderMessages() {
    const container = $("messagesList");
    if (!container) return;
    if (!(state.messages || []).length) {
        container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📭</span><p>Nessun annuncio disponibile.</p></div>`;
        return;
    }
    container.innerHTML = state.messages.map(message => `
        <article class="admin-message-row ${message.active ? "" : "is-inactive"}">
            <div class="admin-message-row-main">
                <div class="admin-message-row-title"><span class="message-type-dot message-type-${escapeHtml(message.type || "normal")}"></span><strong>${escapeHtml(message.title)}</strong></div>
                <p>${escapeHtml(message.message || "")}</p>
                <small>${escapeHtml(message.target === "game" ? `Gioco: ${message.game_id || "-"}` : message.target || "all")} · ${message.scheduled_start ? `programmato ${escapeHtml(adminV2FormatDate(message.scheduled_start))}` : "immediato"}</small>
            </div>
            <div class="admin-message-row-actions">
                <button class="small-button" type="button" data-message-action="toggle" data-message-id="${escapeHtml(String(message.id))}">${message.active ? "Disattiva" : "Attiva"}</button>
                <button class="small-button danger-button" type="button" data-message-action="delete" data-message-id="${escapeHtml(String(message.id))}">🗑️</button>
            </div>
        </article>`).join("");
}

function updateMessagePreview() {
    const preview = $("messagePreview");
    if (!preview) return;
    const title = $("messageTitle")?.value.trim() || "Titolo annuncio";
    const message = $("messageContent")?.value.trim() || "Il testo dell'annuncio apparirà qui.";
    const type = $("messageType")?.value || "normal";
    const target = $("messageTarget")?.value || "all";
    const label = target === "game" ? ` · ${$("messageGame")?.value || "gioco"}` : target === "online" ? " · solo online" : " · tutti";
    if (type === "banner") {
        preview.innerHTML = `<div class="cuginiparty-public-banner"><span>📌</span><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}${escapeHtml(label)}</span></div></div>`;
        return;
    }
    if (type === "popup") {
        preview.innerHTML = `<div class="cuginiparty-public-popup-preview"><span>🪟</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}${escapeHtml(label)}</p></div>`;
        return;
    }
    preview.innerHTML = `<div class="cuginiparty-public-message message-${escapeHtml(type)}"><span class="cuginiparty-public-message-icon">${type === "urgent" ? "🚨" : type === "important" ? "⚠️" : "📢"}</span><div class="cuginiparty-public-message-content"><strong>${escapeHtml(title)}</strong><div>${escapeHtml(message)}${escapeHtml(label)}</div></div></div>`;
}

async function createMessageFromForm() {
    const title = $("messageTitle")?.value.trim() || "Avviso CuginiParty";
    const message = $("messageContent")?.value.trim() || "";
    if (!message) {
        showToast("Scrivi il contenuto del messaggio.", "error");
        return;
    }
    const target = $("messageTarget")?.value || "all";
    const payload = {
        type: $("messageType")?.value || "normal",
        title,
        target,
        game_id: target === "game" ? $("messageGame")?.value || null : null,
        message,
        active: Boolean($("messageActive")?.checked),
        persistent: Boolean($("messagePersistent")?.checked),
        scheduled_start: adminV2IsoInput($("messageSchedule")?.value),
        scheduled_end: null
    };
    try {
        const result = await adminDb.from(ADMIN_V2_TABLES.messages).insert(payload).select("*").single();
        if (result.error) throw result.error;
        await writeAdminLog("Pubblicazione annuncio", "site_messages", result.data?.id || "new", { target, type: payload.type });
        clearMessageForm();
        updateMessagePreview();
        await loadMessages();
        showToast("📢 Annuncio pubblicato.");
    } catch (error) {
        handleError(error, "Impossibile pubblicare l'annuncio.");
    }
}

async function toggleMessage(messageId) {
    const message = (state.messages || []).find(item => String(item.id) === String(messageId));
    if (!message) return;
    try {
        const result = await adminDb.from(ADMIN_V2_TABLES.messages).update({ active: !message.active }).eq("id", messageId);
        if (result.error) throw result.error;
        await loadMessages();
        showToast(message.active ? "Annuncio disattivato." : "Annuncio attivato.");
    } catch (error) {
        handleError(error, "Impossibile cambiare lo stato dell'annuncio.");
    }
}

async function deleteMessage(messageId) {
    if (!adminV2Confirm("Eliminare questo annuncio?")) return;
    try {
        const result = await adminDb.from(ADMIN_V2_TABLES.messages).delete().eq("id", messageId);
        if (result.error) throw result.error;
        await writeAdminLog("Eliminazione annuncio", "site_messages", messageId);
        await loadMessages();
        showToast("Annuncio eliminato.");
    } catch (error) {
        handleError(error, "Impossibile eliminare l'annuncio.");
    }
}

async function deleteAllMessages() {
    if (!adminV2Confirm("Eliminare definitivamente tutti gli annunci?")) return;
    try {
        const result = await adminDb.from(ADMIN_V2_TABLES.messages).delete().not("id", "is", null);
        if (result.error) throw result.error;
        await writeAdminLog("Eliminazione di tutti i messaggi", "site_messages");
        await loadMessages();
        showToast("🗑️ Tutti gli annunci sono stati eliminati.");
    } catch (error) {
        handleError(error, "Impossibile eliminare tutti gli annunci.");
    }
}

async function loadUndercoverLive() {
    const activeStatuses = ["lobby", "revealing", "round", "voting", "result", "white_guess"];
    adminV2UndercoverRooms = await adminV2SafeRead(
        "undercover_rooms",
        "id,room_code,status,game_state,host_player_id,created_at,updated_at",
        query => query.in("status", activeStatuses).order("updated_at", { ascending: false }).limit(100)
    );
    const roomIds = adminV2UndercoverRooms.map(room => room.id);
    adminV2UndercoverPlayers = roomIds.length
        ? await adminV2SafeRead("undercover_players", "room_id,player_id,nickname,name,is_host,connected,joined_at,updated_at", query => query.in("room_id", roomIds))
        : [];
    state.undercoverRooms = adminV2UndercoverRooms;
    state.undercoverPlayers = adminV2UndercoverPlayers;
    renderUndercoverLive();
    setText("dashboardUndercoverRooms", String(adminV2UndercoverRooms.length));
    return adminV2UndercoverRooms;
}

function adminV2RoomIsRecent(room) {
    const timestamp = room.updated_at || room.created_at;
    return !timestamp || isRecent(timestamp, 30 * 60 * 1000);
}

function renderUndercoverLive() {
    const rooms = adminV2UndercoverRooms.filter(adminV2RoomIsRecent);
    const roomIds = new Set(rooms.map(room => room.id));
    const players = adminV2UndercoverPlayers.filter(player => roomIds.has(player.room_id) && player.connected !== false);
    const uniquePlayers = new Set(players.map(player => `${player.room_id}:${player.player_id}`));
    const lobbies = rooms.filter(room => (room.status || room.game_state?.phase) === "lobby").length;
    const playing = rooms.length - lobbies;
    setText("undercoverLiveRoomCount", String(rooms.length));
    setText("undercoverLivePlayersCount", String(uniquePlayers.size));
    setText("undercoverLiveLobbyCount", String(lobbies));
    setText("undercoverLivePlayingCount", String(playing));
    setText("dashboardUndercoverRooms", String(rooms.length));
    const container = $("undercoverRoomsList");
    if (!container) return;
    if (!rooms.length) {
        container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🕵️</span><p>Nessuna stanza Undercover attiva.</p></div>`;
        return;
    }
    container.innerHTML = rooms.map(room => {
        const roomPlayers = players.filter(player => player.room_id === room.id);
        const phase = room.game_state?.phase || room.status || "-";
        const host = roomPlayers.find(player => player.is_host);
        const round = room.game_state?.round || room.game_state?.roundNumber || "-";
        return `<article class="undercover-live-room-card" data-undercover-room-id="${escapeHtml(String(room.id))}">
            <div class="undercover-live-room-main">
                <div class="undercover-live-room-title"><strong>🏠 ${escapeHtml(room.room_code || String(room.id).slice(0, 8))}</strong><span class="status-pill game-status-${escapeHtml(phase)}"><span></span>${escapeHtml(phase)}</span></div>
                <p>Host: ${escapeHtml(host?.nickname || host?.name || "non assegnato")} · ${roomPlayers.length} giocatori · Round ${escapeHtml(String(round))}</p>
                <small>Aggiornata ${escapeHtml(adminV2FormatDate(room.updated_at || room.created_at))}</small>
            </div>
            <button class="small-button danger-button" type="button" data-undercover-action="close" data-room-id="${escapeHtml(String(room.id))}">⛔ Chiudi</button>
        </article>`;
    }).join("");
}

async function closeUndercoverRoom(roomId) {
    if (!adminV2DoubleConfirm(
        "Stai per chiudere 1 stanza Undercover. I giocatori verranno disconnessi.",
        "Conferma la chiusura della stanza Undercover."
    )) return;
    try {
        const result = await adminDb.rpc("admin_close_undercover_room", { p_room_id: roomId });
        if (result.error) throw result.error;
        await writeAdminLog("Chiusura stanza Undercover", "undercover_room", roomId);
        await loadUndercoverLive();
        showToast(`✓ ${Number(result.data) || 0} stanza Undercover chiusa.`);
    } catch (error) {
        handleError(error, "Impossibile chiudere la stanza Undercover.");
    }
}

async function closeAllUndercoverRooms() {
    await loadUndercoverLive();
    const rooms = adminV2UndercoverRooms.filter(adminV2RoomIsRecent);
    if (!rooms.length) {
        showToast("Non ci sono stanze Undercover attive.");
        return;
    }
    if (!adminV2DoubleConfirm(
        `Stai per chiudere ${rooms.length} stanze Undercover attive.`,
        `Conferma la chiusura di tutte le ${rooms.length} stanze Undercover.`
    )) return;
    const buttonIds = ["closeAllUndercoverRoomsButton"];
    adminV2SetButtonsBusy(buttonIds, true, "Chiusura stanze");
    try {
        const result = await adminDb.rpc("admin_close_all_undercover_rooms");
        if (result.error) throw result.error;
        const count = Number(result.data) || 0;
        await writeAdminLog("Chiusura di tutte le stanze Undercover", "undercover_rooms", String(count));
        await loadUndercoverLive();
        showToast(`✓ ${count} stanze Undercover chiuse.`);
    } catch (error) {
        handleError(error, "Impossibile chiudere le stanze Undercover.");
    } finally {
        adminV2SetButtonsBusy(buttonIds, false);
    }
}

async function closeAllUndercoverMatches() {
    await loadUndercoverLive();
    const matches = adminV2UndercoverRooms.filter(room => adminV2RoomIsRecent(room) && !["lobby", "closed"].includes(room.status));
    if (!matches.length) {
        showToast("Non ci sono partite Undercover in corso.");
        return;
    }
    if (!adminV2DoubleConfirm(
        `Stai per chiudere ${matches.length} partite Undercover. Le relative stanze verranno chiuse automaticamente.`,
        `Conferma la chiusura di tutte le ${matches.length} partite e delle relative stanze.`
    )) return;
    const buttonIds = ["closeAllUndercoverMatchesButton"];
    adminV2SetButtonsBusy(buttonIds, true, "Chiusura partite");
    try {
        const result = await adminDb.rpc("admin_close_all_undercover_matches");
        if (result.error) throw result.error;
        const count = Number(result.data) || 0;
        await writeAdminLog("Chiusura di tutte le partite Undercover", "undercover_matches", String(count));
        await loadUndercoverLive();
        showToast(`✓ ${count} partite Undercover chiuse insieme alle relative stanze.`);
    } catch (error) {
        handleError(error, "Impossibile chiudere le partite Undercover.");
    } finally {
        adminV2SetButtonsBusy(buttonIds, false);
    }
}

async function closeUnoRoom(roomId) {
    if (!adminV2DoubleConfirm(
        "Stai per chiudere 1 stanza UNO e disconnettere i giocatori.",
        "Conferma la chiusura della stanza UNO."
    )) return;
    try {
        const result = await adminDb.rpc("admin_close_uno_room", { p_room_id: roomId });
        if (result.error) throw result.error;
        await writeAdminLog("Chiusura stanza UNO", "uno_room", roomId);
        await reloadUno();
        showToast(`✓ ${Number(result.data) || 0} stanza UNO chiusa.`);
    } catch (error) {
        handleError(error, "Impossibile chiudere la stanza UNO.");
    }
}

async function closeAllUnoRooms() {
    await loadUnoRooms();
    const activeRooms = getActiveUnoRooms();
    if (!activeRooms.length) {
        showToast("Non ci sono stanze UNO attive.");
        return;
    }
    if (!adminV2DoubleConfirm(
        `Stai per chiudere ${activeRooms.length} stanze UNO attive.`,
        `Conferma la chiusura di tutte le ${activeRooms.length} stanze UNO.`
    )) return;
    const buttonIds = ["closeAllRoomsButton", "closeAllUnoButton"];
    adminV2SetButtonsBusy(buttonIds, true, "Chiusura stanze");
    try {
        const result = await adminDb.rpc("admin_close_all_uno_rooms");
        if (result.error) throw result.error;
        const count = Number(result.data) || 0;
        await writeAdminLog("Chiusura di tutte le stanze UNO", "uno_rooms", String(count));
        await reloadUno();
        showToast(`✓ ${count} stanze UNO chiuse.`);
    } catch (error) {
        handleError(error, "Impossibile chiudere tutte le stanze UNO.");
    } finally {
        adminV2SetButtonsBusy(buttonIds, false);
    }
}

async function closeAllMatches() {
    await loadUnoRooms();
    const matches = (state.unoRooms || []).filter(room => room.status === "playing" && isRecent(room.updated_at, CONFIG.activeRoomMaxAgeMs));
    if (!matches.length) {
        showToast("Non ci sono partite UNO in corso.");
        return;
    }
    if (!adminV2DoubleConfirm(
        `Stai per terminare ${matches.length} partite UNO. Le stanze resteranno aperte.`,
        `Conferma il ritorno in lobby di tutte le ${matches.length} partite UNO.`
    )) return;
    const buttonIds = ["closeAllMatchesButton", "closeAllMatchesButtonTop"];
    adminV2SetButtonsBusy(buttonIds, true, "Chiusura partite");
    try {
        const result = await adminDb.rpc("admin_close_all_uno_matches");
        if (result.error) throw result.error;
        const count = Number(result.data) || 0;
        await writeAdminLog("Chiusura di tutte le partite UNO", "uno_matches", String(count));
        await reloadUno();
        showToast(`✓ ${count} partite UNO terminate; le stanze sono tornate in lobby.`);
    } catch (error) {
        handleError(error, "Impossibile chiudere tutte le partite UNO.");
    } finally {
        adminV2SetButtonsBusy(buttonIds, false);
    }
}

async function loadUnoRooms() {
    state.unoRooms = await adminV2SafeRead("uno_rooms", "*", query => query.order("updated_at", { ascending: false }).limit(100));
    if (typeof renderUnoRooms === "function") renderUnoRooms();
    return state.unoRooms;
}

async function loadUnoPlayers() {
    state.unoPlayers = await adminV2SafeRead("uno_players", "*", query => query.order("updated_at", { ascending: false }).limit(500));
    if (typeof renderPlayers === "function") renderPlayers();
    return state.unoPlayers;
}

async function loadBlockedUsers() {
    state.blockedUsers = await adminV2SafeRead(ADMIN_V2_TABLES.blocked, "*", query => query.order("blocked_at", { ascending: false }));
    if (typeof renderBlockedUsers === "function") renderBlockedUsers();
    if (typeof renderPlayers === "function") renderPlayers();
    return state.blockedUsers;
}

async function blockPlayers(playerIds, nickname) {
    const reason = window.prompt("Motivo del blocco:", "Violazione delle regole");
    if (reason === null || !playerIds?.length) return;
    for (const playerId of playerIds) {
        const result = await adminDb.from(ADMIN_V2_TABLES.blocked).upsert({ player_id: playerId, reason, blocked_by: state.currentAdminId, blocked_at: new Date().toISOString(), unblocked_at: null }, { onConflict: "player_id" });
        if (result.error) throw result.error;
    }
    await writeAdminLog("Blocco giocatore", "blocked_user", nickname || playerIds.join(","), { reason, player_ids: playerIds });
    await loadBlockedUsers();
    showToast("🔒 Giocatore bloccato.");
}

async function unblockPlayers(playerIds) {
    if (!playerIds?.length) return;
    const result = await adminDb.from(ADMIN_V2_TABLES.blocked).update({ unblocked_at: new Date().toISOString() }).in("player_id", playerIds);
    if (result.error) throw result.error;
    await writeAdminLog("Sblocco giocatore", "blocked_user", playerIds.join(","), { player_ids: playerIds });
    await loadBlockedUsers();
    showToast("🔓 Giocatore sbloccato.");
}

async function kickPlayers(playerIds) {
    if (!playerIds?.length || !adminV2Confirm("Espellere questo giocatore dalle stanze multiplayer?")) return;
    const undercoverResult = await adminDb.from("undercover_players").update({ connected: false, updated_at: new Date().toISOString() }).in("player_id", playerIds);
    if (undercoverResult.error) console.warn("Kick Undercover non disponibile:", undercoverResult.error.message);
    const unoResult = await adminDb.from("uno_players").update({ connected: false }).in("player_id", playerIds);
    if (unoResult.error) console.warn("Kick UNO non disponibile:", unoResult.error.message);
    await writeAdminLog("Espulsione giocatore", "player", playerIds.join(","), { player_ids: playerIds });
    await loadUndercoverLive();
    await loadUnoPlayers();
    showToast("👢 Giocatore espulso.");
}

async function writeAdminLog(action, target = "admin", targetId = null, details = {}) {
    try {
        const result = await adminDb.from(ADMIN_V2_TABLES.logs).insert({
            admin_user_id: state.currentAdminId || state.currentUser?.id || null,
            action,
            target: targetId ? `${target}:${targetId}` : target,
            details: typeof details === "string" ? { message: details } : details
        });
        if (result.error) console.warn("Log Admin non scritto:", result.error.message);
    } catch (error) {
        console.warn("Log Admin non disponibile:", error.message || error);
    }
}

async function loadStats() {
    await loadUndercoverLive();
    const undercoverRooms = adminV2UndercoverRooms.filter(adminV2RoomIsRecent);
    const undercoverPlayers = new Set(adminV2UndercoverPlayers.filter(player => player.connected !== false && undercoverRooms.some(room => room.id === player.room_id)).map(player => `${player.room_id}:${player.player_id}`));
    setText("statsMatches", String(undercoverRooms.filter(room => room.status !== "lobby").length));
    setText("statsPlayers", String(undercoverPlayers.size));
    setText("statsRooms", String(undercoverRooms.length));
    setText("statsOnline", String(undercoverPlayers.size));
    setText("dashboardOnlinePlayers", String(undercoverPlayers.size));
    setText("dashboardRooms", String(undercoverRooms.length));
}

async function reloadDashboard() {
    await Promise.all([loadSettings(), loadGames(), loadMessages(), loadUndercoverLive()]);
    await loadStats();
    renderDashboardMessages();
    updateDashboardGameMetrics();
    checkSystemHealth();
}

async function checkSystemHealth() {
    setText("healthSite", getStatusLabel() === "ONLINE" ? "Operativo" : getStatusLabel());
    setText("healthSupabase", adminDb ? "Connesso" : "Non disponibile");
    setText("healthRealtime", state.realtimeChannels?.length ? "Attivo" : "In attesa");
}

function stopRealtime() {
    (state.realtimeChannels || []).forEach(channel => {
        try { adminDb.removeChannel(channel); } catch { /* ignore */ }
    });
    state.realtimeChannels = [];
    setRealtimeStatus("CLOSED");
}

function setupRealtime() {
    stopRealtime();
    const subscriptions = [
        ["site-settings-v2", "site_settings", loadSettings],
        ["site-games-v2", "site_games", loadGames],
        ["site-messages-v2", "site_messages", loadMessages],
        ["undercover-rooms-v2", "undercover_rooms", loadUndercoverLive],
        ["undercover-players-v2", "undercover_players", loadUndercoverLive]
    ];
    const statuses = new Map();
    setRealtimeStatus("CONNECTING");
    subscriptions.forEach(([name, table, handler]) => {
        const channel = adminDb
            .channel(name)
            .on("postgres_changes", { event: "*", schema: "public", table }, handler)
            .subscribe(status => {
                statuses.set(name, status);
                const current = [...statuses.values()];
                if (current.includes("CHANNEL_ERROR")) setRealtimeStatus("CHANNEL_ERROR");
                else if (current.includes("TIMED_OUT")) setRealtimeStatus("TIMED_OUT");
                else if (current.length === subscriptions.length && current.every(value => value === "SUBSCRIBED")) setRealtimeStatus("SUBSCRIBED");
                else if (current.length === subscriptions.length && current.every(value => value === "CLOSED")) setRealtimeStatus("CLOSED");
                else setRealtimeStatus("CONNECTING");
            });
        state.realtimeChannels.push(channel);
    });
}

function startAutoRefresh() {
    if (state.refreshTimer) clearInterval(state.refreshTimer);
    state.refreshTimer = setInterval(async () => {
        await loadGames();
        await loadMessages();
        await loadUndercoverLive();
        await loadStats();
    }, CONFIG.refreshIntervalMs);
}

function adminV2BindMessageList() {
    const list = $("messagesList");
    if (list && !list.dataset.v2Bound) {
        list.dataset.v2Bound = "true";
        list.addEventListener("click", event => {
            const button = event.target.closest("[data-message-action]");
            if (!button) return;
            const id = button.dataset.messageId;
            if (button.dataset.messageAction === "toggle") toggleMessage(id);
            if (button.dataset.messageAction === "delete") deleteMessage(id);
        });
    }
}

function adminV2ReplaceButtonHandler(id, handler) {
    const button = $(id);
    if (!button) return null;
    const cleanButton = button.cloneNode(true);
    button.replaceWith(cleanButton);
    cleanButton.addEventListener("click", handler);
    return cleanButton;
}

function bindAdminV2Controls() {
    if (adminV2Bound) return;
    adminV2Bound = true;
    $("addGameButton")?.addEventListener("click", () => openGameEditor());
    $("cancelGameEditorButton")?.addEventListener("click", closeGameEditor);
    $("saveGameButton")?.addEventListener("click", saveGameFromEditor);
    $("deleteGameButton")?.addEventListener("click", () => {
        const gameId = $("gameOriginalId")?.value.trim();
        if (gameId) deleteGame(gameId);
    });
    $("gamesGrid")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        const card = event.target.closest("[data-game-id]");
        if (!button || !card) return;
        if (button.dataset.action === "edit-game") openGameEditor(card.dataset.gameId);
        if (button.dataset.action === "delete-game") deleteGame(card.dataset.gameId);
    });
    $("gamesGrid")?.addEventListener("change", event => {
        const card = event.target.closest("[data-game-id]");
        if (!card) return;
        if (event.target.matches("[data-game-status]")) updateGame(card.dataset.gameId, { status: event.target.value });
        if (event.target.matches("[data-game-visible]")) updateGame(card.dataset.gameId, { visible: event.target.checked });
    });
    $("refreshUndercoverLiveButton")?.addEventListener("click", loadUndercoverLive);
    adminV2ReplaceButtonHandler("closeAllUndercoverRoomsButton", () => closeAllUndercoverRooms());
    adminV2ReplaceButtonHandler("closeAllUndercoverMatchesButton", () => closeAllUndercoverMatches());
    $("undercoverRoomsList")?.addEventListener("click", event => {
        const button = event.target.closest("[data-undercover-action='close']");
        if (button) closeUndercoverRoom(button.dataset.roomId);
    });
    ["messageTitle", "messageType", "messageContent", "messageTarget", "messageGame"].forEach(id => {
        const element = $(id);
        element?.addEventListener("input", updateMessagePreview);
        element?.addEventListener("change", updateMessagePreview);
    });
    adminV2BindMessageList();
    adminV2ReplaceButtonHandler("deleteAllMessagesButton", deleteAllMessages);
    adminV2ReplaceButtonHandler("makeAllGamesAvailableButton", makeAllGamesAvailable);
    adminV2ReplaceButtonHandler("makeAllGamesMaintenanceButton", makeAllGamesMaintenance);
    adminV2ReplaceButtonHandler("closeAllUnoButton", closeAllUnoRooms);
    adminV2ReplaceButtonHandler("closeAllMatchesButtonTop", closeAllMatches);
    updateMessagePreview();
}

async function initializeAdminCenter() {
    if (adminInitialized) return;
    adminInitialized = true;
    try {
        setText("adminUserEmail", state.currentUser?.email || "Admin");
        bindAdminV2Controls();
        await reloadDashboard();
        setupRealtime();
        startAutoRefresh();
        showToast("✅ Admin Center V2 caricato.");
    } catch (error) {
        adminInitialized = false;
        handleError(error, "Impossibile inizializzare l'Admin Center V2.");
    }
}

checkExistingSession();
