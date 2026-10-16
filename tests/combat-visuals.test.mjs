import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,TOWERS,evolutionOptions,towerStats,multiplier} from '../dist/game.mjs';
import {attackVisual} from '../dist/combat-visuals.mjs';
import {drawAttackShot,drawAttackImpact,drawAttackCharge} from '../dist/combat-art.mjs';
import {attackTiming,spriteSample,bodyOffset} from '../dist/sprite-animation.mjs';
import {MOVES} from '../dist/arena/moves.mjs';
import {LOADOUTS} from '../dist/arena/loadouts.mjs';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

function recordingCanvas(){
  const calls=[],stack=[];
  const context={globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){assert.ok(stack.length,'unbalanced restore');this.globalAlpha=stack.pop();}};
  for(const method of ['beginPath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','closePath','stroke','fill','ellipse','arc','translate','rotate','scale','fillRect','fillText','drawImage','setLineDash'])context[method]=(...args)=>{
    assert.ok(args.every(value=>typeof value!=='number'||Number.isFinite(value)),`${method} received invalid coordinates`);
    if(method==='ellipse')assert.ok(args[2]>=0&&args[3]>=0,'negative ellipse radius');
    calls.push([method,...args]);
  };
  for(const name of ['createLinearGradient','createRadialGradient'])context[name]=()=>({addColorStop(){}});
  return {context,calls,stack};
}
// Arena caches its fire texture on a canvas; no browser dependency in geometry tests.
globalThis.document={createElement:()=>({getContext:()=>recordingCanvas().context})};
function actorFor(kind,level,branch){const actor={kind,level,branch,x:50,y:80,lookAngle:0};actor.species=towerStats(actor).sprite;return actor;}

test('packaged Arena renderers and move data match their recorded source exactly',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../dist/arena/source.json',import.meta.url)));
  for(const [file,hash] of Object.entries(manifest.files)){
    const bytes=readFileSync(new URL(`../dist/arena/${file}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,file);
    const source=new URL(`../../pokemon-arena/dist/${file}`,import.meta.url);
    if(existsSync(source))assert.deepEqual(bytes,readFileSync(source),`${file} drifted from Arena`);
  }
});

test('every equipped move belongs to the exact Arena species and uses its pose, palette and effect',()=>{
  for(const base of TOWERS)for(const level of [1,2,3])for(const branch of level===1?[null]:evolutionOptions({kind:base.id}).map(b=>b.id)){
    const stats=towerStats(actorFor(base.id,level,branch)),v=attackVisual(stats,level,branch),move=MOVES[stats.moveId];
    assert.ok(LOADOUTS[stats.sprite].includes(move.slug),`${stats.name}: ${stats.move}`);
    assert.equal(v.arenaMove,move);assert.equal(v.pose,move.pose);assert.equal(v.color,move.color);assert.equal(v.light,move.core);assert.equal(v.style,move.visual);assert.equal(stats.type,move.element);
  }
});

test('each starter evolution path emits a different move and geometry from its basic attack',()=>{
  for(const kind of [1,4,7,25]){
    const styles=new Set(),geometries=new Set();
    for(const branch of [null,...evolutionOptions({kind}).map(b=>b.id)]){
      const level=branch?2:1,g=new Game();const t=g.place(kind,0);Object.assign(t,actorFor(kind,level,branch));g.wave=3;
      const e=g.spawn(95);e.x=150;e.y=90;e.hp=e.maxHp=10000;
      const s=towerStats(t),before=e.hp;g.beginAttack(t,e);g.attack(t,e);
      assert.ok(Math.abs(before-e.hp-s.damage*multiplier(s.type,e.type))<1e-8);
      const shot=g.shots[0];assert.equal(shot.visual.move,s.move);assert.equal(g.effects.at(-1).visual.style,shot.visual.style);
      assert.equal(t.cast.pose,shot.visual.pose);styles.add(shot.visual.style);
      const {context,calls,stack}=recordingCanvas();drawAttackShot(context,shot,.5);drawAttackImpact(context,g.effects.at(-1),.5);
      assert.equal(stack.length,0);assert.equal(context.globalAlpha,1);geometries.add(JSON.stringify(calls));
    }
    assert.equal(styles.size,3,`${kind}: base and both paths must differ`);assert.equal(geometries.size,3,`${kind}: distinct shapes must be drawn`);
  }
});

test('every partner and branch renders finite effects at both evolved levels and in reduced motion',()=>{
  for(const spec of TOWERS)for(const level of [1,2,3]){
    const branches=level===1?[null]:evolutionOptions({kind:spec.id}).map(b=>b.id);
    for(const branch of branches){
      const actor=actorFor(spec.id,level,branch),stats=towerStats(actor),visual=attackVisual(stats,level,branch),timing=attackTiming(stats.rate,stats.type,visual);
      actor.cast={...timing,visual,pose:visual.pose,age:timing.windup*.5,angle:0,released:false};
      assert.equal(spriteSample(actor).state,visual.pose);
      // Arena windup/recovery is fitted inside the established TD attack cadence.
      const g=new Game(0,'normal',{collection:{[spec.id]:{catches:1}}});g.money=1000;
      const placed=g.place(spec.id,0);Object.assign(placed,actorFor(spec.id,level,branch));g.beginAttack(placed,{id:99,x:150,y:80});
      assert.equal(placed.cast.windup,timing.windup);assert.equal(placed.cast.duration,timing.duration);assert.equal(placed.cooldown,stats.rate);
      for(const reduced of [false,true])for(const p of [0,.3,.9,1]){
        const {context,calls,stack}=recordingCanvas();
        drawAttackCharge(context,actor,{x:60,y:70},reduced);
        drawAttackShot(context,{x:60,y:70,tx:150,ty:100,visual,life:visual.shotDuration*(1-p),maxLife:visual.shotDuration},.8,reduced);
        drawAttackImpact(context,{x:150,y:100,visual,age:visual.impactDuration*p,duration:visual.impactDuration},.8,reduced);
        assert.ok(calls.length>0);assert.equal(stack.length,0);assert.equal(context.globalAlpha,1);
      }
    }
  }
});

test('level three has stronger visuals even for species that only train further',()=>{
  for(const kind of [25,81,131,144,145,146,133])for(const branch of evolutionOptions({kind})){
    const second=actorFor(kind,2,branch.id),third=actorFor(kind,3,branch.id);
    assert.ok(attackVisual(towerStats(third),3,branch.id).scale>attackVisual(towerStats(second),2,branch.id).scale);
    if(second.species===third.species)assert.ok(spriteSample(third).scale>spriteSample(second).scale);
  }
});

test('generic focused and crowd paths draw different geometry, with the actual splash footprint',()=>{
  for(const kind of [63,37,131,147,144,145,146]){
    const renders=[];
    for(const branch of ['focus','surge']){
      const stats=towerStats(actorFor(kind,2,branch)),visual=attackVisual(stats,2,branch),{context,calls}=recordingCanvas();
      assert.equal(visual.area,stats.splash);
      drawAttackShot(context,{x:0,y:0,tx:100,ty:0,visual,life:.2,maxLife:.34},0);
      drawAttackImpact(context,{x:100,y:0,visual,age:.1,duration:.44},0);renders.push(JSON.stringify(calls));
    }
    assert.notEqual(renders[0],renders[1]);
  }
});

test('chain visuals attach only to enemies that actually receive damage',()=>{
  const g=new Game();const t=g.place(25,0);g.gainXP(t,40);g.upgrade(t.id,'storm');g.effects=[];g.wave=4;
  const targets=[0,1,2,3,4].map(i=>{const e=g.spawn(10);e.x=200+i*30;e.y=100;e.hp=e.maxHp=1000;return e;});
  g.attack(t,targets[0]);assert.equal(g.shots.length,4);assert.equal(g.effects.filter(e=>e.type==='impact').length,4);
  assert.equal(g.shots.filter(s=>s.chain).length,3);assert.equal(targets[4].hp,1000);
  for(let i=0;i<4;i++){assert.equal(g.shots[i].tx,targets[i].x);assert.ok(targets[i].hp<1000);assert.equal(g.shots[i].visual.moveId,'thunder');}
});

test('physical moves lunge toward contact and recover to their clearing without moving the tower',()=>{
  for(const [kind,branch] of [[25,'bolt'],[4,'blast'],[10,'air'],[37,'focus']]){
    const actor=actorFor(kind,2,branch),stats=towerStats(actor),visual=attackVisual(stats,2,branch),timing=attackTiming(stats.rate,stats.type,visual);
    actor.cast={...timing,visual,angle:0,target:{x:200,y:80},age:0};
    assert.deepEqual(bodyOffset(actor),{x:0,y:0});
    actor.cast.age=timing.windup;assert.ok(bodyOffset(actor).x>30,stats.move);
    assert.deepEqual(bodyOffset(actor,true),{x:0,y:0});
    actor.cast.age=timing.duration;assert.ok(Math.abs(bodyOffset(actor).x)<.001);assert.equal(actor.x,50);
  }
});

test('evolution preserves the old form for its transition and announces the chosen move',()=>{
  const g=new Game();const t=g.place(4,0);g.gainXP(t,40);assert.ok(g.upgrade(t.id,'flame'));
  const e=g.effects.find(e=>e.type==='evolve');assert.equal(e.previousActor.species,4);assert.equal(e.previousActor.level,1);
  assert.equal(e.species,5);assert.equal(e.towerId,t.id);assert.equal(e.move,'Flamethrower');assert.equal(e.name,'Charmeleon');
  assert.equal(t.cast,null);assert.equal(g.money,235);assert.equal(t.xp,40);
});

test('reduced motion keeps move geometry stable as the animation clock advances',()=>{
  for(const kind of [1,4,7,25,10,133,63,147,144])for(const branch of evolutionOptions({kind})){
    const actor=actorFor(kind,3,branch.id),v=attackVisual(towerStats(actor),3,branch.id),renders=[];
    for(const time of [0,50]){const {context,calls}=recordingCanvas();drawAttackShot(context,{x:10,y:20,tx:150,ty:80,visual:v,life:.2,maxLife:.34},time,true);renders.push(JSON.stringify(calls));}
    assert.equal(renders[0],renders[1]);
  }
});
