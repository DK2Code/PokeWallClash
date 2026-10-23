import {Game,TOWERS} from './game.mjs';
import {COLLECTION_VERSION,MAX_SLOTS,COLLECTION_STORAGE_KEY} from './collection.mjs';

// A local testing gate, not account authentication. Test state is never persisted.
export class AdminTesting {
  constructor(){this.original=null;this.game=null;}
  get active(){return Boolean(this.original);}
  enter(password,normalGame,wasPaused=normalGame.paused){
    if(password!=='1234'||this.active||normalGame.adminTest)return null;
    this.original={game:normalGame,paused:wasPaused};normalGame.paused=true;
    this.game=new Game(normalGame.mapIndex,normalGame.difficulty.id,{adminTest:true,collectionProgress:{version:COLLECTION_VERSION,slots:MAX_SLOTS,points:100000,collection:{}}});
    this.game.collection=Object.fromEntries(TOWERS.map(t=>[t.id,{catches:1,shiny:true,useShiny:false}]));
    return this.game;
  }
  exit(){
    if(!this.active)return null;
    const {game,paused}=this.original;game.paused=paused;this.original=null;this.game=null;return game;
  }
}

// Keep every collection-writing path behind the same test-mode guard.
export function persistCollection(storage,game){
  if(game.adminTest)return false;
  storage.setItem(COLLECTION_STORAGE_KEY,JSON.stringify(game.collectionSave()));return true;
}
