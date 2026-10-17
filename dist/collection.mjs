export const STARTER_IDS = [1,4,7,25];
export const COLLECTIBLE_IDS = [133,10,63,81,131,37,147,144,145,146];
export const INITIAL_SLOTS=6;
export const MAX_SLOTS=STARTER_IDS.length+COLLECTIBLE_IDS.length;
export const MAX_COLLECTION_POINTS=9999999;
export const usedSlots=collection=>STARTER_IDS.length+Object.values(collection).filter(entry=>!entry.reserve).length;
export const slotPrice=slots=>slots>=MAX_SLOTS?null:100+50*(slots-INITIAL_SLOTS);
export const defeatPoints=enemy=>enemy.visitor?0:enemy.boss?5:1;
export const RARE_VISITORS=[10,63,81,131,37,147];
export const LEGENDARY_VISITORS=[144,145,146];
export const BONUS_VISITOR_CHANCE=.35;
export const ROUTE_VISITORS = [
  {rare:[10,63],legendary:145},
  {rare:[81,131],legendary:144},
  {rare:[37,147],legendary:146},
  {rare:[63,81],legendary:144},
  {rare:[10,147],legendary:145},
  {rare:[37,131],legendary:146},
];
export function loadCollection(raw){
  try{
    const value=typeof raw==='string'?JSON.parse(raw):raw,result={};
    if(!value||typeof value!=='object'||Array.isArray(value))return result;
    for(const id of COLLECTIBLE_IDS){const entry=value[id];
      if(!entry||typeof entry!=='object'||!Number.isInteger(entry.catches)||entry.catches<1)continue;
      result[id]={catches:Math.min(9999,entry.catches),shiny:entry.shiny===true,useShiny:entry.shiny===true&&entry.useShiny===true};
      if(entry.reserve===true)result[id].reserve=true;
    }
    return result;
  }catch{return {};}
}
export const isUnlocked=(collection,id)=>STARTER_IDS.includes(id)||Boolean(collection[id]&&!collection[id].reserve);
// Save the wallet and its purchases together. Legacy collections receive enough
// slots for every existing partner, without charging points.
export function loadCollectionProgress(raw,legacy){
  let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{}
  const valid=value?.version===2&&value.collection&&typeof value.collection==='object'&&!Array.isArray(value.collection);
  const collection=loadCollection(valid?value.collection:legacy);
  return {version:2,collection,
    points:valid&&Number.isSafeInteger(value.points)?Math.max(0,Math.min(MAX_COLLECTION_POINTS,value.points)):0,
    slots:Math.max(INITIAL_SLOTS,usedSlots(collection),valid&&Number.isInteger(value.slots)?Math.min(MAX_SLOTS,value.slots):0)};
}
export function visitorForecast(mapIndex,wave){
  const route=ROUTE_VISITORS[mapIndex];
  if(!route)return null;
  if(wave===14)return {pool:LEGENDARY_VISITORS,favored:[route.legendary],legendary:true,guaranteed:true};
  if([4,8,12].includes(wave))return {pool:RARE_VISITORS,favored:route.rare,guaranteed:true};
  if([6,7,9,11,13].includes(wave))return {pool:RARE_VISITORS,favored:route.rare,guaranteed:false};
  return null;
}
export function rollVisitor(mapIndex,wave,random=Math.random,collection={},previousKind=null){
  const forecast=visitorForecast(mapIndex,wave);
  if(!forecast||(!forecast.guaranteed&&random()>=BONUS_VISITOR_CHANCE))return null;
  const choices=forecast.pool.filter(id=>id!==previousKind).map(id=>({id,weight:(collection[id]?1:3)*(forecast.favored.includes(id)?2:1)}));
  let roll=Math.max(0,Math.min(.999999,random()))*choices.reduce((sum,c)=>sum+c.weight,0),kind=choices.at(-1).id;
  for(const choice of choices){roll-=choice.weight;if(roll<0){kind=choice.id;break;}}
  return {kind,visitor:true,legendary:Boolean(forecast.legendary),shiny:random()<.1};
}
