// Use real UI seconds, independent of battle speed. Busy waves share one small
// catch card; rare catches always take priority and never build up a long queue.
export class CatchCelebrations {
  constructor(){this.reset();}
  reset(){this.current=null;this.queue=[];this.remaining=0;this.revision=(this.revision||0)+1;}
  show(event){this.current=event;this.remaining=event.special?3.6:1.5;this.revision++;}
  enqueue(event){
    const item={...event,special:Boolean(event.visitor||event.boss||event.legendary||event.shiny||event.type==='recruit'),count:1};
    if(!this.current){this.show(item);return;}
    if(item.special){
      if(!this.current.special||this.current.kind===item.kind){this.show(item);return;}
      const existing=this.queue.findIndex(e=>e.kind===item.kind);
      if(existing>=0)this.queue[existing]=item;
      else if(this.queue.length<6)this.queue.push(item);
    }else if(!this.current.special){
      this.current={...item,count:this.current.count+1,reward:(this.current.reward||0)+(item.reward||0),points:(this.current.points||0)+(item.points||0)};
      this.revision++;
    }
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
  if(event.type==='recruit')return {
    heading:event.newShiny?'Shiny discovered!':event.fresh?'A new friend!':'Welcome back!',
    name:`${event.shiny?'★ ':''}${name}`,
    detail:event.reserve?'Safe in reserve · unlock a collection slot':event.bonus?`Already collected · +${event.bonus} coins`:'Joined your collection · ready to place',
  };
  return {
    heading:event.shiny?'Shiny catch!':event.legendary?'An incredible catch!':event.boss?'What a catch!':event.visitor?'A rare catch!':'Gotcha!',
    name:`${event.shiny?'★ ':''}${name}${event.count>1?` + ${event.count-1} more`:''} caught!`,
    detail:event.visitor?'Clear this wave to recruit':`+${event.reward} coins · +${event.points} collection ${event.points===1?'point':'points'}`,
  };
}
