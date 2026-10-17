export const ROUTE_PALETTES={
  cave:{grass:'#76758e',dark:'#59596f',patch:'#83819a',leaf:'#777393',light:'#a09abb',deep:'#494b66',water:'#8e9bd2',waterDeep:'#7383b7',pondEdge:'#8884a9',pondRim:'#c6bce2',path:'#c4b5cc',pathEdge:'#91849e'},
  safari:{grass:'#cbc586',dark:'#a9ac6a',patch:'#d8cf93',leaf:'#7d9252',light:'#a5b66a',deep:'#566b3e',water:'#83b3ad',path:'#efd9a3',pathEdge:'#c8b582'},
  coast:{grass:'#bcd3b7',dark:'#91b5a7',patch:'#d0dec0',leaf:'#558b77',light:'#82b198',deep:'#386556',water:'#94c5ca',path:'#f0dab4',pathEdge:'#c6b28b'},
};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export function routeLandmark(c,theme,x,y,s,p){
  c.save();c.translate(x,y);c.scale(s,s);
  if(theme==='cave'){
    poly(c,[[-32,10],[-35,-26],[-20,-59],[8,-70],[28,-45],[36,8]],p.deep);
    poly(c,[[-26,2],[-22,-25],[-9,-55],[3,-60],[12,-24],[8,2]],p.leaf);
    poly(c,[[9,0],[13,-29],[24,-44],[30,-24],[31,0]],p.light);
    poly(c,[[-8,0],[-15,-20],[-8,-37],[0,-19],[0,0]],'#b3a8ef');rect(c,-10,-25,2,17,'#e5ddff');
  }else if(theme==='coast'){
    poly(c,[[-5,9],[2,-45],[10,-45],[2,9]],'#a18d60');
    for(const side of [-1,1]){poly(c,[[5,-44],[side*35,-58],[side*43,-40],[side*19,-45]],p.deep);poly(c,[[5,-44],[side*25,-70],[side*36,-61],[side*16,-54]],p.leaf);}
    poly(c,[[3,-46],[0,-78],[13,-73],[13,-47]],p.light);
  }else{
    poly(c,[[-5,9],[-6,-30],[2,-45],[7,-28],[6,9]],'#8a7951');
    poly(c,[[-40,-30],[-37,-47],[-19,-55],[23,-55],[42,-43],[43,-28]],p.deep);
    rect(c,-32,-48,58,14,p.leaf);rect(c,-17,-55,38,10,p.light);
  }
  c.restore();
}
export function routeBackdrop(c,map){
  if(map.theme==='cave'){
    for(let y=80;y<540;y+=70)for(let x=70;x<940;x+=94){rect(c,x,y,31,2,'#b3abc22b');rect(c,x+30,y-12,2,14,'#b3abc21c');}
  }else if(map.theme==='coast'){
    rect(c,0,0,960,38,'#6daabb');rect(c,0,524,960,36,'#6daabb');
    for(let x=0;x<960;x+=52){rect(c,x,31,36,5,'#e6f1d8');rect(c,x+16,518,34,6,'#e6f1d8');rect(c,x+8,544,25,2,'#b9e1db');}
    poly(c,[[22,518],[62,441],[86,437],[136,518]],'#686c70');poly(c,[[55,454],[64,438],[85,437],[94,454]],'#d99a72');
    poly(c,[[68,448],[78,451],[88,490],[77,478]],'#edb680');
  }else if(map.theme==='safari'){
    for(const [x,y] of [[82,70],[540,520],[865,490]]){rect(c,x-22,y,44,4,'#b49362');for(let i=0;i<4;i++)rect(c,x-18+i*12,y-7,4,24,'#d2b77d');}
  }
}
export function routeAmbient(c,game,reducedMotion){
  c.save();
  if(game.map.theme==='cave'){
    for(const [i,pad] of game.map.boostPads.entries()){
      const [x,y]=game.map.pads[pad];c.globalAlpha=reducedMotion ? .55 : .45+Math.sin(game.time*1.8+i)*.15;
      c.strokeStyle='#eadfff';c.lineWidth=2;c.beginPath();c.ellipse(x,y,26,15,0,0,Math.PI*2);c.stroke();
      poly(c,[[x+22,y-11],[x+26,y-22],[x+30,y-11],[x+26,y-5]],'#e1c7ff');
    }
  }else if(game.map.theme==='coast'){
    c.strokeStyle='#f5fff1';c.lineWidth=2;c.globalAlpha=.4;
    for(let i=0;i<3;i++){const x=game.map.pond.x-14+i*14,y=game.map.pond.y-10;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+8,y-10,x+(reducedMotion?0:Math.sin(game.time+i)*5),y-22);c.stroke();}
  }else if(game.map.theme==='safari'){
    c.globalAlpha=.45;for(let i=0;i<8;i++){const x=80+i*110+(reducedMotion?0:Math.sin(game.time*.4+i)*16),y=55+(i%3)*160;rect(c,x,y,3,2,'#fff7d0');}
  }
  c.restore();
}
