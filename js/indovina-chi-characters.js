"use strict";

/*
 * Roster originale di CuginiParty. Gli stessi attributi vengono inseriti dalla
 * migration Supabase e sono l'unica fonte delle domande validate dal server.
 */
window.GUESS_WHO_CHARACTERS = [
    { id: "maya", name: "Maya", hairColor: "black", hairLength: "long", curly: true, glasses: true, hat: false, beard: false, moustache: false, earrings: true, smile: true, freckles: true, skin: "#8f5237", shirt: "#15a6a0", bg: "#bfeee8", face: 0 },
    { id: "teo", name: "Teo", hairColor: "brown", hairLength: "short", curly: false, glasses: false, hat: true, beard: true, moustache: true, earrings: true, smile: false, freckles: false, skin: "#f0bc8b", shirt: "#f08a34", bg: "#ffe0ad", face: 1 },
    { id: "luna", name: "Luna", hairColor: "blond", hairLength: "long", curly: false, glasses: true, hat: false, beard: false, moustache: true, earrings: false, smile: true, freckles: false, skin: "#f6c99b", shirt: "#297dcc", bg: "#cfe9ff", face: 2 },
    { id: "nilo", name: "Nilo", hairColor: "red", hairLength: "short", curly: true, glasses: false, hat: true, beard: true, moustache: false, earrings: false, smile: false, freckles: true, skin: "#d98a5f", shirt: "#70a83b", bg: "#dff2b9", face: 3 },
    { id: "cora", name: "Cora", hairColor: "gray", hairLength: "long", curly: false, glasses: true, hat: false, beard: false, moustache: false, earrings: true, smile: false, freckles: true, skin: "#6e3f31", shirt: "#dd5e79", bg: "#ffd6df", face: 0 },
    { id: "elio", name: "Elio", hairColor: "none", hairLength: "none", curly: false, glasses: false, hat: true, beard: true, moustache: true, earrings: true, smile: true, freckles: false, skin: "#efb481", shirt: "#7559c7", bg: "#ded6ff", face: 1 },
    { id: "zara", name: "Zara", hairColor: "black", hairLength: "short", curly: false, glasses: true, hat: false, beard: false, moustache: true, earrings: false, smile: false, freckles: false, skin: "#c87955", shirt: "#e3a719", bg: "#fff0ad", face: 2 },
    { id: "berto", name: "Berto", hairColor: "brown", hairLength: "long", curly: true, glasses: false, hat: true, beard: true, moustache: false, earrings: false, smile: true, freckles: true, skin: "#f2c195", shirt: "#238b71", bg: "#c6f1df", face: 3 },
    { id: "iris", name: "Iris", hairColor: "blond", hairLength: "short", curly: false, glasses: true, hat: false, beard: false, moustache: false, earrings: true, smile: true, freckles: true, skin: "#edb888", shirt: "#d5503e", bg: "#ffd7c8", face: 0 },
    { id: "rami", name: "Rami", hairColor: "red", hairLength: "long", curly: true, glasses: false, hat: false, beard: true, moustache: true, earrings: true, smile: false, freckles: false, skin: "#a75f43", shirt: "#257bb6", bg: "#bfe5f6", face: 1 },
    { id: "ada", name: "Ada", hairColor: "gray", hairLength: "short", curly: false, glasses: true, hat: true, beard: false, moustache: true, earrings: false, smile: true, freckles: false, skin: "#f3c49b", shirt: "#e56835", bg: "#ffe0bf", face: 2 },
    { id: "pino", name: "Pino", hairColor: "none", hairLength: "none", curly: false, glasses: false, hat: false, beard: true, moustache: false, earrings: false, smile: false, freckles: true, skin: "#8b513d", shirt: "#4b9c55", bg: "#d2efcf", face: 3 },
    { id: "neve", name: "Neve", hairColor: "black", hairLength: "long", curly: true, glasses: true, hat: true, beard: false, moustache: false, earrings: true, smile: true, freckles: true, skin: "#f1b68e", shirt: "#4d70ce", bg: "#d8e2ff", face: 0 },
    { id: "milo", name: "Milo", hairColor: "brown", hairLength: "short", curly: false, glasses: false, hat: false, beard: true, moustache: true, earrings: true, smile: false, freckles: false, skin: "#d8885f", shirt: "#d75168", bg: "#ffd3da", face: 1 },
    { id: "sole", name: "Sole", hairColor: "blond", hairLength: "long", curly: false, glasses: true, hat: true, beard: false, moustache: true, earrings: false, smile: false, freckles: true, skin: "#6f412e", shirt: "#1d9890", bg: "#c6eee8", face: 2 },
    { id: "timo", name: "Timo", hairColor: "red", hairLength: "short", curly: true, glasses: false, hat: false, beard: true, moustache: false, earrings: false, smile: true, freckles: false, skin: "#f0b889", shirt: "#de8d24", bg: "#ffe7b4", face: 3 },
    { id: "olga", name: "Olga", hairColor: "gray", hairLength: "long", curly: false, glasses: true, hat: false, beard: false, moustache: false, earrings: true, smile: false, freckles: true, skin: "#b86d4d", shirt: "#6a58b8", bg: "#ded8fa", face: 0 },
    { id: "gino", name: "Gino", hairColor: "none", hairLength: "none", curly: false, glasses: false, hat: true, beard: true, moustache: true, earrings: true, smile: true, freckles: false, skin: "#f4c69b", shirt: "#2883a0", bg: "#ccecf4", face: 1 },
    { id: "lia", name: "Lia", hairColor: "black", hairLength: "short", curly: true, glasses: true, hat: false, beard: false, moustache: true, earrings: false, smile: false, freckles: false, skin: "#7e4935", shirt: "#d76434", bg: "#ffddc5", face: 2 },
    { id: "vasco", name: "Vasco", hairColor: "brown", hairLength: "long", curly: false, glasses: false, hat: false, beard: true, moustache: false, earrings: false, smile: true, freckles: true, skin: "#eeb78a", shirt: "#499543", bg: "#d9f0c8", face: 3 },
    { id: "dora", name: "Dora", hairColor: "blond", hairLength: "short", curly: true, glasses: true, hat: true, beard: false, moustache: true, earrings: true, smile: true, freckles: false, skin: "#d1845e", shirt: "#cc4e80", bg: "#f9d2e3", face: 0 },
    { id: "runa", name: "Runa", hairColor: "red", hairLength: "long", curly: false, glasses: false, hat: false, beard: true, moustache: true, earrings: true, smile: false, freckles: true, skin: "#f2c096", shirt: "#3579c1", bg: "#d1e7ff", face: 1 },
    { id: "enea", name: "Enea", hairColor: "gray", hairLength: "short", curly: true, glasses: true, hat: true, beard: false, moustache: false, earrings: false, smile: false, freckles: false, skin: "#98583f", shirt: "#c47c1f", bg: "#ffe2b5", face: 2 },
    { id: "alba", name: "Alba", hairColor: "none", hairLength: "none", curly: false, glasses: false, hat: false, beard: true, moustache: false, earrings: false, smile: true, freckles: true, skin: "#efb88f", shirt: "#25887b", bg: "#c8eee3", face: 3 }
];

window.GUESS_WHO_QUESTIONS = [
    { id: "hair_black", category: "Capelli", text: "Ha i capelli neri?", attribute: "hairColor", expected: "black" },
    { id: "hair_brown", category: "Capelli", text: "Ha i capelli castani?", attribute: "hairColor", expected: "brown" },
    { id: "hair_blond", category: "Capelli", text: "Ha i capelli biondi?", attribute: "hairColor", expected: "blond" },
    { id: "hair_red", category: "Capelli", text: "Ha i capelli rossi?", attribute: "hairColor", expected: "red" },
    { id: "hair_gray", category: "Capelli", text: "Ha i capelli grigi?", attribute: "hairColor", expected: "gray" },
    { id: "hair_long", category: "Capelli", text: "Ha i capelli lunghi?", attribute: "hairLength", expected: "long" },
    { id: "hair_curly", category: "Capelli", text: "Ha i capelli ricci?", attribute: "curly", expected: true },
    { id: "bald", category: "Capelli", text: "È senza capelli?", attribute: "hairColor", expected: "none" },
    { id: "beard", category: "Viso", text: "Ha la barba?", attribute: "beard", expected: true },
    { id: "moustache", category: "Viso", text: "Ha i baffi?", attribute: "moustache", expected: true },
    { id: "smile", category: "Viso", text: "Sta sorridendo?", attribute: "smile", expected: true },
    { id: "freckles", category: "Viso", text: "Ha le lentiggini?", attribute: "freckles", expected: true },
    { id: "glasses", category: "Accessori", text: "Ha gli occhiali?", attribute: "glasses", expected: true },
    { id: "hat", category: "Accessori", text: "Indossa un cappello?", attribute: "hat", expected: true },
    { id: "earrings", category: "Accessori", text: "Ha gli orecchini?", attribute: "earrings", expected: true }
];

(function exposePortraitRenderer() {
    const hairColors = { black: "#20242d", brown: "#6a3c28", blond: "#e7b83f", red: "#b84d2d", gray: "#a7aeba", none: "transparent" };

    function curls(color, isLong) {
        const points = isLong ? [[27,35],[34,27],[44,22],[56,22],[66,27],[73,35],[26,48],[74,48]] : [[32,31],[41,24],[51,23],[61,26],[69,34]];
        return points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${color}"/>`).join("");
    }

    window.renderGuessWhoPortrait = function renderGuessWhoPortrait(person, options = {}) {
        if (!person) return "";
        const hair = hairColors[person.hairColor] || hairColors.black;
        const faceRx = [25, 23, 27, 24][person.face] || 25;
        const longHair = person.hairLength === "long";
        const hairShape = person.hairColor === "none" ? "" : person.curly
            ? curls(hair, longHair)
            : `<path d="M${longHair ? 23 : 28} 57Q20 22 50 18Q80 22 ${longHair ? 77 : 72} 57L68 39Q51 49 31 38Z" fill="${hair}"/>${longHair ? `<path d="M24 42Q17 61 25 79L36 68V42M76 42Q83 61 75 79L64 68V42" fill="${hair}"/>` : ""}`;
        const hat = person.hat ? `<path d="M24 30Q27 10 50 10Q73 10 76 30Z" fill="${person.shirt}"/><path d="M17 29Q50 23 83 29Q80 36 50 35Q20 36 17 29Z" fill="#26374b"/>` : "";
        const eyes = `<circle cx="41" cy="49" r="2.4" fill="#202734"/><circle cx="59" cy="49" r="2.4" fill="#202734"/>`;
        const glasses = person.glasses ? `<g fill="none" stroke="#26374b" stroke-width="2.7"><rect x="32" y="43" width="17" height="12" rx="5"/><rect x="51" y="43" width="17" height="12" rx="5"/><path d="M49 48h2M29 46l4 1M71 47l4-1"/></g>` : "";
        const freckles = person.freckles ? `<g fill="#9c5c43"><circle cx="36" cy="57" r="1"/><circle cx="40" cy="59" r="1"/><circle cx="64" cy="57" r="1"/><circle cx="60" cy="59" r="1"/></g>` : "";
        const moustache = person.moustache ? `<path d="M50 61Q42 56 39 63Q45 68 50 64Q55 68 61 63Q58 56 50 61Z" fill="${hair === "transparent" ? "#634333" : hair}"/>` : "";
        const beard = person.beard ? `<path d="M30 59Q34 82 50 86Q66 82 70 59Q64 73 50 75Q36 73 30 59Z" fill="${hair === "transparent" ? "#6d4937" : hair}" opacity=".92"/>` : "";
        const mouth = person.smile ? `<path d="M44 66Q50 72 56 66" fill="none" stroke="#713c38" stroke-width="2.2" stroke-linecap="round"/>` : `<path d="M44 68Q50 65 56 68" fill="none" stroke="#713c38" stroke-width="2.2" stroke-linecap="round"/>`;
        const earrings = person.earrings ? `<g fill="#f2b81d" stroke="#8e6312"><circle cx="28" cy="59" r="3"/><circle cx="72" cy="59" r="3"/></g>` : "";
        const title = options.decorative ? "" : `<title>Ritratto di ${person.name}</title>`;
        return `<svg class="guess-who-portrait" viewBox="0 0 100 112" role="img" aria-label="${person.name}" xmlns="http://www.w3.org/2000/svg">${title}<rect width="100" height="112" rx="14" fill="${person.bg}"/><circle cx="82" cy="18" r="12" fill="#fff" opacity=".28"/><path d="M16 112Q19 84 50 82Q81 84 84 112Z" fill="${person.shirt}"/><path d="M42 76h16v13H42z" fill="${person.skin}"/>${hairShape}<ellipse cx="50" cy="51" rx="${faceRx}" ry="31" fill="${person.skin}"/>${hat}${earrings}${beard}${eyes}${glasses}${freckles}${moustache}${mouth}<path d="M48 53l-2 7h6" fill="none" stroke="#9a604d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    };
})();
