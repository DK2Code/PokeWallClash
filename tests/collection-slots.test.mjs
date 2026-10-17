import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/game.mjs';
import {COLLECTIBLE_IDS,INITIAL_SLOTS,STARTER_IDS,COLLECTION_VERSION,MAX_SLOTS,loadCollectionProgress,usedSlots,slotPrice} from '../dist/collection.mjs';

const fillInitial=(g,except=[])=>COLLECTIBLE_IDS.filter(id=>!except.includes(id)).slice(0,INITIAL_SLOTS-STARTER_IDS.length).forEach(id=>g.recruit(id));

test('twelve initial slots include four starters; spending never changes coins or score',()=>{
  const g=new Game();assert.equal(g.collectionSlots,12);assert.equal(usedSlots(g.collection),4);
  assert.equal(g.unlockCollectionSlot(),false);g.collectionPoints=99;assert.equal(g.unlockCollectionSlot(),false);
  g.collectionPoints=100;g.score=345;const coins=g.money;
  assert.equal(g.unlockCollectionSlot(),true);assert.equal(g.collectionSlots,13);assert.equal(g.collectionPoints,0);
  assert.equal(g.score,345);assert.equal(g.money,coins);assert.equal(g.unlockCollectionSlot(),false);
});

test('full collections keep caught shinies in reserve until a slot is purchased',()=>{
  const g=new Game();fillInitial(g,[63]);g.recruit(63,true);
  assert.equal(g.available(63),false);assert.equal(g.collection[63].reserve,true);assert.equal(g.place(63,0),false);
  g.recruit(63);assert.equal(usedSlots(g.collection),12);assert.equal(g.collection[63].shiny,true);
  g.collectionPoints=100;assert.ok(g.unlockCollectionSlot());assert.equal(g.available(63),true);
  assert.equal(g.place(63,0).shiny,true);assert.equal(usedSlots(g.collection),13);
  g.reset(2,'expert');assert.equal(g.collectionSlots,13);assert.equal(g.collectionPoints,0);assert.equal(g.available(63),true);
});

test('wallet, reserved partners, bought slots and shiny preferences survive one atomic save',()=>{
  const g=new Game();fillInitial(g,[145,147]);g.recruit(145,true);g.collectionPoints=175;g.unlockCollectionSlot();g.recruit(147,true);
  const restored=new Game(1,'hard',{collectionProgress:JSON.stringify(g.collectionSave())});
  assert.equal(restored.collectionSlots,13);assert.equal(restored.collectionPoints,85);
  assert.equal(restored.available(145),true);assert.equal(restored.collection[145].useShiny,true);
  assert.equal(restored.available(147),false);assert.equal(restored.collection[147].reserve,true);
  assert.equal(restored.collection[147].shiny,true);
});

test('legacy collections keep all previously unlocked species and shiny choices for free',()=>{
  const legacy=Object.fromEntries(COLLECTIBLE_IDS.map(id=>[id,{catches:2,shiny:true,useShiny:true}]));
  for(const raw of [null,'broken','[]','{"version":2,"collection":null}']){
    const progress=loadCollectionProgress(raw,JSON.stringify(legacy));assert.equal(progress.slots,MAX_SLOTS);assert.equal(progress.points,0);
    const g=new Game(0,'normal',{collectionProgress:progress});for(const id of COLLECTIBLE_IDS){assert.equal(g.available(id),true);assert.equal(g.collection[id].useShiny,true);}
  }
});

test('malformed wallet values cannot create negative balances or remove owned slots',()=>{
  for(const points of [-10,Infinity,NaN,'500',1.5])for(const slots of [-1,Infinity,NaN,'99',4.5]){
    const g=new Game(0,'normal',{collectionProgress:{version:COLLECTION_VERSION,collection:{10:{catches:1}},points,slots}});
    assert.equal(g.collectionPoints,0);assert.equal(g.collectionSlots,12);assert.equal(g.available(10),true);
  }
});

test('slot prices cap at 300 and purchases continue through the entire roster',()=>{
  const g=new Game();g.collectionPoints=10000;let spent=0;
  for(let slots=INITIAL_SLOTS;slots<MAX_SLOTS;slots++){const cost=Math.min(300,100+50*(slots-INITIAL_SLOTS));assert.equal(slotPrice(slots),cost);spent+=cost;assert.equal(g.unlockCollectionSlot(),true);}
  assert.equal(g.collectionPoints,10000-spent);assert.equal(g.collectionSlots,MAX_SLOTS);assert.equal(slotPrice(MAX_SLOTS),null);
  assert.equal(g.unlockCollectionSlot(),false);assert.equal(g.collectionPoints,10000-spent);
});

test('defeats award points once; visitors wait until they join the collection',()=>{
  const g=new Game();g.wave=4;
  for(const [encounter,points] of [[{kind:10},1],[{kind:95},5],[{kind:63,visitor:true,shiny:true},0],[{kind:145,visitor:true,legendary:true},0]]){
    const before=g.collectionPoints,e=g.spawn(encounter);g.hit(e,999999);g.hit(e,999999);
    assert.equal(g.collectionPoints,before+points);
    const event=g.events.filter(e=>e.type==='defeat').at(-1);assert.equal(event.kind,encounter.kind);assert.equal(event.points,points);assert.equal(event.shiny,Boolean(encounter.shiny));assert.equal(event.legendary,Boolean(encounter.legendary));
  }
});

test('wave points pay once, route completion adds 50, and leaks give no catch points',()=>{
  for(const wave of [1,15]){
    const g=new Game();g.wave=wave;g.status='wave';g.update(.01);assert.equal(g.collectionPoints,wave===15?60:10);
    g.update(.01);assert.equal(g.collectionPoints,wave===15?60:10);
  }
  const g=new Game();g.wave=4;g.status='wave';g.queue=[13];g.spawn(10).distance=g.length;g.update(.01);assert.equal(g.collectionPoints,0);
});
