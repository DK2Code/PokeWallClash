import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,DIFFICULTIES,MAPS} from '../dist/game.mjs';
import {COLLECTION_STORAGE_KEY,COLLECTION_VERSION,MAX_COLLECTION_POINTS,MAX_SAVED_EXCHANGES,usedSlots,partnerPrice,readCollectionProgress} from '../dist/collection.mjs';
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

test('every cleared wave earns one exchange exactly once, including the final wave',()=>{
  const g=new Game();g.money=10000;
  assert.equal(g.exchangeCoins(),false);
  for(let wave=1;wave<=15;wave++){
    g.wave=wave;g.status='wave';g.queue=[];
    assert.equal(g.exchangeCoins(),false);assert.equal(g.savedExchanges,0);
    g.update(.01);assert.equal(g.savedExchanges,1);assert.equal(g.status,wave===15?'won':'build');
    g.update(.01);assert.equal(g.savedExchanges,1);
    const {money,collectionPoints,score,lives}=g;
    assert.ok(g.exchangeCoins());assert.equal(g.money,money-250);assert.equal(g.collectionPoints,collectionPoints+50);
    assert.equal(g.score,score);assert.equal(g.lives,lives);assert.equal(g.savedExchanges,0);
    assert.equal(g.exchangeCoins(),false);assert.match(g.coinExchangeOffer().reason,/Every cleared wave/);
  }
  assert.equal(g.coinExchanges,15);assert.equal(g.events.filter(e=>e.type==='coinsExchanged').length,15);
});

test('unused trades accumulate; low coins, full wallet, active or lost waves cannot consume a trade',()=>{
  const g=new Game();for(let wave=1;wave<=3;wave++){g.wave=wave;g.status='wave';g.update(.01);}g.money=249;
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

test('unused exchanges survive all route and difficulty resets without new grants',()=>{
  const g=new Game();g.collectionPoints=80;g.savedExchanges=2;
  for(let route=0;route<MAPS.length;route++)for(const difficulty of DIFFICULTIES){
    g.reset(route,difficulty.id);
    assert.equal(g.coinExchangeOffer().remaining,2);assert.ok(g.coinExchangeOffer().canExchange);assert.equal(g.collectionPoints,80);
  }
  assert.ok(g.exchangeCoins());assert.equal(g.savedExchanges,1);assert.equal(g.collectionPoints,130);
  g.reset(0,'normal');assert.ok(g.exchangeCoins());assert.equal(g.savedExchanges,0);
  for(const d of DIFFICULTIES){g.reset(0,d.id);assert.equal(g.exchangeCoins(),false);assert.equal(g.savedExchanges,0);}
});

test('earned and spent exchanges persist with points through a refresh and difficulty change',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)??null};
  const g=new Game();for(let wave=1;wave<=4;wave++){g.wave=wave;g.status='wave';g.update(.01);}
  assert.equal(g.savedExchanges,4);assert.ok(g.exchangeCoins());
  values.set(COLLECTION_STORAGE_KEY,JSON.stringify(g.collectionSave()));
  const restored=new Game(0,'hard',{collectionProgress:readCollectionProgress(storage)});
  assert.equal(restored.savedExchanges,3);assert.equal(restored.collectionPoints,g.collectionPoints);assert.ok(restored.exchangeCoins());
  values.set(COLLECTION_STORAGE_KEY,JSON.stringify(restored.collectionSave()));
  values.set('pokewallclash-collection-v4',JSON.stringify({version:4,collection:{},points:1,slots:12}));
  const fresh=new Game(2,'expert',{collectionProgress:readCollectionProgress(storage)});
  assert.equal(fresh.savedExchanges,2);assert.equal(fresh.collectionPoints,restored.collectionPoints);
});

test('failed waves do not award exchanges or lose previously earned ones',()=>{
  const g=new Game();g.savedExchanges=2;g.wave=1;g.status='wave';g.lives=1;g.spawn(10).distance=g.length;
  g.update(.01);assert.equal(g.status,'lost');assert.equal(g.savedExchanges,2);
  g.update(.01);assert.equal(g.savedExchanges,2);assert.equal(g.exchangeCoins(),false);
  g.reset(0,'hard');assert.ok(g.exchangeCoins());assert.equal(g.savedExchanges,1);
});

test('older collections migrate without invented exchanges and malformed balances are safe',()=>{
  for(const version of [2,3,4]){
    const progress={version,collection:{63:{catches:2,shiny:true,useShiny:true,reserve:true}},points:500,slots:14,exchanges:99};
    const g=new Game(0,'normal',{collectionProgress:progress});
    assert.equal(g.savedExchanges,0);assert.equal(g.collectionPoints,500);assert.ok(g.collection[63].reserve);assert.ok(g.collection[63].useShiny);
  }
  for(const exchanges of [-1,1.5,NaN,Infinity,'100',null]){
    const g=new Game(0,'normal',{collectionProgress:{version:COLLECTION_VERSION,collection:{},points:100,slots:12,exchanges}});
    assert.equal(g.savedExchanges,0);
  }
  const g=new Game(0,'normal',{collectionProgress:{version:COLLECTION_VERSION,collection:{},exchanges:MAX_SAVED_EXCHANGES+1}});
  assert.equal(g.savedExchanges,MAX_SAVED_EXCHANGES);g.wave=1;g.status='wave';g.update(.01);assert.equal(g.savedExchanges,MAX_SAVED_EXCHANGES);
});
