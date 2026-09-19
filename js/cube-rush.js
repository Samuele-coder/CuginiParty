(function () {
    "use strict";

    const levels = window.CUBE_RUSH_LEVELS || [];
    const world = window.CUBE_RUSH_WORLD || { width: 960, height: 540, floor: 460, ceiling: 80 };
    const STEP = 1 / 120;
    const MAX_FRAME = .05;
    const STORAGE_PROGRESS = "cuginiparty_cube_rush_progress_v1";
    const STORAGE_SETTINGS = "cuginiparty_cube_rush_settings_v1";
    const STORAGE_SKIN = "cuginiparty_cube_rush_skin";
    const skins = Array.isArray(window.CUBE_RUSH_SKINS) ? window.CUBE_RUSH_SKINS : [];
    const drawCubeSkin = typeof window.CUBE_RUSH_DRAW_SKIN === "function" ? window.CUBE_RUSH_DRAW_SKIN : null;
    const MODES = new Set(["cube", "ship", "ball", "wave"]);
    const MODE_LABELS = { cube: "CUBE", ship: "SHIP", ball: "BALL", wave: "WAVE" };
    const PHYSICS = Object.freeze({
        playerSize: 34,
        cubeGravity: 2600,
        cubeFallGravity: 3300,
        cubeJump: 815,
        shipGravity: 690,
        shipLift: 1420,
        shipMaxSpeed: 430,
        ballGravity: 1880,
        waveSlope: .88,
        coyoteTime: .075,
        inputBuffer: .105,
        deathDelay: .56
    });

    const dom = {
        page: document.querySelector(".cube-rush-page"),
        menu: document.getElementById("cubeRushMenu"),
        game: document.getElementById("cubeRushGame"),
        levels: document.getElementById("cubeRushLevels"),
        canvas: document.getElementById("cubeRushCanvas"),
        stage: document.getElementById("cubeRushStage"),
        attempt: document.getElementById("cubeRushAttempt"),
        levelName: document.getElementById("cubeRushLevelName"),
        progressBar: document.getElementById("cubeRushProgressBar"),
        progressText: document.getElementById("cubeRushProgressText"),
        modeLabel: document.getElementById("cubeRushModeLabel"),
        centerMessage: document.getElementById("cubeRushCenterMessage"),
        practiceBadge: document.getElementById("cubeRushPracticeBadge"),
        pauseButton: document.getElementById("cubeRushPause"),
        pauseOverlay: document.getElementById("cubeRushPauseOverlay"),
        resumeButton: document.getElementById("cubeRushResume"),
        restartButton: document.getElementById("cubeRushRestart"),
        exitButton: document.getElementById("cubeRushExit"),
        completeOverlay: document.getElementById("cubeRushCompleteOverlay"),
        completeLevel: document.getElementById("cubeRushCompleteLevel"),
        resultMode: document.getElementById("cubeRushResultMode"),
        resultAttempts: document.getElementById("cubeRushResultAttempts"),
        resultBest: document.getElementById("cubeRushResultBest"),
        replayButton: document.getElementById("cubeRushReplay"),
        continueButton: document.getElementById("cubeRushContinue"),
        musicButton: document.getElementById("cubeRushMusic"),
        sfxButton: document.getElementById("cubeRushSfx"),
        skinsButton: document.getElementById("cubeRushSkins"),
        skinsOverlay: document.getElementById("cubeRushSkinsOverlay"),
        skinsCloseButton: document.getElementById("cubeRushSkinsClose"),
        skinsGrid: document.getElementById("cubeRushSkinsGrid"),
        currentSkinCanvas: document.getElementById("cubeRushCurrentSkin"),
        currentSkinName: document.getElementById("cubeRushCurrentSkinName"),
        completedCount: document.getElementById("cubeRushCompletedCount"),
        totalAttempts: document.getElementById("cubeRushTotalAttempts"),
        totalDeaths: document.getElementById("cubeRushTotalDeaths"),
        playTime: document.getElementById("cubeRushPlayTime"),
        rotateHint: document.querySelector(".cube-rush-rotate-hint")
    };

    if (!dom.canvas || !dom.levels || !levels.length) return;

    const ctx = dom.canvas.getContext("2d", { alpha: false, desynchronized: true });
    const input = { active: false, buffer: 0 };
    const progress = readJson(STORAGE_PROGRESS, {
        levels: {}, totalAttempts: 0, totalDeaths: 0, playTime: 0
    });
    const preferences = readJson(STORAGE_SETTINGS, { music: true, sfx: true });
    const debugParams = new URLSearchParams(location.search);
    const debugEnabled = debugParams.get("debug") === "cube-rush";
    let selectedSkinId = readSelectedSkinId();

    let selectedRunMode = "normal";
    let activeLevel = null;
    let rafId = 0;
    let previousTime = 0;
    let accumulator = 0;
    let saveClock = 0;
    let restartTimer = 0;
    let countdownToken = 0;
    let lastBeat = -1;
    let audioContext = null;
    let pendingLevelId = null;

    const state = {
        status: "menu",
        runMode: "normal",
        attempts: 0,
        elapsed: 0,
        speedMultiplier: 1,
        cameraX: 0,
        checkpoint: null,
        triggered: new Set(),
        activated: new Set(),
        particles: [],
        invincible: false,
        player: createPlayer()
    };

    function createPlayer() {
        return {
            x: 180,
            y: world.floor - PHYSICS.playerSize / 2,
            previousY: world.floor - PHYSICS.playerSize / 2,
            vy: 0,
            mode: "cube",
            gravity: 1,
            rotation: 0,
            grounded: true,
            coyote: PHYSICS.coyoteTime,
            size: PHYSICS.playerSize,
            trail: []
        };
    }

    function readJson(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "null");
            return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : { ...fallback };
        } catch {
            return { ...fallback };
        }
    }

    function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ }
    }

    function levelProgress(levelId) {
        const stored = progress.levels[levelId] || {};
        const clampBest = (value) => Math.max(0, Math.min(100, Number(value) || 0));
        const normalBest = clampBest(stored.normalBest ?? stored.best);
        const practiceBest = clampBest(stored.practiceBest);
        return {
            ...stored,
            best: normalBest,
            normalBest,
            practiceBest,
            completed: Boolean(stored.completed),
            practiceCompleted: Boolean(stored.practiceCompleted),
            attempts: Number(stored.attempts) || 0
        };
    }

    function saveProgress() {
        writeJson(STORAGE_PROGRESS, progress);
    }

    function savePreferences() {
        writeJson(STORAGE_SETTINGS, preferences);
    }

    function readSelectedSkinId() {
        let stored = "";
        try { stored = localStorage.getItem(STORAGE_SKIN) || ""; } catch { /* storage is optional */ }
        return skins.some((skin) => skin.id === stored) ? stored : (skins[0]?.id || "classic-teal");
    }

    function selectedSkin() {
        return skins.find((skin) => skin.id === selectedSkinId) || skins[0] || null;
    }

    function drawSkinPreview(canvas, skin, size = 56) {
        if (!canvas || !skin || !drawCubeSkin) return;
        const previewContext = canvas.getContext("2d");
        previewContext.clearRect(0, 0, canvas.width, canvas.height);
        previewContext.save();
        previewContext.translate(canvas.width / 2, canvas.height / 2);
        drawCubeSkin(previewContext, skin, size, 0);
        previewContext.restore();
    }

    function renderSkinPicker() {
        if (!dom.skinsGrid || !skins.length) return;
        dom.skinsGrid.innerHTML = skins.map((skin) => {
            const selected = skin.id === selectedSkinId;
            return `<button type="button" class="cube-rush-skin-card${selected ? " is-selected" : ""}" data-skin-id="${escapeHtml(skin.id)}" aria-pressed="${selected}">
                <canvas width="76" height="76" aria-hidden="true"></canvas>
                <span>${escapeHtml(skin.name)}</span><i aria-hidden="true">✓</i>
            </button>`;
        }).join("");
        dom.skinsGrid.querySelectorAll("[data-skin-id]").forEach((card) => {
            drawSkinPreview(card.querySelector("canvas"), skins.find((skin) => skin.id === card.dataset.skinId), 50);
        });
        const current = selectedSkin();
        if (dom.currentSkinName) dom.currentSkinName.textContent = current?.name || "Classic Teal";
        drawSkinPreview(dom.currentSkinCanvas, current, 58);
    }

    function selectSkin(skinId) {
        if (!skins.some((skin) => skin.id === skinId)) return;
        selectedSkinId = skinId;
        try { localStorage.setItem(STORAGE_SKIN, selectedSkinId); } catch { /* storage is optional */ }
        renderSkinPicker();
    }

    function openSkinPicker() {
        if (!dom.skinsOverlay) return;
        renderSkinPicker();
        dom.skinsOverlay.hidden = false;
        dom.skinsGrid?.querySelector(".is-selected")?.scrollIntoView({ block: "nearest" });
        dom.skinsCloseButton?.focus({ preventScroll: true });
    }

    function closeSkinPicker() {
        if (!dom.skinsOverlay) return;
        dom.skinsOverlay.hidden = true;
        dom.skinsButton?.focus({ preventScroll: true });
    }

    function renderLevelCards() {
        dom.levels.innerHTML = levels.map((level, index) => {
            const saved = levelProgress(level.id);
            return `
                <article class="cube-rush-level-card" data-level="${escapeHtml(level.id)}">
                    ${saved.completed ? '<span class="cube-rush-complete-mark" aria-label="Completato">✓</span>' : ""}
                    <div class="cube-rush-level-art"><span class="cube-rush-level-number">LEVEL ${index + 1}</span></div>
                    <div class="cube-rush-level-body">
                        <div class="cube-rush-level-heading">
                            <h2>${escapeHtml(level.name)}</h2>
                            <span class="cube-rush-difficulty">${escapeHtml(level.difficulty)}</span>
                        </div>
                        <p>${escapeHtml(level.description)}</p>
                        <div class="cube-rush-level-progress">
                            <div class="cube-rush-progress-row">
                                <span class="cube-rush-card-progress-label">NORMAL MODE</span>
                                <span class="cube-rush-card-progress-track"><i style="width:${saved.normalBest}%"></i></span>
                                <strong>${saved.normalBest}%</strong>
                            </div>
                            <div class="cube-rush-progress-row is-practice">
                                <span class="cube-rush-card-progress-label">PRACTICE MODE</span>
                                <span class="cube-rush-card-progress-track"><i style="width:${saved.practiceBest}%"></i></span>
                                <strong>${saved.practiceBest}%</strong>
                            </div>
                        </div>
                        <button type="button" class="cube-rush-play-button" data-play-level="${escapeHtml(level.id)}">GIOCA</button>
                    </div>
                </article>`;
        }).join("");
        renderStats();
    }

    function renderStats() {
        const completed = levels.filter((level) => levelProgress(level.id).completed).length;
        dom.completedCount.textContent = `${completed} / ${levels.length}`;
        dom.totalAttempts.textContent = String(Number(progress.totalAttempts) || 0);
        dom.totalDeaths.textContent = String(Number(progress.totalDeaths) || 0);
        const minutes = Math.floor((Number(progress.playTime) || 0) / 60);
        dom.playTime.textContent = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        }[character]));
    }

    function setRunMode(mode) {
        selectedRunMode = mode === "practice" ? "practice" : "normal";
        document.querySelectorAll("[data-run-mode]").forEach((button) => {
            const selected = button.dataset.runMode === selectedRunMode;
            button.classList.toggle("is-active", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    }

    function isPhoneLikeViewport() {
        const shortSide = Math.min(window.innerWidth, window.innerHeight);
        const longSide = Math.max(window.innerWidth, window.innerHeight);
        return window.matchMedia("(pointer: coarse)").matches
            || Number(navigator.maxTouchPoints) > 0
            || (shortSide <= 680 && longSide <= 1100);
    }

    function isPortraitPhone() {
        return isPhoneLikeViewport() && window.innerHeight > window.innerWidth;
    }

    function setRotateHint(visible) {
        if (!dom.rotateHint) return;
        dom.rotateHint.hidden = !visible;
        dom.rotateHint.setAttribute("aria-hidden", String(!visible));
    }

    function requestLandscapePresentation() {
        if (!isPhoneLikeViewport()) return;

        const lockLandscape = () => {
            try {
                const orientationLock = screen.orientation?.lock?.("landscape");
                orientationLock?.catch(() => {});
            } catch { /* orientation lock is not supported by every mobile browser */ }
        };

        try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                const fullscreenRequest = document.documentElement.requestFullscreen({ navigationUI: "hide" });
                if (fullscreenRequest?.then) fullscreenRequest.then(lockLandscape).catch(lockLandscape);
                else lockLandscape();
                return;
            }
        } catch { /* fullscreen is an optional enhancement */ }

        // Alcuni browser Android rifiutano il fullscreen ma consentono comunque
        // il lock dopo il tap: il gameplay resta attivo anche in questo caso.
        lockLandscape();
    }

    function exitLandscapePresentation() {
        setRotateHint(false);
        dom.page.classList.remove("is-gameplay-active");
        document.body.classList.remove("cube-rush-playing");
        try { screen.orientation?.unlock?.(); } catch { /* optional browser API */ }
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                const fullscreenExit = document.exitFullscreen();
                fullscreenExit?.catch(() => {});
            }
        } catch { /* fullscreen is an optional enhancement */ }
    }

    function resumeAfterOrientationChange() {
        if (state.status !== "orientation-paused") return;
        state.status = "running";
        previousTime = performance.now();
        dom.centerMessage.textContent = "";
        dom.canvas.focus({ preventScroll: true });
    }

    function updateOrientationState() {
        const portrait = isPortraitPhone();
        if (portrait) {
            if (!activeLevel) {
                setRotateHint(Boolean(pendingLevelId));
                return;
            }
            setRotateHint(true);
            if (state.status === "running" || state.status === "countdown") {
                countdownToken += 1;
                input.active = false;
                state.status = "orientation-paused";
                dom.centerMessage.textContent = "";
                dom.pauseOverlay.hidden = true;
            }
            return;
        }

        setRotateHint(false);
        if (pendingLevelId) {
            const levelId = pendingLevelId;
            pendingLevelId = null;
            beginLevel(levelId);
            return;
        }
        resumeAfterOrientationChange();
    }

    function handleViewportChange() {
        resizeCanvas();
        updateOrientationState();
    }

    function updateAudioButtons() {
        [[dom.musicButton, "music"], [dom.sfxButton, "sfx"]].forEach(([button, key]) => {
            button.setAttribute("aria-pressed", String(preferences[key]));
            const label = button.querySelector("span");
            if (label) label.textContent = preferences[key] ? "ON" : "OFF";
        });
    }

    function beginLevel(levelId) {
        const level = levels.find((item) => item.id === levelId);
        if (!level) return;
        pendingLevelId = null;
        requestLandscapePresentation();
        ensureAudio();
        activeLevel = level;
        state.runMode = selectedRunMode;
        state.attempts = 0;
        state.checkpoint = null;
        state.elapsed = 0;
        state.invincible = debugEnabled && state.invincible;
        lastBeat = -1;
        dom.menu.hidden = true;
        dom.game.hidden = false;
        dom.page.classList.add("is-gameplay-active");
        document.body.classList.add("cube-rush-playing");
        dom.practiceBadge.hidden = state.runMode !== "practice";
        dom.levelName.textContent = level.name;
        dom.completeOverlay.hidden = true;
        dom.pauseOverlay.hidden = true;
        resizeCanvas();
        spawnAttempt(false);
        updateOrientationState();
        dom.game.scrollIntoView({ block: "start" });
        dom.canvas.focus({ preventScroll: true });
    }

    function spawnAttempt(fromCheckpoint) {
        clearTimeout(restartTimer);
        state.attempts += 1;
        progress.totalAttempts = (Number(progress.totalAttempts) || 0) + 1;
        const saved = levelProgress(activeLevel.id);
        saved.attempts += 1;
        progress.levels[activeLevel.id] = saved;
        saveProgress();

        const start = fromCheckpoint && state.checkpoint ? state.checkpoint : null;
        state.player = createPlayer();
        state.player.mode = start?.mode || activeLevel.startMode || "cube";
        state.player.gravity = start?.gravity || 1;
        state.player.x = start?.x || 180;
        state.player.y = start?.y || (state.player.gravity > 0 ? world.floor - state.player.size / 2 : world.ceiling + state.player.size / 2);
        state.player.vy = start?.vy || 0;
        state.speedMultiplier = start?.speedMultiplier || 1;
        state.cameraX = Math.max(0, state.player.x - 190);
        state.status = "running";
        state.triggered = new Set();
        state.activated = new Set();
        activeLevel.objects.forEach((object, index) => {
            if (object.x < state.player.x - 5 && object.type === "portal") state.triggered.add(index);
        });
        input.active = false;
        input.buffer = 0;
        dom.attempt.textContent = `ATTEMPT ${state.attempts}`;
        dom.modeLabel.textContent = MODE_LABELS[state.player.mode];
        dom.centerMessage.textContent = state.runMode === "practice" && fromCheckpoint ? "CHECKPOINT" : "";
        setTimeout(() => {
            if (dom.centerMessage.textContent === "CHECKPOINT") dom.centerMessage.textContent = "";
        }, 600);
        updateHud();
    }

    function pressInput(event) {
        if (event?.cancelable) event.preventDefault();
        if (state.status !== "running") return;
        ensureAudio();
        input.active = true;
        input.buffer = PHYSICS.inputBuffer;
    }

    function releaseInput(event) {
        if (event?.cancelable) event.preventDefault();
        input.active = false;
    }

    function simulationStep(dt) {
        if (state.status !== "running" || !activeLevel) return;
        const player = state.player;
        player.previousY = player.y;
        player.grounded = false;
        state.elapsed += dt;
        progress.playTime = (Number(progress.playTime) || 0) + dt;
        saveClock += dt;
        if (saveClock >= 2) { saveClock = 0; saveProgress(); }

        const speed = activeLevel.baseSpeed * state.speedMultiplier;
        player.x += speed * dt;
        state.cameraX = Math.max(0, player.x - 190);
        triggerPortalsAndCheckpoints();
        const orbUsed = tryActivateOrb();
        applyModePhysics(dt, speed, orbUsed);
        resolveWorldBounds();
        if (state.status !== "running") return;
        resolveObjectCollisions();
        if (state.status !== "running") return;
        updateTrail(dt);
        updateParticles(dt);
        input.buffer = Math.max(0, input.buffer - dt);

        const percentage = Math.min(100, Math.floor((player.x / activeLevel.length) * 100));
        const saved = levelProgress(activeLevel.id);
        const bestKey = state.runMode === "practice" ? "practiceBest" : "normalBest";
        if (percentage > saved[bestKey]) {
            saved[bestKey] = percentage;
            saved.best = saved.normalBest;
            progress.levels[activeLevel.id] = saved;
        }
        if (player.x >= activeLevel.length) completeLevel();
        playBeat();
    }

    function applyModePhysics(dt, speed, orbUsed) {
        const player = state.player;
        if (player.mode === "cube") {
            if (!orbUsed && input.buffer > 0 && (player.coyote > 0 || player.grounded)) {
                player.vy = -PHYSICS.cubeJump * player.gravity;
                player.grounded = false;
                player.coyote = 0;
                input.buffer = 0;
                playSound("jump");
            }
            const cubeGravity = player.vy * player.gravity > 0 ? PHYSICS.cubeFallGravity : PHYSICS.cubeGravity;
            player.vy += cubeGravity * player.gravity * dt;
            player.y += player.vy * dt;
            if (!player.grounded) player.rotation += dt * 6.7 * player.gravity;
        } else if (player.mode === "ship") {
            const acceleration = input.active ? -PHYSICS.shipLift : PHYSICS.shipGravity;
            player.vy += acceleration * player.gravity * dt;
            player.vy = clamp(player.vy, -PHYSICS.shipMaxSpeed, PHYSICS.shipMaxSpeed);
            player.y += player.vy * dt;
            player.rotation = clamp(player.vy / 620, -.58, .58);
        } else if (player.mode === "ball") {
            if (!orbUsed && input.buffer > 0) {
                player.gravity *= -1;
                player.vy = 150 * player.gravity;
                player.grounded = false;
                input.buffer = 0;
                playSound("flip");
            }
            player.vy += PHYSICS.ballGravity * player.gravity * dt;
            player.y += player.vy * dt;
            player.rotation += dt * 5.8 * player.gravity;
        } else if (player.mode === "wave") {
            const direction = input.active ? -1 : 1;
            player.vy = direction * speed * PHYSICS.waveSlope * player.gravity;
            player.y += player.vy * dt;
            player.rotation = direction * .77 * player.gravity;
            input.buffer = 0;
        }
    }

    function triggerPortalsAndCheckpoints() {
        const player = state.player;
        const start = lowerObjectIndex(player.x - 80);
        for (let i = start; i < activeLevel.objects.length; i += 1) {
            const object = activeLevel.objects[i];
            if (object.x > player.x + 25) break;
            if (object.x < player.x - 40 || state.triggered.has(i)) continue;
            if (object.type === "portal") {
                state.triggered.add(i);
                applyPortal(object);
            } else if (object.type === "checkpoint" && state.runMode === "practice") {
                state.triggered.add(i);
                state.checkpoint = {
                    x: object.x + 22,
                    y: clamp(player.y, world.ceiling + player.size, world.floor - player.size),
                    vy: player.vy,
                    mode: player.mode,
                    gravity: player.gravity,
                    speedMultiplier: state.speedMultiplier
                };
                spawnCheckpointParticles(object.x, player.y);
                playSound("checkpoint");
            }
        }
    }

    function applyPortal(portalObject) {
        const player = state.player;
        if (portalObject.kind === "mode" && MODES.has(portalObject.value)) {
            player.mode = portalObject.value;
            player.vy = 0;
            player.grounded = false;
            if (portalObject.value === "cube" && player.gravity < 0) {
                // Dopo una sezione Wave invertita il cubo deve rientrare dal pavimento:
                // lasciarlo con gravità negativa lo faceva spawnare sul tetto e saltare
                // tutta la sezione finale del livello.
                player.gravity = 1;
                player.y = world.floor - player.size / 2;
                player.grounded = true;
            } else {
                player.y = clamp(player.y, world.ceiling + player.size / 2, world.floor - player.size / 2);
            }
            dom.modeLabel.textContent = MODE_LABELS[player.mode];
        } else if (portalObject.kind === "gravity") {
            const nextGravity = Number(portalObject.value);
            player.gravity = nextGravity === -1 ? -1 : 1;
            player.vy = 110 * player.gravity;
            player.grounded = false;
        } else if (portalObject.kind === "speed") {
            state.speedMultiplier = clamp(Number(portalObject.value) || 1, .5, 2);
        }
        spawnPortalParticles(portalObject);
        playSound("portal");
    }

    function tryActivateOrb() {
        if (input.buffer <= 0) return false;
        const player = state.player;
        let candidate = null;
        let candidateIndex = -1;
        let bestDistance = Infinity;
        const start = lowerObjectIndex(player.x - 75);
        for (let i = start; i < activeLevel.objects.length; i += 1) {
            const object = activeLevel.objects[i];
            if (object.x > player.x + 75) break;
            if (object.type !== "orb" || state.activated.has(i)) continue;
            const distance = Math.hypot(object.x - player.x, object.y - player.y);
            if (distance < 74 && distance < bestDistance) {
                candidate = object;
                candidateIndex = i;
                bestDistance = distance;
            }
        }
        if (!candidate) return false;
        state.activated.add(candidateIndex);
        input.buffer = 0;
        if (candidate.color === "blue") {
            player.gravity *= -1;
            player.vy = 430 * player.gravity;
        } else {
            const force = candidate.color === "pink" ? 570 : 790;
            player.vy = -force * player.gravity;
        }
        player.grounded = false;
        spawnOrbParticles(candidate);
        playSound("orb");
        return true;
    }

    function resolveWorldBounds() {
        const player = state.player;
        const half = player.size / 2;
        if (player.mode === "ship" || player.mode === "wave") {
            if (player.y - half <= world.ceiling || player.y + half >= world.floor) die("confine");
            return;
        }

        if (player.gravity > 0 && player.y + half >= world.floor) {
            player.y = world.floor - half;
            player.vy = 0;
            landPlayer();
        } else if (player.gravity < 0 && player.y - half <= world.ceiling) {
            player.y = world.ceiling + half;
            player.vy = 0;
            landPlayer();
        } else if (player.y - half <= world.ceiling || player.y + half >= world.floor) {
            die("superficie opposta");
        } else {
            player.coyote = Math.max(0, player.coyote - STEP);
        }
    }

    function landPlayer() {
        const player = state.player;
        player.grounded = true;
        player.coyote = PHYSICS.coyoteTime;
        if (player.mode === "cube") {
            const quarter = Math.PI / 2;
            player.rotation = Math.round(player.rotation / quarter) * quarter;
        }
    }

    function resolveObjectCollisions() {
        const playerRect = getPlayerRect();
        const dangerRect = getPlayerRect(.78);
        // I blocchi usano x come bordo sinistro e possono essere larghi oltre 250 px.
        // Un lookback corto li eliminava dal controllo mentre il cubo era ancora sopra.
        const start = lowerObjectIndex(state.player.x - 360);
        for (let i = start; i < activeLevel.objects.length; i += 1) {
            const object = activeLevel.objects[i];
            if (object.x > state.player.x + 85) break;
            if (objectRightEdge(object) < state.player.x - 85) continue;
            if (object.type === "spike" && rectsOverlap(dangerRect, spikeRect(object))) {
                die("spike");
                return;
            }
            if (object.type === "saw" && circleHitsRect(object.x, object.y, object.radius * .82, dangerRect)) {
                die("sega");
                return;
            }
            if (object.type === "block" && rectsOverlap(playerRect, object)) {
                if (object.lethal || state.player.mode === "ship" || state.player.mode === "wave") {
                    die("ostacolo");
                    return;
                }
                if (!landOnBlock(object)) {
                    die("blocco");
                    return;
                }
            }
            if (object.type === "pad" && !state.activated.has(i) && padTouchesPlayer(object)) {
                state.activated.add(i);
                activatePad(object);
            }
        }
    }

    function objectRightEdge(object) {
        if (object.type === "block") return object.x + object.w;
        if (object.type === "saw") return object.x + object.radius;
        if (object.type === "spike") return object.x + object.size;
        return object.x + 35;
    }

    function landOnBlock(object) {
        const player = state.player;
        const half = player.size / 2;
        const previousTop = player.previousY - half;
        const previousBottom = player.previousY + half;
        if (player.gravity > 0 && player.vy >= 0 && previousBottom <= object.y + 8) {
            player.y = object.y - half;
            player.vy = 0;
            landPlayer();
            return true;
        }
        if (player.gravity < 0 && player.vy <= 0 && previousTop >= object.y + object.h - 8) {
            player.y = object.y + object.h + half;
            player.vy = 0;
            landPlayer();
            return true;
        }
        return false;
    }

    function padTouchesPlayer(object) {
        const player = state.player;
        if (Math.abs(player.x - object.x) > 28) return false;
        const half = player.size / 2;
        return object.surface === "floor"
            ? Math.abs(player.y + half - world.floor) < 18
            : Math.abs(player.y - half - world.ceiling) < 18;
    }

    function activatePad(object) {
        const player = state.player;
        const force = object.color === "pink" ? 610 : 860;
        player.gravity = object.surface === "ceiling" ? -1 : 1;
        player.vy = -force * player.gravity;
        player.grounded = false;
        spawnPadParticles(object);
        playSound("pad");
    }

    function die() {
        if (state.status !== "running" || state.invincible) return;
        state.status = "dead";
        progress.totalDeaths = (Number(progress.totalDeaths) || 0) + 1;
        saveProgress();
        input.active = false;
        spawnDeathParticles();
        playSound("death");
        dom.stage.classList.remove("is-dead");
        void dom.stage.offsetWidth;
        dom.stage.classList.add("is-dead");
        dom.centerMessage.textContent = "CRASH";
        dom.centerMessage.className = "cube-rush-center-message is-death";
        restartTimer = window.setTimeout(() => {
            dom.stage.classList.remove("is-dead");
            dom.centerMessage.textContent = "";
            dom.centerMessage.className = "cube-rush-center-message";
            spawnAttempt(state.runMode === "practice" && Boolean(state.checkpoint));
        }, PHYSICS.deathDelay * 1000);
    }

    function completeLevel() {
        if (state.status !== "running") return;
        state.status = "complete";
        input.active = false;
        const saved = levelProgress(activeLevel.id);
        const bestKey = state.runMode === "practice" ? "practiceBest" : "normalBest";
        saved[bestKey] = 100;
        saved.best = saved.normalBest;
        if (state.runMode === "practice") saved.practiceCompleted = true;
        else saved.completed = true;
        progress.levels[activeLevel.id] = saved;
        saveProgress();
        updateHud(100);
        playSound("complete");
        dom.completeLevel.textContent = activeLevel.name;
        dom.resultMode.textContent = state.runMode.toUpperCase();
        dom.resultAttempts.textContent = String(state.attempts);
        dom.resultBest.textContent = `${saved[bestKey]}%`;
        dom.completeOverlay.hidden = false;
        dom.replayButton.focus();
    }

    function pauseGame(automatic = false) {
        if (state.status !== "running") return;
        state.status = "paused";
        input.active = false;
        dom.pauseOverlay.hidden = false;
        const title = document.getElementById("cubeRushPauseTitle");
        if (title) title.textContent = automatic ? "Partita sospesa" : "Pronto a ripartire?";
        dom.resumeButton.focus();
    }

    function resumeGame() {
        if (state.status !== "paused") return;
        dom.pauseOverlay.hidden = true;
        const token = ++countdownToken;
        let count = 3;
        state.status = "countdown";
        const tick = () => {
            if (token !== countdownToken || state.status !== "countdown") return;
            dom.centerMessage.textContent = count > 0 ? String(count) : "VIA";
            if (count < 0) {
                dom.centerMessage.textContent = "";
                state.status = "running";
                previousTime = performance.now();
                dom.canvas.focus({ preventScroll: true });
                return;
            }
            count -= 1;
            setTimeout(tick, 420);
        };
        tick();
    }

    function returnToMenu() {
        clearTimeout(restartTimer);
        countdownToken += 1;
        input.active = false;
        state.status = "menu";
        activeLevel = null;
        pendingLevelId = null;
        exitLandscapePresentation();
        dom.pauseOverlay.hidden = true;
        dom.completeOverlay.hidden = true;
        dom.game.hidden = true;
        dom.menu.hidden = false;
        dom.centerMessage.textContent = "";
        saveProgress();
        renderLevelCards();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function updateHud(forcedProgress) {
        if (!activeLevel) return;
        const percentage = forcedProgress ?? Math.min(100, Math.max(0, Math.floor((state.player.x / activeLevel.length) * 100)));
        dom.progressBar.style.width = `${percentage}%`;
        dom.progressText.textContent = `${percentage}%`;
        dom.modeLabel.textContent = MODE_LABELS[state.player.mode] || "CUBE";
        if (debugEnabled) {
            dom.canvas.dataset.debugX = String(Math.round(state.player.x));
            dom.canvas.dataset.debugY = String(Math.round(state.player.y));
            dom.canvas.dataset.debugGrounded = String(state.player.grounded);
            dom.canvas.dataset.debugMode = state.player.mode;
            dom.canvas.dataset.debugGravity = String(state.player.gravity);
            dom.canvas.dataset.debugActivated = String(state.activated.size);
            dom.canvas.dataset.debugCheckpoint = String(Math.round(state.checkpoint?.x || 0));
            dom.canvas.dataset.debugAttempts = String(state.attempts);
        }
    }

    function lowerObjectIndex(x) {
        let low = 0;
        let high = activeLevel.objects.length;
        while (low < high) {
            const middle = (low + high) >> 1;
            if (activeLevel.objects[middle].x < x) low = middle + 1;
            else high = middle;
        }
        return low;
    }

    function getPlayerRect(scale = 1) {
        const size = state.player.size * scale;
        return { x: state.player.x - size / 2, y: state.player.y - size / 2, w: size, h: size };
    }

    function spikeRect(object) {
        const size = object.size || 34;
        return {
            x: object.x - size * .36,
            y: object.direction === "up" ? object.y - size * .84 : object.y,
            w: size * .72,
            h: size * .84
        };
    }

    function rectsOverlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function circleHitsRect(cx, cy, radius, rect) {
        const closestX = clamp(cx, rect.x, rect.x + rect.w);
        const closestY = clamp(cy, rect.y, rect.y + rect.h);
        return (cx - closestX) ** 2 + (cy - closestY) ** 2 < radius ** 2;
    }

    function updateTrail(dt) {
        const player = state.player;
        player.trail.unshift({ x: player.x, y: player.y, life: 1 });
        if (player.trail.length > 18) player.trail.length = 18;
        player.trail.forEach((point) => { point.life -= dt * 3.2; });
        player.trail = player.trail.filter((point) => point.life > 0);
    }

    function addParticle(x, y, vx, vy, color, size, life = .55) {
        if (state.particles.length >= 90) state.particles.shift();
        state.particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
    }

    function spawnDeathParticles() {
        const player = state.player;
        for (let i = 0; i < 22; i += 1) {
            const angle = (Math.PI * 2 * i) / 22;
            const speed = 100 + (i % 5) * 34;
            addParticle(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, activeLevel.palette.player, 4 + i % 5, .62);
        }
    }

    function spawnPortalParticles(object) {
        for (let i = 0; i < 12; i += 1) {
            const angle = (Math.PI * 2 * i) / 12;
            addParticle(object.x, object.y, Math.cos(angle) * 85, Math.sin(angle) * 85, activeLevel.palette.accent, 4, .45);
        }
    }

    function spawnOrbParticles(object) {
        for (let i = 0; i < 10; i += 1) {
            const angle = (Math.PI * 2 * i) / 10;
            addParticle(object.x, object.y, Math.cos(angle) * 72, Math.sin(angle) * 72, orbColor(object.color), 3, .4);
        }
    }

    function spawnPadParticles(object) {
        for (let i = 0; i < 9; i += 1) addParticle(object.x, object.y, (i - 4) * 18, object.surface === "floor" ? -120 : 120, orbColor(object.color), 3, .38);
    }

    function spawnCheckpointParticles(x, y) {
        for (let i = 0; i < 8; i += 1) addParticle(x, y, (i - 4) * 13, -70 - (i % 3) * 25, "#ffffff", 3, .5);
    }

    function updateParticles(dt) {
        state.particles.forEach((particle) => {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 260 * dt;
            particle.life -= dt;
        });
        state.particles = state.particles.filter((particle) => particle.life > 0);
    }

    function frame(now) {
        if (!previousTime) previousTime = now;
        const elapsed = Math.min(MAX_FRAME, Math.max(0, (now - previousTime) / 1000));
        previousTime = now;
        if (state.status === "running") {
            accumulator += elapsed;
            while (accumulator >= STEP) {
                simulationStep(STEP);
                accumulator -= STEP;
            }
        } else {
            accumulator = 0;
            updateParticles(elapsed);
        }
        render();
        updateHud();
        rafId = requestAnimationFrame(frame);
    }

    function render() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!activeLevel) {
            ctx.clearRect(0, 0, world.width, world.height);
            return;
        }
        drawBackground();
        drawWorld();
        drawParticles();
        if (state.status !== "dead") drawPlayer();
    }

    function drawBackground() {
        const palette = activeLevel.palette;
        const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
        gradient.addColorStop(0, palette.skyTop);
        gradient.addColorStop(1, palette.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, world.width, world.height);

        ctx.globalAlpha = .34;
        ctx.fillStyle = palette.far;
        const farOffset = -((state.cameraX * .12) % 280);
        for (let x = farOffset - 280; x < world.width + 280; x += 280) {
            ctx.beginPath();
            ctx.moveTo(x, world.floor);
            ctx.lineTo(x + 140, 180);
            ctx.lineTo(x + 300, world.floor);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = .26;
        ctx.fillStyle = palette.near;
        const nearOffset = -((state.cameraX * .24) % 190);
        for (let x = nearOffset - 190; x < world.width + 190; x += 190) {
            ctx.fillRect(x, 135 + ((x / 190) % 2) * 34, 68, 210);
            ctx.fillRect(x + 80, 210, 36, 135);
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        const gridOffset = -((state.cameraX * .45) % 64);
        for (let x = gridOffset; x <= world.width; x += 64) {
            ctx.beginPath(); ctx.moveTo(x, world.ceiling); ctx.lineTo(x, world.floor); ctx.stroke();
        }
        for (let y = world.ceiling; y <= world.floor; y += 64) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(world.width, y); ctx.stroke();
        }
    }

    function drawWorld() {
        const palette = activeLevel.palette;
        ctx.fillStyle = palette.ground;
        ctx.fillRect(0, world.floor, world.width, world.height - world.floor);
        ctx.fillRect(0, 0, world.width, world.ceiling);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(0, world.floor, world.width, 5);
        ctx.fillRect(0, world.ceiling - 5, world.width, 5);

        const start = lowerObjectIndex(state.cameraX - 100);
        for (let i = start; i < activeLevel.objects.length; i += 1) {
            const object = activeLevel.objects[i];
            const screenX = object.x - state.cameraX;
            if (screenX > world.width + 120) break;
            drawObject(object, screenX, i);
        }
    }

    function drawObject(object, x, index) {
        const palette = activeLevel.palette;
        if (object.type === "spike") {
            ctx.fillStyle = palette.danger;
            ctx.strokeStyle = "rgba(255,255,255,.72)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (object.direction === "up") {
                ctx.moveTo(x - object.size / 2, object.y); ctx.lineTo(x, object.y - object.size); ctx.lineTo(x + object.size / 2, object.y);
            } else {
                ctx.moveTo(x - object.size / 2, object.y); ctx.lineTo(x, object.y + object.size); ctx.lineTo(x + object.size / 2, object.y);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else if (object.type === "block") {
            ctx.fillStyle = object.lethal ? palette.danger : palette.near;
            ctx.fillRect(x, object.y, object.w, object.h);
            ctx.strokeStyle = object.lethal ? palette.accent : "rgba(255,255,255,.55)";
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 1.5, object.y + 1.5, object.w - 3, object.h - 3);
            ctx.globalAlpha = .18;
            ctx.fillStyle = "#fff";
            for (let lineX = x + 10; lineX < x + object.w; lineX += 22) ctx.fillRect(lineX, object.y + 5, 3, Math.max(0, object.h - 10));
            ctx.globalAlpha = 1;
        } else if (object.type === "saw") {
            drawSaw(x, object.y, object.radius, palette.danger);
        } else if (object.type === "portal") {
            drawPortal(object, x, index);
        } else if (object.type === "orb") {
            drawOrb(object, x, state.activated.has(index));
        } else if (object.type === "pad") {
            drawPad(object, x, state.activated.has(index));
        } else if (object.type === "checkpoint" && state.runMode === "practice") {
            ctx.globalAlpha = state.checkpoint && state.checkpoint.x >= object.x ? .95 : .42;
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x, world.floor); ctx.lineTo(x, world.floor - 58); ctx.stroke();
            ctx.fillStyle = palette.accent;
            ctx.beginPath(); ctx.moveTo(x, world.floor - 58); ctx.lineTo(x + 30, world.floor - 47); ctx.lineTo(x, world.floor - 35); ctx.fill();
            ctx.globalAlpha = 1;
        } else if (object.type === "finish") {
            ctx.fillStyle = "rgba(255,255,255,.9)";
            for (let row = 0; row < 7; row += 1) for (let col = 0; col < 2; col += 1) {
                if ((row + col) % 2 === 0) ctx.fillRect(x + col * 18, 180 + row * 36, 18, 36);
            }
        }
    }

    function drawPortal(object, x, index) {
        const colors = object.kind === "mode"
            ? { cube: "#ffcf4a", ship: "#59d8ff", ball: "#ff795d", wave: "#a6ff39" }[object.value]
            : object.kind === "gravity" ? "#4f7cff" : "#ffffff";
        const radiusX = 22;
        const radiusY = object.kind === "mode" ? 76 : 58;
        ctx.save();
        ctx.translate(x, object.y);
        ctx.rotate(Math.sin(performance.now() / 400 + index) * .035);
        ctx.strokeStyle = colors || activeLevel.palette.accent;
        ctx.lineWidth = 8;
        ctx.globalAlpha = state.triggered.has(index) ? .3 : .92;
        ctx.beginPath(); ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.beginPath(); ctx.ellipse(0, 0, radiusX + 9, radiusY + 9, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    function drawOrb(object, x, used) {
        ctx.save();
        ctx.globalAlpha = used ? .22 : 1;
        ctx.fillStyle = orbColor(object.color);
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, object.y, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.globalAlpha *= .34;
        ctx.beginPath(); ctx.arc(x, object.y, 29 + Math.sin(performance.now() / 180) * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }

    function drawPad(object, x, used) {
        const y = object.surface === "floor" ? object.y - 9 : object.y;
        ctx.globalAlpha = used ? .35 : 1;
        ctx.fillStyle = orbColor(object.color);
        ctx.beginPath();
        if (object.surface === "floor") { ctx.moveTo(x - 27, y + 9); ctx.lineTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.lineTo(x + 27, y + 9); }
        else { ctx.moveTo(x - 27, y); ctx.lineTo(x - 18, y + 9); ctx.lineTo(x + 18, y + 9); ctx.lineTo(x + 27, y); }
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawSaw(x, y, radius, color) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(performance.now() / 330);
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 24; i += 1) {
            const angle = i * Math.PI / 12;
            const r = i % 2 === 0 ? radius : radius * .72;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = activeLevel.palette.ground;
        ctx.beginPath(); ctx.arc(0, 0, radius * .3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawPlayer() {
        const player = state.player;
        const x = player.x - state.cameraX;
        const color = activeLevel.palette.player;
        player.trail.forEach((point, index) => {
            ctx.globalAlpha = point.life * .24;
            ctx.fillStyle = activeLevel.palette.accent;
            const size = Math.max(2, player.size * (1 - index / 24) * .55);
            ctx.fillRect(point.x - state.cameraX - size / 2, point.y - size / 2, size, size);
        });
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(x, player.y);
        ctx.rotate(player.rotation);
        ctx.fillStyle = color;
        ctx.strokeStyle = activeLevel.palette.ink;
        ctx.lineWidth = 4;
        const half = player.size / 2;
        if (player.mode === "cube") {
            if (drawCubeSkin && selectedSkin()) {
                drawCubeSkin(ctx, selectedSkin(), player.size, performance.now());
            } else {
                ctx.fillRect(-half, -half, player.size, player.size);
                ctx.strokeRect(-half, -half, player.size, player.size);
                ctx.fillStyle = activeLevel.palette.ink;
                ctx.fillRect(-9, -6, 5, 5); ctx.fillRect(5, -6, 5, 5);
                ctx.strokeStyle = activeLevel.palette.ink;
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(-7, 7);
                ctx.quadraticCurveTo(0, 11, 7, 7);
                ctx.stroke();
            }
        } else if (player.mode === "ship") {
            ctx.beginPath(); ctx.moveTo(half + 5, 0); ctx.lineTo(-half, -12); ctx.lineTo(-11, 0); ctx.lineTo(-half, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = activeLevel.palette.accent;
            ctx.fillRect(-half - 10, -4, 12 + (input.active ? 9 : 0), 8);
        } else if (player.mode === "ball") {
            ctx.beginPath(); ctx.arc(0, 0, half, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = activeLevel.palette.ink; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-half, 0); ctx.lineTo(half, 0); ctx.moveTo(0, -half); ctx.lineTo(0, half); ctx.stroke();
        } else if (player.mode === "wave") {
            ctx.beginPath(); ctx.moveTo(half + 4, 0); ctx.lineTo(-half, -half); ctx.lineTo(-7, 0); ctx.lineTo(-half, half); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }

    function drawParticles() {
        state.particles.forEach((particle) => {
            ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - state.cameraX - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
        });
        ctx.globalAlpha = 1;
    }

    function orbColor(color) {
        return { yellow: "#ffda47", pink: "#ff6f9b", blue: "#55a7ff", green: "#55e28c" }[color] || "#ffda47";
    }

    function ensureAudio() {
        if (!audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (AudioCtor) audioContext = new AudioCtor();
        }
        if (audioContext?.state === "suspended") audioContext.resume().catch(() => {});
    }

    function tone(frequency, duration, volume, type = "square", delay = 0) {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = audioContext.currentTime + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
    }

    function playBeat() {
        if (!preferences.music || !audioContext || !activeLevel) return;
        const beat = Math.floor(state.elapsed * activeLevel.bpm / 60);
        if (beat === lastBeat) return;
        lastBeat = beat;
        const roots = { "prisma-coast": 220, "foundry-beat": 164.81, "voltage-core": 196 };
        const root = roots[activeLevel.id] || 220;
        const scale = [1, 1.25, 1.5, 2];
        tone(root * scale[beat % scale.length], .09, .026, beat % 4 === 0 ? "square" : "triangle");
        if (beat % 4 === 0) tone(root / 2, .15, .035, "sine");
    }

    function playSound(name) {
        if (!preferences.sfx) return;
        ensureAudio();
        const sounds = {
            jump: [410, .06, .055, "square"], flip: [260, .08, .05, "triangle"],
            orb: [620, .11, .06, "sine"], pad: [330, .12, .06, "square"],
            portal: [520, .14, .045, "sine"], checkpoint: [740, .12, .045, "triangle"],
            death: [95, .22, .08, "sawtooth"], complete: [660, .32, .06, "triangle"]
        };
        const sound = sounds[name];
        if (!sound) return;
        tone(...sound);
        if (name === "complete") tone(880, .32, .05, "triangle", .12);
    }

    function resizeCanvas() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = Math.round(world.width * dpr);
        const height = Math.round(world.height * dpr);
        if (dom.canvas.width !== width || dom.canvas.height !== height) {
            dom.canvas.width = width;
            dom.canvas.height = height;
        }
    }

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function runSelfChecks() {
        console.assert(levels.length >= 3, "Cube Rush: servono almeno tre livelli");
        levels.forEach((level) => {
            console.assert(level.length > 15000, `Cube Rush: ${level.id} deve essere un livello completo`);
            console.assert(level.objects.every((object, index, all) => !index || all[index - 1].x <= object.x), `Cube Rush: oggetti ordinati in ${level.id}`);
        });
        console.assert(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 2, h: 2 }), "Cube Rush: collisione AABB");
        console.assert(!rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 11, y: 0, w: 2, h: 2 }), "Cube Rush: separazione AABB");
        const usedModes = new Set(levels.flatMap((level) => level.objects.filter((object) => object.kind === "mode").map((object) => object.value)));
        ["cube", "ship", "ball", "wave"].forEach((mode) => console.assert(mode === "cube" || usedModes.has(mode), `Cube Rush: portale ${mode}`));
    }

    dom.levels.addEventListener("click", (event) => {
        const button = event.target.closest("[data-play-level]");
        if (button) beginLevel(button.dataset.playLevel);
    });
    document.querySelectorAll("[data-run-mode]").forEach((button) => button.addEventListener("click", () => setRunMode(button.dataset.runMode)));
    dom.musicButton.addEventListener("click", () => { preferences.music = !preferences.music; savePreferences(); updateAudioButtons(); ensureAudio(); });
    dom.sfxButton.addEventListener("click", () => { preferences.sfx = !preferences.sfx; savePreferences(); updateAudioButtons(); ensureAudio(); });
    dom.skinsButton?.addEventListener("click", openSkinPicker);
    dom.skinsCloseButton?.addEventListener("click", closeSkinPicker);
    dom.skinsGrid?.addEventListener("click", (event) => {
        const card = event.target.closest("[data-skin-id]");
        if (card) selectSkin(card.dataset.skinId);
    });
    dom.skinsOverlay?.addEventListener("click", (event) => { if (event.target === dom.skinsOverlay) closeSkinPicker(); });
    dom.pauseButton.addEventListener("click", () => pauseGame(false));
    dom.resumeButton.addEventListener("click", resumeGame);
    dom.restartButton.addEventListener("click", () => { dom.pauseOverlay.hidden = true; state.checkpoint = null; spawnAttempt(false); });
    dom.exitButton.addEventListener("click", returnToMenu);
    dom.replayButton.addEventListener("click", () => beginLevel(activeLevel.id));
    dom.continueButton.addEventListener("click", returnToMenu);

    dom.canvas.addEventListener("pointerdown", (event) => { dom.canvas.setPointerCapture?.(event.pointerId); pressInput(event); }, { passive: false });
    dom.canvas.addEventListener("pointerup", releaseInput, { passive: false });
    dom.canvas.addEventListener("pointercancel", releaseInput, { passive: false });
    dom.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", (event) => {
        if (event.repeat && state.player.mode !== "ship" && state.player.mode !== "wave") return;
        if (["Space", "ArrowUp"].includes(event.code)) pressInput(event);
        if (event.code === "Escape" && dom.skinsOverlay && !dom.skinsOverlay.hidden) { event.preventDefault(); closeSkinPicker(); return; }
        if (event.code === "KeyP" && state.status === "running") { event.preventDefault(); pauseGame(false); }
        else if (event.code === "KeyP" && state.status === "paused") { event.preventDefault(); resumeGame(); }
        if (debugEnabled && event.code === "KeyI") state.invincible = !state.invincible;
        if (debugEnabled && event.code === "PageDown" && activeLevel) {
            event.preventDefault();
            state.player.x = clamp(state.player.x + 1800, 180, activeLevel.length - 20);
        }
        if (debugEnabled && event.code === "End" && activeLevel) {
            event.preventDefault();
            state.player.x = activeLevel.length;
            completeLevel();
        }
        if (debugEnabled && event.code === "KeyK" && activeLevel) {
            const nextCheckpoint = activeLevel.objects.find(object => object.type === "checkpoint" && object.x > state.player.x + 20);
            if (nextCheckpoint) {
                state.invincible = true;
                state.player.x = nextCheckpoint.x - 12;
                state.player.y = world.floor - state.player.size / 2;
                state.player.vy = 0;
                state.player.mode = "cube";
                state.player.gravity = 1;
            }
        }
        if (debugEnabled && event.code === "KeyO" && activeLevel) {
            const nextOrbIndex = activeLevel.objects.findIndex(object => object.type === "orb" && object.x > state.player.x + 20);
            if (nextOrbIndex >= 0) {
                const nextOrb = activeLevel.objects[nextOrbIndex];
                state.invincible = true;
                state.activated.delete(nextOrbIndex);
                state.player.x = nextOrb.x - 65;
                state.player.y = nextOrb.y;
                state.player.vy = 0;
                state.player.mode = "cube";
                state.player.gravity = 1;
            }
        }
        if (debugEnabled && event.code === "KeyL" && activeLevel) {
            const nextPlatform = activeLevel.objects.find(object => (
                object.type === "block"
                && !object.lethal
                && object.x + object.w > state.player.x + 20
            ));
            if (nextPlatform) {
                state.invincible = true;
                state.player.x = nextPlatform.x + 20;
                state.player.y = nextPlatform.y - state.player.size / 2;
                state.player.previousY = state.player.y;
                state.player.vy = 0;
                state.player.mode = "cube";
                state.player.gravity = 1;
                state.player.grounded = true;
                state.cameraX = Math.max(0, state.player.x - 190);
            }
        }
        if (debugEnabled && event.code === "KeyV" && activeLevel?.id === "voltage-core") {
            state.invincible = true;
            state.player.x = 25240;
            state.player.y = world.ceiling + state.player.size / 2;
            state.player.previousY = state.player.y;
            state.player.vy = 0;
            state.player.mode = "wave";
            state.player.gravity = -1;
            state.player.grounded = false;
            state.cameraX = Math.max(0, state.player.x - 190);
        }
        if (debugEnabled && event.code === "KeyD" && activeLevel) {
            state.invincible = false;
            die("debug");
        }
        if (debugEnabled && /^Digit[1-4]$/.test(event.code)) {
            const mode = ["cube", "ship", "ball", "wave"][Number(event.code.slice(-1)) - 1];
            state.player.mode = mode;
            state.player.y = clamp(state.player.y, world.ceiling + state.player.size, world.floor - state.player.size);
            state.player.vy = 0;
        }
    });
    window.addEventListener("keyup", (event) => {
        if (["Space", "ArrowUp"].includes(event.code)) releaseInput(event);
    });
    window.addEventListener("resize", handleViewportChange, { passive: true });
    window.addEventListener("orientationchange", handleViewportChange, { passive: true });
    document.addEventListener("fullscreenchange", handleViewportChange, { passive: true });
    window.visualViewport?.addEventListener("resize", handleViewportChange, { passive: true });
    window.addEventListener("blur", () => { if (!debugEnabled) pauseGame(true); });
    document.addEventListener("visibilitychange", () => { if (document.hidden && !debugEnabled) pauseGame(true); });
    window.addEventListener("pagehide", () => { cancelAnimationFrame(rafId); saveProgress(); });

    if (debugEnabled) {
        window.__cubeRushDebug = Object.freeze({
            getState: () => ({
                status: state.status,
                level: activeLevel?.id || null,
                x: state.player.x,
                mode: state.player.mode,
                gravity: state.player.gravity,
                invincible: state.invincible,
                activatedCount: state.activated.size,
                checkpointX: state.checkpoint?.x || null,
                attempts: state.attempts,
                skin: selectedSkinId
            }),
            setInvincible: (enabled) => { state.invincible = Boolean(enabled); },
            teleport: (x) => { if (activeLevel) state.player.x = clamp(Number(x) || 180, 180, activeLevel.length - 10); },
            setMode: (mode) => { if (MODES.has(mode)) state.player.mode = mode; },
            setSkin: (skinId) => selectSkin(skinId),
            complete: () => { if (activeLevel) { state.player.x = activeLevel.length; completeLevel(); } }
        });
    }

    updateAudioButtons();
    setRunMode("normal");
    renderSkinPicker();
    if (debugEnabled && debugParams.get("skins") === "1") openSkinPicker();
    renderLevelCards();
    resizeCanvas();
    runSelfChecks();
    rafId = requestAnimationFrame(frame);
}());
