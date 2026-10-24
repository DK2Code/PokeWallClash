import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,MAPS,DIFFICULTIES,INTERMISSION_SECONDS} from '../dist/game.mjs';
import {AdminTesting} from '../dist/admin-testing.mjs';

function clearWave(g,wave=1){
  g.wave=wave;g.status='wave';g.queue=[];g.enemies=[];g.update(.01);
}
function preparedGame(){const g=new Game();g.place(1,0);clearWave(g);return g;}

test('wave 1 stays manual and a clear starts a full twenty-second preparation period',()=>{
  const g=new Game();g.place(1,0);
  assert.equal(g.nextWaveIn,null);assert.equal(g.advanceIntermission(100),false);assert.equal(g.wave,0);
  clearWave(g);assert.equal(g.nextWaveIn,20);assert.equal(g.status,'build');
  assert.equal(g.advanceIntermission(19),false);assert.equal(g.nextWaveIn,1);
  assert.ok(g.advanceIntermission(1));assert.equal(g.status,'wave');assert.equal(g.wave,2);assert.equal(g.nextWaveIn,null);
  assert.equal(g.advanceIntermission(100),false);assert.equal(g.wave,2);
});

test('preparation duration is independent of battle speed and difficulty on every route',()=>{
  for(const route of MAPS.keys())for(const difficulty of DIFFICULTIES)for(const speed of [1,2,3]){
    const g=new Game(route,difficulty.id);g.place(1,0);clearWave(g);
    for(let frame=0;frame<50;frame++){
      g.advanceIntermission(.1);
      for(let step=0;step<speed;step++)g.update(.1);
    }
    assert.ok(Math.abs(g.nextWaveIn-15)<.00001);assert.equal(g.wave,1);
  }
});

test('pause and dialog or celebration blockers preserve the remaining time',()=>{
  const g=preparedGame();g.advanceIntermission(7);g.paused=true;
  assert.equal(g.advanceIntermission(100),false);assert.equal(g.nextWaveIn,13);
  g.paused=false;assert.equal(g.advanceIntermission(100,{blocked:true}),false);assert.equal(g.nextWaveIn,13);
  assert.ok(g.advanceIntermission(13));assert.equal(g.wave,2);
});

test('boss rewards hold the full countdown until a valid reward is chosen',()=>{
  for(const wave of [5,10]){
    const g=new Game();g.place(1,0);g.bossDefeated=true;clearWave(g,wave);
    assert.ok(g.pendingReward);assert.equal(g.nextWaveIn,20);
    assert.equal(g.advanceIntermission(100),false);assert.equal(g.startWave(),false);
    assert.equal(g.claimReward('invalid'),false);assert.equal(g.nextWaveIn,20);
    assert.ok(g.claimReward('supplies'));assert.equal(g.advanceIntermission(19),false);assert.ok(g.advanceIntermission(1));assert.equal(g.wave,wave+1);
  }
});

test('manual start skips the wait without any additional rewards or duplicate start',()=>{
  const g=preparedGame();g.advanceIntermission(6);g.paused=true;
  const before={money:g.money,points:g.collectionPoints,score:g.score,exchanges:g.savedExchanges,xp:g.towers[0].xp};
  assert.ok(g.startWave());assert.equal(g.paused,false);assert.equal(g.nextWaveIn,null);
  assert.deepEqual({money:g.money,points:g.collectionPoints,score:g.score,exchanges:g.savedExchanges,xp:g.towers[0].xp},before);
  assert.equal(g.advanceIntermission(20),false);assert.equal(g.startWave(),false);assert.equal(g.wave,2);
});

test('automatic start gives the same resources and pre-wave team participation as manual start',()=>{
  const g=preparedGame(),partner=g.place(4,1);
  const before={money:g.money,points:g.collectionPoints,score:g.score,exchanges:g.savedExchanges};
  assert.ok(g.advanceIntermission(INTERMISSION_SECONDS));
  assert.deepEqual({money:g.money,points:g.collectionPoints,score:g.score,exchanges:g.savedExchanges},before);
  assert.ok(g.wavePartners.has(partner.id));assert.equal(g.events.filter(e=>e.type==='wave').length,1);
});

test('an empty field waits for a partner instead of auto-starting undefended',()=>{
  const g=preparedGame();g.advanceIntermission(8);g.sell(g.towers[0].id);
  assert.equal(g.advanceIntermission(100),false);assert.equal(g.nextWaveIn,12);
  assert.ok(g.place(1,0));assert.ok(g.advanceIntermission(12));assert.equal(g.wave,2);
});

test('reset, terminal states and admin wave jumps cannot leave a stale automatic start',()=>{
  const g=preparedGame();g.reset(1,'hard');assert.equal(g.nextWaveIn,null);assert.equal(g.advanceIntermission(20),false);
  clearWave(g,15);assert.equal(g.status,'won');assert.equal(g.nextWaveIn,null);assert.equal(g.advanceIntermission(20),false);
  g.reset();g.place(1,0);clearWave(g);g.status='lost';assert.equal(g.advanceIntermission(20),false);
  const admin=new AdminTesting(),normal=preparedGame();normal.advanceIntermission(5);
  const testing=admin.enter('1234',normal);testing.prepareTestWave(14);assert.equal(testing.nextWaveIn,null);
  assert.equal(admin.exit(),normal);assert.equal(normal.nextWaveIn,15);assert.equal(normal.paused,false);
  assert.ok(normal.advanceIntermission(15));
});

test('invalid clock inputs cannot skip or extend the countdown',()=>{
  const g=preparedGame();
  for(const dt of [0,-1,NaN,Infinity,'20',null])assert.equal(g.advanceIntermission(dt),false);
  assert.equal(g.nextWaveIn,20);
});
