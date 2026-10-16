// Adapt only coordinates, effect lifetime and scale. Move silhouettes, palettes,
// particle motion and strike geometry are the unchanged Arena renderers.
import {drawShot,drawBattleEffect,drawImpact,drawCharge} from './arena/combat-art.mjs';
import {muzzlePosition as arenaMuzzle} from './arena/sprite-animation.mjs';
const clamp=n=>Math.max(0,Math.min(1,n));
const groundModes=new Set(['ground','zone']);

export function drawAttackShot(c,shot,time,reducedMotion=false){
  const v=shot.visual;if(!v)return;
  const m=v.arenaMove,t=reducedMotion?.12:time;
  const p=reducedMotion?.52:clamp(1-shot.life/shot.maxLife),age=p*shot.maxLife;
  const dx=shot.tx-shot.x,dy=shot.ty-shot.y,distance=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
  const scale=.58*v.scale*(shot.chain?.7:1);
  c.save();
  if(m.mode==='projectile'){
    // Arena's multi-shot fan converges on the selected tower-defense target.
    for(let i=0;i<m.count;i++){
      const spread=(i-(m.count-1)/2)*(m.spread||.05)*distance*Math.sin(p*Math.PI);
      const x=shot.x+dx*p-Math.sin(angle)*spread,y=shot.y+dy*p+Math.cos(angle)*spread;
      c.save();c.translate(x,y);c.scale(scale,scale);
      drawShot(c,{id:i,move:m,kind:m.visual,x:0,y:0,vx:Math.cos(angle),vy:Math.sin(angle),age,radius:m.radius,color:m.color,core:m.core,element:m.element},t);
      c.restore();
    }
  }else{
    const ground=groundModes.has(m.mode),center=ground?{x:shot.tx,y:shot.ty}:{x:shot.x,y:shot.y};
    c.translate(center.x,center.y);c.scale(scale,scale);
    const reach=distance/scale;
    const radius=(v.area||Math.min(70,m.radius*scale))/scale;
    const move={...m,range:reach};
    drawBattleEffect(c,{move,kind:m.visual,mode:m.mode,x:0,y:0,angle,age:p*m.duration,duration:m.duration,life:(1-p)*m.duration,
      attached:m.mode==='channel',range:reach,displayRange:reach*Math.min(1,p*7),width:m.width,
      radius:['wave','burst'].includes(m.mode)?Math.max(1,reach*p):radius,
      target:{x:dx/scale,y:dy/scale},color:m.color,core:m.core,element:m.element},t);
  }
  c.restore();
}

export function drawAttackImpact(c,e,time,reducedMotion=false){
  const v=e.visual;if(!v)return;
  const p=reducedMotion?.45:clamp(e.age/e.duration),scale=.45*v.scale;
  c.save();c.translate(e.x,e.y);c.scale(scale,scale);
  drawImpact(c,{x:0,y:0,age:p,duration:1,element:v.type,color:v.color,heavy:v.level===3},reducedMotion?.12:time);
  c.restore();
  // This footprint describes the TD perk, independent of the Arena move's art.
  if(v.area){c.save();c.globalAlpha=(1-p)*.25;c.strokeStyle=v.color;c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.arc(e.x,e.y,v.area,0,Math.PI*2);c.stroke();c.restore();}
}

export function drawAttackCharge(c,actor,muzzle,reducedMotion=false){
  const cast=actor.cast,v=cast?.visual;if(!v||cast.age>=cast.windup||reducedMotion)return;
  const f={...actor,id:actor.species||actor.kind,form:actor.species||actor.kind,vx:0,facing:Math.cos(cast.angle)>=0?1:-1,
    cast:{...cast,index:Math.min(2,(actor.level||1)-1),ground:false}};
  const origin=arenaMuzzle(f),scale=.58;
  c.save();c.translate(muzzle.x,muzzle.y);c.scale(scale,scale);c.translate(-origin.x,-origin.y);
  drawCharge(c,f,v.color,cast.age);c.restore();
  if(groundModes.has(v.mode)&&cast.target){
    c.save();c.globalAlpha=.2+.3*cast.age/cast.windup;c.strokeStyle=v.color;c.lineWidth=1;c.setLineDash([5,5]);
    c.beginPath();c.ellipse(cast.target.x,cast.target.y-12,v.area||32,(v.area||32)*.65,0,0,Math.PI*2);c.stroke();c.restore();
  }
}
