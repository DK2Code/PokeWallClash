import {SPECIAL_PARTNERS,SPECIAL_TOWERS} from './special-partners.mjs';
import {Game,TOWERS,MAPS,MAX_WAVES,ENEMIES,DIFFICULTIES,difficultyFor,towerStats,waveInfo,xpProgress,evolutionOptions,rewardOptions,XP_THRESHOLDS,XP_RULES,INTERMISSION_SECONDS} from './game.mjs';
import {loadSprites,createTerrain,render,renderAttackPreview} from './art.mjs';
import {attackVisual} from './combat-visuals.mjs';
import {GameAudio,attackCue,evolutionCue} from './audio.mjs';
import {loadRecords,recordKey,recordRun} from './records.mjs';
import {STARTER_IDS,RARE_VISITORS,INITIAL_SLOTS,readCollectionProgress,loadCollectionProgress,usedSlots,slotPrice,MAX_SLOTS,partnerPrice} from './collection.mjs';
import {visitorPreview} from './visitor-preview.mjs';
import {CatchCelebrations,catchMessage} from './catch-celebration.mjs';
import {loadTerrainArt,ROUTE_EXITS} from './terrain.mjs';
import {routePickerMarkup,difficultySummary} from './route-picker.mjs';
import {AdminTesting,persistCollection} from './admin-testing.mjs';
const $=id=>document.getElementById(id);
const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const themes={electric:['#f4eac0','#b49b4b'],grass:['#e5edd6','#8a9f70'],fire:['#f3e2d4','#c19173'],water:['#dfecef','#80a4b1'],flying:['#eae4f0','#a392b6'],bug:['#e8edd2','#8e9b56'],normal:['#eee6d9','#a8987e'],psychic:['#eee1f3','#9364a0'],dragon:['#e8e3f5','#8270ad'],ice:['#def1f5','#558e9b']};
Object.assign(themes,{poison:['#ecdfef','#9c72a5'],ground:['#eee4d2','#aa8d60'],rock:['#e9e5d8','#968969'],fighting:['#f0ded7','#b17b69'],ghost:['#e6e0ef','#8c7aa4'],dark:['#e7e0de','#8c7773'],steel:['#e1e9e9','#7b9498'],fairy:['#f2e1eb','#bb8aa6']});
const typeTag=type=>`<span class="type-tag" style="--type-bg:${themes[type][0]};--type-ink:${themes[type][1]}">${type}</span>`;
// Keep the original save keys so the rename preserves personal bests and preferences.
let records={};try{records=loadRecords(localStorage.getItem('pokeall-records'));}catch{}
let sound=false;try{sound=localStorage.getItem('pokeall-sound')==='true';}catch{}
const audio=new GameAudio({enabled:sound});
let collectionProgress=loadCollectionProgress();try{collectionProgress=readCollectionProgress(localStorage);}catch{}
let game=new Game(0,'normal',{collectionProgress});
const admin=new AdminTesting();let normalSpeed=1,normalBattleDialog=null;
const celebrations=new CatchCelebrations();let celebrationRevision=-1,pendingBattleDialog=null;
let encounterKey='',collectionSaved=true;
const availableTowers=()=>TOWERS.filter(t=>game.available(t.id));
function saveCollection(){if(game.adminTest)return;try{persistCollection(localStorage,game);collectionSaved=true;}catch{if(collectionSaved)toast('Collection and points are available this session, but browser storage could not save them.');collectionSaved=false;}}
function renderCelebration(){
  if(celebrationRevision===celebrations.revision)return;celebrationRevision=celebrations.revision;
  const event=celebrations.current,container=$('catch-celebration');container.hidden=!event;
  if(!event){container.innerHTML='';$('catch-announcement').textContent='';return;}
  const name=(ENEMIES[event.kind]||TOWERS.find(t=>t.id===event.kind)).name,message=catchMessage(event,name);
  container.classList.toggle('catch-special',event.special);
  container.innerHTML=`<div class="catch-card"><img class="${event.shiny?'shiny-sprite':''}" src="./assets/${event.kind}.png" alt=""><div class="catch-copy"><small>${message.heading}</small><strong>${message.name}</strong><p>${message.detail}</p></div></div>${event.special?'<span class="catch-spark">✦</span><span class="catch-spark">✧</span><span class="catch-spark">✦</span>':''}`;
  if(event.special)$('catch-announcement').textContent=`${message.heading} ${message.name}. ${message.detail}.`;
}
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
  const available=availableTowers();$('roster-count').textContent=String(available.length).padStart(2,'0');renderCollectionButton();$('roster-description').textContent='Catch new friends. Choose who joins your team.';$('eevee-hint').innerHTML=game.available(133)?'✦ Eevee joined your team. Choose its stone evolution in battle.':game.collection[133]?'✦ Eevee is caught! Recruit it in Collection for 50 points.':'<b>Special reward: Eevee</b><br>Defeat Onix and clear wave 5 on any route.';
  $('roster').innerHTML=available.map((t,i)=>`<button class="pokemon-card" data-kind="${t.id}" aria-label="Select ${t.name}, ${t.type}, ${t.cost} coins" aria-pressed="false"><span class="key">${i<9?i+1:game.collection[t.id]?.useShiny?"★":"✦"}</span><img class="sprite ${game.collection[t.id]?.useShiny?"shiny-sprite":""}" src="./assets/${t.id}.png" alt="" draggable="false"><strong>${t.name}</strong><span class="card-bottom">${typeTag(t.type)}<span class="cost">${icon('coin')}${t.cost}</span></span></button>`).join('');
}
function renderCollectionButton(){const waiting=Object.values(game.collection).filter(e=>e.reserve).length;$('collection-button').textContent=`Collection · ${usedSlots(game.collection)} / ${game.collectionSlots} team slots · ${game.collectionPoints} pts${waiting?` · ${waiting} to recruit`:''}`;}
function renderPads(){
  $('pad-buttons').innerHTML=game.map.pads.map(([x,y],i)=>{const tower=game.towers.find(t=>t.pad===i),bonus=game.map.boostPads?.includes(i)?' Crystal clearing: +20% attack range.':'';return `<button class="pad-button" data-pad="${i}" style="left:${x/960*100}%;top:${y/560*100}%" aria-label="${tower?`${towerStats(tower).name}, level ${tower.level}, clearing ${i+1}. Select to upgrade.`:`Empty clearing ${i+1}. Place selected Pokémon.`}${bonus}" title="${tower?`${towerStats(tower).name} · Level ${tower.level}`:`Clearing ${i+1}`}${bonus}"><span class="sr-only">${tower?towerStats(tower).name:`Clearing ${i+1}`}</span></button>`;}).join('');
}
function renderMapUI(){
  $('map-title').textContent=game.map.name;$('region-label').textContent=game.map.region;
  $('difficulty').textContent=game.difficulty.name;$('difficulty').dataset.mode=game.difficulty.id;
  $('difficulty').setAttribute('aria-label',`Change difficulty, currently ${game.difficulty.name}`);
  $('exit-label').textContent=`Protect the ${ROUTE_EXITS[game.map.theme].name.toLowerCase()}`;
  $('battlefield').setAttribute('aria-label',`${game.map.name}. Defend the ${ROUTE_EXITS[game.map.theme].name.toLowerCase()}. Choose a partner, then a clearing to place it.`);
  document.querySelector('.weather span').textContent=game.map.weather||'Clear skies';
  renderPads();updateRecord();
}
let routeSelection=null;
function updateRouteSelection(){
  const {mapIndex,difficultyId}=routeSelection,map=MAPS[mapIndex];
  document.querySelectorAll('[data-route-choice]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.routeChoice)===mapIndex)));
  document.querySelectorAll('[data-pace-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.paceChoice===difficultyId)));
  document.querySelectorAll('[data-route-complete]').forEach(label=>label.textContent=records[recordKey(Number(label.dataset.routeComplete),difficultyId)]?.won?'✓ CLEARED':'');
  $('route-choice-note').innerHTML=`<strong>${map.feature||map.name}</strong>${map.featureDescription||map.subtitle+' Place partners near bends to cover more of the path.'}`;
  $('pace-summary').textContent=difficultySummary(difficultyId);
  $('apply-route').textContent=mapIndex===game.mapIndex&&difficultyId===game.difficulty.id?'Back to game':'Play this route';
}
function showRoutes(){
  routeSelection={mapIndex:game.mapIndex,difficultyId:game.difficulty.id};
  showDialog(routePickerMarkup(routeSelection,records));updateRouteSelection();
  document.querySelectorAll('[data-route-preview]').forEach(canvas=>{const i=Number(canvas.dataset.routePreview),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(createTerrain(MAPS[i],i),0,0,canvas.width,canvas.height);});
}
function updateRecord(){const record=records[recordKey(game.mapIndex,game.difficulty.id)];$('best-label').textContent=game.adminTest?'ADMIN TEST · RECORDS DISABLED':`PERSONAL BEST · ${game.difficulty.name.toUpperCase()}`;$('best-record').textContent=game.adminTest?'Normal progress is protected':record?.won?'All 15 waves cleared':record?.wave?`Wave ${record.wave} · ${(record.score||0).toLocaleString()} score`:'A new adventure';}
function saveRecord(){if(game.adminTest)return;records=recordRun(records,game);try{localStorage.setItem('pokeall-records',JSON.stringify(records));}catch{}updateRecord();}
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
    if(!spec){$('selection-detail').innerHTML=`<div class="selection-empty">${icon('spark')}<div><strong>Small battles. Big transformations.</strong><p>Share battle XP and earn team XP when a wave clears. Grow at ${XP_THRESHOLDS[1]} XP, then ${XP_THRESHOLDS[2]} XP.</p></div></div>`;return;}
    $('selection-detail').innerHTML=`<div class="detail-heading"><strong>${t?spec.name:spec.ability}</strong><span id="detail-level">${t?`LEVEL ${t.level} · ${t.kills} DEFEATED`:'READY TO PLACE'}</span></div><p class="detail-description">${t?`${spec.move} · ${spec.ability}.${spec.pathName?` ${spec.pathName} path.`:''}${t.routeRange>1?' Crystal clearing: +20% range.':''}`:spec.description}</p><div class="detail-stats"><span>POWER <b>${spec.damage}</b></span><span>RANGE <b>${Math.round(spec.range*10)/10}</b></span><span>RATE <b>${(1/spec.rate).toFixed(1)}/s</b></span></div>${t?`<div class="xp-block ${progress.ready?'is-ready':''}"><div class="xp-label"><strong>${t.level===3?'★ Fully grown':progress.ready?'✦ Ready to grow':'BATTLE EXPERIENCE'}</strong><span id="xp-count"></span></div><div class="xp-track" id="xp-meter" role="progressbar" aria-label="Evolution experience" aria-valuemin="0" aria-valuemax="${progress.goal}"><span id="xp-fill"></span></div><small>${t.level===3?'Your chosen move is at its strongest.':'Each helper +2/defeat · max 12/wave. Pre-wave team +6/clear.'}</small></div><div class="tower-actions"><button class="upgrade-button" id="upgrade" ${!progress.ready||['won','lost'].includes(game.status)?'disabled':''}>${t.level===3?'★ Fully trained':progress.ready?(t.level===1?'Choose evolution · FREE':'Grow to level 3 · FREE'):`Needs ${progress.goal} total XP`}</button><button class="sell-button" id="sell" ${['won','lost'].includes(game.status)?'disabled':''}>Recall +${Math.floor(t.spent*.7)}</button></div>`:`<p class="growth-hint">Shared defeats +${XP_RULES.defeat} XP (up to ${XP_RULES.combatCap}/wave). Pre-wave teammates +${XP_RULES.clear} XP on a clear.</p>`}`;
  }
  if(t){
    if(!$('preview-moves')){const button=document.createElement('button');button.id='preview-moves';button.className='move-preview-button';button.textContent=t.level===3?'Preview signature move':'Preview evolution moves';$('selection-detail').append(button);}
    $('detail-level').textContent=`LEVEL ${t.level} · ${t.kills} DEFEATED`;$('xp-count').textContent=`${Math.floor(progress.xp)} XP · ${progress.goal} to grow`;
    if(t.level===3)$('xp-count').textContent='MAX LEVEL';
    $('xp-fill').style.width=`${progress.percent}%`;$('xp-meter').setAttribute('aria-valuenow',String(Math.min(progress.goal,progress.xp)));}
}
function renderGrowth(){
  const ready=game.towers.filter(t=>xpProgress(t).ready),key=JSON.stringify([ready.map(t=>[t.id,t.level,t.species,t.shiny]),game.rewardHistory,game.bossesDefeated,game.status]);if(key===growthKey)return;growthKey=key;
  $('ready-partners').hidden=!ready.length||['won','lost'].includes(game.status);
  $('ready-partners').innerHTML=`<span class="eyebrow">✦ ${ready.length} READY TO EVOLVE · FREE</span><div>${ready.map(t=>`<button data-evolve="${t.id}" aria-label="Evolve ${t.shiny?'shiny ':''}${towerStats(t).name} in clearing ${t.pad+1}"><img class="${t.shiny?'shiny-sprite':''}" src="./assets/${t.species}.png" alt=""><span>${t.shiny?'★ ':''}${towerStats(t).name}<small>Clearing ${t.pad+1} · choose a move</small></span>${icon('arrow')}</button>`).join('')}</div>`;
  $('team-growth').innerHTML=`<span>${icon('spark')} <b>Shared defeats + team XP → evolution</b></span><span>${game.powerCharms?`+${game.powerCharms*12}% team power · `:''}${game.bossesDefeated} / 3 bosses defeated</span>`;
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
  pendingBattleDialog=null;
  const reward=game.pendingReward;if(!reward)return;
  showDialog(`<div class="reward-hero"><img src="./assets/${reward.boss}.png" alt="${ENEMIES[reward.boss].name}"><div><div class="eyebrow">BOSS DEFEATED · WAVE ${reward.wave}</div><h2>A little victory. A big choice.</h2></div></div><p class="dialog-intro">You defeated ${ENEMIES[reward.boss].name}! ${reward.wave===5&&game.collection[133]?'Eevee is saved in your collection. Recruit it for 50 points when you are ready! ':''}Pick one additional reward before the next wave. This bonus lasts for the current adventure.</p><div class="choice-grid reward-grid">${rewardOptions(reward.wave,game.maxLives).map(r=>`<button class="choice-card reward-card" data-reward="${r.id}"><span class="reward-icon">${icon(r.icon)}</span><strong>${r.name}</strong><span class="reward-detail">${r.detail}</span><p>${r.description}</p><span class="choice-cta">Choose reward ${icon('arrow')}</span></button>`).join('')}</div><p class="choice-note">One reward per boss. You can close this window and claim it from the wave panel.</p>`);
}
function updateUI(){
  $('money').textContent=game.money.toLocaleString();$('collection-points').textContent=game.collectionPoints.toLocaleString();$('lives').textContent=game.lives;$('max-lives').textContent=`/ ${game.maxLives}`;$('wave').textContent=game.wave;
  const exchange=game.coinExchangeOffer();$('coin-exchange').classList.toggle('exchange-ready',exchange.canExchange);$('coin-exchange').title=exchange.reason||`${exchange.remaining} available · ${exchange.coins} coins → ${exchange.points} collection points`;
  const preparing=game.status==='build'&&game.nextWaveIn!==null;
  $('pause').disabled=game.status!=='wave'&&!preparing;const pauseLabel=preparing?(game.paused?'Resume countdown':'Pause countdown'):(game.paused?'Resume game':'Pause game');if($('pause').getAttribute('aria-label')!==pauseLabel){$('pause').innerHTML=icon(game.paused?'play':'pause');$('pause').setAttribute('aria-label',pauseLabel);$('pause').title=`${pauseLabel} (Space)`;}
  $('wave-countdown').hidden=!preparing;
  if(preparing){
    const waiting=game.pendingReward?'Choose your boss reward':game.paused?'Countdown paused':!game.towers.length?'Place a Pokémon to continue':celebrations.current?'Enjoy your new catch':null;
    $('countdown-label').textContent=waiting||`Wave ${game.wave+1} starts in`;
    $('countdown-hint').textContent=game.pendingReward?'Your full preparation time is protected.':game.paused?'Build your team, then press Resume.':!game.towers.length?'The timer waits until a partner is placed.':celebrations.current?'The countdown resumes after the celebration.':'Pause for more time · Start now when ready';
    $('countdown-time').textContent=`${Math.ceil(game.nextWaveIn)}s`;
    $('countdown-fill').style.width=`${game.nextWaveIn/INTERMISSION_SECONDS*100}%`;
    $('wave-countdown').classList.toggle('countdown-urgent',!waiting&&game.nextWaveIn<=5);
  }
  $('paused-overlay').hidden=!game.paused||$('modal').open||game.status!=='wave';
  document.querySelectorAll('.pokemon-card').forEach(card=>{const id=Number(card.dataset.kind);card.classList.toggle('selected',ui.selectedKind===id);card.setAttribute('aria-pressed',String(ui.selectedKind===id));card.classList.toggle('unaffordable',game.money<TOWERS.find(t=>t.id===id).cost);});
  const active=game.status==='wave',over=['won','lost'].includes(game.status),info=waveInfo(Math.min(MAX_WAVES,active?game.wave:game.wave+1),game.difficulty.id,game.mapIndex);
  const nextKey=`${game.status}-${game.wave}-${Boolean(game.pendingReward)}`;
  if(waveKey!==nextKey){waveKey=nextKey;$('next-wave-label').textContent=over?'YOUR ADVENTURE':`${active?'ON THE PATH':'UP NEXT'} · WAVE ${String(info.number).padStart(2,'0')}`;$('wave-description').textContent=over?(game.status==='won'?'A team to remember':'There’s always another adventure'):info.label;$('wave-preview').innerHTML=over?`<span class="preview-count">${game.kills} Pokémon defeated · ${game.score.toLocaleString()} score</span>`:[...new Set(info.pool),...(info.boss?[info.boss]:[])].slice(0,5).map(id=>`<img src="./assets/${id}.png" alt="${ENEMIES[id].name}" title="${ENEMIES[id].name} · ${ENEMIES[id].type}">`).join('')+`<span class="preview-count">${info.count} wild Pokémon</span>`;$('wave-reward').innerHTML=icon(over?'trophy':'coin')+(over?`${game.lives} hearts remaining`:` +${info.reward} wave bonus`);$('start-wave').innerHTML=`<span>${over?'Play again':active?'Wave in progress':game.wave===0?'Start wave 1':preparing?'Start now':`Start wave ${game.wave+1}`}</span>${icon(active?'flag':'arrow')}`;}
  if(game.pendingReward){$('start-wave').innerHTML=`<span>Choose boss reward</span>${icon('trophy')}`;$('wave-description').textContent=`${ENEMIES[game.pendingReward.boss].name} defeated!`;$('wave-reward').innerHTML=icon('trophy')+' One reward, your choice';}
  $('start-wave').disabled=active;renderDetails();renderGrowth();renderEncounters();
}
function start(){if(['won','lost'].includes(game.status)){reset(game.mapIndex);return;}if(game.pendingReward){showBossReward();return;}if(game.status!=='build')return;if(!game.towers.length){toast('Place at least one Pokémon before starting the wave.');return;}game.startWave();ui.selectedKind=null;ui.hoverPad=null;updateUI();}
function pause(){if(game.status!=='wave'&&!(game.status==='build'&&game.nextWaveIn!==null))return;game.paused=!game.paused;if(game.paused)audio.stopAll();updateUI();}
function reset(mapIndex,difficultyId=game.difficulty.id){audio.stopAll();game.reset(mapIndex,difficultyId);celebrations.reset();renderCelebration();pendingBattleDialog=null;dialogWasPaused=false;ui.selectedKind=null;ui.selectedTower=null;ui.hoverPad=null;terrain=createTerrain(game.map,mapIndex);waveKey='';detailKey='';growthKey='';renderMapUI();renderRoster();encounterKey='';updateUI();}
function showDialog(html){audio.stopCombat();audio.stopPreviews();movePreviews=[];if(!$('modal').open){dialogWasPaused=game.paused;game.paused=true;}$('dialog-content').innerHTML=html;$('modal').scrollTop=0;const title=$('dialog-content').querySelector('h2');if(title){title.id='dialog-title';$('modal').setAttribute('aria-labelledby','dialog-title');}if(!$('modal').open)$('modal').showModal();if(title){title.tabIndex=-1;title.focus({preventScroll:true});}updateUI();}
function closeDialog(){if($('modal').open)$('modal').close();}
$('modal').addEventListener('close',()=>{audio.stopPreviews();movePreviews=[];if(!$('modal').open)game.paused=dialogWasPaused||document.hidden;updateUI();});
function confirmReset(mapIndex,difficultyId=game.difficulty.id){
  if(game.wave===0&&game.towers.length===0||['won','lost'].includes(game.status)){closeDialog();reset(mapIndex,difficultyId);return;}
  const d=difficultyFor(difficultyId),changing=d.id!==game.difficulty.id;
  showDialog(`<div class="eyebrow">A FRESH START · ${d.name.toUpperCase()}</div><h2>${changing?`Try ${d.name} difficulty?`:mapIndex===game.mapIndex?'One more adventure?':'Take the scenic route?'}</h2><p class="dialog-intro">Start ${MAPS[mapIndex].name} on ${d.name} with ${d.coins} coins and ${d.hearts} hearts. Your placed team, XP, run bonuses, and wave progress will reset. Your collection, unused exchanges, and personal bests stay saved.</p><div class="dialog-actions"><button class="primary-button" id="confirm-reset">Let’s go ${icon('arrow')}</button><button class="secondary-button" data-close>Keep playing</button></div>`);
  $('confirm-reset').onclick=()=>{saveRecord();closeDialog();reset(mapIndex,d.id);};
}
function showGuide(){showDialog(`<div class="eyebrow">THE TRAINER’S FIELD GUIDE</div><h2>Defend. Discover. Grow.</h2><p class="dialog-intro">Protect the route entrance through 15 waves on any of six routes. Start with Bulbasaur, Charmander, Squirtle, and Pikachu. Place partners in + clearings; they attack automatically. Start wave 1 when ready. After each clear, a 20-second countdown starts the next wave; Pause or Space gives you more planning time, and Start now skips the wait. Menus, evolution choices, catch celebrations, and unclaimed boss rewards hold the timer. The countdown always runs at normal speed, even at 2× or 3× battle speed. Difficulty changes starting resources and enemy health, speed, and numbers.</p><div class="guide-steps"><div class="guide-step"><span class="step-number">01</span><div><strong>Defeated is different from caught.</strong><p>Wild Pokémon that lose all HP are defeated. They give coins, score, and battle XP. Only Pokémon that join your collection count as caught and receive a catch celebration. Defeat a marked visitor, then clear its wave to catch it. A failed wave cannot award that visitor. Defeat Onix and clear wave 5 to receive Eevee.</p></div></div><div class="guide-step"><span class="step-number">02</span><div><strong>A surprise around every bend.</strong><p>A random rare visitor arrives last on waves 4, 8, and 12; waves 6, 7, 9, 11, and 13 have a 35% bonus chance. All ${RARE_VISITORS.length} basic visitor species can appear on every route. Route favorites are twice as likely and undiscovered species receive triple weight. Rare visitors never repeat back-to-back in a run. One random legendary bird arrives last in wave 14. Every visitor has a 10% shiny chance. Visitors that escape cost no hearts.</p></div></div><div class="guide-step"><span class="step-number">03</span><div><strong>Build a team worth coming back for.</strong><p>Helpers earn ${XP_RULES.defeat} XP per defeat, capped at ${XP_RULES.combatCap} per wave. Partners placed before the wave receive ${XP_RULES.clear} XP on a clear. Boss helpers earn ${XP_RULES.boss} extra XP. Evolve free at ${XP_THRESHOLDS[1]} and ${XP_THRESHOLDS[2]} XP. Boss wins on waves 5 and 10 offer a picnic, power charm, or supplies; Dragonite on wave 15 gives 1,000 bonus score points.</p><p>${INITIAL_SLOTS} team slots include your four free starters. Every catch stays in Collection until you choose to recruit it: 50 points for a basic partner or Eevee, 300 for a legendary bird. A slot purchase adds empty space; it never selects a Pokémon for you. Discover ${MAX_SLOTS} collectible families and legendary Pokémon. Every cleared wave earns one exchange of 250 coins for 50 points. Unused exchanges stay saved across routes, difficulties, and refreshes. Use Exchange beside your coin and collection-point balances to trade between waves or after a win. Mew costs 2,500 collection points; Mewtwo costs 4,000. Both are permanent rewards in Collection and never appear as random visitors. Repeat catches give 75 coins unless they unlock a new shiny. Collection, shiny choices, points, slots, and personal bests stay saved in this browser.</p></div></div><div class="guide-step"><span class="step-number">04</span><div><strong>Pick a new expedition.</strong><p>Moonlit Cavern’s violet clearings add 20% range. Safari Circuit awards 15 extra collection points on clears 5, 10, and 15. Cinnabar Coast restores two hearts at those same milestones. The new routes have their own enemy mixes after wave 5. Fill your trainer passport by clearing all six routes on your chosen difficulty.</p></div></div></div><div class="guide-keys"><span><kbd>1</kbd>–<kbd>9</kbd> Select a partner</span><span><kbd>Space</kbd> Start / pause</span><span><kbd>Esc</kbd> Cancel</span></div><div class="dialog-actions"><button class="secondary-button" data-admin-open>Admin testing</button><button class="secondary-button" data-credits>Art &amp; credits</button><button class="primary-button" data-close>Let’s explore ${icon('arrow')}</button></div>`);}

function unlockHint(t){
  if(STARTER_IDS.includes(t.id))return 'Starter · always available';
  if(t.id===133)return t.unlock;
  if(SPECIAL_PARTNERS[t.id])return 'Permanent collection-point reward';
  return t.legendary?'Any route · random legendary bird, last in wave 14':'Any route · random rare visitor, waves 4–13';
}

function showDex(){
  const price=slotPrice(game.collectionSlots),used=usedSlots(game.collection),waiting=TOWERS.filter(t=>game.collection[t.id]?.reserve);
  showDialog(`<div class="eyebrow">YOUR KANTO COLLECTION · ${used+waiting.length} / ${TOWERS.length} DISCOVERED</div><h2>Your collection. Your team.</h2>
    <section class="collection-upgrades" aria-label="Collection slots">
      <div class="collection-totals"><div><small>SPENDABLE COLLECTION POINTS</small><strong>${game.collectionPoints.toLocaleString()} <span>pts</span></strong></div><div><small>PARTNER SLOTS</small><strong>${used} <span>/ ${game.collectionSlots} used</span></strong></div></div>
      <div class="collection-actions"><button class="primary-button" id="unlock-slot" ${price===null||game.collectionPoints<price?'disabled':''}>${price===null?`All ${MAX_SLOTS} slots unlocked`:`Unlock slot ${game.collectionSlots+1} · ${price} pts`}</button><button class="secondary-button" data-coin-exchange>Exchange battle coins ⇄</button></div>
      <p id="slot-help">${price===null?'Your collection has room for every partner.':game.collectionPoints<price?`${price-game.collectionPoints} more points needed. Defeat wild Pokémon, catch visitors, and clear waves to earn them.`:`${price} points buys one permanent slot. ${game.collectionSlots+1<MAX_SLOTS?`The following slot costs ${slotPrice(game.collectionSlots+1)} points. Prices cap at 300 points.`:''}`}</p>
      <p class="reserve-note">New slots stay empty until <b>you choose a Pokémon to recruit</b>. Every catch stays saved, even when your team is full.</p>
      <details class="points-guide"><summary>How do I earn collection points?</summary><p>Each ordinary defeat: 1 point; boss defeat: 5. Catch a visitor or Eevee: 10; a legendary: 25. Each wave cleared: 10, plus 50 for finishing a route. Every cleared wave earns one exchange of 250 battle coins for 50 points. Unused exchanges stay saved across routes, difficulties, and refreshes. Points and slots carry across routes and difficulties. Spending them never changes your high score.</p></details>
    </section>
    <p class="dialog-intro">Catches join your collection first. Spend <b>50 points</b> to recruit a chosen partner, or <b>300 for a legendary bird</b>. Recruitment uses one open team slot and lasts across all routes. Your four starters are free; placing teammates in battle still costs coins.</p><p class="collection-save">${game.adminTest?'Admin test collection · not saved. Exit admin to return to your normal collection.':collectionSaved?'Saved in this browser. Restarts keep your collection, points, and slots.':'Browser storage is unavailable. Collection, points, and slots last for this session only.'}</p>
    ${waiting.length?`<section class="recruit-section" aria-label="Caught Pokémon ready to recruit"><div class="recruit-heading"><h3>Choose your next teammate</h3><span>${waiting.length} caught</span></div><div class="dex-grid">${waiting.map(dexEntryMarkup).join('')}</div></section>`:''}
    ${specialPartnerMarkup()}
    <h3 class="catalog-heading">Your team &amp; discoveries</h3><div class="dex-grid">${TOWERS.filter(t=>!SPECIAL_PARTNERS[t.id]&&!game.collection[t.id]?.reserve).map(dexEntryMarkup).join('')}</div>`);
  $('unlock-slot').setAttribute('aria-describedby','slot-help');
  previewTime=.75;movePreviews=Array.from($('dialog-content').querySelectorAll('[data-special-preview]'),canvas=>({context:canvas.getContext('2d'),tower:{kind:Number(canvas.dataset.specialPreview),level:3,branch:'surge',shiny:Boolean(game.collection[canvas.dataset.specialPreview]?.useShiny)}}));
}
function dexEntryMarkup(t){
  const owned=game.available(t.id),entry=game.collection[t.id],price=partnerPrice(t.id),free=usedSlots(game.collection)<game.collectionSlots;
  const canBuy=entry?.reserve&&free&&game.collectionPoints>=price;
  return `<article class="dex-entry ${entry?.reserve?'reserve-entry':owned?'':'locked-entry'}"><div class="dex-top"><img class="${entry?.useShiny?'shiny-sprite':''}" src="./assets/${t.id}.png" alt="${t.name}"><div><span class="collection-status">${entry?.reserve?'CAUGHT · READY TO RECRUIT':owned?STARTER_IDS.includes(t.id)?'STARTER · ON YOUR TEAM':'ON YOUR TEAM':'NOT YET CAUGHT'}</span><h3>${t.name}</h3>${typeTag(t.type)}</div></div><p><b>${entry?.reserve?'A permanent teammate, whenever you choose.':unlockHint(t)}</b></p><p>${t.description}</p><small>${[...new Set(t.names)].join(' → ')}${t.id===133?' → Vaporeon / Jolteon / Flareon':''} · ${t.cost} coins to place</small>${entry?.shiny?`<button class="shiny-toggle" data-shiny="${t.id}" aria-pressed="${entry.useShiny}" aria-label="Use shiny colors for ${t.name}">${entry.useShiny?'★ Shiny colors on':'Use shiny colors'}</button>`:''}${entry?.reserve?`<p class="recruit-hint">${!free?'Unlock a team slot above first.':canBuy?'One open slot · yours on every route.':`${price-game.collectionPoints} more points needed.`}</p><button class="primary-button" data-purchase-partner="${t.id}" ${canBuy?'':'disabled'}>Recruit ${t.name} · ${price} pts</button>`:''}</article>`;
}
function specialPartnerMarkup(){
  return `<section class="special-partners" aria-label="Special partners"><h3>Two extraordinary friends.</h3><p>Use <b>spendable collection points</b>, separate from personal-best score. Each Pokémon also needs one open team slot.</p><p class="special-wallet">Your wallet: <b>${game.collectionPoints.toLocaleString()} collection points</b> · <b>${game.collectionSlots-usedSlots(game.collection)} open team slots</b></p><div class="special-grid">${SPECIAL_TOWERS.map(t=>{
    const offer=game.partnerOffer(t.id),owned=offer.owned,canBuy=offer.canPurchase;
    const next=towerStats({kind:t.id,level:3,branch:'surge'});
    return `<article class="special-card"><header><img class="${game.collection[t.id]?.useShiny?'shiny-sprite':''}" src="./assets/${t.id}.png" alt="${t.name}"><div><small>${SPECIAL_PARTNERS[t.id].title.toUpperCase()}</small><h4>${t.name}</h4>${typeTag('psychic')}</div></header><p>${t.description}</p><canvas class="move-preview" data-special-preview="${t.id}" width="300" height="112" role="img" aria-label="${t.name} trained ${next.move} animation"></canvas><small>Trained move: ${next.move} · ${t.cost} coins to place</small>${owned?'':`<progress value="${Math.min(game.collectionPoints,offer.price)}" max="${offer.price}" aria-label="Points saved for ${t.name}"></progress>`}<p class="unlock-note" id="partner-help-${t.id}">${owned?game.adminTest?'Unlocked for this test session.':'Yours on every route and difficulty.':offer.reason||'Enough collection points and an open slot. Ready to unlock.'}</p>${game.collection[t.id]?.shiny?`<button class="shiny-toggle" data-shiny="${t.id}" aria-pressed="${game.collection[t.id].useShiny}" aria-label="Use shiny colors for ${t.name}">${game.collection[t.id].useShiny?'★ Shiny colors on':'Use shiny colors'}</button>`:''}<button class="primary-button ${owned?'owned-partner':''}" data-purchase-partner="${t.id}" aria-describedby="partner-help-${t.id}" ${canBuy?'':'disabled'}>${owned?game.adminTest?'✓ Test partner unlocked':'✓ Permanently unlocked':`Unlock ${t.name} · ${offer.price.toLocaleString()} pts`}</button></article>`;
  }).join('')}</div><div class="preview-controls"><span>${ui.reducedMotion?'Still previews · reduced motion':'Signature moves · level 3'}</span>${ui.reducedMotion?'':'<button id="toggle-preview" aria-pressed="false">Pause previews</button>'}</div></section>`;
}
function confirmPartner(kind){
  const offer=game.partnerOffer(kind),price=offer.price,partner=TOWERS.find(t=>t.id===kind);if(!offer.canPurchase||!partner){toast(offer.reason||'This partner is unavailable.');return;}
  showDialog(`<div class="eyebrow">A PERMANENT NEW PARTNER</div><h2>Welcome ${partner.name}?</h2><p class="dialog-intro">Spend <b>${price.toLocaleString()} collection points</b> and one open team slot to recruit ${partner.name} on every route. You will have ${(game.collectionPoints-price).toLocaleString()} points left. Placing ${partner.name} in battle costs ${partner.cost} coins.</p><div class="dialog-actions"><button class="primary-button" id="confirm-partner">Recruit ${partner.name}</button><button class="secondary-button" id="back-collection">Back to collection</button></div>`);
  $('back-collection').onclick=showDex;
  $('confirm-partner').onclick=()=>{if(game.purchasePartner(kind)){saveCollection();renderRoster();closeDialog();handleEvents();updateUI();}else{showDex();toast('Check your points and open collection slots.');}};
}
function refreshSessionView(){
  audio.stopAll();celebrations.reset();renderCelebration();pendingBattleDialog=null;
  ui.selectedKind=null;ui.selectedTower=null;ui.hoverPad=null;waveKey='';detailKey='';growthKey='';encounterKey='';
  terrain=createTerrain(game.map,game.mapIndex);$('admin-banner').hidden=!game.adminTest;
  document.body.classList.toggle('admin-testing',game.adminTest);$('speed').value=String(speed);
  renderMapUI();renderRoster();updateUI();
}
function showAdmin(){
  if(admin.active){
    showDialog(`<div class="eyebrow">ADMIN TEST MODE · UNSAVED</div><h2>Try everything.</h2><p class="dialog-intro">All ${TOWERS.length} Pokémon, team slots, and shiny choices are unlocked. Test resources include 100 saved exchanges. Placed partners immediately receive enough XP for every evolution path. Normal progress and records stay untouched.</p><div class="admin-tools"><button class="secondary-button" id="admin-refill">Refill coins, points, exchanges &amp; hearts</button><button class="secondary-button" id="admin-routes">Choose route &amp; difficulty</button><button class="secondary-button" id="admin-collection">Pokémon &amp; shiny colors</button></div><div class="admin-wave"><label for="admin-wave">Test a wave</label><select id="admin-wave">${Array.from({length:MAX_WAVES},(_,i)=>`<option value="${i+1}" ${i+1===Math.min(MAX_WAVES,game.wave+1)?'selected':''}>Wave ${i+1}${[5,10,15].includes(i+1)?' · boss':i+1===14?' · legendary bird':''}</option>`).join('')}</select><button class="secondary-button" id="admin-prepare-wave">Prepare wave</button></div><p class="choice-note">Preparing a wave clears test enemies and keeps your placed team. Press Start wave when ready. All six routes and difficulties are available.</p><div class="dialog-actions"><button class="primary-button" id="admin-exit-dialog">Exit admin &amp; restore game</button><button class="secondary-button" data-close>Keep testing</button></div><p class="choice-note">Exit restores the game you left. Refreshing exits testing and reloads your saved collection; an in-progress normal battle only resumes when you use Exit.</p>`);
    $('admin-refill').onclick=()=>{game.refillTestResources();renderRoster();updateUI();toast('Test resources refilled: 100,000 coins and points. Hearts restored.');};
    $('admin-routes').onclick=showRoutes;$('admin-collection').onclick=showDex;
    $('admin-prepare-wave').onclick=()=>{if(game.prepareTestWave(Number($('admin-wave').value))){dialogWasPaused=false;closeDialog();refreshSessionView();toast(`Test wave ${game.wave+1} ready. Place your team, then start.`);}};
    $('admin-exit-dialog').onclick=exitAdmin;return;
  }
  showDialog(`<div class="eyebrow">LOCAL ADMIN TESTING</div><h2>Open the testing playground.</h2><p class="dialog-intro">Temporarily unlock all Pokémon, shiny colors, slots, evolution choices, and test resources. Your normal game is paused and kept separate.</p><form id="admin-login" class="admin-login"><label for="admin-password">Admin password</label><input id="admin-password" type="password" inputmode="numeric" autocomplete="off" maxlength="20" required aria-describedby="admin-error"><p id="admin-error" role="alert"></p><div class="dialog-actions"><button class="primary-button" type="submit">Enter admin testing</button><button class="secondary-button" type="button" data-close>Cancel</button></div></form><p class="choice-note">This is a browser-only test gate, not an account or server login. Exit admin restores your normal game. A refresh also exits testing.</p>`);
  $('admin-password').focus();
  $('admin-login').onsubmit=e=>{e.preventDefault();const next=admin.enter($('admin-password').value,game,dialogWasPaused);
    if(!next){$('admin-error').textContent='Incorrect password. Try again.';$('admin-password').value='';$('admin-password').focus();return;}
    saveCollection();normalSpeed=speed;normalBattleDialog=pendingBattleDialog;game=next;dialogWasPaused=false;closeDialog();refreshSessionView();toast('Admin testing enabled. Normal progress stays protected.');
  };
}
function exitAdmin(){
  const normal=admin.exit();if(!normal)return;
  game=normal;speed=normalSpeed;dialogWasPaused=normal.paused;closeDialog();refreshSessionView();pendingBattleDialog=normalBattleDialog;normalBattleDialog=null;toast('Admin testing off. Your normal game is restored.');
}
function showCoinExchange(source='game'){
  const offer=game.coinExchangeOffer();
  showDialog(`<div class="eyebrow">BATTLE COINS → COLLECTION POINTS</div><h2>A little extra for your collection.</h2><p class="dialog-intro">Spend spare battle coins to save for your next teammate. Keep enough coins for your defenses.</p><div class="exchange-balances"><span><small>BATTLE COINS</small><strong>${game.money.toLocaleString()}</strong></span><span><small>SPENDABLE COLLECTION POINTS</small><strong>${game.collectionPoints.toLocaleString()}</strong></span></div><div class="exchange-offer"><strong>${offer.coins} coins <span>→</span> ${offer.points} points</strong><p>${offer.remaining.toLocaleString()} saved exchange${offer.remaining===1?'':'s'} available</p></div><p class="dialog-intro">Every cleared wave earns one exchange — up to 15 per completed run. Unused exchanges stay saved when you change difficulty, switch routes, restart, or refresh. Trade between waves or after a win; starting a run never grants extra exchanges.</p><p class="exchange-status" id="exchange-status" role="status">${offer.reason||'Ready to exchange. Your score and team stay the same.'}</p><div class="dialog-actions"><button class="primary-button" id="confirm-exchange" aria-describedby="exchange-status" ${offer.canExchange?'':'disabled'}>Exchange ${offer.coins} coins → ${offer.points} pts</button><button class="secondary-button" id="exchange-collection">Back to collection</button></div>`);
  $('exchange-collection').textContent=source==='collection'?'Back to collection':'Back to game';
  $('exchange-collection').onclick=source==='collection'?showDex:closeDialog;
  $('confirm-exchange').onclick=()=>{if(game.exchangeCoins()){handleEvents();updateUI();showCoinExchange(source);}};
}
function renderEncounters(){
  const wave=game.status==='wave'?game.wave:Math.min(15,game.wave+1),preview=visitorPreview(game);
  const key=JSON.stringify([game.mapIndex,wave,game.status,game.visitorArrived,game.lastRecruits,game.collectionSlots]);if(key===encounterKey)return;encounterKey=key;
  $('encounters').innerHTML=`<div class="encounter-copy"><div class="eyebrow">MYSTERY VISITOR</div><strong>${preview.title}</strong><p>${preview.detail}</p><small>Undiscovered partners have better odds. Every route can bring someone new.</small></div><div class="visitor-mystery" aria-hidden="true">${preview.kind?`<img class="${preview.shiny?'shiny-sprite':''}" src="./assets/${preview.kind}.png" alt="">`:'?'}</div>`;
  $('new-friends').hidden=!game.lastRecruits.length;$('new-friends').innerHTML=game.lastRecruits.map(r=>`<div><img class="${r.shiny?'shiny-sprite':''}" src="./assets/${r.kind}.png" alt=""><span><b>${r.shiny?'★ Shiny caught':r.fresh?'New Pokémon caught!':'Caught again!'} · ${TOWERS.find(t=>t.id===r.kind).name}</b><small>${game.collection[r.kind]?.reserve?'Saved in Collection. Choose to recruit this Pokémon with points.':r.bonus?'+75 bonus coins. Already in your collection.':'Added to your collection. Ready to place on any route.'} +${r.points} collection points.</small></span></div>`).join('');
}

function resultDialog(){saveRecord();renderMapUI();const won=game.status==='won';showDialog(`<div class="result-content"><img class="result-art" src="./assets/${won?25:133}.png" alt="${won?'Pikachu':'Eevee'}"><div class="eyebrow">${won?'FIFTEEN WAVES. ONE INCREDIBLE TEAM.':'THE JOURNEY IS JUST BEGINNING.'}</div><h2>${won?'That’s a mighty defense.':'A little wiser. A little stronger.'}</h2><p class="dialog-intro">${won?`You kept ${game.map.name} safe on ${game.difficulty.name}. ${game.bossesDefeated} bosses defeated! ${game.bossDefeated?"Dragonite defeated: +1,000 bonus score points.":"You protected the route entrance!"}`:'The wild Pokémon reached the entrance. Try different evolution paths and use your boss rewards on the next adventure.'}</p><div class="result-stats"><div><strong>${game.wave}</strong><span>WAVES REACHED</span></div><div><strong>${game.kills}</strong><span>POKÉMON DEFEATED</span></div><div><strong>${game.caught}</strong><span>POKÉMON CAUGHT</span></div><div><strong>${game.score.toLocaleString()}</strong><span>RUN SCORE</span></div></div><div class="dialog-actions"><button class="primary-button" id="result-restart">${won?'Another adventure':'Try again'} ${icon('arrow')}</button>${won&&game.mapIndex<MAPS.length-1?'<button class="secondary-button" id="next-route">Explore the next route</button>':'<button class="secondary-button" data-close>View my team</button>'}</div></div>`);$('result-restart').onclick=()=>{closeDialog();reset(game.mapIndex);};if($('next-route'))$('next-route').onclick=()=>{closeDialog();reset(game.mapIndex+1);};}
function handleEvents(){
  let collectionChanged=false,routeBonusNotice='';
  for(const event of game.events.splice(0)){
    if(event.type==='attack'&&!game.paused&&!document.hidden)audio.attack(event.visual,event.x);
    if(event.type==='place')tone(710,.09);
    if(event.type==='recruit'||event.type==='partnerPurchased'){collectionChanged=true;renderRoster();encounterKey='';celebrations.enqueue(event);tone(1200,.18);}
    if(event.type==='collectionPoints')collectionChanged=true;
    if(event.type==='coinsExchanged'){collectionChanged=true;renderRoster();toast(`Exchanged ${event.coins} coins for ${event.points} collection points.`);tone(1100,.12);}
    if(event.type==='slotUnlocked'){encounterKey='';toast('Empty team slot unlocked. Choose a caught Pokémon in Collection.');tone(1200,.18);}
    if(event.type==='visitor'){encounterKey='';toast(`${event.shiny?'★ Shiny ':event.legendary?'Legendary visitor: ':'Rare visitor: '}${ENEMIES[event.kind].name}! Defeat it, then clear the wave to catch it.`);tone(1150,.2);}
    if(event.type==='visitorEscaped')toast(`${ENEMIES[event.kind].name} slipped away. No hearts lost; try again on another run.`);
    if(event.type==='ready'){tone(980,.09);toast(`${towerStats(event.tower).name} is ready to grow! Choose a free evolution.`);renderPads();}
    if(event.type==='upgrade'){if(!document.hidden)audio.evolution(event.tower.level);toast(`${towerStats(event.tower).name} grew to level ${event.tower.level}! ${towerStats(event.tower).move} is ready.`);renderPads();}
    if(event.type==='bossReward')pendingBattleDialog='boss';
    if(event.type==='rewardClaimed'){tone(1100,.18);toast(`${rewardOptions(event.wave).find(r=>r.id===event.id).name} claimed. Your team is ready!`);}
    if(event.type==='sell'){tone(420,.08);renderPads();}
    if(event.type==='wave'){tone(540,.14);if(waveInfo(event.wave).boss)toast(`${ENEMIES[waveInfo(event.wave).boss].name} is approaching. Ready your team!`);}
    if(event.type==='defeat'){tone(event.boss?940:620,event.boss ? .12 : .03);if(event.visitor)toast(`${ENEMIES[event.kind].name} defeated. Finish the wave to add it to your collection.`);}
    if(event.type==='routeBonus')routeBonusNotice=event.message;
    if(event.type==='leak')tone(150,.12,'triangle');
    if(event.type==='clear'){saveRecord();tone(880,.18);toast(`Wave ${game.wave} cleared! +${event.reward} coins · +${event.points} collection points · +1 exchange.`);}
    if(event.type==='won'||event.type==='lost'){saveRecord();tone(event.type==='won'?1040:220,.3);pendingBattleDialog='result';if(event.type==='lost')celebrations.reset();}
  }
  if(collectionChanged){saveCollection();renderCollectionButton();}if(routeBonusNotice)toast(routeBonusNotice);
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
// Both the debit and new slot are persisted in the same collection save.
$('dialog-content').addEventListener('click',e=>{if(e.target.closest('#unlock-slot')&&game.unlockCollectionSlot()){saveCollection();renderRoster();showDex();$('unlock-slot').focus();}});
$('dialog-content').addEventListener('click',e=>{const shiny=e.target.closest('[data-shiny]');if(shiny){const kind=Number(shiny.dataset.shiny);game.setShiny(kind,!game.collection[kind].useShiny);saveCollection();renderRoster();showDex();return;}const branch=e.target.closest('[data-branch]'),reward=e.target.closest('[data-reward]');if(branch&&game.upgrade(Number(branch.dataset.tower),branch.dataset.branch)){closeDialog();detailKey='';renderPads();updateUI();}if(reward&&game.claimReward(reward.dataset.reward)){closeDialog();updateUI();}});
$('route-picker-button').onclick=showRoutes;$('difficulty').onclick=showRoutes;
$('dialog-content').addEventListener('click',e=>{
  const route=e.target.closest('[data-route-choice]'),pace=e.target.closest('[data-pace-choice]');
  if(route){routeSelection.mapIndex=Number(route.dataset.routeChoice);updateRouteSelection();}
  if(pace){routeSelection.difficultyId=pace.dataset.paceChoice;updateRouteSelection();}
  if(e.target.closest('#apply-route')){
    if(routeSelection.mapIndex===game.mapIndex&&routeSelection.difficultyId===game.difficulty.id)closeDialog();
    else confirmReset(routeSelection.mapIndex,routeSelection.difficultyId);
  }
});
$('start-wave').onclick=start;$('pause').onclick=pause;$('resume').onclick=pause;$('restart').onclick=()=>confirmReset(game.mapIndex);
$('speed').onchange=e=>{speed=Number(e.target.value);};
$('sound').onclick=toggleSound;
$('collection-button').onclick=showDex;
$('admin-open').onclick=showAdmin;$('admin-tools').onclick=showAdmin;$('admin-exit').onclick=exitAdmin;
$('dialog-content').addEventListener('click',e=>{if(e.target.closest('[data-admin-open]'))showAdmin();});
$('coin-exchange').onclick=()=>showCoinExchange();
$('dialog-content').addEventListener('click',e=>{if(e.target.closest('[data-coin-exchange]'))showCoinExchange('collection');});
$('dialog-content').addEventListener('click',e=>{const button=e.target.closest('[data-purchase-partner]');if(button&&!button.disabled)confirmPartner(Number(button.dataset.purchasePartner));});
$('dialog-content').addEventListener('click',e=>{if(e.target.closest('[data-credits]'))showCredits();});
$('help-nav').onclick=showGuide;$('field-guide').onclick=showGuide;$('dex-nav').onclick=showDex;$('close-modal').onclick=closeDialog;
$('play-nav').onclick=()=>{$('canvas-wrap').scrollIntoView({behavior:ui.reducedMotion?'instant':'smooth',block:'center'});};
$('modal').addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDialog();if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
function showCredits(){showDialog(`<div class="eyebrow">MADE FOR THE LOVE OF THE ADVENTURE</div><h2>Thank you for playing PokeWallClash.</h2><p class="dialog-intro">PokeWallClash is an unofficial, noncommercial fan game. Pokémon and Pokémon character names and artwork belong to Nintendo, Game Freak, and The Pokémon Company. This game is not affiliated with or endorsed by them.</p><div class="credit-links"><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">Roster sprites: PokeAPI ↗</a><br><a href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noopener noreferrer">Directional animations: SpriteCollab / Pokémon Mystery Dungeon ↗</a><br><a href="./assets/directional/CREDITS.txt" target="_blank" rel="noopener noreferrer">Animation artists and credits ↗</a> · <a href="./assets/directional/LICENSE.md" target="_blank" rel="noopener noreferrer">License ↗</a></div><p class="dialog-intro">Animation sheets, frame timing, ground anchors, and attack emitters were adapted from the reference engine. Original artwork is by CHUNSOFT and the credited SpriteCollab artists; community contributions use CC BY-NC 4.0. Terrain uses the same local Emerald / FireRed tiles as PokeWallClash, with route entrances drawn for PokeWallClash. See <a href="./assets/world/CREDITS.txt" target="_blank" rel="noopener noreferrer">terrain credits</a>. Personal bests, your collection, shiny preferences, and sound preferences are saved only in this browser.</p>`);}
document.addEventListener('keydown',e=>{if($('modal').open||e.target.closest?.('input,select,textarea,[contenteditable="true"]'))return;if(e.key==='Escape'){ui.selectedKind=null;ui.selectedTower=null;ui.hoverPad=null;updateUI();return;}if(e.code==='Space'&&!e.repeat){if(document.activeElement?.tagName==='BUTTON')return;e.preventDefault();if(game.status==='wave'||game.status==='build'&&game.nextWaveIn!==null)pause();else start();}if(/^[1-9]$/.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const spec=availableTowers()[Number(e.key)-1];if(spec)selectKind(spec.id);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stopAll();if(game.status==='wave'||game.status==='build'&&game.nextWaveIn!==null){game.paused=true;if($('modal').open)dialogWasPaused=true;updateUI();}}});
function frame(time){const elapsed=previousTime?Math.min((time-previousTime)/1000,.1):0;previousTime=time;if(game.advanceIntermission(elapsed,{blocked:document.hidden||$('modal').open||Boolean(celebrations.current)||Boolean(pendingBattleDialog)})){ui.selectedKind=null;ui.hoverPad=null;updateUI();}let remaining=elapsed*speed;while(remaining>0){const dt=Math.min(remaining,1/60);game.update(dt);remaining-=dt;}handleEvents();render(context,terrain,game,ui);
  if(!$('modal').open&&!document.hidden){celebrations.update(elapsed);if(pendingBattleDialog&&!celebrations.current){const next=pendingBattleDialog;pendingBattleDialog=null;if(next==='boss'&&game.pendingReward)showBossReward();else if(next==='result')resultDialog();}}
  renderCelebration();
  if($('modal').open&&movePreviews.length){if(!ui.reducedMotion&&!document.hidden&&$('toggle-preview')?.getAttribute('aria-pressed')!=='true')previewTime+=elapsed;for(const preview of movePreviews)renderAttackPreview(preview.context,preview.tower,previewTime,ui.reducedMotion);}
  uiTimer+=elapsed;if(uiTimer>.12){updateUI();uiTimer=0;}requestAnimationFrame(frame);}
saveCollection();renderRoster();renderMapUI();soundUI();updateUI();const loaded=(await Promise.all([loadSprites(),loadTerrainArt()])).flat();terrain=createTerrain(game.map,game.mapIndex);if(loaded.some(ready=>!ready))toast('Some animation art could not load. Reload to retry.');requestAnimationFrame(frame);
