// Visual layer only: no game state, configuration, authentication or scheduling.
export const SCENES = Object.freeze({
    halloween: {edition:'La notte dei cugini',sky:'#e87927',night:'#743615',light:'#fff5e4',dark:'#251c19',accent:'#9b3909',glow:'#ffc35b',motifs:['bat','ghost','pumpkin'],motion:'haunted'},
    christmas: {edition:'Un inverno da giocare',sky:'#c8e2e4',night:'#173c39',light:'#fbf9f1',dark:'#172f2d',accent:'#1e614e',glow:'#e8be68',motifs:['snow','pine','gift'],motion:'snowfall'},
    epiphany: {edition:'Una notte di meraviglie',sky:'#39446f',night:'#161f40',light:'#f5f1ff',dark:'#20253f',accent:'#554286',glow:'#f2ce83',motifs:['star','befana','stocking'],motion:'starlight'},
    easter: {edition:'La primavera è in gioco',sky:'#cce9d8',night:'#243f33',light:'#fffdf2',dark:'#22382e',accent:'#45652a',glow:'#e9bd6d',motifs:['petal','butterfly','egg'],motion:'garden'},
    newyear: {edition:'Il prossimo livello comincia qui',sky:'#1b3151',night:'#111e34',light:'#fffaed',dark:'#1d293d',accent:'#77580e',glow:'#e9ce86',motifs:['spark','firework','star'],motion:'celebration'},
    carnival: {edition:'Che la festa abbia inizio',sky:'#773c78',night:'#352442',light:'#fff6ef',dark:'#38263e',accent:'#8c285f',glow:'#ffd37d',motifs:['confetti','mask','ribbon'],motion:'parade'},
    valentine: {edition:'Le sfide più belle si condividono',sky:'#e9afb3',night:'#512632',light:'#fff5f1',dark:'#38232d',accent:'#9c304d',glow:'#efbba0',motifs:['petal','heart','rose'],motion:'romance'},
    summer: {edition:'Una pausa, un mare di giochi',sky:'#65cad4',night:'#16454e',light:'#fffbed',dark:'#173b42',accent:'#09616a',glow:'#ffe08c',motifs:['glint','palm','shell'],motion:'seaside'}
});

export const sceneURL=(id,size='wide')=>new URL(`../assets/events/${id}-${size}.webp`,import.meta.url).href;
export function officialPalette(id){
    const scene=SCENES[id];
    const soft='#'+scene.dark.slice(1).match(/../g).map(value=>Math.round(parseInt(value,16)*.87+255*.13).toString(16).padStart(2,'0')).join('');
    return {paper:scene.dark,ink:'#fff6e8',surface:scene.dark,soft,accent:scene.glow,border:'#9b8871',decor:scene.glow};
}
const effects={halloween:'Pipistrelli, fantasmi fluttuanti e bagliori delle zucche',christmas:'Neve leggera e decorazioni sospese',epiphany:'Stelle scintillanti e passaggio occasionale della Befana',easter:'Petali e farfalle nel giardino',newyear:'Scintille e fuochi occasionali',carnival:'Coriandoli e maschere sospese',valentine:'Petali e cuori fluttuanti',summer:'Riflessi sul mare e palme leggere'};

// Bespoke, filled foreground illustrations. The large backdrop carries the
// detailed environment; these light vectors add independent motion and depth.
const motifs={
    bat:'<path fill="#201a23" d="M48 39 39 25l-6 10C24 24 13 20 3 18c5 14 4 27 1 37 12-10 20-8 24-1 8-5 12 0 20 12 8-12 12-17 20-12 4-7 12-9 24 1-3-10-4-23 1-37-10 2-21 6-30 17l-6-10-9 14Z"/><path d="M15 31q15 4 25 19M81 31Q66 35 56 50" fill="none" stroke="#60404d" stroke-width="2"/><circle cx="44" cy="43" r="2" fill="#ffd682"/><circle cx="52" cy="43" r="2" fill="#ffd682"/>',
    ghost:'<path d="M22 80V36C22 6 75 6 75 36v45q-8-13-16-3-10 13-18-1-8-8-19 3Z" fill="#fff7db"/><path d="M23 49Q3 43 8 29q5 14 16 6m50 14q18-3 16-17-6 9-15 3" fill="#fff7db"/><ellipse cx="40" cy="37" rx="5" ry="7" fill="#47372c"/><ellipse cx="60" cy="37" rx="5" ry="7" fill="#47372c"/><ellipse cx="50" cy="54" rx="5" ry="7" fill="#cf9063"/><path d="M31 68V35q0-13 10-17" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/>',
    pumpkin:'<path d="m48 24 2-14 11-3-5 17" fill="#4e5d32"/><path d="M49 25C7 6-7 71 25 83q23 9 48-2c31-17 14-74-24-56Z" fill="#dc6618"/><path d="M48 25C24 12 10 78 42 86M49 25c28-15 43 56 13 60" fill="#f79b29"/><path d="m24 46 16-7-5 17Zm45 0-15-7 4 17ZM25 65l12 3 4-5 8 7 10-7 5 4 10-3Q51 88 25 65" fill="#ffe18c"/><path d="M23 32q-9 12-7 25" fill="none" stroke="#ffd484" stroke-width="3"/>',
    snow:'<g stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M48 10v76M15 29l66 38M15 67l66-38M37 15l11 11 11-11M37 81l11-11 11 11M16 42l16-4-4-15m40 50-4-15 16-4M16 54l16 4-4 15m40-50-4 15 16 4"/></g>',
    pine:'<path d="M44 68h9v24h-9Z" fill="#78513c"/><path d="m48 5-20 27h9L14 58h16L8 81q40 10 80 0L66 58h16L59 32h9Z" fill="#20534b"/><path d="m48 5-20 27 20-6 20 6Zm-11 37L14 58l34-4 34 4-23-16 4 10H33Zm-7 25L8 81q40 10 80 0L66 67l5 11q-23-6-46 0Z" fill="#eef9ed"/><g fill="#edc668"><circle cx="38" cy="48" r="3"/><circle cx="60" cy="70" r="3"/><circle cx="28" cy="79" r="3"/></g>',
    gift:'<rect x="16" y="40" width="64" height="45" rx="4" fill="#a73940"/><rect x="12" y="33" width="72" height="15" rx="4" fill="#c45151"/><path d="M43 33h12v52H43Z" fill="#f1d498"/><path d="M48 33C5 34 23-10 48 33c27-43 43 1 0 0Z" fill="none" stroke="#f1d498" stroke-width="7"/>',
    star:'<path d="m48 8 11 25 29 4-21 20 5 29-24-14-25 14 5-29L7 37l29-4Z" fill="#f7d88c"/><path d="m48 8 1 40 39-11-30 20 14 29-24-25-25 25 15-34L7 37l36 4Z" fill="#fff2c6" opacity=".7"/>',
    befana:'<path d="M8 72 93 56" stroke="#bb8956" stroke-width="4"/><path d="m9 66-8 11 20 4 6-19Z" fill="#e0b46c"/><path d="m34 45 8-27 16 14-6 8 18 7-26 5Z" fill="#282339"/><path d="M46 46q-17 8-17 22l30-6-8-14Z" fill="#694d8d"/><path d="m51 41 12-4-2 7-7 4" fill="#efc9a5"/><path d="m42 65 10 8 11-3" fill="none" stroke="#282339" stroke-width="6"/><path d="M29 51q-13-9-17-1l5 14 14-5Z" fill="#8d6b53"/><path d="m16 50 8 10" stroke="#bba185" stroke-width="2"/>',
    stocking:'<path d="M37 20h35v46L42 87C12 98 8 72 32 62l5-6Z" fill="#a8485e"/><path d="M32 14h44v15H32Z" fill="#fff1d9"/><path d="m28 67 11 18m20-51 11 8M49 45l12 7" stroke="#eecf93" stroke-width="4"/>',
    petal:'<path d="M24 11C72 0 96 43 51 83 17 77 2 41 24 11Z" fill="#efafba"/><path d="M49 76Q29 51 29 20" stroke="#fff1d5" stroke-width="2" fill="none"/>',
    butterfly:'<path d="M46 49C-2-8 1 68 37 63 9 92 58 89 48 52 38 89 87 92 59 63 95 68 98-8 50 49Z" fill="#eebf65"/><path d="M45 51C13 14 12 52 39 55m12-4c32-37 33 1 6 4" fill="#bb6c8f"/><path d="m42 25 6 10 6-10M48 37v31" stroke="#515239" fill="none" stroke-width="3"/>',
    egg:'<path d="M17 63C17 38 37 9 48 9S79 38 79 63c0 34-62 34-62 0Z" fill="#a1cdbd"/><path d="m20 48 14 9 14-9 14 9 14-9M19 72h58" fill="none" stroke="#fff3c8" stroke-width="6"/><g fill="#f5d57f"><circle cx="39" cy="32" r="4"/><circle cx="58" cy="32" r="4"/></g>',
    spark:'<path d="m48 9 7 30 32 9-32 8-7 31-8-31-31-8 31-9Z" fill="#f5d694"/><circle cx="48" cy="48" r="8" fill="#fff5d4"/>',
    firework:'<g stroke="#f6d995" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M48 38V8m0 50v30M38 48H8m50 0h30M40 40 18 18m38 38 22 22M40 56 18 78m38-38 22-22M44 28l-6-14m24 68-6-14M28 44l-14-6m68 24-14-6"/></g><g fill="#fff6de"><circle cx="48" cy="48" r="4"/><circle cx="28" cy="13" r="2"/><circle cx="83" cy="32" r="2"/></g>',
    confetti:'<path d="m20 12 9 5-6 14-9-5Z" fill="#efb74e"/><path d="m65 22 11-3 4 14-11 3Z" fill="#66c2bd"/><path d="m43 52 14 3-2 12-14-3Z" fill="#ea7e95"/><path d="m18 76 9-7 7 10-9 7Z" fill="#bba1e5"/><path d="m71 65 10 8-7 9-10-8Z" fill="#f9d385"/>',
    mask:'<path d="M8 26q20-14 40 3 20-17 40-3l-4 30q-13 25-36 1-23 24-36-1Z" fill="#d3a44d"/><path d="M11 30q20-9 37 7 17-16 37-7L73 48 48 57 23 48Z" fill="#753963"/><path d="M21 40q13-8 20 5-13 7-20-5Zm34 5q7-13 20-5-7 12-20 5Z" fill="#fff1c0"/><path d="m48 28 1 27M15 31l8-9m50 0 9 9" stroke="#ffe4a1" fill="none" stroke-width="2"/>',
    ribbon:'<path d="M65 10C-10 25 98 46 36 62s25 26 40 17" stroke="#e8ad59" stroke-width="8" fill="none"/><path d="M64 10C-10 25 98 46 36 62s25 26 40 17" stroke="#ffe2a0" stroke-width="2" fill="none"/>',
    heart:'<path d="M48 83 15 52C-15 22 25-5 48 23 72-5 111 22 81 52Z" fill="#bc465d"/><path d="M15 38q-5-20 17-18" stroke="#f6aaa9" stroke-width="5" fill="none"/><path d="m48 29 2 45 29-31-23 40-8 1Z" fill="#a52d4a" opacity=".5"/>',
    rose:'<path d="M48 45v44m0-19q-27 1-25-17 20 1 25 17m0 9q25 0 24-18-19 1-24 18" fill="#59816a" stroke="#59816a" stroke-width="3"/><path d="M48 13C17 1 9 39 30 52c22 18 57-5 46-26-5-14-16-19-28-13Z" fill="#bd5069"/><path d="M48 13c-21 3-26 19-11 28 20 14 38-16 16-18-21-3-14 20 2 13" fill="none" stroke="#ed9aa7" stroke-width="5"/>',
    glint:'<path d="m48 8 6 34 34 6-34 6-6 34-6-34-34-6 34-6Z" fill="#fff5c7"/>',
    palm:'<path d="M42 89q15-34 10-55h7q9 30-3 55Z" fill="#b28251"/><path d="M54 36Q4 3 5 45q28-24 49-9M54 36Q22-10 24 9l8 22m22 5q37-45 40-6-27-12-40 6m0 0Q92 25 87 60 69 36 54 36m0 0Q28 21 18 61 39 36 54 36m0 0Q54-4 67 7l-8 28" fill="#397e66"/><path d="m45 73 13 2m-10-17 13 2" stroke="#dfba76" stroke-width="3"/>',
    shell:'<path d="M48 83 13 51C-12 2 109 2 83 51Z" fill="#f6d7ac"/><path d="M48 83V17m0 66L25 22m23 61 23-61M13 51l35 32 35-32" stroke="#d9a985" stroke-width="3" fill="none"/>'
};
export function createSceneMotif(name){
    if(name==='ghost'||name==='befana'){
        const image=document.createElement('img');image.src=new URL(`../assets/events/${name}.webp`,import.meta.url).href;
        image.alt='';image.setAttribute('aria-hidden','true');image.decoding='async';image.draggable=false;return image;
    }
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 96 96');svg.setAttribute('aria-hidden','true');
    svg.innerHTML=motifs[name]||motifs.star;return svg;
}

export function clearScene(){
    document.querySelectorAll('[data-event-visual]').forEach(node=>node.remove());
    document.querySelectorAll('[data-event-gallery]').forEach(node=>node.removeAttribute('data-event-gallery'));
    for(const key of ['eventScene','eventDensity','eventStatic'])delete document.body.dataset[key];
    for(const key of ['scene','scene-mobile','sky','night','glow','button-ink'])document.body.style.removeProperty('--event-'+key);
}

export function mountScene(id,{staticArt,motion,particles,special,reduced,intensity}){
    const body=document.body,scene=SCENES[id],home=Boolean(document.querySelector('.hero'));
    body.dataset.eventScene=home?'home':window.CuginiPartyEventAdmin?'admin':'game';
    body.dataset.eventDensity=reduced?'reduced':'full';body.dataset.eventStatic=staticArt?'on':'off';
    body.style.setProperty('--event-scene',`url("${sceneURL(id)}")`);
    body.style.setProperty('--event-scene-mobile',`url("${sceneURL(id,'mobile')}")`);
    for(const key of ['sky','night','glow'])body.style.setProperty('--event-'+key,scene[key]);
    const node=(tag,className)=>{const el=document.createElement(tag);el.className=className;el.dataset.eventVisual='';el.setAttribute('aria-hidden','true');return el;};
    if(staticArt){
        const world=node('div','event-world');world.id='event-world';body.prepend(world);
        const hero=document.querySelector('.hero');
        if(hero){
            const edition=node('div','event-edition');edition.removeAttribute('aria-hidden');edition.append(createSceneMotif(scene.motifs[0]));const text=document.createElement('span');text.textContent=scene.edition;edition.append(text);hero.querySelector('.hero-content')?.prepend(edition);
            const foreground=node('div','event-foreground');
            for(let i=0;i<4;i++){
                const item=node('span','event-character'),motif=scene.motifs[i%3];item.dataset.motif=motif;item.style.setProperty('--i',i);
                if(i===2){item.classList.add('event-lantern-glow');}else item.append(createSceneMotif(motif));
                foreground.append(item);
            }hero.append(foreground);
        }
        for(const el of document.querySelectorAll('.footer,.section-header')){const seal=node('span','event-scene-seal');seal.append(createSceneMotif(scene.motifs[2]));el.append(seal);}
        // CSS grid pseudo-elements reserve their own rows. They cannot be
        // mistaken for games by the existing live catalogue sorter.
        const grid=document.querySelector('.games-grid');if(grid)grid.dataset.eventGallery='';
    }
    if(motion&&(particles||special)){
        const layer=node('div','event-atmosphere');layer.id='event-atmosphere';layer.dataset.motion=scene.motion;
        const count=particles?Math.max(2,Math.round((reduced?5:12)*intensity/100)):0;
        for(let i=0;i<count;i++){const p=node('span','event-particle');p.style.setProperty('--i',i);p.style.left=`${(i+.5)/count*100}%`;p.append(createSceneMotif(scene.motifs[0]));layer.append(p);}
        if(special){const traveller=node('span','event-traveller');traveller.dataset.motif=scene.motifs[1];traveller.append(createSceneMotif(scene.motifs[1]));layer.append(traveller);}
        body.append(layer);
    }
}

export function createScenePreview(id,name){
    const figure=document.createElement('figure');figure.className='event-scene-preview';figure.dataset.sceneId=id;
    const image=document.createElement('img');image.src=sceneURL(id,'mobile');image.loading='lazy';image.decoding='async';image.alt=`Fondale illustrato ${name}`;image.width=900;image.height=600;
    const caption=document.createElement('figcaption');caption.append(createSceneMotif(SCENES[id].motifs[2]));
    const label=document.createElement('strong');label.textContent=SCENES[id].edition;caption.append(label);
    const note=document.createElement('small');note.textContent=effects[id];caption.append(note);
    const sample=document.createElement('span');sample.className='event-preview-components';sample.textContent='CuginiParty';const button=document.createElement('b');button.textContent='GIOCA';sample.append(button);caption.append(sample);
    figure.style.setProperty('--preview-accent',SCENES[id].glow);figure.style.setProperty('--preview-paper',SCENES[id].dark);figure.append(image,caption);return figure;
}
