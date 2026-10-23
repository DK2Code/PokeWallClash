import {WIDTH,HEIGHT,TOWERS,towerStats,xpProgress} from './game.mjs';
import {DIRECTIONAL} from './directional-data.mjs';
import {spriteSample,bodyOffset,muzzlePosition,attackTiming} from './sprite-animation.mjs';
import {attackVisual} from './combat-visuals.mjs';
import {drawAttackShot,drawAttackImpact,drawAttackCharge} from './combat-art.mjs';
import {spriteVariant} from './sprite-colors.mjs';
import {routeAmbient} from './route-scenery.mjs';
import {createBattleTerrain,drawRouteEntrance} from './terrain.mjs';
const sprites = new Map();
const directionalSheets=new Map();
export function loadSprites() {
  const jobs=[];
  const load=(url,store,key)=>new Promise(resolve=>{const image=new Image();image.onload=()=>{store.set(key,image);resolve(true);};image.onerror=()=>resolve(false);image.src=url;});
  for(const [id,config] of Object.entries(DIRECTIONAL)){
    jobs.push(load(`./assets/${id}.png`,sprites,Number(id)));
    for(const [state,meta] of Object.entries(config.states))jobs.push(load(`./assets/directional/${meta.file}`,directionalSheets,`${id}-${state}`));
  }
  return Promise.all(jobs);
}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export const createTerrain=createBattleTerrain;
function sprite(c,id,x,y,size=88,flip=false,shiny=false){const image=spriteVariant(sprites.get(id),shiny);if(!image)return;c.save();c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(image,-size/2,-size*.77,size,size);c.restore();}
function animatedSprite(c,actor,time,reducedMotion=false,extraScale=1){
  const sample=spriteSample(actor,time,reducedMotion),sheet=sample&&spriteVariant(directionalSheets.get(`${actor.species||actor.kind}-${sample.state}`),actor.shiny);
  if(!sheet){sprite(c,actor.species||actor.kind,actor.x,actor.y,actor.boss?115:actor.level?90:76,Math.cos(actor.lookAngle||0)<0,actor.shiny);return;}
  const {meta,frame,row,anchor,scale}=sample,offset=bodyOffset(actor,reducedMotion);
  const appear=reducedMotion?1:actor.appear>0?Math.min(1.08,1-Math.pow(actor.appear/.4,2)+Math.sin((1-actor.appear/.4)*Math.PI)*.12):1;
  c.save();c.translate(Math.round(actor.x+offset.x),Math.round(actor.y+offset.y+sample.idleBob));c.scale(scale*appear*extraScale,scale*appear*extraScale);
  c.imageSmoothingEnabled=false;if(actor.flash>0&&!reducedMotion)c.filter='brightness(1.35)';
  c.drawImage(sheet,frame*meta.width,row*meta.height,meta.width,meta.height,-anchor[0],-anchor[1],meta.width,meta.height);c.restore();
}
function star(c,x,y,r,color,rotation=0){const points=[];for(let i=0;i<10;i++){const a=rotation-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}polygon(c,points,color);}
function drawEffect(c,e,time,reducedMotion){
  const p=e.age/e.duration,fade=1-p;c.save();
  if(e.type==='defeat'){
    c.globalAlpha=fade;animatedSprite(c,{...e.actor,appear:0,x:e.x,y:e.y+(reducedMotion?0:p*9)},time,reducedMotion);
    if(!reducedMotion)for(let i=0;i<4;i++){const a=i*Math.PI/2;ellipse(c,e.x+Math.cos(a)*(10+p*18),e.y+Math.sin(a)*(4+p*6),2+fade*2,1+fade,'#e6ddc8');}
  }else if(e.type==='capture'||e.type==='recall'){
    if(e.actor&&p<.6){c.globalAlpha=1-p/.6;animatedSprite(c,{...e.actor,appear:0,x:e.x,y:e.y},time,reducedMotion,reducedMotion?1:1-p*.7);}
    c.globalAlpha=fade;const y=e.y-10-(reducedMotion?0:Math.sin(p*Math.PI)*15);ellipse(c,e.x,y,6,6,'#fff4d7');c.fillStyle='#be7670';c.beginPath();c.arc(e.x,y,6,Math.PI,Math.PI*2);c.fill();rect(c,e.x-6,y,12,1,'#74534e');ellipse(c,e.x,y,2,2,'#fff6dc');
    if(!reducedMotion)for(let i=0;i<5;i++){const a=i*Math.PI*2/5;star(c,e.x+Math.cos(a)*(10+p*20),y+Math.sin(a)*(10+p*20),2+fade*2,'#fff1b6',p);}
  }else if(e.type==='impact'){
    drawAttackImpact(c,e,time,reducedMotion);
  }else if(e.type==='evolve'){
    c.globalAlpha=fade;c.strokeStyle=e.color;c.lineWidth=3;
    c.beginPath();c.ellipse(e.x,e.y,24+(reducedMotion?0:p*24),12+(reducedMotion?0:p*12),0,0,Math.PI*2);c.stroke();
    if(!reducedMotion){
      c.globalAlpha=Math.sin(p*Math.PI)*.2;ellipse(c,e.x,e.y-25,32,49,'#fffad5');c.globalAlpha=fade;
      for(let i=0;i<10;i++){const a=i*Math.PI/5+p*2,r=20+p*35;star(c,e.x+Math.cos(a)*r,e.y-25+Math.sin(a)*r,2+fade*3,i%2?e.color:'#fff4b8',a);}
    }
    if(p>.35||reducedMotion){
      c.globalAlpha=Math.min(1,fade*3);c.font='bold 10px monospace';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#486049';
      c.strokeText(e.name,e.x,e.y-72);c.fillStyle='#fff7d7';c.fillText(e.name,e.x,e.y-72);
      c.font='bold 9px monospace';c.strokeText(e.move,e.x,e.y-59);c.fillText(e.move,e.x,e.y-59);
    }
  }else{
    const color=e.type==='leak'?'#e99d8b':e.type==='evolve'?'#fff3b9':'#f7f5da';c.globalAlpha=fade;c.strokeStyle=color;c.lineWidth=2;
    c.beginPath();c.ellipse(e.x,e.y,12+p*35,6+p*18,0,0,Math.PI*2);c.stroke();
    if(!reducedMotion){for(let i=0;i<8;i++){const a=i*Math.PI/4+p;star(c,e.x+Math.cos(a)*(14+p*25),e.y-18+Math.sin(a)*(14+p*25)-p*15,2+fade*3,color,a);}if(e.type==='evolve'){c.globalAlpha=fade*.16;ellipse(c,e.x,e.y-19,26*fade,43,color);}}
  }
  c.restore();
}
function range(c,x,y,r,color){c.fillStyle=color+'16';c.strokeStyle=color+'99';c.lineWidth=1.5;c.setLineDash([5,5]);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);}
export function render(c,terrain,game,ui){
  c.clearRect(0,0,WIDTH,HEIGHT);c.drawImage(terrain,0,0);c.imageSmoothingEnabled=false;
  routeAmbient(c,game,ui.reducedMotion);
  if(ui.selectedTower){const t=game.towers.find(t=>t.id===ui.selectedTower);if(t)range(c,t.x,t.y,towerStats(t).range,'#fff5c8');}
  const empty=game.map.pads.map((p,i)=>({p,i})).filter(({i})=>!game.towers.some(t=>t.pad===i));
  for(const {p:[x,y],i} of empty){const active=ui.selectedKind!==null,hover=ui.hoverPad===i;c.strokeStyle=hover?'#fff9d9':active?'#f6f4cdcc':'#8baf70aa';c.lineWidth=hover?2.5:1.5;c.setLineDash([3,3]);c.beginPath();c.ellipse(x,y-2,21,12,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=active?1:.65;rect(c,x-5,y-3,10,2,hover?'#fffce7':'#6e9465');rect(c,x-1,y-7,2,10,hover?'#fffce7':'#6e9465');c.globalAlpha=1;}
  if(ui.selectedKind!==null&&ui.hoverPad!==null&&!game.towers.some(t=>t.pad===ui.hoverPad)){const t=TOWERS.find(t=>t.id===ui.selectedKind),[x,y]=game.map.pads[ui.hoverPad];range(c,x,y,t.range*(game.map.boostPads?.includes(ui.hoverPad)?1.2:1),t.color);c.globalAlpha=.65;animatedSprite(c,{kind:t.id,x,y,level:1,shiny:Boolean(game.collection[t.id]?.useShiny)},game.time,ui.reducedMotion);c.globalAlpha=1;}
  const entities=[...game.towers.map(t=>({...t,entity:'tower'})),...game.enemies.map(e=>({...e,entity:'enemy'}))].sort((a,b)=>a.y-b.y);
  for(const e of entities){if(e.entity==='tower'){
      const spec=towerStats(e);ellipse(c,e.x,e.y+2,21,10,ui.selectedTower===e.id?'#eadc99':e.routeRange>1?'#9178b0':'#6f955d');ellipse(c,e.x,e.y-1,20,9,e.routeRange>1?'#c6ade5':'#c6d6a0');
      const evolution=game.effects.find(effect=>effect.type==='evolve'&&effect.towerId===e.id),p=evolution?evolution.age/evolution.duration:1;
      if(evolution&&!ui.reducedMotion&&p<.42){animatedSprite(c,{...evolution.previousActor,flash:.1},game.time,false,1+p*.3);}
      else animatedSprite(c,e,game.time,ui.reducedMotion,evolution&&!ui.reducedMotion?Math.min(1,.8+(p-.42)*.7):1);
      if(e.shiny)star(c,e.x+20,e.y-30,4,'#fff1a3',ui.reducedMotion?0:game.time);
      drawAttackCharge(c,e,muzzlePosition(e,ui.reducedMotion),ui.reducedMotion);
      for(let i=0;i<e.level;i++)ellipse(c,e.x+(i-(e.level-1)/2)*6,e.y+14,2,2,'#fff7c1');
      const progress=xpProgress(e);
      if(progress.ready){
        const float=ui.reducedMotion?0:Math.sin(game.time*3+e.id)*2;star(c,e.x,e.y-44+float,6,'#fff1a3',0);
        c.strokeStyle='#fff3b9';c.lineWidth=1.5;c.beginPath();c.ellipse(e.x,e.y,25,13,0,0,Math.PI*2);c.stroke();
      }else if(ui.selectedTower===e.id&&e.level<3){rect(c,e.x-17,e.y+20,34,3,'#617f54');rect(c,e.x-16,e.y+21,32*progress.percent/100,1,'#f7d77a');}
    }else{
      ellipse(c,e.x,e.y+3,e.boss?26:14,e.boss?9:5,'#53644230');animatedSprite(c,e,game.time,ui.reducedMotion);
      const w=e.boss?46:28,barY=e.y-(e.boss?76:39);rect(c,e.x-w/2,barY,w,4,'#53614b');rect(c,e.x-w/2+1,barY+1,(w-2)*Math.max(0,e.hp/e.maxHp),2,e.poison>0?'#b89bc7':e.slow>0?'#8ed0e0':'#b0cc77');
      if(e.slow>0){c.strokeStyle='#a5e3e5aa';c.lineWidth=1.5;c.beginPath();c.ellipse(e.x,e.y+2,17,6,0,0,Math.PI*2);c.stroke();}
      if(e.poison>0&&!ui.reducedMotion){for(let i=0;i<2;i++){const p=(game.time*.8+i*.5)%1;ellipse(c,e.x+Math.sin(e.id+i*3)*12,e.y-10-p*19,2,2,'#b59ccb99');}}
      if(e.boss||e.visitor){
        const label=`${e.shiny?'★ ':''}${e.name}`,fontSize=Math.min(30,12*960/(c.canvas.clientWidth||960));
        const margin=label.length*fontSize*.33+4,labelX=Math.max(margin,Math.min(960-margin,e.x));
        c.font=`bold ${fontSize}px monospace`;c.textAlign='center';c.lineWidth=fontSize/4;c.strokeStyle='#fff9e8';c.strokeText(label,labelX,barY-9);c.fillStyle=e.legendary?'#74511d':e.boss?'#5d4c45':'#4d365e';c.fillText(label,labelX,barY-9);
      }
      if(e.visitor){c.strokeStyle=e.legendary?'#fff1b2':'#e6c9f4';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,23,10,0,0,Math.PI*2);c.stroke();star(c,e.x+23,e.y-23,5,e.shiny?'#fff1a3':'#e6c9f4',ui.reducedMotion?0:game.time);}
    }}
  drawRouteEntrance(c,game.map,{showLabel:false});
  for(const s of game.shots){
    if(s.towerId&&['channel','melee','dash'].includes(s.visual.mode)){
      const actor=game.towers.find(t=>t.id===s.towerId);if(!actor?.cast||actor.cast.visual.moveId!==s.visual.moveId)continue;
      drawAttackShot(c,{...s,...muzzlePosition(actor,ui.reducedMotion)},game.time,ui.reducedMotion);
    }else drawAttackShot(c,s,game.time,ui.reducedMotion);
  }
  for(const e of game.effects)drawEffect(c,e,game.time,ui.reducedMotion);
  for(const p of game.particles){const y=p.y-30-(ui.reducedMotion?0:(1-p.life/p.maxLife)*24);c.globalAlpha=p.life/p.maxLife;c.font='bold 12px monospace';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#557149';c.strokeText(p.text,p.x,y);c.fillStyle=p.color;c.fillText(p.text,p.x,y);c.globalAlpha=1;}
  // A quiet drifting leaf or two keeps the forest alive between waves.
  if(!ui.reducedMotion){for(let i=0;i<7;i++){const x=(game.time*9+i*151)%1000-20,y=(game.time*13+i*91)%600-20;c.save();c.translate(x,y);c.rotate(Math.sin(game.time+i)*.7);rect(c,0,0,5,3,game.map.theme==='autumn'?'#c58e5599':'#e9e8ad88');c.restore();}}
}

// A harmless demonstration using the same sprites, cast timing and effects as
// real combat. No Game instance, rewards, saved collection or battle clock.
export function renderAttackPreview(c,tower,time=0,reducedMotion=false){
  const s=towerStats(tower),visual=attackVisual(s,tower.level,tower.branch),timing=attackTiming(s.rate,s.type,visual);
  const age=reducedMotion?timing.windup+.1:(time%2.4-.2)*.65;
  const actor={...tower,id:0,species:s.sprite,x:47,y:86,lookAngle:0,appear:0,cast:age>=0&&age<timing.duration?{...timing,visual,age,angle:0,target:{x:239,y:86},released:age>=timing.windup}:null};
  c.clearRect(0,0,300,112);c.imageSmoothingEnabled=false;
  rect(c,0,0,300,112,'#e7edda');rect(c,0,77,300,35,'#d8e2c6');
  c.setLineDash([4,6]);c.strokeStyle='#b5c4a4';c.beginPath();c.moveTo(8,88);c.lineTo(292,88);c.stroke();c.setLineDash([]);
  ellipse(c,actor.x,actor.y+1,23,9,'#becda6');animatedSprite(c,actor,time,reducedMotion);
  ellipse(c,239,85,16,5,'#bdc9ad');rect(c,236,60,6,26,'#927854');ellipse(c,239,53,13,16,'#b09a6b');ellipse(c,239,53,9,11,'#f5eac8');ellipse(c,239,53,4,5,'#b37860');
  drawAttackCharge(c,actor,muzzlePosition(actor,reducedMotion),reducedMotion);
  const sinceRelease=reducedMotion ? .1 : age-timing.windup;
  if(sinceRelease>=0){
    // Slow the whole demonstration together: pose, contact, beam and recovery.
    const elapsed=reducedMotion ? .1 : sinceRelease,attached=['channel','melee','dash'].includes(visual.mode);
    const origin=attached?muzzlePosition(actor,reducedMotion):muzzlePosition({...actor,cast:{...timing,visual,age:timing.windup,angle:0,target:{x:239,y:86},released:true}},reducedMotion);
    if(elapsed<visual.shotDuration)drawAttackShot(c,{...origin,tx:239,ty:53,visual,life:visual.shotDuration-elapsed,maxLife:visual.shotDuration},time,reducedMotion);
    if(elapsed<visual.impactDuration)drawAttackImpact(c,{x:239,y:53,visual:{...visual,area:0},age:elapsed,duration:visual.impactDuration},time,reducedMotion);
    if(visual.chain){
      for(const y of [24,91])if(elapsed<.34){ellipse(c,277,y,4,4,'#b09a6b');drawAttackShot(c,{x:239,y:53,tx:277,ty:y,visual,chain:true,life:.34-elapsed,maxLife:.34},time,reducedMotion);}
    }
  }
}
