export const STARTER_IDS = [1,4,7,25];
export const COLLECTIBLE_IDS = [133,10,63,81,131,37,147,144,145,146];
export const ROUTE_VISITORS = [
  {rare:[10,63],legendary:145},
  {rare:[81,131],legendary:144},
  {rare:[37,147],legendary:146},
];
export function loadCollection(raw){
  try{
    const value=typeof raw==='string'?JSON.parse(raw):raw,result={};
    if(!value||typeof value!=='object'||Array.isArray(value))return result;
    for(const id of COLLECTIBLE_IDS){const entry=value[id];
      if(!entry||typeof entry!=='object'||!Number.isInteger(entry.catches)||entry.catches<1)continue;
      result[id]={catches:Math.min(9999,entry.catches),shiny:entry.shiny===true,useShiny:entry.shiny===true&&entry.useShiny===true};
    }
    return result;
  }catch{return {};}
}
export const isUnlocked=(collection,id)=>STARTER_IDS.includes(id)||Boolean(collection[id]);
export function visitorForecast(mapIndex,wave){
  const route=ROUTE_VISITORS[mapIndex];
  if(wave===14)return {kind:route.legendary,legendary:true,guaranteed:true};
  if([4,8,12].includes(wave))return {kind:wave===4?route.rare[0]:wave===8?route.rare[1]:null,pool:route.rare,guaranteed:true};
  if([6,7,9,11,13].includes(wave))return {pool:route.rare,guaranteed:false};
  return null;
}
export function rollVisitor(mapIndex,wave,random=Math.random){
  const forecast=visitorForecast(mapIndex,wave);
  if(!forecast||(!forecast.guaranteed&&random()>=.25))return null;
  return {kind:forecast.kind??forecast.pool[Math.min(forecast.pool.length-1,Math.floor(random()*forecast.pool.length))],visitor:true,legendary:Boolean(forecast.legendary),shiny:random()<.1};
}
