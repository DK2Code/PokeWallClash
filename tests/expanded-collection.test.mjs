import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Game,TOWERS,MAPS,towerStats,EVOLUTIONS,multiplier} from '../dist/game.mjs';
import {EXTRA_TOWERS} from '../dist/expanded-roster.mjs';
import {RARE_VISITORS,LEGENDARY_VISITORS,COLLECTIBLE_IDS,STARTER_IDS,INITIAL_SLOTS,MAX_SLOTS,COLLECTION_STORAGE_KEY,readCollectionProgress,loadCollectionProgress,usedSlots,rollVisitor} from '../dist/collection.mjs';
import {visitorPreview} from '../dist/visitor-preview.mjs';

test('the expanded catalog contains basic Kanto families, complete art, and a dynamic collection capacity',()=>{
  const additions=[13,16,19,23,27,41,43,46,50,52,54,58,60,66,69,74,77,79,92,98,104,116,120,123,127,129,138,140];
  assert.deepEqual(EXTRA_TOWERS.map(t=>t.id),additions);
  assert.equal(RARE_VISITORS.length,34);assert.equal(MAX_SLOTS,42);assert.equal(MAX_SLOTS,TOWERS.length);
  assert.equal(new Set([...STARTER_IDS,...COLLECTIBLE_IDS]).size,TOWERS.length);
  for(const t of EXTRA_TOWERS){
    assert.ok(RARE_VISITORS.includes(t.id));assert.equal(t.stages[0],t.id);
    for(const id of t.stages)assert.ok(existsSync(new URL(`../dist/assets/${id}.png`,import.meta.url)),`Missing portrait ${id}`);
  }
  for(const id of [...LEGENDARY_VISITORS,133,...STARTER_IDS])assert.ok(!RARE_VISITORS.includes(id));
  assert.ok(![14,15,17,18,20,24,28,42,47,51,53,55,59,76,94,130].some(id=>COLLECTIBLE_IDS.includes(id)),'evolved forms must not occupy separate discovery slots');
});

test('every new visitor can be defeated, caught, placed shiny, evolved, and restored',()=>{
  for(const spec of EXTRA_TOWERS)for(const branch of EVOLUTIONS[spec.id]){
    const g=new Game();g.wave=4;g.status='wave';g.queue=[10];const enemy=g.spawn({kind:spec.id,visitor:true,shiny:true});g.hit(enemy,999999);
    assert.equal(g.available(spec.id),false);g.queue=[];g.update(.01);assert.ok(g.available(spec.id));
    g.money=1000;const tower=g.place(spec.id,0);assert.equal(tower.species,spec.id);assert.ok(tower.shiny);g.gainXP(tower,120);
    for(const level of [2,3]){assert.ok(g.upgrade(tower.id,branch.id));assert.equal(tower.species,spec.stages[level-1]);assert.ok(towerStats(tower).moveId);assert.ok(tower.shiny);}
    const restored=new Game(0,'normal',{collectionProgress:JSON.stringify(g.collectionSave())});restored.money=1000;
    assert.ok(restored.place(spec.id,0).shiny);assert.equal(restored.collection[spec.id].catches,1);
  }
});

test('all routes can roll every basic visitor and legends remain exclusive to late wave 14',()=>{
  for(let map=0;map<MAPS.length;map++){
    const seen=new Set();for(let i=0;i<1000;i++)seen.add(rollVisitor(map,4,()=>i/1000).kind);
    assert.deepEqual([...seen].sort(),[...RARE_VISITORS].sort());
    for(let wave=1;wave<=15;wave++)for(let i=0;i<30;i++){
      const v=rollVisitor(map,wave,()=>i/30);if(!v)continue;
      assert.equal(v.legendary,wave===14);assert.ok((wave===14?LEGENDARY_VISITORS:RARE_VISITORS).includes(v.kind));
    }
  }
});

test('fresh collections have eight open spaces and discovery can grow beyond fourteen even in reserve',()=>{
  const g=new Game();assert.equal(g.collectionSlots-STARTER_IDS.length,8);
  for(const id of COLLECTIBLE_IDS)g.recruit(id,true);
  assert.equal(Object.keys(g.collection).length+STARTER_IDS.length,MAX_SLOTS);
  assert.equal(usedSlots(g.collection),INITIAL_SLOTS);assert.equal(Object.values(g.collection).filter(e=>e.reserve).length,MAX_SLOTS-INITIAL_SLOTS);
  const restored=new Game(0,'normal',{collectionProgress:JSON.stringify(g.collectionSave())});
  assert.equal(Object.keys(restored.collection).length+STARTER_IDS.length,MAX_SLOTS);
});

test('version two saves gain six free slots once while keeping purchases, points, catches, and shiny choices',()=>{
  for(let slots=6;slots<=14;slots++){
    const old={version:2,collection:{133:{catches:2},63:{catches:3,shiny:true,useShiny:false},131:{catches:1,shiny:true,useShiny:true,reserve:true}},points:245,slots};
    const upgraded=loadCollectionProgress(JSON.stringify(old));assert.equal(upgraded.slots,slots+6);assert.equal(upgraded.points,245);assert.equal(upgraded.version,3);
    assert.equal(upgraded.collection[63].catches,3);assert.equal(upgraded.collection[63].useShiny,false);assert.equal(upgraded.collection[131].useShiny,true);assert.equal(upgraded.collection[131].reserve,undefined);
    assert.deepEqual(loadCollectionProgress(JSON.stringify(upgraded)),upgraded,'reloading must not grant the six slots twice');
    const g=new Game(0,'normal',{collectionProgress:upgraded});g.reset(5,'expert');assert.equal(g.collectionSlots,slots+6);
  }
});

test('unknown visitors display a question mark state until they actually arrive, including legendaries',()=>{
  for(const wave of [4,14]){
    const g=new Game(0,'normal',{random:()=>0});g.wave=wave-1;g.startWave();assert.ok(g.visitor);
    const hidden=visitorPreview(g);assert.equal(hidden.kind,null);assert.equal(hidden.shiny,false);assert.ok(!hidden.title.includes('Zapdos'));
    g.spawn(g.visitor);assert.equal(visitorPreview(g).kind,g.visitor.kind);assert.equal(visitorPreview(g).shiny,true);
    g.reset(2);assert.equal(visitorPreview(g).kind,null);
  }
});

test('new elemental partners have working battle perks and type matchups',()=>{
  const g=new Game(0,'normal',{collection:Object.fromEntries(COLLECTIBLE_IDS.map(id=>[id,{catches:1}]))});g.money=1000;
  assert.ok(towerStats(g.place(23,0)).poisonPower>0);assert.equal(towerStats(g.place(74,1)).splash,32);
  assert.equal(multiplier('fighting','normal'),1.6);assert.equal(multiplier('ground','electric'),1.6);assert.equal(multiplier('ghost','normal'),.65);
});

test('the expanded save takes precedence over writes from an older open game tab',()=>{
  const values=new Map([['pokewallclash-collection-v2',JSON.stringify({version:2,collection:{10:{catches:1}},points:123,slots:8})]]),storage={getItem:key=>values.get(key)??null};
  const migrated=readCollectionProgress(storage);assert.equal(migrated.slots,14);assert.equal(migrated.points,123);
  const g=new Game(0,'normal',{collectionProgress:migrated});g.recruit(92,true);values.set(COLLECTION_STORAGE_KEY,JSON.stringify(g.collectionSave()));
  values.set('pokewallclash-collection-v2',JSON.stringify({version:2,collection:{},slots:6,points:1}));
  const restored=readCollectionProgress(storage);assert.equal(restored.slots,14);assert.equal(restored.points,133);assert.equal(restored.collection[92].shiny,true);
});
