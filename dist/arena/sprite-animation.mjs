import { DIRECTIONAL } from './directional-data.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// SpriteCollab rows: south, southeast, east, northeast, north, northwest, west, southwest.
export const directionRow=angle=>((Math.round((Math.PI/2-angle)/(Math.PI/4))%8)+8)%8;
function timedFrame(meta,time,start=0,end=meta.frames) {
  if(end<=start)return Math.min(start,meta.frames-1);
  const duration=meta.durations.slice(start,end).reduce((a,b)=>a+b,0);
  let remaining=((time%duration)+duration)%duration;
  for(let i=start;i<end;i++){if(remaining<meta.durations[i])return i;remaining-=meta.durations[i];}
  return end-1;
}
export function bodyOffset(f) {
  const c=f.cast;
  if(!c)return {x:0,y:0};
  const anticipation=c.age<c.windup;
  const phase=anticipation?c.age/c.windup:(c.age-c.windup)/(c.duration-c.windup);
  const amount=anticipation?-5*Math.sin(phase*Math.PI/2):Math.sin(Math.min(1,phase*3)*Math.PI)*9;
  return {x:Math.cos(c.angle)*amount,y:Math.sin(c.angle)*amount};
}
export function spriteSample(f,time=f.animTime||0) {
  const config=DIRECTIONAL[f.form||f.id];if(!config)return null;
  const c=f.cast,moving=Math.hypot(f.vx||0,f.vy||0)>12;
  let state='Idle',frame=0;
  let angle=c?.angle??f.lookAngle??(f.facing===-1?Math.PI:0);
  if(f.hp<=0||f.conditions?.sleep)state='Sleep';
  else if(f.hit>0&&!c?.channel)state='Hurt';
  else if(c)state=c.pose||(c.index===2?'Attack':'Shoot');
  else if(f.dashTime>0)state='Charge';
  else if(moving)state='Walk';
  const meta=config.states[state];
  if(c&&['Attack','Shoot'].includes(state)&&meta.frames>=3){
    const hit=clamp(meta.hit,1,meta.frames-2),recover=clamp(meta.recover,hit+1,meta.frames-1);
    if(c.age<c.windup){
      const duration=meta.durations.slice(0,hit).reduce((a,b)=>a+b,0);
      frame=timedFrame(meta,clamp(c.age/c.windup,0,.9999)*duration,0,hit);
    }else{
      const recovery=Math.min(.12,(c.duration-c.windup)*.4),remaining=c.duration-c.age;
      if(remaining<=recovery){
        const duration=meta.durations.slice(recover).reduce((a,b)=>a+b,0);
        frame=timedFrame(meta,clamp(1-remaining/recovery,0,.9999)*duration,recover);
      }else frame=timedFrame(meta,c.age-c.windup,hit,recover);
    }
  }else if(c&&['Attack','Shoot'].includes(state))frame=timedFrame(meta,c.age);
  else if(state==='Hurt')frame=timedFrame(meta,Math.max(0,.18-f.hit));
  else if(state==='Walk')frame=timedFrame(meta,(f.step||0)*.18);
  else frame=timedFrame(meta,time);
  const row=meta.directions===1?0:directionRow(angle),anchor=meta.anchors[row][frame],head=meta.heads[row][frame];
  return {state,frame,row,meta,anchor,head,scale:config.scale,angle};
}
export function muzzlePosition(f) {
  const sample=spriteSample(f),offset=bodyOffset(f),angle=f.cast?.angle??f.lookAngle??0;
  if(!sample)return {x:f.x+Math.cos(angle)*30,y:f.y+Math.sin(angle)*30};
  return {x:f.x+offset.x+(sample.head[0]-sample.anchor[0])*sample.scale+Math.cos(angle)*9,
    y:f.y+15+offset.y+(sample.head[1]-sample.anchor[1])*sample.scale/(f.projection||1)+Math.sin(angle)*9};
}
