import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,MAPS,DIFFICULTIES,MAX_WAVES,towerStats,waveInfo,pointAt,routeLength,multiplier,evolutionOptions} from '../dist/game.mjs';
import {simulateRun} from '../scripts/balance-report.mjs';
const advance=(g,seconds)=>{for(let i=0;i<seconds*60;i++)g.update(1/60);};
test('placement, free XP evolutions and recall conserve coins',()=>{
  const g=new Game();assert.equal(g.place(25,-1),false);assert.equal(g.place(999,0),false);
  const t=g.place(25,0);assert.equal(g.money,230);assert.equal(g.place(1,0),false);
  assert.equal(g.upgrade(t.id,'storm'),false);g.gainXP(t,40);assert.equal(g.upgrade(t.id,'storm'),true);assert.equal(t.level,2);assert.equal(towerStats(t).sprite,26);assert.equal(g.money,230);
  assert.equal(g.upgrade(t.id),false);assert.equal(g.place(1,1).kind,1);assert.equal(g.place(1,2).kind,1);assert.equal(g.money,30);assert.equal(g.place(1,3),false);
  assert.equal(g.sell(t.id),true);assert.equal(g.money,121);assert.equal(g.sell(t.id),false);assert.equal(g.towers.length,2);
});
test('a fully trained defender cannot evolve again',()=>{const g=new Game();const t=g.place(1,0);g.gainXP(t,120);g.upgrade(t.id,'garden');g.upgrade(t.id);const balance=g.money;assert.equal(towerStats(t).sprite,3);assert.equal(g.upgrade(t.id),false);assert.equal(g.money,balance);});
test('all maps have clear placements off the route and a complete continuous path',()=>{
  for(const m of MAPS){assert.equal(m.pads.length,14);assert.ok(routeLength(m.path)>1600);assert.equal(pointAt(m.path,routeLength(m.path)).x,m.path.at(-1)[0]);
    for(const [x,y] of m.pads){for(let d=0;d<routeLength(m.path);d+=5){const p=pointAt(m.path,d);assert.ok(Math.hypot(p.x-x,p.y-y)>45,`${m.name}: pad ${x},${y} overlaps path`);}}
  }
});
test('type advantages and resistances change damage',()=>{assert.equal(multiplier('electric','flying'),1.6);assert.equal(multiplier('electric','ground'),.65);assert.equal(multiplier('normal','normal'),1);});
test('wave schedule has bosses on 5, 10 and 15 and forbids overlapping waves',()=>{const g=new Game();assert.equal(g.startWave(),true);assert.equal(g.startWave(),false);assert.equal(g.wave,1);assert.equal(g.queue.length,6);assert.equal(waveInfo(5).boss,95);assert.equal(waveInfo(10).boss,143);assert.equal(waveInfo(15).boss,149);assert.equal(waveInfo(4).boss,null);});
test('pause freezes spawning, movement, damage and effects',()=>{const g=new Game();g.place(25,0);g.startWave();advance(g,4);g.paused=true;const snapshot=JSON.stringify(g);advance(g,20);assert.equal(JSON.stringify(g),snapshot);});
test('water slows, grass poisons, fire splashes, and electric chains',()=>{
  for(const kind of [7,1,4,25]){const g=new Game();const t=g.place(kind,0);g.wave=1;const a=g.spawn(10),b=g.spawn(10);a.x=100;a.y=150;b.x=110;b.y=150;a.hp=a.maxHp=1000;b.hp=b.maxHp=1000;g.attack(t,a);
    assert.ok(a.hp<1000);if(kind===7)assert.equal(a.slow,1.8);if(kind===1)assert.ok(a.poisonDps>0);if(kind===4||kind===25)assert.ok(b.hp<1000);
  }
});
test('a catch rewards coins only once and awards poison kill credit',()=>{const g=new Game();const t=g.place(1,0);g.wave=1;const e=g.spawn(10);const money=g.money;g.hit(e,100,t);g.hit(e,100,t);assert.equal(g.kills,1);assert.equal(g.money,money+e.reward);assert.equal(t.kills,1);});
test('unprotected enemies leak hearts, bosses cost five, and defeat stops the simulation',()=>{
  const g=new Game();g.status='wave';g.wave=5;const e=g.spawn(95);e.distance=g.length-1;g.update(.1);assert.equal(g.lives,15);
  g.status='wave';g.lives=1;const b=g.spawn(10);b.distance=g.length-1;g.update(.1);assert.equal(g.status,'lost');assert.equal(g.lives,0);const before=JSON.stringify(g);advance(g,5);assert.equal(JSON.stringify(g),before);assert.equal(g.place(1,0),false);
});
test('a modest starting team clears the first wave and earns a wave bonus',()=>{
  const g=new Game();g.place(25,0);g.place(1,3);g.place(4,6);g.startWave();advance(g,100);assert.equal(g.status,'build');assert.equal(g.wave,1);assert.equal(g.lives,20);assert.equal(g.kills,waveInfo(1).count);assert.ok(g.events.some(e=>e.type==='clear'));
});
test('the final wave ends in victory exactly once',()=>{const g=new Game();g.wave=MAX_WAVES-1;g.startWave();g.queue=[];g.update(.1);assert.equal(g.status,'won');assert.equal(g.events.filter(e=>e.type==='won').length,1);g.update(.1);assert.equal(g.events.filter(e=>e.type==='won').length,1);assert.equal(g.startWave(),false);});
test('route reset clears all combat state and restores the economy',()=>{const g=new Game();g.place(25,0);g.startWave();advance(g,2);g.reset(2);assert.equal(g.money,360);assert.equal(g.lives,20);assert.equal(g.wave,0);assert.equal(g.map,MAPS[2]);assert.equal(g.towers.length,0);assert.equal(g.enemies.length,0);assert.equal(g.queue.length,0);assert.equal(g.events.length,0);assert.equal(g.status,'build');});
test('all twelve route and difficulty combinations can be completed using earned resources',()=>{
  for(const difficulty of DIFFICULTIES)for(let map=0;map<MAPS.length;map++){
    const run=simulateRun(map,difficulty.id),label=`${run.map}, ${difficulty.name}`;
    assert.equal(run.status,'won',label);assert.ok(run.hearts>0,label);
    assert.ok(run.rows.every(w=>w.startCoins>=0&&w.endCoins>=0),label);
    assert.equal(run.rows[4].bosses,1,`${label}: first boss should be catchable with the starter team`);
    assert.equal(run.firstEvolution[0],3,`${label}: first evolution pacing`);
    assert.ok(run.finalEvolution[0]>=6&&run.finalEvolution[0]<=8,`${label}: final evolution pacing`);
  }
});
