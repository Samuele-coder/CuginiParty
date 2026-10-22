// Original, manually curated everyday Italian vocabulary. No remote runtime
// dependency. Accents are accepted on input and folded to board letters.
export const normalizeWord=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const common=`
abito abete aceto acqua acuto agave aglio ago agosto agrume aiuto albero album alce alga alibi alba alito allarme alloro amaca amante amico amore anatra ancora anello angelo angolo animale anima anno ansia antenna ape aperto aprile aquila arancia arco ardito arena argento aria arma armadio aroma arte artista ascia asilo asino asola atleta attesa attimo attore aula audio autista autunno avena avorio azione azzurro
bacio baffo bagno balcone balena ballo banana banco banda barca barile barista basco basso basta batata batteria benda bene benzina bevanda bianco bibita bici biglia biglietto bilancia binario biondo biscotto bisonte bocca boccia bolide bolla bosco bottega bottone bovino braccio bravo breve brezza brodo bruco buccia budino buio burro busta busto
cacao caccia caffè calcio caldo calice callo calma calore calza cambio camera camino camice campo canale canapa cane canestro canna canto cantina capanna capello capo capra capretto carbone carciofo cardo carica carne carota carro carta cartella casa casata casco cassa castagna castello catena catino caverna cavallo cavolo cena cenere centro cera cerchio cervo cesto cetriolo chiave chiesa chiodo ciabatta cibo cicogna cielo cifra ciliegia cima cinema cinghiale cipolla circo città civetta classe clima cobra cocco coda codice cofano collana colle collo colore colpa colpo coltre cometa compagno compra comune conchiglia cono coniglio conto coperta coppia corallo corda corno corona corpo corsa corto corte cospetto costa cotone cottura covo cozza cratere crema crepa cresta criceto croce crosta cubo cucina cugino culla cuore curva cuscino custode
dado dama danza data debito decoro denaro dente deserto destra diario diesel difesa digitale diluvio dipinto disco disegno dito divano doccia dolce dolore domanda domenica donna dono dorso drago dritto dubbio duello duomo
ebano eclissi edera effetto elefante elenco elica elmo enigma entrata epoca erba erede errore esame esempio esodo estate età evento
fabbro faccia faggio falco fame famiglia fango farfalla farina faro fascia favola felce felice felino ferro festa fetta fiaba fiamma fianco fiato fibra fico fiducia fieno fiera figura fila film filo filtro finale finestra finocchio fiocco fiore firma fisco fiume flauto foglia foglio folata folla fonte foresta forma forno forte forza foto fossa frase fratello freno freddo fretta fronte frutto fuga fulmine fumo fungo fuoco furbo futuro
gabbia gallina gallo gamba gambero gara garbo garza gatto gelato gelo gemma genio gente geranio gesso gesto ghiaccio ghianda gioco gioia girasole gita giro giostra gonna gomito gomma gorgo grado grano grappa grasso gratis grillo gronda grosso grotta gruppo guado guaio guancia guanto guardia guida gufo gusto guscio
idea idolo ieri igiene immagine impegno incanto incrocio indice inverno invito iride isola istituto italiano
lama lampada lampo lana lancia larice largo lastra lato latte lavagna lavoro leccio legame legna legno lento lenza leone lepre lettera letto leva libro liceo lieve limite limone linea lingua lira lisca lista litro locale lode logo lotta luce luglio luna lunedì lungo luogo lupo
macchia madia madre maggio maglia mago magro mais malta mamba mancia mandorla mano mantello mappa marca mare marmo marmotta marzo maschera maschio massa mattina mattone matita mazzo medaglia medico melone menta merenda merlo mese mestolo metro mezzo miele mirtillo modello moglie molla mollica mondo moneta monte morso mostra mostro motore moto motto mucchio mucca mulino muro museo musica muto
naso nastro natura nave nebbia negozio neve nicchia nido niente nipote nocciola nodo nome nonno nord norma nota notte novità numero nuoto nuvola
occhio oca ocra odore olio oliva omaggio ombra onda onore opera ora orario orata orco organo oro orso ortica orto osso ostrica otto ovatta ovest
pacco pace padella padre paese paga pagina paglia palco palestra paletto palla pallina palma palo panda pane panno panna paolo papavero papera pappa parco parete parola parte partita pascolo passo pasta pastore patata pausa pavone pazienza pecora pedale pegno pelle penna pensiero pepe pera perla persico persona pesante pesca pesce peso pettine petto pezzo piano piazza picchio piede piega pieno pietra pigna pino pinza pioggia pioppo pipa pista pittore piuma pizza placa poeta polenta pollo pollice polpa polpo polvere pomata pompa ponte popolo porta porto posa posto pozzo pratica prato preda premio prezzo primo profumo prova prugna prua punto puzzle
quadro quaglia quanto quattro quercia quota
racconto radice radio raggio ragno ramo rana rapa rapido ratto ravanello razza razzo reale regalo regina regno remo renna resina resto rete ricamo riccio ricetta ricordo riga riso risata ritmo rito ritratto roccia robot rosa rospo rosso rotta rovere roveto rubino ruota russo
sabbia sabato sacco saggio sale salita salmone salone salsa salto salute salvia samba sasso scala scalo scarpa scatola scena sceriffo scheda schermo schiuma scia sciame sciarpa scimmia scodella scoglio scolaro scopa scorta scorza scudo scuro sedia segno sella seme senso sera sereno serra seta sfera sfida sfilata sfondo sguardo sigaro silenzio simbolo sirena sito slitta smalto soccorso soffio sogno soglia soldato sole solido sonno sonda sordo sorriso sorte sospiro sosta sottomano spazio specchio spesa spiga spilla spina spinta sposa spruzzo squadra squalo stadio staffa stagno stalla stella stelo stemma stima stoffa storia strada strato strega stretto striscia studio stucco sugo suola suono suora svolta
tacco taglio talpa tamburo tappeto tappa tardi targa tasca tasso tavola tavolo teatro tegola tela telaio telefono tempio tempo tenda tenore tepore termine terra tesoro testa tetto tiglio tigre timbro tipo tiro titolo tocco tonno topo torcia torre torta tortora tosse totale tovaglia trave treno trenta treccia trifoglio tronco tuono turno tuta tutto
ulivo umido unghia unione unico uovo urlo uso utile uva
vacanza vagone valanga valle valore vanga vaniglia vapore varco vaso vasca vela velo vena vento verbo verde verità vespa veste vetro viaggio viale vibra vicolo video vigile villa viola vipera virgola visione visita viso vita vitello vittoria voce voglia volpe volta voto vulcano
wafer whisky yacht yogurt zaino zampa zebra zero zia zolla zona zucca zucchero zuppa
`;
const varied=`
abile abisso accento accordo accusa acerbo acido adatto adulto affetto agile agnello allegro allievo alzare ambra andare anonimo antico anziano appello aratro ardente argilla aspetto assalto astuto augurio austero avviso avvolto
baldoria bellezza benigno bisogno bizzarro bollore boschetto bottino bramare brillante bronzo burrasca
calcolo candela candido capace capitale carezza carisma cascata cautela celebrare cercare chiaro chinare chiudere circolare citare classico clemente coccola collina colorato comando comico compito confine consumo copione correre costante cottimo creare credere crescere critico curioso
debole deciso delicato destino diverso docile domanda dormire dovuto durare
elegante energia enorme entrare esatto esperto esposto estivo eterno evadere evitare
facile fattore fedele fermare fermo festivo fervore fiamma fiorire fiscale fluido formica fragile frana fresco frugale fuggire furioso
galante garanzia gentile giocare giovane gioioso giusto goloso gonfio gravità grazia grembo gridare guadagno guarire
ideale ignoto illeso imparare impegno imporre imposta indizio infinito insieme intero intesa intuito ironico
lanciare lavare leale leggero leggere libero limpido lodare lontano lucente lucido luminoso
magico mancare mangiare maturo mentire migliore miniera minuto miraggio moderno momento monaco morbido
nascere nascita nativo negare nitido normale notare nutrire
offerta onesto opaco ordine orizzonte ornare ottavo ottimo ovunque
pacifico parlare passare perfetto piccolo pittura placido planetario potere pregiato presente premura privato prodigio proprio pulire pulito
quieto quinta
radioso ragione rapido ricevere ridere riflesso rifugio rigido riparo ripieno riserva risveglio ritardo romano rotolare rotondo ruvido
salvare scendere sciogliere scivolo scrivere seguire sentire semplice serata servire sicuro sincero snello soffice soltanto sorridere sospeso speciale splendido stabile stagione stupore superare supremo
talento temere tenero tornare tranquillo tremare trovare truccare turchese
udire ultimo unire urgente uscire
valido vedere venire vestire vivere volante volare vuoto
`;
const excluded=new Set(['PAOLO','MAMBA']);
const words=source=>[...new Set(source.split(/\s+/).map(normalizeWord).filter(word=>/^[A-Z]{4,8}$/.test(word)&&!excluded.has(word)))].sort();
export const COMMON_WORDS=Object.freeze(words(common));
export const VARIED_WORDS=Object.freeze(words(varied));
export const ACCEPTED_WORDS=Object.freeze([...new Set([...COMMON_WORDS,...VARIED_WORDS])].sort());
export const WORD_LENGTHS=Object.freeze([4,5,6,7,8]);
export function solutionPool(length,difficulty='common'){
    return (difficulty==='varied'?ACCEPTED_WORDS:COMMON_WORDS).filter(word=>word.length===length);
}
export function evaluateLetters(guess,solution){
    const result=Array(solution.length).fill('absent'),remaining={};
    for(let i=0;i<solution.length;i++)if(guess[i]===solution[i])result[i]='correct';else remaining[solution[i]]=(remaining[solution[i]]||0)+1;
    for(let i=0;i<solution.length;i++)if(result[i]!=='correct'&&remaining[guess[i]]>0){result[i]='present';remaining[guess[i]]--;}
    return result;
}
