import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,EVOLUTIONS,ENEMIES,DIFFICULTIES,MAPS,towerStats} from '../dist/game.mjs';
import {STARTER_IDS,COLLECTIBLE_IDS,RARE_VISITORS,LEGENDARY_VISITORS,loadCollection,rollVisitor,visitorForecast,partnerPrice} from '../dist/collection.mjs';

test('the entire roster, enemy pool, evolutions and collection stay in Gen 1',()=>{
  const ids=[...TOWERS.flatMap(t=>[t.id,...t.stages]),...Object.keys(ENEMIES).map(Number),...Object.values(EVOLUTIONS).flat().map(b=>b.species).filter(Boolean),...COLLECTIBLE_IDS];
  assert.ok(ids.every(id=>Number.isInteger(id)&&id>=1&&id<=151));
  assert.deepEqual(STARTER_IDS,[1,4,7,25]);assert.equal(new Set(TOWERS.map(t=>t.id)).size,TOWERS.length);
  assert.deepEqual(TOWERS.filter(t=>!STARTER_IDS.includes(t.id)).map(t=>t.id).sort((a,b)=>a-b),[...COLLECTIBLE_IDS].sort((a,b)=>a-b));
});
test('Pikachu evolves to Raichu and stays in Gen 1 when fully trained',()=>{
  const g=new Game(),t=g.place(25,0);g.gainXP(t,120);g.upgrade(t.id,'storm');assert.equal(t.species,26);g.upgrade(t.id);assert.equal(t.species,26);assert.equal(towerStats(t).name,'Raichu');
});
test('Eevee is a permanent bonus only after defeating Onix and clearing wave 5',()=>{
  const g=new Game();assert.equal(g.place(133,0),false);g.wave=4;g.startWave();const boss=g.spawn(95);g.hit(boss,boss.hp);
  assert.equal(g.available(133),false);g.update(.01);assert.equal(g.available(133),false);
  g.queue=[];g.enemies=[];g.update(.01);assert.equal(g.available(133),false);assert.equal(g.collection[133].reserve,true);g.collectionPoints=50;assert.ok(g.purchasePartner(133));assert.ok(g.pendingReward);assert.equal(g.collection[133].catches,1);
  g.claimReward('charm');g.reset(2,'expert');assert.equal(g.available(133),true);assert.equal(g.place(133,0).species,133);
  const fresh=new Game(1,'easy',{collection:loadCollection(JSON.stringify(g.collection))});assert.equal(fresh.available(133),true);
});
test('an escaped Onix or a failed wave never awards Eevee',()=>{
  for(const fail of [false,true]){const g=new Game();g.wave=4;g.startWave();g.queue=[];const boss=g.spawn(95);
    if(fail){g.hit(boss,boss.hp);g.lives=1;const enemy=g.spawn(10);enemy.distance=g.length-1;}
    else boss.distance=g.length-1;
    g.update(.1);assert.equal(g.available(133),false);
  }
});
test('each route has scheduled rare sightings, occasional visitors, and no early legends',()=>{
  for(let map=0;map<MAPS.length;map++){
    assert.ok(RARE_VISITORS.includes(rollVisitor(map,4,()=>.99).kind));
    assert.ok(RARE_VISITORS.includes(rollVisitor(map,8,()=>.99).kind));
    for(let wave=1;wave<=15;wave++){
      for(const random of [()=>0,()=>.99]){const v=rollVisitor(map,wave,random);if(v?.legendary)assert.equal(wave,14);}
      if([1,2,3,5,10,15].includes(wave))assert.equal(rollVisitor(map,wave,()=>0),null);
    }
    for(const wave of [6,7,9,11,13]){assert.ok(rollVisitor(map,wave,()=>.34));assert.equal(rollVisitor(map,wave,()=>.35),null);}
    assert.ok(visitorForecast(map,12).guaranteed);
  }
});
test('each legendary is the last spawn in wave 14 on every map and difficulty',()=>{
  for(let map=0;map<MAPS.length;map++)for(const difficulty of DIFFICULTIES){const g=new Game(map,difficulty.id,{random:()=>.99});g.wave=13;g.startWave();
    assert.ok(LEGENDARY_VISITORS.includes(g.queue.at(-1).kind));assert.equal(g.queue.at(-1).legendary,true);
    assert.equal(g.queue.filter(entry=>typeof entry==='object').length,1);
    const e=g.spawn(g.queue.at(-1));assert.equal(e.visitor,true);assert.equal(e.boss,undefined);assert.equal(g.bossesDefeated,0);
  }
});
test('ordinary defeats do not recruit; marked visitors are caught once after wave clear',()=>{
  const g=new Game();g.wave=4;g.status='wave';g.queue=[13];const ordinary=g.spawn(10);g.hit(ordinary,9999);assert.deepEqual(g.pendingRecruits,[]);
  const rare=g.spawn({kind:10,visitor:true});g.hit(rare,9999);g.hit(rare,9999);assert.equal(g.pendingRecruits.length,1);assert.equal(g.available(10),false);
  g.queue=[];g.update(.01);assert.equal(g.available(10),false);assert.equal(g.collection[10].reserve,true);assert.equal(g.collection[10].catches,1);assert.equal(g.events.filter(e=>e.type==='recruit').length,1);
});
test('visitors escape without costing hearts or awarding a recruit',()=>{
  const g=new Game();g.wave=14;g.status='wave';const e=g.spawn({kind:145,visitor:true,legendary:true});e.distance=g.length-1;g.update(.1);
  assert.equal(g.lives,g.maxLives);assert.equal(g.available(145),false);assert.equal(g.pendingReward,null);assert.equal(g.bossesDefeated,0);assert.ok(g.events.some(e=>e.type==='visitorEscaped'));
});
test('defeated visitors are not caught if the Center falls before wave clear',()=>{
  const g=new Game();g.wave=4;g.status='wave';const rare=g.spawn({kind:63,visitor:true});g.hit(rare,9999);g.lives=1;
  const e=g.spawn(13);e.distance=g.length-1;g.update(.1);assert.equal(g.status,'lost');assert.equal(g.available(63),false);g.reset();assert.deepEqual(g.pendingRecruits,[]);
});
test('duplicate catches grant 75 coins, while a newly found shiny unlocks cosmetics instead',()=>{
  const g=new Game(),money=g.money;g.recruit(10);assert.equal(g.money,money);g.recruit(10);assert.equal(g.money,money+75);
  g.recruit(10,true);assert.equal(g.money,money+75);assert.equal(g.collection[10].shiny,true);assert.equal(g.collection[10].useShiny,true);
  g.recruit(10,true);assert.equal(g.money,money+150);assert.equal(g.collection[10].catches,4);
});
test('shiny chance is 10%, toggles survive saves, and cosmetic colors never change stats',()=>{
  assert.equal(rollVisitor(0,4,()=>.099).shiny,true);assert.equal(rollVisitor(0,4,()=>.1).shiny,false);
  const g=new Game();g.recruit(10,true);g.collectionPoints=50;assert.ok(g.purchasePartner(10));const t=g.place(10,0);assert.equal(t.shiny,true);const before=towerStats(t);g.setShiny(10,false);assert.equal(t.shiny,false);assert.deepEqual(towerStats(t),before);
  assert.equal(g.setShiny(25,true),false);const saved=loadCollection(JSON.stringify(g.collection));assert.equal(saved[10].shiny,true);assert.equal(saved[10].useShiny,false);
  const next=new Game(0,'normal',{collection:saved});assert.equal(next.place(10,0).shiny,false);next.setShiny(10,true);assert.equal(next.towers[0].shiny,true);
});
test('collection loading ignores corrupt data and species outside the recruitable Gen 1 set',()=>{
  for(const raw of ['bad','null','[]','"text"',null,{'133':true},{'133':{catches:'1'}}])assert.deepEqual(loadCollection(raw),{});
  assert.deepEqual(loadCollection({251:{catches:1},26:{catches:1},133:{catches:2,shiny:false,useShiny:true}}),{133:{catches:2,shiny:false,useShiny:false}});
});

test('finding a shiny updates an already placed partner and its evolving form immediately',()=>{
  const g=new Game();g.recruit(10);g.collectionPoints=50;assert.ok(g.purchasePartner(10));const t=g.place(10,0);g.gainXP(t,40);g.upgrade(t.id,'tempest');
  assert.equal(t.shiny,false);g.recruit(10,true);
  assert.equal(t.shiny,true);assert.equal(g.effects.find(e=>e.type==='evolve').previousActor.shiny,true);
  g.setShiny(10,false);assert.equal(t.shiny,false);assert.equal(g.effects.find(e=>e.type==='evolve').previousActor.shiny,false);
});

test('shiny choices survive placement, every evolution, recall, routes and collection reloads',()=>{
  for(const spec of TOWERS.filter(t=>COLLECTIBLE_IDS.includes(t.id)&&![150,151].includes(t.id))) {
    const g=new Game();g.recruit(spec.id,true);g.collectionPoints=partnerPrice(spec.id);assert.ok(g.purchasePartner(spec.id));
    for(let route=0;route<MAPS.length;route++)for(const branch of EVOLUTIONS[spec.id]) {
      g.reset(route);g.money=1000;const t=g.place(spec.id,0);assert.equal(t.shiny,true);
      g.gainXP(t,120);
      for(const level of [2,3]) {
        assert.ok(g.upgrade(t.id,branch.id));assert.equal(t.level,level);assert.equal(t.shiny,true);
        assert.equal(g.effects.filter(e=>e.type==='evolve').at(-1).previousActor.shiny,true);
      }
      g.sell(t.id);assert.equal(g.effects.at(-1).actor.shiny,true);
      assert.equal(g.place(spec.id,0).shiny,true);
    }
    const restored=new Game(2,'expert',{collection:loadCollection(JSON.stringify(g.collection))});restored.money=1000;
    assert.equal(restored.place(spec.id,0).shiny,true);
  }
});
