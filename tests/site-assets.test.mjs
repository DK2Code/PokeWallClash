import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';

test('the deployed entry point and every relative module import resolve to local files',async()=>{
  const root=new URL('../dist/',import.meta.url),visited=new Set();
  async function inspect(url){
    if(visited.has(url.href))return;visited.add(url.href);await access(url);
    const source=await readFile(url,'utf8');
    for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))await inspect(new URL(match[1],url));
  }
  const html=await readFile(new URL('index.html',root),'utf8');
  for(const match of html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)){
    const file=new URL(match[1],root);await access(file);if(file.pathname.endsWith('.mjs'))await inspect(file);
  }
  assert.ok(visited.size>15,'the check must follow the full deployed module graph');
});
