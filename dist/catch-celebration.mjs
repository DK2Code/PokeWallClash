// Only confirmed collection additions are catches. Defeats never enter this queue.
export class CatchCelebrations {
  constructor(){this.reset();}
  reset(){this.current=null;this.queue=[];this.remaining=0;this.revision=(this.revision||0)+1;}
  show(event){this.current=event;this.remaining=event.legendary||event.newShiny?4.2:3.6;this.revision++;}
  enqueue(event){
    if(!['recruit','partnerPurchased'].includes(event.type))return;
    const item={...event,special:true};
    if(!this.current||this.current.kind===item.kind){this.show(item);return;}
    const existing=this.queue.findIndex(e=>e.kind===item.kind);
    if(existing>=0)this.queue[existing]=item;
    else if(this.queue.length<6)this.queue.push(item);
  }
  update(seconds){
    if(!this.current)return;
    this.remaining-=seconds;
    if(this.remaining>0)return;
    if(this.queue.length)this.show(this.queue.shift());
    else{this.current=null;this.revision++;}
  }
}

export function catchMessage(event,name){
  if(event.type==='partnerPurchased')return {heading:'Ready for your team!',name:`${event.shiny?'★ ':''}${name}`,detail:`Permanently unlocked · ${event.price.toLocaleString()} collection points`};
  if(event.type!=='recruit')return null;
  return {
    heading:event.shiny?'Shiny caught!':event.legendary?'Legendary caught!':event.fresh?'A new friend caught!':'Caught again!',
    name:`${event.shiny?'★ ':''}${name}`,
    detail:(event.reserve?'Saved in Collection · choose to recruit with points':event.bonus?`Already on your team · +${event.bonus} coins`:'Already on your team · shiny colors unlocked')+` · +${event.points||0} pts`,
  };
}
