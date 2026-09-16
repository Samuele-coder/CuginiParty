(function () {
    "use strict";

    const ROOM_W = 720;
    const ROOM_H = 420;
    const WALL = 18;

    const room = (id, gx, gy, name, accent = "#263748") => ({
        id, name, accent, x: gx * ROOM_W, y: gy * ROOM_H, w: ROOM_W, h: ROOM_H
    });

    function connect(a, b, offset = .5, width = 104) {
        return { a, b, offset, width };
    }

    function point(rooms, roomId, fx, fy) {
        const target = rooms.find(item => item.id === roomId);
        return { x: target.x + target.w * fx, y: target.y + target.h * fy };
    }

    function furniture(rooms, roomId, fx, fy, w, h, type, blocksSight = true) {
        const target = rooms.find(item => item.id === roomId);
        return {
            roomId,
            x: target.x + target.w * fx - w / 2,
            y: target.y + target.h * fy - h / 2,
            w, h, type, solid: true, blocksSight
        };
    }

    function decor(rooms, roomId, fx, fy, w, h, type) {
        return { ...furniture(rooms, roomId, fx, fy, w, h, type, false), solid: false };
    }

    function camera(rooms, roomId, fx, fy, angle, range = 300, sweep = .35, sweepSpeed = .72) {
        return {
            id: `camera-${roomId}-${fx}-${fy}`,
            roomId,
            ...point(rooms, roomId, fx, fy),
            angle,
            range,
            halfAngle: .42,
            sweep,
            sweepSpeed
        };
    }

    function edgePieces(start, end, openings) {
        const sorted = openings
            .map(opening => ({ start: Math.max(start, opening.start), end: Math.min(end, opening.end) }))
            .filter(opening => opening.end > opening.start)
            .sort((left, right) => left.start - right.start);
        const pieces = [];
        let cursor = start;
        sorted.forEach(opening => {
            if (opening.start > cursor) pieces.push([cursor, opening.start]);
            cursor = Math.max(cursor, opening.end);
        });
        if (cursor < end) pieces.push([cursor, end]);
        return pieces;
    }

    function finalize(config) {
        const roomsById = new Map(config.rooms.map(item => [item.id, item]));
        const doors = config.connections.map((connection, index) => {
            const a = roomsById.get(connection.a);
            const b = roomsById.get(connection.b);
            if (!a || !b) throw new Error(`Porta non valida: ${connection.a}/${connection.b}`);
            const horizontalNeighbours = a.y === b.y && Math.abs(a.x - b.x) === ROOM_W;
            if (horizontalNeighbours) {
                const left = a.x < b.x ? a : b;
                return {
                    id: `door-${index}`,
                    a: connection.a,
                    b: connection.b,
                    axis: "vertical",
                    x: left.x + left.w - WALL / 2,
                    y: left.y + left.h * connection.offset - connection.width / 2,
                    w: WALL,
                    h: connection.width
                };
            }
            const verticalNeighbours = a.x === b.x && Math.abs(a.y - b.y) === ROOM_H;
            if (!verticalNeighbours) throw new Error(`Le stanze ${a.id}/${b.id} non sono adiacenti`);
            const top = a.y < b.y ? a : b;
            return {
                id: `door-${index}`,
                a: connection.a,
                b: connection.b,
                axis: "horizontal",
                x: top.x + top.w * connection.offset - connection.width / 2,
                y: top.y + top.h - WALL / 2,
                w: connection.width,
                h: WALL
            };
        });

        const walls = [];
        config.rooms.forEach(current => {
            const topOpenings = [];
            const bottomOpenings = [];
            const leftOpenings = [];
            const rightOpenings = [];
            doors.forEach(door => {
                if (door.axis === "horizontal" && Math.abs(door.y - (current.y - WALL / 2)) < 2) {
                    topOpenings.push({ start: door.x, end: door.x + door.w });
                }
                if (door.axis === "horizontal" && Math.abs(door.y - (current.y + current.h - WALL / 2)) < 2) {
                    bottomOpenings.push({ start: door.x, end: door.x + door.w });
                }
                if (door.axis === "vertical" && Math.abs(door.x - (current.x - WALL / 2)) < 2) {
                    leftOpenings.push({ start: door.y, end: door.y + door.h });
                }
                if (door.axis === "vertical" && Math.abs(door.x - (current.x + current.w - WALL / 2)) < 2) {
                    rightOpenings.push({ start: door.y, end: door.y + door.h });
                }
            });
            edgePieces(current.x, current.x + current.w, topOpenings).forEach(([start, end]) => walls.push({ x: start, y: current.y - WALL / 2, w: end - start, h: WALL, roomId: current.id }));
            edgePieces(current.x, current.x + current.w, bottomOpenings).forEach(([start, end]) => walls.push({ x: start, y: current.y + current.h - WALL / 2, w: end - start, h: WALL, roomId: current.id }));
            edgePieces(current.y, current.y + current.h, leftOpenings).forEach(([start, end]) => walls.push({ x: current.x - WALL / 2, y: start, w: WALL, h: end - start, roomId: current.id }));
            edgePieces(current.y, current.y + current.h, rightOpenings).forEach(([start, end]) => walls.push({ x: current.x + current.w - WALL / 2, y: start, w: WALL, h: end - start, roomId: current.id }));
        });

        const allRects = config.rooms;
        const minX = Math.min(...allRects.map(item => item.x)) - 80;
        const minY = Math.min(...allRects.map(item => item.y)) - 80;
        const maxX = Math.max(...allRects.map(item => item.x + item.w)) + 80;
        const maxY = Math.max(...allRects.map(item => item.y + item.h)) + 80;
        const navigationRects = walls.concat(config.furniture.filter(item => item.solid));
        const circleClear = (candidate, radius = 24) => {
            const insideRoom = config.rooms.some(item => candidate.x > item.x + radius && candidate.x < item.x + item.w - radius && candidate.y > item.y + radius && candidate.y < item.y + item.h - radius);
            if (!insideRoom) return false;
            return !navigationRects.some(rect => {
                const nearestX = Math.max(rect.x, Math.min(candidate.x, rect.x + rect.w));
                const nearestY = Math.max(rect.y, Math.min(candidate.y, rect.y + rect.h));
                return (candidate.x - nearestX) ** 2 + (candidate.y - nearestY) ** 2 < radius ** 2;
            });
        };
        const nearestClearPoint = original => {
            if (circleClear(original)) return { ...original };
            const sourceRoom = config.rooms.find(item => original.x >= item.x && original.x <= item.x + item.w && original.y >= item.y && original.y <= item.y + item.h);
            for (let ring = 28; ring <= 168; ring += 28) {
                for (let step = 0; step < 16; step += 1) {
                    const angle = step / 16 * Math.PI * 2;
                    const candidate = { x: original.x + Math.cos(angle) * ring, y: original.y + Math.sin(angle) * ring };
                    const sameRoom = !sourceRoom || candidate.x >= sourceRoom.x && candidate.x <= sourceRoom.x + sourceRoom.w && candidate.y >= sourceRoom.y && candidate.y <= sourceRoom.y + sourceRoom.h;
                    if (sameRoom && circleClear(candidate)) return candidate;
                }
            }
            return { ...original };
        };
        const policeSpawns = config.policeSpawns.map(spawn => ({
            ...nearestClearPoint(spawn),
            route: spawn.route.map(nearestClearPoint)
        }));
        return { ...config, policeSpawns, doors, walls, bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
    }

    function smallOffice() {
        const rooms = [
            room("lobby", 0, 1, "Ingresso", "#27404b"),
            room("office", 1, 1, "Open Space", "#314052"),
            room("archive", 2, 1, "Archivio", "#3b3540"),
            room("security", 1, 0, "Sicurezza", "#26394a"),
            room("vault", 1, 2, "Contabilità", "#40382f")
        ];
        const p = (id, x, y) => point(rooms, id, x, y);
        return finalize({
            id: "piccolo-ufficio",
            name: "Piccolo ufficio",
            difficulty: "Facile",
            description: "Cinque stanze, percorsi leggibili e due casseforti.",
            minPolice: 1,
            maxPolice: 3,
            rooms,
            connections: [
                connect("lobby", "office", .55), connect("office", "archive", .43),
                connect("security", "office", .5), connect("office", "vault", .58)
            ],
            spawn: p("lobby", .14, .52),
            exit: { ...p("lobby", .08, .52), radius: 42 },
            safes: [
                { id: "safe-office", roomId: "office", ...p("office", .77, .25), value: [1600, 2400] },
                { id: "safe-vault", roomId: "vault", ...p("vault", .73, .66), value: [3000, 4300] }
            ],
            cameras: [
                camera(rooms, "office", .9, .12, 2.55, 280, .32, .66)
            ],
            furniture: [
                decor(rooms, "lobby", .52, .52, 360, 210, "rug"),
                furniture(rooms, "lobby", .52, .35, 170, 54, "desk"),
                furniture(rooms, "lobby", .52, .72, 105, 58, "sofa", false),
                furniture(rooms, "lobby", .28, .22, 48, 48, "plant"),
                furniture(rooms, "lobby", .83, .78, 48, 48, "plant"),
                furniture(rooms, "lobby", .68, .35, 42, 42, "chair", false),
                decor(rooms, "lobby", .4, .34, 36, 20, "papers"),
                decor(rooms, "office", .5, .5, 570, 310, "carpet"),
                furniture(rooms, "office", .3, .3, 180, 68, "desk"),
                furniture(rooms, "office", .38, .72, 190, 62, "desk"),
                furniture(rooms, "office", .66, .58, 58, 150, "cabinet"),
                furniture(rooms, "office", .3, .48, 42, 42, "chair", false),
                furniture(rooms, "office", .38, .87, 42, 42, "chair", false),
                furniture(rooms, "office", .86, .76, 62, 92, "filing"),
                decor(rooms, "office", .3, .28, 46, 24, "monitor"),
                decor(rooms, "office", .38, .7, 34, 22, "papers"),
                furniture(rooms, "archive", .22, .26, 72, 170, "shelf"),
                furniture(rooms, "archive", .5, .7, 210, 60, "shelf"),
                furniture(rooms, "archive", .78, .34, 68, 180, "shelf"),
                furniture(rooms, "archive", .18, .79, 62, 62, "archive-box", false),
                furniture(rooms, "archive", .82, .78, 62, 62, "archive-box", false),
                decor(rooms, "archive", .5, .35, 260, 34, "floor-mark"),
                furniture(rooms, "security", .48, .45, 220, 72, "console"),
                furniture(rooms, "security", .78, .72, 64, 64, "locker"),
                furniture(rooms, "security", .22, .27, 72, 104, "server"),
                furniture(rooms, "security", .48, .68, 44, 44, "chair", false),
                decor(rooms, "security", .48, .42, 120, 28, "screens"),
                decor(rooms, "security", .72, .2, 126, 20, "warning-line"),
                decor(rooms, "vault", .5, .52, 500, 270, "vault-floor"),
                furniture(rooms, "vault", .35, .38, 170, 76, "table"),
                furniture(rooms, "vault", .26, .78, 70, 70, "crate"),
                furniture(rooms, "vault", .82, .25, 68, 110, "filing"),
                furniture(rooms, "vault", .54, .78, 74, 74, "crate"),
                decor(rooms, "vault", .35, .36, 70, 30, "documents")
            ],
            policeSpawns: [
                { ...p("office", .52, .45), route: [p("office", .25, .2), p("office", .78, .2), p("office", .72, .78), p("office", .25, .75)] },
                { ...p("archive", .52, .48), route: [p("archive", .18, .18), p("archive", .82, .2), p("archive", .78, .78), p("archive", .18, .76)] },
                { ...p("security", .28, .62), route: [p("security", .22, .25), p("security", .76, .28), p("security", .72, .75), p("office", .52, .16)] }
            ]
        });
    }

    function bank() {
        const rooms = [
            room("lobby", 0, 1, "Atrio", "#2c3e46"), room("hall", 1, 1, "Corridoio centrale", "#283746"),
            room("office", 2, 1, "Uffici", "#343e4c"), room("security", 1, 0, "Sicurezza", "#24384c"),
            room("archive", 2, 0, "Archivio clienti", "#3a3540"), room("vault", 1, 2, "Caveau", "#443b2e"),
            room("records", 2, 2, "Deposito valori", "#303c42")
        ];
        const p = (id, x, y) => point(rooms, id, x, y);
        return finalize({
            id: "banca",
            name: "Banca",
            difficulty: "Media",
            description: "Sette stanze, tre obiettivi e pattuglie incrociate.",
            minPolice: 2,
            maxPolice: 5,
            rooms,
            connections: [
                connect("lobby", "hall", .5), connect("hall", "office", .42), connect("security", "hall", .38),
                connect("security", "archive", .62), connect("archive", "office", .5), connect("hall", "vault", .62),
                connect("vault", "records", .35), connect("office", "records", .67)
            ],
            spawn: p("lobby", .12, .5),
            exit: { ...p("lobby", .07, .5), radius: 42 },
            safes: [
                { id: "safe-office", roomId: "office", ...p("office", .78, .23), value: [2100, 3200] },
                { id: "safe-vault", roomId: "vault", ...p("vault", .52, .48), value: [4400, 6200] },
                { id: "safe-records", roomId: "records", ...p("records", .78, .7), value: [3000, 4700] }
            ],
            cameras: [
                camera(rooms, "hall", .88, .12, 2.48, 310, .38, .72),
                camera(rooms, "security", .88, .14, 2.7, 280, .3, .64),
                camera(rooms, "vault", .88, .14, 2.58, 320, .42, .78)
            ],
            furniture: [
                decor(rooms, "lobby", .5, .53, 470, 270, "rug"),
                furniture(rooms, "lobby", .5, .32, 230, 62, "counter"), furniture(rooms, "lobby", .5, .75, 190, 54, "sofa", false),
                furniture(rooms, "lobby", .2, .24, 52, 52, "plant"), furniture(rooms, "lobby", .82, .76, 52, 52, "plant"),
                furniture(rooms, "lobby", .32, .75, 48, 48, "chair", false), decor(rooms, "lobby", .5, .3, 62, 26, "terminal"),
                decor(rooms, "hall", .5, .5, 600, 300, "hall-floor"),
                furniture(rooms, "hall", .32, .5, 70, 200, "divider"), furniture(rooms, "hall", .72, .3, 80, 80, "plant"),
                furniture(rooms, "hall", .72, .73, 120, 42, "bench", false), decor(rooms, "hall", .52, .2, 130, 18, "direction-sign"),
                decor(rooms, "office", .5, .5, 590, 310, "carpet"),
                furniture(rooms, "office", .3, .3, 190, 66, "desk"), furniture(rooms, "office", .35, .72, 200, 66, "desk"),
                furniture(rooms, "office", .7, .56, 70, 170, "cabinet"), furniture(rooms, "office", .3, .48, 44, 44, "chair", false),
                furniture(rooms, "office", .35, .88, 44, 44, "chair", false), furniture(rooms, "office", .86, .72, 70, 94, "filing"),
                decor(rooms, "office", .3, .28, 48, 24, "monitor"), decor(rooms, "office", .35, .7, 42, 22, "papers"),
                furniture(rooms, "security", .5, .46, 250, 72, "console"),
                furniture(rooms, "security", .2, .75, 64, 64, "locker"), furniture(rooms, "security", .8, .26, 72, 112, "server"),
                furniture(rooms, "security", .5, .68, 44, 44, "chair", false), decor(rooms, "security", .5, .43, 142, 28, "screens"),
                furniture(rooms, "archive", .22, .48, 70, 230, "shelf"),
                furniture(rooms, "archive", .52, .25, 220, 58, "shelf"), furniture(rooms, "archive", .76, .67, 72, 190, "shelf"),
                furniture(rooms, "archive", .47, .76, 64, 64, "archive-box", false), decor(rooms, "archive", .52, .48, 250, 28, "floor-mark"),
                decor(rooms, "vault", .5, .5, 520, 300, "vault-floor"), furniture(rooms, "vault", .24, .32, 86, 86, "crate"),
                furniture(rooms, "vault", .76, .72, 90, 90, "crate"), furniture(rooms, "vault", .18, .73, 72, 112, "locker"),
                furniture(rooms, "vault", .82, .28, 72, 112, "locker"), decor(rooms, "vault", .5, .2, 180, 18, "warning-line"),
                furniture(rooms, "records", .33, .34, 220, 65, "table"), furniture(rooms, "records", .36, .75, 190, 60, "shelf"),
                furniture(rooms, "records", .72, .3, 84, 84, "deposit-box"), furniture(rooms, "records", .72, .52, 84, 84, "deposit-box"),
                decor(rooms, "records", .33, .32, 92, 30, "documents"), decor(rooms, "records", .5, .52, 510, 270, "records-floor")
            ],
            policeSpawns: [
                { ...p("hall", .55, .5), route: [p("hall", .18, .2), p("hall", .82, .2), p("office", .18, .48), p("hall", .82, .78), p("hall", .2, .78)] },
                { ...p("security", .28, .3), route: [p("security", .2, .2), p("security", .78, .2), p("archive", .2, .35), p("archive", .72, .72)] },
                { ...p("vault", .72, .25), route: [p("vault", .18, .22), p("vault", .8, .22), p("vault", .8, .78), p("vault", .2, .75)] },
                { ...p("office", .5, .65), route: [p("office", .2, .2), p("office", .8, .38), p("records", .75, .2), p("records", .22, .75)] },
                { ...p("archive", .52, .48), route: [p("archive", .18, .75), p("archive", .82, .75), p("security", .75, .55), p("archive", .55, .18)] }
            ]
        });
    }

    function nightComplex() {
        const rooms = [
            room("entry", 0, 1, "Ingresso merci", "#263b42"), room("west", 1, 1, "Corridoio ovest", "#293845"), room("center", 2, 1, "Atrio interno", "#303a47"),
            room("lab", 0, 0, "Laboratorio", "#263746"), room("control", 1, 0, "Sala controllo", "#26394d"), room("archive", 2, 0, "Archivio segreto", "#3b3340"),
            room("storage", 0, 2, "Magazzino", "#3b3b35"), room("vault", 1, 2, "Caveau centrale", "#453b2d"), room("server", 2, 2, "Sala server", "#253b43")
        ];
        const p = (id, x, y) => point(rooms, id, x, y);
        return finalize({
            id: "complesso-notturno",
            name: "Complesso notturno",
            difficulty: "Difficile",
            description: "Nove stanze, quattro casseforti e percorsi alternativi.",
            minPolice: 3,
            maxPolice: 6,
            rooms,
            connections: [
                connect("entry", "west", .5), connect("west", "center", .32), connect("lab", "control", .64), connect("control", "archive", .36),
                connect("lab", "entry", .34), connect("control", "west", .66), connect("archive", "center", .44), connect("entry", "storage", .68),
                connect("west", "vault", .38), connect("center", "server", .72), connect("storage", "vault", .42), connect("vault", "server", .65)
            ],
            spawn: p("entry", .12, .48),
            exit: { ...p("entry", .07, .48), radius: 42 },
            safes: [
                { id: "safe-lab", roomId: "lab", ...p("lab", .74, .24), value: [2600, 3900] },
                { id: "safe-archive", roomId: "archive", ...p("archive", .77, .68), value: [3500, 5200] },
                { id: "safe-vault", roomId: "vault", ...p("vault", .52, .5), value: [5600, 7600] },
                { id: "safe-server", roomId: "server", ...p("server", .76, .22), value: [4200, 6100] }
            ],
            cameras: [
                camera(rooms, "west", .9, .13, 2.55, 300, .4, .7),
                camera(rooms, "control", .9, .14, 2.72, 290, .34, .64),
                camera(rooms, "archive", .1, .14, .48, 310, .4, .76),
                camera(rooms, "vault", .9, .14, 2.5, 330, .45, .82),
                camera(rooms, "server", .1, .84, -.52, 320, .38, .68)
            ],
            furniture: [
                decor(rooms, "entry", .5, .52, 520, 290, "loading-floor"), furniture(rooms, "entry", .48, .28, 190, 66, "counter"),
                furniture(rooms, "entry", .38, .76, 90, 90, "crate"), furniture(rooms, "entry", .72, .74, 96, 72, "pallet", false),
                furniture(rooms, "entry", .82, .24, 52, 52, "plant"), decor(rooms, "entry", .48, .26, 56, 24, "terminal"),
                decor(rooms, "west", .5, .5, 570, 300, "hall-floor"), furniture(rooms, "west", .5, .5, 70, 220, "divider"),
                furniture(rooms, "west", .2, .25, 120, 42, "bench", false), furniture(rooms, "west", .8, .76, 120, 42, "bench", false),
                decor(rooms, "west", .5, .2, 150, 18, "direction-sign"), decor(rooms, "center", .5, .5, 460, 260, "rug"),
                furniture(rooms, "center", .28, .35, 90, 90, "plant"), furniture(rooms, "center", .7, .68, 170, 64, "sofa", false),
                furniture(rooms, "center", .75, .28, 110, 46, "bench", false), furniture(rooms, "center", .24, .76, 52, 52, "plant"),
                furniture(rooms, "lab", .3, .3, 210, 70, "lab-table"), furniture(rooms, "lab", .32, .7, 210, 70, "lab-table"),
                furniture(rooms, "lab", .72, .58, 82, 150, "chemical-cabinet"), furniture(rooms, "lab", .3, .48, 44, 44, "stool", false),
                furniture(rooms, "lab", .32, .87, 44, 44, "stool", false), decor(rooms, "lab", .3, .28, 96, 28, "lab-glass"),
                decor(rooms, "lab", .5, .5, 560, 300, "lab-floor"), furniture(rooms, "control", .5, .35, 260, 72, "console"),
                furniture(rooms, "control", .22, .75, 70, 70, "locker"), furniture(rooms, "control", .8, .72, 72, 112, "server"),
                furniture(rooms, "control", .5, .59, 46, 46, "chair", false), decor(rooms, "control", .5, .32, 170, 30, "screens"),
                decor(rooms, "control", .5, .72, 500, 22, "cable-run"), furniture(rooms, "archive", .2, .3, 66, 180, "shelf"),
                furniture(rooms, "archive", .5, .72, 230, 58, "shelf"), furniture(rooms, "archive", .78, .32, 70, 180, "shelf"),
                furniture(rooms, "archive", .22, .77, 62, 62, "archive-box", false), decor(rooms, "archive", .52, .43, 280, 30, "floor-mark"),
                decor(rooms, "storage", .5, .5, 590, 310, "loading-floor"), furniture(rooms, "storage", .25, .3, 100, 100, "crate"),
                furniture(rooms, "storage", .68, .3, 100, 100, "crate"), furniture(rooms, "storage", .48, .72, 230, 70, "shelf"),
                furniture(rooms, "storage", .82, .72, 92, 72, "pallet", false), furniture(rooms, "storage", .18, .72, 62, 92, "trolley", false),
                decor(rooms, "vault", .5, .5, 520, 310, "vault-floor"), furniture(rooms, "vault", .22, .5, 85, 190, "locker"),
                furniture(rooms, "vault", .78, .5, 85, 190, "locker"), furniture(rooms, "vault", .5, .22, 96, 72, "deposit-box"),
                furniture(rooms, "vault", .5, .8, 96, 72, "deposit-box"), decor(rooms, "vault", .5, .5, 210, 20, "warning-line"),
                decor(rooms, "server", .5, .5, 560, 300, "server-floor"), furniture(rooms, "server", .28, .48, 72, 230, "server"),
                furniture(rooms, "server", .56, .62, 72, 210, "server"), furniture(rooms, "server", .84, .68, 72, 190, "server"),
                furniture(rooms, "server", .48, .22, 120, 52, "console"), decor(rooms, "server", .5, .5, 440, 20, "cable-run")
            ],
            policeSpawns: [
                { ...p("west", .3, .3), route: [p("west", .18, .2), p("west", .8, .2), p("center", .2, .25), p("center", .75, .75), p("west", .25, .78)] },
                { ...p("control", .72, .3), route: [p("control", .18, .2), p("control", .78, .2), p("archive", .25, .28), p("archive", .78, .72)] },
                { ...p("vault", .5, .22), route: [p("vault", .2, .2), p("vault", .8, .2), p("server", .2, .72), p("vault", .75, .78), p("storage", .25, .72)] },
                { ...p("lab", .42, .52), route: [p("lab", .18, .18), p("lab", .78, .2), p("entry", .75, .28), p("lab", .22, .78)] },
                { ...p("center", .7, .35), route: [p("center", .2, .2), p("center", .8, .2), p("server", .75, .28), p("center", .78, .78)] },
                { ...p("storage", .6, .5), route: [p("storage", .18, .2), p("storage", .78, .2), p("storage", .8, .78), p("vault", .2, .72)] }
            ]
        });
    }

    function finalHeist() {
        const rooms = [
            room("lab", 0, 0, "Ricerca avanzata", "#243845"), room("control", 1, 0, "Centro controllo", "#21394a"),
            room("security", 2, 0, "Comando sicurezza", "#203648"), room("archive", 3, 0, "Archivio riservato", "#3a313b"),
            room("entry", 0, 1, "Ingresso principale", "#293e47"), room("lobby", 1, 1, "Grande atrio", "#30434b"),
            room("east", 2, 1, "Galleria est", "#273a45"), room("offices", 3, 1, "Uffici direzione", "#343e4b"),
            room("storage", 0, 2, "Deposito logistico", "#3a3a34"), room("service", 1, 2, "Corridoio tecnico", "#273842"),
            room("highsec", 2, 2, "Alta sicurezza", "#343842"), room("server", 3, 2, "Data center", "#203a43"),
            room("loading", 0, 3, "Baia di carico", "#3d3931"), room("secondary", 1, 3, "Caveau secondario", "#41392e"),
            room("access", 2, 3, "Accesso blindato", "#333942"), room("mega", 3, 3, "Mega caveau", "#4a3d29")
        ];
        const p = (id, x, y) => point(rooms, id, x, y);
        return finalize({
            id: "final-heist",
            name: "Final Heist",
            difficulty: "Estrema",
            description: "Il colpo finale: sedici stanze, telecamere e un mega caveau.",
            minPolice: 8,
            maxPolice: 14,
            rooms,
            connections: [
                connect("lab", "control", .35), connect("control", "security", .65), connect("security", "archive", .38),
                connect("entry", "lobby", .52), connect("lobby", "east", .3), connect("east", "offices", .68),
                connect("storage", "service", .34), connect("service", "highsec", .7), connect("highsec", "server", .32),
                connect("loading", "secondary", .66), connect("secondary", "access", .38), connect("access", "mega", .62),
                connect("lab", "entry", .28), connect("control", "lobby", .68), connect("security", "east", .36), connect("archive", "offices", .7),
                connect("entry", "storage", .72), connect("lobby", "service", .42), connect("east", "highsec", .68), connect("offices", "server", .3),
                connect("storage", "loading", .32), connect("service", "secondary", .7), connect("highsec", "access", .36), connect("server", "mega", .9),
                connect("control", "lobby", .28), connect("service", "highsec", .28)
            ],
            spawn: p("entry", .12, .52),
            exit: { ...p("entry", .065, .52), radius: 42 },
            safes: [
                { id: "final-safe-lab", roomId: "lab", ...p("lab", .8, .22), value: [2800, 3600] },
                { id: "final-safe-office", roomId: "offices", ...p("offices", .82, .22), value: [3200, 4200] },
                { id: "final-safe-archive", roomId: "archive", ...p("archive", .8, .72), value: [4000, 5200] },
                { id: "final-safe-server", roomId: "server", ...p("server", .86, .78), value: [4500, 5800] },
                { id: "final-safe-secondary", roomId: "secondary", ...p("secondary", .5, .53), value: [5600, 6800] },
                { id: "final-mega-vault", roomId: "mega", ...p("mega", .65, .52), value: [12000, 14000], mega: true }
            ],
            cameras: [
                camera(rooms, "lobby", .9, .12, 2.58, 340, .48, .74), camera(rooms, "east", .1, .86, -.55, 330, .44, .8),
                camera(rooms, "control", .9, .14, 2.66, 310, .35, .62), camera(rooms, "security", .1, .14, .5, 330, .42, .76),
                camera(rooms, "highsec", .9, .12, 2.52, 350, .52, .84), camera(rooms, "server", .1, .86, -.48, 330, .4, .72),
                camera(rooms, "access", .88, .14, 2.6, 360, .52, .88), camera(rooms, "mega", .12, .14, .55, 370, .55, .92),
                camera(rooms, "mega", .88, .84, -2.58, 360, .48, .82)
            ],
            furniture: [
                decor(rooms, "entry", .5, .52, 540, 290, "rug"), furniture(rooms, "entry", .5, .27, 220, 62, "counter"),
                furniture(rooms, "entry", .25, .76, 140, 52, "bench", false), furniture(rooms, "entry", .76, .74, 52, 52, "plant"),
                decor(rooms, "entry", .5, .25, 72, 26, "terminal"), furniture(rooms, "entry", .78, .25, 52, 52, "plant"),
                decor(rooms, "lobby", .5, .5, 560, 310, "hall-floor"), furniture(rooms, "lobby", .5, .5, 92, 92, "plant"),
                furniture(rooms, "lobby", .25, .27, 150, 48, "bench", false), furniture(rooms, "lobby", .76, .73, 150, 48, "bench", false),
                furniture(rooms, "lobby", .76, .28, 70, 150, "divider"), decor(rooms, "lobby", .5, .18, 180, 18, "direction-sign"),
                decor(rooms, "east", .5, .5, 580, 300, "hall-floor"), furniture(rooms, "east", .32, .5, 70, 210, "divider"),
                furniture(rooms, "east", .68, .28, 70, 70, "plant"), furniture(rooms, "east", .7, .74, 135, 46, "bench", false),
                decor(rooms, "offices", .5, .5, 590, 310, "carpet"), furniture(rooms, "offices", .28, .3, 190, 64, "desk"),
                furniture(rooms, "offices", .34, .72, 200, 64, "desk"), furniture(rooms, "offices", .66, .55, 68, 170, "cabinet"),
                furniture(rooms, "offices", .28, .49, 44, 44, "chair", false), furniture(rooms, "offices", .34, .88, 44, 44, "chair", false),
                decor(rooms, "offices", .28, .28, 48, 24, "monitor"), furniture(rooms, "offices", .86, .74, 66, 96, "filing"),
                decor(rooms, "lab", .5, .5, 580, 300, "lab-floor"), furniture(rooms, "lab", .3, .3, 210, 70, "lab-table"),
                furniture(rooms, "lab", .32, .7, 210, 70, "lab-table"), furniture(rooms, "lab", .68, .56, 80, 160, "chemical-cabinet"),
                furniture(rooms, "lab", .3, .49, 44, 44, "stool", false), decor(rooms, "lab", .3, .28, 100, 28, "lab-glass"),
                decor(rooms, "control", .5, .5, 560, 300, "server-floor"), furniture(rooms, "control", .5, .32, 280, 74, "console"),
                furniture(rooms, "control", .22, .72, 72, 116, "server"), furniture(rooms, "control", .8, .72, 72, 116, "server"),
                furniture(rooms, "control", .5, .58, 46, 46, "chair", false), decor(rooms, "control", .5, .29, 180, 30, "screens"),
                decor(rooms, "security", .5, .5, 570, 300, "server-floor"), furniture(rooms, "security", .3, .3, 230, 70, "console"),
                furniture(rooms, "security", .72, .3, 76, 150, "locker"), furniture(rooms, "security", .24, .75, 76, 110, "server"),
                furniture(rooms, "security", .72, .75, 120, 48, "bench", false), decor(rooms, "security", .3, .27, 140, 28, "screens"),
                furniture(rooms, "archive", .18, .32, 66, 190, "shelf"), furniture(rooms, "archive", .48, .72, 230, 60, "shelf"),
                furniture(rooms, "archive", .72, .3, 68, 180, "shelf"), furniture(rooms, "archive", .2, .78, 64, 64, "archive-box", false),
                decor(rooms, "archive", .5, .46, 280, 28, "floor-mark"), furniture(rooms, "archive", .48, .25, 110, 56, "filing"),
                decor(rooms, "storage", .5, .5, 590, 310, "loading-floor"), furniture(rooms, "storage", .24, .3, 100, 100, "crate"),
                furniture(rooms, "storage", .68, .3, 100, 100, "crate"), furniture(rooms, "storage", .48, .72, 230, 70, "shelf"),
                furniture(rooms, "storage", .82, .72, 92, 72, "pallet", false), furniture(rooms, "storage", .18, .72, 62, 92, "trolley", false),
                decor(rooms, "service", .5, .5, 590, 300, "loading-floor"), furniture(rooms, "service", .32, .48, 68, 220, "divider"),
                furniture(rooms, "service", .72, .27, 82, 82, "crate"), furniture(rooms, "service", .72, .72, 140, 48, "bench", false),
                decor(rooms, "service", .52, .2, 240, 18, "cable-run"), furniture(rooms, "service", .18, .25, 62, 96, "locker"),
                decor(rooms, "highsec", .5, .5, 560, 300, "vault-floor"), furniture(rooms, "highsec", .24, .5, 82, 190, "locker"),
                furniture(rooms, "highsec", .76, .5, 82, 190, "locker"), furniture(rooms, "highsec", .5, .28, 170, 58, "console"),
                furniture(rooms, "highsec", .5, .74, 170, 58, "divider"), decor(rooms, "highsec", .5, .5, 240, 20, "warning-line"),
                decor(rooms, "server", .5, .5, 580, 310, "server-floor"), furniture(rooms, "server", .22, .5, 72, 230, "server"),
                furniture(rooms, "server", .5, .62, 72, 210, "server"), furniture(rooms, "server", .76, .44, 72, 160, "server"),
                furniture(rooms, "server", .5, .22, 130, 54, "console"), decor(rooms, "server", .5, .5, 440, 20, "cable-run"),
                decor(rooms, "loading", .5, .5, 600, 320, "loading-floor"), furniture(rooms, "loading", .22, .3, 110, 110, "crate"),
                furniture(rooms, "loading", .55, .3, 120, 100, "pallet", false), furniture(rooms, "loading", .78, .72, 120, 90, "crate"),
                furniture(rooms, "loading", .3, .72, 72, 110, "trolley", false), decor(rooms, "loading", .5, .52, 420, 24, "warning-line"),
                decor(rooms, "secondary", .5, .5, 550, 310, "vault-floor"), furniture(rooms, "secondary", .2, .5, 82, 190, "locker"),
                furniture(rooms, "secondary", .8, .5, 82, 190, "locker"), furniture(rooms, "secondary", .5, .22, 104, 72, "deposit-box"),
                furniture(rooms, "secondary", .5, .8, 104, 72, "deposit-box"), decor(rooms, "secondary", .5, .5, 220, 20, "warning-line"),
                decor(rooms, "access", .5, .5, 580, 300, "vault-floor"), furniture(rooms, "access", .28, .5, 74, 220, "divider"),
                furniture(rooms, "access", .72, .28, 82, 120, "locker"), furniture(rooms, "access", .72, .72, 82, 120, "locker"),
                furniture(rooms, "access", .5, .5, 120, 56, "console"), decor(rooms, "access", .5, .2, 260, 22, "warning-line"),
                decor(rooms, "mega", .5, .5, 590, 320, "vault-floor"), furniture(rooms, "mega", .2, .25, 90, 100, "deposit-box"),
                furniture(rooms, "mega", .2, .75, 90, 100, "deposit-box"), furniture(rooms, "mega", .82, .25, 74, 120, "locker"),
                furniture(rooms, "mega", .82, .78, 74, 100, "locker"), decor(rooms, "mega", .52, .52, 330, 24, "warning-line"),
                furniture(rooms, "mega", .45, .24, 110, 62, "console")
            ],
            policeSpawns: [
                { ...p("lobby", .3, .35), route: [p("entry", .72, .25), p("lobby", .2, .2), p("lobby", .78, .72), p("entry", .7, .78)] },
                { ...p("east", .55, .28), route: [p("east", .2, .2), p("east", .8, .2), p("offices", .2, .46), p("east", .78, .78)] },
                { ...p("control", .7, .6), route: [p("control", .2, .2), p("control", .8, .2), p("security", .2, .55), p("control", .72, .78)] },
                { ...p("archive", .52, .48), route: [p("archive", .18, .76), p("archive", .82, .76), p("offices", .75, .25), p("archive", .55, .18)] },
                { ...p("lab", .5, .5), route: [p("lab", .18, .18), p("lab", .78, .2), p("entry", .74, .28), p("lab", .22, .78)] },
                { ...p("storage", .55, .5), route: [p("storage", .18, .2), p("storage", .8, .2), p("service", .2, .72), p("storage", .78, .78)] },
                { ...p("highsec", .5, .5), route: [p("highsec", .18, .2), p("highsec", .82, .2), p("highsec", .8, .8), p("highsec", .2, .78)] },
                { ...p("server", .48, .48), route: [p("server", .16, .2), p("server", .84, .2), p("server", .82, .8), p("server", .18, .78)] },
                { ...p("loading", .55, .5), route: [p("loading", .18, .18), p("loading", .82, .2), p("secondary", .2, .3), p("loading", .8, .8)] },
                { ...p("secondary", .72, .28), route: [p("secondary", .18, .2), p("secondary", .82, .2), p("access", .2, .5), p("secondary", .78, .8)] },
                { ...p("mega", .42, .3), route: [p("mega", .18, .18), p("mega", .78, .18), p("mega", .8, .78), p("mega", .22, .78)] },
                { ...p("mega", .72, .7), route: [p("mega", .78, .22), p("server", .72, .75), p("mega", .25, .75), p("access", .75, .35)] },
                { ...p("service", .5, .25), route: [p("control", .48, .76), p("lobby", .5, .2), p("service", .5, .78), p("highsec", .22, .48)] },
                { ...p("security", .5, .5), route: [p("security", .22, .2), p("east", .5, .2), p("highsec", .5, .2), p("access", .5, .78)] }
            ]
        });
    }

    window.POLIZIA_LADRI_MAPS = Object.freeze([smallOffice(), bank(), nightComplex(), finalHeist()]);
}());
