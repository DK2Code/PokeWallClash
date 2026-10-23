// Local Emerald / FireRed terrain, packaged for PokeWallClash. See assets/world/CREDITS.txt.
// Visual geometry only: routes, collision paths, clearings and balance stay in game.mjs.
const images=new Map();
export const TERRAIN_FILES=['outdoors','cavern','forest-tree','obstacle-rock','obstacle-crystal'];
export function loadTerrainArt(){return Promise.all(TERRAIN_FILES.map(name=>new Promise(resolve=>{
  const img=new Image();img.onload=()=>{images.set(name,img);resolve(true);};img.onerror=()=>resolve(false);img.src=`./assets/world/${name}.png`;
})));}
export const ROUTE_EXITS=Object.freeze({
  forest:{name:'Forest passage',kind:'grove'},water:{name:'River crossing',kind:'bridge'},
  autumn:{name:'Golden grove',kind:'grove'},cave:{name:'Mountain entrance',kind:'mountain'},
  safari:{name:'Safari gate',kind:'gate'},coast:{name:'Sea cave',kind:'sea-cave'},
});
const STYLES={
  forest:{ground:'#77b88d',set:'outdoors',tile:1,path:'#e8d599',edge:'#9eaa6a',tree:'none'},
  water:{ground:'#84bd91',set:'outdoors',tile:1,path:'#e7dbad',edge:'#9cae79',tree:'none'},
  autumn:{ground:'#b8c38a',set:'outdoors',tile:289,path:'#edcf95',edge:'#b49d6d',tree:'sepia(.9) saturate(1.6) hue-rotate(340deg)'},
  cave:{ground:'#8e879c',set:'cavern',tile:244,path:'#c5b5c6',edge:'#736b82',tree:'none'},
  safari:{ground:'#c0c18a',set:'outdoors',tile:289,path:'#efdaa0',edge:'#ada175',tree:'sepia(.4) saturate(.85)'},
  coast:{ground:'#c9d29a',set:'outdoors',tile:289,path:'#eee1b0',edge:'#aaa278',tree:'none'},
};
const px=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function tile(c,set,id,x,y,size=32){const img=images.get(set);if(img)c.drawImage(img,id%16*16,Math.floor(id/16)*16,16,16,x,y,size,size);}
function noise(x,y,seed){let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return(n>>>0)/4294967296;}
export function pathDistance(x,y,path){let distance=Infinity;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1];const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return distance;}
function boulder(c,x,y,size=40){const img=images.get('obstacle-rock');if(img)c.drawImage(img,Math.round(x-size/2),Math.round(y-size*.8),size,size);else{poly(c,[[x-size/2,y],[x-size*.35,y-size*.6],[x+size*.2,y-size*.8],[x+size/2,y],[x,y+size*.2]],'#8f8b8b');}}
function tree(c,x,y,size,theme){const img=images.get('forest-tree');c.save();c.filter=STYLES[theme].tree;oval(c,x,y-3,size*.42,size*.18,'#163b3440');if(img)c.drawImage(img,Math.round(x-size/2),Math.round(y-size*1.5),size,size*1.5);else{px(c,x-4,y-26,8,28,'#785a40');poly(c,[[x-size/2,y-20],[x-size*.35,y-size],[x,y-size*1.5],[x+size*.4,y-size],[x+size/2,y-20]],'#32734f');}c.restore();}
function shore(c,map){
  const {x,y,rx,ry}=map.pond,stone=map.theme==='cave';
  oval(c,x,y+3,rx+9,ry+9,stone?'#66667f':'#829a69');oval(c,x,y,rx+5,ry+5,stone?'#b5b0cc':'#e0db9e');
  c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();px(c,x-rx,y-ry,rx*2,ry*2,stone?'#739ac5':'#5fa8d0');
  for(let yy=y-ry;yy<y+ry;yy+=32)for(let xx=x-rx;xx<x+rx;xx+=32)tile(c,'outdoors',368,xx,yy);c.restore();
  for(let i=0;i<6;i++)px(c,x-rx*.6+i*rx*.22,y-ry*.4+(i%3)*ry*.4,10,2,'#c1e9ee');
}
function borderLandmark(c,map,x,y,size){
  if(map.theme==='cave'){boulder(c,x,y,size);if(Math.round(x+y)%3===0){const img=images.get('obstacle-crystal');if(img)c.drawImage(img,x-12,y-20,24,24);}}
  else if(map.theme==='coast'){boulder(c,x,y,size*.65);}
  else tree(c,x,y,size,map.theme);
}
export function drawRouteEntrance(c,map,{foreground=false}={}){
  const y=map.path.at(-1)[1],theme=map.theme,exit=ROUTE_EXITS[theme];
  c.save();c.imageSmoothingEnabled=false;
  // A recessed opening faces the incoming path. The dark throat continues off-map.
  if(exit.kind==='mountain'||exit.kind==='sea-cave'){
    const sea=exit.kind==='sea-cave';
    poly(c,[[867,y+36],[873,y-33],[891,y-78],[921,y-101],[960,y-78],[985,y+44]],sea?'#697d87':'#626375');
    for(const [x,yy,s] of [[893,y-28,60],[922,y-68,72],[960,y-25,75],[936,y+42,62]])boulder(c,x,yy,s);
    poly(c,[[901,y+25],[899,y-10],[910,y-31],[928,y-42],[951,y-39],[973,y-13],[980,y+26]],'#39414e');
    poly(c,[[911,y+23],[912,y-7],[927,y-26],[949,y-27],[972,y-8],[976,y+23]],sea?'#183c50':'#252837');
    px(c,900,y+20,66,8,sea?'#9fb6ac':'#a69ca7');px(c,916,y+17,44,3,sea?'#5e98ac':'#6e657e');
    if(sea){px(c,932,y+10,28,3,'#709eb1');px(c,944,y+3,16,2,'#b3d9df');}
    else{const crystal=images.get('obstacle-crystal');if(crystal)c.drawImage(crystal,884,y+8,26,26);}
  }else if(exit.kind==='bridge'){
    px(c,900,y-66,60,139,'#639fbd');for(let yy=y-65;yy<y+72;yy+=32)for(let x=900;x<960;x+=32)tile(c,'outdoors',368,x,yy);
    px(c,872,y-22,95,51,'#705844');for(let x=875;x<968;x+=10){px(c,x,y-20,8,46,'#ba985c');px(c,x,y-20,8,3,'#e2c486');}
    for(const dy of [-26,29]){px(c,867,y+dy,98,5,'#6d5c45');px(c,867,y+dy-2,98,3,'#debd7b');for(const x of [872,912,952]){px(c,x,y+dy-11,6,24,'#79603e');px(c,x,y+dy-12,6,4,'#ecce8c');}}
    tree(c,959,y-28,62,'water');tree(c,972,y+112,72,'water');
  }else if(exit.kind==='grove'){
    // Top-down woodland passage: trees flank an unobstructed trail into the forest.
    // Keep the canopy above and below the path, instead of framing it as a front door.
    const autumn=theme==='autumn';
    if(!foreground)for(const [x,alpha] of [[902,.08],[918,.12],[934,.17],[950,.23]]){
      c.save();c.globalAlpha=alpha;px(c,x,y-26,16,52,autumn?'#685329':'#244a35');c.restore();
    }
    tree(c,930,y-35,56,theme);tree(c,974,y-32,62,theme);
    tree(c,935,y+133,62,theme);tree(c,978,y+137,68,theme);
    px(c,913,y-32,12,3,autumn?'#c8aa62':'#a6c278');
    px(c,942,y+30,14,3,autumn?'#c8aa62':'#a6c278');
  }else{
    // Safari fence posts stand on either bank, leaving the whole trail open.
    for(const dy of [-39,39]){
      px(c,899,y+dy-10,9,24,'#6b503a');px(c,900,y+dy-10,3,24,'#bf9963');
      px(c,899,y+dy-11,9,4,'#dec48c');
      for(const rail of [-5,6])px(c,908,y+dy+rail,52,4,'#bd9b60');
      for(const x of [929,952])px(c,x,y+dy-9,6,22,'#896d46');
    }
  }
  // The destination name lives in the HUD, leaving the path and nearby clearings clear.
  c.restore();
}
export function createBattleTerrain(map,mapIndex=0){
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=560;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const style=STYLES[map.theme],seed=3213+mapIndex*719;
  px(c,0,0,960,560,style.ground);
  c.save();if(map.theme==='cave')c.filter='saturate(.45) hue-rotate(175deg)';
  for(let y=0;y<560;y+=32)for(let x=0;x<960;x+=32)tile(c,style.set,style.tile,x,y);c.restore();
  if(['water','coast'].includes(map.theme)){
    const depth=map.theme==='coast'?40:24;
    for(const yy of [0,560-depth]){px(c,0,yy,960,depth,'#5b99c2');for(let x=0;x<960;x+=32)tile(c,'outdoors',368,x,yy,32);px(c,0,yy===0?depth:yy,960,3,'#c6e5db');}
  }
  shore(c,map);
  const path=()=>{c.beginPath();map.path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));};c.lineJoin='round';c.lineCap='round';
  for(const [width,color,dy] of [[68,'#254b3a33',4],[62,style.edge,0],[54,style.path,0]]){c.save();c.translate(0,dy);path();c.strokeStyle=color;c.lineWidth=width;c.stroke();c.restore();}
  for(let y=60;y<530;y+=8)for(let x=0;x<960;x+=9){const n=noise(x,y,seed);if(n>.76&&pathDistance(x,y,map.path)<24)px(c,x,y,n>.9?4:2,2,n>.88?'#fcf0c5':'#a99c7850');}
  // Decor never covers a path, the pond, an entrance, or a usable clearing.
  for(let y=80;y<520;y+=28)for(let x=45;x<885;x+=29){const n=noise(x,y,seed);if(n<.6||pathDistance(x,y,map.path)<49||map.pads.some(([px,py])=>Math.hypot(px-x,py-y)<44)||Math.hypot((x-map.pond.x)/map.pond.rx,(y-map.pond.y)/map.pond.ry)<1.4)continue;
    if(map.theme==='cave'){if(n>.82)boulder(c,x,y,18+n*10);else px(c,x,y,5,2,'#b1a0bc');}
    else if(n>.95)boulder(c,x,y,22);else if(n>.86){tile(c,'outdoors',13,x-9,y-12,18);}else{px(c,x,y,2,5,map.theme==='autumn'?'#a4853e':'#488f55');px(c,x+4,y-3,2,6,map.theme==='autumn'?'#b29143':'#488f55');}
  }
  const frame=[];for(let x=-15;x<990;x+=38){frame.push([x,35+noise(x,0,seed)*20,62]);frame.push([x+12,601+noise(x,1,seed)*15,70]);}
  for(let y=75;y<540;y+=50)for(const x of [5,963])if(pathDistance(x,y,map.path)>90)frame.push([x,y,65]);
  frame.sort((a,b)=>a[1]-b[1]).forEach(([x,y,s])=>borderLandmark(c,map,x,y,s));
  drawRouteEntrance(c,map);
  for(const [i,[x,y]] of map.pads.entries()){
    const crystal=map.boostPads?.includes(i);oval(c,x,y+4,25,14,'#284a3c30');oval(c,x,y,24,14,crystal?'#d6c7f2':'#e5e4b2');oval(c,x,y-2,21,11,crystal?'#aa97cf':'#b3ca8c');
    c.strokeStyle=crystal?'#eee4ff':'#f4f1cf';c.lineWidth=2;c.beginPath();c.ellipse(x,y-2,21,11,0,0,Math.PI*2);c.stroke();
  }
  const sy=map.path[0][1];px(c,22,sy-50,4,27,'#795e3a');px(c,9,sy-54,44,18,'#f3e0ae');c.font='bold 9px monospace';c.fillStyle='#4c5c4b';c.textAlign='center';c.fillText('IN →',31,sy-42);
  return canvas;
}
