(function () {
    "use strict";

    const ROUND_SECONDS = 30;
    const ATTACK_DURATION = 240;
    const IMPACT_TIME = 82;
    const ATTACK_COOLDOWN = 125;
    const STORAGE_RECORDS = "cuginiparty_gatto_topo_records_v1";
    const STORAGE_SETTINGS = "cuginiparty_gatto_topo_settings_v1";

    const dom = {
        menu: document.getElementById("catMouseMenu"),
        game: document.getElementById("catMouseGame"),
        canvas: document.getElementById("catMouseCanvas"),
        play: document.getElementById("catMousePlay"),
        replay: document.getElementById("catMouseReplay"),
        quit: document.getElementById("catMouseQuit"),
        sound: document.getElementById("catMouseSound"),
        score: document.getElementById("catMouseScore"),
        combo: document.getElementById("catMouseCombo"),
        time: document.getElementById("catMouseTime"),
        timeBar: document.getElementById("catMouseTimeBar"),
        countdown: document.getElementById("catMouseCountdown"),
        result: document.getElementById("catMouseResult"),
        newRecord: document.getElementById("catMouseNewRecord"),
        finalScore: document.getElementById("catMouseFinalScore"),
        finalCombo: document.getElementById("catMouseFinalCombo"),
        finalAccuracy: document.getElementById("catMouseFinalAccuracy"),
        finalTaps: document.getElementById("catMouseFinalTaps"),
        menuBestScore: document.getElementById("catMouseMenuBestScore"),
        menuBestCombo: document.getElementById("catMouseMenuBestCombo"),
        menuBestAccuracy: document.getElementById("catMouseMenuBestAccuracy")
    };

    if (!dom.canvas || !dom.play) return;

    const ctx = dom.canvas.getContext("2d", { alpha: false, desynchronized: true });
    const records = readJson(STORAGE_RECORDS, { bestScore: 0, bestCombo: 0, bestAccuracy: 0 });
    const settings = readJson(STORAGE_SETTINGS, { sound: true });
    const debugParams = new URLSearchParams(location.search);
    const debugEnabled = debugParams.get("debug") === "gatto-topo";
    let audioContext = null;
    let animationFrame = 0;
    let previousTime = performance.now();
    let countdownStartedAt = 0;
    let roundStartedAt = 0;
    let countdownStep = "";

    const state = {
        status: "menu",
        width: 1,
        height: 1,
        score: 0,
        combo: 0,
        bestCombo: 0,
        taps: 0,
        hits: 0,
        remaining: ROUND_SECONDS,
        lastAttackAt: -Infinity,
        fairnessLock: 0,
        shake: 0,
        paw: null,
        particles: [],
        feedback: [],
        mouse: {
            x: 320,
            y: 320,
            vx: 0,
            vy: 0,
            targetX: 520,
            targetY: 320,
            targetTimer: .6,
            burst: 0,
            hitTimer: 0,
            angle: 0,
            runPhase: 0
        }
    };

    function readJson(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "null");
            return value && typeof value === "object" ? { ...fallback, ...value } : { ...fallback };
        } catch {
            return { ...fallback };
        }
    }

    function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ }
    }

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function lerp(from, to, amount) {
        return from + (to - from) * amount;
    }

    function updateRecordsUi() {
        dom.menuBestScore.textContent = String(Number(records.bestScore) || 0);
        dom.menuBestCombo.textContent = `x${Number(records.bestCombo) || 0}`;
        dom.menuBestAccuracy.textContent = `${Number(records.bestAccuracy) || 0}%`;
    }

    function updateSoundButton() {
        dom.sound.setAttribute("aria-pressed", String(settings.sound));
        dom.sound.querySelector("span").textContent = settings.sound ? "ON" : "OFF";
    }

    function ensureAudio() {
        if (!audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (AudioCtor) audioContext = new AudioCtor();
        }
        if (audioContext?.state === "suspended") audioContext.resume().catch(() => {});
    }

    function tone(frequency, duration, volume, type = "sine", delay = 0) {
        if (!settings.sound || !audioContext) return;
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

    function sound(name) {
        if (!settings.sound) return;
        ensureAudio();
        if (name === "count") tone(330, .08, .04, "square");
        if (name === "go") { tone(520, .1, .045, "square"); tone(780, .12, .035, "triangle", .07); }
        if (name === "slap") tone(115, .07, .06, "triangle");
        if (name === "hit") { tone(620, .1, .055, "square"); tone(860, .11, .04, "triangle", .045); }
        if (name === "miss") tone(145, .09, .026, "sine");
        if (name === "end") { tone(330, .16, .05, "triangle"); tone(220, .24, .045, "triangle", .13); }
    }

    function resizeCanvas() {
        const rect = dom.canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        state.width = width;
        state.height = height;
        const pixelWidth = Math.round(width * dpr);
        const pixelHeight = Math.round(height * dpr);
        if (dom.canvas.width !== pixelWidth || dom.canvas.height !== pixelHeight) {
            dom.canvas.width = pixelWidth;
            dom.canvas.height = pixelHeight;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        keepMouseInArena();
    }

    function arenaBounds() {
        const side = clamp(Math.min(state.width, state.height) * .065, 25, 62);
        return { left: side, right: state.width - side, top: Math.max(86, side), bottom: state.height - side };
    }

    function keepMouseInArena() {
        const bounds = arenaBounds();
        state.mouse.x = clamp(state.mouse.x, bounds.left, bounds.right);
        state.mouse.y = clamp(state.mouse.y, bounds.top, bounds.bottom);
    }

    function chooseMouseTarget(forceFar = false) {
        const bounds = arenaBounds();
        let targetX = state.mouse.x;
        let targetY = state.mouse.y;
        for (let attempt = 0; attempt < 8; attempt += 1) {
            targetX = lerp(bounds.left, bounds.right, .06 + Math.random() * .88);
            targetY = lerp(bounds.top, bounds.bottom, .06 + Math.random() * .88);
            if (!forceFar || Math.hypot(targetX - state.mouse.x, targetY - state.mouse.y) > Math.min(state.width, state.height) * .32) break;
        }
        state.mouse.targetX = targetX;
        state.mouse.targetY = targetY;
        state.mouse.targetTimer = .35 + Math.random() * .75;
        state.mouse.burst = Math.random() < .28 ? .35 + Math.random() * .45 : 0;
    }

    function resetMouse() {
        const bounds = arenaBounds();
        state.mouse.x = (bounds.left + bounds.right) / 2;
        state.mouse.y = (bounds.top + bounds.bottom) / 2;
        state.mouse.vx = 0;
        state.mouse.vy = 0;
        state.mouse.hitTimer = 0;
        state.mouse.runPhase = 0;
        chooseMouseTarget(true);
    }

    function resetRoundState() {
        state.score = 0;
        state.combo = 0;
        state.bestCombo = 0;
        state.taps = 0;
        state.hits = 0;
        state.remaining = ROUND_SECONDS;
        state.lastAttackAt = -Infinity;
        state.fairnessLock = 0;
        state.shake = 0;
        state.paw = null;
        state.particles.length = 0;
        state.feedback.length = 0;
        resetMouse();
        updateHud();
    }

    function startRound() {
        ensureAudio();
        dom.menu.hidden = true;
        dom.game.hidden = false;
        dom.result.hidden = true;
        document.body.classList.add("cat-mouse-playing");
        resizeCanvas();
        resetRoundState();
        state.status = "countdown";
        countdownStartedAt = performance.now();
        countdownStep = "";
        dom.countdown.hidden = false;
        dom.countdown.textContent = "3";
    }

    function beginRunning(now = performance.now()) {
        state.status = "running";
        roundStartedAt = now;
        state.remaining = ROUND_SECONDS;
        dom.countdown.hidden = true;
        countdownStep = "";
        updateHud();
    }

    function returnToMenu() {
        state.status = "menu";
        state.paw = null;
        dom.game.hidden = true;
        dom.result.hidden = true;
        dom.countdown.hidden = true;
        dom.menu.hidden = false;
        document.body.classList.remove("cat-mouse-playing");
        updateRecordsUi();
    }

    function updateCountdown(now) {
        const elapsed = now - countdownStartedAt;
        const next = elapsed < 700 ? "3" : elapsed < 1400 ? "2" : elapsed < 2100 ? "1" : elapsed < 2700 ? "VIA!" : "";
        if (next !== countdownStep) {
            countdownStep = next;
            dom.countdown.textContent = next;
            if (next === "VIA!") sound("go");
            else if (next) sound("count");
        }
        if (elapsed >= 2700) beginRunning(now);
    }

    function updateHud() {
        dom.score.textContent = String(state.score);
        dom.combo.textContent = `x${state.combo}`;
        dom.time.textContent = String(Math.max(0, Math.ceil(state.remaining)));
        dom.timeBar.style.width = `${clamp(state.remaining / ROUND_SECONDS * 100, 0, 100)}%`;
        dom.timeBar.style.background = state.remaining <= 5
            ? "linear-gradient(90deg, #df4d4d, #f2a34b)"
            : "linear-gradient(90deg, #4fbe86, #f4c95d)";
    }

    function updateMouse(dt) {
        const mouse = state.mouse;
        mouse.runPhase += dt * (8 + Math.hypot(mouse.vx, mouse.vy) / 55);
        mouse.hitTimer = Math.max(0, mouse.hitTimer - dt);
        state.fairnessLock = Math.max(0, state.fairnessLock - dt);
        if (mouse.hitTimer > 0) {
            mouse.vx *= Math.pow(.03, dt);
            mouse.vy *= Math.pow(.03, dt);
            return;
        }

        mouse.targetTimer -= dt;
        mouse.burst = Math.max(0, mouse.burst - dt);
        const distance = Math.hypot(mouse.targetX - mouse.x, mouse.targetY - mouse.y);
        if (state.fairnessLock <= 0 && (distance < 42 || mouse.targetTimer <= 0)) chooseMouseTarget(Math.random() < .55);

        const progress = clamp((ROUND_SECONDS - state.remaining) / ROUND_SECONDS, 0, 1);
        const baseSpeed = clamp(Math.min(state.width, state.height) * .37, 190, 295);
        const speed = baseSpeed + progress * 95 + (mouse.burst > 0 ? 72 : 0);
        const dx = mouse.targetX - mouse.x;
        const dy = mouse.targetY - mouse.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const curve = Math.sin(mouse.runPhase * .52) * 24;
        const desiredVx = dx / length * speed - dy / length * curve;
        const desiredVy = dy / length * speed + dx / length * curve;
        const steering = clamp(dt * 4.4, 0, 1);
        mouse.vx = lerp(mouse.vx, desiredVx, steering);
        mouse.vy = lerp(mouse.vy, desiredVy, steering);
        mouse.x += mouse.vx * dt;
        mouse.y += mouse.vy * dt;
        mouse.angle = Math.atan2(mouse.vy, mouse.vx);

        const bounds = arenaBounds();
        if (mouse.x < bounds.left || mouse.x > bounds.right) { mouse.x = clamp(mouse.x, bounds.left, bounds.right); mouse.vx *= -.5; chooseMouseTarget(true); }
        if (mouse.y < bounds.top || mouse.y > bounds.bottom) { mouse.y = clamp(mouse.y, bounds.top, bounds.bottom); mouse.vy *= -.5; chooseMouseTarget(true); }
    }

    function nearestEdge(x, y) {
        const distances = [
            { edge: "left", value: x },
            { edge: "right", value: state.width - x },
            { edge: "top", value: y },
            { edge: "bottom", value: state.height - y }
        ];
        return distances.sort((a, b) => a.value - b.value)[0].edge;
    }

    function launchPaw(x, y, now = performance.now()) {
        if (state.status !== "running" || state.paw || now - state.lastAttackAt < ATTACK_COOLDOWN) return false;
        state.lastAttackAt = now;
        state.taps += 1;
        state.fairnessLock = .13;
        state.paw = { x: clamp(x, 0, state.width), y: clamp(y, 0, state.height), edge: nearestEdge(x, y), startedAt: now, impacted: false, result: "" };
        sound("slap");
        return true;
    }

    function createHitParticles(x, y) {
        const colors = ["#fff6c8", "#f7c95b", "#ed8245", "#ffffff"];
        for (let index = 0; index < 9; index += 1) {
            const angle = Math.PI * 2 * index / 9 + Math.random() * .25;
            const speed = 70 + Math.random() * 120;
            state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .42 + Math.random() * .24, maxLife: .66, size: 4 + Math.random() * 6, color: colors[index % colors.length], rotation: Math.random() * Math.PI });
        }
    }

    function addFeedback(text, x, y, color) {
        state.feedback.push({ text, x, y, color, life: .72, maxLife: .72 });
    }

    function resolvePawImpact() {
        const paw = state.paw;
        if (!paw || paw.impacted) return;
        paw.impacted = true;
        const mouse = state.mouse;
        const hitRadius = clamp(Math.min(state.width, state.height) * .055, 39, 53);
        const hit = mouse.hitTimer <= 0 && Math.hypot(paw.x - mouse.x, paw.y - mouse.y) <= hitRadius;
        if (hit) {
            paw.result = "hit";
            state.score += 1;
            state.hits += 1;
            state.combo += 1;
            state.bestCombo = Math.max(state.bestCombo, state.combo);
            mouse.hitTimer = .23;
            mouse.vx *= -.24;
            mouse.vy *= -.24;
            state.shake = 5;
            createHitParticles(mouse.x, mouse.y);
            addFeedback(state.combo > 1 ? `+1  COMBO x${state.combo}` : "+1", mouse.x, mouse.y - 35, "#fff7c2");
            sound("hit");
        } else {
            paw.result = "miss";
            state.combo = 0;
            addFeedback("MISS", paw.x, paw.y - 26, "#fff3e5");
            sound("miss");
        }
        updateHud();
    }

    function updatePaw(now) {
        if (!state.paw) return;
        const elapsed = now - state.paw.startedAt;
        if (elapsed >= IMPACT_TIME) resolvePawImpact();
        if (elapsed >= ATTACK_DURATION) state.paw = null;
    }

    function updateEffects(dt) {
        state.shake = Math.max(0, state.shake - dt * 25);
        state.particles.forEach((particle) => {
            particle.life -= dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 210 * dt;
            particle.rotation += dt * 5;
        });
        state.particles = state.particles.filter((particle) => particle.life > 0);
        state.feedback.forEach((item) => { item.life -= dt; item.y -= dt * 42; });
        state.feedback = state.feedback.filter((item) => item.life > 0);
    }

    function finishRound() {
        if (state.status !== "running") return;
        state.status = "result";
        state.remaining = 0;
        state.paw = null;
        updateHud();
        const accuracy = state.taps ? Math.round(state.hits / state.taps * 100) : 0;
        const isNewRecord = state.score > Number(records.bestScore || 0);
        records.bestScore = Math.max(Number(records.bestScore) || 0, state.score);
        records.bestCombo = Math.max(Number(records.bestCombo) || 0, state.bestCombo);
        records.bestAccuracy = Math.max(Number(records.bestAccuracy) || 0, accuracy);
        writeJson(STORAGE_RECORDS, records);
        dom.finalScore.textContent = String(state.score);
        dom.finalCombo.textContent = `x${state.bestCombo}`;
        dom.finalAccuracy.textContent = `${accuracy}%`;
        dom.finalTaps.textContent = String(state.taps);
        dom.newRecord.hidden = !isNewRecord;
        dom.result.hidden = false;
        sound("end");
    }

    function drawArena(time) {
        const width = state.width;
        const height = state.height;
        const plank = clamp(width / 11, 72, 135);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#efc17b");
        gradient.addColorStop(1, "#c98a4c");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(91,53,35,.13)";
        ctx.lineWidth = 2;
        for (let x = -plank; x < width + plank; x += plank) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + plank * .22, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 72) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        const rugWidth = Math.min(width * .62, 760);
        const rugHeight = Math.min(height * .48, 390);
        ctx.save();
        ctx.translate(width * .5, height * .57);
        ctx.fillStyle = "rgba(39,113,120,.18)";
        roundedRect(-rugWidth / 2 - 7, -rugHeight / 2 + 9, rugWidth + 14, rugHeight + 8, 38);
        ctx.fill();
        ctx.fillStyle = "#5ba6a4";
        roundedRect(-rugWidth / 2, -rugHeight / 2, rugWidth, rugHeight, 34);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,248,219,.58)";
        ctx.lineWidth = 8;
        roundedRect(-rugWidth / 2 + 17, -rugHeight / 2 + 17, rugWidth - 34, rugHeight - 34, 25);
        ctx.stroke();
        ctx.globalAlpha = .22;
        ctx.strokeStyle = "#173f4e";
        ctx.lineWidth = 3;
        for (let y = -rugHeight * .3; y <= rugHeight * .3; y += 34) {
            ctx.beginPath(); ctx.moveTo(-rugWidth * .38, y); ctx.bezierCurveTo(-rugWidth * .15, y - 17, rugWidth * .15, y + 17, rugWidth * .38, y); ctx.stroke();
        }
        ctx.restore();

        drawHole(width * .12, height * .26, 1 + Math.sin(time / 500) * .02);
        drawHole(width * .88, height * .78, .86);
        drawFurniture(width, height);
    }

    function roundedRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }

    function drawHole(x, y, scale) {
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillStyle = "rgba(71,40,28,.22)"; ctx.beginPath(); ctx.ellipse(4, 7, 38, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3c2a27"; ctx.beginPath(); ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#171616"; ctx.beginPath(); ctx.ellipse(0, 2, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawFurniture(width, height) {
        ctx.save();
        ctx.globalAlpha = .92;
        ctx.fillStyle = "#7e4b38";
        roundedRect(-24, height * .5 - 90, 68, 180, 16); ctx.fill();
        roundedRect(width - 44, height * .22, 68, 190, 16); ctx.fill();
        ctx.fillStyle = "#e8a65d";
        roundedRect(-15, height * .5 - 72, 48, 144, 11); ctx.fill();
        roundedRect(width - 34, height * .22 + 18, 48, 154, 11); ctx.fill();
        ctx.restore();
    }

    function drawMouse() {
        const mouse = state.mouse;
        const squash = mouse.hitTimer > 0 ? 1 - Math.sin((mouse.hitTimer / .23) * Math.PI) * .48 : 1;
        const speedScale = clamp(Math.hypot(mouse.vx, mouse.vy) / 270, .4, 1.2);
        ctx.save();
        ctx.translate(mouse.x, mouse.y + Math.sin(mouse.runPhase) * 2);
        ctx.rotate(mouse.angle);
        ctx.scale(1 / squash, squash);

        ctx.strokeStyle = "#3e4650";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-28, 4);
        ctx.bezierCurveTo(-45, 5 + Math.sin(mouse.runPhase) * 7, -51, 19, -58, 12);
        ctx.stroke();

        const leg = Math.sin(mouse.runPhase * 1.6) * 8 * speedScale;
        ctx.strokeStyle = "#59636d";
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-12, 14); ctx.lineTo(-20 + leg, 23); ctx.moveTo(12, 14); ctx.lineTo(19 - leg, 23); ctx.stroke();

        const bodyGradient = ctx.createLinearGradient(-28, -20, 26, 22);
        bodyGradient.addColorStop(0, "#aeb8bf");
        bodyGradient.addColorStop(1, "#697782");
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = "#3e4650";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 0, 31, 21, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#8d99a3";
        ctx.beginPath(); ctx.arc(24, -2, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d99aa0";
        ctx.beginPath(); ctx.arc(18, -17, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(31, -15, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#14191d";
        ctx.beginPath(); ctx.arc(30, -5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f08e91";
        ctx.beginPath(); ctx.arc(42, 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(37, 5); ctx.lineTo(50, 10); ctx.moveTo(37, 1); ctx.lineTo(51, 1); ctx.stroke();
        if (mouse.hitTimer > 0) {
            ctx.strokeStyle = "#343a40"; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(24, -7); ctx.lineTo(33, -2); ctx.moveTo(33, -7); ctx.lineTo(24, -2); ctx.stroke();
        }
        ctx.restore();
    }

    function pawPosition(paw, now) {
        const elapsed = now - paw.startedAt;
        let contact;
        if (elapsed <= IMPACT_TIME) contact = 1 - Math.pow(1 - elapsed / IMPACT_TIME, 3);
        else if (elapsed <= 145) contact = 1;
        else contact = 1 - clamp((elapsed - 145) / (ATTACK_DURATION - 145), 0, 1);
        let startX = paw.x;
        let startY = paw.y;
        const reach = Math.max(state.width, state.height) * .38 + 110;
        if (paw.edge === "left") startX = -reach;
        if (paw.edge === "right") startX = state.width + reach;
        if (paw.edge === "top") startY = -reach;
        if (paw.edge === "bottom") startY = state.height + reach;
        return { x: lerp(startX, paw.x, contact), y: lerp(startY, paw.y, contact), startX, startY, contact };
    }

    function drawPaw(now) {
        const paw = state.paw;
        if (!paw) return;
        const position = pawPosition(paw, now);
        const angle = Math.atan2(paw.y - position.startY, paw.x - position.startX);
        ctx.save();
        ctx.strokeStyle = "#d66e38";
        ctx.lineWidth = clamp(Math.min(state.width, state.height) * .08, 52, 82);
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(position.startX, position.startY); ctx.lineTo(position.x, position.y); ctx.stroke();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = "#f09a52";
        ctx.strokeStyle = "#713d33";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, 0, 37, 31, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffd19e";
        ctx.beginPath(); ctx.ellipse(0, 5, 17, 14, 0, 0, Math.PI * 2); ctx.fill();
        [-20, -7, 7, 20].forEach((x, index) => { ctx.beginPath(); ctx.ellipse(x, -21 + Math.abs(1.5 - index) * 2, 7, 10, 0, 0, Math.PI * 2); ctx.fill(); });
        if (paw.result === "miss") { ctx.strokeStyle = "#8d3e35"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(14, 6); ctx.stroke(); }
        ctx.restore();
    }

    function drawEffects() {
        state.particles.forEach((particle) => {
            ctx.save();
            ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.fillStyle = particle.color;
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            ctx.restore();
        });
        state.feedback.forEach((item) => {
            ctx.save();
            ctx.globalAlpha = clamp(item.life / item.maxLife, 0, 1);
            ctx.fillStyle = item.color;
            ctx.strokeStyle = "rgba(70,42,34,.65)";
            ctx.lineWidth = 5;
            ctx.font = `950 ${clamp(Math.min(state.width, state.height) * .045, 22, 35)}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.strokeText(item.text, item.x, item.y);
            ctx.fillText(item.text, item.x, item.y);
            ctx.restore();
        });
    }

    function render(now) {
        if (dom.game.hidden) return;
        ctx.save();
        if (state.shake > 0) ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
        drawArena(now);
        drawMouse();
        drawEffects();
        drawPaw(now);
        ctx.restore();
    }

    function frame(now) {
        const dt = Math.min(.035, Math.max(0, (now - previousTime) / 1000));
        previousTime = now;
        if (state.status === "countdown") updateCountdown(now);
        if (state.status === "running") {
            state.remaining = Math.max(0, ROUND_SECONDS - (now - roundStartedAt) / 1000);
            updateMouse(dt);
            updatePaw(now);
            updateEffects(dt);
            updateHud();
            if (state.remaining <= 0) finishRound();
        } else if (state.status === "countdown" || state.status === "result") {
            updateEffects(dt);
        }
        render(now);
        animationFrame = requestAnimationFrame(frame);
    }

    function pointerPosition(event) {
        const rect = dom.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * state.width / Math.max(1, rect.width),
            y: (event.clientY - rect.top) * state.height / Math.max(1, rect.height)
        };
    }

    dom.play.addEventListener("click", startRound);
    dom.replay.addEventListener("click", startRound);
    dom.quit.addEventListener("click", returnToMenu);
    dom.sound.addEventListener("click", () => {
        settings.sound = !settings.sound;
        writeJson(STORAGE_SETTINGS, settings);
        updateSoundButton();
        if (settings.sound) ensureAudio();
    });
    dom.canvas.addEventListener("pointerdown", (event) => {
        if (event.isPrimary === false) return;
        event.preventDefault();
        dom.canvas.setPointerCapture?.(event.pointerId);
        const position = pointerPosition(event);
        launchPaw(position.x, position.y);
    }, { passive: false });
    dom.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.visualViewport?.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("pagehide", () => { cancelAnimationFrame(animationFrame); writeJson(STORAGE_RECORDS, records); });
    window.addEventListener("keydown", (event) => {
        if (!debugEnabled) return;
        if (event.code === "KeyH" && state.status === "running") {
            state.paw = null;
            state.mouse.x = state.width / 2;
            state.mouse.y = state.height / 2;
            state.mouse.vx = 0;
            state.mouse.vy = 0;
            state.mouse.hitTimer = 0;
            launchPaw(state.mouse.x, state.mouse.y, performance.now());
            resolvePawImpact();
        }
        if (event.code === "KeyM" && state.status === "running") {
            state.paw = null;
            launchPaw(4, state.height - 4, performance.now());
            resolvePawImpact();
        }
        if (event.code === "KeyE" && state.status === "running") finishRound();
    });

    if (debugEnabled) {
        window.__catMouseDebug = Object.freeze({
            getState: () => ({ status: state.status, score: state.score, combo: state.combo, taps: state.taps, hits: state.hits, remaining: state.remaining, mouseX: state.mouse.x, mouseY: state.mouse.y }),
            start: () => { startRound(); beginRunning(performance.now()); },
            placeMouse: (x, y) => { state.mouse.x = clamp(Number(x), 0, state.width); state.mouse.y = clamp(Number(y), 0, state.height); state.mouse.vx = 0; state.mouse.vy = 0; state.mouse.hitTimer = 0; },
            tap: (x, y) => launchPaw(Number(x), Number(y), performance.now()),
            resolve: () => resolvePawImpact(),
            finish: () => finishRound()
        });
    }

    updateRecordsUi();
    updateSoundButton();
    if (debugEnabled && debugParams.get("autostart") === "1") {
        startRound();
        beginRunning(performance.now());
    }
    animationFrame = requestAnimationFrame(frame);
}());
