import {DIRECTIONAL} from './directional-data.mjs';
import {bodyOffset as arenaBodyOffset} from './arena/sprite-animation.mjs';

// Adapted from Pokémon Arena: real frame durations, eight facings, ground
// anchors and head emitters. All clocks come from the paused game simulation.
export const directionRow=angle=>((Math.round((Math.PI/2-angle)/(Math.PI/4))%8)+8)%8;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function timedFrame(meta,time,start=0,end=meta.frames){
  if(end<=start)return Math.min(start,meta.frames-1);
  const duration=meta.durations.slice(start,end).reduce((sum,d)=>sum+d,0);
  let remaining=((time%duration)+duration)%duration;
  for(let i=start;i<end;i++){if(remaining<meta.durations[i])return i;remaining-=meta.durations[i];}
  return end-1;
}
export function attackTiming(rate,type,visual){
  if(visual){
    const move=visual.arenaMove,windup=Math.min(rate*.3,Math.max(.12,move.windup*.62));
    return {windup,duration:Math.min(rate*.94,windup+(move.mode==='projectile'?.18:move.duration*.62)),pose:move.pose,channel:move.mode==='channel'};
  }
  return {windup:Math.min(.16,rate*.24),duration:Math.min(.46,rate*.8),pose:type==='flying'||type==='normal'?'Attack':'Shoot'};
}
export function bodyOffset(actor,reducedMotion=false){
  const cast=actor.cast;if(!cast||reducedMotion)return {x:0,y:0};
  const offset=arenaBodyOffset({cast}),move=cast.visual?.arenaMove;
  let lunge=0;
  if(cast.target&&['melee','dash'].includes(move?.mode)){
    const distance=Math.hypot(cast.target.x-actor.x,cast.target.y-actor.y);
    const reach=move.mode==='dash'?24:move.range*.58*.7;
    const phase=cast.age<cast.windup?Math.sin(cast.age/cast.windup*Math.PI/2):Math.max(0,1-(cast.age-cast.windup)/(cast.duration-cast.windup));
    lunge=Math.max(0,distance-reach)*phase;
  }
  return {x:offset.x*.62+Math.cos(cast.angle)*lunge,y:offset.y*.62+Math.sin(cast.angle)*lunge};
}
export function spriteSample(actor,time=0,reducedMotion=false){
  const config=DIRECTIONAL[actor.species||actor.kind];if(!config)return null;
  const cast=actor.cast;let state='Idle',frame=0;
  const angle=cast?.angle??actor.lookAngle??Math.PI/2;
  if(actor.fainted)state='Sleep';
  else if(actor.hitRemaining>0)state='Hurt';
  else if(cast)state=cast.pose;
  else if(actor.moving)state='Walk';
  const meta=config.states[state]||config.states.Idle;
  if(reducedMotion){frame=cast?.released?clamp(meta.hit,0,meta.frames-1):0;}
  else if(cast&&['Attack','Shoot'].includes(state)&&meta.frames>=3){
    const hit=clamp(meta.hit,1,meta.frames-2),recover=clamp(meta.recover,hit+1,meta.frames-1);
    if(cast.age<cast.windup){
      const duration=meta.durations.slice(0,hit).reduce((a,b)=>a+b,0);
      frame=timedFrame(meta,clamp(cast.age/cast.windup,0,.9999)*duration,0,hit);
    }else{
      const recovery=Math.min(.12,(cast.duration-cast.windup)*.4),remaining=cast.duration-cast.age;
      if(remaining<=recovery){const duration=meta.durations.slice(recover).reduce((a,b)=>a+b,0);frame=timedFrame(meta,clamp(1-remaining/recovery,0,.9999)*duration,recover);}
      else frame=timedFrame(meta,cast.age-cast.windup,hit,recover);
    }
  }else if(state==='Walk')frame=timedFrame(meta,(actor.walkDistance||0)/32*meta.duration);
  else if(state==='Hurt')frame=timedFrame(meta,Math.max(0,.18-actor.hitRemaining));
  else frame=timedFrame(meta,time+(actor.id||0)*.137);
  const row=meta.directions===1?0:directionRow(angle);
  const scale=config.scale*(actor.boss ? .72 : actor.level ? .62*(1+(actor.level-1)*.09) : .49);
  return {state,frame,row,meta,anchor:meta.anchors[row][frame],head:meta.heads[row][frame],scale,angle};
}
export function muzzlePosition(actor,reducedMotion=false){
  const sample=spriteSample(actor,0,reducedMotion),offset=bodyOffset(actor,reducedMotion),angle=actor.cast?.angle??actor.lookAngle??0;
  if(!sample)return {x:actor.x+Math.cos(angle)*12,y:actor.y-12+Math.sin(angle)*12};
  return {x:actor.x+offset.x+(sample.head[0]-sample.anchor[0])*sample.scale+Math.cos(angle)*4,
    y:actor.y+offset.y+(sample.head[1]-sample.anchor[1])*sample.scale+Math.sin(angle)*4};
}
