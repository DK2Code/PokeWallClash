import {MOVES} from './arena/moves.mjs';
import {attackTiming} from './sprite-animation.mjs';

const descriptions={
  vine:'Twin curling vines strike the target',leaf:'Three spinning leaf blades',
  petals:'A swirling field of pink petals', 'solar-beam':'A charged beam with crossing sun rays',roots:'Roots erupt beneath the target',
  ember:'Rolling embers with a glowing trail',fangs:'Snapping jaws strike at contact',fireblast:'A five-armed flame sigil',flamethrower:'A sustained cone of rolling flames',
  jet:'A narrow jet with flowing water trails','water-ring':'Travelling blue ripple rings',hydropump:'A pressure stream with foaming rings',cannon:'A heavy water cannon blast',
  spark:'A branching electric spark',thunder:'Lightning strikes down from above',fist:'A close strike with an elemental fist',triad:'Orbiting fire, ice and electric orbs','zap-orb':'A crackling electric sphere',
  silk:'A curling strand of silk',tackle:'A forward body lunge',sound:'Expanding sound-wave rings',gust:'Travelling spirals of wind',speed:'A quick dash with motion trails',
  'flame-rush':'A fiery body rush','hidden-orbs':'A spread of orbiting energy orbs','spectrum-beam':'A sustained beam with travelling rings',crescent:'Sweeping crescent blades',psychic:'Psychic rings surround the target',
  icicle:'Spinning ice crystals','ice-beam':'A sustained beam with travelling ice crystals',surf:'Expanding waves with a foamy edge',dragon:'A twisting dragon-shaped energy trail',tail:'A sweeping tail strike',claws:'Three slashing claw marks',
  'aura-rush':'An energy-charged body rush',blizzard:'Swirling ice crystals',horn:'A sharp forward peck','bird-rush':'A wing-shaped charging strike',
};
export function attackVisual(stats,level=1,branch=null){
  const move=MOVES[stats.moveId]||Object.values(MOVES).find(m=>m.name===stats.move);
  if(!move)throw new Error(`No Arena visual for ${stats.move}`);
  const timing=attackTiming(stats.rate,stats.type,{arenaMove:move});
  return {
    arenaMove:move,moveId:move.slug,move:move.name,style:move.visual,pose:move.pose,
    mode:move.mode,type:move.element,color:move.color,light:move.core,level,
    variant:branch==='focus'?'focus':branch==='surge'?'surge':'move',
    scale:1+(level-1)*.3,area:stats.splash||0,chain:stats.chain||0,
    shotDuration:move.mode==='projectile'?.3:timing.duration-timing.windup,
    impactDuration:Math.min(.8,Math.max(.3,move.duration)),
    description:descriptions[move.visual]||`${move.name}: ${move.mode} attack`,
  };
}
