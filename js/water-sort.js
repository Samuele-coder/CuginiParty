"use strict";
import {CAPACITY,WATER_COLORS,COLOR_NAMES,LEVELS,cloneTubes,canPour,pour,complete} from "./water-sort-core.js";

const area=document.getElementById("waterTubes");
if(area){
    const key="cuginiparty_water_sort_progress_v1",status=document.getElementById("waterStatus"),levelSelect=document.getElementById("waterLevelSelect"),patterns=document.getElementById("waterPatterns");
    let saved={};try{saved=JSON.parse(localStorage.getItem(key)||"{}")||{};}catch{/* memory-only fallback */}
    let currentLevel=Number.isInteger(saved.currentLevel)&&saved.currentLevel>=0&&saved.currentLevel<LEVELS.length?saved.currentLevel:0;
    let bests=saved.bests&&typeof saved.bests==="object"?saved.bests:{},tubes=[],moves=0,selected=-1,history=[],won=false,busy=false,epoch=0;
    patterns.checked=saved.patterns===true;
    function save(){try{localStorage.setItem(key,JSON.stringify({...saved,currentLevel,bests,patterns:patterns.checked}));}catch{/* keep playing if storage is disabled/full */}}
    function fit(){
        const width=area.clientWidth-24,gap=16,max=Math.max(1,Math.floor((width+gap)/(54+gap))),columns=Math.max(1,Math.ceil(tubes.length/Math.ceil(tubes.length/max)));
        area.style.setProperty("--tube-columns",columns);
    }
    function render(focus=-1){
        area.classList.toggle("water-patterns",patterns.checked);
        area.replaceChildren(...tubes.map((tube,index)=>{
            const button=document.createElement("button");button.type="button";button.className="water-tube"+(selected===index?" selected":"");button.dataset.tube=index;button.disabled=busy;
            button.setAttribute("aria-pressed",String(index===selected));button.setAttribute("aria-label","Boccetta "+(index+1)+": "+(tube.length?"dal basso "+tube.map(color=>COLOR_NAMES[color]).join(", "):"vuota"));
            const inside=document.createElement("span");inside.className="water-tube-inner";inside.setAttribute("aria-hidden","true");
            for(const [layer,color]of tube.entries()){
                const water=document.createElement("span");water.className="water-layer";water.style.setProperty("--layer",layer);water.style.setProperty("--water-color",WATER_COLORS[color]);
                water.dataset.pattern=Object.keys(WATER_COLORS).indexOf(color)%5;water.style.setProperty("--pattern-size",(8+Math.floor(Object.keys(WATER_COLORS).indexOf(color)/5)*6)+"px");
                inside.append(water);
            }
            button.append(inside);button.addEventListener("click",()=>choose(index));return button;
        }));
        document.getElementById("waterLevel").textContent=String(currentLevel+1);document.getElementById("waterMoves").textContent=moves;document.getElementById("waterBest").textContent=bests[currentLevel]||"—";
        document.getElementById("waterUndo").disabled=!history.length||won||busy;document.getElementById("waterNext").hidden=!won;levelSelect.value=currentLevel;fit();
        if(focus>=0)area.querySelector('[data-tube="'+focus+'"]')?.focus({preventScroll:true});
    }
    async function animatePour(from,to,color,token){
        if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
        const source=area.querySelector('[data-tube="'+from+'"]'),target=area.querySelector('[data-tube="'+to+'"]'),bounds=area.getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
        source.classList.add("is-pouring");target.classList.add("is-receiving");source.style.setProperty("--pour-direction",b.x<a.x?-1:1);
        const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),path=document.createElementNS(svg.namespaceURI,"path");
        svg.classList.add("water-pour-stream");svg.setAttribute("aria-hidden","true");svg.style.height=area.scrollHeight+"px";svg.setAttribute("viewBox","0 0 "+area.clientWidth+" "+area.scrollHeight);
        const x1=a.x+a.width/2-bounds.x,x2=b.x+b.width/2-bounds.x,y1=a.y-bounds.y+area.scrollTop+5,y2=b.y-bounds.y+area.scrollTop+8,high=Math.max(4,Math.min(y1,y2)-35);
        path.setAttribute("d","M"+x1+" "+y1+" C"+x1+" "+high+" "+x2+" "+high+" "+x2+" "+y2);path.setAttribute("stroke",WATER_COLORS[color]);svg.append(path);area.append(svg);
        await new Promise(resolve=>setTimeout(resolve,450));if(token===epoch)svg.remove();
    }
    async function choose(destination){
        if(won||busy)return;
        if(selected<0){if(tubes[destination].length){selected=destination;status.textContent="Ora scegli dove versare.";render(destination);}return;}
        if(destination===selected){selected=-1;status.textContent="Selezione annullata.";render(destination);return;}
        if(!canPour(tubes,selected,destination)){status.textContent="Scegli una boccetta vuota o con lo stesso colore in cima.";return;}
        const from=selected,result=pour(tubes,from,destination),token=++epoch;busy=true;
        area.querySelectorAll("button").forEach(button=>button.disabled=true);document.getElementById("waterUndo").disabled=true;
        await animatePour(from,destination,result.color,token);if(token!==epoch)return;
        history.push({tubes:cloneTubes(tubes),moves});tubes=result.tubes;moves++;selected=-1;busy=false;won=complete(tubes);
        if(won){if(!bests[currentLevel]||moves<bests[currentLevel])bests[currentLevel]=moves;save();status.textContent="Livello completato in "+moves+" mosse.";}else status.textContent="Bella mossa. Continua a separare i colori.";
        render(destination);
    }
    function reset(){epoch++;busy=false;tubes=cloneTubes(LEVELS[currentLevel].tubes);moves=0;selected=-1;history=[];won=false;status.textContent="Livello "+(currentLevel+1)+": scegli una boccetta da cui versare.";render();}
    function load(index){currentLevel=(index+LEVELS.length)%LEVELS.length;save();reset();area.scrollTop=0;}
    function undo(){if(busy||won)return;const previous=history.pop();if(!previous)return;tubes=previous.tubes;moves=previous.moves;selected=-1;status.textContent="Mossa annullata.";render();}
    levelSelect.replaceChildren(...LEVELS.map((level,index)=>{const option=document.createElement("option");option.value=index;option.textContent="Livello "+level.name+" · "+level.tubes.length+" boccette";return option;}));
    levelSelect.addEventListener("change",()=>load(+levelSelect.value));patterns.addEventListener("change",()=>{save();render();});
    document.getElementById("waterUndo").addEventListener("click",undo);document.getElementById("waterRestart").addEventListener("click",reset);document.getElementById("waterNext").addEventListener("click",()=>load(currentLevel+1));
    new ResizeObserver(fit).observe(area);load(currentLevel);
}
