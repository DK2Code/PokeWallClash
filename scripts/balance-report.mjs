import {Game,DIFFICULTIES,MAPS,MAX_WAVES,evolutionOptions,xpProgress} from '../dist/game.mjs';

// Fixed strategy, earned coins only, and deterministic visitor rolls make tuning comparable.
export function simulateRun(mapIndex,difficultyId,{waves=MAX_WAVES,random=()=>.99,reward='charm',growDuringWave=true}={}){
  const game=new Game(mapIndex,difficultyId,{random});
  const starting=[[25,0],[1,3],[4,6]],plan=[[4,6],[7,8],[difficultyId==='expert'?1:4,10],[25,12],[difficultyId==='expert'?7:4,2],[1,1],[1,5],[7,7],[4,9],[25,11],[4,13],[7,4]];
  starting.forEach(([kind,pad])=>game.place(kind,pad));
  const rows=[],firstEvolution={},finalEvolution={};
  const grow=()=>{for(const t of game.towers){
    if(!xpProgress(t).ready)continue;
    const choice=difficultyId==='expert'?([25,4].includes(t.kind)?1:0):mapIndex%2;
    if(game.upgrade(t.id,t.branch||evolutionOptions(t)[choice].id)){
      if(t.level===2)firstEvolution[t.pad]=game.wave;
      if(t.level===3)finalEvolution[t.pad]=game.wave;
    }
  }};
  for(let wave=1;wave<=waves;wave++){
    if(game.pendingReward)game.claimReward(reward);
    grow();if(wave>1)for(const [kind,pad] of plan)game.place(kind,pad);
    const startCoins=game.money,startHearts=game.lives,team=game.towers.length;
    if(!game.startWave())throw Error(`Could not start wave ${wave}`);
    let ticks=0,bossNearExit=null;
    while(game.status==='wave'&&ticks++<30*240){
      const boss=game.enemies.find(e=>e.boss&&e.distance>game.length-5);if(boss)bossNearExit=Math.ceil(boss.hp);
      game.update(1/30);if(growDuringWave&&ticks%30===0)grow();
    }
    grow();
    rows.push({wave,team,startCoins,endCoins:game.money,hearts:game.lives,leaks:startHearts-game.lives,seconds:Math.round(ticks/30),frontXP:game.towers[0]?.xp,frontLevel:game.towers[0]?.level,bosses:game.bossesCaught,bossNearExit});
    if(game.status==='lost')break;
    if(game.status==='wave')throw Error(`Wave ${wave} did not finish`);
  }
  return {map:game.map.name,difficulty:game.difficulty.name,status:game.status,hearts:game.lives,bosses:game.bossesCaught,firstEvolution,finalEvolution,rows};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/balance-report.mjs')){
  const quick=process.argv.includes('--opening');
  const arg=name=>process.argv.find(v=>v.startsWith(`--${name}=`))?.split('=')[1];
  const modes=DIFFICULTIES.filter(d=>!arg('difficulty')||d.id===arg('difficulty'));
  const settings={waves:Number(arg('waves')||MAX_WAVES),reward:arg('reward')||'charm'};
  const runs=quick?[simulateRun(0,'normal',{...settings,waves:5})]:modes.flatMap(d=>MAPS.map((_,map)=>simulateRun(map,d.id,settings)));
  console.log(JSON.stringify(process.argv.includes('--summary')?runs.map(r=>({map:r.map,difficulty:r.difficulty,status:r.status,hearts:r.hearts,bosses:r.bosses,firstEvolution:r.firstEvolution[0],finalEvolution:r.finalEvolution[0],openingHearts:r.rows.slice(0,5).map(w=>w.hearts)})):runs,null,2));
}
