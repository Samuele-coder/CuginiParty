'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
    const words=await import(pathToFileURL(path.resolve(__dirname,'../js/wordle-lexicon.js'))),water=await import(pathToFileURL(path.resolve(__dirname,'../js/water-sort-core.js')));
    assert.equal(words.normalizeWord('caffè'),'CAFFE');assert.equal(new Set(words.ACCEPTED_WORDS).size,words.ACCEPTED_WORDS.length);assert.ok(words.ACCEPTED_WORDS.length>1100);
    assert.deepEqual(words.evaluateLetters('MAMMA','AMICO'),['present','present','absent','absent','absent']);
    assert.deepEqual(words.evaluateLetters('CASSA','CASCO'),['correct','correct','correct','absent','absent']);
    assert.deepEqual(words.evaluateLetters('ANANA','BANCA'),['present','present','absent','absent','correct']);
    const counts=words.WORD_LENGTHS.map(length=>({length,common:words.solutionPool(length,'common').length,varied:words.solutionPool(length,'varied').length}));
    assert.ok(counts.every(c=>c.common>=50&&c.varied>=c.common));
    // Canonicalized DFS proves the three unchanged legacy puzzles are solvable.
    const key=tubes=>tubes.map(t=>t.join(',')).sort().join('|');
    function solve(initial){const seen=new Set();function dfs(tubes,depth){if(water.complete(tubes))return [];if(depth<=0||seen.size>250000)return null;const state=key(tubes);if(seen.has(state))return null;seen.add(state);
        for(let from=0;from<tubes.length;from++)for(let to=0;to<tubes.length;to++){
            if(!water.canPour(tubes,from,to)||!tubes[to].length&&tubes[from].every(c=>c===tubes[from][0]))continue;
            const result=water.pour(tubes,from,to),tail=dfs(result.tubes,depth-1);if(tail)return [{from,to},...tail];
        }return null;}return dfs(water.cloneTubes(initial),100);}
    const solutions=[];
    for(const [i,level]of water.LEVELS.entries()){
        const moves=level.witness||solve(level.tubes);assert.ok(moves,'Solvable level '+(i+1));let tubes=water.cloneTubes(level.tubes);
        for(const move of moves){const result=water.pour(tubes,move.from,move.to);assert.ok(result,'Legal witness level '+(i+1));assert.ok(result.tubes.every(t=>t.length<=4));tubes=result.tubes;}
        assert.ok(water.complete(tubes));solutions.push({level:i+1,bottles:tubes.length,moves:moves.length});
    }
    const state=water.cloneTubes(water.LEVELS[0].tubes),before=JSON.stringify(state);assert.equal(water.pour(state,0,0),null);assert.equal(water.pour(state,-1,2),null);assert.equal(water.pour(state,0,1),null);assert.equal(JSON.stringify(state),before);const poured=water.pour(state,0,3);assert.equal(poured.amount,1);assert.equal(JSON.stringify(state),before);
    for(const name of ['racing-online','racing','wordle','water-sort']){const file=path.resolve(__dirname,'../games/'+name+'.html'),html=fs.readFileSync(file,'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Unique IDs: '+name);for(const m of html.matchAll(/\b(?:src|href)="([^"]+)"/g)){if(/^(?:https?:|#)/.test(m[1]))continue;assert.ok(fs.existsSync(path.resolve(path.dirname(file),m[1].split('?')[0])),'Path '+name+': '+m[1]);}}
    console.log(JSON.stringify({wordle:{accepted:words.ACCEPTED_WORDS.length,counts},water:solutions},null,2));console.log('PASS expanded lexicon normalization/duplicates/pools and unchanged pour rules + all ten solvable levels.');
})().catch(e=>{console.error(e);process.exitCode=1;});
