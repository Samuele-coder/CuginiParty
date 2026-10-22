export const CAPACITY=4;
export const WATER_COLORS=Object.freeze({coral:'#df5367',sky:'#2588d4',mint:'#21ad7e',sun:'#eebd32',violet:'#9562ce',peach:'#e98932',teal:'#158c97',pink:'#d855a0',navy:'#4054b5',lime:'#87a82b'});
export const COLOR_NAMES=Object.freeze({coral:'corallo',sky:'azzurro',mint:'verde menta',sun:'giallo',violet:'viola',peach:'arancio',teal:'turchese',pink:'rosa',navy:'indaco',lime:'verde lime'});
export const cloneTubes=tubes=>tubes.map(tube=>tube.slice());
export function topGroup(tube){let count=tube.length?1:0;while(count<tube.length&&tube[tube.length-count-1]===tube.at(-1))count++;return count;}
export function canPour(tubes,from,to){return Number.isInteger(from)&&Number.isInteger(to)&&from!==to&&Boolean(tubes[from]?.length)&&Array.isArray(tubes[to])&&tubes[to].length<CAPACITY&&(!tubes[to].length||tubes[to].at(-1)===tubes[from].at(-1));}
export function pour(tubes,from,to){
    if(!canPour(tubes,from,to))return null;
    const next=cloneTubes(tubes),amount=Math.min(topGroup(next[from]),CAPACITY-next[to].length),moved=next[from].splice(-amount);next[to].push(...moved);return {tubes:next,amount,color:moved[0]};
}
export const complete=tubes=>tubes.every(tube=>!tube.length||tube.length===CAPACITY&&tube.every(color=>color===tube[0]));
const legacy=[
    [['coral','sky','mint','coral'],['mint','coral','sky','mint'],['sky','mint','coral','sky'],[],[]],
    [['coral','sky','mint','sun'],['sun','mint','sky','coral'],['coral','sun','mint','sky'],['sky','coral','sun','mint'],[],[]],
    [['coral','sky','mint','sun'],['violet','sun','mint','sky'],['coral','violet','sun','mint'],['sky','coral','violet','sun'],['mint','sky','coral','violet'],[],[]]
];
// Every scramble is a sequence of invertible pours, not arbitrary shuffling.
// The witness allows tests to prove solvability with the unchanged pour rule.
export function generatedLevel(colours,seed){
    const names=Object.keys(WATER_COLORS).slice(0,colours),tubes=[...names.map(c=>Array(CAPACITY).fill(c)),[],[]],witness=[];
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    let last=null;
    for(let step=0;step<colours*24;step++){
        const choices=[];
        for(let from=0;from<tubes.length;from++)for(let to=0;to<tubes.length;to++){
            if(from===to||!tubes[from].length||tubes[to].length===CAPACITY||tubes[to].at(-1)===tubes[from].at(-1)||last&&last.from===to&&last.to===from)continue;
            const max=Math.min(topGroup(tubes[from]),CAPACITY-tubes[to].length);
            for(let count=1;count<=max;count++)if(count<tubes[from].length&&tubes[from][tubes[from].length-count-1]!==tubes[from].at(-1))continue;else choices.push({from,to,count});
        }
        if(!choices.length)break;last=choices[Math.floor(random()*choices.length)];const moved=tubes[last.from].splice(-last.count);tubes[last.to].push(...moved);witness.unshift({from:last.to,to:last.from});
    }
    return {tubes,witness};
}
export const LEVELS=Object.freeze([...legacy.map((tubes,index)=>({name:String(index+1),tubes})),...[6,7,8,8,9,10,10].map((count,index)=>({name:String(index+4),...generatedLevel(count,8421+index*7919)}))]);
