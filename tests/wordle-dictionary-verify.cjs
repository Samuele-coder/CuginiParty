'use strict';
// Development-only validation, not shipped to the browser. The GPL dictionary
// is read from its pinned original repository, not copied into game data.
const {pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
    const lexicon=await import(pathToFileURL(path.resolve(__dirname,'../js/wordle-lexicon.js')));
    const base='https://raw.githubusercontent.com/LibreOffice/dictionaries/b871dff9e73eefc187b2c979803c619ceccaed3a/it_IT/';
    const read=async file=>{const response=await fetch(base+file);if(!response.ok)throw Error(file+' HTTP '+response.status);return response.text();};
    const [aff,dic]=await Promise.all([read('it_IT.aff'),read('it_IT.dic')]);
    const rules=new Map(),targets=new Set(lexicon.ACCEPTED_WORDS),valid=new Set();
    const check=value=>{const word=lexicon.normalizeWord(value);if(targets.has(word))valid.add(word);};
    for(const line of aff.split(/\r?\n/)){
        const [type,flag,strip,add,condition]=line.trim().split(/\s+/);
        if(!['PFX','SFX'].includes(type)||!condition)continue;
        const list=rules.get(flag)||[];list.push({type,strip:strip==='0'?'':strip,add:add==='0'?'':add.split('/')[0],condition:new RegExp(type==='PFX'?'^'+condition:condition+'$')});rules.set(flag,list);
    }
    for(const line of dic.split(/\r?\n/).slice(1)){
        const [word,flags='']=line.split(/\s/)[0].split('/');check(word);
        for(const flag of flags)for(const rule of rules.get(flag)||[]){
            if(!rule.condition.test(word))continue;
            const value=rule.type==='PFX'?rule.add+word.slice(rule.strip.length):word.slice(0,word.length-rule.strip.length)+rule.add;check(value);
        }
    }
    const missing=lexicon.ACCEPTED_WORDS.filter(w=>!valid.has(w));
    console.log(JSON.stringify({source:base,accepted:targets.size,verified:valid.size,missing},null,2));
    if(missing.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
