import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,STARTER_IDS,MAPS,DIFFICULTIES,XP_THRESHOLDS,XP_RULES,waveInfo,xpProgress,towerStats} from '../dist/game.mjs';

test('starting budgets support a deliberate opening without buying all four unique starters',()=>{
  const costs=TOWERS.filter(t=>STARTER_IDS.includes(t.id)).map(t=>t.cost);
  assert.deepEqual(DIFFICULTIES.map(d=>d.coins),[425,360,330,300]);
  for(const d of DIFFICULTIES){assert.ok(d.coins<costs.reduce((a,b)=>a+b));assert.ok(d.coins>=Math.max(...costs)*2);}
  assert.ok(new Game().money>=100+125+130);
});
test('the opening introduces types gradually and reaches normal scaling after wave 5',()=>{
  assert.deepEqual([1,2,3,4,5].map(w=>waveInfo(w).count),[6,8,10,13,17]);
  assert.deepEqual(waveInfo(1).pool,[10]);assert.deepEqual(waveInfo(2).pool,[10,13]);
  assert.ok(waveInfo(3).pool.includes(19));assert.equal(waveInfo(3).pool.includes(16),false);
  assert.ok(waveInfo(4).pool.includes(16));assert.ok(waveInfo(5).pool.includes(27));assert.equal(waveInfo(5).pool.includes(41),false);
  assert.ok(waveInfo(6).pool.includes(41));assert.equal(waveInfo(6).health,1);assert.equal(waveInfo(6).bounty,1);
  for(const d of DIFFICULTIES){let lastCount=0,lastHealth=0,lastInterval=Infinity;
    for(let w=1;w<=6;w++){const info=waveInfo(w,d.id);assert.ok(info.count>lastCount);assert.ok(info.health>=lastHealth);assert.ok(info.interval<=lastInterval);lastCount=info.count;lastHealth=info.health;lastInterval=info.interval;}
    const g=new Game(0,d.id);g.wave=4;g.startWave();assert.equal(g.queue.at(-1),95);
  }
});
test('all six starter pairs can defend the first Normal wave on every route',()=>{
  for(let map=0;map<MAPS.length;map++)for(let a=0;a<STARTER_IDS.length;a++)for(let b=a+1;b<STARTER_IDS.length;b++){
    const g=new Game(map);g.place(STARTER_IDS[a],0);g.place(STARTER_IDS[b],3);g.startWave();
    for(let ticks=0;g.status==='wave'&&ticks<30*100;ticks++)g.update(1/30);
    assert.equal(g.status,'build');assert.equal(g.lives,g.maxLives,`${g.map.name}: ${STARTER_IDS[a]} + ${STARTER_IDS[b]}`);
  }
});
test('a clean first wave funds another basic partner even after buying the 355-coin opening',()=>{
  const g=new Game();g.place(25,0);g.place(1,3);g.place(4,6);g.startWave();
  for(let ticks=0;g.status==='wave'&&ticks<30*100;ticks++)g.update(1/30);
  assert.equal(g.money,119);assert.ok(g.place(7,8));assert.ok(g.towers.every(t=>t.level===1&&!xpProgress(t).ready));
});
test('combat XP is capped per partner and resets each wave without changing total XP',()=>{
  const g=new Game(),a=g.place(25,0),b=g.place(1,1);g.startWave();
  for(let i=0;i<10;i++){const e=g.spawn(10);g.hit(e,1,a);g.hit(e,10000,b);}
  assert.equal(a.xp,12);assert.equal(b.xp,12);assert.equal(a.combatXP,12);assert.equal(b.combatXP,12);
  g.queue=[];g.update(.01);assert.equal(a.xp,18);assert.equal(b.xp,18);g.startWave();assert.equal(a.combatXP,0);assert.equal(a.xp,18);
  const e=g.spawn(10);g.hit(e,10000,a);assert.equal(a.xp,20);
});
test('wave-clear XP reaches quiet defenders, excludes mid-wave recruits, and pays only once',()=>{
  const g=new Game(),a=g.place(25,0),guard=g.place(1,13);g.startWave();const late=g.place(7,8);
  g.queue=[];g.update(.01);assert.equal(a.xp,6);assert.equal(guard.xp,6);assert.equal(late.xp,0);g.update(.1);assert.equal(guard.xp,6);
  g.startWave();g.queue=[];g.update(.01);assert.equal(late.xp,6);
});
test('neither unfinished attacks nor failed waves farm XP',()=>{
  const g=new Game(),t=g.place(25,0);g.startWave();const target=g.spawn(95);target.hp=1000000;
  for(let i=0;i<100;i++)g.attack(t,target);assert.equal(t.xp,0);
  g.lives=1;target.distance=g.length-1;g.update(.1);assert.equal(g.status,'lost');assert.equal(t.xp,0);
});
test('boss contribution XP pays outside the combat cap and only once',()=>{
  const g=new Game(),t=g.place(25,0);g.wave=4;g.startWave();
  for(let i=0;i<6;i++){const e=g.spawn(10);g.hit(e,10000,t);}assert.equal(t.xp,12);
  const boss=g.spawn(95);g.hit(boss,10000,t);assert.equal(t.xp,20);g.hit(boss,10000,t);assert.equal(t.xp,20);
  g.queue=[];g.update(.01);assert.equal(t.xp,26);
});
test('no regular opening wave can cause an instant evolution or a two-wave max level',()=>{
  const maximumTwoWaves=2*(XP_RULES.combatCap+XP_RULES.clear);
  assert.ok(maximumTwoWaves<XP_THRESHOLDS[1]);assert.ok(XP_THRESHOLDS[1]<XP_THRESHOLDS[2]);
  const g=new Game(),t=g.place(25,0);g.gainXP(t,maximumTwoWaves);assert.equal(g.upgrade(t.id,'storm'),false);
});
test('weaker new partners cannot overwrite stronger poison or slowing effects',()=>{
  for(const [kind,branch] of [[1,'garden'],[7,'current']]){
    const g=new Game(),trained=g.place(kind,0),newcomer=g.place(kind,1);g.gainXP(trained,40);g.upgrade(trained.id,branch);g.wave=5;
    const target=g.spawn(95);target.hp=100000;g.attack(trained,target);
    if(kind===1){const power=target.poisonDps;target.poison=2;g.attack(newcomer,target);assert.equal(target.poisonDps,power);assert.equal(target.poison,2);assert.equal(target.poisonOwner,trained);target.poison=0;g.attack(newcomer,target);assert.equal(target.poisonOwner,newcomer);assert.equal(target.poisonDps,towerStats(newcomer).damage*towerStats(newcomer).poisonPower);}
    else{target.slow=2;g.attack(newcomer,target);assert.equal(target.slowFactor,.5);assert.equal(target.slow,2);target.slow=0;g.attack(newcomer,target);assert.equal(target.slowFactor,.62);}
  }
});
