import test from 'node:test';
import assert from 'node:assert/strict';
import {AdminTesting,persistCollection} from '../dist/admin-testing.mjs';
import {Game,TOWERS,MAPS,DIFFICULTIES,EVOLUTIONS,xpProgress} from '../dist/game.mjs';
import {MAX_SLOTS,COLLECTION_STORAGE_KEY,usedSlots} from '../dist/collection.mjs';
import {recordRun} from '../dist/records.mjs';

test('the local test gate rejects incorrect passwords without touching the normal game',()=>{
  const normal=new Game(),session=new AdminTesting(),before=JSON.stringify(normal);
  for(const password of ['',null,1234,'123','wrong']){assert.equal(session.enter(password,normal),null);assert.equal(JSON.stringify(normal),before);}
  assert.equal(session.active,false);assert.equal(session.exit(),null);
});

test('admin unlocks every family, shiny and slot in a separate game, then restores a live normal battle exactly',()=>{
  const normal=new Game(2,'hard',{collection:{63:{catches:3,shiny:true,useShiny:true}}});normal.place(25,0);normal.startWave();normal.spawn(10);normal.update(.06);
  const before=JSON.stringify(normal),session=new AdminTesting(),testing=session.enter('1234',normal);
  assert.ok(testing.adminTest);assert.equal(normal.paused,true);assert.equal(testing.mapIndex,2);assert.equal(testing.difficulty.id,'hard');
  assert.equal(testing.collectionSlots,MAX_SLOTS);assert.equal(usedSlots(testing.collection),MAX_SLOTS);assert.equal(testing.money,100000);
  for(const t of TOWERS){assert.ok(testing.available(t.id));assert.ok(testing.collection[t.id].shiny);assert.ok(testing.setShiny(t.id,true));}
  assert.notEqual(testing.collection,normal.collection);assert.notEqual(testing.collection[63],normal.collection[63]);
  assert.equal(session.enter('1234',testing),null);
  testing.place(150,0);testing.reset(4,'expert');testing.collectionPoints=1;testing.recruit(63,true);
  const restored=session.exit();assert.equal(restored,normal);assert.equal(JSON.stringify(restored),before);assert.equal(session.active,false);assert.equal(session.exit(),null);
});

test('opening the login dialog does not lose the original pause choice',()=>{
  for(const originallyPaused of [false,true]){
    const g=new Game(),session=new AdminTesting();g.paused=true;
    session.enter('1234',g,originallyPaused);assert.equal(session.exit().paused,originallyPaused);
  }
});

test('test progress and records never enter normal storage; a new page loads only normal progress',()=>{
  const values=new Map(),storage={setItem:(key,value)=>values.set(key,value)},normal=new Game();normal.collectionPoints=135;normal.savedExchanges=3;
  persistCollection(storage,normal);const saved=values.get(COLLECTION_STORAGE_KEY),session=new AdminTesting(),testing=session.enter('1234',normal);
  const records={'0:normal':{wave:3,score:2500,won:false}},before=JSON.stringify(records);
  testing.wave=15;testing.status='won';testing.score=999999;testing.collectionPoints=999999;assert.equal(testing.savedExchanges,100);assert.ok(testing.exchangeCoins());
  assert.equal(persistCollection(storage,testing),false);assert.equal(values.get(COLLECTION_STORAGE_KEY),saved);
  assert.equal(recordRun(records,testing),records);assert.equal(JSON.stringify(records),before);
  const reloaded=new Game(0,'normal',{collectionProgress:values.get(COLLECTION_STORAGE_KEY)});
  assert.equal(reloaded.adminTest,false);assert.equal(reloaded.collectionPoints,135);assert.equal(reloaded.available(150),false);assert.equal(reloaded.savedExchanges,3);
  assert.equal(session.exit().collectionPoints,135);assert.equal(normal.savedExchanges,3);
});

test('every test partner can use both evolution paths immediately and all routes retain test access',()=>{
  const session=new AdminTesting(),g=session.enter('1234',new Game());
  for(let route=0;route<MAPS.length;route++)for(const d of DIFFICULTIES){g.reset(route,d.id);assert.equal(g.money,100000);assert.equal(g.collectionPoints,100000);assert.ok(g.available(150));}
  for(const spec of TOWERS)for(const branch of EVOLUTIONS[spec.id]){
    g.reset();g.setShiny(spec.id,true);const t=g.place(spec.id,0);assert.ok(t.shiny);assert.ok(xpProgress(t).ready);
    assert.ok(g.upgrade(t.id,branch.id));assert.ok(g.upgrade(t.id));assert.equal(t.level,3);
  }
});

test('wave preparation preserves the test team and clears enemies without creating ID collisions',()=>{
  const g=new AdminTesting().enter('1234',new Game()),t=g.place(151,0);g.upgrade(t.id,'surge');g.startWave();g.spawn(10);
  assert.ok(g.enemies.length);assert.ok(g.prepareTestWave(14));assert.equal(g.wave,13);assert.equal(g.status,'build');
  assert.equal(g.towers[0],t);assert.equal(t.level,2);assert.equal(g.enemies.length,0);assert.equal(g.pendingReward,null);
  assert.ok(g.startWave());const enemy=g.spawn(g.queue.at(-1));assert.ok(enemy.legendary);assert.notEqual(enemy.id,t.id);
  for(const wave of [0,16,2.5,'5',NaN])assert.equal(g.prepareTestWave(wave),false);
  g.lives=1;g.money=0;g.collectionPoints=0;assert.ok(g.refillTestResources());assert.equal(g.lives,g.maxLives);assert.equal(g.money,100000);
});

test('normal play cannot use testing shortcuts',()=>{
  const g=new Game(),before=JSON.stringify(g);assert.equal(g.prepareTestWave(15),false);assert.equal(g.refillTestResources(),false);assert.equal(JSON.stringify(g),before);
  assert.equal(g.place(25,0).xp,0);
});

test('Mew and Mewtwo offers explain wallet, capacity and existing unlocks consistently',()=>{
  for(const kind of [151,150]){
    const g=new Game();g.score=999999;let offer=g.partnerOffer(kind);
    assert.equal(offer.canPurchase,false);assert.match(offer.reason,/Personal-best score cannot be spent/);
    g.collectionPoints=offer.price;g.collectionSlots=4;offer=g.partnerOffer(kind);assert.equal(offer.canPurchase,false);assert.match(offer.reason,/team is full/);
    g.collectionSlots=5;offer=g.partnerOffer(kind);assert.equal(offer.canPurchase,true);assert.equal(offer.reason,null);assert.ok(g.purchasePartner(kind));
    assert.ok(g.partnerOffer(kind).owned);assert.equal(g.partnerOffer(kind).canPurchase,false);
    g.collection[kind].reserve=true;g.collectionPoints=offer.price;assert.equal(g.partnerOffer(kind).owned,false);assert.ok(g.partnerOffer(kind).canPurchase);assert.ok(g.purchasePartner(kind));
  }
});
