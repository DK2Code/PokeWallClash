import test from 'node:test';
import assert from 'node:assert/strict';
import {CatchCelebrations,catchMessage} from '../dist/catch-celebration.mjs';

test('rapid ordinary catches share a finite, compact celebration',()=>{
  const c=new CatchCelebrations();for(let i=0;i<30;i++)c.enqueue({type:'catch',kind:10,reward:12,points:1});
  assert.equal(c.current.count,30);assert.equal(c.current.reward,360);assert.equal(c.current.points,30);assert.equal(c.queue.length,0);
  c.update(1.6);assert.equal(c.current,null);
});
test('special catches interrupt ordinary cards and cannot be overwritten by the crowd',()=>{
  const c=new CatchCelebrations();c.enqueue({type:'catch',kind:10});c.enqueue({type:'catch',kind:95,boss:true});
  c.enqueue({type:'catch',kind:19});assert.equal(c.current.kind,95);
  c.enqueue({type:'catch',kind:145,legendary:true,visitor:true});assert.equal(c.queue.length,1);
  c.update(3.7);assert.equal(c.current.kind,145);c.update(3.7);assert.equal(c.current,null);
});
test('recruiting updates the visitor celebration instead of creating a duplicate',()=>{
  const c=new CatchCelebrations();c.enqueue({type:'catch',kind:10,visitor:true,shiny:true});
  c.enqueue({type:'recruit',kind:10,shiny:true,newShiny:true,reserve:true});assert.equal(c.current.type,'recruit');assert.equal(c.queue.length,0);
  const message=catchMessage(c.current,'Caterpie');assert.match(message.name,/★ Caterpie/);assert.match(message.detail,/reserve/);
  c.enqueue({type:'catch',kind:95,boss:true});c.reset();assert.equal(c.current,null);assert.deepEqual(c.queue,[]);
});
test('queued recruitment replaces its pending catch while a boss is celebrated',()=>{
  const c=new CatchCelebrations();c.enqueue({type:'catch',kind:95,boss:true});c.enqueue({type:'catch',kind:63,visitor:true});
  c.enqueue({type:'recruit',kind:63,fresh:true});assert.equal(c.queue.length,1);c.update(3.7);assert.equal(c.current.type,'recruit');
});
test('ordinary catches never claim to unlock a partner, and visitors wait for wave clear',()=>{
  assert.match(catchMessage({kind:10,points:1,reward:12},'Caterpie').name,/Caterpie caught/);
  assert.doesNotMatch(catchMessage({kind:10,points:1,reward:12},'Caterpie').detail,/collection.*joined|recruit/);
  assert.equal(catchMessage({kind:145,legendary:true,visitor:true},'Zapdos').detail,'Clear this wave to recruit');
  assert.match(catchMessage({kind:95,boss:true,points:5,reward:110},'Onix').name,/Onix/);
});
