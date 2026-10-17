import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,EVOLUTIONS,towerStats,xpProgress,waveInfo} from '../dist/game.mjs';

function bossClear(wave=5){
  const g=new Game();g.wave=wave-1;g.place(25,0);g.startWave();g.queue=[];
  const boss=g.spawn(wave===5?95:wave===10?143:149);g.hit(boss,boss.hp,g.towers[0]);g.update(.01);return g;
}
test('catch helpers receive equal XP once, without attack, corpse or poison-tick farming',()=>{
  const g=new Game(),a=g.place(25,0),b=g.place(1,1);g.wave=1;
  const enemy=g.spawn(10);enemy.hp=1000;g.attack(a,enemy);assert.equal(a.xp,0);
  g.hit(enemy,1,b,false);assert.equal(b.xp,0);g.hit(enemy,2000,b,false);
  assert.equal(a.xp,2);assert.equal(b.xp,2);
  g.hit(enemy,2000,b);g.attack(a,enemy);assert.equal(a.xp,2);assert.equal(b.xp,2);
});
test('XP gates evolution, banks overflow, caps at 120 and emits readiness once per level',()=>{
  const g=new Game(),t=g.place(25,0);g.gainXP(t,39.5);assert.equal(xpProgress(t).ready,false);assert.equal(g.upgrade(t.id,'storm'),false);
  g.gainXP(t,.5);assert.equal(xpProgress(t).ready,true);g.gainXP(t,100);assert.equal(t.xp,120);
  assert.equal(g.events.filter(e=>e.type==='ready').length,1);assert.equal(g.upgrade(t.id,'storm'),true);
  assert.equal(g.events.filter(e=>e.type==='ready').length,2);assert.equal(xpProgress(t).ready,true);
  assert.equal(g.upgrade(t.id),true);assert.equal(xpProgress(t).ready,false);g.gainXP(t,100);assert.equal(t.xp,120);
});
test('paths must be valid, are locked after choosing and need no coins',()=>{
  const g=new Game(),t=g.place(4,0);g.gainXP(t,120);g.money=0;
  assert.equal(g.upgrade(t.id),false);assert.equal(g.upgrade(t.id,'vaporeon'),false);assert.equal(t.branch,null);
  assert.equal(g.upgrade(t.id,'flame'),true);assert.equal(g.upgrade(t.id,'blast'),false);assert.equal(t.species,5);
  assert.equal(g.upgrade(t.id,'flame'),true);assert.equal(t.species,6);assert.equal(g.money,0);assert.equal(t.spent,125);
});
test('every choice produces a distinct combat specialization and a valid level 3',()=>{
  assert.ok(Object.values(EVOLUTIONS).flat().length>=13);
  for(const base of TOWERS){const profiles=[];for(const branch of EVOLUTIONS[base.id]){
    const g=new Game(0,'normal',{collection:{[base.id]:{catches:1}}}),t=g.place(base.id,0);g.gainXP(t,120);assert.ok(g.upgrade(t.id,branch.id));const s=towerStats(t);
    profiles.push(JSON.stringify([s.damage,s.range,s.rate,s.type,s.splash,s.chain,s.slowFactor,s.poisonPower]));
    assert.equal(s.move,branch.moves?.[1]||branch.move);assert.ok(g.upgrade(t.id));assert.ok(towerStats(t).damage>s.damage);assert.equal(t.branch,branch.id);
  }assert.equal(new Set(profiles).size,profiles.length);}
});
test('Eevee stones change species, elemental damage and the actual attack effect',()=>{
  for(const [branch,species,type] of [['vaporeon',134,'water'],['jolteon',135,'electric'],['flareon',136,'fire']]){
    const g=new Game(0,'normal',{collection:{133:{catches:1}}}),t=g.place(133,0);g.gainXP(t,40);g.upgrade(t.id,branch);assert.equal(t.species,species);assert.equal(towerStats(t).type,type);
    g.wave=1;const a=g.spawn(10),b=g.spawn(10);for(const e of [a,b]){e.hp=1000;e.x=100;e.y=150;}
    g.attack(t,a);assert.equal(g.shots[0].type,type);
    if(type==='water')assert.ok(a.slow>0);else assert.ok(b.hp<1000);
  }
});
test('chain path hits three extra targets; focused path gives up the chain',()=>{
  for(const branch of ['storm','bolt']){const g=new Game(),t=g.place(25,0);g.gainXP(t,40);g.upgrade(t.id,branch);g.wave=1;
    const targets=Array.from({length:5},(_,i)=>{const e=g.spawn(10);e.x=100+i*10;e.y=150;e.hp=1000;return e;});g.attack(t,targets[0]);
    assert.equal(targets.filter(e=>e.hp<1000).length,branch==='storm'?4:1);
  }
});
test('captured boss offers one reward only after the whole wave clears',()=>{
  const g=new Game();g.wave=4;g.startWave();const boss=g.spawn(95);g.hit(boss,boss.hp);
  assert.equal(g.pendingReward,null);g.update(.01);assert.equal(g.pendingReward,null);
  g.queue=[];g.enemies=[];g.update(.01);assert.equal(g.pendingReward.wave,5);assert.equal(g.startWave(),false);
  assert.equal(g.claimReward('invalid'),false);assert.ok(g.pendingReward);assert.equal(g.claimReward('supplies'),true);
  const money=g.money;assert.equal(g.claimReward('supplies'),false);assert.equal(g.money,money);assert.equal(g.startWave(),true);
});
test('an escaped boss offers no reward',()=>{
  const g=new Game();g.wave=4;g.startWave();g.queue=[];const boss=g.spawn(95);boss.distance=g.length-.1;g.update(.1);
  assert.equal(g.status,'build');assert.equal(g.pendingReward,null);assert.equal(g.bossesDefeated,0);assert.equal(g.lives,15);
});
test('picnic gives exactly 20 XP to current partners and cannot be claimed twice',()=>{
  const g=bossClear(),t=g.place(133,1);assert.equal(t.xp,0);assert.ok(g.claimReward('picnic'));assert.equal(t.xp,20);assert.equal(xpProgress(t).ready,false);
  assert.equal(g.claimReward('picnic'),false);assert.equal(t.xp,20);assert.equal(g.place(1,2).xp,0);
});
test('power charms stack and also boost newly recruited partners',()=>{
  const g=bossClear(),t=g.towers[0],before=towerStats(t).damage;g.claimReward('charm');assert.equal(t.teamPower,1.12);assert.ok(towerStats(t).damage>before);
  assert.equal(g.place(133,1).teamPower,1.12);g.pendingReward={wave:10,boss:143};g.claimReward('charm');assert.equal(t.teamPower,1.24);
  assert.equal(g.place(1,2).teamPower,1.24);
});
test('supplies restore up to 20 hearts and use the matching boss reward amount',()=>{
  for(const [wave,coins] of [[5,250],[10,400]]){const g=bossClear(wave);g.lives=18;const money=g.money;assert.ok(g.claimReward('supplies'));assert.equal(g.money,money+coins);assert.equal(g.lives,20);}
});
test('final boss grants victory bonus without leaving an unusable reward choice',()=>{
  const g=bossClear(15);assert.equal(g.status,'won');assert.equal(g.pendingReward,null);assert.equal(g.bossesDefeated,1);
  const dragoniteHp=Math.round(3300*(1+14*.21)*.65);
  assert.equal(g.score,dragoniteHp*2+waveInfo(15).reward*5+1000);assert.equal(g.claimReward('charm'),false);assert.equal(g.events.filter(e=>e.type==='won').length,1);
});
test('recall and reset discard progress and reward bonuses without refund exploits',()=>{
  const g=bossClear();g.claimReward('charm');const t=g.towers[0];g.gainXP(t,120);g.upgrade(t.id,'storm');g.upgrade(t.id);
  const before=g.money;g.sell(t.id);assert.equal(g.money-before,91);g.gainXP(t,20);const replacement=g.place(25,0);assert.equal(replacement.xp,0);assert.equal(replacement.branch,null);
  g.reset(1);assert.equal(g.powerCharms,0);assert.equal(g.pendingReward,null);assert.deepEqual(g.rewardHistory,[]);assert.equal(g.bossesDefeated,0);assert.equal(g.place(25,0).teamPower,1);
});
