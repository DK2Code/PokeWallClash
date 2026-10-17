import {Game,TOWERS,MAPS,MAX_WAVES,ENEMIES,DIFFICULTIES,difficultyFor,towerStats,waveInfo,xpProgress,evolutionOptions,rewardOptions,XP_THRESHOLDS,XP_RULES} from './game.mjs';
import {loadSprites,createTerrain,render,renderAttackPreview} from './art.mjs';
import {attackVisual} from './combat-visuals.mjs';
import {GameAudio,attackCue,evolutionCue} from './audio.mjs';
import {loadRecords,recordKey,recordRun} from './records.mjs';
import {STARTER_IDS,ROUTE_VISITORS,loadCollection,visitorForecast} from './collection.mjs';
const $=id=>document.getElementById(id);
const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const themes={electric:['#f4eac0','#b49b4b'],grass:['#e5edd6','#8a9f70'],fire:['#f3e2d4','#c19173'],water:['#dfecef','#80a4b1'],flying:['#eae4f0','#a392b6'],bug:['#e8edd2','#8e9b56'],normal:['#eee6d9','#a8987e'],psychic:['#eee1f3','#9364a0'],dragon:['#e8e3f5','#8270ad'],ice:['#def1f5','#558e9b']};
const typeTag=type=>`<span class="type-tag" style="--type-bg:${themes[type][0]};--type-ink:${themes[type][1]}">${type}</span>`;
// Keep the original save keys so the rename preserves personal bests and preferences.
let records={};try{records=loadRecords(localStorage.getItem('pokeall-records'));}catch{}
let sound=false;try{sound=localStorage.getItem('pokeall-sound')==='true';}catch{}
const audio=new GameAudio({enabled:sound});
let collection={};try{collection=loadCollection(localStorage.getItem('pokewallclash-collection-v1'));}catch{}
const game=new Game(0,'normal',{collection});
let encounterKey='',collectionSaved=true;
const availableTowers=()=>TOWERS.filter(t=>game.available(t.id));
function saveCollection(){try{localStorage.setItem('pokewallclash-collection-v1',JSON.stringify(game.collection));collectionSaved=true;}catch{collectionSaved=false;toast('Collection is available this session, but browser storage could not save it.');}}
const ui={selectedKind:null,selectedTower:null,hoverPad:null,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
let terrain=createTerrain(game.map),speed=1,toastTimer,previousTime=0,uiTimer=0,detailKey='',waveKey='',growthKey='',dialogWasPaused=false;
let movePreviews=[],previewTime=0;
const context=$('battlefield').getContext('2d');
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function tone(frequency=600,duration=.07,style='sine'){
  if(!document.hidden)audio.tone(frequency,duration,style);
}
function soundUI(){
  $('sound').innerHTML=icon(sound?'sound':'mute');$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');$('sound').title=sound?'Mute sound':'Enable sound';$('sound').setAttribute('aria-pressed',String(sound));
  if($('preview-sound-toggle')){$('preview-sound-toggle').textContent=sound?'Mute sound':'Enable sound';$('preview-sound-toggle').setAttribute('aria-pressed',String(sound));}
  document.querySelectorAll('[data-hear-move],[data-hear-evolution]').forEach(button=>{button.disabled=!sound;});
  if($('sound-preview-status'))$('sound-preview-status').textContent=sound?'Choose a sound to hear it.':'Enable sound to hear the moves and evolution fanfare.';
}
async function toggleSound(){
  sound=!sound;try{localStorage.setItem('pokeall-sound',String(sound));}catch{}soundUI();
  const ready=await audio.setEnabled(sound);if(sound&&ready)tone(650,.12);else if(sound)toast('Audio could not start. Tap the sound control to try again.');
}
// Browsers require a real gesture, including when the saved preference is on.
document.addEventListener('pointerdown',()=>{if(sound)audio.unlock();},{capture:true});
document.addEventListener('keydown',()=>{if(sound)audio.unlock();},{capture:true});
function renderRoster(){
  const available=availableTowers();$('roster-count').textContent=String(available.length).padStart(2,'0');$('collection-button').textContent=`Open collection · ${available.length} / ${TOWERS.length}`;$('roster-description').textContent='Four starters. A whole Kanto to discover.';$('eevee-hint').innerHTML=game.available(133)?'✦ Eevee joined your collection. Choose its stone evolution in battle.':'<b>Special reward: Eevee</b><br>Catch Onix and clear wave 5 on any route.';
  $('roster').innerHTML=available.map((t,i)=>`<button class="pokemon-card" data-kind="${t.id}" aria-label="Select ${t.name}, ${t.type}, ${t.cost} coins" aria-pressed="false"><span class="key">${i<9?i+1:game.collection[t.id]?.useShiny?"★":"✦"}</span><img class="sprite ${game.collection[t.id]?.useShiny?"shiny-sprite":""}" src="./assets/${t.id}.png" alt="" draggable="false"><strong>${t.name}</strong><span class="card-bottom">${typeTag(t.type)}<span class="cost">${icon('coin')}${t.cost}</span></span></button>`).join('');
}
function renderPads(){
  $('pad-buttons').innerHTML=game.map.pads.map(([x,y],i)=>{const tower=game.towers.find(t=>t.pad===i);return `<button class="pad-button" data-pad="${i}" style="left:${x/960*100}%;top:${y/560*100}%" aria-label="${tower?`${towerStats(tower).name}, level ${tower.level}, clearing ${i+1}. Select to upgrade.`:`Empty clearing ${i+1}. Place selected Pokémon.`}" title="${tower?`${towerStats(tower).name} · Level ${tower.level}`:`Clearing ${i+1}`} "><span class="sr-only">${tower?towerStats(tower).name:`Clearing ${i+1}`}</span></button>`;}).join('');
}
function renderMapUI(){
  $('route-tabs').innerHTML=MAPS.map((m,i)=>`<button class="route-tab ${game.mapIndex===i?'active':''}" data-map="${i}" aria-pressed="${game.mapIndex===i}"><span>0${i+1}</span>${m.name}${records[recordKey(i,game.difficulty.id)]?.won?' <span aria-label="Completed">✓</span>':''}</button>`).join('');
  $('map-title').textContent=game.map.name;$('region-label').textContent=game.map.region;$('difficulty').textContent=game.difficulty.name;$('difficulty').dataset.mode=game.difficulty.id;renderPads();renderDifficultyUI();updateRecord();
}
function renderDifficultyUI(){
  if(!$('difficulty-options').children.length)$('difficulty-options').innerHTML=DIFFICULTIES.map(d=>`<button class="difficulty-option" data-difficulty="${d.id}" aria-pressed="false" aria-label="${d.name} difficulty"><strong>${d.name}</strong><span>${d.coins} coins · ${d.hearts} hearts</span></button>`).join('');
  for(const button of $('difficulty-options').children){const active=button.dataset.difficulty===game.difficulty.id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  const d=game.difficulty;$('difficulty-summary').textContent=`${d.tagline}. Enemies: ${Math.round(d.health*100)}% health · ${Math.round(d.speed*100)}% speed · ${Math.round(d.crowd*100)}% wave size.`;
}
function updateRecord(){const record=records[recordKey(game.mapIndex,game.difficulty.id)];$('best-label').textContent=`PERSONAL BEST · ${game.difficulty.name.toUpperCase()}`;$('best-record').textContent=record?.won?'All 15 waves cleared':record?.wave?`Wave ${record.wave} · ${(record.score||0).toLocaleString()} pts`:'A new adventure';}
function saveRecord(){records=recordRun(records,game);try{localStorage.setItem('pokeall-records',JSON.stringify(records));}catch{}updateRecord();}
function selectKind(kind){if(!game.available(kind))return;if(['won','lost'].includes(game.status)){toast('Start a fresh adventure to build another team.');return;}ui.selectedKind=ui.selectedKind===kind?null:kind;ui.selectedTower=null;detailKey='';tone(520,.045);updateUI();}
function onPad(pad){
  if(['won','lost'].includes(game.status))return;
  const existing=game.towers.find(t=>t.pad===pad);
  if(existing){ui.selectedTower=existing.id;ui.selectedKind=null;detailKey='';updateUI();return;}
  if(ui.selectedKind===null){toast('Choose a Pokémon from your team first.');return;}
  const spec=TOWERS.find(t=>t.id===ui.selectedKind);if(game.money<spec.cost){toast(`${spec.name} needs ${spec.cost} coins. You have ${game.money}.`);return;}
  game.place(ui.selectedKind,pad);renderPads();updateUI();
}
function renderDetails(){
  const t=game.towers.find(t=>t.id===ui.selectedTower),spec=t?towerStats(t):TOWERS.find(t=>t.id===ui.selectedKind);
  const progress=t?xpProgress(t):null,key=JSON.stringify([t?.id,t?.level,t?.branch,ui.selectedKind,progress?.ready,game.powerCharms,game.status]);
  if(detailKey!==key){detailKey=key;
    if(!spec){$('selection-detail').innerHTML=`<div class="selection-empty">${icon('spark')}<div><strong>Small battles. Big transformations.</strong><p>Share catch XP and earn team XP when a wave clears. Grow at ${XP_THRESHOLDS[1]} XP, then ${XP_THRESHOLDS[2]} XP.</p></div></div>`;return;}
    $('selection-detail').innerHTML=`<div class="detail-heading"><strong>${t?spec.name:spec.ability}</strong><span id="detail-level">${t?`LEVEL ${t.level} · ${t.kills} CAUGHT`:'READY TO PLACE'}</span></div><p class="detail-description">${t?`${spec.move} · ${spec.ability}.${spec.pathName?` ${spec.pathName} path.`:''}`:spec.description}</p><div class="detail-stats"><span>POWER <b>${spec.damage}</b></span><span>RANGE <b>${spec.range}</b></span><span>RATE <b>${(1/spec.rate).toFixed(1)}/s</b></span></div>${t?`<div class="xp-block ${progress.ready?'is-ready':''}"><div class="xp-label"><strong>${t.level===3?'★ Fully grown':progress.ready?'✦ Ready to grow':'BATTLE EXPERIENCE'}</strong><span id="xp-count"></span></div><div class="xp-track" id="xp-meter" role="progressbar" aria-label="Evolution experience" aria-valuemin="0" aria-valuemax="${progress.goal}"><span id="xp-fill"></span></div><small>${t.level===3?'Your chosen move is at its strongest.':'Each helper +2/catch · max 12/wave. Pre-wave team +6/clear.'}</small></div><div class="tower-actions"><button class="upgrade-button" id="upgrade" ${!progress.ready||['won','lost'].includes(game.status)?'disabled':''}>${t.level===3?'★ Fully trained':progress.ready?(t.level===1?'Choose evolution · FREE':'Grow to level 3 · FREE'):`Needs ${progress.goal} total XP`}</button><button class="sell-button" id="sell" ${['won','lost'].includes(game.status)?'disabled':''}>Recall +${Math.floor(t.spent*.7)}</button></div>`:`<p class="growth-hint">Shared catches +${XP_RULES.catch} XP (up to ${XP_RULES.combatCap}/wave). Pre-wave teammates +${XP_RULES.clear} XP on a clear.</p>`}`;
  }
  if(t){
    if(!$('preview-moves')){const button=document.createElement('button');button.id='preview-moves';button.className='move-preview-button';button.textContent=t.level===3?'Preview signature move':'Preview evolution moves';$('selection-detail').append(button);}
    $('detail-level').textContent=`LEVEL ${t.level} · ${t.kills} CAUGHT`;$('xp-count').textContent=`${Math.floor(progress.xp)} XP · ${progress.goal} to grow`;
    if(t.level===3)$('xp-count').textContent='MAX LEVEL';
    $('xp-fill').style.width=`${progress.percent}%`;$('xp-meter').setAttribute('aria-valuenow',String(Math.min(progress.goal,progress.xp)));}
}
function renderGrowth(){
  const ready=game.towers.filter(t=>xpProgress(t).ready),key=JSON.stringify([ready.map(t=>[t.id,t.level,t.species,t.shiny]),game.rewardHistory,game.bossesCaught,game.status]);if(key===growthKey)return;growthKey=key;
  $('ready-partners').hidden=!ready.length||['won','lost'].includes(game.status);
  $('ready-partners').innerHTML=`<span class="eyebrow">✦ ${ready.length} READY TO EVOLVE · FREE</span><div>${ready.map(t=>`<button data-evolve="${t.id}" aria-label="Evolve ${t.shiny?'shiny ':''}${towerStats(t).name} in clearing ${t.pad+1}"><img class="${t.shiny?'shiny-sprite':''}" src="./assets/${t.species}.png" alt=""><span>${t.shiny?'★ ':''}${towerStats(t).name}<small>Clearing ${t.pad+1} · choose a move</small></span>${icon('arrow')}</button>`).join('')}</div>`;
  $('team-growth').innerHTML=`<span>${icon('spark')} <b>Shared catches + team XP → evolution</b></span><span>${game.powerCharms?`+${game.powerCharms*12}% team power · `:''}${game.bossesCaught} / 3 bosses caught</span>`;
}
function showEvolution(id){
  const t=game.towers.find(t=>t.id===id);if(!t||['won','lost'].includes(game.status))return;
  ui.selectedTower=id;ui.selectedKind=null;const s=towerStats(t);
  const options=t.level===1?evolutionOptions(t):evolutionOptions(t).filter(b=>b.id===t.branch);
  const ready=xpProgress(t).ready,level=Math.min(3,t.level+1),tag=ready?'button':'article';
  const previews=options.map(b=>({...t,level,branch:b.id}));
  showDialog(`<div class="eyebrow">${ready?'A NEW CHAPTER':'MOVE PREVIEW'} · CLEARING ${t.pad+1}</div><h2>${ready?(t.level===1?'Choose how they grow.':'Ready for the next level.'):t.level===3?'Your signature move.':'See their next moves.'}</h2><p class="dialog-intro">${ready?`${s.name} earned ${Math.floor(t.xp)} XP. <b>Evolution is free.</b> Choose the attack style you like.`:t.level===3?`${s.name} has mastered ${s.move}.`:`Compare ${s.name}’s next attacks now. Unlock this evolution at <b>${xpProgress(t).goal} total XP</b>.`} ${t.level===1?'Your chosen path stays through level 3.':''}</p><div class="choice-grid ${options.length===1?'single-choice':''}">${options.map((b,i)=>{
    const next=towerStats(previews[i]),visual=attackVisual(next,level,b.id);
    return `<${tag} class="choice-card ${ready?'':'preview-only'}" ${ready?`data-branch="${b.id}" data-tower="${id}"`:''} style="--choice-color:${next.color}"><div class="choice-art"><img class="${t.shiny?'shiny-sprite':''}" src="./assets/${s.sprite}.png" alt="">${icon('arrow')}<img class="${t.shiny?'shiny-sprite':''}" src="./assets/${next.sprite}.png" alt="${next.name}"></div><span class="choice-kicker">${b.name} · LEVEL ${level}</span><strong>${t.shiny?'★ ':''}${next.name}</strong><span class="choice-move">${next.move} ${typeTag(next.type)}</span><canvas class="move-preview" data-preview="${i}" width="300" height="112" role="img" aria-label="${next.move} animation: ${visual.description}${t.shiny?'. Shiny colors':''}"></canvas><span class="move-visual-description">${visual.description}</span><p>${b.description}</p><div class="choice-stats"><span><b>${next.damage}</b> power</span><span><b>${next.range}</b> range</span><span><b>${(1/next.rate).toFixed(1)}</b> / sec</span></div><span class="choice-cta">${ready?`${next.sprite===s.sprite?'Train':'Evolve'} ${next.name} ${icon('arrow')}`:t.level===3?'Fully trained':`${Math.floor(t.xp)} / ${xpProgress(t).goal} XP to unlock`}</span></${tag}>`;
  }).join('')}</div><div class="preview-controls"><span>${ui.reducedMotion?'Still previews · reduced motion':'Move demonstrations · your battle is paused'}</span>${ui.reducedMotion?'':'<button id="toggle-preview" aria-pressed="false">Pause previews</button>'}</div><p class="choice-note">${ready?'Your coins stay with you. Close this window to decide later.':'Previewing does not spend XP or choose a path.'}</p>`);
  previewTime=.75;movePreviews=Array.from($('dialog-content').querySelectorAll('[data-preview]'),canvas=>({context:canvas.getContext('2d'),tower:previews[Number(canvas.dataset.preview)]}));
  const soundPanel=document.createElement('div');soundPanel.className='sound-preview-panel';
  soundPanel.innerHTML=`<div class="sound-preview-heading"><span class="eyebrow">LISTEN TO THEIR MOVES</span><button id="preview-sound-toggle" aria-pressed="${sound}">${sound?'Mute sound':'Enable sound'}</button></div><div class="sound-preview-buttons">${previews.map((partner,i)=>`<button data-hear-move="${i}">${icon('sound')} Hear ${towerStats(partner).move}</button>`).join('')}<button data-hear-evolution="${level}">${icon('spark')} Hear evolution</button></div><p id="sound-preview-status" role="status"></p>`;
  $('dialog-content').querySelector('.preview-controls').after(soundPanel);soundUI();
}
function showBossReward(){
  const reward=game.pendingReward;if(!reward)return;
  showDialog(`<div class="reward-hero"><img src="./assets/${reward.boss}.png" alt="${ENEMIES[reward.boss].name}"><div><div class="eyebrow">BOSS CAUGHT · WAVE ${reward.wave}</div><h2>A little victory. A big choice.</h2></div></div><p class="dialog-intro">You caught ${ENEMIES[reward.boss].name}! ${reward.wave===5&&game.available(133)?'Eevee is now in your permanent collection! ':''}Pick one additional reward before the next wave. This bonus lasts for the current adventure.</p><div class="choice-grid reward-grid">${rewardOptions(reward.wave,game.maxLives).map(r=>`<button class="choice-card reward-card" data-reward="${r.id}"><span class="reward-icon">${icon(r.icon)}</span><strong>${r.name}</strong><span class="reward-detail">${r.detail}</span><p>${r.description}</p><span class="choice-cta">Choose reward ${icon('arrow')}</span></button>`).join('')}</div><p class="choice-note">One reward per boss. You can close this window and claim it from the wave panel.</p>`);
}
function updateUI(){
  $('money').textContent=game.money;$('lives').textContent=game.lives;$('max-lives').textContent=`/ ${game.maxLives}`;$('wave').textContent=game.wave;
  $('pause').disabled=game.status!=='wave';const pauseLabel=game.paused?'Resume game':'Pause game';if($('pause').getAttribute('aria-label')!==pauseLabel){$('pause').innerHTML=icon(game.paused?'play':'pause');$('pause').setAttribute('aria-label',pauseLabel);$('pause').title=game.paused?'Resume (Space)':'Pause (Space)';}
  $('paused-overlay').hidden=!game.paused||$('modal').open||game.status!=='wave';
  document.querySelectorAll('.pokemon-card').forEach(card=>{const id=Number(card.dataset.kind);card.classList.toggle('selected',ui.selectedKind===id);card.setAttribute('aria-pressed',String(ui.selectedKind===id));card.classList.toggle('unaffordable',game.money<TOWERS.find(t=>t.id===id).cost);});
  const active=game.status==='wave',over=['won','lost'].includes(game.status),info=waveInfo(Math.min(MAX_WAVES,active?game.wave:game.wave+1),game.difficulty.id);
  $('phase-title').textContent=over?(game.status==='won'?'The forest is safe. Well played!':'Every adventure teaches us something.'):active?(game.paused?'Taking a breather':`Wave ${game.wave} is on its way`):game.wave===0?'Make yourself at home':`Wave ${game.wave} complete. Take a breath.`;
  $('phase-subtitle').textContent=over?'Start again and try a different team.':active?`${game.enemies.length} on the path · ${game.queue.length} still approaching`:game.pendingReward?'Your boss reward is waiting. Choose one before the next wave.':'Place partners or evolve your ready teammates for free.';
  $('phase-light').style.background=active?'#c0a05b':'#92a778';
  $('map-caption').lastElementChild.textContent=ui.selectedKind!==null?`${TOWERS.find(t=>t.id===ui.selectedKind).name} is ready. Choose a + clearing.`:ui.selectedTower?'A little training goes a long way.':active?'Hold your ground. You’ve got this.':'Choose a Pokémon. Find its perfect spot.';
  const nextKey=`${game.status}-${game.wave}-${Boolean(game.pendingReward)}`;
  if(waveKey!==nextKey){waveKey=nextKey;$('next-wave-label').textContent=over?'YOUR ADVENTURE':`${active?'ON THE PATH':'UP NEXT'} · WAVE ${String(info.number).padStart(2,'0')}`;$('wave-description').textContent=over?(game.status==='won'?'A team to remember':'There’s always another adventure'):info.label;$('wave-preview').innerHTML=over?`<span class="preview-count">${game.kills} Pokémon caught · ${game.score.toLocaleString()} points</span>`:[...new Set(info.pool),...(info.boss?[info.boss]:[])].slice(0,5).map(id=>`<img src="./assets/${id}.png" alt="${ENEMIES[id].name}" title="${ENEMIES[id].name} · ${ENEMIES[id].type}">`).join('')+`<span class="preview-count">${info.count} wild Pokémon</span>`;$('wave-reward').innerHTML=icon(over?'trophy':'coin')+(over?`${game.lives} hearts remaining`:` +${info.reward} wave bonus`);$('start-wave').innerHTML=`<span>${over?'Play again':active?'Wave in progress':game.wave===0?'Let’s do this':`Start wave ${game.wave+1}`}</span>${icon(active?'flag':'arrow')}`;}
  if(game.pendingReward){$('start-wave').innerHTML=`<span>Choose boss reward</span>${icon('trophy')}`;$('wave-description').textContent=`${ENEMIES[game.pendingReward.boss].name} caught!`;$('wave-reward').innerHTML=icon('trophy')+' One reward, your choice';}
  $('start-wave').disabled=active;renderDetails();renderGrowth();renderEncounters();
}
function start(){if(['won','lost'].includes(game.status)){reset(game.mapIndex);return;}if(game.pendingReward){showBossReward();return;}if(game.status!=='build')return;if(!game.towers.length){toast('Place at least one Pokémon before starting the wave.');return;}game.startWave();ui.selectedKind=null;ui.hoverPad=null;updateUI();}
function pause(){if(game.status!=='wave')return;game.paused=!game.paused;if(game.paused)audio.stopAll();updateUI();}
function reset(mapIndex,difficultyId=game.difficulty.id){audio.stopAll();game.reset(mapIndex,difficultyId);dialogWasPaused=false;ui.selectedKind=null;ui.selectedTower=null;ui.hoverPad=null;terrain=createTerrain(game.map,mapIndex);waveKey='';detailKey='';growthKey='';renderMapUI();renderRoster();encounterKey='';updateUI();}
function showDialog(html){audio.stopCombat();audio.stopPreviews();movePreviews=[];if(!$('modal').open){dialogWasPaused=game.paused;game.paused=true;}$('dialog-content').innerHTML=html;$('modal').scrollTop=0;const title=$('dialog-content').querySelector('h2');if(title){title.id='dialog-title';$('modal').setAttribute('aria-labelledby','dialog-title');}if(!$('modal').open)$('modal').showModal();updateUI();}
function closeDialog(){if($('modal').open)$('modal').close();}
$('modal').addEventListener('close',()=>{audio.stopPreviews();movePreviews=[];if(!$('modal').open)game.paused=dialogWasPaused||document.hidden;updateUI();});
function confirmReset(mapIndex,difficultyId=game.difficulty.id){
  if(game.wave===0&&game.towers.length===0||['won','lost'].includes(game.status)){reset(mapIndex,difficultyId);return;}
  const d=difficultyFor(difficultyId),changing=d.id!==game.difficulty.id;
  showDialog(`<div class="eyebrow">A FRESH START · ${d.name.toUpperCase()}</div><h2>${changing?`Try ${d.name} difficulty?`:mapIndex===game.mapIndex?'One more adventure?':'Take the scenic route?'}</h2><p class="dialog-intro">Start ${MAPS[mapIndex].name} on ${d.name} with ${d.coins} coins and ${d.hearts} hearts. Your placed team, XP, run bonuses, and wave progress will reset. Your collection and personal bests stay saved.</p><div class="dialog-actions"><button class="primary-button" id="confirm-reset">Let’s go ${icon('arrow')}</button><button class="secondary-button" data-close>Keep playing</button></div>`);
  $('confirm-reset').onclick=()=>{saveRecord();closeDialog();reset(mapIndex,d.id);};
}
function showGuide(){showDialog(`<div class="eyebrow">THE TRAINER’S FIELD GUIDE</div><h2>A small team. A good plan.</h2><p class="dialog-intro">Protect your Pokémon Center through 15 waves of wild Pokémon. On ${game.difficulty.name}, you start with ${game.difficulty.coins} coins and ${game.maxLives} hearts. Choose Easy, Normal, Hard, or Expert above the battlefield. Higher modes have tougher, faster, larger waves. Every regular wild Pokémon that reaches home costs a heart; bosses cost five. Optional visitors leave peacefully without costing hearts.</p><div class="guide-steps"><div class="guide-step"><span class="step-number">01</span><div><strong>Pick a partner. Find a clearing.</strong><p>Start with Bulbasaur, Charmander, Squirtle, and Pikachu. Catch Onix and clear wave 5 to permanently unlock Eevee. Catch marked rare visitors and finish their wave to add more Gen 1 partners to your collection. Choose a partner, then click a + clearing along the path. Hover over a clearing to preview its attack range. Your Pokémon attack automatically.</p></div></div><div class="guide-step"><span class="step-number">02</span><div><strong>Make a little room for everyone.</strong><p>Squirtle slows the crowd, Charmander deals splash damage, and Bulbasaur adds poison. Electric beats Flying and Water; Grass and Water are strong against Rock. Look at the next wave before choosing.</p></div></div><div class="guide-step"><span class="step-number">03</span><div><strong>Grow together.</strong><p>Earn coins by catching wild Pokémon and clearing waves. The opening has fewer, softer enemies and lower catch bounties; a clean first wave helps fund your next partner. Every Pokémon that helps catch an enemy earns ${XP_RULES.catch} XP, up to ${XP_RULES.combatCap} combat XP per wave. Partners placed before the wave starts earn another ${XP_RULES.clear} XP when it clears, even if they guard a quiet stretch. Boss helpers earn ${XP_RULES.boss} extra XP. Attacks alone give no XP. At ${XP_THRESHOLDS[1]} total XP, choose a free evolution; at ${XP_THRESHOLDS[2]}, grow to level 3. The training picnic gives ${XP_RULES.picnic} XP per partner. Eevee can use a Water, Thunder, or Fire Stone. Recall returns 70% of placement cost and loses that partner’s XP. Catch the bosses on waves 5 and 10, then clear the wave to choose a reward: team XP, +12% power, or coins and hearts. Catch Dragonite on wave 15 for 1,000 bonus points. Escaped bosses give no reward. Rare visitors are guaranteed on waves 4, 8, and 12, with a 25% chance on waves 6, 7, 9, 11, and 13. A route’s legendary bird arrives last in wave 14. Every visitor has a 10% shiny chance; shiny colors are cosmetic. Repeat catches give 75 bonus coins unless they unlock a new shiny. Your collection survives restarts and is shared across routes and difficulties in this browser.</p></div></div></div><div class="guide-keys"><span><kbd>1</kbd>–<kbd>9</kbd> Pick an unlocked Pokémon</span><span><kbd>Space</kbd> Start / pause</span><span><kbd>Esc</kbd> Cancel selection</span><span><kbd>Tab</kbd> Navigate · <kbd>Enter</kbd> Choose</span></div><div class="dialog-actions"><button class="primary-button" data-close>I’ve got this ${icon('arrow')}</button></div>`);}

function unlockHint(t){
  if(STARTER_IDS.includes(t.id))return 'Starter · always available';
  if(t.id===133)return t.unlock;
  const route=ROUTE_VISITORS.findIndex(r=>r.legendary===t.id||r.rare.includes(t.id));
  return t.legendary?MAPS[route].name+' · last arrival in wave 14':MAPS[route].name+' · rare visitor, waves 4–13';
}
function showDex(){
  showDialog(`<div class="eyebrow">YOUR KANTO COLLECTION · ${availableTowers().length} / ${TOWERS.length}</div><h2>Four friends. More to discover.</h2><p class="dialog-intro">Catch a marked visitor, then clear its wave to recruit it permanently. Unlocked partners can be placed with coins on any route or difficulty. Each visitor has a 10% shiny chance; sparkles and colors are cosmetic. Repeat catches give +75 coins unless they unlock a new shiny.</p><p class="collection-save">${collectionSaved?'Saved in this browser. Restarts keep your collection.':'Browser storage is unavailable. Your collection lasts for this session only.'}</p><div class="dex-grid">${TOWERS.map(t=>{const owned=game.available(t.id),entry=game.collection[t.id];return `<article class="dex-entry ${owned?'':'locked-entry'}"><div class="dex-top"><img class="${entry?.useShiny?'shiny-sprite':''}" src="./assets/${t.id}.png" alt="${t.name}"><div><span class="collection-status">${owned?STARTER_IDS.includes(t.id)?'STARTER':entry?.shiny?'★ SHINY FOUND':'RECRUITED':t.legendary?'LEGENDARY · LOCKED':'NOT YET RECRUITED'}</span><h3>${t.name}</h3>${typeTag(t.type)}</div></div><p><b>${unlockHint(t)}</b></p><p>${t.description}</p><small>${[...new Set(t.names)].join(' → ')}${t.id===133?' → Vaporeon / Jolteon / Flareon':''} · ${t.cost} coins</small>${entry?.shiny?`<button class="shiny-toggle" data-shiny="${t.id}" aria-pressed="${entry.useShiny}" aria-label="Use shiny colors for ${t.name}">${entry.useShiny?'★ Shiny colors on':'Use shiny colors'}</button>`:''}</article>`}).join('')}</div>`);
}
function renderEncounters(){
  const route=ROUTE_VISITORS[game.mapIndex],wave=game.status==='wave'?game.wave:Math.min(15,game.wave+1),forecast=visitorForecast(game.mapIndex,wave);
  const key=JSON.stringify([game.mapIndex,wave,game.status,game.visitor,game.lastRecruits]);if(key===encounterKey)return;encounterKey=key;
  const visitor=game.status==='wave'?game.visitor:null;
  const note=game.status==='wave'?(visitor?`Wave ${wave}: ${visitor.shiny?'★ Shiny ':''}${ENEMIES[visitor.kind].name} arrives after the regular wave.`:'No visitor this wave. Watch for the next sighting.'):forecast?(forecast.guaranteed?`Wave ${wave}: ${forecast.kind?ENEMIES[forecast.kind].name:'a rare visitor'} will arrive last.`:'Next wave: 25% chance of a bonus visitor.'):'Guaranteed rare sightings on waves 4, 8, and 12.';
  $('encounters').innerHTML=`<div class="encounter-copy"><div class="eyebrow">FIELD NOTES · ${game.map.name.toUpperCase()}</div><strong>Something rare is out there.</strong><p>${note}</p><small>Catch + clear the wave to recruit. Visitors cost no hearts if they escape.</small></div><div class="visitor-portraits">${route.rare.map(id=>`<span><img src="./assets/${id}.png" alt=""><small>${ENEMIES[id].name}</small></span>`).join('')}<span class="legendary-portrait"><img src="./assets/${route.legendary}.png" alt=""><small>${ENEMIES[route.legendary].name} · W14</small></span></div>`;
  $('new-friends').hidden=!game.lastRecruits.length;$('new-friends').innerHTML=game.lastRecruits.map(r=>`<div><img class="${r.shiny?'shiny-sprite':''}" src="./assets/${r.kind}.png" alt=""><span><b>${r.newShiny?'★ Shiny discovered':r.fresh?'A new friend!':'A familiar friend!'} · ${TOWERS.find(t=>t.id===r.kind).name}</b><small>${r.bonus?'+75 bonus coins. Already in your collection.':r.newShiny?'Shiny colors unlocked. Change them in your collection.':'Added to your collection. Ready to place on any route.'}</small></span></div>`).join('');
}

function resultDialog(){saveRecord();renderMapUI();const won=game.status==='won';showDialog(`<div class="result-content"><img class="result-art" src="./assets/${won?25:133}.png" alt="${won?'Pikachu':'Eevee'}"><div class="eyebrow">${won?'FIFTEEN WAVES. ONE INCREDIBLE TEAM.':'THE JOURNEY IS JUST BEGINNING.'}</div><h2>${won?'That’s a mighty defense.':'A little wiser. A little stronger.'}</h2><p class="dialog-intro">${won?`You kept ${game.map.name} safe on ${game.difficulty.name}. ${game.bossesCaught} bosses caught! ${game.bossCaught?"Dragonite caught: +1,000 bonus points.":"Your Pokémon Center sends its thanks!"}`:'The wild Pokémon reached home. Try different evolution paths and use your boss rewards on the next adventure.'}</p><div class="result-stats"><div><strong>${game.wave}</strong><span>WAVES REACHED</span></div><div><strong>${game.kills}</strong><span>POKÉMON CAUGHT</span></div><div><strong>${game.score.toLocaleString()}</strong><span>POINTS EARNED</span></div></div><div class="dialog-actions"><button class="primary-button" id="result-restart">${won?'Another adventure':'Try again'} ${icon('arrow')}</button>${won&&game.mapIndex<2?'<button class="secondary-button" id="next-route">Explore the next route</button>':'<button class="secondary-button" data-close>View my team</button>'}</div></div>`);$('result-restart').onclick=()=>{closeDialog();reset(game.mapIndex);};if($('next-route'))$('next-route').onclick=()=>{closeDialog();reset(game.mapIndex+1);};}
function handleEvents(){
  for(const event of game.events.splice(0)){
    if(event.type==='attack'&&!game.paused&&!document.hidden)audio.attack(event.visual,event.x);
    if(event.type==='place')tone(710,.09);
    if(event.type==='recruit'){saveCollection();renderRoster();encounterKey='';tone(1200,.18);}
    if(event.type==='visitor'){toast(`${event.shiny?'★ Shiny ':event.legendary?'Legendary visitor: ':'Rare visitor: '}${ENEMIES[event.kind].name}! Catch it and finish the wave to recruit it.`);tone(1150,.2);}
    if(event.type==='visitorEscaped')toast(`${ENEMIES[event.kind].name} slipped away. No hearts lost; try again on another run.`);
    if(event.type==='ready'){tone(980,.09);toast(`${towerStats(event.tower).name} is ready to grow! Choose a free evolution.`);renderPads();}
    if(event.type==='upgrade'){if(!document.hidden)audio.evolution(event.tower.level);toast(`${towerStats(event.tower).name} grew to level ${event.tower.level}! ${towerStats(event.tower).move} is ready.`);renderPads();}
    if(event.type==='bossReward')showBossReward();
    if(event.type==='rewardClaimed'){tone(1100,.18);toast(`${rewardOptions(event.wave).find(r=>r.id===event.id).name} claimed. Your team is ready!`);}
    if(event.type==='sell'){tone(420,.08);renderPads();}
    if(event.type==='wave'){tone(540,.14);if(waveInfo(event.wave).boss)toast(`${ENEMIES[waveInfo(event.wave).boss].name} is approaching. Ready your team!`);}
    if(event.type==='catch')tone(760,.035);
    if(event.type==='leak')tone(150,.12,'triangle');
    if(event.type==='clear'){saveRecord();tone(880,.18);toast(`Wave ${game.wave} cleared! +${event.reward} coins for your team.`);}
    if(event.type==='won'||event.type==='lost'){tone(event.type==='won'?1040:220,.3);resultDialog();}
  }
}
$('roster').addEventListener('click',e=>{const card=e.target.closest('[data-kind]');if(card)selectKind(Number(card.dataset.kind));});
$('pad-buttons').addEventListener('click',e=>{const pad=e.target.closest('[data-pad]');if(pad)onPad(Number(pad.dataset.pad));});
$('pad-buttons').addEventListener('pointerover',e=>{const pad=e.target.closest('[data-pad]');if(pad)ui.hoverPad=Number(pad.dataset.pad);});
$('pad-buttons').addEventListener('pointerout',()=>{ui.hoverPad=null;});
$('pad-buttons').addEventListener('focusin',e=>{if(e.target.dataset.pad)ui.hoverPad=Number(e.target.dataset.pad);});
$('pad-buttons').addEventListener('focusout',()=>{ui.hoverPad=null;});
$('battlefield').addEventListener('click',()=>{if(ui.selectedKind!==null)toast('Choose a marked + clearing to place your Pokémon.');else{ui.selectedTower=null;updateUI();}});
$('selection-detail').addEventListener('click',e=>{if(e.target.closest('#upgrade')||e.target.closest('#preview-moves'))showEvolution(ui.selectedTower);if(e.target.closest('#sell')){game.sell(ui.selectedTower);ui.selectedTower=null;renderPads();}updateUI();});
$('dialog-content').addEventListener('click',e=>{const button=e.target.closest('#toggle-preview');if(button){const paused=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play previews':'Pause previews';}});
$('dialog-content').addEventListener('click',async e=>{
  if(e.target.closest('#preview-sound-toggle')){toggleSound();return;}
  const button=e.target.closest('[data-hear-move],[data-hear-evolution]');if(!button||!sound)return;
  if(!await audio.unlock()||!button.isConnected)return;
  const partner=movePreviews[Number(button.dataset.hearMove)]?.tower;
  const isEvolution=button.hasAttribute('data-hear-evolution'),stats=partner?towerStats(partner):null;
  const cue=isEvolution?evolutionCue(Number(button.dataset.hearEvolution)):stats?attackCue(attackVisual(stats,partner.level,partner.branch)):null;
  if(cue&&audio.play(cue,{kind:'preview'}))$('sound-preview-status').textContent=isEvolution?'Sound preview: evolution fanfare.':`Sound preview: ${stats.move}.`;
});
$('ready-partners').addEventListener('click',e=>{const button=e.target.closest('[data-evolve]');if(button)showEvolution(Number(button.dataset.evolve));});
$('dialog-content').addEventListener('click',e=>{const shiny=e.target.closest('[data-shiny]');if(shiny){const kind=Number(shiny.dataset.shiny);game.setShiny(kind,!game.collection[kind].useShiny);saveCollection();renderRoster();showDex();return;}const branch=e.target.closest('[data-branch]'),reward=e.target.closest('[data-reward]');if(branch&&game.upgrade(Number(branch.dataset.tower),branch.dataset.branch)){closeDialog();detailKey='';renderPads();updateUI();}if(reward&&game.claimReward(reward.dataset.reward)){closeDialog();updateUI();}});
$('route-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-map]');if(tab&&Number(tab.dataset.map)!==game.mapIndex)confirmReset(Number(tab.dataset.map));});
$('difficulty-options').addEventListener('click',e=>{const button=e.target.closest('[data-difficulty]');if(button&&button.dataset.difficulty!==game.difficulty.id)confirmReset(game.mapIndex,button.dataset.difficulty);});
$('start-wave').onclick=start;$('pause').onclick=pause;$('resume').onclick=pause;$('restart').onclick=()=>confirmReset(game.mapIndex);
$('speed').onclick=()=>{speed=speed===1?2:speed===2?3:1;$('speed').innerHTML=icon('fast')+`<span>${speed}×</span>`;$('speed').setAttribute('aria-label',`Change game speed, currently ${speed} times`);};
$('sound').onclick=toggleSound;
$('collection-button').onclick=showDex;
$('help-nav').onclick=showGuide;$('field-guide').onclick=showGuide;$('dex-nav').onclick=showDex;$('close-modal').onclick=closeDialog;
$('play-nav').onclick=()=>{$('canvas-wrap').scrollIntoView({behavior:ui.reducedMotion?'instant':'smooth',block:'center'});};
$('modal').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDialog();if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
$('credits').onclick=()=>showDialog(`<div class="eyebrow">MADE FOR THE LOVE OF THE ADVENTURE</div><h2>Thank you for playing PokeWallClash.</h2><p class="dialog-intro">PokeWallClash is an unofficial, noncommercial fan game. Pokémon and Pokémon character names and artwork belong to Nintendo, Game Freak, and The Pokémon Company. This game is not affiliated with or endorsed by them.</p><div class="credit-links"><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">Roster sprites: PokeAPI ↗</a><br><a href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noopener noreferrer">Directional animations: SpriteCollab / Pokémon Mystery Dungeon ↗</a><br><a href="./assets/directional/CREDITS.txt" target="_blank" rel="noopener noreferrer">Animation artists and credits ↗</a> · <a href="./assets/directional/LICENSE.md" target="_blank" rel="noopener noreferrer">License ↗</a></div><p class="dialog-intro">Animation sheets, frame timing, ground anchors, and attack emitters were adapted from Pokémon Arena. Original artwork is by CHUNSOFT and the credited SpriteCollab artists; community contributions use CC BY-NC 4.0. Battlefield illustrations are drawn locally. Personal bests, your collection, shiny preferences, and sound preferences are saved only in this browser.</p>`);
document.addEventListener('keydown',e=>{if($('modal').open)return;if(e.key==='Escape'){ui.selectedKind=null;ui.selectedTower=null;ui.hoverPad=null;updateUI();return;}if(e.code==='Space'&&!e.repeat){if(document.activeElement?.tagName==='BUTTON')return;e.preventDefault();if(game.status==='wave')pause();else start();}if(/^[1-9]$/.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const spec=availableTowers()[Number(e.key)-1];if(spec)selectKind(spec.id);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stopAll();if(game.status==='wave'){game.paused=true;updateUI();}}});
function frame(time){const elapsed=previousTime?Math.min((time-previousTime)/1000,.1):0;previousTime=time;let remaining=elapsed*speed;while(remaining>0){const dt=Math.min(remaining,1/60);game.update(dt);remaining-=dt;}handleEvents();render(context,terrain,game,ui);
  if($('modal').open&&movePreviews.length){if(!ui.reducedMotion&&!document.hidden&&$('toggle-preview')?.getAttribute('aria-pressed')!=='true')previewTime+=elapsed;for(const preview of movePreviews)renderAttackPreview(preview.context,preview.tower,previewTime,ui.reducedMotion);}
  uiTimer+=elapsed;if(uiTimer>.12){updateUI();uiTimer=0;}requestAnimationFrame(frame);}
renderRoster();renderMapUI();soundUI();updateUI();const loaded=await loadSprites();if(loaded.some(ready=>!ready))toast('Some animation art could not load. Reload to retry.');requestAnimationFrame(frame);
