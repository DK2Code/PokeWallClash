import {EXTRA_TOWERS} from './expanded-roster.mjs';
import {SPECIAL_TOWERS,SPECIAL_PARTNERS} from './special-partners.mjs';
export const STARTER_IDS = [1,4,7,25];
export const COLLECTIBLE_IDS = [133,10,63,81,131,37,147,...EXTRA_TOWERS.map(p=>p.id),144,145,146,...SPECIAL_TOWERS.map(p=>p.id)];
export const INITIAL_SLOTS=12;
export const COLLECTION_VERSION=4;
export const COLLECTION_STORAGE_KEY='pokewallclash-collection-v4';
export const MAX_SLOTS=STARTER_IDS.length+COLLECTIBLE_IDS.length;
export const MAX_COLLECTION_POINTS=9999999;
export const usedSlots=collection=>STARTER_IDS.length+COLLECTIBLE_IDS.filter(id=>collection[id]&&!collection[id].reserve).length;
export const slotPrice=slots=>slots>=MAX_SLOTS?null:Math.min(300,100+50*Math.max(0,slots-INITIAL_SLOTS));
export const defeatPoints=enemy=>enemy.visitor?0:enemy.boss?5:1;
export const RARE_VISITORS=[10,63,81,131,37,147,...EXTRA_TOWERS.map(p=>p.id)];
export const LEGENDARY_VISITORS=[144,145,146];
export const partnerPrice=id=>!Number.isInteger(id)||!COLLECTIBLE_IDS.includes(id)?null:SPECIAL_PARTNERS[id]?.price??(LEGENDARY_VISITORS.includes(id)?300:50);
export const COIN_EXCHANGE=Object.freeze({coins:250,points:50,wavesPerTrade:5,maxTrades:3});
export const BONUS_VISITOR_CHANCE=.35;
export const ROUTE_VISITORS = [
  {rare:[10,63,13,16,43,123],legendary:145},
  {rare:[81,131,54,60,79,120],legendary:144},
  {rare:[37,147,52,58,77,127],legendary:146},
  {rare:[63,81,41,50,74,92],legendary:144},
  {rare:[10,147,19,23,27,66,104,129],legendary:145},
  {rare:[37,131,98,116,138,140],legendary:146},
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
// Preserve existing teammates and every waiting catch. Version 4 never fills
// slots automatically; a separate key protects choices from older open tabs.
export function readCollectionProgress(storage){
  return loadCollectionProgress(storage.getItem(COLLECTION_STORAGE_KEY)??storage.getItem('pokewallclash-collection-v3')??storage.getItem('pokewallclash-collection-v2'),storage.getItem('pokewallclash-collection-v1'));
}
export function loadCollectionProgress(raw,legacy){
  let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{}
  const valid=[2,3,COLLECTION_VERSION].includes(value?.version)&&value.collection&&typeof value.collection==='object'&&!Array.isArray(value.collection);
  const collection=loadCollection(valid?value.collection:legacy);
  const savedSlots=valid&&Number.isInteger(value.slots)?Math.max(0,Math.min(value.version===2?14:MAX_SLOTS,value.slots)):0;
  const slots=Math.min(MAX_SLOTS,Math.max(INITIAL_SLOTS,usedSlots(collection),savedSlots+(valid&&value.version===2?INITIAL_SLOTS-6:0)));
  return {version:COLLECTION_VERSION,collection,
    points:valid&&Number.isSafeInteger(value.points)?Math.max(0,Math.min(MAX_COLLECTION_POINTS,value.points)):0,
    slots};
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
