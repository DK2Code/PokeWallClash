// Keep Arena's definitions and renderers byte-for-byte identical. The small
// tower-defense adapter lives outside this directory; Arena is read-only.
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=['move-data.mjs','loadouts.mjs','moves.mjs','move-art.mjs','combat-art.mjs','sprite-animation.mjs'];
const destination=new URL('../dist/arena/',import.meta.url);
const source=new URL('../../pokemon-arena/dist/',import.meta.url);
await mkdir(destination,{recursive:true});
const hashes={};
for(const name of files){
  const data=await readFile(new URL(name,source));
  hashes[name]=createHash('sha256').update(data).digest('hex');
  await copyFile(new URL(name,source),new URL(name,destination));
}
await writeFile(new URL('directional-data.mjs',destination),"// Use the locally packaged Arena sprite subset.\nexport {DIRECTIONAL} from '../directional-data.mjs';\n");
await writeFile(new URL('source.json',destination),JSON.stringify({source:'pokemon-arena/dist',files:hashes},null,2)+'\n');
console.log(`Imported ${files.length} Arena modules with source checksums.`);
