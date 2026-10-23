import {MAPS,DIFFICULTIES,difficultyFor} from './game.mjs';
import {ROUTE_EXITS} from './terrain.mjs';
import {recordKey} from './records.mjs';

export function difficultySummary(id){const d=difficultyFor(id);return `${d.tagline}. ${d.coins} starting coins · ${d.hearts} hearts. Wild Pokémon: ${Math.round(d.health*100)}% health · ${Math.round(d.speed*100)}% speed · ${Math.round(d.crowd*100)}% wave size.`;}
export function routePickerMarkup(selection,records={}){
  return `<div class="eyebrow">YOUR NEXT ADVENTURE</div><h2>Choose your route.</h2><p class="dialog-intro">Six places to explore. Fifteen waves to defend.</p>
    <div class="route-choices" role="group" aria-label="Choose a route">${MAPS.map((map,i)=>`<button class="route-choice" data-route-choice="${i}" aria-pressed="${selection.mapIndex===i}"><canvas data-route-preview="${i}" width="320" height="187" aria-hidden="true"></canvas><span class="route-choice-copy"><small>ROUTE ${String(i+1).padStart(2,'0')} <span data-route-complete="${i}">${records[recordKey(i,selection.difficultyId)]?.won?'✓ CLEARED':''}</span></small><strong>${map.name}</strong><span>${ROUTE_EXITS[map.theme].name}</span></span></button>`).join('')}</div>
    <div class="route-choice-note" id="route-choice-note"></div>
    <fieldset class="pace-picker"><legend>Choose your challenge</legend><div class="pace-options">${DIFFICULTIES.map(d=>`<button data-pace-choice="${d.id}" aria-pressed="${selection.difficultyId===d.id}">${d.name}</button>`).join('')}</div><p id="pace-summary">${difficultySummary(selection.difficultyId)}</p></fieldset>
    <div class="route-picker-footer"><p>Your collection stays with you. Starting another route or difficulty resets this run.</p><div><button class="secondary-button" data-close>Keep playing</button><button class="primary-button" id="apply-route">Play this route</button></div></div>`;
}
