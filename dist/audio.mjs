// Original procedural effects: small, offline, and shared by battle and previews.
// A cue is rendered once and cached as a single voice, even for a layered fanfare.
const tone = (frequency,end,duration,gain=.3,at=0,wave='sine',extra={}) => ({wave,frequency,end,duration,gain,at,...extra});
const noise = (frequency,end,duration,gain=.25,at=0,extra={}) => tone(frequency,end,duration,gain,at,'noise',extra);
export const ATTACK_SOUNDS = {
  vine: [noise(1800,280,.12,.34),tone(240,680,.13,.16,0,'triangle')],
  bloom: [tone(300,620,.12,.24),tone(450,260,.15,.22,.07),tone(640,330,.17,.18,.14),noise(900,400,.25,.13)],
  leaf: [noise(4200,700,.11,.34),noise(3300,1200,.1,.25,.07),tone(1250,620,.07,.12,.02,'triangle')],
  ember: [noise(2300,420,.13,.4),tone(390,120,.13,.24,0,'triangle')],
  blast: [noise(1300,100,.36,.6,0,{decay:2}),tone(180,45,.34,.5,0,'triangle'),noise(3800,900,.1,.16,.06)],
  flame: [noise(850,2600,.35,.55,0,{tremolo:27}),tone(95,145,.3,.13,0,'sawtooth')],
  burst: [noise(1400,250,.16,.34),tone(240,75,.2,.3,0,'triangle'),noise(2400,500,.13,.25,.09),tone(530,220,.12,.15,.16)],
  jet: [noise(1000,2800,.14,.25),tone(350,1050,.12,.3),tone(800,330,.08,.18,.09)],
  whirlpool: [noise(700,1900,.4,.3,0,{tremolo:9}),tone(480,160,.2,.24),tone(380,130,.22,.22,.13),tone(300,100,.18,.18,.25)],
  hydro: [noise(3200,700,.32,.55),tone(270,65,.24,.34,0,'triangle'),noise(1400,3200,.15,.2,.12)],
  pulse: [tone(590,390,.18,.34),tone(880,560,.2,.22,.09),noise(1700,600,.12,.12)],
  spark: [tone(1300,180,.12,.25,0,'square'),noise(4200,700,.08,.2)],
  chain: [tone(800,420,.08,.24,0,'square'),tone(1250,670,.08,.22,.065,'square'),tone(1800,900,.1,.2,.13,'square'),noise(3300,900,.18,.13)],
  bolt: [tone(950,100,.22,.35,0,'sawtooth'),tone(1900,240,.14,.12,0,'square'),noise(4800,700,.16,.25)],
  discharge: [tone(900,450,.16,.23,0,'square'),tone(650,240,.18,.2,.045,'triangle'),tone(440,140,.22,.22,.09),noise(2700,1100,.23,.24,0,{tremolo:38})],
  silk: [tone(1700,750,.13,.22),noise(4800,2400,.07,.09)],
  web: [tone(1700,1000,.1,.22),tone(1350,750,.12,.2,.055),tone(1050,450,.16,.2,.11)],
  tackle: [tone(170,45,.13,.48),noise(900,180,.09,.32)],
  hurricane: [noise(400,4200,.4,.6,0,{tremolo:13}),tone(140,310,.35,.12)],
  slash: [noise(5400,800,.12,.55),tone(1900,560,.09,.15,.025,'triangle')],
  stars: [tone(880,880,.14,.24),tone(1108,1108,.14,.22,.045),tone(1318,1318,.18,.2,.09)],
  psychic: [tone(690,460,.32,.32,0,'sine',{tremolo:17}),tone(1030,520,.3,.18,.025,'triangle'),tone(345,230,.3,.12)],
  dragon: [tone(190,65,.32,.34,0,'sawtooth'),noise(1700,400,.32,.4),tone(570,230,.25,.14,.04,'triangle')],
  ice: [tone(2200,1400,.2,.25,0,'triangle'),tone(1760,1760,.25,.2,.055),tone(2640,2640,.2,.15,.1),noise(6000,2800,.15,.12,0,{highpass:true})],
};
// New Arena silhouettes reuse the matching elemental texture with their own
// tuning. A move ID further distinguishes moves which share one silhouette.
const arenaTextures={petals:'bloom','solar-beam':'psychic',roots:'vine',fangs:'tackle',fireblast:'blast',flamethrower:'flame','water-ring':'pulse',hydropump:'hydro',cannon:'hydro',thunder:'chain',fist:'bolt',triad:'discharge','zap-orb':'spark',sound:'hurricane',gust:'hurricane',speed:'slash','flame-rush':'burst','hidden-orbs':'stars','spectrum-beam':'psychic',crescent:'slash',icicle:'ice',surf:'whirlpool',tail:'tackle',claws:'slash','aura-rush':'dragon',blizzard:'ice',horn:'tackle','bird-rush':'hurricane','ice-beam':'ice'};
Object.entries(arenaTextures).forEach(([style,texture],index)=>{
  const pitch=.81+index*.017;
  ATTACK_SOUNDS[style]=ATTACK_SOUNDS[texture].map(layer=>({...layer,frequency:layer.frequency*pitch,end:layer.end*pitch}));
});
function cue(id,layers){return {id,layers,duration:Math.max(...layers.map(l=>l.at+l.duration))+.01};}
export function attackCue(visual={}){
  const style=ATTACK_SOUNDS[visual.style]?visual.style:'stars',level=Math.min(3,Math.max(1,visual.level||1)),variant=visual.variant||'move';
  const signature=visual.moveId?[...visual.moveId].reduce((sum,c)=>sum+c.charCodeAt(0),0)%31:0;
  const pitch=(1-(level-1)*.055)*(1+signature*.004),stretch=1+(level-1)*.06;
  const layers=ATTACK_SOUNDS[style].map(l=>({...l,frequency:l.frequency*pitch,end:l.end*pitch,duration:l.duration*stretch,at:l.at*stretch}));
  if(variant==='focus')layers.push(tone(1280,530,.15,.14,.01,'triangle'));
  if(variant==='surge')layers.push(noise(2200,500,.2,.16,.1,{tremolo:16}));
  return cue(`attack:${style}:${level}:${variant}:${visual.moveId||''}`,layers);
}
export function evolutionCue(level=2){
  const root=level===3?293.665:261.626,layers=[noise(250,3300,.48,.16,0,{attack:.12})];
  // An original major arpeggio, then a sustained four-note arrival and shimmer.
  [0,4,7,12,16,19,24].forEach((semitone,i)=>layers.push(tone(root*2**(semitone/12),root*2**(semitone/12),.19,.25,i*.07,'triangle')));
  [0,4,7,12].forEach((semitone,i)=>layers.push(tone(root*2**(1+semitone/12),root*2**(1+semitone/12),.86,.18,.5+i*.022,'sine',{attack:.025,decay:.7})));
  layers.push(tone(root/2,root/2,.6,.3,.5,'triangle'),noise(4200,1300,.25,.15,.5));
  [24,28,31,36].forEach((note,i)=>layers.push(tone(root*2**(note/12),root*2**(note/12),.27,.1,.82+i*.1)));
  return cue(`evolution:${level===3?3:2}`,layers);
}
export const uiCue=(frequency=600,duration=.07,wave='sine')=>cue(`ui:${frequency}:${duration}:${wave}`,[tone(frequency,frequency*.7,duration,.2,0,wave)]);

export function renderCue(sound,sampleRate=22050){
  const data=new Float32Array(Math.ceil(sound.duration*sampleRate));
  for(let layerIndex=0;layerIndex<sound.layers.length;layerIndex++){
    const layer=sound.layers[layerIndex],start=Math.round(layer.at*sampleRate),length=Math.ceil(layer.duration*sampleRate);
    let phase=0,low=0,seed=7919+layerIndex*104729;
    for(let i=0;i<length&&start+i<data.length;i++){
      const t=i/sampleRate,p=t/layer.duration,frequency=layer.frequency*(layer.end/layer.frequency)**p;
      phase+=frequency/sampleRate;
      let value;
      if(layer.wave==='noise'){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;
        low+=(white-low)*(1-Math.exp(-2*Math.PI*frequency/sampleRate));value=layer.highpass?white-low:low;
      }else if(layer.wave==='square')value=Math.sin(phase*Math.PI*2)>=0?1:-1;
      else if(layer.wave==='triangle')value=1-4*Math.abs((phase%1)-.5);
      else if(layer.wave==='sawtooth')value=2*(phase%1)-1;
      else value=Math.sin(phase*Math.PI*2);
      const envelope=Math.min(1,t/(layer.attack||.006))*Math.min(1,(layer.duration-t)/.018)*(1-p)**(layer.decay??1.2);
      const tremolo=layer.tremolo ? .65+.35*Math.sin(t*Math.PI*2*layer.tremolo) : 1;
      data[start+i]+=value*envelope*layer.gain*tremolo;
    }
  }
  for(let i=0;i<data.length;i++)data[i]=Math.tanh(data[i])*.85;
  return data;
}

export class GameAudio {
  constructor({enabled=false,contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){
    this.enabled=enabled;this.contextFactory=contextFactory;this.context=null;this.buffers=new Map();this.voices=new Set();this.lastAttack=-Infinity;this.lastStyle=new Map();this.lastUI=-Infinity;this.duckUntil=0;
  }
  unlock(){
    if(!this.enabled)return Promise.resolve(false);
    try{
      if(!this.context){
        this.context=this.contextFactory();const c=this.context;
        this.master=c.createGain();this.master.gain.value=.32;
        const compressor=c.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.12;
        this.master.connect(compressor);compressor.connect(c.destination);
      }
      if(this.context.state!=='running')return Promise.resolve(this.context.resume()).then(()=>this.enabled&&this.context.state==='running',()=>false);
      return Promise.resolve(true);
    }catch{return Promise.resolve(false);}
  }
  setEnabled(enabled){this.enabled=Boolean(enabled);if(!this.enabled){this.stopAll();return Promise.resolve(false);}return this.unlock();}
  stopVoice(voice){
    if(!this.voices.has(voice))return;
    this.voices.delete(voice);try{voice.source.stop();}catch{}voice.source.disconnect();voice.gain.disconnect();voice.pan?.disconnect();
  }
  stopCombat(){for(const voice of [...this.voices])if(voice.kind==='attack')this.stopVoice(voice);this.lastAttack=-Infinity;this.lastStyle.clear();}
  stopPreviews(){for(const voice of [...this.voices])if(voice.kind==='preview')this.stopVoice(voice);}
  stopAll(){for(const voice of [...this.voices])this.stopVoice(voice);this.lastAttack=-Infinity;this.lastStyle.clear();this.lastUI=-Infinity;this.duckUntil=0;}
  play(sound,{kind='ui',pan=0}={}){
    const c=this.context;if(!this.enabled||!c||c.state!=='running')return false;
    const now=c.currentTime;
    // Never replay a queue after unmuting or resuming. Limit the live mix at 3×.
    if(kind==='attack'){
      const style=sound.id.split(':')[1];
      if(now-this.lastAttack<.035||now-(this.lastStyle.get(style)??-Infinity)<.075)return false;
      this.lastAttack=now;this.lastStyle.set(style,now);
      if([...this.voices].filter(v=>v.kind==='attack').length>=6)this.stopVoice([...this.voices].find(v=>v.kind==='attack'));
    }
    if(kind==='ui'){if(now-this.lastUI<.045)return false;this.lastUI=now;}
    if(kind==='preview')this.stopPreviews();
    const fanfare=sound.id.startsWith('evolution:');
    if(fanfare){
      for(const voice of [...this.voices])if(voice.fanfare)this.stopVoice(voice);
      this.duckUntil=now+sound.duration;
      for(const voice of this.voices)if(voice.kind==='attack')voice.gain.gain.setTargetAtTime(.17,now,.02);
    }
    if(this.voices.size>=10){const oldest=[...this.voices].find(v=>!v.fanfare);if(oldest)this.stopVoice(oldest);}
    let buffer=this.buffers.get(sound.id);
    if(!buffer){const samples=renderCue(sound);buffer=c.createBuffer(1,samples.length,22050);buffer.copyToChannel(samples,0);if(this.buffers.size>=160)this.buffers.delete(this.buffers.keys().next().value);this.buffers.set(sound.id,buffer);}
    const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;
    gain.gain.value=kind==='attack' ? (now<this.duckUntil ? .17 : .65) : fanfare ? .9 : .8;
    source.connect(gain);
    const panner=c.createStereoPanner?.();if(panner){panner.pan.value=Math.max(-.65,Math.min(.65,pan));gain.connect(panner);panner.connect(this.master);}else gain.connect(this.master);
    const voice={source,gain,pan:panner,kind,fanfare};this.voices.add(voice);
    source.onended=()=>{if(this.voices.delete(voice)){source.disconnect();gain.disconnect();panner?.disconnect();}};
    source.start();return true;
  }
  attack(visual,x=480){return this.play(attackCue(visual),{kind:'attack',pan:(x/960-.5)*1.2});}
  evolution(level){return this.play(evolutionCue(level),{kind:'evolution'});}
  tone(frequency,duration,wave){return this.play(uiCue(frequency,duration,wave));}
}
