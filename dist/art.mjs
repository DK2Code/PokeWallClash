import {WIDTH,HEIGHT,TOWERS,towerStats,xpProgress} from './game.mjs';
import {DIRECTIONAL} from './directional-data.mjs';
import {spriteSample,bodyOffset,muzzlePosition,attackTiming} from './sprite-animation.mjs';
import {attackVisual} from './combat-visuals.mjs';
import {drawAttackShot,drawAttackImpact,drawAttackCharge} from './combat-art.mjs';
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
const palettes={forest:{grass:'#a8c984',dark:'#8eb574',patch:'#b1d08d',leaf:'#527953',light:'#72905b',deep:'#365d48',water:'#78b7bb'},water:{grass:'#a5c99a',dark:'#8cb688',patch:'#b6d5a6',leaf:'#4d7e65',light:'#78a079',deep:'#365e53',water:'#6baebc'},autumn:{grass:'#c2c18a',dark:'#aeb17c',patch:'#d1cd99',leaf:'#a57a4f',light:'#c49c59',deep:'#735e45',water:'#8aafb1'}};
function random(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function distToSegment(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
function pathDistance(x,y,path){return Math.min(...path.slice(1).map((b,i)=>distToSegment(x,y,path[i],b)));}
function tree(c,x,y,s,p,r){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);
  ellipse(c,0,7,32,11,'#3c60412c');rect(c,-7,-13,14,24,'#776a48');rect(c,-4,-14,5,24,'#928058');
  const shape=[[-29,-19],[-35,-19],[-35,-39],[-28,-39],[-28,-55],[-19,-55],[-19,-67],[-7,-67],[-7,-73],[10,-73],[10,-65],[22,-65],[22,-54],[30,-54],[30,-39],[36,-39],[36,-22],[28,-22],[28,-12],[-23,-12],[-23,-19]];
  polygon(c,shape,p.deep);
  polygon(c,shape.map(([a,b])=>[a*.91,b*.88-6]),p.leaf);
  rect(c,-19,-55,28,23,p.light);rect(c,-24,-40,25,14,p.light);rect(c,-9,-64,20,12,p.light);rect(c,-24,-37,7,8,p.leaf);
  rect(c,8,-32,19,12,p.deep+'99');rect(c,-11,-17,25,4,p.deep+'77');
  for(let i=0;i<8;i++){const a=-23+r()*45,b=-54+r()*32;rect(c,a,b,5+r()*5,3,p.light+'88');}
  c.restore();
}
function rock(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,0,6,13,5,'#4c63432a');polygon(c,[[-12,4],[-10,-6],[-3,-12],[7,-10],[14,1],[9,7],[-6,7]],'#84958a');polygon(c,[[-10,-6],[-3,-12],[7,-10],[10,-3],[-2,1]],'#adb5a1');rect(c,-7,4,14,3,'#6e8178');c.restore();}
function bush(c,x,y,p){ellipse(c,x,y+3,17,7,'#5e80563a');rect(c,x-16,y-8,32,15,p.leaf);rect(c,x-10,y-15,19,9,p.leaf);rect(c,x-12,y-10,10,6,p.light);rect(c,x+6,y-3,6,5,p.deep);}
function fence(c,x,y,len){rect(c,x,y+5,len,4,'#907a53');rect(c,x,y+15,len,4,'#907a53');for(let i=0;i<=len;i+=22){rect(c,x+i,y,6,26,'#9c855b');rect(c,x+i,y,4,22,'#c7b078');}}
function house(c,x,y){
  ellipse(c,x,y+29,51,14,'#38594330');rect(c,x-41,y-17,82,46,'#7b7861');rect(c,x-37,y-18,74,43,'#f2e5b8');rect(c,x-36,y+15,72,9,'#d7cca2');rect(c,x-8,y-2,18,30,'#52777a');rect(c,x-5,y+1,12,23,'#81a4a1');
  for(const side of [-1,1]){rect(c,x+side*24-8,y-5,15,14,'#8f8d6a');rect(c,x+side*24-6,y-3,11,10,'#9ec5be');rect(c,x+side*24-1,y-3,2,11,'#efe6c9');}
  polygon(c,[[x-48,y-18],[x-33,y-48],[x+32,y-48],[x+49,y-18]],'#874f4d');polygon(c,[[x-44,y-22],[x-30,y-46],[x+29,y-46],[x+43,y-22]],'#b86b59');
  rect(c,x-30,y-43,59,3,'#d38a68');rect(c,x-37,y-31,75,3,'#a45851');rect(c,x-46,y-21,92,5,'#784e47');
  ellipse(c,x,y-31,10,10,'#f4e3b7');rect(c,x-8,y-32,16,3,'#805650');ellipse(c,x,y-31,3,3,'#f4e3b7');rect(c,x-17,y+29,36,5,'#a6aa8e');rect(c,x-20,y+34,42,5,'#bcc0a0');
}
function pond(c,p,palette,r){
  const {x,y,rx,ry}=p;ellipse(c,x,y+4,rx+9,ry+9,'#8eac75');ellipse(c,x,y,rx+5,ry+5,'#d0d2a0');ellipse(c,x,y,rx,ry,palette.water);ellipse(c,x+3,y+4,rx-7,ry-6,'#6ca6ac');
  for(let i=0;i<11;i++){const a=r()*Math.PI*2,rad=r()*.8;rect(c,x+Math.cos(a)*rx*rad,y+Math.sin(a)*ry*rad,8+r()*17,2,'#a7d0c7');}
  ellipse(c,x-rx*.4,y-ry*.1,10,4,'#6d9c70');ellipse(c,x+rx*.46,y+ry*.25,8,4,'#89b284');rect(c,x+rx*.46,y+ry*.25-4,3,4,'#edd0a9');
  for(let i=0;i<7;i++){const xx=x-rx+5+i*4,yy=y+ry*.35;rect(c,xx,yy-10-r()*9,2,18,'#6d8862');}
}
export function createTerrain(map,mapIndex=0){
  const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const p=palettes[map.theme],r=random(3213+mapIndex*719);rect(c,0,0,WIDTH,HEIGHT,p.grass);
  for(let y=0;y<HEIGHT;y+=32)for(let x=0;x<WIDTH;x+=32){if(r()>.54)rect(c,x,y,32,32,p.patch+'77');if(r()>.65)rect(c,x,y,32,32,p.dark+'30');}
  for(let i=0;i<700;i++){const x=r()*WIDTH,y=r()*HEIGHT;rect(c,x,y,2,4,p.dark+'aa');if(r()>.5)rect(c,x-3,y+2,2,2,p.dark+'99');}
  pond(c,map.pond,p,r);
  c.lineJoin='round';c.lineCap='round';
  const stroke=(width,color,offset=0)=>{c.beginPath();map.path.forEach(([x,y],i)=>i?c.lineTo(x,y+offset):c.moveTo(x,y+offset));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
  stroke(65,'#75965c60',4);stroke(60,'#bba97a');stroke(53,'#e3ce9c');stroke(43,'#e9d5a5');
  for(let i=0;i<600;i++){const x=r()*WIDTH,y=r()*HEIGHT,d=pathDistance(x,y,map.path);if(d<23){rect(c,x,y,2+r()*4,2,r()>.5?'#d1bd8c':'#f2e0b7');}}
  // Stepping stones make turns and entrances easy to read.
  for(const [x,y] of map.path.slice(1,-1)){rect(c,x-13,y-5,17,10,'#d8c291');rect(c,x+8,y+8,12,7,'#d4bf8d');}
  for(let i=0;i<125;i++){const x=35+r()*890,y=62+r()*440;if(pathDistance(x,y,map.path)<46||map.pads.some(([px,py])=>Math.hypot(px-x,py-y)<43)||Math.hypot((x-map.pond.x)/map.pond.rx,(y-map.pond.y)/map.pond.ry)<1.3)continue;if(i%8===0)rock(c,x,y,.7+r()*.4);else if(i%4===0)bush(c,x,y,p);else {rect(c,x,y,3,6,'#719563');rect(c,x-2,y-2,7,4,i%3===0?'#f2e3aa':'#e5c6bb');rect(c,x,y-2,2,2,'#cbab6f');}}
  // Dense woodland framing the playable clearing.
  const trees=[];for(let x=-15;x<1000;x+=42){trees.push([x+r()*15,48+r()*14,.85+r()*.35]);trees.push([x+20,11+r()*12,1+r()*.2]);}
  for(let x=-15;x<1000;x+=46)trees.push([x,594+r()*22,.95+r()*.4]);
  for(let y=80;y<530;y+=53){if(pathDistance(15,y,map.path)>60)trees.push([12,y,1+r()*.2]);if(pathDistance(947,y,map.path)>68)trees.push([954,y,1+r()*.2]);}
  [[54,93],[340,77],[603,74],[889,90],[45,477],[177,535],[429,537],[919,528]].forEach(([x,y])=>{if(pathDistance(x,y,map.path)>65&&!map.pads.some(([a,b])=>Math.hypot(a-x,b-y)<55))trees.push([x,y,.9]);});
  trees.sort((a,b)=>a[1]-b[1]).forEach(([x,y,s])=>tree(c,x,y,s,p,r));
  const sy=map.path[0][1];fence(c,45,sy+45,66);rect(c,54,sy-68,5,32,'#8b7956');rect(c,35,sy-72,43,21,'#bda16e');rect(c,38,sy-69,37,15,'#ddca93');c.font='bold 8px monospace';c.fillStyle='#695c46';c.textAlign='center';c.fillText('ROUTE',56,sy-58);
  const hy=map.path.at(-1)[1];house(c,903,hy-2);fence(c,840,hy+53,88);
  c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#42684e';c.fillText('HOME',903,hy+58);
  for(const [x,y] of map.pads){ellipse(c,x,y+3,25,13,'#78995c2b');ellipse(c,x,y,23,13,'#cad8a3');ellipse(c,x,y-2,21,12,'#b8cd90');c.strokeStyle='#e5edc3aa';c.lineWidth=1;c.beginPath();c.ellipse(x,y-2,20,11,0,0,Math.PI*2);c.stroke();}
  return canvas;
}
function sprite(c,id,x,y,size=88,flip=false){const image=sprites.get(id);if(!image)return;c.save();c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(image,-size/2,-size*.77,size,size);c.restore();}
function animatedSprite(c,actor,time,reducedMotion=false,extraScale=1){
  const sample=spriteSample(actor,time,reducedMotion),sheet=sample&&directionalSheets.get(`${actor.species||actor.kind}-${sample.state}`);
  if(!sheet){sprite(c,actor.species||actor.kind,actor.x,actor.y,actor.boss?115:actor.level?90:76,Math.cos(actor.lookAngle||0)<0);return;}
  const {meta,frame,row,anchor,scale}=sample,offset=bodyOffset(actor,reducedMotion);
  const appear=reducedMotion?1:actor.appear>0?Math.min(1.08,1-Math.pow(actor.appear/.4,2)+Math.sin((1-actor.appear/.4)*Math.PI)*.12):1;
  c.save();c.translate(Math.round(actor.x+offset.x),Math.round(actor.y+offset.y));c.scale(scale*appear*extraScale,scale*appear*extraScale);
  c.imageSmoothingEnabled=false;if(actor.shiny)c.filter='hue-rotate(115deg) saturate(1.3)';if(actor.flash>0&&!reducedMotion)c.filter='brightness(1.65) saturate(.7)';
  c.drawImage(sheet,frame*meta.width,row*meta.height,meta.width,meta.height,-anchor[0],-anchor[1],meta.width,meta.height);c.restore();
}
function star(c,x,y,r,color,rotation=0){const points=[];for(let i=0;i<10;i++){const a=rotation-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}polygon(c,points,color);}
function drawEffect(c,e,time,reducedMotion){
  const p=e.age/e.duration,fade=1-p;c.save();
  if(e.type==='capture'||e.type==='recall'){
    if(e.actor&&p<.6){c.globalAlpha=1-p/.6;animatedSprite(c,{...e.actor,appear:0},time,reducedMotion,reducedMotion?1:1-p*.7);}
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
  if(ui.selectedTower){const t=game.towers.find(t=>t.id===ui.selectedTower);if(t)range(c,t.x,t.y,towerStats(t).range,'#fff5c8');}
  const empty=game.map.pads.map((p,i)=>({p,i})).filter(({i})=>!game.towers.some(t=>t.pad===i));
  for(const {p:[x,y],i} of empty){const active=ui.selectedKind!==null,hover=ui.hoverPad===i;c.strokeStyle=hover?'#fff9d9':active?'#f6f4cdcc':'#8baf70aa';c.lineWidth=hover?2.5:1.5;c.setLineDash([3,3]);c.beginPath();c.ellipse(x,y-2,21,12,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=active?1:.65;rect(c,x-5,y-3,10,2,hover?'#fffce7':'#6e9465');rect(c,x-1,y-7,2,10,hover?'#fffce7':'#6e9465');c.globalAlpha=1;}
  if(ui.selectedKind!==null&&ui.hoverPad!==null&&!game.towers.some(t=>t.pad===ui.hoverPad)){const t=TOWERS.find(t=>t.id===ui.selectedKind),[x,y]=game.map.pads[ui.hoverPad];range(c,x,y,t.range,t.color);c.globalAlpha=.65;animatedSprite(c,{kind:t.id,x,y,level:1},game.time,ui.reducedMotion);c.globalAlpha=1;}
  const entities=[...game.towers.map(t=>({...t,entity:'tower'})),...game.enemies.map(e=>({...e,entity:'enemy'}))].sort((a,b)=>a.y-b.y);
  for(const e of entities){if(e.entity==='tower'){
      const spec=towerStats(e);ellipse(c,e.x,e.y+2,21,10,ui.selectedTower===e.id?'#eadc99':'#6f955d');ellipse(c,e.x,e.y-1,20,9,'#c6d6a0');
      const evolution=game.effects.find(effect=>effect.type==='evolve'&&effect.towerId===e.id),p=evolution?evolution.age/evolution.duration:1;
      if(evolution&&!ui.reducedMotion&&p<.42){animatedSprite(c,{...evolution.previousActor,flash:.1},game.time,false,1+p*.3);}
      else animatedSprite(c,e,game.time,ui.reducedMotion,evolution&&!ui.reducedMotion?Math.min(1,.8+(p-.42)*.7):1);
      if(e.shiny)star(c,e.x+20,e.y-30,4,'#fff1a3',ui.reducedMotion?0:game.time);
      drawAttackCharge(c,e,muzzlePosition(e),ui.reducedMotion);
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
      if(e.boss){c.font='bold 8px monospace';c.textAlign='center';c.fillStyle='#5d4c45';c.fillText('BOSS',e.x,barY-6);}
      if(e.visitor){c.strokeStyle=e.legendary?'#fff1b2':'#e6c9f4';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,23,10,0,0,Math.PI*2);c.stroke();c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#4d365e';c.fillText(e.shiny?'★ SHINY':e.legendary?'LEGENDARY':'RARE',e.x,barY-9);star(c,e.x+23,e.y-23,5,e.shiny?'#fff1a3':'#e6c9f4',ui.reducedMotion?0:game.time);}
    }}
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
  drawAttackCharge(c,actor,muzzlePosition(actor),reducedMotion);
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
