// Deterministic, local canvas scenery. No gameplay geometry or random rolls.
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
export const BIOMES={
  forest:{wash:'#176d4d22',water:'#3f9e9b',rim:'#a9c77e',pad:'#b3ca8c'},
  water:{wash:'#3fb6a633',water:'#3c9eb8',rim:'#c5e1b1',pad:'#a8d1b5'},
  autumn:{wash:'#e7a24666',water:'#b27143',rim:'#e5bb71',pad:'#d9b875'},
  cave:{wash:'#202c52bb',water:'#7269ba',rim:'#9989b7',pad:'#9a92bd'},
  safari:{wash:'#cbaa4966',water:'#6baf9b',rim:'#e4d38d',pad:'#c4bd79'},
  coast:{wash:'#f7dfba99',water:'#67bdc8',rim:'#d9ccb1',pad:'#d9d5a1'},
};
function river(c,x,y,w,h){
  rect(c,x,y,w,h,'#6fc4cb');rect(c,x+7,y,w-7,h,'#3c9eb8');
  for(let yy=y+9;yy<y+h;yy+=22)for(let xx=x+13;xx<x+w;xx+=34){rect(c,xx,yy,17,2,'#9cdee0');rect(c,xx+7,yy+8,9,2,'#2d849e');}
}
export function biomeGround(c,map){
  const theme=map.theme;rect(c,0,0,960,560,BIOMES[theme].wash);
  if(theme==='water'){
    river(c,0,0,960,38);river(c,899,0,61,560);river(c,0,536,960,24);
    poly(c,[[857,24],[907,24],[919,58],[916,119],[891,148],[872,112]],'#747f88');
    for(let i=0;i<6;i++){rect(c,872+i*5,34,4,77+(i%2)*12,i%2?'#b8f2eb':'#71cbd8');}
    oval(c,890,123,27,10,'#b8f2eb');oval(c,888,127,21,6,'#5baec2');
  }else if(theme==='coast'){
    river(c,0,0,960,45);river(c,0,515,960,45);
    for(let x=0;x<960;x+=43){rect(c,x,42,28,4,'#fff3d8');rect(c,x+10,512,30,5,'#fff3d8');}
    // A black-rock volcanic shelf, safely beyond the leftmost clearing.
    poly(c,[[0,514],[23,432],[56,422],[88,475],[118,515]],'#454f64');
    poly(c,[[19,475],[32,440],[52,435],[72,475]],'#6b6472');
    poly(c,[[34,445],[48,447],[53,473],[69,491],[57,494],[42,472]],'#e9a05e');
    rect(c,39,446,5,22,'#ffe1a1');
  }else if(theme==='cave'){
    rect(c,0,0,960,28,'#2b3248');rect(c,0,537,960,23,'#2b3248');
    for(let y=45;y<540;y+=31)for(let x=19;x<960;x+=47){rect(c,x+(y%17),y,12,2,'#9799be22');rect(c,x+18,y+12,5,2,'#121c3533');}
  }else if(theme==='safari'){
    for(let x=18;x<960;x+=52)for(let y=32;y<560;y+=52){poly(c,[[x,y+9],[x+4,y],[x+7,y+9],[x+10,y-3],[x+12,y+9],[x+17,y+1],[x+19,y+9]],'#b2994944');}
  }else if(theme==='autumn'){
    for(let x=10;x<960;x+=38)for(let y=40;y<560;y+=41){rect(c,x+(y%19),y,5,3,'#d78a4944');rect(c,x+15,y+12,3,4,'#b65b3c33');}
  }
}
export function biomePond(c,map){
  const {x,y,rx,ry}=map.pond,p=BIOMES[map.theme];
  oval(c,x,y+4,rx+8,ry+8,map.theme==='cave'?'#212a43':'#6c79554a');oval(c,x,y,rx+4,ry+4,p.rim);oval(c,x,y,rx,ry,p.water);
  if(map.theme==='autumn'){
    // A dry leaf hollow and fallen log replace the generic blue pond.
    for(let i=0;i<26;i++){const a=i*2.4,r=Math.sqrt((i+.5)/26);rect(c,x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,5,3,['#f1c362','#d98743','#9e493c'][i%3]);}
    rect(c,x-rx*.5,y-5,rx,10,'#865c3c');rect(c,x-rx*.5,y-5,rx,3,'#b98a55');oval(c,x+rx*.5,y,5,5,'#e7bd77');return;
  }
  for(let i=0;i<8;i++){const xx=x+Math.cos(i*2.4)*rx*.68,yy=y+Math.sin(i*2.4)*ry*.68;rect(c,xx,yy,10+i%3*3,2,map.theme==='cave'?'#c7b2f1':'#b8ece1');}
  if(map.theme==='forest'){for(const [dx,dy] of [[-28,-7],[23,16],[-14,22]]){oval(c,x+dx,y+dy,9,4,'#86ba68');rect(c,x+dx-1,y+dy-3,3,3,'#ffe3e9');}}
  if(['water','safari'].includes(map.theme))for(let i=0;i<6;i++){const xx=x-rx+8+i*9,yy=y+ry*.5;rect(c,xx,yy-14,2,18,'#5f8952');rect(c,xx-1,yy-15,4,6,'#a67b42');}
}
export function biomeLandmark(c,theme,x,y,size){
  const s=size/65;
  const P=points=>points.map(([xx,yy])=>[x+xx*s,y+yy*s]);
  if(theme==='autumn'){
    rect(c,x-4*s,y-38*s,8*s,39*s,'#835337');
    poly(c,P([[-32,-22],[-38,-48],[-27,-73],[-9,-89],[13,-83],[33,-63],[38,-34],[22,-18]]),'#9c4937');
    poly(c,P([[-32,-48],[-24,-72],[-7,-83],[16,-73],[31,-55],[25,-35],[-12,-30]]),'#d5793d');
    poly(c,P([[-22,-60],[-7,-77],[12,-70],[24,-56],[8,-48],[-12,-50]]),'#eeb558');
    rect(c,x-15*s,y-58*s,9*s,5*s,'#f5ce77');
  }else if(theme==='safari'){
    poly(c,P([[-4,1],[-6,-36],[-19,-51],[-14,-54],[2,-38],[18,-53],[22,-49],[5,-31],[4,1]]),'#846344');
    poly(c,P([[-42,-45],[-33,-59],[-13,-62],[3,-68],[28,-60],[43,-45],[25,-37],[-26,-37]]),'#697b46');
    poly(c,P([[-32,-51],[-19,-60],[10,-61],[30,-51],[13,-45],[-20,-45]]),'#a7ae5b');
  }else if(theme==='coast'){
    poly(c,P([[-5,2],[0,-37],[9,-62],[13,-60],[6,-35],[3,2]]),'#9a7e58');
    for(const side of [-1,1]){poly(c,P([[10,-59],[side*31,-74],[side*43,-62],[side*16,-63]]),'#488979');poly(c,P([[10,-60],[side*21,-53],[side*31,-30],[side*7,-49]]),'#367566');}
    poly(c,P([[10,-58],[4,-89],[18,-85],[19,-66]]),'#70ae87');
  }else if(theme==='cave'){
    poly(c,P([[-34,4],[-32,-25],[-19,-57],[4,-70],[28,-38],[38,5]]),'#3c425b');
    poly(c,P([[-25,-4],[-16,-40],[1,-62],[8,-28],[24,-3]]),'#60627d');
    for(const [dx,dy,h] of [[-12,0,35],[8,-4,49],[24,3,26]]){
      poly(c,P([[dx-7,dy],[dx-8,dy-h*.6],[dx,dy-h],[dx+7,dy-h*.6],[dx+7,dy]]),'#9a83ce');
      poly(c,P([[dx,dy-3],[dx,dy-h],[dx+7,dy-h*.6],[dx+7,dy]]),'#cbb7f3');
    }
  }else return false;
  return true;
}
export function biomeDetail(c,theme,x,y,n){
  if(theme==='forest'){
    if(n>.86){rect(c,x-2,y-4,3,7,'#ead8a1');oval(c,x,y-5,7,4,'#c56657');rect(c,x-3,y-7,2,2,'#fff4d4');}
    else{rect(c,x,y-3,2,7,'#428459');rect(c,x-2,y-5,6,3,n>.7?'#fff0a1':'#ecc6d5');}
  }else if(theme==='autumn'){
    for(let i=0;i<5;i++)poly(c,[[x+i*4-8,y],[x+i*4-5,y-4-i%2*3],[x+i*4-1,y],[x+i*4-4,y+3]],['#be653c','#efbe56','#a84f3e'][i%3]);
  }else if(theme==='water'){
    rect(c,x,y-10,2,13,'#47865d');rect(c,x+4,y-15,2,18,'#599864');rect(c,x+8,y-7,2,10,'#397554');rect(c,x+3,y-16,4,5,'#b48b50');
  }else if(theme==='safari'){
    for(let i=0;i<5;i++)poly(c,[[x-10+i*4,y+3],[x-12+i*5,y-9-i%3*3],[x-6+i*4,y+3]],i%2?'#a38e43':'#c7ad53');
  }else if(theme==='coast'){
    oval(c,x,y,7,4,'#d5c3a6');poly(c,[[x-6,y],[x-4,y-4],[x,y-6],[x+5,y-3],[x+6,y]],'#fff0d1');rect(c,x,y-4,1,5,'#d9ad91');
  }else{biomeLandmark(c,theme,x,y,n>.85?30:18);}
}
