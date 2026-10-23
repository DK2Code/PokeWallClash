import test from 'node:test';
import assert from 'node:assert/strict';
import {CatchCelebrations,catchMessage} from '../dist/catch-celebration.mjs';

test('no defeat can trigger a catch popup, including bosses and unconfirmed visitors',()=>{
  const c=new CatchCelebrations();
  for(const extra of [{},{boss:true},{visitor:true},{visitor:true,legendary:true,shiny:true}]){
    const event={type:'defeat',kind:10,...extra};c.enqueue(event);assert.equal(c.current,null);assert.equal(catchMessage(event,'Caterpie'),null);
  }
});
test('confirmed collection catches celebrate in order and use real-time lifetimes',()=>{
  const c=new CatchCelebrations();c.enqueue({type:'recruit',kind:10,fresh:true,points:10});c.enqueue({type:'recruit',kind:145,legendary:true,points:25});
  assert.equal(c.current.kind,10);assert.equal(c.queue.length,1);c.update(3.7);assert.equal(c.current.kind,145);c.update(4);assert.ok(c.current);c.update(.3);assert.equal(c.current,null);
});
test('recruitment details retain shiny and reserve status while duplicate notifications merge',()=>{
  const c=new CatchCelebrations();const event={type:'recruit',kind:10,shiny:true,newShiny:true,reserve:true,points:10};
  c.enqueue(event);c.enqueue(event);assert.equal(c.queue.length,0);const message=catchMessage(c.current,'Caterpie');assert.match(message.heading,/Shiny caught/);assert.match(message.name,/★ Caterpie/);assert.match(message.detail,/Collection/);assert.match(message.detail,/choose to recruit/);assert.match(message.detail,/10 pts/);
  c.enqueue({type:'recruit',kind:63});c.reset();assert.equal(c.current,null);assert.deepEqual(c.queue,[]);
});
