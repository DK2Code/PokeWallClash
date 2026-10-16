import {MOVE_DATA} from './move-data.mjs';
import {LOADOUTS} from './loadouts.mjs';

export const PALETTE={normal:['#ded5be','#fff9e6'],fire:['#ff9b48','#fff2b0'],water:['#69d6f6','#e5ffff'],electric:['#ffdf66','#ffffd7'],grass:['#9ad96b','#edffbf'],ice:['#a2eff1','#efffff'],fighting:['#f49e81','#fff1c9'],poison:['#d28bde','#ffdcfa'],ground:['#dcb17a','#fff0c7'],flying:['#a9c9ff','#eef6ff'],psychic:['#f594c6','#ffe4f6'],bug:['#bfda68','#f4ffc9'],rock:['#c5ba91','#fff4d6'],ghost:['#be92ff','#f7d6ff'],dragon:['#b7a0ff','#ebf1ff'],dark:['#9580b2','#e3d8f4'],steel:['#bad1dc','#f4fcff'],fairy:['#f2b0dc','#fff0fc']};
const definitions={};
function define(slugs,mode,visual,options={}){
  for(const slug of slugs.split(' ')){
    if(!MOVE_DATA[slug])throw new Error('Unknown real move: '+slug);
    const data=MOVE_DATA[slug],colors=PALETTE[data.element];
    definitions[slug]={slug,...data,mode,visual,color:colors[0],core:colors[1],pose:['melee','dash','burrow'].includes(mode)?'Attack':['heal','buff','transform','teleport','splash'].includes(mode)?'Charge':'Shoot',range:mode==='melee'?105:mode==='dash'?220:500,radius:15,duration:.55,windup:.12,count:1,...options};
  }
}
const status=(kind,duration,chance=1)=>({kind,duration,chance});
// Contact moves hit within a directional strike, using the actor's Attack frames.
define('scratch slash fury-swipes metal-claw dragon-claw','melee','claws',{range:112});
define('fury-cutter leaf-blade','melee','blade',{range:130});
define('cross-chop x-scissor','melee','cross',{range:120});
define('pound double-slap double-hit fake-out','melee','slap');
define('karate-chop brick-break','melee','chop',{range:112});
define('mach-punch bullet-punch thunder-punch fire-punch ice-punch dizzy-punch dynamic-punch hammer-arm','melee','fist',{range:112});
define('low-kick double-kick rolling-kick high-jump-kick','melee','kick',{range:120});
define('close-combat','melee','combo',{range:125,count:6,duration:.6});
define('bite crunch hyper-fang super-fang poison-fang bug-bite fire-fang','melee','fangs',{range:100});
define('peck fury-attack drill-peck horn-attack megahorn','melee','horn',{range:125});
define('wing-attack','melee','wings',{range:135});
define('aqua-tail slam','melee','tail',{range:145});
define('vine-whip power-whip','melee','vine',{range:200,duration:.45});
define('wrap bind clamp','melee','coil',{range:150,duration:.7,status:status('bound',2.4)});
define('lick','melee','tongue',{range:135,status:status('paralysis',2,.3)});
define('vice-grip crabhammer','melee','pincer',{range:120});
define('poison-jab','melee','jab',{range:125,status:status('poison',5,.3)});
define('bone-club bone-rush','melee','bone',{range:150});
define('leech-life','melee','fangs',{drain:.5});
define('seismic-toss vital-throw','melee','throw',{range:110,duration:.65,windup:.25});
define('rapid-spin','burst','spin',{range:130,radius:130,duration:.45});
// Rushes move the Pokémon itself. They never spawn a detached damaging ball.
define('tackle headbutt body-slam double-edge giga-impact last-resort flail','dash','tackle',{range:200,duration:.26,pose:'Attack'});
define('quick-attack extreme-speed','dash','speed',{range:250,duration:.2,windup:.05,pose:'Charge'});
define('aqua-jet waterfall','dash','water-rush',{range:245,duration:.28,pose:'Charge'});
define('flame-charge flame-wheel flare-blitz','dash','flame-rush',{range:240,duration:.3,pose:'Charge'});
define('brave-bird sky-attack','dash','bird-rush',{range:290,duration:.32,windup:.3,pose:'Charge'});
define('drill-run rollout','dash','drill',{range:240,duration:.32,pose:'Charge'});
define('spark','dash','electric-rush',{range:220,duration:.25,status:status('paralysis',2,.3)});
define('zen-headbutt dragon-rush outrage','dash','aura-rush',{range:240,duration:.3});
define('dig','burrow','dig',{range:250,radius:85,duration:.65,windup:.5,pose:'Charge'});
// Flying attacks have individual shapes, trajectories and multi-shot patterns.
define('ember','projectile','ember',{radius:9,speed:590});
define('fire-blast','projectile','fireblast',{radius:33,speed:420,blastRadius:110});
define('water-gun','projectile','jet',{radius:9,speed:590});
define('hydro-cannon','projectile','cannon',{radius:27,speed:630,blastRadius:95,recharge:1});
define('thunder-shock','projectile','spark',{radius:9,speed:760});
define('electro-ball','projectile','electro',{radius:20,speed:430});
define('zap-cannon','projectile','zap-orb',{radius:28,speed:370,status:status('paralysis',2.5)});
define('shadow-ball','projectile','shadow',{radius:15,speed:520});
define('razor-leaf','projectile','leaf',{count:3,spread:.11,radius:8,speed:600});
define('seed-bomb','projectile','seed',{radius:18,speed:480,blastRadius:80});
define('leech-seed','projectile','seed',{radius:10,speed:460,status:status('seeded',6)});
define('poison-sting twineedle pin-missile spike-cannon','projectile','needle',{radius:7,speed:680});
define('bubble bubble-beam','projectile','bubbles',{count:5,spread:.08,radius:9,speed:370});
define('water-pulse','projectile','water-ring',{radius:22,speed:480,status:status('confusion',2,.2)});
define('gust','projectile','gust',{radius:22,speed:470});
define('air-slash psycho-cut','projectile','crescent',{radius:20,speed:650});
define('dragon-rage dragon-pulse','projectile','dragon',{radius:20,speed:490});
define('confusion','projectile','psi-rings',{radius:18,speed:560,status:status('confusion',2,.1)});
define('aura-sphere','projectile','aura-orb',{radius:23,speed:500,homing:2.2,color:'#77c9ff',core:'#e4f7ff'});
define('hidden-power','projectile','hidden-orbs',{count:3,spread:.12,radius:10,speed:550});
define('moonblast','projectile','moon',{radius:26,speed:430,blastRadius:85});
define('ice-shard icicle-spear','projectile','icicle',{radius:9,speed:690});
define('rock-throw rock-blast','projectile','rock',{radius:16,speed:460});
define('power-gem ancient-power','projectile','gems',{radius:18,speed:510});
define('acid sludge sludge-bomb gunk-shot','projectile','sludge',{radius:18,speed:430});
define('mud-slap sand-attack','projectile','sand',{radius:20,speed:430,status:status('obscured',2.5)});
define('pay-day','projectile','coin',{count:3,spread:.1,radius:8,speed:620});
define('swift','projectile','stars',{count:3,spread:.17,radius:9,speed:590,homing:2.5});
define('barrage egg-bomb','projectile','egg',{radius:16,speed:450});
define('bonemerang','projectile','boomerang',{radius:16,speed:530,returning:true});
define('magnet-bomb','projectile','magnet',{radius:18,speed:440,homing:2});
define('tri-attack','projectile','triad',{radius:25,speed:490});
define('sonic-boom','projectile','sonic',{radius:22,speed:680});
define('confuse-ray','projectile','confuse-ray',{radius:18,speed:430,status:status('confusion',3)});
define('will-o-wisp','projectile','wisps',{radius:20,speed:340,status:status('burn',6),homing:1});
// Sustained streams retain the existing clash and interception geometry.
define('flamethrower','channel','flamethrower',{range:430,width:60,duration:.85});
define('hydro-pump','channel','hydropump',{range:530,width:25,duration:.85});
define('solar-beam','channel','solar-beam',{range:620,width:20,duration:.85,windup:.55});
define('ice-beam','channel','ice-beam',{range:550,width:17,duration:.7,status:status('chilled',2,.15)});
define('psybeam aurora-beam','channel','spectrum-beam',{range:520,width:18,duration:.65});
define('hyper-beam','channel','hyper-beam',{range:650,width:31,duration:.8,windup:.4,recharge:1.1});
// Local waves, locked ground targets and lasting weather have separate telegraphs.
define('dark-pulse','wave','pulse',{range:390,radius:390,duration:.7});
define('hyper-voice disarming-voice bug-buzz sing supersonic','wave','sound',{range:340,radius:340,duration:.8});
define('dazzling-gleam','burst','gleam',{radius:270,range:270,duration:.55});
define('petal-blizzard petal-dance','zone','petals',{radius:145,duration:1.4});
define('leaf-storm','zone','leaf-storm',{radius:145,duration:1.4});
define('sludge-wave','wave','sludge-wave',{range:320,radius:320,duration:.75});
define('surf','wave','surf',{range:470,radius:470,duration:1.1});
define('earthquake','wave','quake',{range:420,radius:420,duration:1});
define('earth-power','ground','earth-power',{radius:105,windup:.42,duration:.8});
define('rock-slide stone-edge','ground','stone-spikes',{radius:105,windup:.4,duration:.8});
define('psychic psystrike night-shade','ground','psychic',{radius:100,windup:.32,duration:.8});
define('thunderbolt thunder','ground','thunder',{radius:95,windup:.34,duration:.65});
define('frenzy-plant','ground','roots',{radius:150,windup:.5,duration:1,recharge:.8});
define('hurricane twister','zone','tornado',{radius:115,duration:1.4});
define('blizzard','zone','blizzard',{radius:155,duration:1.4});
define('dream-eater','ground','dream',{radius:110,windup:.25,duration:.8,drain:.5,requiresSleep:true});
define('absorb mega-drain giga-drain','drain','drain',{range:410,duration:.65,drain:.5});
// Support moves do what their names imply, with visible timed effects.
define('sleep-powder spore poison-powder stun-spore smog powder-snow icy-wind smokescreen','cone','powder',{range:220,radius:180,duration:.65});
define('hypnosis','projectile','hypnosis',{radius:25,speed:400,status:status('sleep',2.5)});
define('lovely-kiss','projectile','heart',{radius:23,speed:400,status:status('sleep',2.5)});
define('toxic','projectile','toxic',{radius:22,speed:400,status:status('poison',8)});
define('thunder-wave','projectile','thunder-wave',{radius:24,speed:550,status:status('paralysis',3)});
define('string-shot','projectile','silk',{radius:18,speed:520,status:status('bound',3)});
define('harden withdraw defense-curl barrier acid-armor','buff','shield',{duration:.8,buff:'guard',buffTime:4});
define('dragon-dance','buff','dance',{duration:.9,buff:'boost',buffTime:5});
define('recover soft-boiled slack-off moonlight rest','heal','heal',{duration:.9,heal:.35});
define('teleport','teleport','teleport',{range:230,duration:.45,windup:.18});
define('transform','transform','transform',{duration:.7,windup:.28});
define('splash','splash','splash',{duration:.65,windup:.08});
define('self-destruct explosion','sacrifice','explosion',{radius:300,windup:.45,duration:.7});

const tune=(slug,options)=>Object.assign(definitions[slug],options);
tune('fury-swipes',{count:4,duration:.6});tune('fury-attack',{count:4,duration:.6});
tune('double-slap',{count:3,duration:.5});tune('double-hit',{count:2});tune('double-kick',{count:2});tune('bone-rush',{count:3});
tune('twineedle',{count:2,spread:.035,status:status('poison',5,.2)});tune('pin-missile',{count:5,spread:.065});
tune('spike-cannon',{count:5,spread:.045});tune('icicle-spear',{count:4,spread:.05});tune('rock-blast',{count:3,spread:.09});
tune('barrage',{count:4,spread:.1});tune('bubble-beam',{count:8,spread:.045,speed:510});
tune('poison-sting',{status:status('poison',5,.3)});tune('poison-fang',{status:status('poison',5,.5)});
tune('fire-punch',{status:status('burn',4,.1)});tune('ice-punch',{status:status('chilled',2,.1)});tune('thunder-punch',{status:status('paralysis',2,.1)});
tune('sludge',{status:status('poison',5,.3)});tune('sludge-bomb',{blastRadius:90,status:status('poison',5,.3)});tune('gunk-shot',{radius:25,blastRadius:100,status:status('poison',5,.3)});
tune('egg-bomb',{radius:25,blastRadius:100});tune('thunder',{radius:130,duration:.85,windup:.45});
tune('stone-edge',{visual:'stone-edge'});tune('rock-slide',{visual:'rock-slide'});tune('night-shade',{visual:'night-shade'});tune('psystrike',{visual:'psystrike'});
tune('absorb',{radius:7});tune('mega-drain',{radius:11});tune('giga-drain',{radius:16});
tune('sleep-powder',{status:status('sleep',2.5)});tune('spore',{status:status('sleep',3),visual:'spore'});
tune('poison-powder',{status:status('poison',6)});tune('stun-spore',{status:status('paralysis',3)});
tune('smog',{status:status('poison',4,.4)});tune('smokescreen',{status:status('obscured',3),visual:'smoke'});
tune('powder-snow',{status:status('chilled',2,.2),visual:'snow'});tune('icy-wind',{status:status('chilled',3),visual:'ice-wind'});
tune('sing',{status:status('sleep',2.5)});tune('supersonic',{status:status('confusion',3)});
tune('rest',{heal:.5,statusSelf:status('sleep',2)});tune('soft-boiled',{visual:'heal-egg'});tune('moonlight',{visual:'moonlight'});tune('slack-off',{visual:'rest'});
tune('double-edge',{recoil:.25});tune('flare-blitz',{recoil:.25});tune('brave-bird',{recoil:.25});
tune('giga-impact',{recharge:1});tune('last-resort',{requiresOthers:true});tune('super-fang',{halfHealth:true});tune('flail',{lowHealth:true});
tune('body-slam',{visual:'slam'});tune('sky-attack',{windup:.6});tune('dynamic-punch',{status:status('confusion',2)});
tune('barrier',{visual:'barrier'});tune('acid-armor',{visual:'liquid-guard'});tune('withdraw',{visual:'shell'});
tune('explosion',{radius:370});tune('petal-dance',{confuseSelf:true});tune('outrage',{confuseSelf:true});

export const MOVES=Object.freeze(definitions);
for(const slug of new Set(Object.values(LOADOUTS).flat()))if(!MOVES[slug])throw new Error('Missing move behavior: '+slug);
export const getMove=(actor,index)=>MOVES[actor.moveIds?.[index]||LOADOUTS[actor.id]?.[index]]||null;
export const moveCost=(move,index)=>!move?0:['splash','teleport','transform'].includes(move.mode)?0:[0,22,50][index];
export const moveCooldown=(move,index)=>!move?0:move.mode==='splash'?1.2:move.mode==='teleport'?2.8:move.mode==='transform'?4:['heal','buff'].includes(move.mode)?Math.max(5,[0,6,10][index]):[.36,3.6,9][index];
export function moveDamage(move,index){
  if(move.damageClass==='status')return 0;
  if(move.mode==='sacrifice')return move.slug==='explosion'?150:110;
  const base=[7,25,38][index];return base*Math.max(.65,Math.min(1.25,(move.power||65)/80));
}
export function moveDescription(move){
  if(!move)return 'Transform to copy your rival’s moves.';
  const actions={melee:'A close-range strike',dash:'Rush forward and strike',projectile:'Launch a ranged attack',channel:'Aim a sustained stream; opposing attacks can clash',wave:'Send an expanding wave across the ground',burst:'Strike the area around you',ground:'Mark a location, then strike it',zone:'Create a lingering attack at the marked location',cone:'Release a cone in front of you',drain:'Drain the rival’s health and heal yourself',buff:move.buff==='guard'?'Reduce incoming damage for 4 seconds':'Boost movement and damage for 5 seconds',heal:'Restore health',teleport:'Teleport toward your aim, or away from a nearby rival',transform:'Copy the rival’s appearance, speed and three moves; keep your own HP',splash:'Hop in place. It has no battle effect',sacrifice:'A powerful nearby explosion that also makes you faint',burrow:'Burrow, then emerge at the marked location'};
  return `${move.element.toUpperCase()} · ${move.damageClass.toUpperCase()} — ${actions[move.mode]}.${move.count>1?' Multiple hits.':''}${move.status?' May cause '+move.status.kind+'.':''}${move.requiresSleep?' Target must be asleep.':''}${move.requiresOthers?' Use both other moves first.':''}${move.recoil?' Deals recoil damage.':''}${move.statusSelf?' Also puts you to sleep.':''}`;
}
