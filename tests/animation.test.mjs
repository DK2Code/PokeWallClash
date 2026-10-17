import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,TOWERS,ENEMIES,EVOLUTIONS,pointAt,towerStats,multiplier} from '../dist/game.mjs';
import {DIRECTIONAL} from '../dist/directional-data.mjs';
import {spriteSample,directionRow,muzzlePosition,attackTiming} from '../dist/sprite-animation.mjs';
const advance=(game,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)game.update(1/60);};

test('every defender, evolution and enemy has complete usable animation sheets',()=>{
  const species=new Set([...TOWERS.flatMap(t=>t.stages),...Object.values(EVOLUTIONS).flat().map(b=>b.species).filter(Boolean),...Object.keys(ENEMIES).map(Number)]);
  for(const id of species){assert.ok(DIRECTIONAL[id],`Missing species ${id}`);
    for(const state of ['Idle','Walk','Attack','Shoot','Charge','Hurt','Sleep']){
      const meta=DIRECTIONAL[id].states[state],png=readFileSync(new URL(`../dist/assets/directional/${meta.file}`,import.meta.url));
      assert.equal(png.readUInt32BE(16),meta.width*meta.frames,`${id} ${state} width`);assert.equal(png.readUInt32BE(20),meta.height*meta.directions,`${id} ${state} height`);
      assert.equal(meta.durations.length,meta.frames);assert.ok(meta.durations.every(d=>d>0));
      assert.equal(meta.anchors.length,meta.directions);assert.equal(meta.heads.length,meta.directions);
      for(let row=0;row<meta.directions;row++){assert.equal(meta.anchors[row].length,meta.frames);assert.equal(meta.heads[row].length,meta.frames);for(const [x,y] of [...meta.anchors[row],...meta.heads[row]])assert.ok(x>=0&&x<meta.width&&y>=0&&y<meta.height);}
    }
  }
});
test('all eight facings match Arena sheets and route turns face the movement direction',()=>{
  for(const [angle,row] of [[0,2],[Math.PI/4,1],[Math.PI/2,0],[Math.PI*3/4,7],[Math.PI,6],[-Math.PI*3/4,5],[-Math.PI/2,4],[-Math.PI/4,3]])assert.equal(directionRow(angle),row);
  const g=new Game();g.status='wave';g.wave=1;const e=g.spawn(10);e.distance=228+10;g.update(1/60);assert.equal(spriteSample(e,g.time).row,0);
  e.distance=228+235+263+10;g.update(1/60);assert.equal(spriteSample(e,g.time).row,4);
});
test('idle, movement, damage and capture select distinct timed poses',()=>{
  const actor={id:1,species:81,x:0,y:0,lookAngle:0};assert.equal(spriteSample(actor).state,'Idle');
  const walking={...actor,moving:true,walkDistance:0};assert.equal(spriteSample(walking).state,'Walk');assert.notEqual(spriteSample(walking).frame,spriteSample({...walking,walkDistance:12}).frame);
  assert.equal(spriteSample({...walking,hitRemaining:.16}).state,'Hurt');assert.equal(spriteSample({...actor,fainted:true}).state,'Sleep');
  for(const id of Object.keys(DIRECTIONAL)){const poses=new Set(Array.from({length:40},(_,i)=>{const s=spriteSample({species:Number(id)},i/20);return `${s.frame}:${s.idleBob}`;}));assert.ok(poses.size>1,`${id} idle should animate`);}
});
test('attack windup, release and recovery use the matching sprite frames',()=>{
  for(const t of TOWERS){for(const species of new Set(t.stages)){
    const timing=attackTiming(t.rate,t.type),actor={species,level:1,cast:{...timing,angle:0,age:timing.windup*.4,released:false}};
    const early=spriteSample(actor);assert.ok(early.frame<Math.max(1,early.meta.hit));
    actor.cast.age=timing.windup;actor.cast.released=true;const fire=spriteSample(actor);assert.equal(fire.frame,Math.max(1,Math.min(fire.meta.hit,fire.meta.frames-2)));
    actor.cast.age=timing.duration-.001;const recovery=spriteSample(actor);assert.ok(recovery.frame>=Math.min(recovery.meta.recover,recovery.meta.frames-1));
  }}
});
test('attacks originate from the head on the side the defender faces',()=>{
  for(const angle of [0,Math.PI]){const actor={species:81,level:1,x:300,y:200,cast:{...attackTiming(.8,'electric'),age:.16,angle,released:true}};const muzzle=muzzlePosition(actor);assert.equal(Math.sign(muzzle.x-actor.x),angle===0?1:-1);assert.ok(Number.isFinite(muzzle.y));}
});
test('windup delays damage until the release pose and applies it once',()=>{
  const g=new Game();const t=g.place(25,0);g.wave=1;g.status='wave';const e=g.spawn(10);e.distance=100;Object.assign(e,pointAt(g.map.path,100));e.hp=e.maxHp=1000;
  g.beginAttack(t,e);assert.equal(e.hp,1000);advance(g,.1);assert.equal(e.hp,1000);advance(g,.1);
  assert.equal(e.hp,1000-towerStats(t).damage*multiplier('electric','bug'));assert.ok(t.cast.released);const health=e.hp;advance(g,.15);assert.equal(e.hp,health);
  assert.ok(g.shots.some(s=>s.type==='electric'));
});
test('a defeated windup target is replaced without damaging its corpse',()=>{
  const g=new Game();const t=g.place(7,0);g.wave=1;g.status='wave';const a=g.spawn(10),b=g.spawn(13);
  for(const e of [a,b]){e.distance=100;Object.assign(e,pointAt(g.map.path,100));e.hp=e.maxHp=1000;}
  g.beginAttack(t,a);a.hp=0;advance(g,.2);assert.equal(a.hp,0);assert.ok(b.hp<1000);assert.ok(b.slow>0);
});
test('pause freezes casts, walk frames, transition effects and the shared animation clock',()=>{
  const g=new Game();g.place(25,0);g.startWave();advance(g,2);g.paused=true;
  const before=JSON.stringify(g),frame=spriteSample(g.enemies[0],g.time);advance(g,20);assert.equal(JSON.stringify(g),before);assert.deepEqual(spriteSample(g.enemies[0],g.time),frame);
});
test('poison ticks do not keep an enemy permanently in the hurt pose',()=>{
  const g=new Game();const t=g.place(1,0);g.wave=1;g.status='wave';const e=g.spawn(74);e.distance=900;Object.assign(e,pointAt(g.map.path,900));e.hp=1000;g.attack(t,e);assert.ok(e.hitRemaining>0);advance(g,.4);assert.equal(e.hitRemaining,0);assert.ok(e.poison>0);assert.equal(spriteSample(e,g.time).state,'Walk');
});
test('defeat, capture, evolution and recall effects expire without keeping actors alive',()=>{
  const g=new Game();const t=g.place(1,0);assert.ok(g.effects.some(e=>e.type==='summon'));g.gainXP(t,40);g.upgrade(t.id,'garden');assert.equal(t.species,2);assert.ok(g.effects.some(e=>e.type==='evolve'));g.sell(t.id);assert.ok(g.effects.some(e=>e.type==='recall'));
  const enemy=g.spawn(10);g.hit(enemy,1000);assert.ok(g.effects.some(e=>e.type==='defeat'));assert.ok(!g.effects.some(e=>e.type==='capture'));
  g.recruit(131,true,{x:300,y:200});assert.ok(g.effects.some(e=>e.type==='capture'&&e.actor.shiny));
  advance(g,1.2);assert.equal(g.effects.length,0);assert.equal(g.towers.length,0);
});
test('reduced motion keeps frame selection stable without changing orientation',()=>{
  const actor={species:81,level:1,lookAngle:Math.PI,moving:true,walkDistance:4};const a=spriteSample(actor,0,true),b=spriteSample({...actor,walkDistance:100},9,true);assert.equal(a.frame,b.frame);assert.equal(a.row,6);assert.equal(b.row,6);
});

test('single-frame idle sprites breathe without moving attack poses or reduced-motion previews',()=>{
  for(const species of [53,59]){
    assert.notEqual(spriteSample({species},0).idleBob,spriteSample({species},.5).idleBob);
    assert.equal(spriteSample({species},.5,true).idleBob,0);
    assert.equal(spriteSample({species,fainted:true},.5).idleBob,0);
    assert.equal(spriteSample({species,cast:{...attackTiming(1,'normal'),age:.1,angle:0}},.5).idleBob,0);
  }
});
