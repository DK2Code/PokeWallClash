import {MOVES} from './arena/moves.mjs';
import {LOADOUTS} from './arena/loadouts.mjs';
import {EXTRA_MOVES} from './expanded-roster.mjs';

// Each stage selects from that exact species' Arena loadout. Branch IDs stay
// stable; the tower-defense perks and economy remain in game.mjs.
export const PARTNER_MOVES={
  ...EXTRA_MOVES,
  1:{basic:'vine-whip',garden:['razor-leaf','petal-blizzard'],razor:['solar-beam','frenzy-plant']},
  4:{basic:'ember',blast:['fire-fang','fire-blast'],flame:['flamethrower','flamethrower']},
  7:{basic:'water-gun',current:['water-pulse','hydro-pump'],hydro:['hydro-pump','hydro-cannon']},
  25:{basic:'thunder-shock',storm:['thunder','thunder'],bolt:['thunder-punch','thunder-punch']},
  10:{basic:'string-shot',tempest:['bug-bite','bug-buzz'],air:['tackle','gust']},
  133:{basic:'quick-attack',vaporeon:['water-gun','hydro-pump'],jolteon:['thunder-shock','thunder'],flareon:['ember','flare-blitz']},
  63:{basic:'hidden-power',focus:['psybeam','psycho-cut'],surge:['psychic','psychic']},
  81:{basic:'thunder-shock',storm:['tri-attack','tri-attack'],bolt:['zap-cannon','zap-cannon']},
  131:{basic:'ice-shard',focus:['ice-shard','ice-shard'],surge:['surf','surf']},
  37:{basic:'ember',focus:['quick-attack','quick-attack'],surge:['fire-blast','fire-blast']},
  147:{basic:'dragon-rage',focus:['aqua-tail','dragon-claw'],surge:['dragon-rush','outrage']},
  144:{basic:'ice-beam',focus:['ice-shard','ice-shard'],surge:['blizzard','blizzard']},
  145:{basic:'thunder-shock',focus:['drill-peck','drill-peck'],surge:['thunder','thunder']},
  146:{basic:'ember',focus:['air-slash','air-slash'],surge:['sky-attack','sky-attack']},
};
export function partnerMove(kind,species,level=1,branch=null){
  const plan=PARTNER_MOVES[kind],slug=level===1?plan?.basic:plan?.[branch]?.[level-2];
  if(!MOVES[slug]||!LOADOUTS[species]?.includes(slug))throw new Error(`Missing Arena move for ${species}, level ${level}, path ${branch}`);
  return MOVES[slug];
}
