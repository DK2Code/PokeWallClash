import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,MAPS,towerStats,waveInfo} from '../dist/game.mjs';
import {RARE_VISITORS,LEGENDARY_VISITORS,rollVisitor,visitorForecast} from '../dist/collection.mjs';

test('every route can discover every rare species and every late legendary',()=>{
  assert.equal(MAPS.length,6);
  for(let map=0;map<MAPS.length;map++)for(const [wave,pool] of [[4,RARE_VISITORS],[14,LEGENDARY_VISITORS]]){
    const seen=new Set();for(let i=0;i<100;i++)seen.add(rollVisitor(map,wave,()=>i/100).kind);
    assert.deepEqual([...seen].sort(),[...pool].sort());assert.equal(visitorForecast(map,wave).kind,undefined,'forecast must not reveal a fixed species');
  }
});
test('weighted random visitors favor route habitats and undiscovered partners',()=>{
  const owned=Object.fromEntries(RARE_VISITORS.map(id=>[id,{catches:1}]));
  const sample=collection=>{const counts={};for(let i=0;i<1200;i++){const kind=rollVisitor(0,4,()=>i/1200,collection).kind;counts[kind]=(counts[kind]||0)+1;}return counts;};
  const base=sample(owned);assert.equal(base[10],base[81]*2);
  delete owned[63];const discovery=sample(owned);assert.ok(discovery[63]>=base[63]*1.9);
  for(const last of RARE_VISITORS)for(let i=0;i<100;i++)assert.notEqual(rollVisitor(0,8,()=>i/100,{},last).kind,last);
});
test('a run remembers the last visitor without changing its rarity or shiny roll',()=>{
  const g=new Game(0,'normal',{random:()=>0});g.wave=3;g.startWave();const first=g.visitor.kind;
  assert.equal(g.visitorArrived,false);g.spawn(g.visitor);assert.equal(g.visitorArrived,true);
  g.status='build';g.wave=7;g.startWave();assert.notEqual(g.visitor.kind,first);assert.equal(g.visitor.shiny,true);
  g.reset();assert.equal(g.previousVisitor,null);assert.equal(g.visitorArrived,false);
});
test('normal and boss defeats never count as catches or use capture effects',()=>{
  const g=new Game();g.wave=5;for(const kind of [10,95]){const e=g.spawn(kind);g.hit(e,999999);}
  assert.equal(g.kills,2);assert.equal(g.bossesDefeated,1);assert.equal(g.caught,0);assert.deepEqual(g.collection,{});
  assert.ok(g.effects.every(e=>e.type==='defeat'));assert.ok(!g.events.some(e=>e.type==='catch'||e.type==='recruit'));
});
test('a visitor becomes a catch only on a successful wave clear, with its points and animation',()=>{
  const g=new Game();g.wave=14;g.status='wave';g.queue=[10];const e=g.spawn({kind:145,visitor:true,legendary:true,shiny:true});g.hit(e,999999);
  assert.equal(g.caught,0);assert.equal(g.collectionPoints,0);assert.equal(g.collection[145],undefined);
  g.queue=[];g.update(.01);assert.equal(g.caught,1);assert.equal(g.collectionPoints,35);assert.ok(g.collection[145].shiny);
  assert.equal(g.events.filter(e=>e.type==='recruit').length,1);assert.ok(g.effects.some(e=>e.type==='capture'));
  g.update(.01);assert.equal(g.caught,1);g.reset();assert.equal(g.caught,0);assert.ok(g.collection[145].shiny);
});
test('crystal pads boost the real range through evolution and reset cleanly on a new route',()=>{
  const g=new Game(3);g.money=1000;const normal=g.place(1,0),crystal=g.place(1,6);
  for(const level of [1,2,3]){assert.equal(towerStats(crystal).range,towerStats(normal).range*1.2);if(level<3)for(const t of [normal,crystal]){g.gainXP(t,120);g.upgrade(t.id,'garden');}}
  g.reset(0);assert.equal(g.place(1,6).routeRange,1);
});
test('ranger points and spring healing pay once at milestones, with a heart cap',()=>{
  const safari=new Game(4);safari.wave=5;safari.status='wave';safari.update(.01);assert.equal(safari.collectionPoints,25);safari.update(.01);assert.equal(safari.collectionPoints,25);
  for(const missing of [1,5]){const coast=new Game(5);coast.lives-=missing;coast.wave=10;coast.status='wave';coast.update(.01);assert.equal(coast.lives,coast.maxLives-Math.max(0,missing-2));}
  const failed=new Game(5);failed.lives=0;failed.wave=10;failed.status='wave';failed.update(.01);assert.equal(failed.status,'lost');assert.equal(failed.lives,0);
});
test('new routes keep the gentle opening and gain their own later enemy mixes',()=>{
  for(let map=3;map<MAPS.length;map++){
    for(let wave=1;wave<=5;wave++)assert.deepEqual(waveInfo(wave,'normal',map),waveInfo(wave));
    const g=new Game(map,'normal',{random:()=>.99});g.wave=5;g.startWave();assert.deepEqual(waveInfo(6,'normal',map).pool,MAPS[map].wavePool);
    assert.ok(g.queue.every(kind=>MAPS[map].wavePool.includes(kind)));
  }
});
