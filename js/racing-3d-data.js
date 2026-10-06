// All distances are metres and physics rates use seconds. Forward = local +Z,
// up = +Y, driver's right = local -X. Positive input means driver's right.
export const CAR_TYPES = Object.freeze([
    { id: 'street', name: 'STREET', color: 0xe84555, speed: 45, acceleration: 12.5, grip: 11.5, handling: 1, body: 'hatch', description: 'Compatta, equilibrata e facile da portare al limite.' },
    { id: 'gt', name: 'GT', color: 0x368ddb, speed: 49, acceleration: 12, grip: 11.2, handling: .96, body: 'coupe', description: 'Coupé precisa, veloce sulle curve lunghe.' },
    { id: 'rally', name: 'RALLY', color: 0xf2b936, speed: 43, acceleration: 13.4, grip: 12, handling: 1.06, body: 'rally', description: 'Assetto alto e trazione efficace anche sulle banchine.' },
    { id: 'muscle', name: 'MUSCLE', color: 0x995fd6, speed: 48, acceleration: 14, grip: 10.4, handling: .9, body: 'muscle', description: 'Cofano lungo, grande spinta: frena prima delle curve.' },
    { id: 'formula', name: 'FORMULA', color: 0x37c296, speed: 47, acceleration: 12.8, grip: 13, handling: 1.12, body: 'formula', description: 'Ruote scoperte e sterzo preciso per i tratti tecnici.' },
    { id: 'hyper', name: 'HYPER', color: 0xfa8750, speed: 51, acceleration: 11.7, grip: 11.7, handling: .95, body: 'hyper', description: 'Profilo basso e velocità di punta, da guidare con misura.' }
]);
export const DIFFICULTIES = Object.freeze({
    easy: { name: 'FACILE', pace: .76, lateralG: 6.2, brake: 12, anticipation: 13, precision: .7, aggression: .32, clearance: 3.8, mistakes: .9, commitment: 2.4 },
    normal: { name: 'NORMALE', pace: .89, lateralG: 8.5, brake: 16, anticipation: 7, precision: .91, aggression: .65, clearance: 3.2, mistakes: .35, commitment: 3.2 },
    hard: { name: 'DIFFICILE', pace: .98, lateralG: 10.5, brake: 19, anticipation: 3, precision: .99, aggression: .92, clearance: 2.8, mistakes: .08, commitment: 4 }
});
export const TRACKS = Object.freeze([
    { id: 'grand', name: 'GRAND CIRCUIT', theme: 'grand', difficulty: 'Tecnica', laps: 3, halfWidth: 7.5, shoulder: 'grass', sky: 0x95c8e7, ground: 0x72994e, road: 0x3d4652, accent: 0xe95050, fog: 340,
        description: 'Rettilineo, tornante e settore tecnico fra tribune e paddock.',
        points: [[-65,0,-100],[-65,0,-15],[-65,1,65],[-35,2,105],[35,5,108],[82,5,70],[68,3,20],[23,1,-12],[48,0,-48],[92,0,-82],[72,0,-128],[0,0,-138]], tunnel: null, bridge: null },
    { id: 'canyon', name: 'CANYON RUN', theme: 'canyon', difficulty: 'Intermedia', laps: 3, halfWidth: 8, shoulder: 'sand', sky: 0xdcb684, ground: 0xbd9060, road: 0x574d48, accent: 0xefab55, fog: 380,
        description: 'Rocce rosse, sabbia, un ponte sul canyon e una galleria.',
        points: [[-110,3,-95],[-125,5,-20],[-91,9,60],[-48,14,120],[24,16,110],[83,12,75],[135,8,13],[112,5,-47],[54,3,-72],[16,1,-130],[-45,1,-145]], tunnel: .64, bridge: .32 },
    { id: 'city', name: 'CITY NIGHT', theme: 'city', difficulty: 'Intermedia', laps: 3, halfWidth: 7.8, shoulder: 'dirt', sky: 0x141f3b, ground: 0x252c3c, road: 0x303b4b, accent: 0x55bcf6, fog: 320,
        description: 'Viali notturni, skyline illuminato e sottopasso urbano.',
        points: [[-115,1,-110],[-115,1,-20],[-110,1,80],[-60,3,112],[45,8,112],[100,8,75],[100,4,10],[44,1,-12],[60,1,-70],[102,1,-115],[46,1,-155],[-62,1,-155]], tunnel: .61, bridge: .34 },
    { id: 'alpine', name: 'ALPINE SNOW', theme: 'alpine', difficulty: 'Impegnativa', laps: 3, halfWidth: 7.5, shoulder: 'snow', sky: 0xc6e1f0, ground: 0xe1e9ed, road: 0x4a5662, accent: 0x5c9abd, fog: 400,
        description: 'Salite, tornanti, pini e chalet sulle montagne innevate.',
        points: [[-100,3,-120],[-135,9,-25],[-115,18,55],[-67,28,113],[3,30,135],[76,24,100],[116,17,44],[68,11,12],[37,7,-29],[81,5,-78],[50,2,-132],[-22,1,-150]], tunnel: .56, bridge: null },
    { id: 'neon', name: 'NEON SPEEDWAY', theme: 'neon', difficulty: 'Veloce', laps: 3, halfWidth: 8.5, shoulder: 'dirt', sky: 0x10172d, ground: 0x1e2540, road: 0x26334d, accent: 0x33dfce, fog: 380,
        description: 'Curve veloci, portali luminosi e barriere futuristiche.',
        points: [[-120,2,-100],[-133,2,-5],[-110,4,96],[-41,8,146],[58,11,120],[129,9,54],[128,5,-31],[83,2,-98],[10,2,-151],[-75,2,-145]], tunnel: .38, bridge: .6 }
]);
export const QUALITY = Object.freeze({
    auto: { name: 'AUTO', dpr: 1.35, density: .65, particles: 48, distance: 300 },
    low: { name: 'BASSA', dpr: 1, density: .4, particles: 24, distance: 220 },
    medium: { name: 'MEDIA', dpr: 1.5, density: .7, particles: 64, distance: 340 },
    high: { name: 'ALTA', dpr: 2, density: 1, particles: 100, distance: 450 }
});
export const SURFACES = Object.freeze({
    asphalt: { acceleration: 1, drag: .085, grip: 1, speed: 1 },
    grass: { acceleration: .55, drag: .8, grip: .55, speed: .43 },
    sand: { acceleration: .42, drag: 1.05, grip: .48, speed: .37 },
    dirt: { acceleration: .58, drag: .7, grip: .6, speed: .47 },
    snow: { acceleration: .68, drag: .56, grip: .72, speed: .53 }
});
