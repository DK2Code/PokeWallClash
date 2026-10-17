import {visitorForecast} from './collection.mjs';
import {ENEMIES} from './game.mjs';

// A queued visitor is intentionally secret until its sprite enters the route.
export function visitorPreview(game){
  const wave=game.status==='wave'?game.wave:Math.min(15,game.wave+1);
  if(game.status==='wave'&&game.visitorArrived&&game.visitor){
    const {kind,shiny}=game.visitor;
    return {kind,shiny,title:`${shiny?'★ Shiny ':''}${ENEMIES[kind].name} appeared!`,detail:'Defeat this visitor, then clear the wave to add it to your collection.'};
  }
  const forecast=visitorForecast(game.mapIndex,wave);
  return {kind:null,shiny:false,title:forecast?.legendary?'A legendary mystery':'Who will appear?',detail:forecast?.legendary?'A random legendary bird arrives last in wave 14.':forecast?.guaranteed?`Wave ${wave}: a random basic Pokémon arrives last.`:forecast?'This wave has a 35% chance of a surprise visitor.':'Random basic Pokémon on waves 4, 8, and 12, plus surprise sightings. Legendary visitors wait until wave 14.'};
}
