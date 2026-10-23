// Reuse the reference engine's packaged SpriteCollab art without changing its source.
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {referenceSource} from './arena-source.mjs';
import {TOWERS,ENEMIES,EVOLUTIONS} from '../dist/game.mjs';
const {DIRECTIONAL}=await import(new URL('directional-data.mjs',referenceSource));
const ids=[...new Set([...TOWERS.flatMap(t=>t.stages),...Object.values(EVOLUTIONS).flat().map(b=>b.species).filter(Boolean),...Object.keys(ENEMIES).map(Number)])];
const destination=new URL('../dist/assets/directional/',import.meta.url);
const source=new URL('assets/directional/',referenceSource);
await mkdir(destination,{recursive:true});
const data={};
for(const id of ids){
  const original=DIRECTIONAL[id];
  if(!original)throw new Error(`Missing Arena animation for Pokémon ${id}`);
  data[id]={scale:original.scale,states:{}};
  for(const state of ['Idle','Walk','Attack','Shoot','Charge','Hurt','Sleep']){
    const meta=original.states[state];data[id].states[state]=meta;
    await copyFile(new URL(meta.file,source),new URL(meta.file,destination));
  }
  await copyFile(new URL(`${id}-credits.txt`,source),new URL(`${id}-credits.txt`,destination));
}
for(const name of ['LICENSE.md','credit_names.txt','CREDITS.txt'])await copyFile(new URL(name,source),new URL(name,destination));
await writeFile(new URL('../dist/directional-data.mjs',import.meta.url),'// Imported from the reference engine by scripts/import-arena-art.mjs. Attribution: assets/directional.\nexport const DIRECTIONAL = '+JSON.stringify(data)+';\n');
console.log(`Imported ${ids.length} Pokémon with seven animation states and original attribution.`);
