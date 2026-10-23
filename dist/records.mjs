export const recordKey=(mapIndex,difficultyId)=>`${mapIndex}:${difficultyId}`;
const validRecord=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Number.isFinite(value.wave)&&Number.isFinite(value.score);
export function loadRecords(raw){
  let records;try{records=JSON.parse(raw||'{}');}catch{return {};}
  if(!records||typeof records!=='object'||Array.isArray(records))return {};
  const result={};
  for(const [key,value] of Object.entries(records))if(validRecord(value))result[key]={wave:Math.max(0,Math.min(15,value.wave)),score:Math.max(0,value.score),won:value.won===true};
  // Preserve original saves as Normal runs, keeping the old entries intact.
  for(let map=0;map<3;map++){const key=recordKey(map,'normal');if(result[map]&&!result[key])result[key]={...result[map]};}
  return result;
}
export function recordRun(records,game){
  if(game.adminTest)return records;
  const key=recordKey(game.mapIndex,game.difficulty.id),prior=records[key]||{wave:0,score:0,won:false};
  return {...records,[key]:{wave:Math.max(prior.wave,game.wave),score:Math.max(prior.score,game.score),won:prior.won||game.status==='won'}};
}
