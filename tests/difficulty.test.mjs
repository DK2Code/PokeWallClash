import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,DIFFICULTIES,ENEMIES,waveInfo,towerStats,rewardOptions} from '../dist/game.mjs';
import {loadRecords,recordKey,recordRun} from '../dist/records.mjs';

test('exactly four starters are available and other species require a collection unlock',()=>{
  const g=new Game();assert.deepEqual(TOWERS.filter(t=>g.available(t.id)).map(t=>t.id),[1,4,7,25]);
  for(const spec of TOWERS){const run=new Game(),t=run.place(spec.id,0);if([1,4,7,25].includes(spec.id)){assert.equal(t.species,spec.id);assert.equal(t.level,1);assert.equal(t.xp,0);}else assert.equal(t,false);}
  for(const evolved of [26,82,2,3,5,6,8,9,11,12,134,135,136])assert.equal(g.place(evolved,0),false);
});
test('Caterpie grows through Metapod before Butterfree and learns moves appropriate to each stage',()=>{
  for(const branch of ['tempest','air']){const g=new Game(0,'normal',{collection:{10:{catches:1}}}),t=g.place(10,0);g.wave=1;const target=g.spawn(19);target.hp=1000;
    assert.equal(towerStats(t).type,'bug');assert.equal(towerStats(t).move,'String Shot');g.attack(t,target);assert.equal(target.slowFactor,.82);assert.equal(target.slow,1.2);
    g.gainXP(t,120);assert.ok(g.upgrade(t.id,branch));assert.equal(t.species,11);assert.equal(towerStats(t).name,'Metapod');assert.equal(towerStats(t).type,branch==='tempest'?'bug':'normal');assert.equal(towerStats(t).move,branch==='tempest'?'Bug Bite':'Tackle');
    assert.ok(g.upgrade(t.id));assert.equal(t.species,12);assert.equal(towerStats(t).name,'Butterfree');assert.equal(towerStats(t).type,branch==='tempest'?'bug':'flying');assert.equal(towerStats(t).slowTime,0);assert.equal(towerStats(t).move,branch==='tempest'?'Bug Buzz':'Gust');
  }
});
test('difficulty scales resources, health, speed, crowd size and spawn cadence in the simulation',()=>{
  let previous;
  for(const d of DIFFICULTIES){const g=new Game(0,d.id);assert.equal(g.money,d.coins);assert.equal(g.lives,d.hearts);assert.equal(g.maxLives,d.hearts);
    g.startWave();assert.equal(g.queue.length,waveInfo(1,d.id).count);g.update(.1);g.update(.1);g.update(.1);g.update(.1);g.update(.1);g.update(.01);
    const e=g.enemies[0];assert.equal(e.maxHp,Math.round(ENEMIES[e.kind].hp*d.health*waveInfo(1,d.id).health));assert.equal(e.speed,ENEMIES[e.kind].speed*d.speed);
    assert.ok(Math.abs(g.spawnTimer-waveInfo(1,d.id).interval)<.02);
    const current={money:g.money,hearts:g.maxLives,hp:d.health,speed:d.speed,count:waveInfo(10,d.id).count};
    if(previous){assert.ok(current.money<previous.money);assert.ok(current.hearts<previous.hearts);assert.ok(current.hp>previous.hp);assert.ok(current.speed>previous.speed);assert.ok(current.count>previous.count);}previous=current;
  }
});
test('every mode and map uses its selected difficulty and retains exactly one scheduled boss',()=>{
  for(const d of DIFFICULTIES)for(let map=0;map<3;map++)for(const [wave,boss] of [[5,95],[10,143],[15,149]]){
    const g=new Game(map,d.id);g.wave=wave-1;g.startWave();assert.equal(g.queue.length,waveInfo(wave,d.id).count);assert.equal(g.queue.filter(k=>k===boss).length,1);
    assert.equal(g.spawn(boss).maxHp,Math.round(ENEMIES[boss].hp*(1+(wave-1)*.21)*d.health*.65));
  }
});
test('reset preserves the selected mode and explicit mode changes start a clean run',()=>{
  const g=new Game(2,'expert');g.place(25,0);g.startWave();g.powerCharms=1;g.reset(1);
  assert.equal(g.difficulty.id,'expert');assert.equal(g.money,300);assert.equal(g.maxLives,10);assert.equal(g.mapIndex,1);assert.equal(g.towers.length,0);assert.equal(g.wave,0);assert.equal(g.powerCharms,0);
  g.reset(1,'easy');assert.equal(g.money,425);assert.equal(g.lives,25);assert.equal(g.maxLives,25);assert.equal(g.pendingReward,null);
  g.reset(0,'bad-mode');assert.equal(g.difficulty.id,'normal');
});
test('supplies respect each difficulty heart cap and describe the correct cap',()=>{
  for(const d of DIFFICULTIES){const g=new Game(0,d.id);g.lives=d.hearts-2;g.pendingReward={wave:5,boss:95};g.claimReward('supplies');assert.equal(g.lives,d.hearts);assert.ok(rewardOptions(5,g.maxLives).find(r=>r.id==='supplies').description.includes(`${d.hearts} hearts`));}
});
test('old bests migrate to Normal without overwriting new records or leaking into other difficulties',()=>{
  const old={0:{wave:5,score:16006,won:false},1:{wave:15,score:30000,won:true},'1:normal':{wave:15,score:45000,won:true}};
  const records=loadRecords(JSON.stringify(old));assert.deepEqual(records['0:normal'],old[0]);assert.deepEqual(records['1:normal'],old['1:normal']);assert.equal(records['0:easy'],undefined);assert.equal(records['0:expert'],undefined);assert.deepEqual(records[0],old[0]);
});
test('records are isolated by map and difficulty and never reduce a personal best',()=>{
  let records={};const g=new Game(0,'easy');g.wave=15;g.score=1000;g.status='won';records=recordRun(records,g);
  g.reset(0,'expert');g.wave=4;g.score=400;records=recordRun(records,g);g.reset(1,'expert');g.wave=2;g.score=200;records=recordRun(records,g);
  assert.deepEqual(records[recordKey(0,'easy')],{wave:15,score:1000,won:true});assert.deepEqual(records[recordKey(0,'expert')],{wave:4,score:400,won:false});assert.deepEqual(records[recordKey(1,'expert')],{wave:2,score:200,won:false});
  g.reset(0,'easy');records=recordRun(records,g);assert.equal(records['0:easy'].score,1000);assert.equal(records['0:easy'].won,true);
});
test('malformed local records cannot break loading the game',()=>{
  for(const raw of ['bad json','[]','null','"hello"','{"0":{"wave":"bad","score":5}}'])assert.deepEqual(loadRecords(raw),{});
});
