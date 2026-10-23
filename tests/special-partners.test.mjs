import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,MAPS,TOWERS,towerStats,EVOLUTIONS} from '../dist/game.mjs';
import {SPECIAL_PARTNERS} from '../dist/special-partners.mjs';
import {COLLECTIBLE_IDS,MAX_SLOTS,RARE_VISITORS,LEGENDARY_VISITORS,visitorForecast} from '../dist/collection.mjs';
import {attackVisual} from '../dist/combat-visuals.mjs';
import {CatchCelebrations,catchMessage} from '../dist/catch-celebration.mjs';
import {DIRECTIONAL} from '../dist/directional-data.mjs';

test('special partners require enough points and an open slot, and charge exactly once',()=>{
  for(const kind of [151,150]){
    const price=SPECIAL_PARTNERS[kind].price,g=new Game();g.collectionPoints=price-1;
    const before=JSON.stringify(g.collectionSave());assert.equal(g.purchasePartner(kind),false);assert.equal(JSON.stringify(g.collectionSave()),before);
    g.collectionPoints=price;g.collectionSlots=4;assert.equal(g.purchasePartner(kind),false);assert.equal(g.collectionPoints,price);
    g.collectionSlots=12;assert.ok(g.purchasePartner(kind));assert.equal(g.collectionPoints,0);assert.ok(g.available(kind));
    assert.equal(g.collectionSlots,12);assert.equal(g.money,360);assert.equal(g.caught,0);assert.equal(g.score,0);
    g.collectionPoints=price;assert.equal(g.purchasePartner(kind),false);assert.equal(g.collectionPoints,price);
    const events=g.events.filter(e=>e.type==='partnerPurchased');assert.equal(events.length,1);
    assert.equal(g.events.some(e=>e.type==='collectionPoints'||e.type==='recruit'),false);
    const queue=new CatchCelebrations();queue.enqueue(events[0]);assert.equal(queue.current.kind,kind);
    assert.match(catchMessage(events[0],TOWERS.find(t=>t.id===kind).name).detail,/Permanently unlocked/);
  }
});
test('special unlocks survive saving and all routes; trainers select the matching Arena moves',()=>{
  const g=new Game();g.collectionPoints=6500;assert.ok(g.purchasePartner(151));assert.ok(g.purchasePartner(150));
  const save=JSON.stringify(g.collectionSave());
  for(let route=0;route<MAPS.length;route++)for(const kind of [150,151])for(const branch of EVOLUTIONS[kind]){
    const restored=new Game(route,'expert',{collectionProgress:save});assert.equal(restored.collectionPoints,0);
    assert.equal(restored.place(kind,0),false,'high deployment cost preserves the starter opening');restored.money=2000;
    const t=restored.place(kind,0);assert.ok(t);assert.ok(attackVisual(towerStats(t)).signature);
    restored.gainXP(t,120);for(const level of [2,3]){assert.ok(restored.upgrade(t.id,branch.id));assert.equal(t.species,kind);assert.equal(t.level,level);}
    assert.equal(towerStats(t).moveId,branch.id==='surge'?(kind===150?'psystrike':'psychic'):(kind===150?'aura-sphere':'ancient-power'));
    const enemy=restored.spawn(19);enemy.x=t.x+45;enemy.y=t.y;const hp=enemy.hp;restored.attack(t,enemy);assert.ok(enemy.hp<hp);assert.ok(restored.shots.at(-1).visual.signature);
    assert.ok(DIRECTIONAL[kind].states.Shoot);assert.ok(DIRECTIONAL[kind].states.Charge);
  }
});
test('specials count toward discovery but cannot be randomly recruited or replace late-wave birds',()=>{
  assert.equal(MAX_SLOTS,44);
  for(const kind of [150,151]){
    assert.ok(COLLECTIBLE_IDS.includes(kind));assert.ok(!RARE_VISITORS.includes(kind));assert.ok(!LEGENDARY_VISITORS.includes(kind));
    const g=new Game();g.collectionPoints=99999;assert.equal(g.recruit(kind),false);assert.equal(g.available(kind),false);
    for(let route=0;route<MAPS.length;route++)for(let wave=1;wave<=15;wave++)assert.ok(!visitorForecast(route,wave)?.pool.includes(kind));
  }
  const g=new Game();g.collectionPoints=99999;
  for(const kind of [1,149,152,'150',null,NaN,'constructor'])assert.equal(g.purchasePartner(kind),false);
  assert.equal(g.collectionPoints,99999);assert.deepEqual(g.collection,{});
});
