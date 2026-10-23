import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MAPS} from '../dist/game.mjs';
import {createBattleTerrain,loadTerrainArt,TERRAIN_FILES} from '../dist/terrain.mjs';

function canvas(){
  const output={width:0,height:0,calls:[]};let depth=0;
  const context={canvas:output,save(){depth++;},restore(){assert.ok(depth>0);depth--;}};
  for(const method of ['fillRect','beginPath','moveTo','lineTo','closePath','fill','ellipse','clip','translate','stroke','fillText','drawImage'])context[method]=(...args)=>{
    assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),`${method} must use finite coordinates`);
    if(method==='ellipse')assert.ok(args[2]>=0&&args[3]>=0);
    output.calls.push([method,...args]);
  };
  output.getContext=()=>context;output.depth=()=>depth;return output;
}

test('all routes render with missing terrain images without mutating paths or clearings',t=>{
  const previous=globalThis.document;t.after(()=>{globalThis.document=previous;});
  globalThis.document={createElement:()=>canvas()};
  const before=JSON.stringify(MAPS);
  for(const [i,map] of MAPS.entries()){
    const terrain=createBattleTerrain(map,i);assert.equal(terrain.width,960);assert.equal(terrain.height,560);assert.equal(terrain.depth(),0);
    const labels=terrain.calls.filter(call=>call[0]==='fillText').map(call=>call[1]);
    assert.ok(labels.includes('IN →'));assert.ok(!labels.includes('HOME'));
    assert.ok(terrain.calls.some(call=>call[0]==='fillRect'));
  }
  assert.equal(JSON.stringify(MAPS),before,'scenery must never change gameplay geometry');
});

test('local terrain assets load and render every route using valid sprite source bounds',async t=>{
  const previousImage=globalThis.Image,previousDocument=globalThis.document;
  t.after(()=>{globalThis.Image=previousImage;globalThis.document=previousDocument;});
  globalThis.Image=class{set src(url){assert.ok(url.startsWith('./assets/world/'));const data=readFileSync(new URL(`../dist/${url.slice(2)}`,import.meta.url));this.width=data.readUInt32BE(16);this.height=data.readUInt32BE(20);queueMicrotask(()=>this.onload());}};
  globalThis.document={createElement:()=>canvas()};
  assert.deepEqual(await loadTerrainArt(),TERRAIN_FILES.map(()=>true));
  for(const map of MAPS){
    const terrain=createBattleTerrain(map);assert.equal(terrain.depth(),0);
    const images=terrain.calls.filter(call=>call[0]==='drawImage');assert.ok(images.length>100);
    for(const call of images)if(call.length===10){const [,img,x,y,w,h]=call;assert.ok(x>=0&&y>=0&&x+w<=img.width&&y+h<=img.height,'tile must stay inside the local atlas');}
  }
});

test('page styles and terrain need no remote resources',()=>{
  const root=new URL('../dist/',import.meta.url),html=readFileSync(new URL('index.html',root),'utf8');
  assert.match(html,/connect-src 'none'/);assert.match(html,/font-src 'self'/);
  for(const match of html.matchAll(/<link[^>]+href="([^"]+)"/g)){
    assert.ok(match[1].startsWith('./'),'styles and icons must be local');
    if(!match[1].endsWith('.css'))continue;
    const cssUrl=new URL(match[1],root),css=readFileSync(cssUrl,'utf8');
    assert.doesNotMatch(css,/@import/);
    for(const [,asset] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)){
      assert.ok(!/^(?:https?:)?\/\//.test(asset),'no remote CSS assets');
      if(!asset.startsWith('data:'))assert.ok(existsSync(new URL(asset,cssUrl)),'CSS asset exists locally');
    }
  }
});
