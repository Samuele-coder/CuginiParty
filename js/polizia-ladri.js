(function () {
    "use strict";

    const maps = window.POLIZIA_LADRI_MAPS || [];
    const STORAGE_KEY = "cuginiparty_polizia_ladri_progress_v1";
    const PLAYER_RADIUS = 15;
    const GUARD_RADIUS = 16;
    const SAFE_TIME = 1.45;
    const GRID = 32;
    const TAU = Math.PI * 2;

    const dom = {
        menu: document.getElementById("heistMenu"),
        game: document.getElementById("heistGame"),
        maps: document.getElementById("heistMaps"),
        policeCount: document.getElementById("heistPoliceCount"),
        policeMinus: document.getElementById("heistPoliceMinus"),
        policePlus: document.getElementById("heistPolicePlus"),
        play: document.getElementById("heistPlay"),
        canvas: document.getElementById("heistCanvas"),
        stage: document.getElementById("heistStage"),
        roomName: document.getElementById("heistRoomName"),
        objective: document.getElementById("heistObjective"),
        loot: document.getElementById("heistLoot"),
        safes: document.getElementById("heistSafes"),
        timer: document.getElementById("heistTimer"),
        alert: document.getElementById("heistAlert"),
        prompt: document.getElementById("heistPrompt"),
        safeProgress: document.getElementById("heistSafeProgress"),
        safeProgressBar: document.querySelector("#heistSafeProgress i"),
        pause: document.getElementById("heistPause"),
        pauseOverlay: document.getElementById("heistPauseOverlay"),
        resume: document.getElementById("heistResume"),
        restart: document.getElementById("heistRestart"),
        exit: document.getElementById("heistExit"),
        resultOverlay: document.getElementById("heistResultOverlay"),
        resultDialog: document.querySelector(".heist-result-dialog"),
        resultKicker: document.getElementById("heistResultKicker"),
        resultTitle: document.getElementById("heistResultTitle"),
        resultMessage: document.getElementById("heistResultMessage"),
        resultLoot: document.getElementById("heistResultLoot"),
        resultTime: document.getElementById("heistResultTime"),
        resultSpotted: document.getElementById("heistResultSpotted"),
        resultSafes: document.getElementById("heistResultSafes"),
        resultPolice: document.getElementById("heistResultPolice"),
        resultScore: document.getElementById("heistResultScore"),
        replay: document.getElementById("heistReplay"),
        resultExit: document.getElementById("heistResultExit"),
        joystick: document.getElementById("heistJoystick"),
        joystickKnob: document.querySelector("#heistJoystick span"),
        interact: document.getElementById("heistInteract"),
        bestScore: document.getElementById("heistBestScore"),
        bestLoot: document.getElementById("heistBestLoot"),
        wins: document.getElementById("heistWins"),
        perfects: document.getElementById("heistPerfects")
    };

    if (!maps.length || !dom.canvas || !dom.maps) return;

    const ctx = dom.canvas.getContext("2d", { alpha: false });
    const keys = new Set();
    const input = { x: 0, y: 0, strength: 0, interact: false, joystickId: null };
    const progress = readProgress();
    const view = { width: 1280, height: 720, dpr: 1 };
    const camera = { x: 0, y: 0, targetX: 0, targetY: 0, zoom: 1 };

    let selectedMapIndex = 0;
    let selectedPolice = maps[0].minPolice;
    let activeMap = null;
    let player = null;
    let guards = [];
    let cameras = [];
    let safes = [];
    let running = false;
    let paused = false;
    let ended = false;
    let elapsed = 0;
    let loot = 0;
    let spottedCount = 0;
    let openedCount = 0;
    let currentRoom = null;
    let solidRects = [];
    let sightRects = [];
    let interactionSafe = null;
    let interactionTime = 0;
    let lastFrame = 0;
    let rafId = 0;
    let alertTimer = 0;
    let noiseCooldown = 0;
    let audioContext = null;

    init();

    function init() {
        renderMapCards();
        renderRecords();
        updatePolicePicker();
        bindEvents();
        resizeCanvas();
        drawMenuBackdrop();
    }

    function readProgress() {
        const fallback = { bestScore: 0, bestLoot: 0, wins: 0, perfects: 0, bestTime: null };
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function saveProgress() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (error) { /* storage non disponibile */ }
        renderRecords();
    }

    function renderRecords() {
        dom.bestScore.textContent = formatNumber(progress.bestScore);
        dom.bestLoot.textContent = formatMoney(progress.bestLoot);
        dom.wins.textContent = String(progress.wins);
        dom.perfects.textContent = String(progress.perfects);
    }

    function renderMapCards() {
        dom.maps.innerHTML = "";
        maps.forEach((map, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `heist-map-card${index === selectedMapIndex ? " is-selected" : ""}`;
            button.dataset.mapIndex = String(index);
            button.setAttribute("aria-pressed", index === selectedMapIndex ? "true" : "false");
            button.innerHTML = `<span class="heist-map-difficulty">${escapeHtml(map.difficulty)}</span><div class="heist-map-preview" aria-hidden="true"></div><h3>${escapeHtml(map.name)}</h3><p>${escapeHtml(map.description)}</p>`;
            dom.maps.appendChild(button);
        });
    }

    function updatePolicePicker() {
        const map = maps[selectedMapIndex];
        selectedPolice = clamp(selectedPolice, map.minPolice, map.maxPolice);
        dom.policeCount.textContent = String(selectedPolice);
        dom.policeMinus.disabled = selectedPolice <= map.minPolice;
        dom.policePlus.disabled = selectedPolice >= map.maxPolice;
    }

    function bindEvents() {
        dom.maps.addEventListener("click", event => {
            const card = event.target.closest("[data-map-index]");
            if (!card) return;
            selectedMapIndex = Number(card.dataset.mapIndex);
            selectedPolice = maps[selectedMapIndex].minPolice;
            renderMapCards();
            updatePolicePicker();
            tone(370, .05, "sine", .035);
        });
        dom.policeMinus.addEventListener("click", () => { selectedPolice -= 1; updatePolicePicker(); tone(260, .04); });
        dom.policePlus.addEventListener("click", () => { selectedPolice += 1; updatePolicePicker(); tone(390, .04); });
        dom.play.addEventListener("click", startGame);
        dom.pause.addEventListener("click", pauseGame);
        dom.resume.addEventListener("click", resumeGame);
        dom.restart.addEventListener("click", () => { hideOverlays(); startGame(); });
        dom.exit.addEventListener("click", returnToMenu);
        dom.replay.addEventListener("click", () => { hideOverlays(); startGame(); });
        dom.resultExit.addEventListener("click", returnToMenu);
        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("blur", () => { if (running && !paused && !ended) pauseGame(); });
        document.addEventListener("visibilitychange", () => { if (document.hidden && running && !paused && !ended) pauseGame(); });
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        bindTouchControls();
    }

    function onKeyDown(event) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code) && running) event.preventDefault();
        keys.add(event.code);
        if (event.code === "KeyE" || event.code === "Space") input.interact = true;
        if (event.code === "Escape" && running && !ended) paused ? resumeGame() : pauseGame();
    }

    function onKeyUp(event) {
        keys.delete(event.code);
        if (event.code === "KeyE" || event.code === "Space") input.interact = false;
    }

    function bindTouchControls() {
        const resetJoystick = () => {
            input.joystickId = null;
            input.x = 0; input.y = 0; input.strength = 0;
            dom.joystickKnob.style.transform = "translate(-50%, -50%)";
            dom.joystick.classList.remove("is-active");
        };
        const moveJoystick = event => {
            const touch = Array.from(event.changedTouches || []).find(item => item.identifier === input.joystickId);
            if (!touch) return;
            const rect = dom.joystick.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = touch.clientX - cx;
            const dy = touch.clientY - cy;
            const limit = rect.width * .31;
            const distance = Math.hypot(dx, dy);
            const ratio = distance > limit ? limit / distance : 1;
            const mx = dx * ratio;
            const my = dy * ratio;
            const rawStrength = limit ? clamp(distance / limit, 0, 1) : 0;
            const strength = rawStrength < .1 ? 0 : clamp((rawStrength - .1) / .9, 0, 1);
            const directionLength = Math.hypot(mx, my) || 1;
            input.x = strength ? (mx / directionLength) * strength : 0;
            input.y = strength ? (my / directionLength) * strength : 0;
            input.strength = strength;
            dom.joystickKnob.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
        };
        dom.joystick.addEventListener("touchstart", event => {
            event.preventDefault();
            if (input.joystickId === null && event.changedTouches[0]) {
                input.joystickId = event.changedTouches[0].identifier;
                dom.joystick.classList.add("is-active");
            }
            moveJoystick(event);
        }, { passive: false });
        dom.joystick.addEventListener("touchmove", event => { event.preventDefault(); moveJoystick(event); }, { passive: false });
        dom.joystick.addEventListener("touchend", event => {
            if (Array.from(event.changedTouches).some(item => item.identifier === input.joystickId)) resetJoystick();
        });
        dom.joystick.addEventListener("touchcancel", resetJoystick);
        const pressInteract = event => { event.preventDefault(); input.interact = true; };
        const releaseInteract = event => { event.preventDefault(); input.interact = false; };
        dom.interact.addEventListener("pointerdown", pressInteract);
        dom.interact.addEventListener("pointerup", releaseInteract);
        dom.interact.addEventListener("pointercancel", releaseInteract);
        dom.interact.addEventListener("pointerleave", releaseInteract);
        dom.stage.addEventListener("contextmenu", event => event.preventDefault());
    }

    function startGame() {
        activeMap = maps[selectedMapIndex];
        solidRects = activeMap.walls.concat(activeMap.furniture.filter(item => item.solid));
        sightRects = activeMap.walls.concat(activeMap.furniture.filter(item => item.blocksSight));
        player = { x: activeMap.spawn.x, y: activeMap.spawn.y, angle: 0, speed: 0, running: false, stepPhase: 0 };
        safes = activeMap.safes.map(safe => ({ ...safe, opened: false }));
        guards = activeMap.policeSpawns.slice(0, selectedPolice).map((spawn, index) => createGuard(spawn, index));
        cameras = (activeMap.cameras || []).map((camera, index) => ({
            ...camera,
            baseAngle: camera.angle,
            phase: index * 1.47,
            cooldown: 0,
            alertTime: 0,
            wasSeeing: false
        }));
        running = true; paused = false; ended = false; elapsed = 0; loot = 0; spottedCount = 0; openedCount = 0;
        interactionSafe = null; interactionTime = 0; alertTimer = 0; noiseCooldown = 0;
        currentRoom = findRoom(player.x, player.y) || activeMap.rooms[0];
        camera.x = currentRoom.x + currentRoom.w / 2;
        camera.y = currentRoom.y + currentRoom.h / 2;
        camera.targetX = camera.x; camera.targetY = camera.y;
        keys.clear(); input.interact = false;
        dom.menu.hidden = true; dom.game.hidden = false; hideOverlays();
        document.body.classList.add("heist-is-playing");
        updateHud(); resizeCanvas();
        lastFrame = performance.now();
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(frame);
        dom.canvas.focus({ preventScroll: true });
        tone(196, .09, "triangle", .05); setTimeout(() => tone(294, .1, "triangle", .04), 85);
    }

    function createGuard(spawn, index) {
        const route = spawn.route && spawn.route.length ? spawn.route.map(point => ({ ...point })) : [{ x: spawn.x, y: spawn.y }];
        const first = route[0];
        return {
            id: index,
            x: spawn.x, y: spawn.y, angle: Math.atan2(first.y - spawn.y, first.x - spawn.x),
            state: "PATROL", stateTime: 0, route, routeIndex: 0, pauseTime: index * .18,
            path: [], pathIndex: 0, pathTimer: 0,
            target: { ...first }, lastSeen: null, suspicionTarget: null,
            searchPoints: [], searchIndex: 0, searchPause: 0,
            scanBaseAngle: 0, scanDirection: index % 2 ? -1 : 1,
            lostSightTime: 0, stuckTime: 0, repathAttempts: 0,
            previousX: spawn.x, previousY: spawn.y, moveSpeed: 0, stepPhase: index * 1.7,
            visionPulse: index * 1.31
        };
    }

    function frame(now) {
        if (!running) return;
        const dt = Math.min(.033, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        if (!paused && !ended) update(dt);
        draw();
        rafId = requestAnimationFrame(frame);
    }

    function update(dt) {
        elapsed += dt;
        noiseCooldown = Math.max(0, noiseCooldown - dt);
        alertTimer = Math.max(0, alertTimer - dt);
        updatePlayer(dt);
        currentRoom = findRoom(player.x, player.y) || currentRoom;
        camera.targetX = currentRoom.x + currentRoom.w / 2;
        camera.targetY = currentRoom.y + currentRoom.h / 2;
        camera.x += (camera.targetX - camera.x) * Math.min(1, dt * 5.2);
        camera.y += (camera.targetY - camera.y) * Math.min(1, dt * 5.2);
        updateCameras(dt);
        guards.forEach(guard => updateGuard(guard, dt));
        updateInteraction(dt);
        updateHud();
        if (alertTimer <= 0) dom.alert.classList.remove("is-visible");
    }

    function updatePlayer(dt) {
        let x = input.x;
        let y = input.y;
        if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
        if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
        if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
        if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
        const length = Math.hypot(x, y);
        if (length > 1) { x /= length; y /= length; }
        const joystickRun = input.strength > .82;
        player.running = length > .05 && (keys.has("ShiftLeft") || keys.has("ShiftRight") || joystickRun);
        player.speed = length > .05 ? (player.running ? 230 : 154) : 0;
        if (length > .05) {
            player.angle = Math.atan2(y, x);
            moveCircle(player, x * player.speed * dt, y * player.speed * dt, PLAYER_RADIUS);
            player.stepPhase += dt * (player.running ? 14 : 9);
            if (player.running && noiseCooldown <= 0) {
                makeNoise(player.x, player.y, 225);
                noiseCooldown = .32;
            }
        }
    }

    function moveCircle(entity, dx, dy, radius) {
        entity.x += dx;
        getSolidRects().forEach(rect => resolveCircleRect(entity, radius, rect, "x", dx));
        entity.y += dy;
        getSolidRects().forEach(rect => resolveCircleRect(entity, radius, rect, "y", dy));
    }

    function resolveCircleRect(circle, radius, rect, axis, delta) {
        const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
        const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
        if ((circle.x - nearestX) ** 2 + (circle.y - nearestY) ** 2 >= radius ** 2) return;
        if (axis === "x") circle.x = delta > 0 ? rect.x - radius : rect.x + rect.w + radius;
        else circle.y = delta > 0 ? rect.y - radius : rect.y + rect.h + radius;
    }

    function getSolidRects() {
        return solidRects;
    }

    function updateGuard(guard, dt) {
        const beforeX = guard.x;
        const beforeY = guard.y;
        guard.stateTime += dt;
        guard.pathTimer -= dt;
        guard.visionPulse += dt * 2;
        const sees = canSeePlayer(guard);

        if (sees && guard.state !== "CHASE" && guard.state !== "ALERT") {
            setGuardState(guard, "ALERT", { x: player.x, y: player.y });
            spottedCount += 1;
            showAlert("SEI STATO AVVISTATO");
            tone(740, .12, "sawtooth", .06); setTimeout(() => tone(520, .14, "sawtooth", .05), 110);
            alertNearby(guard, player.x, player.y);
        } else if (sees) {
            guard.lastSeen = { x: player.x, y: player.y };
        }

        if (guard.state === "PATROL") updatePatrol(guard, dt);
        else if (guard.state === "SUSPICIOUS") updateSuspicious(guard, dt);
        else if (guard.state === "ALERT") updateAlert(guard);
        else if (guard.state === "CHASE") updateChase(guard, dt, sees);
        else updateSearch(guard, dt);

        const moved = Math.hypot(guard.x - beforeX, guard.y - beforeY);
        guard.moveSpeed = dt > 0 ? moved / dt : 0;
        if (guard.moveSpeed > 4) guard.stepPhase += dt * (guard.state === "CHASE" ? 13 : 8.5);
        const expectsMovement = guard.state !== "ALERT" && guard.path.length > 0 && guard.pathIndex < guard.path.length;
        if (expectsMovement && moved < .18) guard.stuckTime += dt;
        else guard.stuckTime = Math.max(0, guard.stuckTime - dt * 2.5);
        if (guard.stuckTime > .65) recoverGuard(guard);
        guard.previousX = guard.x;
        guard.previousY = guard.y;

        if (distance(guard, player) < GUARD_RADIUS + PLAYER_RADIUS + 2) finishGame(false);
    }

    function updatePatrol(guard, dt) {
        const target = guard.route[guard.routeIndex];
        if (distance(guard, target) < 18) {
            if (guard.pauseTime <= 0) {
                guard.pauseTime = .78 + ((guard.id + guard.routeIndex) % 3) * .2;
                guard.pauseDuration = guard.pauseTime;
                guard.scanBaseAngle = guard.angle;
            }
            guard.pauseTime -= dt;
            const scanProgress = guard.pauseDuration - Math.max(0, guard.pauseTime);
            guard.angle = guard.scanBaseAngle + Math.sin(scanProgress * 3.4) * .56 * guard.scanDirection;
            if (guard.pauseTime <= 0) {
                guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
                setPathTo(guard, guard.route[guard.routeIndex]);
            }
        } else {
            if (!guard.path.length || guard.pathIndex >= guard.path.length) setPathTo(guard, target);
            followPath(guard, 88, dt);
        }
    }

    function updateSuspicious(guard, dt) {
        if (!guard.suspicionTarget) return setGuardState(guard, "SEARCH", { x: guard.x, y: guard.y });
        if (!guard.path.length || guard.pathTimer <= 0) setPathTo(guard, guard.suspicionTarget, .48);
        followPath(guard, 112, dt);
        if (distance(guard, guard.suspicionTarget) < 28 || guard.stateTime > 4.5) setGuardState(guard, "SEARCH", guard.suspicionTarget);
    }

    function updateAlert(guard) {
        if (guard.lastSeen) guard.angle = Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x);
        if (guard.stateTime >= .3) setGuardState(guard, "CHASE", guard.lastSeen || { x: player.x, y: player.y });
    }

    function updateChase(guard, dt, sees) {
        if (sees) {
            guard.lastSeen = { x: player.x, y: player.y };
            guard.lostSightTime = 0;
        } else {
            guard.lostSightTime += dt;
        }
        if (!guard.path.length || guard.pathTimer <= 0) setPathTo(guard, guard.lastSeen || player, .28);
        followPath(guard, 196, dt);
        if (!sees && guard.lostSightTime > 1.65) setGuardState(guard, "SEARCH", guard.lastSeen || { x: guard.x, y: guard.y });
    }

    function updateSearch(guard, dt) {
        const target = guard.searchPoints[guard.searchIndex];
        if (target && distance(guard, target) > 22) {
            if (!guard.path.length || guard.pathTimer <= 0) setPathTo(guard, target, .6);
            followPath(guard, 104, dt);
            guard.searchPause = 0;
        } else if (target) {
            guard.searchPause += dt;
            guard.angle += dt * 1.45 * guard.scanDirection;
            if (guard.searchPause > .72) {
                guard.searchIndex += 1;
                guard.searchPause = 0;
                guard.path = [];
            }
        } else {
            guard.angle += dt * 1.1 * guard.scanDirection;
        }
        if (guard.stateTime > 6.6 || guard.searchIndex >= guard.searchPoints.length) {
            setGuardState(guard, "PATROL", guard.route[guard.routeIndex]);
            setPathTo(guard, guard.route[guard.routeIndex]);
        }
    }

    function setGuardState(guard, state, target) {
        guard.state = state; guard.stateTime = 0; guard.path = []; guard.pathIndex = 0; guard.pathTimer = 0;
        guard.stuckTime = 0;
        if (state === "SUSPICIOUS") guard.suspicionTarget = target ? { ...target } : null;
        if (state === "ALERT" || state === "CHASE" || state === "SEARCH") guard.lastSeen = target ? { ...target } : guard.lastSeen;
        if (state === "CHASE") guard.lostSightTime = 0;
        if (state === "SEARCH") {
            guard.searchPoints = buildSearchPoints(target || guard.lastSeen || guard);
            guard.searchIndex = 0;
            guard.searchPause = 0;
        }
        if (state === "PATROL") {
            guard.lastSeen = null;
            guard.suspicionTarget = null;
            guard.searchPoints = [];
        }
    }

    function buildSearchPoints(origin) {
        const offsets = [[0, 0], [72, 0], [0, 72], [-72, 0], [0, -72], [105, 58], [-105, -58]];
        return offsets
            .map(([x, y]) => ({ x: origin.x + x, y: origin.y + y }))
            .filter(point => isWalkable(point.x, point.y, GUARD_RADIUS + 3));
    }

    function followPath(guard, speed, dt) {
        if (!guard.path.length || guard.pathIndex >= guard.path.length) return;
        let target = guard.path[guard.pathIndex];
        if (distance(guard, target) < 12) {
            guard.pathIndex += 1;
            target = guard.path[guard.pathIndex];
            if (!target) return;
        }
        const angle = Math.atan2(target.y - guard.y, target.x - guard.x);
        guard.angle = rotateToward(guard.angle, angle, dt * (guard.state === "CHASE" ? 7.2 : 5.2));
        moveCircle(guard, Math.cos(angle) * speed * dt, Math.sin(angle) * speed * dt, GUARD_RADIUS);
    }

    function setPathTo(guard, target, interval) {
        guard.path = smoothPath(guard, findPath(guard, target));
        guard.pathIndex = 0;
        guard.pathTimer = interval || (guard.state === "CHASE" ? .28 : .75);
        guard.target = { x: target.x, y: target.y };
    }

    function smoothPath(start, path) {
        if (path.length < 2) return path;
        const smoothed = [];
        let anchor = { x: start.x, y: start.y };
        let index = 0;
        while (index < path.length) {
            let furthest = index;
            for (let candidate = path.length - 1; candidate >= index; candidate -= 1) {
                if (!segmentMovementBlocked(anchor.x, anchor.y, path[candidate].x, path[candidate].y, GUARD_RADIUS + 2)) {
                    furthest = candidate;
                    break;
                }
            }
            smoothed.push(path[furthest]);
            anchor = path[furthest];
            index = furthest + 1;
        }
        return smoothed;
    }

    function recoverGuard(guard) {
        const desired = guard.state === "PATROL" ? guard.route[guard.routeIndex]
            : guard.state === "SUSPICIOUS" ? guard.suspicionTarget
                : guard.state === "SEARCH" ? guard.searchPoints[guard.searchIndex]
                    : guard.lastSeen;
        guard.stuckTime = 0;
        guard.repathAttempts += 1;
        if (!desired) return;
        const candidates = [];
        for (let ring = 0; ring < 2; ring += 1) {
            const radius = ring ? 62 : 38;
            for (let index = 0; index < 8; index += 1) {
                const angle = index / 8 * TAU + guard.id * .19;
                const point = { x: guard.x + Math.cos(angle) * radius, y: guard.y + Math.sin(angle) * radius };
                if (isWalkable(point.x, point.y, GUARD_RADIUS + 4) && !segmentMovementBlocked(guard.x, guard.y, point.x, point.y, GUARD_RADIUS + 2)) candidates.push(point);
            }
        }
        candidates.sort((left, right) => distance(left, desired) - distance(right, desired));
        const escape = candidates[0];
        if (!escape) {
            if (guard.state === "PATROL") guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
            guard.path = [];
            guard.pathTimer = 0;
            return;
        }
        guard.path = [escape].concat(smoothPath(escape, findPath(escape, desired)));
        guard.pathIndex = 0;
        guard.pathTimer = .5;
    }

    function findPath(start, end) {
        if (!segmentMovementBlocked(start.x, start.y, end.x, end.y, GUARD_RADIUS + 2)) return [{ x: end.x, y: end.y }];
        const bounds = activeMap.bounds;
        const cols = Math.ceil(bounds.w / GRID);
        const rows = Math.ceil(bounds.h / GRID);
        const toCell = point => ({ c: clamp(Math.floor((point.x - bounds.x) / GRID), 0, cols - 1), r: clamp(Math.floor((point.y - bounds.y) / GRID), 0, rows - 1) });
        const fromCell = cell => ({ x: bounds.x + cell.c * GRID + GRID / 2, y: bounds.y + cell.r * GRID + GRID / 2 });
        const rawStartCell = toCell(start);
        const rawEndCell = toCell(end);
        const nearestReachableCell = (origin, point) => {
            for (let radius = 0; radius <= 5; radius += 1) {
                const candidates = [];
                for (let dc = -radius; dc <= radius; dc += 1) {
                    for (let dr = -radius; dr <= radius; dr += 1) {
                        if (Math.max(Math.abs(dc), Math.abs(dr)) !== radius) continue;
                        const candidate = { c: origin.c + dc, r: origin.r + dr };
                        if (candidate.c < 0 || candidate.r < 0 || candidate.c >= cols || candidate.r >= rows) continue;
                        const worldPoint = fromCell(candidate);
                        if (isWalkable(worldPoint.x, worldPoint.y, GUARD_RADIUS + 3)
                            && !segmentMovementBlocked(point.x, point.y, worldPoint.x, worldPoint.y, GUARD_RADIUS + 2)) candidates.push(candidate);
                    }
                }
                if (candidates.length) {
                    candidates.sort((left, right) => heuristic(left, origin) - heuristic(right, origin));
                    return candidates[0];
                }
            }
            return null;
        };
        const startCell = nearestReachableCell(rawStartCell, start);
        const endCell = nearestReachableCell(rawEndCell, end);
        if (!startCell || !endCell) return [];
        const adjustedStart = startCell.c !== rawStartCell.c || startCell.r !== rawStartCell.r;
        const key = cell => `${cell.c},${cell.r}`;
        const open = [];
        heapPush(open, { cell: startCell, score: heuristic(startCell, endCell) });
        const came = new Map();
        const g = new Map([[key(startCell), 0]]);
        const closed = new Set();
        const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        let iterations = 0;
        const iterationLimit = Math.max(3500, Math.ceil(cols * rows * 1.25));
        while (open.length && iterations++ < iterationLimit) {
            const current = heapPop(open).cell;
            const currentKey = key(current);
            if (closed.has(currentKey)) continue;
            if (current.c === endCell.c && current.r === endCell.r) {
                const path = [{ ...current }];
                let cursor = currentKey;
                while (came.has(cursor)) { const previous = came.get(cursor); path.push(previous); cursor = key(previous); }
                path.reverse();
                return path.slice(adjustedStart ? 0 : 1).map(fromCell).concat([{ x: end.x, y: end.y }]);
            }
            closed.add(currentKey);
            dirs.forEach(([dc, dr]) => {
                const next = { c: current.c + dc, r: current.r + dr };
                if (next.c < 0 || next.r < 0 || next.c >= cols || next.r >= rows || closed.has(key(next))) return;
                const worldPoint = fromCell(next);
                if (!isWalkable(worldPoint.x, worldPoint.y, GUARD_RADIUS + 3)) return;
                if (dc && dr) {
                    const sideA = fromCell({ c: current.c + dc, r: current.r });
                    const sideB = fromCell({ c: current.c, r: current.r + dr });
                    if (!isWalkable(sideA.x, sideA.y, GUARD_RADIUS + 3) || !isWalkable(sideB.x, sideB.y, GUARD_RADIUS + 3)) return;
                }
                const tentative = (g.get(currentKey) || 0) + (dc && dr ? 1.414 : 1);
                if (tentative < (g.get(key(next)) ?? Infinity)) {
                    came.set(key(next), current);
                    g.set(key(next), tentative);
                    heapPush(open, { cell: next, score: tentative + heuristic(next, endCell) });
                }
            });
        }
        return [];
    }

    function heuristic(a, b) { return Math.hypot(a.c - b.c, a.r - b.r); }

    function heapPush(heap, item) {
        heap.push(item);
        let index = heap.length - 1;
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (heap[parent].score <= item.score) break;
            heap[index] = heap[parent];
            index = parent;
        }
        heap[index] = item;
    }

    function heapPop(heap) {
        const first = heap[0];
        const last = heap.pop();
        if (!heap.length) return first;
        let index = 0;
        while (true) {
            const left = index * 2 + 1;
            const right = left + 1;
            if (left >= heap.length) break;
            const child = right < heap.length && heap[right].score < heap[left].score ? right : left;
            if (heap[child].score >= last.score) break;
            heap[index] = heap[child];
            index = child;
        }
        heap[index] = last;
        return first;
    }

    function isWalkable(x, y, radius) {
        if (!findRoom(x, y)) return false;
        return !getSolidRects().some(rect => circleHitsRect(x, y, radius, rect));
    }

    function canSeePlayer(guard) {
        const dx = player.x - guard.x;
        const dy = player.y - guard.y;
        const length = Math.hypot(dx, dy);
        const range = guard.state === "CHASE" || guard.state === "ALERT" ? 330 : 285;
        if (length > range) return false;
        const angle = Math.atan2(dy, dx);
        const cone = guard.state === "CHASE" || guard.state === "ALERT" ? .62 : .48;
        if (Math.abs(angleDifference(guard.angle, angle)) > cone) return false;
        return !segmentBlocked(guard.x, guard.y, player.x, player.y, 1);
    }

    function makeNoise(x, y, radius) {
        guards.forEach(guard => {
            if (guard.state === "CHASE" || distance(guard, { x, y }) > radius || segmentBlocked(guard.x, guard.y, x, y, 4)) return;
            setGuardState(guard, "SUSPICIOUS", { x, y });
        });
    }

    function alertNearby(source, x, y) {
        guards.forEach(guard => {
            if (guard === source || guard.state === "CHASE" || distance(source, guard) > 320) return;
            setGuardState(guard, "SUSPICIOUS", { x, y });
        });
    }

    function updateCameras(dt) {
        cameras.forEach(securityCamera => {
            securityCamera.cooldown = Math.max(0, securityCamera.cooldown - dt);
            securityCamera.alertTime = Math.max(0, securityCamera.alertTime - dt);
            securityCamera.angle = securityCamera.baseAngle
                + Math.sin(elapsed * securityCamera.sweepSpeed + securityCamera.phase) * securityCamera.sweep;
            const seesPlayer = sensorCanSeePlayer(securityCamera);
            if (seesPlayer && !securityCamera.wasSeeing && securityCamera.cooldown <= 0) triggerCameraAlarm(securityCamera);
            securityCamera.wasSeeing = seesPlayer;
        });
    }

    function sensorCanSeePlayer(sensor) {
        const dx = player.x - sensor.x;
        const dy = player.y - sensor.y;
        const length = Math.hypot(dx, dy);
        if (length > sensor.range) return false;
        const angle = Math.atan2(dy, dx);
        if (Math.abs(angleDifference(sensor.angle, angle)) > sensor.halfAngle) return false;
        return !segmentBlocked(sensor.x, sensor.y, player.x, player.y, 1);
    }

    function triggerCameraAlarm(securityCamera) {
        securityCamera.alertTime = 1.7;
        securityCamera.cooldown = 5;
        spottedCount += 1;
        showAlert("ALLARME TELECAMERA");
        tone(920, .08, "square", .045); setTimeout(() => tone(720, .1, "square", .04), 100);
        guards
            .slice()
            .sort((left, right) => distance(left, player) - distance(right, player))
            .slice(0, 2)
            .forEach(guard => setGuardState(guard, "ALERT", { x: player.x, y: player.y }));
    }

    function updateInteraction(dt) {
        const nearby = safes.find(safe => !safe.opened && distance(player, safe) < 62);
        const atExit = distance(player, activeMap.exit) < activeMap.exit.radius + 10;
        if (nearby) {
            dom.prompt.textContent = input.interact ? "Continua a tenere premuto" : "E / INTERAGISCI — Apri cassaforte";
            dom.prompt.classList.add("is-visible");
            if (input.interact) {
                if (interactionSafe !== nearby) { interactionSafe = nearby; interactionTime = 0; makeNoise(nearby.x, nearby.y, 300); }
                interactionTime += dt;
                dom.safeProgress.hidden = false;
                dom.safeProgressBar.style.width = `${clamp(interactionTime / SAFE_TIME * 100, 0, 100)}%`;
                if (interactionTime >= SAFE_TIME) openSafe(nearby);
            } else resetInteraction();
        } else if (atExit) {
            resetInteraction();
            dom.prompt.textContent = openedCount ? "E / INTERAGISCI — Fuggi con il bottino" : "Apri almeno una cassaforte prima di uscire";
            dom.prompt.classList.add("is-visible");
            if (openedCount && input.interact) { input.interact = false; finishGame(true); }
        } else {
            resetInteraction();
            dom.prompt.classList.remove("is-visible");
        }
    }

    function resetInteraction() {
        interactionSafe = null; interactionTime = 0; dom.safeProgress.hidden = true; dom.safeProgressBar.style.width = "0%";
    }

    function openSafe(safe) {
        safe.opened = true;
        openedCount += 1;
        const amount = Math.round((safe.value[0] + Math.random() * (safe.value[1] - safe.value[0])) / 50) * 50;
        loot += amount;
        input.interact = false;
        resetInteraction();
        showAlert(`BOTTINO +${formatMoney(amount)}`, true);
        tone(480, .07, "triangle", .045); setTimeout(() => tone(660, .1, "triangle", .04), 70);
    }

    function finishGame(won) {
        if (ended) return;
        ended = true; paused = false; input.interact = false; resetInteraction();
        const policeMultiplier = 1 + Math.max(0, selectedPolice - activeMap.minPolice) * .2;
        const score = won ? Math.max(0, Math.round((loot + openedCount * 700 - elapsed * 9 - spottedCount * 900) * policeMultiplier)) : 0;
        dom.resultDialog.classList.toggle("is-loss", !won);
        dom.resultKicker.textContent = won && spottedCount === 0 ? "PERFECT HEIST" : won ? "COLPO RIUSCITO" : "COLPO FALLITO";
        dom.resultTitle.textContent = won ? "Sei riuscito a scappare" : "Sei stato catturato";
        dom.resultMessage.textContent = won ? (spottedCount === 0 ? "Nessun avvistamento. Pulito, silenzioso, perfetto." : "Hai il bottino. La prossima volta lascia meno tracce.") : "Studia le pattuglie, cammina piano e usa i mobili come copertura.";
        dom.resultLoot.textContent = formatMoney(loot);
        dom.resultTime.textContent = formatTime(elapsed);
        dom.resultSpotted.textContent = String(spottedCount);
        dom.resultSafes.textContent = `${openedCount} / ${safes.length}`;
        dom.resultPolice.textContent = String(selectedPolice);
        dom.resultScore.textContent = formatNumber(score);
        if (won) {
            progress.wins += 1;
            if (spottedCount === 0) progress.perfects += 1;
            progress.bestScore = Math.max(progress.bestScore, score);
            progress.bestLoot = Math.max(progress.bestLoot, loot);
            progress.bestTime = progress.bestTime === null ? elapsed : Math.min(progress.bestTime, elapsed);
            saveProgress();
            tone(330, .12, "triangle", .05); setTimeout(() => tone(440, .12, "triangle", .05), 130); setTimeout(() => tone(660, .18, "triangle", .05), 260);
        } else {
            tone(180, .3, "sawtooth", .055);
        }
        setTimeout(() => { if (ended) dom.resultOverlay.hidden = false; }, 360);
    }

    function pauseGame() {
        if (!running || ended || paused) return;
        paused = true; input.interact = false; dom.pauseOverlay.hidden = false;
    }

    function resumeGame() {
        if (!running || ended) return;
        paused = false; dom.pauseOverlay.hidden = true; lastFrame = performance.now(); dom.canvas.focus({ preventScroll: true });
    }

    function returnToMenu() {
        running = false; paused = false; ended = false; cancelAnimationFrame(rafId); keys.clear(); input.interact = false;
        hideOverlays(); dom.game.hidden = true; dom.menu.hidden = false; document.body.classList.remove("heist-is-playing");
        resizeCanvas(); drawMenuBackdrop();
    }

    function hideOverlays() { dom.pauseOverlay.hidden = true; dom.resultOverlay.hidden = true; }

    function updateHud() {
        dom.roomName.textContent = currentRoom ? currentRoom.name.toUpperCase() : "EDIFICIO";
        dom.loot.textContent = formatMoney(loot);
        dom.safes.textContent = `${openedCount} / ${safes.length}`;
        dom.timer.textContent = formatTime(elapsed);
        dom.objective.textContent = openedCount === 0 ? "Apri almeno una cassaforte" : openedCount === safes.length ? "Torna all'uscita" : "Continua il colpo o torna all'uscita";
    }

    function showAlert(message, positive) {
        dom.alert.textContent = message; dom.alert.classList.add("is-visible"); dom.alert.style.borderColor = positive ? "rgba(57,215,208,.6)" : ""; dom.alert.style.background = positive ? "rgba(12,78,78,.92)" : ""; alertTimer = 1.6;
        if (!positive) { dom.alert.style.borderColor = ""; dom.alert.style.background = ""; }
    }

    function resizeCanvas() {
        const rect = dom.stage && !dom.game.hidden ? dom.stage.getBoundingClientRect() : dom.canvas.getBoundingClientRect();
        view.width = Math.max(320, Math.round(rect.width || innerWidth));
        view.height = Math.max(240, Math.round(rect.height || innerHeight));
        view.dpr = Math.min(2, window.devicePixelRatio || 1);
        dom.canvas.width = Math.round(view.width * view.dpr);
        dom.canvas.height = Math.round(view.height * view.dpr);
        dom.canvas.style.width = `${view.width}px`;
        dom.canvas.style.height = `${view.height}px`;
        camera.zoom = Math.min(view.width / 900, view.height / 570);
        if (!running) drawMenuBackdrop();
    }

    function drawMenuBackdrop() {
        ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        ctx.fillStyle = "#06101a"; ctx.fillRect(0, 0, view.width, view.height);
    }

    function draw() {
        ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        ctx.fillStyle = "#02070c"; ctx.fillRect(0, 0, view.width, view.height);
        ctx.save();
        ctx.translate(view.width / 2, view.height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);
        drawRooms();
        drawExit();
        drawFurniture();
        drawSafes();
        cameras.forEach(securityCamera => { if (isInCurrentRoom(securityCamera) && isPointVisible(securityCamera, 380)) drawCameraCone(securityCamera); });
        guards.forEach(guard => { if (isInCurrentRoom(guard) && isPointVisible(guard, 350)) drawFlashlight(guard); });
        cameras.forEach(securityCamera => { if (isInCurrentRoom(securityCamera) && isPointVisible(securityCamera, 50)) drawSecurityCamera(securityCamera); });
        guards.forEach(guard => { if (isInCurrentRoom(guard) && isPointVisible(guard, 50)) drawGuard(guard); });
        drawPlayer();
        drawRoomDarkness();
        ctx.restore();
        drawVignette();
    }

    function drawRooms() {
        activeMap.rooms.forEach(room => {
            if (!isRectVisible(room, 80)) return;
            ctx.fillStyle = room.accent; ctx.fillRect(room.x, room.y, room.w, room.h);
            if (currentRoom && room.id === currentRoom.id) {
                drawFloorPattern(room);
                ctx.fillStyle = "rgba(215,232,236,.12)"; ctx.font = "900 13px sans-serif"; ctx.textAlign = "left";
                ctx.fillText(room.name.toUpperCase(), room.x + 28, room.y + 35);
            }
        });
        activeMap.walls.forEach(wall => {
            if (!isRectVisible(wall, 30)) return;
            ctx.fillStyle = "#08131c"; ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            ctx.strokeStyle = "#29404c"; ctx.lineWidth = 2; ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
        });
        activeMap.doors.forEach(door => {
            if (!isRectVisible(door, 30)) return;
            ctx.fillStyle = "rgba(57,215,208,.16)"; ctx.fillRect(door.x, door.y, door.w, door.h);
            ctx.strokeStyle = "rgba(111,239,231,.55)"; ctx.lineWidth = 2; ctx.strokeRect(door.x, door.y, door.w, door.h);
        });
    }

    function drawFloorPattern(room) {
        const name = `${room.id} ${room.name}`.toLowerCase();
        ctx.save();
        ctx.beginPath(); ctx.rect(room.x, room.y, room.w, room.h); ctx.clip();
        ctx.lineWidth = 1;
        if (/vault|caveau|server|security|control|sicurezza/.test(name)) {
            ctx.strokeStyle = "rgba(157,195,205,.1)";
            for (let x = room.x + 32; x < room.x + room.w; x += 64) {
                for (let y = room.y + 32; y < room.y + room.h; y += 64) ctx.strokeRect(x, y, 58, 58);
            }
        } else if (/archive|records|deposito|magazzino|storage/.test(name)) {
            ctx.strokeStyle = "rgba(202,187,154,.08)";
            for (let y = room.y + 42; y < room.y + room.h; y += 42) {
                ctx.beginPath(); ctx.moveTo(room.x, y); ctx.lineTo(room.x + room.w, y); ctx.stroke();
            }
        } else if (/lab|laboratorio/.test(name)) {
            ctx.strokeStyle = "rgba(155,218,217,.09)";
            for (let x = room.x + 34; x < room.x + room.w; x += 34) {
                ctx.beginPath(); ctx.moveTo(x, room.y); ctx.lineTo(x, room.y + room.h); ctx.stroke();
            }
            for (let y = room.y + 34; y < room.y + room.h; y += 34) {
                ctx.beginPath(); ctx.moveTo(room.x, y); ctx.lineTo(room.x + room.w, y); ctx.stroke();
            }
        } else {
            ctx.fillStyle = "rgba(8,17,24,.08)";
            for (let column = 0, x = room.x; x < room.x + room.w; column += 1, x += 48) {
                for (let row = 0, y = room.y; y < room.y + room.h; row += 1, y += 48) if ((column + row) % 2 === 0) ctx.fillRect(x, y, 48, 48);
            }
        }
        ctx.restore();
    }

    function drawExit() {
        const exit = activeMap.exit;
        if (!isPointVisible(exit, exit.radius + 20)) return;
        const pulse = 1 + Math.sin(elapsed * 3) * .08;
        ctx.save(); ctx.translate(exit.x, exit.y); ctx.scale(pulse, pulse);
        ctx.strokeStyle = openedCount ? "#39d7d0" : "#607581"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, exit.radius, 0, TAU); ctx.stroke();
        ctx.fillStyle = openedCount ? "rgba(57,215,208,.14)" : "rgba(70,87,96,.14)"; ctx.fill();
        ctx.fillStyle = openedCount ? "#9ffff7" : "#8a9ba4"; ctx.font = "900 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText("USCITA", 0, 4);
        ctx.restore();
    }

    function drawFurniture() {
        activeMap.furniture.forEach(item => { if (!item.solid && item.roomId === currentRoom.id && isRectVisible(item, 24)) drawFurnitureItem(item); });
        activeMap.furniture.forEach(item => { if (item.solid && item.roomId === currentRoom.id && isRectVisible(item, 24)) drawFurnitureItem(item); });
    }

    function drawFurnitureItem(item) {
        const { x, y, w, h, type } = item;
        if (!item.solid) {
            drawFloorDetail(item);
            return;
        }
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.32)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
        const colors = {
            desk: "#655241", "lab-table": "#42606a", table: "#5a4d41", counter: "#5a4d42", sofa: "#365561", bench: "#3c555d",
            shelf: "#4d423a", cabinet: "#384c58", filing: "#3d5059", console: "#173e4d", divider: "#40535c",
            plant: "#315b49", crate: "#665139", "archive-box": "#735d3f", locker: "#3b505b", server: "#153e4b",
            chair: "#344854", stool: "#3c535c", pallet: "#67533a", trolley: "#485c64", "deposit-box": "#536269",
            "chemical-cabinet": "#38515a"
        };
        ctx.fillStyle = colors[type] || "#42525a"; roundRect(ctx, x, y, w, h, Math.min(8, w / 4, h / 4)); ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(221,237,239,.16)"; ctx.lineWidth = 2; ctx.stroke();

        if (["desk", "lab-table", "table", "counter"].includes(type)) {
            ctx.fillStyle = "rgba(238,224,193,.09)"; roundRect(ctx, x + 5, y + 5, w - 10, Math.max(8, h * .22), 3); ctx.fill();
            ctx.fillStyle = "rgba(5,12,17,.42)"; ctx.fillRect(x + 8, y + h - 9, w - 16, 4);
        }
        if (type === "lab-table") {
            for (let index = 0; index < 3; index += 1) {
                ctx.fillStyle = index === 1 ? "#7ed6c8" : "#b7d9dc"; ctx.beginPath(); ctx.arc(x + w * (.32 + index * .18), y + h * .48, 5, 0, TAU); ctx.fill();
            }
        }
        if (["sofa", "bench"].includes(type)) {
            ctx.strokeStyle = "rgba(4,13,18,.38)"; ctx.lineWidth = 2;
            const count = Math.max(1, Math.round(w / 58));
            for (let index = 1; index < count; index += 1) { const lineX = x + w / count * index; ctx.beginPath(); ctx.moveTo(lineX, y + 7); ctx.lineTo(lineX, y + h - 7); ctx.stroke(); }
        }
        if (["shelf", "filing", "locker", "server", "deposit-box", "chemical-cabinet"].includes(type)) {
            ctx.strokeStyle = "rgba(2,8,12,.45)"; ctx.lineWidth = 2;
            for (let lineY = y + 15; lineY < y + h; lineY += 18) { ctx.beginPath(); ctx.moveTo(x + 7, lineY); ctx.lineTo(x + w - 7, lineY); ctx.stroke(); }
        }
        if (["server", "console"].includes(type)) {
            for (let lineY = y + 12; lineY < y + h - 5; lineY += 16) {
                ctx.fillStyle = (Math.round(lineY) + item.x) % 3 ? "#39d7d0" : "#f3c34f";
                ctx.fillRect(x + w - 12, lineY, 4, 4);
            }
        }
        if (["crate", "archive-box", "pallet"].includes(type)) {
            ctx.strokeStyle = "rgba(25,17,10,.42)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 7, y + 7); ctx.lineTo(x + w - 7, y + h - 7); ctx.moveTo(x + w - 7, y + 7); ctx.lineTo(x + 7, y + h - 7); ctx.stroke();
        }
        if (["chair", "stool"].includes(type)) {
            ctx.fillStyle = "rgba(7,17,23,.38)"; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * .27, 0, TAU); ctx.fill();
        }
        if (type === "plant") {
            ctx.fillStyle = "#203c32"; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * .34, 0, TAU); ctx.fill();
            ctx.strokeStyle = "#68a376"; ctx.lineWidth = 4;
            for (let index = 0; index < 6; index += 1) { const angle = index / 6 * TAU; ctx.beginPath(); ctx.moveTo(x + w / 2, y + h / 2); ctx.lineTo(x + w / 2 + Math.cos(angle) * w * .32, y + h / 2 + Math.sin(angle) * h * .32); ctx.stroke(); }
        }
        if (type === "trolley") {
            ctx.fillStyle = "#182930"; ctx.beginPath(); ctx.arc(x + 8, y + h, 5, 0, TAU); ctx.arc(x + w - 8, y + h, 5, 0, TAU); ctx.fill();
        }
        ctx.restore();
    }

    function drawFloorDetail(item) {
        const { x, y, w, h, type } = item;
        ctx.save();
        if (["rug", "carpet", "vault-floor", "records-floor", "lab-floor", "server-floor", "loading-floor", "hall-floor"].includes(type)) {
            const palette = /vault/.test(type) ? ["rgba(189,166,95,.08)", "rgba(236,215,143,.08)"]
                : /lab|server/.test(type) ? ["rgba(75,184,185,.06)", "rgba(126,219,218,.06)"]
                    : ["rgba(104,136,145,.08)", "rgba(181,204,207,.05)"];
            ctx.fillStyle = palette[0]; roundRect(ctx, x, y, w, h, 12); ctx.fill();
            ctx.strokeStyle = palette[1]; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = palette[1]; ctx.lineWidth = 1;
            for (let lineX = x + 22; lineX < x + w; lineX += 32) { ctx.beginPath(); ctx.moveTo(lineX, y + 8); ctx.lineTo(lineX, y + h - 8); ctx.stroke(); }
        } else if (["warning-line", "floor-mark", "cable-run", "direction-sign"].includes(type)) {
            ctx.strokeStyle = type === "warning-line" ? "rgba(243,195,79,.48)" : type === "cable-run" ? "rgba(70,188,194,.3)" : "rgba(198,216,219,.2)";
            ctx.lineWidth = Math.max(3, Math.min(w, h)); ctx.setLineDash(type === "warning-line" ? [13, 9] : [22, 10]);
            ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke(); ctx.setLineDash([]);
        } else if (["papers", "documents"].includes(type)) {
            ctx.fillStyle = "rgba(222,226,211,.72)"; ctx.fillRect(x + 2, y + 3, w * .62, h * .72); ctx.fillStyle = "rgba(183,202,196,.62)"; ctx.fillRect(x + w * .28, y + h * .18, w * .62, h * .72);
            ctx.strokeStyle = "rgba(42,68,72,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w * .38, y + h * .42); ctx.lineTo(x + w * .75, y + h * .42); ctx.stroke();
        } else if (["monitor", "screens", "terminal", "lab-glass"].includes(type)) {
            ctx.fillStyle = "rgba(6,17,22,.85)"; roundRect(ctx, x, y, w, h, 4); ctx.fill();
            ctx.strokeStyle = "rgba(75,223,215,.68)"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "rgba(57,215,208,.2)"; ctx.fillRect(x + 5, y + 5, Math.max(4, w - 10), Math.max(3, h - 10));
        }
        ctx.restore();
    }

    function drawSafes() {
        safes.forEach(safe => {
            if (safe.roomId !== currentRoom.id || !isPointVisible(safe, 40)) return;
            ctx.save(); ctx.translate(safe.x, safe.y);
            ctx.fillStyle = safe.opened ? "#27343a" : "#59666b"; roundRect(ctx, -23, -23, 46, 46, 7); ctx.fill();
            ctx.strokeStyle = safe.opened ? "#405158" : "#9aabb0"; ctx.lineWidth = 3; ctx.stroke();
            ctx.strokeStyle = safe.opened ? "#425158" : "#f3c34f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(2, 0, 9, 0, TAU); ctx.stroke();
            ctx.fillStyle = safe.opened ? "#20292e" : "#d9ad42"; ctx.fillRect(-15, -17, 5, 34);
            if (!safe.opened) { ctx.shadowColor = "#f3c34f"; ctx.shadowBlur = 12; ctx.fillStyle = "rgba(243,195,79,.35)"; ctx.beginPath(); ctx.arc(0, 0, 28 + Math.sin(elapsed * 3) * 2, 0, TAU); ctx.stroke(); }
            ctx.restore();
        });
    }

    function drawFlashlight(guard) {
        const range = guard.state === "CHASE" || guard.state === "ALERT" ? 330 : 285;
        const half = guard.state === "CHASE" || guard.state === "ALERT" ? .62 : .48;
        const rays = 18;
        ctx.save();
        const gradient = ctx.createRadialGradient(guard.x, guard.y, 15, guard.x, guard.y, range);
        gradient.addColorStop(0, guard.state === "CHASE" || guard.state === "ALERT" ? "rgba(255,104,78,.42)" : "rgba(255,241,166,.42)");
        gradient.addColorStop(.72, guard.state === "CHASE" || guard.state === "ALERT" ? "rgba(255,82,72,.13)" : "rgba(255,235,143,.14)");
        gradient.addColorStop(1, "rgba(255,235,143,0)");
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(guard.x, guard.y);
        for (let i = 0; i <= rays; i += 1) {
            const angle = guard.angle - half + i / rays * half * 2;
            const hit = castRay(guard.x, guard.y, angle, range);
            ctx.lineTo(hit.x, hit.y);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function drawCameraCone(securityCamera) {
        const rays = view.width < 700 ? 14 : 18;
        ctx.save();
        const gradient = ctx.createRadialGradient(securityCamera.x, securityCamera.y, 12, securityCamera.x, securityCamera.y, securityCamera.range);
        gradient.addColorStop(0, "rgba(255,63,72,.38)");
        gradient.addColorStop(.7, "rgba(255,43,57,.15)");
        gradient.addColorStop(1, "rgba(255,43,57,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.moveTo(securityCamera.x, securityCamera.y);
        for (let index = 0; index <= rays; index += 1) {
            const angle = securityCamera.angle - securityCamera.halfAngle + index / rays * securityCamera.halfAngle * 2;
            const hit = castRay(securityCamera.x, securityCamera.y, angle, securityCamera.range);
            ctx.lineTo(hit.x, hit.y);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function drawSecurityCamera(securityCamera) {
        const pulse = securityCamera.alertTime > 0 ? 1 + Math.sin(elapsed * 18) * .12 : 1;
        const spriteScale = clamp(1 / camera.zoom, 1, 1.5);
        ctx.save(); ctx.translate(securityCamera.x, securityCamera.y); ctx.rotate(securityCamera.angle); ctx.scale(spriteScale * pulse, spriteScale * pulse);
        ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(-4, 5, 17, 10, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#697a83"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-7, 0); ctx.stroke();
        ctx.fillStyle = "#263740"; roundRect(ctx, -8, -8, 24, 16, 5); ctx.fill();
        ctx.strokeStyle = securityCamera.alertTime > 0 ? "#ff4b55" : "#8498a1"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = "#0a1116"; ctx.beginPath(); ctx.arc(14, 0, 6, 0, TAU); ctx.fill();
        ctx.fillStyle = securityCamera.alertTime > 0 ? "#ff4b55" : "#d62838"; ctx.beginPath(); ctx.arc(15, 0, 2.5, 0, TAU); ctx.fill();
        ctx.restore();
    }

    function castRay(x, y, angle, range) {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let hitDistance = range;
        getSightRects().forEach(rect => {
            if (rect.x > x + range || rect.x + rect.w < x - range || rect.y > y + range || rect.y + rect.h < y - range) return;
            const candidate = rayRectDistance(x, y, dx, dy, rect, range);
            if (candidate !== null && candidate < hitDistance) hitDistance = candidate;
        });
        return { x: x + dx * hitDistance, y: y + dy * hitDistance };
    }

    function rayRectDistance(x, y, dx, dy, rect, maxDistance) {
        let near = 0;
        let far = maxDistance;
        const axes = [[x, dx, rect.x, rect.x + rect.w], [y, dy, rect.y, rect.y + rect.h]];
        for (const [origin, direction, min, max] of axes) {
            if (Math.abs(direction) < .00001) {
                if (origin < min || origin > max) return null;
                continue;
            }
            let first = (min - origin) / direction;
            let second = (max - origin) / direction;
            if (first > second) [first, second] = [second, first];
            near = Math.max(near, first);
            far = Math.min(far, second);
            if (near > far) return null;
        }
        return near >= 0 && near <= maxDistance ? near : null;
    }

    function drawGuard(guard) {
        const moving = guard.moveSpeed > 5;
        const swing = moving ? Math.sin(guard.stepPhase) * (guard.state === "CHASE" ? 6 : 4) : 0;
        const bob = moving ? Math.abs(Math.cos(guard.stepPhase)) * 1.2 : 0;
        const alerting = guard.state === "CHASE" || guard.state === "ALERT";
        const spriteScale = clamp(1 / camera.zoom, 1, 1.65);
        ctx.save(); ctx.translate(guard.x, guard.y); ctx.rotate(guard.angle); ctx.scale(spriteScale, spriteScale);
        ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(-2, 5, 22, 13, 0, 0, TAU); ctx.fill();

        ctx.lineCap = "round";
        drawLimb(-7 + swing, -6, -19, -7, 7, "#101d29");
        drawLimb(-7 - swing, 6, -19, 7, 7, "#101d29");
        drawLimb(-1 - swing, -11, 10, -14, 7, "#214e70");
        drawLimb(-1 + swing, 11, 8, 14, 7, "#214e70");

        ctx.translate(0, -bob);
        ctx.fillStyle = "#173b57"; roundRect(ctx, -10, -12, 22, 24, 7); ctx.fill();
        ctx.strokeStyle = alerting ? "#ff5e62" : "#65a8d4"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = "#0c1b27"; ctx.fillRect(-9, -2, 20, 5);
        ctx.fillStyle = "#e8bd55"; ctx.beginPath(); ctx.arc(3, -7, 2.6, 0, TAU); ctx.fill();
        ctx.fillStyle = "#d7b195"; ctx.beginPath(); ctx.arc(12, 0, 8.5, 0, TAU); ctx.fill();
        ctx.fillStyle = "#173b57"; ctx.beginPath(); ctx.arc(11, 0, 9, Math.PI * .55, Math.PI * 1.45); ctx.fill();
        ctx.strokeStyle = "#70a8ca"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(18, -6); ctx.stroke();

        ctx.fillStyle = "#e1c39d"; ctx.beginPath(); ctx.arc(10, -14, 4, 0, TAU); ctx.fill();
        ctx.fillStyle = "#27343b"; roundRect(ctx, 11, -17, 13, 7, 3); ctx.fill();
        ctx.fillStyle = "#f6e8a9"; ctx.fillRect(22, -15, 5, 3);
        ctx.restore();
        if (guard.state !== "PATROL") {
            const label = guard.state === "CHASE" || guard.state === "ALERT" ? "!" : "?";
            ctx.fillStyle = guard.state === "CHASE" || guard.state === "ALERT" ? "#ff5e62" : "#f3c34f"; ctx.font = "950 25px sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, guard.x, guard.y - 27 - Math.sin(elapsed * 5 + guard.id) * 2);
        }
    }

    function drawPlayer() {
        const moving = player.speed > 5;
        const swing = moving ? Math.sin(player.stepPhase) * (player.running ? 7 : 4.5) : 0;
        const bob = moving ? Math.abs(Math.cos(player.stepPhase)) * (player.running ? 1.8 : 1.1) : 0;
        const spriteScale = clamp(1 / camera.zoom, 1, 1.65);
        ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle); ctx.scale(spriteScale, spriteScale);
        if (player.running) { ctx.fillStyle = "rgba(57,215,208,.12)"; ctx.beginPath(); ctx.arc(-2, 0, 27 + Math.sin(player.stepPhase * 2) * 2, 0, TAU); ctx.fill(); }
        ctx.fillStyle = "rgba(0,0,0,.34)"; ctx.beginPath(); ctx.ellipse(-3, 5, 22, 13, 0, 0, TAU); ctx.fill();
        ctx.lineCap = "round";

        drawLimb(-7 + swing, -6, -20, -7, 7, "#080d12");
        drawLimb(-7 - swing, 6, -20, 7, 7, "#080d12");
        drawLimb(-1 - swing, -11, 10, -14, 7, "#141e26");
        drawLimb(-1 + swing, 11, 10, 14, 7, "#141e26");

        ctx.translate(0, -bob);
        ctx.fillStyle = "#755535"; roundRect(ctx, -17, -10, 9, 20, 4); ctx.fill();
        ctx.strokeStyle = "#9d7648"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "#101820"; roundRect(ctx, -10, -12, 23, 24, 8); ctx.fill();
        ctx.strokeStyle = "#39d7d0"; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.fillStyle = "#26353c"; ctx.fillRect(-8, -3, 19, 5);

        ctx.fillStyle = "#11191f"; ctx.beginPath(); ctx.arc(12, 0, 10, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#32434a"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#d5d8d2"; ctx.beginPath(); ctx.arc(14, 0, 7, 0, TAU); ctx.fill();
        ctx.fillStyle = "#11191f"; roundRect(ctx, 10, -7, 8, 14, 3); ctx.fill();
        ctx.fillStyle = "#a7fff5"; ctx.beginPath(); ctx.arc(17, -3.5, 1.4, 0, TAU); ctx.arc(17, 3.5, 1.4, 0, TAU); ctx.fill();
        ctx.restore();
    }

    function drawLimb(fromX, fromY, toX, toY, width, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
    }

    function drawRoomDarkness() {
        activeMap.rooms.forEach(room => {
            if (!isRectVisible(room, 80)) return;
            if (currentRoom && room.id === currentRoom.id) return;
            ctx.fillStyle = "rgba(1,5,9,.82)"; ctx.fillRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);
        });
        ctx.save();
        const glow = ctx.createRadialGradient(player.x, player.y, 25, player.x, player.y, 135);
        glow.addColorStop(0, "rgba(190,230,224,.07)"); glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(player.x, player.y, 135, 0, TAU); ctx.fill(); ctx.restore();
    }

    function drawVignette() {
        const gradient = ctx.createRadialGradient(view.width / 2, view.height / 2, Math.min(view.width, view.height) * .28, view.width / 2, view.height / 2, Math.max(view.width, view.height) * .72);
        gradient.addColorStop(0, "rgba(0,0,0,0)"); gradient.addColorStop(1, "rgba(0,0,0,.62)");
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, view.width, view.height);
    }

    function findRoom(x, y) {
        return activeMap && activeMap.rooms.find(room => x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h);
    }

    function pointBlocked(x, y) {
        return getSightRects().some(rect => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
    }

    function getSightRects() { return sightRects; }

    function isRectVisible(rect, margin = 0) {
        const halfWidth = view.width / Math.max(.01, camera.zoom) / 2 + margin;
        const halfHeight = view.height / Math.max(.01, camera.zoom) / 2 + margin;
        return rect.x + rect.w >= camera.x - halfWidth && rect.x <= camera.x + halfWidth
            && rect.y + rect.h >= camera.y - halfHeight && rect.y <= camera.y + halfHeight;
    }

    function isPointVisible(point, margin = 0) {
        const halfWidth = view.width / Math.max(.01, camera.zoom) / 2 + margin;
        const halfHeight = view.height / Math.max(.01, camera.zoom) / 2 + margin;
        return point.x >= camera.x - halfWidth && point.x <= camera.x + halfWidth
            && point.y >= camera.y - halfHeight && point.y <= camera.y + halfHeight;
    }

    function isInCurrentRoom(point) {
        const room = findRoom(point.x, point.y);
        return Boolean(room && currentRoom && room.id === currentRoom.id);
    }

    function segmentBlocked(x1, y1, x2, y2, padding) {
        return getSightRects().some(rect => segmentIntersectsRect(x1, y1, x2, y2, { x: rect.x - padding, y: rect.y - padding, w: rect.w + padding * 2, h: rect.h + padding * 2 }));
    }

    function segmentMovementBlocked(x1, y1, x2, y2, padding) {
        return getSolidRects().some(rect => segmentIntersectsRect(x1, y1, x2, y2, { x: rect.x - padding, y: rect.y - padding, w: rect.w + padding * 2, h: rect.h + padding * 2 }));
    }

    function segmentIntersectsRect(x1, y1, x2, y2, rect) {
        let t0 = 0, t1 = 1;
        const dx = x2 - x1, dy = y2 - y1;
        const checks = [[-dx, x1 - rect.x], [dx, rect.x + rect.w - x1], [-dy, y1 - rect.y], [dy, rect.y + rect.h - y1]];
        for (const [p, q] of checks) {
            if (p === 0 && q < 0) return false;
            if (p === 0) continue;
            const r = q / p;
            if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
            else { if (r < t0) return false; if (r < t1) t1 = r; }
        }
        return true;
    }

    function circleHitsRect(x, y, radius, rect) {
        const nx = clamp(x, rect.x, rect.x + rect.w); const ny = clamp(y, rect.y, rect.y + rect.h);
        return (x - nx) ** 2 + (y - ny) ** 2 < radius ** 2;
    }

    function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function angleDifference(from, to) { return Math.atan2(Math.sin(to - from), Math.cos(to - from)); }
    function rotateToward(from, to, amount) { return from + clamp(angleDifference(from, to), -amount, amount); }
    function formatTime(seconds) { const whole = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`; }
    function formatMoney(value) { return `€${formatNumber(Math.round(value))}`; }
    function formatNumber(value) { return new Intl.NumberFormat("it-IT").format(Number(value) || 0); }
    function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; }
    function roundRect(context, x, y, width, height, radius) {
        const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
        context.beginPath(); context.moveTo(x + r, y); context.arcTo(x + width, y, x + width, y + height, r); context.arcTo(x + width, y + height, x, y + height, r); context.arcTo(x, y + height, x, y, r); context.arcTo(x, y, x + width, y, r); context.closePath();
    }

    function tone(frequency, duration, type = "sine", volume = .03) {
        try {
            audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
            oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.value = volume;
            gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
            oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
        } catch (error) { /* audio opzionale */ }
    }

    if (new URLSearchParams(window.location.search).get("debug") === "polizia-ladri") window.__POLIZIA_LADRI_DEBUG__ = {
        getState: () => ({
            running, paused, ended, elapsed, loot, openedCount, spottedCount,
            map: activeMap && activeMap.id,
            police: guards.length,
            player: player ? { x: player.x, y: player.y, speed: player.speed, running: player.running, stepPhase: player.stepPhase } : null,
            guards: guards.map(item => ({
                x: item.x, y: item.y, state: item.state,
                moveSpeed: item.moveSpeed, stepPhase: item.stepPhase,
                stuckTime: item.stuckTime, repathAttempts: item.repathAttempts,
                pathRemaining: Math.max(0, item.path.length - item.pathIndex)
            })),
            cameras: cameras.map(item => ({
                id: item.id, x: item.x, y: item.y, angle: item.angle,
                alertTime: item.alertTime, wasSeeing: item.wasSeeing
            }))
        }),
        win: () => running && finishGame(true),
        lose: () => running && finishGame(false),
        openAllSafes: () => safes.forEach(safe => { if (!safe.opened) { safe.opened = true; openedCount += 1; loot += safe.value[0]; } }),
        setPlayer: (x, y) => { if (player) { player.x = Number(x); player.y = Number(y); currentRoom = findRoom(player.x, player.y) || currentRoom; } },
        setGuard: (index, values) => { if (guards[index] && values) Object.assign(guards[index], values); },
        setGuardState: (index, state, target) => { if (guards[index]) setGuardState(guards[index], state, target); },
        canSee: index => Boolean(guards[index] && canSeePlayer(guards[index])),
        makeNoise: (x, y, radius) => makeNoise(Number(x), Number(y), Number(radius) || 200),
        getMap: () => activeMap,
        findPath: (from, to) => findPath(from, to),
        castRay: (x, y, angle, range) => castRay(x, y, angle, range),
        setCamera: (index, values) => { if (cameras[index] && values) Object.assign(cameras[index], values); },
        cameraCanSee: index => Boolean(cameras[index] && sensorCanSeePlayer(cameras[index])),
        triggerCamera: index => { if (cameras[index]) triggerCameraAlarm(cameras[index]); }
    };
}());
