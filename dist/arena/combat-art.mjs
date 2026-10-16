import { muzzlePosition } from './sprite-animation.mjs';
import {drawMoveShot,drawMoveEffect} from './move-art.mjs';
const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function line(g,points,color,width){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();}
function shape(g,points,color){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();}
function oval(g,x,y,rx,ry,color,stroke,width=1){g.beginPath();g.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(color){g.fillStyle=color;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
const noise=(n)=>Math.sin(n*12.9898+78.233)*.5+Math.sin(n*4.812)*.5;
function bolt(g,x1,y1,x2,y2,time,width=3,color='#ffe571',seed=0) {
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,points=[[x1,y1]],phase=Math.floor(time*25);
  for(let i=1;i<9;i++){const offset=noise(i*5+phase+seed)*Math.min(22,len*.12);points.push([x1+dx*i/9-dy/len*offset,y1+dy*i/9+dx/len*offset]);}points.push([x2,y2]);
  g.save();g.globalAlpha*=.2;line(g,points,color,width*5);g.restore();line(g,points,color,width*2);line(g,points,'#ffffe8',width*.55);
}
let fireAtlas;
function fireTexture() {
  if(fireAtlas)return fireAtlas;
  fireAtlas=document.createElement('canvas');fireAtlas.width=96*8;fireAtlas.height=96;
  const c=fireAtlas.getContext('2d');
  for(let frame=0;frame<8;frame++){
    c.save();c.translate(frame*96+48,48);
    const halo=c.createRadialGradient(0,0,5,0,0,46);halo.addColorStop(0,'#ffcd6388');halo.addColorStop(.5,'#fb6d3644');halo.addColorStop(1,'#ef482600');c.fillStyle=halo;c.fillRect(-48,-48,96,96);
    for(let layer=0;layer<4;layer++){
      const radius=31-layer*6,pts=[];
      for(let i=0;i<36;i++){const a=i*TAU/36,r=radius*(.87+.14*Math.sin(a*5+frame*.8)+.12*Math.sin(a*9-frame));pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
      shape(c,pts,['#a82d1e','#ef5824','#ffac39','#ffe399'][layer]);
    }
    for(let i=0;i<9;i++){
      const a=i*2.4+frame*.3,r=9+i*2.1;
      c.beginPath();c.arc(Math.cos(a)*r*.4,Math.sin(a)*r*.4,r,a,a+2.2);c.strokeStyle=i%2?'#ffe687aa':'#ad351a88';c.lineWidth=2;c.stroke();
    }
    c.restore();
  }
  return fireAtlas;
}
function fireWisp(g,x,y,size,time,seed=0) {
  const frame=((Math.floor(time*14+seed)%8)+8)%8;
  g.drawImage(fireTexture(),frame*96,0,96,96,x-size,y-size,size*2,size*2);
}
function flame(g,length,width,time,alpha=1) {
  g.save();g.globalAlpha*=alpha;
  for(let layer=0;layer<3;layer++){
    const pts=[];
    for(let j=0;j<=30;j++){const t=j/30;pts.push([t*length*.9,Math.sin(t*18-time*24+layer)*width*t*.18]);}
    g.save();g.globalAlpha*=.5;line(g,pts,['#ff5a22','#ffb34c','#fff0b0'][layer],Math.max(2,width*(.38-layer*.1)));g.restore();
  }
  // Rolling, overlapping tongues travel from the mouth to the edge of the cone.
  for(let i=0;i<32;i++){
    const t=(i/32+time*2.1)%1,spread=width*t,side=noise(i*17)*spread*.5;
    g.save();g.translate(length*t,side);g.rotate(noise(i)*1.2+time*.4);g.globalAlpha*=Math.min(1,(1-t)*4);
    g.scale(1.4,.9);fireWisp(g,0,0,8+spread*.9,time,i);g.restore();
  }
  g.restore();
}
export function animationFrame(meta,time) {
  if(!meta)return 0;
  let t=((time%meta.duration)+meta.duration)%meta.duration;
  for(let i=0;i<meta.durations.length;i++){if(t<meta.durations[i])return i;t-=meta.durations[i];}return 0;
}
export function attackPose(f) {
  let recoil=0,sx=1,sy=1,tilt=clamp(f.vx/220,-1,1)*.045,offsetY=0;
  if(f.cast){const c=f.cast;
    if(c.age<c.windup){const q=Math.sin(clamp(c.age/c.windup,0,1)*Math.PI/2);recoil=-q*(c.index===2?12:6);sx=1-q*.07;sy=1+q*.045;tilt-=q*.1*f.facing;}
    else{const t=(c.age-c.windup)/(c.duration-c.windup),kick=Math.sin(Math.min(1,t*3)*Math.PI)*Math.exp(-t*3);recoil=kick*(c.index===2?19:11);sx=1+kick*.12;sy=1-kick*.09;tilt+=kick*.12*f.facing;if(c.channel){recoil-=3;offsetY=Math.sin(c.age*45)*1.4;}}
  }
  if(f.dashTime>0){sx*=1.14;sy*=.88;tilt+=f.facing*.08;}
  return {recoil,sx,sy,tilt,offsetY};
}
export function drawCharge(g,f,color,time) {
  const c=f.cast;if(!c||c.age>=c.windup)return;
  const q=c.age/c.windup,origin=muzzlePosition(f),px=origin.x,py=origin.y;
  g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<(c.index===2?12:6);i++) {
    const a=i*TAU/12+time*4,r=(1-q)*38+6;
    line(g,[[px+Math.cos(a)*r,py+Math.sin(a)*r],[px+Math.cos(a)*(r+8),py+Math.sin(a)*(r+8)]],color,2);
  }
  oval(g,px,py,4+q*9,4+q*9,color);g.restore();
  if(c.ground){
    const radius=c.targetRadius??125;
    g.save();g.setLineDash([8,5]);g.globalAlpha=.25+q*.55;oval(g,c.target.x,c.target.y,radius,radius,null,color,2);g.restore();
  }
}
function elementalShard(g,element,color,core,time,size=1) {
  g.save();g.scale(size,size);
  if(element==='grass'){
    g.rotate(time*5);shape(g,[[-18,0],[-6,-10],[15,-3],[22,0],[6,10],[-10,7]],color);line(g,[[-17,0],[19,0]],core,1.5);
  }else if(element==='ice'||element==='steel'){
    g.rotate(time*2);shape(g,[[-18,0],[-4,-9],[21,0],[-4,9]],color);shape(g,[[-4,-9],[21,0],[-2,0]],core);line(g,[[-19,0],[21,0]],'#ffffff',1);
  }else if(element==='ground'||element==='rock'){
    g.rotate(time*3);shape(g,[[-15,-5],[-5,-15],[12,-10],[18,5],[4,14],[-13,10]],'#594d41');shape(g,[[-13,-5],[-4,-13],[11,-8],[3,2]],core);shape(g,[[3,2],[11,-8],[16,5],[3,12],[-12,8]],color);
  }else if(element==='poison'){
    for(let i=0;i<4;i++)oval(g,Math.cos(i*2+time*3)*7,Math.sin(i*2+time*3)*7,9,7,color);oval(g,2,-4,5,3,core);
  }else if(element==='bug'){
    shape(g,[[-26,-4],[19,0],[-26,4],[-16,0]],color);line(g,[[-20,0],[19,0]],core,2);
  }else if(element==='fairy'||element==='normal'){
    g.rotate(time*4);const points=[];for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?7:20;points.push([Math.cos(a)*r,Math.sin(a)*r]);}shape(g,points,color);oval(g,0,0,4,4,core);
  }else if(element==='flying'||element==='fighting'){
    for(let i=0;i<3;i++){g.beginPath();g.ellipse(-i*7,0,18+i*6,11+i*5,0,-1.1,1.1);g.strokeStyle=i%2?core:color;g.lineWidth=4-i;g.stroke();}
  }else{
    for(let i=0;i<3;i++){g.rotate(TAU/3);g.beginPath();g.ellipse(0,0,20,8,Math.sin(time*4),0,TAU);g.strokeStyle=i%2?core:color;g.lineWidth=2;g.stroke();}oval(g,0,0,5,5,core);
  }
  g.restore();
}
export function drawShot(g,s,time) {
  if(drawMoveShot(g,s,time))return;
  g.save();g.translate(s.x,s.y);g.rotate(Math.atan2(s.vy,s.vx));
  if(s.kind==='ember') {
    g.rotate(Math.PI);flame(g,47,11,time, .9);g.rotate(Math.PI);oval(g,0,0,7,5,'#fff5bb');
    for(let i=0;i<5;i++){const t=(s.age*6+i*.2)%1;g.globalAlpha=1-t;g.fillStyle=i%2?'#ffda79':'#f97839';g.fillRect(-18-t*62,Math.sin(i*8+s.age*20)*t*15,3,3);}
  } else if(s.kind==='jet'||s.kind==='cannon') {
    const heavy=s.kind==='cannon',length=heavy?115:52,w=heavy?21:6;
    shape(g,[[-length,-w*.5],[-15,-w],[12,0],[-15,w],[-length,w*.5]],'#2f96c3');
    for(let i=0;i<4;i++){const points=[];for(let j=0;j<10;j++)points.push([-length+j*(length+10)/9,(i-1.5)*w*.42+Math.sin(j*.7-time*35+i)*w*.15]);line(g,points,i%2?'#b5f3ff':'#65d8f1',heavy?6:2);}
    line(g,[[-length*.8,0],[10,0]],'#f0ffff',heavy?4:2);
    for(let i=0;i<6;i++){const t=(s.age*5+i/6)%1;oval(g,-length*t,Math.sin(i*13)*w*(1+t),2+(heavy?2:0),1.5,'#d3fbff');}
    if(heavy){g.globalAlpha=.7;for(let i=0;i<3;i++)oval(g,-i*31-(time*80)%31,0,7,w+6,null,'#cafaff',2);}
  } else if(s.kind==='spark') {
    bolt(g,-65,0,14,0,time,2.6,s.color,s.id);
    bolt(g,-35,0,-18,-18,time,1.2,s.color,s.id+3);bolt(g,-20,0,-5,17,time,1.2,s.color,s.id+8);
  } else if(s.kind==='electro') {
    oval(g,0,0,23,23,'#cf941c44');oval(g,0,0,15,15,'#fff0a2');
    for(let i=0;i<7;i++){const a=i*TAU/7+time*3;bolt(g,Math.cos(a)*8,Math.sin(a)*8,Math.cos(a)*34,Math.sin(a)*34,time,1.4,s.color,i*4);}
  } else if(s.kind==='shadow') {
    for(let i=6;i>=0;i--){const t=i/6;g.globalAlpha=(1-t)*.6;oval(g,-t*70,Math.sin(t*12-time*10)*10,14*(1-t)+4,11*(1-t)+4,'#9c6aec');}
    g.globalAlpha=1;oval(g,0,0,13,11,'#241c4c','#a883f2',2);g.rotate(-time*4);
    for(let i=0;i<3;i++){g.rotate(TAU/3);g.beginPath();g.arc(0,0,17+i,0,1.9);g.strokeStyle='#d7b8ff';g.lineWidth=2;g.stroke();}
  } else if(s.kind==='fireblast') {
    // Fire Blast's five-armed flame sigil, with a hot core and burning edges.
    g.rotate(-Math.atan2(s.vy,s.vx));
    const branches=[[[0,-38],[0,-5],[-28,35]],[[0,-5],[31,35]],[[-36,-15],[36,-15]]];
    for(const branch of branches){line(g,branch,'#df4328',18);line(g,branch,'#ff942f',11);line(g,branch,'#ffe58d',4);}
    for(let i=0;i<12;i++){const a=i*TAU/12+time*1.4,r=36+Math.sin(i*9+time*25)*7;g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r);g.rotate(a);flame(g,14,5,time);g.restore();}
  }else{
    const scale=s.heavy?1.6:1;
    for(let i=4;i>0;i--){g.save();g.globalAlpha=(1-i/5)*.35;g.translate(-i*14,Math.sin(time*12+i)*4);elementalShard(g,s.element,s.color,s.core,time-i*.08,scale*(1-i*.13));g.restore();}
    elementalShard(g,s.element,s.color,s.core,time,scale);
    if(s.kind==='slash'||s.kind==='fist')for(let i=0;i<3;i++)line(g,[[-50,-12+i*12],[10,-8+i*8]],i%2?s.core:s.color,2);
  }
  g.restore();
}
export function drawBattleEffect(g,e,time) {
  if(drawMoveEffect(g,e,time))return;
  g.save();
  if(e.attached) {
    g.translate(e.x,e.y);g.rotate(e.angle);
    const length=e.displayRange??e.range*Math.min(1,e.age/.12),fade=clamp(e.life/.15,0,1);
    g.globalAlpha=fade;
    if(e.kind==='flamethrower') {
      flame(g,length,e.width,time,.95);
      for(let i=0;i<24;i++){const t=(time*1.8+i/24)%1,x=t*length,y=noise(i*12)*e.width*t;g.fillStyle=i%3?'#ffe391':'#ff702c';g.globalAlpha=(1-t)*fade;g.fillRect(x,y,3+3*t,3+3*t);}
    } else if(e.kind==='hydropump') {
      const grad=g.createLinearGradient(0,0,length,0);grad.addColorStop(0,'#d5ffff');grad.addColorStop(.3,'#62d7ee');grad.addColorStop(1,'#44b9e577');
      shape(g,[[0,-5],[length,-e.width],[length+8,0],[length,e.width],[0,5]],grad);
      for(let i=0;i<6;i++){const pts=[];for(let j=0;j<=25;j++){const t=j/25;pts.push([t*length,(i-2.5)*5+Math.sin(t*35-time*40+i)*4]);}line(g,pts,i%2?'#efffff':'#a3efff',i%2?2:3);}
      for(let i=0;i<12;i++){
        const t=(time*2.4+i/12)%1,x=t*length,w=8+e.width*t;
        g.globalAlpha=fade*(1-t*.55);oval(g,x,Math.sin(time*15+i)*3,5,w,null,'#e0ffff',2);
        for(const side of [-1,1])line(g,[[x,side*w],[x-14,side*(w+8)]],'#a2eaff',2);
      }
      g.globalAlpha=fade;
      for(let i=0;i<10;i++){const t=(time*2+i/10)%1;oval(g,length+t*32,noise(i)*45*t,2+t*3,2,'#d6fbff');}
    }else{
      g.save();g.globalAlpha*=.22;line(g,[[0,0],[length,0]],e.color,e.width*2);g.restore();
      line(g,[[0,0],[length,0]],e.color,15);line(g,[[0,0],[length,0]],e.core,5);
      for(let i=0;i<4;i++){
        const points=[];for(let j=0;j<=28;j++){const t=j/28;points.push([t*length,Math.sin(t*24-time*18+i*Math.PI/2)*(6+8*t)]);}
        line(g,points,i%2?e.color:e.core,2);
      }
      for(let i=0;i<9;i++){const t=(time*1.8+i/9)%1;g.save();g.translate(length*t,Math.sin(i*5+time*8)*e.width*.6);g.globalAlpha*=Math.sin(t*Math.PI);elementalShard(g,e.element,e.color,e.core,time+i,.4);g.restore();}
    }
  } else if(e.kind==='pulse') {
    g.globalAlpha=Math.min(1,e.life/.2);oval(g,e.x,e.y,e.radius,e.radius,null,e.color+'44',20);oval(g,e.x,e.y,e.radius,e.radius,null,e.color,5);oval(g,e.x,e.y,Math.max(0,e.radius-14),Math.max(0,e.radius-14),null,e.core,1);
    for(let i=0;i<18;i++){const a=i*TAU/18+time*.7;line(g,[[e.x+Math.cos(a)*(e.radius-18),e.y+Math.sin(a)*(e.radius-18)],[e.x+Math.cos(a)*e.radius,e.y+Math.sin(a)*e.radius]],e.color,3);}
  } else if(e.kind==='thunder') {
    g.globalAlpha=Math.min(1,e.life*3);
    for(let i=0;i<3;i++)bolt(g,e.x+(i-1)*58,e.y-280,e.x+(i-1)*18,e.y,time,5-i,'#ffe665',i*13);
    oval(g,e.x,e.y,e.radius*(.5+e.age),e.radius*(.5+e.age)*.65,null,'#ffe994',4);
    for(let i=0;i<9;i++){const a=i*TAU/9;bolt(g,e.x,e.y,e.x+Math.cos(a)*e.radius,e.y+Math.sin(a)*e.radius*.6,time,1.8,'#fff09b',i);}
  } else if(e.kind==='storm') {
    g.globalAlpha=Math.min(1,e.life/.3);oval(g,e.x,e.y,e.radius,e.radius*.65,e.color+'22');
    for(let i=0;i<12;i++){
      const pts=[];
      for(let j=0;j<=24;j++){
        const t=j/24,a=i*TAU/12-time*3+t*3.3,r=e.radius*(1-t*.88);
        pts.push([e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.65-32*t]);
      }
      g.save();g.globalAlpha*=.25;line(g,pts,e.color,12);g.globalAlpha*=2;line(g,pts,i%2?e.color:e.core,3);g.restore();
      const t=(time*.7+i/12)%1,a=i*TAU/12-time*3+t*3.3,r=e.radius*(1-t*.8);
      g.save();g.globalAlpha*=Math.sin(t*Math.PI)*.8;g.translate(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.65-45*t);elementalShard(g,e.element,e.color,e.core,time+i,.8);g.restore();
    }
    oval(g,e.x,e.y,e.radius,e.radius*.65,null,e.color,2);
  }
  g.restore();
}

export function drawImpact(g,e,time,arena) {
  const t=e.age/e.duration,fade=(1-t),power=e.heavy?1.65:1,extent=(12+t*70)*power;
  g.save();g.translate(e.x,e.y);g.globalAlpha=fade;
  // A directional burst links the incoming attack to the defender's reaction.
  for(let i=0;i<10;i++){
    const a=i*TAU/10+noise(i)*.25,r=extent*(.6+.4*Math.abs(noise(i)));
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(e.element==='water'){
      line(g,[[x*.45,y*.45],[x,y-t*t*25]],i%2?'#e9ffff':'#75d5f7',Math.max(1,(1-t)*5));
      oval(g,x,y-t*t*25,2+fade*3,1+fade*2,'#e7ffff');
    }else if(e.element==='electric'){
      bolt(g,x*.35,y*.35,x,y,time,fade*2,'#ffe974',i+e.x);
    }else if(e.element==='ghost'){
      const a2=a+time*3;oval(g,Math.cos(a2)*r,Math.sin(a2)*r*.7,3+fade*13,3+fade*10,i%2?'#7b46ae':'#c193ef');
    }else if(e.element==='fire'){
      fireWisp(g,x*.65,y*.65-25*t,fade*(12+power*8),time,i);
      line(g,[[x*.8,y*.8],[x*1.25,y*1.25]],'#ffdc8c',2);
    }else{
      g.save();g.translate(x*.8,y*.8);elementalShard(g,e.element,e.color||'#dae9ff','#ffffff',time+i,fade*.5*power);g.restore();
      line(g,[[x*.5,y*.5],[x,y]],e.color||'#dae9ff',2);
    }
  }
  if(t<.18){g.globalAlpha=(1-t/.18)*.8;const r=(12+t*90)*power;shape(g,[[0,-r],[5,-5],[r,0],[5,5],[0,r],[-5,5],[-r,0],[-5,-5]],'#fff9de');}
  g.globalAlpha=fade*.7;
  oval(g,0,18,extent,extent*.35,null,arena==='water'?'#d4faff':e.color,2);
  if(e.element==='fire'&&t>.25){
    g.globalAlpha=fade*.26;
    for(let i=0;i<5;i++)oval(g,noise(i)*extent*.4,-t*80+i*5,(10+t*14)*power,(8+t*12)*power,'#b9bbc2');
  }
  g.restore();
}

let steamTexture;
function steamCloud(){
  if(steamTexture)return steamTexture;
  steamTexture=document.createElement('canvas');steamTexture.width=steamTexture.height=128;
  const c=steamTexture.getContext('2d');
  for(let i=0;i<7;i++){
    const a=i*TAU/7,x=64+Math.cos(a)*21,y=64+Math.sin(a)*16;
    const gradient=c.createRadialGradient(x-5,y-6,4,x,y,33);
    gradient.addColorStop(0,'#f5ffffd9');gradient.addColorStop(.5,'#dfedf3a8');gradient.addColorStop(1,'#b1d6e000');
    c.fillStyle=gradient;c.fillRect(x-34,y-34,68,68);
  }
  return steamTexture;
}
export function drawClash(g,e,time) {
  const progress=e.sustained?0:clamp(e.age/e.duration,0,1),fade=e.sustained?1:1-progress;
  const power=e.sustained||e.heavy?1.25:.85;
  g.save();g.translate(e.x,e.y);
  // Each side throws off its own element around the shared impact core.
  for(let i=0;i<20;i++){
    const phase=e.sustained?(e.age*2+i/20)%1:progress;
    const angle=i*TAU/20+noise(i)*.3,r=(8+phase*63)*power;
    const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.8;
    g.globalAlpha=fade*(1-phase);
    line(g,[[x*.55,y*.55],[x,y]],e.colors[i%2]||'#d5f6ff',i%3?2:3);
    oval(g,x,y,2.5,1.5,i%2?'#b7f4ff':'#ffdb8c');
  }
  g.globalAlpha=fade*.65;
  const ring=(e.sustained?(e.age*1.8)%1:progress)*70*power;
  oval(g,0,7,ring+8,ring*.5+4,null,'#e9ffff',2);
  if(e.steam){
    for(let i=0;i<13;i++){
      const t=e.sustained?(e.age*.85+i/13)%1:clamp(progress*1.3-i*.018,0,1);
      const x=noise(i*3)*t*54*power,y=-t*105*power+noise(i+6)*12,size=(17+t*33)*power;
      g.globalAlpha=Math.sin(t*Math.PI)*fade*.48;
      g.drawImage(steamCloud(),x-size,y-size,size*2,size*2);
    }
  }else if(e.elements.includes('electric')){
    g.globalAlpha=fade;for(let i=0;i<4;i++){const a=i*TAU/4+time;bolt(g,0,0,Math.cos(a)*42,Math.sin(a)*42,time,1.4,e.colors[i%2],i);}
  }
  g.globalAlpha=fade*(e.sustained?.75+.15*Math.sin(time*24):Math.max(0,1-progress*2));
  g.globalCompositeOperation='lighter';
  const r=(12+Math.sin(time*23)*3)*power;
  oval(g,0,0,r*2,r*1.7,e.steam?'#b5eaff44':'#d7beff44');
  shape(g,[[0,-r*1.7],[r*.3,-r*.3],[r*1.5,0],[r*.3,r*.3],[0,r*1.6],[-r*.3,r*.3],[-r*1.5,0],[-r*.3,-r*.3]],'#fffbe4');
  g.restore();
}
