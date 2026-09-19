(function () {
    "use strict";

    const base = { locked: false, unlockRequirement: null };
    const skins = [
        { id: "classic-teal", name: "Classic Teal", primary: "#2ec4b6", secondary: "#74eadf", outline: "#163f4f", accent: "#f0b429", face: "happy", pattern: "plain" },
        { id: "sunset-pop", name: "Sunset Pop", primary: "#ff6b4a", secondary: "#ffad66", outline: "#592f35", accent: "#fff0bd", face: "happy", pattern: "split" },
        { id: "cobalt-smile", name: "Cobalt Smile", primary: "#3976e8", secondary: "#69b7ff", outline: "#142f63", accent: "#ffffff", face: "cool", pattern: "plain" },
        { id: "rose-jam", name: "Rose Jam", primary: "#ef5da8", secondary: "#ff9cc9", outline: "#63254a", accent: "#fff5c9", face: "goofy", pattern: "dots" },
        { id: "mint-chip", name: "Mint Chip", primary: "#75d5a4", secondary: "#c7f2cf", outline: "#214f49", accent: "#4f3b52", face: "happy", pattern: "dots" },
        { id: "mono-mini", name: "Mono Mini", primary: "#f4f1e8", secondary: "#c9c7c0", outline: "#242a30", accent: "#242a30", face: "serious", pattern: "plain" },
        { id: "neon-pulse", name: "Neon Pulse", primary: "#191934", secondary: "#29295a", outline: "#00f5d4", accent: "#ff38d1", face: "cool", pattern: "pulse", glow: "#00f5d4" },
        { id: "acid-lime", name: "Acid Lime", primary: "#9ef01a", secondary: "#ccff66", outline: "#24420e", accent: "#ffffff", face: "angry", pattern: "hazard", glow: "#9ef01a" },
        { id: "synthwave", name: "Synthwave", primary: "#7b2cbf", secondary: "#e040fb", outline: "#2b1453", accent: "#00e5ff", face: "cool", pattern: "grid", glow: "#e040fb" },
        { id: "cyber-grid", name: "Cyber Grid", primary: "#092f3f", secondary: "#0b5c6b", outline: "#00e7ff", accent: "#ffee32", face: "robot", pattern: "circuit", glow: "#00e7ff" },
        { id: "glitch-byte", name: "Glitch Byte", primary: "#202034", secondary: "#34344a", outline: "#f7f7ff", accent: "#ff2e88", face: "robot", pattern: "glitch", glow: "#36f1cd" },
        { id: "plasma-core", name: "Plasma Core", primary: "#5a189a", secondary: "#9d4edd", outline: "#240046", accent: "#f7ff6a", face: "surprised", pattern: "pulse", glow: "#c77dff" },
        { id: "robot-mk1", name: "Robot MK-I", primary: "#8d99ae", secondary: "#edf2f4", outline: "#2b2d42", accent: "#ef233c", face: "robot", pattern: "bolts" },
        { id: "circuit-core", name: "Circuit Core", primary: "#176b55", secondary: "#43aa8b", outline: "#0b3329", accent: "#f9c74f", face: "robot", pattern: "circuit" },
        { id: "hazard-bot", name: "Hazard Bot", primary: "#f9c74f", secondary: "#f9844a", outline: "#3d342b", accent: "#252525", face: "angry", pattern: "hazard" },
        { id: "chrome-byte", name: "Chrome Byte", primary: "#b9c6d3", secondary: "#f5fbff", outline: "#34495e", accent: "#4cc9f0", face: "cool", pattern: "split" },
        { id: "holo-tech", name: "Holo Tech", primary: "#6ee7f7", secondary: "#d4f8ff", outline: "#315f79", accent: "#b5179e", face: "robot", pattern: "grid", glow: "#6ee7f7" },
        { id: "battery-bot", name: "Battery Bot", primary: "#4d908e", secondary: "#90be6d", outline: "#214d4b", accent: "#f9c74f", face: "serious", pattern: "battery" },
        { id: "magma-core", name: "Magma Core", primary: "#9d0208", secondary: "#e85d04", outline: "#370617", accent: "#ffba08", face: "angry", pattern: "flame", glow: "#ff6d00" },
        { id: "frost-bite", name: "Frost Bite", primary: "#90e0ef", secondary: "#caf0f8", outline: "#164e63", accent: "#ffffff", face: "serious", pattern: "ice", glow: "#90e0ef" },
        { id: "thunder-box", name: "Thunder Box", primary: "#3f37c9", secondary: "#4895ef", outline: "#211b68", accent: "#fee440", face: "angry", pattern: "bolt", glow: "#fee440" },
        { id: "aqua-splash", name: "Aqua Splash", primary: "#00b4d8", secondary: "#48cae4", outline: "#023e8a", accent: "#caf0f8", face: "happy", pattern: "wave" },
        { id: "forest-sprout", name: "Forest Sprout", primary: "#52b788", secondary: "#95d5b2", outline: "#1b4332", accent: "#d8f3dc", face: "happy", pattern: "leaf" },
        { id: "crystal-cut", name: "Crystal Cut", primary: "#a9def9", secondary: "#e4c1f9", outline: "#5b4b8a", accent: "#ffffff", face: "cool", pattern: "crystal", glow: "#cdb4db" },
        { id: "star-voyager", name: "Star Voyager", primary: "#20204a", secondary: "#3a0ca3", outline: "#0a0a22", accent: "#ffd166", face: "cool", pattern: "stars", glow: "#4361ee" },
        { id: "lunar-dust", name: "Lunar Dust", primary: "#b7b7c9", secondary: "#e7e7ef", outline: "#44445e", accent: "#6c63a8", face: "serious", pattern: "craters" },
        { id: "alien-signal", name: "Alien Signal", primary: "#72ef36", secondary: "#b7ff7a", outline: "#173f14", accent: "#24123d", face: "alien", pattern: "spots", glow: "#72ef36" },
        { id: "void-cube", name: "Void Cube", primary: "#101019", secondary: "#29293b", outline: "#05050a", accent: "#9d4edd", face: "cyclops", pattern: "void", glow: "#7b2cbf" },
        { id: "nebula-dream", name: "Nebula Dream", primary: "#6a4c93", secondary: "#c77dff", outline: "#35214d", accent: "#ffcae9", face: "goofy", pattern: "stars", glow: "#c77dff" },
        { id: "solar-flare", name: "Solar Flare", primary: "#ff9f1c", secondary: "#ffbf69", outline: "#773d0a", accent: "#fff3b0", face: "happy", pattern: "sun", glow: "#ff9f1c" },
        { id: "silent-ninja", name: "Silent Ninja", primary: "#252533", secondary: "#414153", outline: "#09090d", accent: "#e63946", face: "ninja", pattern: "mask" },
        { id: "pixel-pirate", name: "Pixel Pirate", primary: "#b5651d", secondary: "#d48b42", outline: "#3e2515", accent: "#f4e4ba", face: "pirate", pattern: "bandana" },
        { id: "zombie-zap", name: "Zombie Zap", primary: "#86a873", secondary: "#b5c99a", outline: "#344e2d", accent: "#6d214f", face: "zombie", pattern: "stitches" },
        { id: "bone-rattle", name: "Bone Rattle", primary: "#e9e3d5", secondary: "#fffaf0", outline: "#34312d", accent: "#34312d", face: "skull", pattern: "bones" },
        { id: "slime-time", name: "Slime Time", primary: "#70e000", secondary: "#ccff33", outline: "#296600", accent: "#ffffff", face: "goofy", pattern: "slime", glow: "#70e000" },
        { id: "one-eye", name: "One Eye", primary: "#ff595e", secondary: "#ffca3a", outline: "#5a2325", accent: "#ffffff", face: "cyclops", pattern: "spots" },
        { id: "grumpy-box", name: "Grumpy Box", primary: "#f94144", secondary: "#f3722c", outline: "#662020", accent: "#fff1d0", face: "angry", pattern: "plain" },
        { id: "silly-square", name: "Silly Square", primary: "#ff99c8", secondary: "#fcf6bd", outline: "#70405b", accent: "#2d3142", face: "goofy", pattern: "dots" },
        { id: "royal-gold", name: "Royal Gold", primary: "#d4a017", secondary: "#ffe082", outline: "#60420a", accent: "#7b2cbf", face: "cool", pattern: "crown", glow: "#ffd166" },
        { id: "rainbow-runner", name: "Rainbow Runner", primary: "#ff595e", secondary: "#6a4c93", outline: "#32314b", accent: "#ffffff", face: "happy", pattern: "rainbow", glow: "#4cc9f0" },
        { id: "pixel-hero", name: "Pixel Hero", primary: "#1982c4", secondary: "#8ac926", outline: "#17324d", accent: "#ffca3a", face: "serious", pattern: "pixel" },
        { id: "shadow-step", name: "Shadow Step", primary: "#17171f", secondary: "#353545", outline: "#050508", accent: "#7b61ff", face: "ninja", pattern: "shadow", glow: "#5a45d6" }
    ].map((skin) => Object.freeze({ ...base, ...skin }));

    function roundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function drawPattern(ctx, skin, half, time) {
        const accent = skin.accent || "#ffffff";
        ctx.save();
        roundedRect(ctx, -half, -half, half * 2, half * 2, half * .16);
        ctx.clip();
        ctx.strokeStyle = accent;
        ctx.fillStyle = accent;
        ctx.globalAlpha = .48;
        ctx.lineWidth = Math.max(1.5, half * .08);
        const p = skin.pattern;
        if (p === "split") {
            ctx.fillRect(0, -half, half, half * 2);
        } else if (["dots", "spots", "craters"].includes(p)) {
            [[-.55, -.58, .12], [.58, -.45, .09], [-.62, .48, .08], [.55, .58, .14]].forEach(([x, y, r]) => {
                ctx.beginPath(); ctx.arc(x * half, y * half, r * half, 0, Math.PI * 2); ctx.fill();
            });
        } else if (p === "grid") {
            for (let v = -half; v <= half; v += half * .42) {
                ctx.beginPath(); ctx.moveTo(v, -half); ctx.lineTo(v, half); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-half, v); ctx.lineTo(half, v); ctx.stroke();
            }
        } else if (p === "circuit") {
            ctx.beginPath(); ctx.moveTo(-half, -.45 * half); ctx.lineTo(-.45 * half, -.45 * half); ctx.lineTo(-.45 * half, -.08 * half); ctx.lineTo(.25 * half, -.08 * half); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(half, .5 * half); ctx.lineTo(.45 * half, .5 * half); ctx.lineTo(.45 * half, .18 * half); ctx.stroke();
            [[-.45, -.45], [.45, .5], [.25, -.08]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * half, y * half, half * .08, 0, Math.PI * 2); ctx.fill(); });
        } else if (p === "glitch") {
            [-.62, -.28, .2, .58].forEach((y, index) => ctx.fillRect((index % 2 ? -.8 : -.45) * half, y * half, (index % 2 ? 1.2 : 1.35) * half, half * .12));
        } else if (p === "hazard") {
            ctx.rotate(-.5);
            for (let x = -half * 2; x < half * 2; x += half * .5) ctx.fillRect(x, -half * 2, half * .22, half * 4);
        } else if (["pulse", "void", "sun"].includes(p)) {
            ctx.beginPath(); ctx.arc(0, 0, half * (.42 + Math.sin(time / 260) * .04), 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, half * .68, 0, Math.PI * 2); ctx.stroke();
        } else if (p === "bolts") {
            [[-.7, -.68], [.7, -.68], [-.7, .68], [.7, .68]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * half, y * half, half * .1, 0, Math.PI * 2); ctx.fill(); });
        } else if (p === "battery") {
            ctx.strokeRect(-half * .62, -half * .72, half * 1.24, half * .32);
            ctx.fillRect(-half * .53, -half * .63, half * .72, half * .14);
        } else if (p === "flame") {
            ctx.beginPath(); ctx.moveTo(-half, half); ctx.quadraticCurveTo(-half * .55, .1 * half, -.18 * half, half); ctx.quadraticCurveTo(.15 * half, .18 * half, .48 * half, half); ctx.lineTo(half, half); ctx.closePath(); ctx.fill();
        } else if (p === "ice") {
            ctx.beginPath(); ctx.moveTo(-half, -.15 * half); ctx.lineTo(-.5 * half, -.62 * half); ctx.lineTo(-.18 * half, -.22 * half); ctx.lineTo(.18 * half, -.68 * half); ctx.lineTo(.55 * half, -.15 * half); ctx.lineTo(half, -.6 * half); ctx.stroke();
        } else if (p === "bolt") {
            ctx.beginPath(); ctx.moveTo(.15 * half, -half); ctx.lineTo(-.35 * half, -.05 * half); ctx.lineTo(.05 * half, -.05 * half); ctx.lineTo(-.2 * half, half); ctx.lineTo(.55 * half, -.2 * half); ctx.lineTo(.15 * half, -.2 * half); ctx.closePath(); ctx.fill();
        } else if (p === "wave") {
            ctx.beginPath(); ctx.moveTo(-half, .35 * half); ctx.bezierCurveTo(-.55 * half, -.1 * half, -.2 * half, .75 * half, .2 * half, .25 * half); ctx.bezierCurveTo(.5 * half, -.1 * half, .7 * half, .25 * half, half, 0); ctx.stroke();
        } else if (p === "leaf") {
            ctx.beginPath(); ctx.ellipse(.5 * half, -.55 * half, .22 * half, .38 * half, .65, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(.18 * half, -.2 * half); ctx.lineTo(.68 * half, -.78 * half); ctx.stroke();
        } else if (p === "crystal") {
            ctx.beginPath(); ctx.moveTo(-half, half); ctx.lineTo(-.45 * half, -.4 * half); ctx.lineTo(-.1 * half, half); ctx.lineTo(.35 * half, -.62 * half); ctx.lineTo(.68 * half, half); ctx.closePath(); ctx.fill();
        } else if (p === "stars") {
            [[-.62, -.55], [.57, -.62], [.68, .42], [-.55, .56]].forEach(([x, y], index) => { const r = half * (index ? .07 : .11); ctx.fillRect(x * half - r / 2, y * half - r / 2, r, r); });
        } else if (p === "rainbow") {
            ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"].forEach((color, index) => { ctx.fillStyle = color; ctx.fillRect(-half, -half + index * half * .4, half * 2, half * .4); });
        } else if (p === "pixel") {
            [[-.75, -.7], [.5, -.7], [-.75, .52], [.5, .52], [0, -.1]].forEach(([x, y]) => ctx.fillRect(x * half, y * half, half * .25, half * .25));
        } else if (p === "slime") {
            ctx.fillRect(-half, -half, half * 2, half * .3);
            [-.55, -.05, .5].forEach((x, i) => { ctx.beginPath(); ctx.arc(x * half, (-.62 + i * .07) * half, half * (.16 - i * .02), 0, Math.PI * 2); ctx.fill(); });
        } else if (["stitches", "bones"].includes(p)) {
            ctx.beginPath(); ctx.moveTo(-.7 * half, -.58 * half); ctx.lineTo(-.28 * half, -.35 * half); ctx.moveTo(-.6 * half, -.32 * half); ctx.lineTo(-.42 * half, -.62 * half); ctx.stroke();
        } else if (["mask", "bandana", "shadow"].includes(p)) {
            ctx.fillRect(-half, -.45 * half, half * 2, half * .62);
        } else if (p === "crown") {
            ctx.beginPath(); ctx.moveTo(-.65 * half, -.35 * half); ctx.lineTo(-.5 * half, -.82 * half); ctx.lineTo(-.12 * half, -.48 * half); ctx.lineTo(.18 * half, -.88 * half); ctx.lineTo(.5 * half, -.45 * half); ctx.lineTo(.72 * half, -.78 * half); ctx.lineTo(.62 * half, -.24 * half); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }

    function drawFace(ctx, skin, half) {
        const ink = skin.outline || "#163f4f";
        const eye = skin.eyeColor || ink;
        const face = skin.face || "happy";
        ctx.save();
        ctx.strokeStyle = ink;
        ctx.fillStyle = eye;
        ctx.lineWidth = Math.max(2, half * .11);
        ctx.lineCap = "round";
        const eyeY = -half * .2;
        if (face === "cyclops" || face === "alien") {
            ctx.fillStyle = face === "alien" ? skin.accent : eye;
            ctx.beginPath(); ctx.ellipse(0, eyeY, half * .24, half * .3, 0, 0, Math.PI * 2); ctx.fill();
            if (face === "alien") { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, eyeY, half * .09, 0, Math.PI * 2); ctx.fill(); }
        } else if (face === "skull") {
            ctx.beginPath(); ctx.arc(-half * .3, eyeY, half * .17, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(half * .3, eyeY, half * .17, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-half * .08, half * .15); ctx.lineTo(half * .08, half * .15); ctx.closePath(); ctx.fill();
        } else if (face === "ninja") {
            ctx.strokeStyle = skin.accent; ctx.beginPath(); ctx.moveTo(-half * .48, eyeY); ctx.lineTo(-half * .13, eyeY + half * .06); ctx.moveTo(half * .48, eyeY); ctx.lineTo(half * .13, eyeY + half * .06); ctx.stroke();
        } else if (face === "angry") {
            ctx.beginPath(); ctx.moveTo(-half * .45, eyeY - half * .12); ctx.lineTo(-half * .16, eyeY); ctx.moveTo(half * .45, eyeY - half * .12); ctx.lineTo(half * .16, eyeY); ctx.stroke();
            ctx.fillRect(-half * .35, eyeY, half * .11, half * .16); ctx.fillRect(half * .24, eyeY, half * .11, half * .16);
        } else if (face === "goofy" || face === "zombie") {
            ctx.beginPath(); ctx.arc(-half * .3, eyeY, half * .13, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(half * .3, eyeY + half * .09, half * (face === "goofy" ? .09 : .16), 0, Math.PI * 2); ctx.fill();
        } else if (face === "pirate") {
            ctx.fillRect(-half * .46, eyeY - half * .13, half * .32, half * .27);
            ctx.beginPath(); ctx.moveTo(-half * .3, eyeY); ctx.lineTo(half * .48, eyeY - half * .08); ctx.stroke();
            ctx.fillRect(half * .25, eyeY - half * .02, half * .1, half * .15);
        } else {
            ctx.fillRect(-half * .38, eyeY - half * .08, half * .13, half * (face === "robot" ? .22 : .18));
            ctx.fillRect(half * .25, eyeY - half * .08, half * .13, half * (face === "robot" ? .22 : .18));
            if (face === "cool") {
                ctx.strokeStyle = skin.accent; ctx.beginPath(); ctx.moveTo(-half * .52, eyeY - half * .12); ctx.lineTo(-half * .08, eyeY - half * .03); ctx.lineTo(0, eyeY - half * .12); ctx.lineTo(half * .08, eyeY - half * .03); ctx.lineTo(half * .52, eyeY - half * .12); ctx.stroke();
            }
        }

        if (!["ninja", "skull"].includes(face)) {
            ctx.strokeStyle = skin.mouthColor || ink;
            ctx.beginPath();
            if (face === "angry" || face === "serious" || face === "robot") {
                ctx.moveTo(-half * .3, half * .42); ctx.lineTo(half * .3, face === "angry" ? half * .32 : half * .42);
            } else if (face === "surprised" || face === "alien") {
                ctx.arc(0, half * .38, half * .13, 0, Math.PI * 2);
            } else if (face === "zombie") {
                ctx.moveTo(-half * .34, half * .35); ctx.lineTo(-half * .12, half * .25); ctx.lineTo(.08 * half, half * .43); ctx.lineTo(.34 * half, half * .29);
            } else {
                ctx.moveTo(-half * .32, half * .28); ctx.quadraticCurveTo(0, half * .56, half * .32, half * .28);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawSkin(ctx, skinOrId, size, time) {
        const skin = typeof skinOrId === "string" ? skins.find((item) => item.id === skinOrId) : skinOrId;
        const selected = skin || skins[0];
        const half = size / 2;
        ctx.save();
        if (selected.glow) {
            ctx.shadowColor = selected.glow;
            ctx.shadowBlur = Math.max(5, size * .22);
        }
        const gradient = ctx.createLinearGradient(-half, -half, half, half);
        gradient.addColorStop(0, selected.secondary || selected.primary);
        gradient.addColorStop(1, selected.primary);
        ctx.fillStyle = gradient;
        ctx.strokeStyle = selected.outline;
        ctx.lineWidth = Math.max(2, size * .1);
        roundedRect(ctx, -half, -half, size, size, size * .12);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
        drawPattern(ctx, selected, half, Number(time) || 0);
        drawFace(ctx, selected, half);
        ctx.restore();
    }

    window.CUBE_RUSH_SKINS = Object.freeze(skins);
    window.CUBE_RUSH_DRAW_SKIN = drawSkin;
}());
