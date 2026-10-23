import {attackTiming,muzzlePosition} from './sprite-animation.mjs';
import {attackVisual} from './combat-visuals.mjs';
import {partnerMove,PARTNER_MOVES} from './partner-moves.mjs';
import {MOVES} from './arena/moves.mjs';
import {STARTER_IDS,loadCollectionProgress,isUnlocked,rollVisitor,COLLECTIBLE_IDS,LEGENDARY_VISITORS,usedSlots,slotPrice,defeatPoints,MAX_COLLECTION_POINTS,COLLECTION_VERSION} from './collection.mjs';
import {EXTRA_ROUTES} from './routes.mjs';
import {EXTRA_TOWERS,EXTRA_EVOLUTIONS,EXTRA_ENEMIES} from './expanded-roster.mjs';
import {SPECIAL_PARTNERS,SPECIAL_TOWERS,SPECIAL_EVOLUTIONS} from './special-partners.mjs';
export {STARTER_IDS} from './collection.mjs';
export const WIDTH = 960, HEIGHT = 560, MAX_WAVES = 15;
export const DIFFICULTIES = [
  {id:'easy',name:'Easy',tagline:'Room to learn',coins:425,hearts:25,health:.8,speed:.9,crowd:.85,spawn:1.1},
  {id:'normal',name:'Normal',tagline:'The classic adventure',coins:360,hearts:20,health:1,speed:1,crowd:1,spawn:1},
  {id:'hard',name:'Hard',tagline:'Every choice counts',coins:330,hearts:15,health:1.3,speed:1.1,crowd:1.15,spawn:.9},
  {id:'expert',name:'Expert',tagline:'For seasoned trainers',coins:300,hearts:10,health:1.6,speed:1.2,crowd:1.3,spawn:.8},
];
export const difficultyFor=id=>DIFFICULTIES.find(d=>d.id===id)||DIFFICULTIES[1];
export const TOWERS = [
  {"id":1,"name":"Bulbasaur","type":"grass","cost":100,"damage":13,"range":145,"rate":0.82,"color":"#69a672","move":"Vine Whip","ability":"Poison damage","description":"Plants the seeds of victory. Each hit poisons its target for extra damage over time.","stages":[1,2,3],"names":["Bulbasaur","Ivysaur","Venusaur"]},
  {"id":4,"name":"Charmander","type":"fire","cost":125,"damage":22,"range":137,"rate":1.05,"color":"#de8968","move":"Ember","ability":"Splash damage","description":"The warmest welcome. Fiery attacks hit every wild Pokémon within a small area.","stages":[4,5,6],"names":["Charmander","Charmeleon","Charizard"]},
  {"id":7,"name":"Squirtle","type":"water","cost":110,"damage":12,"range":145,"rate":0.85,"color":"#76a9c1","move":"Water Gun","ability":"Slows enemies","description":"Go with the slow. Water attacks slow wild Pokémon by 38% for 1.8 seconds.","stages":[7,8,9],"names":["Squirtle","Wartortle","Blastoise"]},
  {"id":25,"name":"Pikachu","type":"electric","cost":130,"damage":20,"range":152,"rate":0.8,"color":"#e9bc43","move":"Thunder Shock","ability":"Chain lightning","description":"Your first electric partner. Zaps a second nearby wild Pokémon for 45% damage. Evolve into Raichu, then train further.","stages":[25,26,26],"names":["Pikachu","Raichu","Raichu"]},
  {"id":133,"name":"Eevee","type":"normal","cost":90,"damage":12,"range":125,"rate":0.48,"color":"#bba080","move":"Quick Attack","ability":"Rapid attacks","description":"A special thank-you for defeating Onix and clearing wave 5. Choose one of three Kanto stone evolutions.","stages":[133,133,133],"names":["Eevee","Eevee","Eevee"],"unlock":"Defeat Onix and clear wave 5 on any route."},
  {"id":10,"name":"Caterpie","type":"bug","cost":100,"damage":15,"range":150,"rate":1.1,"color":"#99ae65","move":"String Shot","ability":"Slowing silk","slowTime":1.2,"slowFactor":0.82,"description":"Small beginnings, big wings. Silk slows wild Pokémon by 18%. Metapod learns contact attacks; Butterfree learns Bug Buzz or Gust.","stages":[10,11,12],"names":["Caterpie","Metapod","Butterfree"],"types":["bug","bug","flying"]},
  {"id":63,"name":"Abra","type":"psychic","cost":155,"damage":30,"range":170,"rate":1.15,"color":"#b894ce","move":"Hidden Power","ability":"Psychic reach","description":"A rare visitor with long-range energy attacks. Grows into Kadabra and Alakazam, with their own Arena moves.","stages":[63,64,65],"names":["Abra","Kadabra","Alakazam"]},
  {"id":81,"name":"Magnemite","type":"electric","cost":130,"damage":20,"range":152,"rate":0.8,"color":"#e9bc43","move":"Thunder Shock","ability":"Chain lightning","description":"A rare visitor that favors riverbanks and caves. Zaps a second nearby wild Pokémon for 45% damage.","stages":[81,82,82],"names":["Magnemite","Magneton","Magneton"]},
  {"id":131,"name":"Lapras","type":"water","cost":210,"damage":26,"range":165,"rate":1.1,"color":"#76a9c1","move":"Ice Shard","ability":"Slowing waves","description":"A gentle rare visitor. Ice Shard or Surf carries a slowing-water perk; training increases its power without changing species.","stages":[131,131,131],"names":["Lapras","Lapras","Lapras"]},
  {"id":37,"name":"Vulpix","type":"fire","cost":140,"damage":20,"range":145,"rate":0.9,"color":"#de8968","move":"Ember","ability":"Foxfire splash","description":"A rare visitor that favors autumn trails and coasts. Small fire bursts grow into Ninetales’s sweeping flames.","stages":[37,38,38],"names":["Vulpix","Ninetales","Ninetales"]},
  {"id":147,"name":"Dratini","type":"dragon","cost":190,"damage":28,"range":155,"rate":0.95,"color":"#9d95d3","move":"Dragon Rage","ability":"Steady dragon power","description":"An elusive rare visitor. Raise Dratini into Dragonair, then Dragonite.","stages":[147,148,149],"names":["Dratini","Dragonair","Dragonite"]},
  ...EXTRA_TOWERS,
  ...SPECIAL_TOWERS,
  {"id":145,"name":"Zapdos","type":"electric","cost":360,"damage":40,"range":180,"rate":1.1,"color":"#e9bc43","move":"Thunder Shock","ability":"Legendary lightning","description":"A random legendary visitor in wave 14 on any route. Chains lightning; training strengthens its legendary power.","stages":[145,145,145],"names":["Zapdos","Zapdos","Zapdos"],"legendary":true},
  {"id":144,"name":"Articuno","type":"ice","cost":360,"damage":34,"range":180,"rate":1.1,"color":"#83c9da","move":"Ice Beam","ability":"Freezing wind","description":"A random legendary visitor in wave 14 on any route. Slows enemies by 45% for 2 seconds.","slowTime":2,"slowFactor":0.55,"stages":[144,144,144],"names":["Articuno","Articuno","Articuno"],"legendary":true},
  {"id":146,"name":"Moltres","type":"fire","cost":360,"damage":45,"range":170,"rate":1.2,"color":"#de8968","move":"Ember","ability":"Legendary fire","description":"A random legendary visitor in wave 14 on any route. Powerful flames splash across the path.","stages":[146,146,146],"names":["Moltres","Moltres","Moltres"],"legendary":true},
];
export const XP_THRESHOLDS = [0,40,120];
export const XP_RULES = {defeat:2,combatCap:12,clear:6,boss:8,picnic:20};
// Gradually introduce runners, flyers and ground types before the first boss.
export const OPENING_WAVES = [
  {count:6,pool:[10],health:.85,interval:1.5,bounty:.75,reward:60,label:'First steps · a few Caterpie'},
  {count:8,pool:[10,13],health:.9,interval:1.35,bounty:.75,reward:55,label:'A little company · Weedle joins'},
  {count:10,pool:[10,13,19],health:.95,interval:1.2,bounty:.75,reward:60,label:'Quick paws · watch for Rattata'},
  {count:13,pool:[10,19,16],health:1,interval:1.05,bounty:.75,reward:65,label:'Wings above · Pidgey arrives'},
  {count:16,pool:[19,27,13],health:1,interval:.975,bounty:1,reward:90},
];
// A path changes the move as well as the sprite. Its identity stays with the partner.
export const EVOLUTIONS = {
  ...EXTRA_EVOLUTIONS,
  ...SPECIAL_EVOLUTIONS,
  1:[
    {"id":"garden","name":"Petal garden","ability":"Lingering poison","description":"Razor Leaf grows into Petal Blizzard. Your garden perk deals 50% power as poison each second for 4 seconds.","poisonPower":0.5,"poisonTime":4},
    {"id":"razor","name":"Solar keeper","ability":"Long-range leaves","description":"Solar Beam grows into Frenzy Plant. Gain 40% direct power and +25 range, with lighter poison.","power":1.4,"reach":25,"poisonPower":0.12},
  ],
  4:[
    {"id":"blast","name":"Blast zone","ability":"Explosive fireballs","description":"Charmeleon uses Fire Fang; Charizard learns Fire Blast. Your blast perk adds an 85-pixel splash at 80% power.","splash":85,"splashPower":0.8,"tempo":1.1},
    {"id":"flame","name":"Flame stream","ability":"Rapid fire","description":"Attacks almost twice as often at 72% power, with a smaller splash.","power":0.72,"tempo":0.55,"splash":30},
  ],
  7:[
    {"id":"current","name":"Deep current","ability":"Stronger slowing","description":"Water Pulse grows into Hydro Pump. Slow targets by 50% for 2.8 seconds, with +10 range.","slowFactor":0.5,"slowTime":2.8,"reach":10},
    {"id":"hydro","name":"Pressure jet","ability":"Water splash","description":"Hydro Pump grows into Hydro Cannon. Gain 75% power and a small splash; slow targets for 0.8 seconds.","power":1.75,"splash":40,"slowFactor":0.8,"slowTime":0.8},
  ],
  10:[
    {"id":"tempest","name":"Swarm keeper","ability":"Wide-area attacks","description":"Metapod uses Bug Bite; Butterfree learns Bug Buzz. Your swarm perk adds a 105-pixel splash and faster attacks.","splash":105,"tempo":0.82},
    {"id":"air","name":"Focused striker","ability":"Focused attacks","description":"Metapod uses Tackle; Butterfree learns Gust. Gain 70% power and +35 reach, with no splash.","power":1.7,"reach":35,"splash":0},
  ],
  25:[
    {"id":"storm","name":"Storm caller","ability":"Three lightning jumps","description":"Raichu calls down Thunder. Your chain perk reaches three extra targets for 55% power.","chain":3,"chainPower":0.55},
    {"id":"bolt","name":"Thunder striker","ability":"Focused lightning","description":"Raichu lunges into Thunder Punch. Gain 45% power and +35 reach, with no chain.","power":1.45,"reach":35,"chain":0},
  ],
  37:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
  63:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
  81:[
    {"id":"storm","name":"Triad keeper","ability":"Three lightning jumps","description":"Magneton uses Tri Attack. Your chain perk reaches three extra targets for 55% power.","chain":3,"chainPower":0.55},
    {"id":"bolt","name":"Longshot","ability":"Focused lightning","description":"Magneton launches Zap Cannon. Gain 45% power and +35 range, with no chain.","power":1.45,"reach":35,"chain":0},
  ],
  131:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
  133:[
    {"id":"vaporeon","name":"Water Stone","species":134,"evolvedName":"Vaporeon","type":"water","color":"#76a9c1","ability":"Slowing water","description":"Become Vaporeon: Water Gun grows into Hydro Pump. Water slows targets by 38% for 1.8 seconds.","power":1.3},
    {"id":"jolteon","name":"Thunder Stone","species":135,"evolvedName":"Jolteon","type":"electric","color":"#e9bc43","ability":"Rapid chain lightning","description":"Become Jolteon: Thunder Shock grows into Thunder. Attack faster and chain to two extra targets at 50% power.","tempo":0.8,"chain":2,"chainPower":0.5},
    {"id":"flareon","name":"Fire Stone","species":136,"evolvedName":"Flareon","type":"fire","color":"#de8968","ability":"Fiery splash","description":"Become Flareon: Ember grows into Flare Blitz. Gain 60% power and a 65-pixel splash.","power":1.6,"splash":65},
  ],
  144:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
  145:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
  146:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
  147:[
    {"id":"focus","name":"Focused power","ability":"Long-range specialist","description":"Gain 45% power and +25 range. Keep your elemental ability.","power":1.45,"reach":25},
    {"id":"surge","name":"Crowd keeper","ability":"Wide-area specialist","description":"Attacks splash across a 75-pixel area and fire 15% faster.","splash":75,"tempo":0.85},
  ],
};
// Arena owns move identity; the path descriptions explain tower-defense perks.
for(const spec of TOWERS){
  for(const path of EVOLUTIONS[spec.id]){
    path.moves=[spec.move,...PARTNER_MOVES[spec.id][path.id].map(slug=>MOVES[slug].name)];
    path.move=path.moves[1];
  }
}
export const evolutionOptions=tower=>EVOLUTIONS[tower.kind]||[];
export const xpProgress=tower=>{
  const goal=XP_THRESHOLDS[tower.level]??XP_THRESHOLDS.at(-1),start=XP_THRESHOLDS[tower.level-1];
  return {goal,xp:tower.xp||0,ready:tower.level<3&&(tower.xp||0)>=goal,percent:tower.level===3?100:Math.min(100,Math.max(0,((tower.xp||0)-start)/(goal-start)*100))};
};
export function rewardOptions(wave,maxLives=20){return [
  {id:'picnic',name:'Training picnic',icon:'leaf',detail:`+${XP_RULES.picnic} XP to every placed partner`,description:'Help your newest teammates reach their next evolution.'},
  {id:'charm',name:'Power charm',icon:'spark',detail:'+12% team power for this run',description:'Stacks with earlier charms. Includes partners you place later.'},
  {id:'supplies',name:'Supply satchel',icon:'heart',detail:`+${wave===5?250:400} coins · restore 4 hearts`,description:`Recruit more friends and repair your Center, up to ${maxLives} hearts.`},
];}
export const MAPS = [
  {name:'Viridian Forest',subtitle:'A fresh start beneath the canopy.',label:'THE FOREST ROUTE',region:'KANTO · ROUTE 01',theme:'forest',path:[[-45,155],[183,155],[183,390],[446,390],[446,195],[708,195],[708,420],[1005,420]],pads:[[92,245],[107,87],[270,100],[278,248],[95,367],[260,467],[365,314],[369,470],[533,294],[533,106],[623,347],[795,119],[798,302],[833,486]],pond:{x:570,y:443,rx:64,ry:42}},
  {name:'Cerulean Creek',subtitle:'Make a splash along the riverbank.',label:'THE RIVERSIDE ROUTE',region:'KANTO · ROUTE 24',theme:'water',path:[[-45,350],[195,350],[195,140],[430,140],[430,405],[685,405],[685,190],[1005,190]],pads:[[90,271],[103,420],[273,216],[280,68],[110,133],[349,333],[518,225],[512,473],[607,327],[768,317],[765,106],[851,255],[350,475],[566,107]],pond:{x:825,y:449,rx:88,ry:46}},
  {name:'Autumn Trail',subtitle:'Golden leaves. A spirited challenge.',label:'THE GOLDEN ROUTE',region:'KANTO · ROUTE 07',theme:'autumn',path:[[-45,155],[250,155],[250,370],[503,370],[503,145],[740,145],[740,385],[1005,385]],pads:[[100,245],[170,82],[337,94],[337,264],[155,351],[334,452],[425,289],[586,280],[589,69],[658,452],[825,280],[837,457],[841,80],[94,435]],pond:{x:520,y:485,rx:54,ry:29}},
  ...EXTRA_ROUTES,
];
export const ENEMIES = {
  ...EXTRA_ENEMIES,
  10:{name:'Caterpie',type:'bug',hp:48,speed:46,reward:12},
  13:{name:'Weedle',type:'bug',hp:55,speed:50,reward:13},
  19:{name:'Rattata',type:'normal',hp:62,speed:68,reward:14},
  16:{name:'Pidgey',type:'flying',hp:68,speed:62,reward:14},
  27:{name:'Sandshrew',type:'ground',hp:100,speed:43,reward:17},
  41:{name:'Zubat',type:'flying',hp:78,speed:79,reward:16},
  74:{name:'Geodude',type:'rock',hp:152,speed:37,reward:20},
  54:{name:'Psyduck',type:'water',hp:125,speed:50,reward:19},
  37:{name:'Vulpix',type:'fire',hp:112,speed:65,reward:18},
  63:{name:'Abra',type:'psychic',hp:180,speed:60,reward:35},
  81:{name:'Magnemite',type:'electric',hp:160,speed:45,reward:30},
  131:{name:'Lapras',type:'water',hp:360,speed:35,reward:55},
  147:{name:'Dratini',type:'dragon',hp:300,speed:48,reward:50},
  144:{name:'Articuno',type:'ice',hp:1600,speed:30,reward:150},
  145:{name:'Zapdos',type:'electric',hp:1600,speed:30,reward:150},
  146:{name:'Moltres',type:'fire',hp:1600,speed:30,reward:150},
  95:{name:'Onix',type:'rock',hp:650,speed:30,reward:110,boss:true},
  143:{name:'Snorlax',type:'normal',hp:1800,speed:25,reward:160,boss:true},
  149:{name:'Dragonite',type:'dragon',hp:3300,speed:34,reward:250,boss:true},
};
const advantages = {electric:['water','flying'],grass:['water','ground','rock'],fire:['bug','grass','ice','steel'],water:['fire','ground','rock'],flying:['bug','grass','fighting'],psychic:['poison','fighting'],ice:['dragon','flying','ground','grass'],dragon:['dragon'],bug:['grass','psychic','dark'],poison:['grass','fairy'],ground:['fire','electric','poison','rock','steel'],rock:['fire','ice','flying','bug'],fighting:['normal','ice','rock','dark','steel'],ghost:['psychic','ghost'],dark:['psychic','ghost'],steel:['ice','rock','fairy'],fairy:['fighting','dragon','dark']};
const resistances = {electric:['ground','dragon'],grass:['bug','flying','fire','dragon','poison','steel'],fire:['water','rock','dragon'],water:['grass','dragon'],psychic:['psychic','dark','steel'],ice:['fire','water','ice','steel'],normal:['rock','ghost','steel'],bug:['fire','fighting','poison','flying','ghost','steel','fairy'],poison:['poison','ground','rock','ghost','steel'],ground:['grass','bug','flying'],rock:['fighting','ground','steel'],fighting:['poison','flying','psychic','bug','ghost','fairy'],ghost:['normal','dark'],dark:['fighting','dark','fairy'],steel:['fire','water','electric','steel'],fairy:['fire','poison','steel']};
export function multiplier(attack,defense) {return advantages[attack]?.includes(defense) ? 1.6 : resistances[attack]?.includes(defense) ? .65 : 1;}
export function towerStats(tower) {
  const base=TOWERS.find(t=>t.id===tower.kind),branch=evolutionOptions(tower).find(b=>b.id===tower.branch)||{},traitType=branch.type||base.types?.[tower.level-1]||base.type;
  const sprite=branch.species||base.stages[tower.level-1],move=partnerMove(tower.kind,sprite,tower.level,tower.branch),type=move.element;
  return {...base,...branch,type,color:move.color,move:move.name,moveId:move.slug,damage:Math.round(base.damage*(1+(tower.level-1)*.72)*(branch.power||1)*(tower.teamPower||1)),
    range:(base.range+(tower.level-1)*15+(branch.reach||0))*(tower.routeRange||1),rate:base.rate/(1+(tower.level-1)*.13)*(branch.tempo||1),
    sprite,name:branch.evolvedName||base.names[tower.level-1],pathName:branch.name,
    splash:branch.splash??base.splash??(traitType==='fire'?51:traitType==='flying'?70:0),splashPower:branch.splashPower??.6,
    chain:branch.chain??(traitType==='electric'?1:0),chainPower:branch.chainPower??.45,
    poisonPower:['grass','poison'].includes(traitType)?(branch.poisonPower??.22):0,poisonTime:branch.poisonTime??2.6,
    slowFactor:branch.slowFactor??base.slowFactor??.62,slowTime:traitType==='water'?(branch.slowTime??1.8):['bug','ice'].includes(traitType)?(base.slowTime||0):0};
}
export function waveInfo(number,difficultyId='normal',mapIndex=0) {
  const opening=OPENING_WAVES[number-1],difficulty=difficultyFor(difficultyId),route=MAPS[mapIndex];
  const pool = opening?.pool||route.wavePool||(number<8 ? [19,27,41,13] : number<11 ? [74,54,37,41] : [74,54,37,27,41,16]);
  const boss = number===5?95:number===10?143:number===15?149:null;
  const count = Math.round((opening?.count??(7+number*2))*difficulty.crowd);
  return {number,count:count+(boss?1:0),pool,boss,reward:opening?.reward??(55+number*7),health:opening?.health??1,bounty:opening?.bounty??1,interval:(opening?.interval??Math.max(.42,1.15-number*.035))*difficulty.spawn,label:boss?`${ENEMIES[boss].name} approaches`:opening?.label||route.waveNames?.[Math.min(2,Math.floor((number-6)/3))]||(number<10?'Wild company':'The final stretch')};
}
export function routeLength(path) {return path.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);}
export function pointAt(path,distance) {
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance<=len)return {x:a[0]+(b[0]-a[0])*distance/len,y:a[1]+(b[1]-a[1])*distance/len,dx:b[0]-a[0],dy:b[1]-a[1]};distance-=len;}
  return {x:path.at(-1)[0],y:path.at(-1)[1],dx:1,dy:0};
}
export class Game {
  constructor(mapIndex=0,difficultyId='normal',options={}) {const progress=loadCollectionProgress(options.collectionProgress,options.collection);this.collection=progress.collection;this.collectionPoints=progress.points;this.collectionSlots=progress.slots;this.random=options.random||Math.random;this.reset(mapIndex,difficultyId);}
  reset(mapIndex=this.mapIndex,difficultyId=this.difficulty?.id||'normal') {
    this.mapIndex=mapIndex;this.map=MAPS[mapIndex];this.length=routeLength(this.map.path);
    this.difficulty=difficultyFor(difficultyId);this.maxLives=this.difficulty.hearts;
    this.money=this.difficulty.coins;this.lives=this.maxLives;this.wave=0;this.kills=0;this.score=0;this.towers=[];this.enemies=[];this.shots=[];this.particles=[];this.effects=[];this.events=[];this.queue=[];this.status='build';this.paused=false;this.time=0;this.spawnTimer=0;this.nextId=1;this.waveKills=0;
    this.pendingReward=null;this.rewardHistory=[];this.powerCharms=0;this.bossDefeated=false;this.bossesDefeated=0;
    this.visitor=null;this.visitorArrived=false;this.previousVisitor=null;this.pendingRecruits=[];this.lastRecruits=[];this.caught=0;
    this.wavePartners=new Set();
  }
  available(kind){return isUnlocked(this.collection,kind);}
  collectionSave(){return {version:COLLECTION_VERSION,collection:this.collection,points:this.collectionPoints,slots:this.collectionSlots};}
  earnCollectionPoints(points){this.collectionPoints=Math.min(MAX_COLLECTION_POINTS,this.collectionPoints+points);this.emit('collectionPoints',{points});}
  unlockCollectionSlot(){
    const price=slotPrice(this.collectionSlots);
    if(price===null||this.collectionPoints<price)return false;
    this.collectionPoints-=price;this.collectionSlots++;
    const waiting=COLLECTIBLE_IDS.find(id=>this.collection[id]?.reserve);
    if(waiting!==undefined)delete this.collection[waiting].reserve;
    this.emit('slotUnlocked',{price,kind:waiting});return true;
  }
  purchasePartner(kind){
    const offer=SPECIAL_PARTNERS[kind];
    if(!Number.isInteger(kind)||!offer||this.collection[kind]||this.collectionPoints<offer.price||usedSlots(this.collection)>=this.collectionSlots)return false;
    this.collectionPoints-=offer.price;
    this.collection[kind]={catches:1,shiny:false,useShiny:false};
    this.emit('partnerPurchased',{kind,price:offer.price,fresh:true,legendary:true});return true;
  }
  recruit(kind,shiny=false,position=null){
    if(!COLLECTIBLE_IDS.includes(kind)||SPECIAL_PARTNERS[kind])return false;
    const previous=this.collection[kind],fresh=!previous,newShiny=shiny&&!previous?.shiny;
    const reserve=previous?.reserve||(fresh&&usedSlots(this.collection)>=this.collectionSlots);
    this.collection[kind]={catches:Math.min(9999,(previous?.catches||0)+1),shiny:shiny||Boolean(previous?.shiny),useShiny:newShiny||Boolean(previous?.useShiny)};
    if(reserve)this.collection[kind].reserve=true;
    if(newShiny)this.setShiny(kind,true);
    if(!fresh&&!newShiny)this.money+=75;
    const legendary=LEGENDARY_VISITORS.includes(kind),points=legendary?25:10;this.earnCollectionPoints(points);this.caught++;
    if(position)this.effect('capture',position.x,position.y,.65,{actor:{kind,species:kind,shiny,lookAngle:0}});
    const reward={kind,shiny,fresh,newShiny,legendary,points,reserve:Boolean(reserve),bonus:!fresh&&!newShiny?75:0};this.lastRecruits.push(reward);this.emit('recruit',reward);
  }
  setShiny(kind,enabled){
    if(!this.collection[kind]?.shiny)return false;
    this.collection[kind].useShiny=Boolean(enabled);this.towers.filter(t=>t.kind===kind).forEach(t=>{t.shiny=Boolean(enabled);});
    this.effects.filter(e=>e.type==='evolve'&&e.previousActor?.kind===kind).forEach(e=>{e.previousActor.shiny=Boolean(enabled);});return true;
  }
  emit(type,data={}) {this.events.push({type,...data});}
  effect(type,x,y,duration,data={}) {this.effects.push({type,x,y,age:0,duration,...data});}
  place(kind,pad) {
    const spec=TOWERS.find(t=>t.id===kind);if(!spec || !this.available(kind) || !Number.isInteger(pad) || !this.map.pads[pad] || this.towers.some(t=>t.pad===pad) || this.money<spec.cost || ['won','lost'].includes(this.status))return false;
    const [x,y]=this.map.pads[pad];const t={id:this.nextId++,kind,species:kind,shiny:Boolean(this.collection[kind]?.useShiny),pad,x,y,level:1,xp:0,combatXP:0,branch:null,readyNotified:false,teamPower:1+this.powerCharms*.12,routeRange:this.map.boostPads?.includes(pad)?1.2:1,spent:spec.cost,cooldown:.1,kills:0,pulse:0,lookAngle:Math.PI/2,cast:null,appear:.4};this.towers.push(t);this.money-=spec.cost;this.effect('summon',x,y,.55);this.emit('place',{tower:t});return t;
  }
  gainXP(tower,amount) {
    if(!this.towers.includes(tower)||tower.level===3||!Number.isFinite(amount)||amount<=0)return;
    tower.xp=Math.min(XP_THRESHOLDS.at(-1),tower.xp+amount);
    if(xpProgress(tower).ready&&!tower.readyNotified){tower.readyNotified=true;this.effect('ready',tower.x,tower.y,.9);this.emit('ready',{tower});}
  }
  upgrade(id,branchId) {
    const t=this.towers.find(t=>t.id===id);if(!t||!xpProgress(t).ready||['won','lost'].includes(this.status))return false;
    if(t.level===1){if(!evolutionOptions(t).some(b=>b.id===branchId))return false;t.branch=branchId;}
    else if(branchId&&branchId!==t.branch)return false;
    const previous=t.species,previousActor={...t,cast:null,appear:0};t.level++;t.species=towerStats(t).sprite;t.pulse=.6;t.appear=0;t.cast=null;t.cooldown=Math.max(t.cooldown,.25);t.readyNotified=false;
    const stats=towerStats(t);
    this.effect('evolve',t.x,t.y,1.1,{towerId:t.id,previous,previousActor,species:t.species,name:stats.name,move:stats.move,color:stats.color});this.emit('upgrade',{tower:t});
    if(xpProgress(t).ready){t.readyNotified=true;this.emit('ready',{tower:t});}return true;
  }
  claimReward(id) {
    if(!this.pendingReward||this.status!=='build'||!rewardOptions(this.pendingReward.wave).some(r=>r.id===id))return false;
    const wave=this.pendingReward.wave;this.pendingReward=null;this.rewardHistory.push({wave,id});
    if(id==='picnic')this.towers.forEach(t=>this.gainXP(t,XP_RULES.picnic));
    if(id==='charm'){this.powerCharms++;this.towers.forEach(t=>{t.teamPower=1+this.powerCharms*.12;});}
    if(id==='supplies'){this.money+=wave===5?250:400;this.lives=Math.min(this.maxLives,this.lives+4);}
    this.emit('rewardClaimed',{id,wave});return true;
  }
  sell(id) {
    const t=this.towers.find(t=>t.id===id);if(!t || ['won','lost'].includes(this.status))return false;this.money+=Math.floor(t.spent*.7);this.effect('recall',t.x,t.y,.45,{actor:{...t,cast:null}});this.towers=this.towers.filter(t=>t.id!==id);this.emit('sell');return true;
  }
  startWave() {
    if(this.status!=='build' || this.wave>=MAX_WAVES || this.pendingReward)return false;
    this.wave++;this.waveKills=0;this.bossDefeated=false;this.status='wave';this.paused=false;this.spawnTimer=.5;
    this.wavePartners=new Set(this.towers.map(t=>t.id));this.towers.forEach(t=>{t.combatXP=0;});
    const info=waveInfo(this.wave,this.difficulty.id,this.mapIndex);this.queue=Array.from({length:info.count-(info.boss?1:0)},(_,i)=>info.pool[(i+this.wave)%info.pool.length]);
    // The first boss follows the crowd so a developing team can focus its attacks.
    if(info.boss)this.queue.splice(this.wave===5?this.queue.length:Math.floor(this.queue.length*.6),0,info.boss);
    this.lastRecruits=[];this.visitorArrived=false;this.visitor=rollVisitor(this.mapIndex,this.wave,this.random,this.collection,this.previousVisitor);if(this.visitor){this.queue.push(this.visitor);this.previousVisitor=this.visitor.kind;}
    this.emit('wave',{wave:this.wave});return true;
  }
  spawn(kind,encounter={}) {
    if(typeof kind==='object'){encounter=kind;kind=encounter.kind;}
    const base=ENEMIES[kind],info=waveInfo(this.wave,this.difficulty.id,this.mapIndex),scale=(1+(this.wave-1)*.21)*this.difficulty.health*info.health;
    const hp=Math.round(base.hp*scale*(base.boss ? .65 : 1));const e={...base,reward:Math.round(base.reward*(base.boss||encounter.visitor?1:info.bounty)),visitor:Boolean(encounter.visitor),legendary:Boolean(encounter.legendary),shiny:Boolean(encounter.shiny),speed:base.speed*this.difficulty.speed,id:this.nextId++,kind,species:kind,hp,maxHp:hp,distance:0,...pointAt(this.map.path,0),slow:0,poison:0,poisonDps:0,poisonOwner:null,flash:0,hitRemaining:0,moving:true,walkDistance:0,lookAngle:0};this.enemies.push(e);if(e.visitor){this.visitorArrived=true;this.emit('visitor',{kind,shiny:e.shiny,legendary:e.legendary});}return e;
  }
  hit(enemy,damage,tower,impact=true) {
    if(enemy.hp<=0||damage<=0)return;
    if(tower){enemy.contributors??=new Set();enemy.contributors.add(tower.id);}
    enemy.hp-=damage;if(impact){enemy.flash=.12;enemy.hitRemaining=.18;}
    if(enemy.hp<=0){
      this.money+=enemy.reward;this.kills++;this.waveKills++;this.score+=Math.round(enemy.maxHp*2);if(tower)tower.kills++;
      for(const partner of this.towers)if(enemy.contributors?.has(partner.id)){
        const xp=Math.min(XP_RULES.defeat,Math.max(0,XP_RULES.combatCap-partner.combatXP));
        partner.combatXP+=xp;this.gainXP(partner,xp+(enemy.boss?XP_RULES.boss:0));
      }
      if(enemy.boss){this.bossDefeated=true;this.bossesDefeated++;if(this.wave===15)this.score+=1000;}
      if(enemy.visitor)this.pendingRecruits.push({kind:enemy.kind,shiny:enemy.shiny,x:enemy.x,y:enemy.y});
      const points=defeatPoints(enemy);if(points)this.earnCollectionPoints(points);
      this.effect('defeat',enemy.x,enemy.y,.55,{actor:{id:enemy.id,kind:enemy.kind,species:enemy.kind,shiny:enemy.shiny,lookAngle:enemy.lookAngle,fainted:true,boss:enemy.boss}});this.emit('defeat',{x:enemy.x,y:enemy.y,kind:enemy.kind,reward:enemy.reward,points,shiny:enemy.shiny,visitor:enemy.visitor,legendary:enemy.legendary,boss:Boolean(enemy.boss)});this.particles.push({x:enemy.x,y:enemy.y,text:enemy.visitor?'Wave clear → catch':enemy.boss?'Defeated!':`+${enemy.reward}`,life:.8,maxLife:.8,color:'#fff5c3'});
    }
  }
  targetFor(tower) {const s=towerStats(tower);return this.enemies.filter(e=>e.hp>0&&Math.hypot(tower.x-e.x,tower.y-e.y)<=s.range).sort((a,b)=>b.distance-a.distance)[0];}
  beginAttack(tower,target) {const s=towerStats(tower),visual=attackVisual(s,tower.level,tower.branch);tower.lookAngle=Math.atan2(target.y-tower.y,target.x-tower.x);tower.cast={...attackTiming(s.rate,s.type,visual),visual,age:0,angle:tower.lookAngle,targetId:target.id,target:{x:target.x,y:target.y},released:false};tower.cooldown=s.rate;}
  attack(tower,target) {
    if(target.hp<=0)return;
    const s=towerStats(tower);tower.pulse=.18;const affected=s.splash?this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<s.splash):[target];
    for(const e of affected){
      this.hit(e,s.damage*multiplier(s.type,e.type)*(e===target?1:s.splashPower),tower);
      if(s.slowTime&&(e.slow<=0||s.slowFactor<=e.slowFactor)){e.slow=s.slowTime;e.slowFactor=s.slowFactor;}
      const poisonDps=s.damage*s.poisonPower;
      if(s.poisonPower&&(e.poison<=0||poisonDps>=e.poisonDps)){e.poison=s.poisonTime;e.poisonDps=poisonDps;e.poisonOwner=tower;}
    }
    const origin=muzzlePosition(tower),visual=attackVisual(s,tower.level,tower.branch);
    this.emit('attack',{visual,x:tower.x,towerId:tower.id});
    this.shots.push({...origin,towerId:tower.id,targetId:target.id,tx:target.x,ty:target.y-12,type:s.type,color:s.color,visual,life:visual.shotDuration,maxLife:visual.shotDuration});
    this.effect('impact',target.x,target.y-12,visual.impactDuration,{color:s.color,element:s.type,visual});
    let from=target;const visited=new Set([target.id]);
    for(let i=0;i<s.chain;i++){const next=this.enemies.find(e=>!visited.has(e.id)&&e.hp>0&&Math.hypot(e.x-from.x,e.y-from.y)<95);if(!next)break;
      visited.add(next.id);this.hit(next,s.damage*s.chainPower*multiplier(s.type,next.type),tower);this.shots.push({x:from.x,y:from.y-12,tx:next.x,ty:next.y-12,type:s.type,color:s.color,visual,chain:true,life:.22,maxLife:.22});
      this.effect('impact',next.x,next.y-12,.3,{color:s.color,element:s.type,visual:{...visual,scale:visual.scale*.65,area:0}});from=next;}
  }
  update(dt) {
    if(this.paused||['won','lost'].includes(this.status))return;
    dt=Math.min(dt,.1);this.time+=dt;this.shots.forEach(s=>s.life-=dt);this.shots=this.shots.filter(s=>s.life>0);this.particles.forEach(p=>p.life-=dt);this.particles=this.particles.filter(p=>p.life>0);this.effects.forEach(e=>e.age+=dt);this.effects=this.effects.filter(e=>e.age<e.duration);this.towers.forEach(t=>{t.pulse=Math.max(0,t.pulse-dt);t.appear=Math.max(0,t.appear-dt);});
    if(this.status!=='wave')return;
    this.spawnTimer-=dt;if(this.queue.length&&this.spawnTimer<=0){this.spawn(this.queue.shift());this.spawnTimer=waveInfo(this.wave,this.difficulty.id,this.mapIndex).interval;}
    for(const e of this.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.hitRemaining=Math.max(0,e.hitRemaining-dt);if(e.poison>0){e.poison-=dt;this.hit(e,e.poisonDps*dt,e.poisonOwner,false);}if(e.hp<=0)continue;e.slow=Math.max(0,e.slow-dt);const traveled=e.speed*(e.slow>0?(e.slowFactor??.62):1)*dt;e.distance+=traveled;e.walkDistance+=traveled;Object.assign(e,pointAt(this.map.path,e.distance));e.lookAngle=Math.atan2(e.dy,e.dx);if(e.distance>=this.length){e.hp=0;if(e.visitor){this.emit('visitorEscaped',{kind:e.kind});}else{this.lives=Math.max(0,this.lives-(e.boss?5:1));this.effect('leak',903,this.map.path.at(-1)[1],.5);this.emit('leak');}}}
    if(this.lives<=0){this.status='lost';this.emit('lost');return;}
    for(const t of this.towers){
      t.cooldown-=dt;
      if(t.cast){
        const cast=t.cast;cast.age+=dt;
        if(!cast.released){
          let target=this.enemies.find(e=>e.id===cast.targetId&&e.hp>0);
          if(!target||Math.hypot(t.x-target.x,t.y-target.y)>towerStats(t).range+15)target=this.targetFor(t);
          if(target){cast.angle=Math.atan2(target.y-t.y,target.x-t.x);cast.target={x:target.x,y:target.y};t.lookAngle=cast.angle;}
          if(cast.age>=cast.windup){cast.released=true;if(target)this.attack(t,target);}
        }
        if(cast.age>=cast.duration)t.cast=null;
      }
      if(!t.cast&&t.cooldown<=0){const target=this.targetFor(t);if(target)this.beginAttack(t,target);}
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
    if(!this.queue.length&&!this.enemies.length){this.towers.forEach(t=>{t.cast=null;});const reward=waveInfo(this.wave).reward;this.money+=reward;this.score+=reward*5;this.status=this.wave===MAX_WAVES?'won':'build';
      this.towers.filter(t=>this.wavePartners.has(t.id)).forEach(t=>this.gainXP(t,XP_RULES.clear));this.wavePartners.clear();
      for(const recruit of this.pendingRecruits.splice(0))this.recruit(recruit.kind,recruit.shiny,recruit);
      if(this.wave===5&&this.bossDefeated&&!this.collection[133])this.recruit(133);
      const points=this.status==='won'?60:10;this.earnCollectionPoints(points);
      if(this.wave%5===0){
        if(this.map.bonusPoints){this.earnCollectionPoints(this.map.bonusPoints);this.emit('routeBonus',{message:`Ranger milestone! +${this.map.bonusPoints} collection points.`});}
        if(this.map.healing){const healed=Math.min(this.map.healing,this.maxLives-this.lives);this.lives+=healed;this.emit('routeBonus',{message:healed?`Hot springs restored ${healed} hearts!`:'Hot springs reached. Your hearts are already full!'});}
      }
      this.emit(this.status==='won'?'won':'clear',{reward,points});
      if(this.bossDefeated&&this.status==='build'){this.pendingReward={wave:this.wave,boss:waveInfo(this.wave).boss};this.emit('bossReward');}
    }
  }
}
