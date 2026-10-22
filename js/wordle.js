"use strict";
import {normalizeWord,ACCEPTED_WORDS,WORD_LENGTHS,solutionPool,evaluateLetters} from "./wordle-lexicon.js";

const board=document.getElementById("wordleBoard");
if(board){
    const status=document.getElementById("wordleStatus"),keyboard=document.getElementById("wordleKeyboard");
    const lengthSelect=document.getElementById("wordleLength"),difficultySelect=document.getElementById("wordleDifficulty"),newButton=document.getElementById("wordleNewGame");
    const statsKey="cuginiparty_wordle_stats_v1",roundKey="cuginiparty_wordle_round_v2";
    const solutionWords=new Set(ACCEPTED_WORDS),motion=matchMedia("(prefers-reduced-motion: reduce)");
    const keyboardRows=["QWERTYUIOP","ASDFGHJKL",["ENTER",..."ZXCVBNM","BACKSPACE"]];
    const rank={absent:1,present:2,correct:3},resultNames={correct:"posizione corretta",present:"presente altrove",absent:"assente o in eccesso"};
    const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||"null")||fallback;}catch{return fallback;}};
    const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
    function normalizeStats(raw){
        const value=raw&&typeof raw==="object"?raw:{};
        const next={...value,byLength:value.byLength&&typeof value.byLength==="object"?{...value.byLength}:{}};
        for(const name of ["played","wins","streak","bestStreak"])next[name]=Number.isSafeInteger(value[name])&&value[name]>=0?value[name]:0;
        return next;
    }
    let stats=normalizeStats(read(statsKey,{}));
    let solution="",guesses=[],guess="",length=5,attempts=6,difficulty="common",recent=[],roundId="";
    let phase="typing",gameOver=false,counted=false,outcomeSaved=false,epoch=0,shake=null;
    const keys=new Map(),keyButtons=new Map(),animations=new Set(),pops=new Map();
    const busy=()=>phase==="revealing"||phase==="celebrating";
    const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
    const formalWord=(word,size)=>typeof word==="string"&&word.length===size&&/^[A-Z]+$/.test(word);
    const persist=()=>write(roundKey,{version:2,solution,guesses,guess,gameOver,length,difficulty,recent,selection:lengthSelect.value,roundId,pendingReveal:busy(),outcomeRecorded:outcomeSaved});
    function message(text,kind="info"){status.textContent=text;status.dataset.kind=kind;}
    function showStats(){for(const name of ["played","wins","streak","bestStreak"])document.getElementById("wordle"+name[0].toUpperCase()+name.slice(1)).textContent=stats[name];}
    function syncControls(){
        board.dataset.phase=phase;board.setAttribute("aria-busy",String(busy()));keyboard.setAttribute("aria-disabled",String(busy()||gameOver));
        newButton.disabled=busy();lengthSelect.disabled=busy();difficultySelect.disabled=busy();
        for(const button of keyButtons.values())button.disabled=busy()||gameOver;
    }
    function clearPressed(){for(const button of keyButtons.values())button.classList.remove("is-pressed");}
    function cancelAnimations(){
        for(const animation of animations)animation.cancel();animations.clear();pops.clear();shake=null;clearPressed();
        board.querySelectorAll("[data-animation]").forEach(element=>delete element.dataset.animation);
    }
    function startAnimation(element,frames,timing){
        const animation=element.animate(frames,{fill:"none",...timing});animations.add(animation);
        // Cancellation is expected on page exit, reduced-motion changes and reset.
        animation.finished.catch(()=>{});return animation;
    }
    async function transient(element,frames,timing,token=epoch){
        if(motion.matches)return token===epoch;
        const animation=startAnimation(element,frames,timing);
        try{await animation.finished;return token===epoch;}catch{return false;}
        finally{animations.delete(animation);animation.cancel();}
    }
    function cellAt(row,column){return board.children[row].children[column];}
    function describeCell(cell,row,column,letter,kind){
        cell.setAttribute("aria-label","Riga "+(row+1)+", lettera "+(column+1)+": "+(letter||"vuota")+(kind?", "+resultNames[kind]:""));
    }
    function colourKey(letter,kind){
        if((rank[keys.get(letter)]||0)>=rank[kind])return;
        keys.set(letter,kind);const button=keyButtons.get(letter);
        button.classList.remove("correct","present","absent");button.classList.add(kind);button.dataset.result=kind;
        button.setAttribute("aria-label","Lettera "+letter+": "+resultNames[kind]);
    }
    function colourCell(cell,row,column,letter,kind){
        cell.classList.remove("filled","correct","present","absent");cell.classList.add(kind);cell.dataset.result=kind;
        describeCell(cell,row,column,letter,kind);colourKey(letter,kind);
    }
    function drawKeyboard(){
        keyboard.replaceChildren();keyButtons.clear();keys.clear();
        for(const row of keyboardRows){
            const line=document.createElement("div");line.className="wordle-keyboard-row";
            for(const key of row){
                const button=document.createElement("button");button.type="button";button.className="wordle-key"+(key.length>1?" wide":"");button.dataset.key=key;
                button.setAttribute("aria-label",key==="BACKSPACE"?"Cancella":key==="ENTER"?"Invia parola":"Lettera "+key);
                if(key==="BACKSPACE"){
                    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),path=document.createElementNS(svg.namespaceURI,"path");
                    svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");path.setAttribute("d","M9 5h12v14H9L2 12l7-7Zm3 4 6 6m0-6-6 6");svg.append(path);button.append(svg);
                }else button.textContent=key==="ENTER"?"INVIO":key;
                button.addEventListener("click",()=>handleKey(key));keyButtons.set(key,button);line.append(button);
            }
            keyboard.append(line);
        }
    }
    function drawBoard(){
        board.style.setProperty("--wordle-length",length);board.setAttribute("aria-label","Parola di "+length+" lettere, "+attempts+" tentativi");
        board.replaceChildren();drawKeyboard();
        for(let row=0;row<attempts;row++){
            const line=document.createElement("div");line.className="wordle-row";line.setAttribute("role","row");
            const word=guesses[row]||(row===guesses.length?guess:""),result=guesses[row]?evaluateLetters(word,solution):null;
            for(let column=0;column<length;column++){
                const cell=document.createElement("div");cell.className="wordle-cell";cell.setAttribute("role","gridcell");cell.textContent=word[column]||"";
                if(result)colourCell(cell,row,column,word[column],result[column]);else{cell.classList.toggle("filled",Boolean(word[column]));describeCell(cell,row,column,word[column]);}
                line.append(cell);
            }
            board.append(line);
        }
        document.getElementById("wordleRoundInfo").textContent=length+" LETTERE · "+attempts+" TENTATIVI";syncControls();
    }
    function updateGuess(previousSize){
        shake?.cancel();
        for(let column=0;column<length;column++){
            const cell=cellAt(guesses.length,column),letter=guess[column]||"";cell.textContent=letter;cell.classList.toggle("filled",Boolean(letter));describeCell(cell,guesses.length,column,letter);
            if(column>=guess.length){pops.get(cell)?.cancel();pops.delete(cell);delete cell.dataset.animation;}
            if(column>=previousSize&&column<guess.length&&!motion.matches){
                pops.get(cell)?.cancel();cell.dataset.animation="pop";
                const animation=startAnimation(cell,[{transform:"scale(1)"},{transform:"scale(1.1)",offset:.5},{transform:"scale(1)"}],{duration:110,easing:"ease-out"});pops.set(cell,animation);
                animation.finished.catch(()=>{}).finally(()=>{animations.delete(animation);if(pops.get(cell)===animation){pops.delete(cell);delete cell.dataset.animation;}animation.cancel();});
            }
        }
        persist();
    }
    async function incomplete(){
        message("Non abbastanza lettere","error");if(motion.matches)return;
        shake?.cancel();const row=board.children[guesses.length];row.dataset.animation="shake";
        const animation=startAnimation(row,[0,-5,5,-4,4,-2,2,0].map(x=>({transform:"translateX("+x+"px)"})),{duration:330,easing:"ease-in-out"});shake=animation;
        try{await animation.finished;}catch{/* typing/reset may cancel the shake */}
        finally{animations.delete(animation);if(shake===animation){shake=null;delete row.dataset.animation;}animation.cancel();}
    }
    async function flipCell(cell,row,column,letter,kind,token){
        if(motion.matches){colourCell(cell,row,column,letter,kind);return token===epoch;}
        let outgoing,incoming;
        try{
            cell.dataset.animation="flip-out";
            outgoing=startAnimation(cell,[{transform:"rotateX(0deg)"},{transform:"rotateX(90deg)"}],{duration:140,delay:column?35:0,easing:"ease-in",fill:"forwards"});
            await outgoing.finished;if(token!==epoch)return false;
            // The outgoing face is edge-on: only now commit the cell/key colour.
            colourCell(cell,row,column,letter,kind);cell.dataset.animation="flip-in";
            incoming=startAnimation(cell,[{transform:"rotateX(-90deg)"},{transform:"rotateX(0deg)"}],{duration:140,easing:"ease-out"});
            outgoing.cancel();await incoming.finished;return token===epoch;
        }catch{return false;}
        finally{for(const animation of [outgoing,incoming])if(animation){animations.delete(animation);animation.cancel();}delete cell.dataset.animation;}
    }
    function recordOutcome(won){
        gameOver=true;
        if(!counted){
            const current=normalizeStats(read(statsKey,stats));
            if(current.lastWordleRoundId===roundId){stats=current;outcomeSaved=true;}
            else{
                const bucket=current.byLength[length]||{};
                stats={...current,played:current.played+1,wins:current.wins+Number(won),streak:won?current.streak+1:0,lastWordleRoundId:roundId,
                    byLength:{...current.byLength,[length]:{...bucket,played:(Number(bucket.played)||0)+1,wins:(Number(bucket.wins)||0)+Number(won)}}};
                stats.bestStreak=Math.max(stats.bestStreak,stats.streak);outcomeSaved=write(statsKey,stats);
            }
            counted=true;showStats();
        }
        message((won?"Hai trovato "+solution+"!":"La parola era "+solution+".")+(outcomeSaved?"":" Statistiche disponibili solo in questa sessione."),won?"success":"info");
    }
    async function concludeTurn(token,celebrate=true){
        const won=guesses.at(-1)===solution;
        if(won||guesses.length===attempts){
            recordOutcome(won);phase=won&&celebrate&&!motion.matches?"celebrating":"finished";syncControls();persist();
            if(phase==="celebrating"){
                const row=board.children[guesses.length-1];row.dataset.animation="win";
                await Promise.all([...row.children].map((cell,column)=>transient(cell,[{transform:"translateY(0)"},{transform:"translateY(-20px)",offset:.35},{transform:"translateY(4px)",offset:.7},{transform:"translateY(0)"}],{duration:440,delay:column*65,easing:"ease-in-out"},token)));
                delete row.dataset.animation;if(token!==epoch)return;phase="finished";syncControls();persist();
            }
        }else{phase="typing";message("Ancora "+(attempts-guesses.length)+" tentativi.");syncControls();persist();}
    }
    async function submit(){
        if(busy()||gameOver)return;
        if(guess.length!==length){incomplete();return;}
        // All formally valid letter sequences are playable. The lexicon is
        // used only for secret words, never to reject a submitted attempt.
        const value=guess,row=guesses.length,result=evaluateLetters(value,solution),token=++epoch;
        cancelAnimations();guesses.push(value);guess="";phase="revealing";message("Rivelazione in corso…");syncControls();persist();
        for(let column=0;column<length;column++)if(!await flipCell(cellAt(row,column),row,column,value[column],result[column],token))return;
        if(token===epoch)await concludeTurn(token);
    }
    function handleKey(key){
        if(busy()||gameOver)return;
        if(key==="ENTER"){submit();return;}
        const previous=guess.length;
        if(key==="BACKSPACE")guess=guess.slice(0,-1);
        else {const letter=normalizeWord(key);if(!/^[A-Z]$/.test(letter)||guess.length>=length)return;guess+=letter;}
        updateGuess(previous);message("Completa la parola di "+length+" lettere.");
    }
    function newGame(){
        if(busy())return;epoch++;cancelAnimations();
        length=lengthSelect.value==="random"?WORD_LENGTHS[Math.floor(Math.random()*WORD_LENGTHS.length)]:+lengthSelect.value;
        if(!WORD_LENGTHS.includes(length))length=5;
        difficulty=difficultySelect.value==="varied"?"varied":"common";attempts=length<=5?6:length===6?7:8;
        const pool=solutionPool(length,difficulty),unused=pool.filter(word=>!recent.includes(word)),available=unused.length?unused:pool;
        solution=available[Math.floor(Math.random()*available.length)];recent=[...recent,solution].slice(-150);
        roundId=id();guesses=[];guess="";gameOver=false;counted=false;outcomeSaved=false;phase="typing";drawBoard();
        message("Indovina la parola in "+attempts+" tentativi.");persist();
    }
    function restore(){
        const saved=read(roundKey,null);
        if(!saved||saved.version!==2||!WORD_LENGTHS.includes(saved.length)||!solutionWords.has(saved.solution)||saved.solution.length!==saved.length)return false;
        const max=saved.length<=5?6:saved.length===6?7:8;
        if(!Array.isArray(saved.guesses)||saved.guesses.length>max||saved.guesses.some(word=>!formalWord(word,saved.length))||saved.guesses.slice(0,-1).includes(saved.solution))return false;
        if(typeof saved.guess!=="string"||!/^[A-Z]*$/.test(saved.guess)||saved.guess.length>saved.length)return false;
        solution=saved.solution;length=saved.length;attempts=max;guesses=saved.guesses;guess=saved.guess;gameOver=guesses.includes(solution)||guesses.length===attempts;
        roundId=typeof saved.roundId==="string"&&saved.roundId.length<=80&&saved.roundId?saved.roundId:id();
        counted=gameOver&&(saved.outcomeRecorded===true||!Object.hasOwn(saved,"outcomeRecorded")&&!saved.pendingReveal);outcomeSaved=counted;
        difficulty=saved.difficulty==="varied"?"varied":"common";recent=Array.isArray(saved.recent)?saved.recent.filter(word=>solutionWords.has(word)).slice(-150):[solution];
        lengthSelect.value=saved.selection==="random"?"random":String(length);difficultySelect.value=difficulty;phase=gameOver?"finished":"typing";drawBoard();
        if(gameOver)recordOutcome(guesses.includes(solution));else message("Partita ripresa: "+(attempts-guesses.length)+" tentativi.");
        persist();return true;
    }
    function settleTransition(){
        const pending=busy();epoch++;cancelAnimations();
        if(pending){
            guesses.forEach((word,row)=>evaluateLetters(word,solution).forEach((kind,column)=>colourCell(cellAt(row,column),row,column,word[column],kind)));
            // No timers survive leaving the page. A committed guess survives
            // reload, and a terminal outcome is recorded at most once.
            concludeTurn(epoch,false);
        }
    }
    newButton.addEventListener("click",newGame);
    for(const select of [lengthSelect,difficultySelect])select.addEventListener("change",()=>{if(!busy())message("La scelta si applicherà alla nuova partita.");});
    document.addEventListener("keydown",event=>{
        if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest?.("input,select,textarea,[contenteditable],a")||event.target===newButton)return;
        const key=normalizeWord(event.key);if(key!=="ENTER"&&key!=="BACKSPACE"&&!/^[A-Z]$/.test(key))return;
        event.preventDefault();if(busy()||gameOver||key==="ENTER"&&event.repeat)return;
        keyButtons.get(key)?.classList.add("is-pressed");handleKey(key);
    });
    document.addEventListener("keyup",event=>keyButtons.get(normalizeWord(event.key))?.classList.remove("is-pressed"));
    document.addEventListener("paste",event=>{
        if(event.target.closest?.("input,select,textarea,[contenteditable]"))return;event.preventDefault();if(busy()||gameOver)return;
        const text=normalizeWord(event.clipboardData?.getData("text")||"");if(!/^[A-Z]+$/.test(text)){message("Usa soltanto lettere.","error");return;}
        const previous=guess.length;guess=(guess+text).slice(0,length);updateGuess(previous);message("Completa la parola di "+length+" lettere.");
    });
    window.addEventListener("blur",clearPressed);window.addEventListener("pagehide",settleTransition);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)settleTransition();});
    motion.addEventListener("change",()=>{if(motion.matches)settleTransition();});
    showStats();if(!restore())newGame();
}
