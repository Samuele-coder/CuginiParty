(function () {
    "use strict";

    const FLOOR = 460;
    const CEILING = 80;

    const spike = (x, surface = "floor", size = 34) => ({
        type: "spike",
        x,
        y: surface === "floor" ? FLOOR : CEILING,
        direction: surface === "floor" ? "up" : "down",
        size
    });
    const block = (x, y, w, h, lethal = false) => ({ type: "block", x, y, w, h, lethal });
    const saw = (x, y, radius = 24) => ({ type: "saw", x, y, radius });
    const portal = (x, kind, value, y = 270) => ({ type: "portal", x, y, kind, value });
    const orb = (x, y, color = "yellow") => ({ type: "orb", x, y, color });
    const pad = (x, surface = "floor", color = "yellow") => ({
        type: "pad",
        x,
        y: surface === "floor" ? FLOOR : CEILING,
        surface,
        color
    });
    const checkpoint = (x) => ({ type: "checkpoint", x });

    function addSpikePattern(objects, start, count, spacing, pattern = [1]) {
        for (let i = 0; i < count; i += 1) {
            const amount = pattern[i % pattern.length];
            for (let j = 0; j < amount; j += 1) objects.push(spike(start + i * spacing + j * 35));
        }
    }

    function addAlternatingCorridor(objects, start, end, spacing, gapHeight, phase = 0) {
        let index = 0;
        for (let x = start; x < end; x += spacing) {
            const center = 270 + Math.sin((index + phase) * 1.15) * 72;
            const topHeight = Math.max(64, center - gapHeight / 2 - CEILING);
            const bottomY = center + gapHeight / 2;
            objects.push(block(x, CEILING, 78, topHeight, true));
            objects.push(block(x, bottomY, 78, FLOOR - bottomY, true));
            index += 1;
        }
    }

    function addSawSequence(objects, start, count, spacing, center = 270, amplitude = 88, radius = 23) {
        for (let index = 0; index < count; index += 1) {
            const y = center + Math.sin(index * 1.35) * amplitude;
            objects.push(saw(start + index * spacing, y, radius));
        }
    }

    function addOrbChain(objects, start, count, spacing, heights, colors = ["yellow", "pink", "blue"]) {
        for (let index = 0; index < count; index += 1) {
            objects.push(orb(
                start + index * spacing,
                heights[index % heights.length],
                colors[index % colors.length]
            ));
        }
    }

    function addAutomaticCheckpoints(objects, levelLength) {
        const obstacleGroups = [];
        const obstacles = objects
            .filter((object) => object.type === "spike" || object.type === "saw" || object.type === "block")
            .map((object) => ({
                start: object.type === "saw" ? object.x - object.radius : object.x,
                end: object.type === "block"
                    ? object.x + object.w
                    : object.type === "saw"
                        ? object.x + object.radius
                        : object.x + object.size
            }))
            .sort((a, b) => a.start - b.start);

        obstacles.forEach((obstacle) => {
            const current = obstacleGroups[obstacleGroups.length - 1];
            if (current && obstacle.start <= current.end + 110) {
                current.end = Math.max(current.end, obstacle.end);
            } else {
                obstacleGroups.push({ ...obstacle });
            }
        });

        obstacleGroups.forEach((group, index) => {
            const nextGroup = obstacleGroups[index + 1];
            const preferredX = group.end + 90;
            const latestSafeX = nextGroup ? nextGroup.start - 70 : levelLength - 220;
            const x = Math.min(preferredX, latestSafeX);
            if (x >= group.end + 35 && x > 300 && x < levelLength - 120) {
                objects.push(checkpoint(Math.round(x)));
            }
        });
    }

    function finish(level) {
        level.objects.push({ type: "finish", x: level.length });
        level.objects.sort((a, b) => a.x - b.x);
        return Object.freeze(level);
    }

    function buildPrismaCoast() {
        const objects = [];
        addSpikePattern(objects, 900, 10, 560, [1, 1, 2, 1, 1]);
        objects.push(
            block(2050, 380, 190, 28),
            spike(2340),
            pad(3060, "floor", "yellow"),
            orb(3390, 325, "yellow"),
            block(3740, 350, 230, 28),
            spike(4050), spike(4085),
            orb(4930, 310, "pink"),
            pad(5570, "floor", "yellow"),
            block(5860, 348, 250, 28),
            spike(6310), spike(6870),
            portal(7700, "mode", "ship")
        );
        addAlternatingCorridor(objects, 8200, 12400, 630, 220, 0);
        objects.push(
            portal(12700, "mode", "cube"),
            pad(13400, "floor", "pink"),
            spike(14020), spike(14055),
            block(14600, 365, 220, 25),
            orb(15020, 305, "yellow"),
            spike(15600),
            pad(16250, "floor", "yellow"),
            spike(17020), spike(17055)
        );
        addAutomaticCheckpoints(objects, 18000);
        return finish({
            id: "prisma-coast",
            name: "Prisma Coast",
            difficulty: "FACILE",
            description: "Salti leggibili, orb semplici e un primo volo tra correnti marine.",
            length: 18000,
            estimatedDuration: "60–74 s",
            bpm: 118,
            baseSpeed: 275,
            startMode: "cube",
            palette: {
                skyTop: "#48c9dc", skyBottom: "#bff5df", far: "#76d8cc", near: "#087f8c",
                ground: "#075f6a", grid: "rgba(255,255,255,.18)", accent: "#ffdc62", danger: "#ff6548", player: "#ffffff", ink: "#123e4d"
            },
            objects
        });
    }

    function buildFoundryBeat() {
        const objects = [];
        addSpikePattern(objects, 760, 9, 500, [1, 2, 1, 2]);
        objects.push(
            pad(2500, "floor", "yellow"),
            block(2790, 350, 230, 28),
            orb(3150, 288, "pink"),
            spike(3690), spike(3725),
            portal(5400, "speed", 1.2),
            portal(6200, "mode", "ship")
        );
        addAlternatingCorridor(objects, 6680, 10600, 545, 190, 1);
        objects.push(
            portal(10900, "speed", 1),
            portal(11200, "mode", "ball"),
            spike(12000), spike(12550, "ceiling"),
            spike(13100), spike(13650, "ceiling"),
            portal(14150, "gravity", -1),
            spike(14700, "ceiling"), spike(15250),
            orb(15800, 270, "blue"),
            spike(16400, "ceiling"),
            portal(17100, "mode", "cube"),
            portal(17800, "speed", 1.35),
            pad(18350, "floor", "yellow"),
            spike(19000), spike(19035),
            block(19700, 355, 210, 26),
            orb(20060, 300, "yellow"),
            spike(20700), spike(21200), spike(21235),
            portal(21800, "speed", 1),
            pad(22500, "floor", "pink"),
            spike(23200), spike(23235)
        );
        addAutomaticCheckpoints(objects, 24000);
        return finish({
            id: "foundry-beat",
            name: "Foundry Beat",
            difficulty: "MEDIO",
            description: "Calore, cambi di gravità e passaggi meccanici scanditi dal beat.",
            length: 24000,
            estimatedDuration: "72–90 s",
            bpm: 132,
            baseSpeed: 280,
            startMode: "cube",
            palette: {
                skyTop: "#2b2d31", skyBottom: "#d85b2a", far: "#73351f", near: "#2a2522",
                ground: "#18191b", grid: "rgba(255,222,165,.12)", accent: "#ffc857", danger: "#f0442b", player: "#fff1cf", ink: "#552413"
            },
            objects
        });
    }

    function buildVoltageCore() {
        const objects = [];
        addSpikePattern(objects, 720, 9, 455, [1, 2, 2, 1, 3]);
        objects.push(
            pad(2380, "floor", "yellow"),
            orb(2700, 288, "yellow"),
            block(3180, 350, 185, 27),
            spike(3600), spike(3635),
            portal(5000, "speed", 1.35),
            portal(5750, "mode", "ship")
        );
        addAlternatingCorridor(objects, 6200, 11000, 480, 168, 2);
        objects.push(
            portal(11250, "speed", 1.05),
            portal(11520, "mode", "ball"),
            spike(12100), spike(12520, "ceiling"), spike(12940), spike(13360, "ceiling"),
            portal(13800, "gravity", -1),
            saw(14400, 270, 30),
            spike(14900, "ceiling"), spike(15350),
            orb(15850, 275, "blue"),
            spike(16400, "ceiling"),
            portal(17000, "mode", "wave"),
            portal(17120, "speed", 1.15)
        );
        addAlternatingCorridor(objects, 17500, 24800, 430, 150, 3);
        objects.push(
            portal(25100, "speed", 1),
            portal(25300, "mode", "cube"),
            pad(26000, "floor", "yellow"),
            spike(26500), spike(26535),
            orb(27000, 300, "pink"),
            block(27400, 345, 220, 28),
            spike(27920), spike(28380), spike(28415),
            pad(28900, "floor", "yellow"),
            spike(29500), spike(29535), spike(29570)
        );
        addAutomaticCheckpoints(objects, 30200);
        return finish({
            id: "voltage-core",
            name: "Voltage Core",
            difficulty: "DIFFICILE",
            description: "Quattro forme, corridoi stretti e cambi di velocità senza sorprese invisibili.",
            length: 30200,
            estimatedDuration: "84–108 s",
            bpm: 148,
            baseSpeed: 285,
            startMode: "cube",
            palette: {
                skyTop: "#070a0e", skyBottom: "#123c5e", far: "#12352c", near: "#071510",
                ground: "#05090c", grid: "rgba(166,255,57,.12)", accent: "#a6ff39", danger: "#b31330", player: "#f6f8ff", ink: "#1e63d5"
            },
            objects
        });
    }

    function buildObsidianSwitch() {
        const objects = [];
        addSpikePattern(objects, 520, 14, 270, [1, 2, 1, 2, 2]);
        objects.push(
            portal(4350, "speed", .72),
            block(4800, 360, 160, 30),
            pad(5140, "floor", "pink"),
            block(5380, 345, 170, 30),
            block(5660, 325, 170, 30),
            block(5940, 355, 170, 30),
            block(6220, 335, 170, 30),
            portal(7100, "mode", "ball"),
            portal(7350, "gravity", -1)
        );
        addOrbChain(objects, 7600, 7, 250, [240, 315, 265, 350], ["blue", "pink", "blue"]);
        objects.push(
            spike(9500, "ceiling"), spike(9535, "ceiling"),
            spike(10050), spike(10085),
            portal(10600, "gravity", 1),
            portal(11100, "mode", "ship"),
            portal(11300, "speed", 1.4)
        );
        addSawSequence(objects, 11700, 8, 430, 270, 128, 25);
        addAlternatingCorridor(objects, 11800, 15100, 430, 142, 1);
        objects.push(
            portal(15600, "speed", .75),
            portal(16000, "mode", "cube"),
            portal(16200, "speed", 1.45),
            pad(16500, "floor", "yellow")
        );
        addSpikePattern(objects, 17000, 15, 330, [2, 1, 2, 3]);
        objects.push(
            block(22100, 340, 210, 28),
            orb(22500, 290, "yellow"),
            portal(23100, "mode", "wave"),
            portal(23300, "speed", 1.35)
        );
        addAlternatingCorridor(objects, 23700, 30400, 360, 112, 2);
        objects.push(
            portal(30800, "speed", .82),
            portal(31300, "mode", "cube"),
            portal(31500, "speed", 1.5),
            pad(31800, "floor", "pink")
        );
        addSpikePattern(objects, 32200, 9, 350, [1, 2, 1, 2]);
        objects.push(spike(35550), spike(35585), spike(35620));
        addAutomaticCheckpoints(objects, 36000);
        return finish({
            id: "obsidian-switch",
            name: "Obsidian Switch",
            difficulty: "DIFFICILE",
            description: "Salti stretti, corridoi invertiti e cambi di forma senza pause.",
            length: 36000,
            estimatedDuration: "96–122 s",
            bpm: 154,
            baseSpeed: 300,
            startMode: "cube",
            palette: {
                skyTop: "#111329", skyBottom: "#45235f", far: "#28193e", near: "#121023",
                ground: "#090a18", grid: "rgba(236,191,255,.14)", accent: "#f0b429", danger: "#ff4f7b", player: "#fff7e8", ink: "#321b63"
            },
            objects
        });
    }

    function buildNeonCathedral() {
        const objects = [];
        addSpikePattern(objects, 520, 16, 300, [1, 2, 2, 1, 3]);
        objects.push(
            portal(3950, "speed", .7),
            pad(4400, "floor", "yellow"),
            block(5200, 350, 190, 30),
            orb(5550, 292, "pink"),
            spike(6000), spike(6035),
            portal(6800, "mode", "ship"),
            portal(7000, "speed", 1.35)
        );
        addOrbChain(objects, 4680, 4, 190, [310, 275, 335, 295], ["yellow", "pink", "yellow"]);
        addSawSequence(objects, 7400, 10, 360, 270, 148, 25);
        addAlternatingCorridor(objects, 7500, 11100, 360, 132, 0);
        objects.push(
            portal(11600, "mode", "ball"),
            portal(11900, "gravity", -1)
        );
        addOrbChain(objects, 12300, 8, 250, [235, 320, 260, 345], ["blue", "pink", "yellow"]);
        objects.push(
            spike(14500, "ceiling"), spike(14535, "ceiling"),
            spike(15100), spike(15135),
            portal(15700, "gravity", 1),
            portal(16200, "mode", "wave"),
            portal(16400, "speed", 1.2)
        );
        addAlternatingCorridor(objects, 16800, 26300, 330, 94, 2);
        objects.push(
            portal(26700, "speed", 1.5),
            portal(27400, "mode", "cube"),
            pad(27700, "floor", "yellow")
        );
        addSpikePattern(objects, 28100, 18, 350, [2, 1, 2, 3]);
        objects.push(
            portal(34900, "speed", .7),
            portal(35400, "mode", "ship"),
            portal(35600, "speed", 1.45)
        );
        addSawSequence(objects, 36000, 7, 390, 270, 135, 26);
        addAlternatingCorridor(objects, 36000, 38300, 390, 122, 1);
        addAutomaticCheckpoints(objects, 39000);
        return finish({
            id: "neon-cathedral",
            name: "Neon Cathedral",
            difficulty: "ESTREMO",
            description: "Voli lunghi, gravità ribaltata e corridoi neon con margine minimo.",
            length: 39000,
            estimatedDuration: "104–132 s",
            bpm: 166,
            baseSpeed: 310,
            startMode: "cube",
            palette: {
                skyTop: "#071c2d", skyBottom: "#087f8c", far: "#163b55", near: "#062431",
                ground: "#03151e", grid: "rgba(103,247,255,.16)", accent: "#f5e960", danger: "#ff4e8a", player: "#effdff", ink: "#075467"
            },
            objects
        });
    }

    function buildApexProtocol() {
        const objects = [];
        addSpikePattern(objects, 480, 19, 270, [1, 2, 2, 1, 3]);
        objects.push(
            portal(3600, "speed", 1.35),
            block(6100, 350, 180, 30),
            orb(6450, 295, "pink"),
            spike(6900), spike(6935),
            portal(7300, "mode", "ship"),
            portal(7500, "speed", 1.5)
        );
        addSawSequence(objects, 7900, 12, 340, 270, 150, 24);
        addAlternatingCorridor(objects, 8000, 12100, 340, 108, 3);
        objects.push(
            portal(12600, "mode", "ball"),
            portal(12900, "gravity", -1)
        );
        addOrbChain(objects, 13300, 9, 230, [235, 320, 255, 340], ["blue", "pink", "blue"]);
        objects.push(
            spike(15500, "ceiling"), spike(15535, "ceiling"),
            spike(16100), spike(16135),
            portal(16800, "gravity", 1),
            portal(17300, "mode", "cube"),
            portal(17500, "speed", 1.45),
            pad(17800, "floor", "yellow")
        );
        addSpikePattern(objects, 18200, 18, 300, [2, 1, 2, 3, 1]);
        objects.push(
            portal(24000, "mode", "wave"),
            portal(24200, "speed", 1.35)
        );
        addAlternatingCorridor(objects, 24600, 33700, 290, 88, 1);
        objects.push(
            portal(34200, "speed", .7),
            portal(34800, "mode", "ship"),
            portal(35000, "speed", 1.5)
        );
        addSawSequence(objects, 35400, 12, 360, 270, 155, 27);
        addAlternatingCorridor(objects, 35500, 39800, 360, 112, 2);
        objects.push(
            portal(40300, "mode", "cube"),
            portal(40500, "speed", 1.5),
            pad(40800, "floor", "pink")
        );
        addSpikePattern(objects, 41200, 10, 360, [2, 1, 2, 3]);
        objects.push(spike(44800), spike(44835), spike(44870), spike(44905), spike(44940));
        addAutomaticCheckpoints(objects, 45500);
        return finish({
            id: "apex-protocol",
            name: "Apex Protocol",
            difficulty: "INSANE",
            description: "Il test finale: velocità, quattro forme e corridoi quasi senza margine.",
            length: 45500,
            estimatedDuration: "120–150 s",
            bpm: 178,
            baseSpeed: 320,
            startMode: "cube",
            palette: {
                skyTop: "#080b12", skyBottom: "#24245c", far: "#1a1e43", near: "#080a17",
                ground: "#04050c", grid: "rgba(255,87,214,.15)", accent: "#61f4de", danger: "#ff365e", player: "#ffffff", ink: "#3325aa"
            },
            objects
        });
    }

    window.CUBE_RUSH_LEVELS = Object.freeze([
        buildPrismaCoast(),
        buildFoundryBeat(),
        buildVoltageCore(),
        buildObsidianSwitch(),
        buildNeonCathedral(),
        buildApexProtocol()
    ]);
    window.CUBE_RUSH_WORLD = Object.freeze({ width: 960, height: 540, floor: FLOOR, ceiling: CEILING });
}());
