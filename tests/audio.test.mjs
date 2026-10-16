import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Game,TOWERS,evolutionOptions,towerStats,pointAt} from '../dist/game.mjs';
import {attackVisual} from '../dist/combat-visuals.mjs';
import {ATTACK_SOUNDS,attackCue,evolutionCue,renderCue,GameAudio} from '../dist/audio.mjs';

class Param{constructor(){this.value=0;}setTargetAtTime(value){this.value=value;}}
class Node{constructor(){this.connections=[];this.gain=new Param();this.pan=new Param();}connect(node){this.connections.push(node);}disconnect(){this.connections=[];}}
class FakeContext{
  constructor(){this.state='running';this.currentTime=0;this.destination={};this.sources=[];this.buffers=[];}
  resume(){this.state='running';return Promise.resolve();}
  createGain(){return new Node();}
  createStereoPanner(){return new Node();}
  createDynamicsCompressor(){const node=new Node();for(const key of ['threshold','knee','ratio','attack','release'])node[key]=new Param();return node;}
  createBuffer(channels,length,rate){const buffer={channels,length,rate,copyToChannel(data){this.data=data;}};this.buffers.push(buffer);return buffer;}
  createBufferSource(){const node=new Node();node.start=()=>{node.started=true;};node.stop=()=>{node.stopped=true;node.onended?.();};this.sources.push(node);return node;}
}
async function rig(){const context=new FakeContext(),audio=new GameAudio({contextFactory:()=>context});await audio.setEnabled(true);return {audio,context};}
const fingerprint=data=>createHash('sha256').update(Buffer.from(data.buffer)).digest('hex');

test('every available move and evolution branch has a non-silent, bounded sound',()=>{
  for(const spec of TOWERS)for(const level of [1,2,3]){
    for(const branch of level===1?[null]:evolutionOptions({kind:spec.id}).map(b=>b.id)){
      const stats=towerStats({kind:spec.id,level,branch}),visual=attackVisual(stats,level,branch);
      assert.ok(ATTACK_SOUNDS[visual.style],`${stats.move} needs an explicit sound`);
      const cue=attackCue(visual),data=renderCue(cue);
      let energy=0,peak=0;for(const value of data){assert.ok(Number.isFinite(value));energy+=value*value;peak=Math.max(peak,Math.abs(value));}
      assert.ok(Math.sqrt(energy/data.length)>.005,`${cue.id} is audible`);assert.ok(peak<1,`${cue.id} cannot clip`);
      assert.ok(cue.duration<=.6);assert.equal(data[0],0);assert.ok(Math.abs(data.at(-1))<.001);
    }
  }
});

test('every move style has a distinct waveform; focused, crowd and training variants also differ',()=>{
  const hashes=new Set(Object.keys(ATTACK_SOUNDS).map(style=>fingerprint(renderCue(attackCue({style,level:1})))));
  assert.equal(hashes.size,Object.keys(ATTACK_SOUNDS).length);
  const variants=['move','focus','surge'].map(variant=>fingerprint(renderCue(attackCue({style:'psychic',level:2,variant}))));
  assert.equal(new Set(variants).size,3);
  assert.notEqual(fingerprint(renderCue(attackCue({style:'bolt',level:2}))),fingerprint(renderCue(attackCue({style:'bolt',level:3}))));
});

test('different equipped Arena moves have different sounds, even when their silhouettes match',()=>{
  const sounds=new Map();
  for(const spec of TOWERS)for(const level of [1,2,3])for(const branch of level===1?[null]:evolutionOptions({kind:spec.id}).map(b=>b.id)){
    const stats=towerStats({kind:spec.id,level,branch});
    sounds.set(stats.moveId,fingerprint(renderCue(attackCue(attackVisual(stats,1)))));
  }
  assert.equal(new Set(sounds.values()).size,sounds.size);
});

test('evolution is a longer multi-layer fanfare with a distinct final-training version',()=>{
  for(const level of [2,3]){const cue=evolutionCue(level),data=renderCue(cue);assert.ok(cue.duration>1.3&&cue.duration<2);assert.ok(cue.layers.length>=15);assert.ok(cue.layers.some(l=>l.at>.8));assert.ok(data.some(v=>Math.abs(v)>.1));assert.ok(data.every(v=>Number.isFinite(v)&&Math.abs(v)<1));}
  assert.notEqual(fingerprint(renderCue(evolutionCue(2))),fingerprint(renderCue(evolutionCue(3))));
});

test('attack audio events fire once at release, including chains, never during windup or on a corpse',()=>{
  const g=new Game(),t=g.place(25,0);g.gainXP(t,40);g.upgrade(t.id,'storm');g.wave=3;g.status='wave';
  for(let i=0;i<4;i++){const enemy=g.spawn(10);enemy.distance=100+i*10;Object.assign(enemy,pointAt(g.map.path,enemy.distance));enemy.hp=enemy.maxHp=10000;}
  g.events=[];g.beginAttack(t,g.enemies[0]);g.update(.08);assert.equal(g.events.filter(e=>e.type==='attack').length,0);
  g.update(.1);g.update(.1);const events=g.events.filter(e=>e.type==='attack');assert.equal(events.length,1);assert.equal(events[0].visual.moveId,'thunder');assert.equal(events[0].visual.level,2);assert.equal(events[0].towerId,t.id);assert.equal(events[0].x,t.x);
  g.enemies[0].hp=0;g.attack(t,g.enemies[0]);assert.equal(g.events.filter(e=>e.type==='attack').length,1);
});

test('muted audio allocates nothing, and unmuting does not replay old attacks',async()=>{
  let factories=0;const context=new FakeContext(),audio=new GameAudio({contextFactory:()=>{factories++;return context;}});
  assert.equal(audio.attack({style:'jet'}),false);assert.equal(await audio.unlock(),false);assert.equal(factories,0);
  await audio.setEnabled(true);assert.equal(factories,1);assert.equal(context.sources.length,0);
  assert.equal(audio.attack({style:'jet'}),true);assert.equal(context.sources.length,1);
  await audio.setEnabled(false);assert.ok(context.sources[0].stopped);assert.equal(audio.voices.size,0);
  assert.equal(audio.evolution(2),false);await audio.setEnabled(true);assert.equal(context.sources.length,1);
});

test('mixing is bounded, identical rapid attacks are suppressed, and buffers are reused',async()=>{
  const {audio,context}=await rig();
  for(let i=0;i<20;i++){context.currentTime=i*.1;audio.attack({style:'flame',level:2},i%2?0:960);}
  assert.equal(audio.voices.size,6);assert.equal(context.buffers.length,1);assert.ok(context.sources.slice(0,14).every(s=>s.stopped));
  assert.equal(audio.attack({style:'flame',level:2}),false);assert.ok([...audio.voices].every(v=>Math.abs(v.pan.pan.value)<=.65));
});

test('evolution ducks combat and cannot be cut off by an ordinary combat voice',async()=>{
  const {audio,context}=await rig();audio.attack({style:'jet'});const first=[...audio.voices][0];
  audio.evolution(2);assert.equal(first.gain.gain.value,.17);const fanfare=[...audio.voices].find(v=>v.fanfare);assert.ok(fanfare);
  for(let i=0;i<20;i++){context.currentTime+=.05;audio.attack({style:i%2?'flame':'bolt'});}
  assert.ok(audio.voices.has(fanfare));assert.ok(!fanfare.source.stopped);assert.ok([...audio.voices].filter(v=>v.kind==='attack').every(v=>v.gain.gain.value===.17));
  context.currentTime=3;audio.attack({style:'leaf'});assert.equal([...audio.voices].at(-1).gain.gain.value,.65);
});

test('preview playback is explicit and replaces itself; mute, pause and hidden-tab cleanup stops voices',async()=>{
  const {audio,context}=await rig();audio.play(attackCue({style:'hydro'}),{kind:'preview'});const first=context.sources[0];
  audio.play(evolutionCue(),{kind:'preview'});assert.ok(first.stopped);assert.equal(audio.voices.size,1);
  audio.stopPreviews();assert.equal(audio.voices.size,0);
  audio.attack({style:'spark'});audio.stopCombat();assert.equal(audio.voices.size,0);
  audio.evolution(3);audio.stopAll();assert.equal(audio.voices.size,0);assert.ok(context.sources.every(s=>s.stopped));
});

test('finished sources disconnect, and a suspended or unavailable audio device is harmless',async()=>{
  const {audio,context}=await rig();audio.attack({style:'vine'});const voice=[...audio.voices][0];voice.source.onended();
  assert.equal(audio.voices.size,0);assert.equal(voice.source.connections.length,0);assert.equal(voice.gain.connections.length,0);
  context.state='suspended';assert.equal(audio.attack({style:'vine'}),false);await audio.unlock();context.currentTime=1;assert.equal(audio.attack({style:'vine'}),true);
  const missing=new GameAudio({enabled:true,contextFactory:()=>{throw Error('Audio unsupported');}});assert.equal(await missing.unlock(),false);assert.equal(missing.evolution(2),false);
  const rejected=new GameAudio({enabled:true,contextFactory:()=>({...new FakeContext(),state:'suspended',createGain:()=>new Node(),createDynamicsCompressor:()=>context.createDynamicsCompressor(),resume:()=>Promise.reject(Error('Gesture required'))})});assert.equal(await rejected.unlock(),false);
});
