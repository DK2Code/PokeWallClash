import test from 'node:test';
import assert from 'node:assert/strict';
import {tintShinyPixels,spriteVariant} from '../dist/sprite-colors.mjs';
import {loadSprites,renderAttackPreview,render} from '../dist/art.mjs';
import {Game} from '../dist/game.mjs';
import {DIRECTIONAL} from '../dist/directional-data.mjs';

test('shiny recoloring preserves alpha and neutral colors while changing chromatic pixels',()=>{
  const pixels=new Uint8ClampedArray([0,0,0,255,255,255,255,255,80,80,80,128,255,0,0,200,0,255,0,64,1,2,3,0]);
  tintShinyPixels(pixels);
  assert.deepEqual([...pixels.slice(0,12)],[0,0,0,255,255,255,255,255,80,80,80,128]);
  assert.notDeepEqual([...pixels.slice(12,15)],[255,0,0]);
  assert.notDeepEqual([...pixels.slice(16,19)],[0,255,0]);
  assert.equal(pixels[15],200);assert.equal(pixels[19],64);assert.deepEqual([...pixels.slice(20)],[1,2,3,0]);
});

function canvas() {
  const result={width:1,height:1,images:[]};
  const context={canvas:result,globalAlpha:1,
    drawImage(image){result.images.push(image);},
    getImageData(){return {data:new Uint8ClampedArray([20,180,50,255])};},
    putImageData(pixels){result.pixels=pixels.data;},
    createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};},
  };
  // Simulate a browser where the canvas filter is ignored. Color must come
  // from the sprite bitmap, including when using static fallback portraits.
  Object.defineProperty(context,'filter',{get:()=> 'none',set(){}});
  for(const method of ['save','restore','clearRect','translate','scale','rotate','beginPath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','closePath','ellipse','arc','fill','stroke','fillRect','fillText','strokeText','setLineDash'])context[method]=()=>{};
  result.getContext=()=>context;return result;
}

test('normal images stay untouched and shiny bitmaps are cached per source sheet',t=>{
  const previous=globalThis.document;t.after(()=>{globalThis.document=previous;});
  let created=0;globalThis.document={createElement(){created++;return canvas();}};
  const image={width:1,height:1},other={width:1,height:1};
  assert.equal(spriteVariant(image,false),image);assert.equal(created,0);
  const colored=spriteVariant(image,true);assert.notEqual(colored,image);
  assert.notDeepEqual([...colored.pixels],[20,180,50,255]);
  assert.equal(spriteVariant(image,true),colored);assert.equal(created,1);
  assert.notEqual(spriteVariant(other,true),colored);assert.equal(created,2);
  assert.equal(spriteVariant(image,false),image);assert.equal(spriteVariant(undefined,true),undefined);
});

test('battle, evolution, previews and missing animation sheets all use shiny bitmaps without canvas filters',async t=>{
  const previousDocument=globalThis.document,previousImage=globalThis.Image;
  t.after(()=>{globalThis.document=previousDocument;globalThis.Image=previousImage;});
  globalThis.document={createElement:()=>canvas()};
  const unavailable=new Set(Object.values(DIRECTIONAL[10].states).map(state=>`./assets/directional/${state.file}`));
  globalThis.Image=class {
    naturalWidth=1;naturalHeight=1;
    set src(value){this.url=value;queueMicrotask(()=>unavailable.has(value)?this.onerror():this.onload());}
  };
  assert.ok((await loadSprites()).some(loaded=>!loaded),'fixture must exercise missing animation sheets');
  for(const level of [1,2,3])for(const shiny of [false,true]) {
    const c=canvas(),tower={kind:10,level,branch:level===1?null:'tempest',shiny};
    renderAttackPreview(c.getContext(),tower,.75);
    assert.ok(c.images.length);assert.equal(Boolean(c.images[0].pixels),shiny);
    if(level===1)assert.equal(shiny?c.images[0].images[0].url:c.images[0].url,'./assets/10.png');
  }
  const g=new Game();g.recruit(10,true);const tower=g.place(10,0);
  g.gainXP(tower,40);g.upgrade(tower.id,'tempest');
  const terrain={terrain:true},ui={selectedKind:null,selectedTower:null,hoverPad:null,reducedMotion:false};
  for(const age of [.1,.8]) {
    g.effects.find(e=>e.type==='evolve').age=age;
    const c=canvas();render(c.getContext(),terrain,g,ui);
    const sprites=c.images.filter(image=>image!==terrain);
    assert.ok(sprites.length);assert.ok(sprites.every(image=>image.pixels),'evolution reverted to an untinted image');
  }
});
