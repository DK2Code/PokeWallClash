// Move-specific silhouettes and motion, shared by player and CPU attacks.
const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function path(g,points,color,width=2){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();}
function polygon(g,points,color){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();}
function oval(g,x,y,rx,ry,color,stroke,width=2){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(color){g.fillStyle=color;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function arc(g,x,y,r,start,end,color,width){g.beginPath();g.arc(x,y,Math.max(.1,r),start,end);g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function lightning(g,x,y,time,color,width=2){const points=[[0,0]];for(let i=1;i<8;i++)points.push([x*i/8+Math.sin(i*13+Math.floor(time*24))*9,y*i/8+Math.cos(i*9+Math.floor(time*24))*9]);points.push([x,y]);path(g,points,color,width+2);path(g,points,'#fffbe2',width*.5);}
function star(g,x,y,r,color,time=0){const points=[];for(let i=0;i<10;i++){const a=i*Math.PI/5+time,n=i%2?r*.4:r;points.push([x+Math.cos(a)*n,y+Math.sin(a)*n]);}polygon(g,points,color);}
function leaf(g,x,y,size,color,time){g.save();g.translate(x,y);g.rotate(time);polygon(g,[[-size,0],[-size*.3,-size*.5],[size,0],[size*.2,size*.5]],color);path(g,[[-size,0],[size,0]],'#f4ffd3',1);g.restore();}
function rock(g,x,y,size,color,rotation=0){g.save();g.translate(x,y);g.rotate(rotation);polygon(g,[[-size,-size*.2],[-size*.5,-size],[size*.6,-size*.7],[size,size*.3],[0,size],[-size*.8,size*.5]],'#55483f');polygon(g,[[-size*.9,-size*.2],[-size*.45,-size*.85],[size*.5,-size*.6],[0,0]],'#f2e4b8');polygon(g,[[0,0],[size*.5,-size*.6],[size*.9,size*.3],[0,size*.8]],color);g.restore();}
function bone(g,time,size=1){g.save();g.rotate(time);g.scale(size,size);path(g,[[-15,0],[15,0]],'#5a4545',10);path(g,[[-15,0],[15,0]],'#fff1d1',6);for(const x of [-17,17])for(const y of [-4,4])oval(g,x,y,5,5,'#fff4df');g.restore();}
function heart(g,x,y,size,color){g.save();g.translate(x,y);g.scale(size,size);g.beginPath();g.moveTo(0,6);g.bezierCurveTo(-18,-4,-7,-16,0,-7);g.bezierCurveTo(7,-16,18,-4,0,6);g.fillStyle=color;g.fill();g.restore();}
function fist(g,color,core){polygon(g,[[-15,-9],[-9,-18],[3,-18],[7,-13],[14,-13],[19,-6],[17,13],[-2,18],[-17,7]],'#322d40');polygon(g,[[-12,-8],[-7,-14],[2,-14],[6,-9],[13,-9],[15,-3],[12,10],[-2,13],[-13,5]],color);for(let i=0;i<3;i++)path(g,[[-5+i*6,-11],[-3+i*6,0]],core,2);}
function crystal(g,x,y,r,color){polygon(g,[[x-r,y],[x,y-r*.5],[x+r,y],[x,y+r*.5]],color);path(g,[[x-r,y],[x+r,y]],'#ffffff',1);}
const legacyShots=new Set(['ember','jet','cannon','spark','electro','shadow','fireblast']);
export function drawMoveShot(g,s,time){
  const v=s.move?.visual;if(!v||legacyShots.has(v))return false;
  const color=s.color,core=s.core,size=s.radius||16;
  g.save();g.translate(s.x,s.y);g.rotate(Math.atan2(s.vy,s.vx));
  g.save();g.globalAlpha=.28;path(g,[[-55,0],[0,0]],color,Math.max(2,size*.45));g.restore();
  if(v==='needle'){
    polygon(g,[[-26,-4],[23,0],[-26,4],[-17,0]],color);path(g,[[-23,0],[21,0]],core,1.5);
  }else if(v==='leaf')leaf(g,0,0,16,color,time*12);
  else if(v==='bubbles'){
    for(let i=0;i<3;i++){const x=-i*12,y=Math.sin(time*9+i)*7;oval(g,x,y,size-i*2,size-i*2,'#64cae633','#b9f6ff',1.5);oval(g,x-3,y-3,2,2,'#fff');}
  }else if(v==='seed'){
    oval(g,0,0,size,size*.75,'#624536','#bc9a54',2);path(g,[[-size*.5,-size*.5],[size*.5,size*.5]],'#ddc875',2);leaf(g,0,-size*.6,9,'#a5d769',time*4);
  }else if(['zap-orb','aura-orb','hidden-orbs'].includes(v)){
    oval(g,0,0,size,size,color+'55');oval(g,0,0,size*.6,size*.6,core);
    for(let i=0;i<5;i++){const a=i*TAU/5+time*7;g.save();g.rotate(a);if(v==='zap-orb')lightning(g,size*1.5,0,time,color,2);else arc(g,0,0,size*(.7+i*.12),0,2.1,color,2);g.restore();}
  }else if(v==='water-ring'){
    for(let i=0;i<3;i++)oval(g,-i*10,0,7+i*2,size+i*2,null,i%2?core:color,3);for(let i=0;i<8;i++){const a=i*TAU/8+time*8;oval(g,Math.cos(a)*6,Math.sin(a)*size,3,2,core);}
  }else if(v==='gust'){
    for(let i=0;i<5;i++){const t=i/5;oval(g,-i*8,Math.sin(time*6+i)*3,9+i*2,size*(1-t*.7),null,i%2?core:color,2);}
  }else if(v==='crescent'){
    for(let i=0;i<3;i++)arc(g,-i*6,0,size+i*2,-1.15,1.15,i%2?core:color,5-i);
  }else if(v==='dragon'){
    const points=[];for(let i=0;i<16;i++)points.push([-i*5,Math.sin(i*.5-time*15)*i]);path(g,points,color,13);path(g,points,core,4);polygon(g,[[20,0],[0,-13],[-8,-7],[-8,7],[0,13]],color);oval(g,3,-5,2,2,core);
  }else if(v==='psi-rings'||v==='confuse-ray'||v==='hypnosis'){
    for(let i=0;i<4;i++){const r=6+i*6;oval(g,-i*6,0,r*.45,r,null,v==='hypnosis'?'#ff7779':i%2?core:color,2);}
    if(v==='confuse-ray')star(g,12,0,13,'#ffe893',time*6);
  }else if(v==='moon'){
    oval(g,0,0,size,size,'#ffebed');oval(g,-size*.3,-size*.15,size*.8,size*.8,color);for(let i=0;i<4;i++)star(g,-18-i*9,Math.sin(i*7+time*8)*17,4,core,time);
  }else if(v==='icicle'){
    crystal(g,0,0,23,color);crystal(g,-18,7,10,core);crystal(g,-14,-9,8,color);
  }else if(v==='rock')rock(g,0,0,size,color,time*5);
  else if(v==='gems'){
    for(let i=0;i<3;i++){const a=i*TAU/3+time*4;crystal(g,Math.cos(a)*12,Math.sin(a)*12,13,i%2?color:core);}
  }else if(v==='sludge'||v==='toxic'){
    for(let i=0;i<5;i++){const a=i*TAU/5+time*2;oval(g,Math.cos(a)*size*.4,Math.sin(a)*size*.4,size*.7,size*.6,i%2?color:'#713284');}oval(g,3,-5,size*.3,size*.2,core);for(let i=0;i<3;i++)oval(g,-15-i*10,Math.sin(time*8+i)*15,4,3,color);
  }else if(v==='sand'){
    for(let i=0;i<18;i++){g.fillStyle=i%2?color:core;g.fillRect(-Math.abs(Math.sin(i*13))*37,Math.cos(i*4+time*12)*18,3+i%3,2+i%3);}
  }else if(v==='coin'){
    oval(g,0,0,Math.abs(Math.sin(time*15))*8+2,12,'#ffe086','#8b5e29',2);path(g,[[0,-6],[0,6]],'#a97c37',2);
  }else if(v==='stars')star(g,0,0,14,'#ffed9b',time*7);
  else if(v==='egg'){
    g.rotate(time*6);oval(g,0,0,size*.75,size,'#f9f1d4','#ac9e7f',2);for(let i=0;i<3;i++)oval(g,Math.sin(i*7)*size*.4,(i-1)*size*.45,3,4,'#baa15c');
  }else if(v==='boomerang')bone(g,time*16,1.1);
  else if(v==='magnet'){
    oval(g,0,0,size,size,'#a5b6c3','#f6fcff',2);g.fillStyle='#e75b62';g.fillRect(6,-12,12,8);g.fillStyle='#7fb2fd';g.fillRect(6,5,12,8);arc(g,3,0,12,Math.PI/2,Math.PI*1.5,core,6);
  }else if(v==='triad'){
    const points=Array.from({length:3},(_,i)=>[Math.cos(i*TAU/3+time*3)*size,Math.sin(i*TAU/3+time*3)*size]);path(g,[...points,points[0]],'#fcf9dd',2);points.forEach(([x,y],i)=>{oval(g,x,y,8,8,['#ff8756','#9ceaff','#ffe676'][i]);if(i===2){g.save();g.translate(x,y);lightning(g,10,5,time,'#ffe676',1);g.restore();}});
  }else if(v==='sonic'){
    for(let i=0;i<3;i++)arc(g,-i*10,0,17+i*4,-1.3,1.3,i%2?color:core,2);
  }else if(v==='wisps'){
    for(let i=0;i<3;i++){const a=i*TAU/3+time*3,x=Math.cos(a)*13,y=Math.sin(a)*13;polygon(g,[[x,y-18],[x+8,y+4],[x,y+10],[x-8,y+4]],'#7d9fff');oval(g,x,y+2,4,6,'#deeaff');}
  }else if(v==='heart')heart(g,0,0,1.6,'#ffb6de');
  else if(v==='thunder-wave'){
    for(let i=0;i<4;i++){g.save();g.translate(-i*5,-18);lightning(g,0,36,time+i,color,1.2);g.restore();}
  }else if(v==='silk'){
    const points=[];for(let i=0;i<32;i++)points.push([-i*2.5,Math.sin(i*.8-time*20)*(4+i*.15)]);path(g,points,'#e8f6db',2);
    for(let i=0;i<3;i++)oval(g,0,0,6+i*4,6+i*4,null,'#d7e4d4',1);
  }
  g.restore();return true;
}
function contact(g,e,time){
  const m=e.move,t=clamp(e.age/e.duration,0,1),phase=(t*m.count)%1,swing=Math.sin(phase*Math.PI),reach=e.mode==='dash'?65:Math.min(m.range,Math.hypot((e.target?.x??e.x)-e.x,(e.target?.y??e.y)-e.y)),color=e.color,core=e.core;
  g.translate(e.x,e.y);g.rotate(e.angle);g.globalAlpha*=Math.min(1,(1-t)*5);
  const x=Math.max(25,reach*(.55+.3*swing));
  if(['claws','blade','cross','chop','wings'].includes(m.visual)){
    const count=m.visual==='claws'?3:m.visual==='cross'?2:1;
    for(let i=0;i<count;i++){g.save();g.translate(x,(i-(count-1)/2)*12);g.rotate(m.visual==='cross'?(i?-.7:.7):-.55+t*1.2);path(g,[[-24,-25],[0,0],[25,24]],color,7);path(g,[[-24,-25],[0,0],[25,24]],core,2);g.restore();}
    if(m.visual==='wings')for(const side of [-1,1])polygon(g,[[x,0],[x-35,side*28],[x-12,side*34],[x+22,side*15]],color+'aa');
  }else if(['fist','combo','slap','jab'].includes(m.visual)){
    const count=m.visual==='combo'?3:1;
    for(let i=0;i<count;i++){g.save();g.translate(x+Math.sin(time*25+i)*8,(i-(count-1)/2)*20);g.rotate((i-1)*.2);fist(g,color,core);g.restore();}
    for(let i=0;i<4;i++)path(g,[[x-50,-15+i*10],[x-22,-12+i*8]],color,2);
    if(m.slug==='fire-punch')for(let i=0;i<7;i++){const a=i*TAU/7+time*7;polygon(g,[[x+Math.cos(a)*14,Math.sin(a)*14],[x+Math.cos(a+.3)*34,Math.sin(a+.3)*34],[x+Math.cos(a+.5)*18,Math.sin(a+.5)*18]],i%2?'#ffd879':'#ff813d');}
    if(m.slug==='ice-punch')for(let i=0;i<7;i++){const a=i*TAU/7+time*3;crystal(g,x+Math.cos(a)*27,Math.sin(a)*27,9,'#c5fbff');}
    if(m.slug==='thunder-punch')for(let i=0;i<4;i++){g.save();g.translate(x,0);g.rotate(i*TAU/4);lightning(g,40,0,time+i,'#ffe57b',1.5);g.restore();}
  }else if(m.visual==='kick'){
    g.save();g.translate(x,0);g.rotate(-.8+t*1.6);polygon(g,[[-40,-7],[-5,-7],[5,-20],[19,-20],[16,10],[-40,7]],color);path(g,[[-35,-3],[0,-3],[10,-13]],core,3);g.restore();
  }else if(m.visual==='fangs'){
    for(const side of [-1,1]){const y=side*(25*(1-swing)+8);path(g,[[x-30,y],[x+25,y]],color,4);for(let i=0;i<4;i++)polygon(g,[[x-28+i*16,y],[x-17+i*16,y],[x-22+i*16,y-side*14]],core);}
  }else if(m.visual==='horn'){
    const drill=m.slug.includes('drill'),size=m.slug==='megahorn'?48:28;polygon(g,[[x+size,0],[x-size,-15],[x-size,15]],color);path(g,[[x-size,-8],[x+size,0]],core,3);if(drill)for(let i=0;i<4;i++)path(g,[[x-20+i*10,-12],[x-12+i*10,12]],core,2);
  }else if(m.visual==='tail'){
    g.beginPath();g.moveTo(0,8);g.quadraticCurveTo(x*.4,-70*swing,x,0);g.strokeStyle=color;g.lineWidth=13;g.stroke();g.strokeStyle=core;g.lineWidth=3;g.stroke();
  }else if(m.visual==='vine'){
    for(const side of [-1,1]){g.beginPath();g.moveTo(0,side*9);g.bezierCurveTo(reach*.3,side*(50*swing),reach*.8,-side*25,reach*swing,0);g.strokeStyle='#416f37';g.lineWidth=8;g.stroke();g.strokeStyle=color;g.lineWidth=4;g.stroke();leaf(g,reach*swing*.7,side*10,10,'#b2e676',side*time);}
  }else if(m.visual==='coil'){
    for(let i=0;i<4;i++)oval(g,reach,(i-1.5)*10,25+Math.sin(time*10+i)*4,7,null,color,4);path(g,[[0,0],[reach-25,0]],color,3);
  }else if(m.visual==='tongue'){
    path(g,[[0,0],[x*.5,Math.sin(time*10)*12],[x,0]],'#e276a7',13);oval(g,x,0,13,7,'#ffb3c7');path(g,[[x-12,0],[x+8,0]],'#b55b8c',1);
  }else if(m.visual==='pincer'){
    for(const side of [-1,1]){g.save();g.translate(x,0);g.rotate(side*(.6-swing*.5));polygon(g,[[-20,side*6],[12,side*30],[35,side*12],[8,side*15],[0,0]],color);g.restore();}
  }else if(m.visual==='bone'){g.save();g.translate(x,0);bone(g,-1+t*3,1.4);g.restore();}
  else if(m.visual==='throw'){
    arc(g,x,10,35,-Math.PI,Math.PI*t,color,5);path(g,[[x-15,-55*swing],[x,-70*swing],[x+15,-55*swing]],core,3);
  }else{
    // Rush trails follow the actor's real movement and hit at contact.
    for(let i=0;i<7;i++){const y=(i-3)*8;path(g,[[-70-i*7,y],[25,y*.4]],i%2?color:core,2);}
    if(m.visual.includes('water'))for(let i=0;i<4;i++)oval(g,-i*16,0,8,23,null,'#b6faff',2);
    else if(m.visual.includes('flame'))for(let i=0;i<8;i++)polygon(g,[[-10-i*7,-20+i%3*12],[-70-i*3,Math.sin(i*8+time*20)*25],[-20-i*7,20-i%3*9]],i%2?'#ff8e3e':'#ffe088');
    else if(m.visual.includes('electric'))lightning(g,-80,0,time,'#ffeb77',2);
    else if(m.visual==='drill')for(let i=0;i<5;i++)oval(g,-i*9,0,8,10+i*3,null,color,2);
    else if(m.visual==='bird-rush')polygon(g,[[30,0],[-25,-40],[-12,-5],[-45,0],[-12,5],[-25,40]],color+'88');
    else if(m.visual==='slam')oval(g,0,15,35+30*t,10+15*t,null,core,3);
  }
}
export function drawMoveEffect(g,e,time){
  if(!e.move)return false;
  if(e.attached&&['flamethrower','hydropump'].includes(e.kind))return false;
  const m=e.move,v=m.visual,t=clamp(e.age/e.duration,0,1),color=e.color,core=e.core;
  g.save();g.globalAlpha=Math.min(1,e.life/.15);
  if(e.mode==='melee'||e.mode==='dash')contact(g,e,time);
  else if(e.attached){
    g.translate(e.x,e.y);g.rotate(e.angle);const length=e.displayRange??e.range,width=e.width;
    const rainbow=v==='spectrum-beam';
    for(let i=3;i>=0;i--){g.globalAlpha=Math.min(1,e.life/.15)*(i===3?.15:1);path(g,[[0,0],[length,0]],i===0?core:color,width*(.35+i*.5));}
    for(let i=0;i<6;i++){const x=((time*1.8+i/6)%1)*length;oval(g,x,0,6,width+4,null,rainbow?['#ffb0e2','#b1f7ff','#ffe8a6'][i%3]:core,2);}
    if(v==='ice-beam')for(let i=0;i<12;i++)crystal(g,((i/12+time*1.5)%1)*length,Math.sin(i*13+time*5)*width,9,core);
    if(v==='solar-beam')for(let i=0;i<10;i++){const x=((i/10+time*2)%1)*length;path(g,[[x-15,-width],[x+10,width]],'#f4ffc8',2);}
  }else if(e.mode==='wave'||e.mode==='burst'){
    const r=e.radius||m.radius*t;
    if(v==='surf'){
      for(let i=0;i<3;i++){oval(g,e.x,e.y,r-i*10,(r-i*10)*.72,null,i%2?'#e3ffff':'#5cbee5',12-i*3);}for(let i=0;i<36;i++){const a=i*TAU/36;oval(g,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.72,5,3,'#eaffff');}
    }else if(v==='quake'){
      oval(g,e.x,e.y,r,r*.7,null,'#e8c689',4);for(let i=0;i<18;i++){const a=i*TAU/18;path(g,[[e.x+Math.cos(a)*r*.6,e.y+Math.sin(a)*r*.6],[e.x+Math.cos(a+.05)*r*.85,e.y+Math.sin(a+.05)*r*.85],[e.x+Math.cos(a)*r,e.y+Math.sin(a)*r]],'#584431',5);}
    }else if(v==='spin'){
      for(let i=0;i<6;i++)arc(g,e.x,e.y,30+t*80+i*4,time*15+i,time*15+i+1.2,i%2?core:color,3);
    }else{
      for(let i=0;i<3;i++)oval(g,e.x,e.y,Math.max(1,r-i*12),Math.max(1,r-i*12),null,i%2?core:color,i===0?5:2);
      if(v==='sound')for(let i=0;i<12;i++){const a=i*TAU/12+time;const x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r;if(m.slug==='sing'){g.font='bold 22px serif';g.fillStyle=color;g.fillText(i%2?'♪':'♫',x,y);}else path(g,[[x-5,y-7],[x+5,y+7]],core,2);}
      if(v==='gleam')for(let i=0;i<16;i++){const a=i*TAU/16;star(g,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,12*(1-t),core,time);}
    }
  }else if(['ground','zone','sacrifice'].includes(e.mode)){
    const r=e.radius;g.translate(e.x,e.y);
    if(v==='thunder'){
      for(let i=0;i<(m.slug==='thunder'?5:3);i++){g.save();g.translate((i-1)*27,-230);lightning(g,-(i-1)*27,230,time+i,color,4);g.restore();}oval(g,0,0,r*t,r*t*.65,null,core,4);
    }else if(['stone-edge','rock-slide','earth-power','dig','roots'].includes(v)){
      oval(g,0,15,r,r*.45,null,color,3);
      for(let i=0;i<9;i++){const a=i*TAU/9,x=Math.cos(a)*r*.65,y=Math.sin(a)*r*.45,h=Math.sin(t*Math.PI)*(25+i%3*18);if(v==='roots'){path(g,[[x,y],[x-12,y-h*.5],[x+8,y-h]],'#4f823c',10);leaf(g,x+8,y-h,14,'#b9dc70',a);}else if(v==='stone-edge')polygon(g,[[x-13,y],[x,y-h-20],[x+14,y]],i%2?color:core);else rock(g,x,y-(v==='rock-slide'?(1-t)*140:h),12+i%3*6,color,a);}
    }else if(['psychic','psystrike','night-shade','dream'].includes(v)){
      for(let i=0;i<5;i++)oval(g,0,-i*9,r*(1-i*.14),r*(1-i*.14)*.35,null,i%2?core:color,3);
      if(v==='psystrike')for(let i=0;i<9;i++){const a=i*TAU/9+time*6;rock(g,Math.cos(a)*r*(1-t*.7),Math.sin(a)*r*.55-35,10,color,a);}
      else if(v==='night-shade'){oval(g,0,-35,30,36,'#251333aa');oval(g,-12,-41,8,4,'#f897de');oval(g,12,-41,8,4,'#f897de');}
      else if(v==='dream')for(let i=0;i<6;i++)star(g,Math.sin(i*11+time)*r*.7,-t*80+i*8,8,color,time);
    }else if(['tornado','leaf-storm','blizzard','petals'].includes(v)){
      for(let i=0;i<24;i++){const q=(time*.8+i/24)%1,a=i*2.4+time*7,rad=r*(1-q*.6),x=Math.cos(a)*rad,y=Math.sin(a)*rad*.55-q*80;
        g.save();g.globalAlpha*=Math.sin(q*Math.PI);
        if(v==='leaf-storm')leaf(g,x,y,12,color,a);
        else if(v==='blizzard'){crystal(g,x,y,9,core);path(g,[[x-15,y-8],[x+12,y+5]],color,1);}
        else if(v==='petals'){g.save();g.translate(x,y);g.rotate(a);oval(g,0,0,10,5,i%2?'#ffb9e0':'#ffedfb');g.restore();}
        else arc(g,0,-q*90,rad,a,a+1.4,core,3);
        g.restore();}
    }else if(v==='explosion'){
      for(let i=0;i<12;i++){const a=i*TAU/12,rad=r*t*.65;oval(g,Math.cos(a)*rad,Math.sin(a)*rad*.7,20+40*(1-t),20+35*(1-t),i%2?'#ffb24b':'#f36b3b');}oval(g,0,0,70*(1-t),60*(1-t),'#fff5cc');oval(g,0,0,r*t,r*t*.7,null,'#fff4bf',6);
    }
  }else if(e.mode==='cone'){
    g.translate(e.x,e.y);g.rotate(e.angle);
    for(let i=0;i<35;i++){const q=(i/35+t*.8)%1,x=q*m.range,y=Math.sin(i*17)*q*m.range*.55;g.globalAlpha=Math.sin(q*Math.PI)*(1-t*.5);
      if(['snow','ice-wind'].includes(v))crystal(g,x,y,5+q*5,core);
      else if(v==='smoke')oval(g,x,y,12+q*16,10+q*12,'#68717e');
      else{oval(g,x,y,3+q*5,3+q*5,m.slug==='sleep-powder'?'#b2d7fc':m.slug==='stun-spore'?'#ffe789':color);if(v==='spore')oval(g,x,y,9,9,null,core,1);}}
  }else if(e.mode==='drain'){
    const target=e.target||e;
    for(let i=0;i<10;i++){const q=(t*2+i/10)%1,x=target.x+(e.x-target.x)*q,y=target.y+(e.y-target.y)*q-Math.sin(q*Math.PI)*35;oval(g,x,y,m.radius*(.5+.5*Math.sin(q*Math.PI)),5,color);star(g,x,y,5,core,time);}
  }else if(['heal','buff','transform','teleport','splash'].includes(e.mode)){
    g.translate(e.x,e.y);
    if(e.mode==='heal'){
      for(let i=0;i<9;i++){const x=Math.sin(i*12)*42,y=15-t*90+i%3*13;path(g,[[x-5,y],[x+5,y]],'#9eefbb',3);path(g,[[x,y-5],[x,y+5]],'#e6ffdb',3);}
      if(v==='heal-egg')oval(g,0,-32,14,20,'#fff4d2','#d7c99e',2);
      if(v==='moonlight'){oval(g,0,-75,21,21,'#fff4bc');oval(g,8,-80,18,18,'#24394c');}
    }else if(e.mode==='buff'){
      if(v==='dance')for(let i=0;i<12;i++){const a=i*TAU/12+time*7;star(g,Math.cos(a)*40,Math.sin(a)*25-20,6,color,a);}
      else {polygon(g,[[-32,-45],[0,-57],[32,-45],[27,0],[0,22],[-27,0]],color+'55');path(g,[[-32,-45],[0,-57],[32,-45],[27,0],[0,22],[-27,0],[-32,-45]],core,3);if(v==='barrier')for(let i=0;i<4;i++)path(g,[[-26,-35+i*12],[26,-35+i*12]],'#c9eaff',2);}
    }else if(e.mode==='splash'){
      for(let i=0;i<9;i++){const a=i*TAU/9;oval(g,Math.cos(a)*t*45,10+Math.sin(a)*t*15-t*(1-t)*40,3,4,'#b4edff');}
    }else{
      for(let i=0;i<12;i++){const a=i*TAU/12+time*6,r=50*(1-t);star(g,Math.cos(a)*r,Math.sin(a)*r-25,5,core,a);}
      oval(g,0,-20,40*(1-t),55*(1-t),color+'55');
      if(e.destination)oval(g,e.destination.x-e.x,e.destination.y-e.y,45*t,15*t,null,core,3);
    }
  }
  g.restore();return true;
}
export function drawConditions(g,f,time){
  const conditions=f.conditions||{};g.save();g.translate(f.x,f.y);
  if(conditions.guard)oval(g,0,-15,38,49,null,'#c5eaff88',2);
  if(conditions.bound)for(let i=0;i<3;i++)oval(g,0,-i*10,29,9,null,'#e3edcf',2);
  if(conditions.boost)for(let i=0;i<5;i++){const x=Math.sin(i*9)*28,y=-((time*40+i*14)%65);path(g,[[x-4,y+5],[x,y],[x+4,y+5]],'#ffbad7',2);}
  if(conditions.seeded)for(let i=0;i<3;i++)leaf(g,(i-1)*20,12,12,'#b8e67e',time+i);
  const label=conditions.sleep?'Z z z':conditions.poison?'POISON':conditions.burn?'BURN':conditions.paralysis?'PARALYZED':conditions.confusion?'CONFUSED':conditions.chilled?'CHILLED':conditions.obscured?'OBSCURED':f.recovery>0?'RECHARGING':'';
  if(label){g.font='bold 10px monospace';g.textAlign='center';g.fillStyle=conditions.sleep?'#d5dcff':'#f2d0ff';g.fillText(label,0,-86-Math.sin(time*3)*3);}
  g.restore();
}
