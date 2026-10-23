import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,DIFFICULTIES,MAPS} from '../dist/game.mjs';
import {COLLECTION_STORAGE_KEY,COLLECTION_VERSION,MAX_COLLECTION_POINTS,usedSlots,partnerPrice,readCollectionProgress} from '../dist/collection.mjs';
import {catchMessage} from '../dist/catch-celebration.mjs';

test('new catches wait even with open slots; the player chooses a later catch without buying the first',()=>{
  const g=new Game();g.recruit(133);g.recruit(63,true);g.recruit(10);
  for(const id of [133,63,10]){assert.equal(g.available(id),false);assert.equal(g.place(id,0),false);}
  assert.equal(usedSlots(g.collection),4);g.collectionPoints=150;
  assert.ok(g.unlockCollectionSlot());assert.equal(usedSlots(g.collection),4);
  const before={coins:g.money,score:g.score,caught:g.caught};
  assert.ok(g.purchasePartner(63));assert.equal(g.collectionPoints,0);
  assert.deepEqual({coins:g.money,score:g.score,caught:g.caught},before);
  assert.equal(g.available(133),false);assert.equal(g.available(10),false);assert.equal(usedSlots(g.collection),5);
  assert.equal(g.collection[63].catches,1);assert.equal(g.collection[63].useShiny,true);assert.ok(g.place(63,0).shiny);
  assert.match(catchMessage(g.events.find(e=>e.type==='partnerPurchased'),'Abra').heading,/Ready for your team/);
  const restored=new Game(2,'expert',{collectionProgress:JSON.stringify(g.collectionSave())});
  assert.equal(restored.collectionSlots,13);assert.equal(restored.available(133),false);assert.equal(restored.available(63),true);
  assert.ok(restored.place(63,0).shiny);assert.equal(usedSlots(restored.collection),5);
});

test('recruiting requires a catch, enough points and a free slot, and cannot charge twice',()=>{
  const g=new Game();g.collectionPoints=99999;
  for(const id of [1,25,63,149,0,999,'63',NaN])assert.equal(g.purchasePartner(id),false);
  g.recruit(63);g.collectionPoints=49;assert.equal(g.purchasePartner(63),false);assert.equal(g.collectionPoints,49);
  g.collectionPoints=50;g.collectionSlots=4;assert.equal(g.purchasePartner(63),false);assert.equal(g.collectionPoints,50);
  g.collectionSlots=5;assert.ok(g.purchasePartner(63));assert.equal(g.collectionPoints,0);
  g.collectionPoints=50;assert.equal(g.purchasePartner(63),false);assert.equal(g.collectionPoints,50);
  g.recruit(63,true);assert.ok(g.available(63));assert.equal(g.collection[63].catches,2);assert.equal(usedSlots(g.collection),5);
});

test('regular recruits, legendary birds and special partners have separate prices',()=>{
  for(const [kind,price] of [[133,50],[10,50],[63,50],[144,300],[145,300],[146,300],[151,2500],[150,4000]]){
    const g=new Game();assert.equal(partnerPrice(kind),price);
    if(![150,151].includes(kind))g.recruit(kind);
    g.collectionPoints=price-1;assert.equal(g.purchasePartner(kind),false);
    g.collectionPoints=price;assert.ok(g.purchasePartner(kind));assert.equal(g.collectionPoints,0);assert.ok(g.available(kind));
  }
});

test('version three migration preserves the current team and never fills empty slots from waiting catches',()=>{
  const old={version:3,slots:16,points:420,collection:{10:{catches:2,shiny:true,useShiny:false},133:{catches:1},63:{catches:3,shiny:true,useShiny:true,reserve:true}}};
  const values=new Map([['pokewallclash-collection-v3',JSON.stringify(old)]]),storage={getItem:k=>values.get(k)??null};
  const progress=readCollectionProgress(storage),g=new Game(0,'normal',{collectionProgress:progress});
  assert.equal(progress.version,COLLECTION_VERSION);assert.equal(g.collectionSlots,16);assert.equal(g.collectionPoints,420);
  assert.ok(g.available(10));assert.ok(g.available(133));assert.equal(g.available(63),false);
  assert.equal(g.collection[10].useShiny,false);assert.equal(g.collection[63].useShiny,true);
  values.set(COLLECTION_STORAGE_KEY,JSON.stringify(g.collectionSave()));
  delete old.collection[63].reserve;old.points=1;values.set('pokewallclash-collection-v3',JSON.stringify(old));
  const next=new Game(0,'normal',{collectionProgress:readCollectionProgress(storage)});
  assert.equal(next.available(63),false);assert.equal(next.collectionPoints,420);assert.equal(next.collectionSlots,16);
});

test('exchange unlocks only after a completed milestone and spends each allowance once',()=>{
  const g=new Game();g.money=1000;
  for(let wave=0;wave<5;wave++){g.wave=wave;assert.equal(g.exchangeCoins(),false);}
  g.wave=5;g.status='wave';assert.equal(g.exchangeCoins(),false);assert.equal(g.coinExchangeOffer().earned,0);
  g.queue=[];g.update(.01);assert.equal(g.status,'build');assert.equal(g.coinExchangeOffer().remaining,1);
  const coins=g.money,points=g.collectionPoints,score=g.score,lives=g.lives;
  assert.ok(g.exchangeCoins());assert.equal(g.money,coins-250);assert.equal(g.collectionPoints,points+50);
  assert.equal(g.score,score);assert.equal(g.lives,lives);assert.equal(g.coinExchanges,1);
  assert.equal(g.exchangeCoins(),false);assert.match(g.coinExchangeOffer().reason,/wave 10/);
  g.wave=10;g.status='wave';assert.equal(g.exchangeCoins(),false);g.update(.01);
  assert.ok(g.exchangeCoins());assert.equal(g.coinExchanges,2);
  g.wave=15;g.status='wave';assert.equal(g.exchangeCoins(),false);g.update(.01);assert.equal(g.status,'won');
  assert.ok(g.exchangeCoins());assert.equal(g.coinExchanges,3);assert.equal(g.exchangeCoins(),false);
  assert.equal(g.events.filter(e=>e.type==='coinsExchanged').length,3);
});

test('unused trades accumulate; low coins, full wallet, active or lost waves cannot consume a trade',()=>{
  const g=new Game();g.wave=15;g.status='won';g.money=249;
  assert.equal(g.coinExchangeOffer().remaining,3);assert.equal(g.exchangeCoins(),false);assert.equal(g.money,249);
  g.money=1000;g.collectionPoints=MAX_COLLECTION_POINTS-49;
  assert.equal(g.exchangeCoins(),false);assert.equal(g.collectionPoints,MAX_COLLECTION_POINTS-49);assert.equal(g.money,1000);
  g.collectionPoints=0;
  for(const status of ['wave','lost']){g.status=status;assert.equal(g.exchangeCoins(),false);assert.equal(g.coinExchanges,0);}
  g.status='won';for(let i=0;i<3;i++)assert.ok(g.exchangeCoins());
  assert.equal(g.money,250);assert.equal(g.collectionPoints,150);assert.equal(g.exchangeCoins(),false);
  const restored=new Game(0,'normal',{collectionProgress:JSON.stringify(g.collectionSave())});
  assert.equal(restored.collectionPoints,150);assert.equal(restored.exchangeCoins(),false);assert.equal(restored.coinExchanges,0);
});

test('no route, difficulty, reset or starting balance grants a free exchange',()=>{
  const g=new Game();g.collectionPoints=80;
  for(let route=0;route<MAPS.length;route++)for(const difficulty of DIFFICULTIES){
    g.reset(route,difficulty.id);g.money=9999;
    assert.equal(g.coinExchangeOffer().remaining,0);assert.equal(g.exchangeCoins(),false);assert.equal(g.collectionPoints,80);
    g.wave=5;assert.ok(g.exchangeCoins());assert.equal(g.coinExchanges,1);g.collectionPoints=80;
  }
});
