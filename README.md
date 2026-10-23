# PokeWallClash

A self-contained Gen 1 Pokémon tower defense game with hand-drawn pixel landscapes, four starters, a permanent collection of 44 starter, basic visitor, reward, and legendary entries, six routes, four selectable difficulties, and 15 waves per route. No build step or package installation is required.

## Play

**[Play PokeWallClash online](https://dk2code.github.io/PokeWallClash/)**

For local play, run `npm run dev` in this repository and open http://localhost:4174. Requires Node.js 18+. Keep the server terminal open while playing. The original workspace also includes **Play PokeWallClash.cmd** in the parent folder.

Choose a route and difficulty, then a Pokémon and a marked clearing. Start each wave when ready. Defenders attack automatically; click a placed Pokémon to see its XP, evolve it, or recall it for 70% of its placement cost. Defeat wild Pokémon and clear waves to earn coins. Protect your Center through all 15 waves. Bosses appear on waves 5, 10, and 15 and cost five hearts if they escape.

The next-wave button and free-evolution shortcuts sit directly beneath the battlefield, above mystery encounters and collection rewards. On phones, ready partners use a horizontal row so a growing team does not push the controls down the page. Each shortcut opens that partner's move choices.

- **1–9:** select the corresponding unlocked defender; additional recruits are selectable by clicking their cards.
- **Space:** start a wave or pause/resume when no button is focused. Focused buttons keep their standard Space/Enter behavior.
- **Escape:** cancel selection or close a dialog.
- **Tab / Enter:** navigate and activate the controls and battlefield clearings.
- **1× / 2× / 3×:** game speed. Sound is optional.

Begin with exactly **Bulbasaur, Charmander, Squirtle, and Pikachu**. Bulbasaur poisons, Charmander deals splash damage, Squirtle slows, and Pikachu chains lightning. Pikachu evolves into Raichu at 40 XP and further trains at 120 XP. All species and evolutions stay within Kanto’s original 151 Pokémon.

## Collect more partners

**Eevee is a special permanent reward:** defeat Onix and clear wave 5 on any route or difficulty. Eevee joins your collection in addition to the normal boss reward; escaping Onix or losing the wave does not unlock it.

**Mew and Mewtwo are permanent point rewards:** unlock Mew for **2,500 collection points** or Mewtwo for **4,000** from Collection. Each needs one open slot; an unaffordable, duplicate, or full-collection purchase never spends points. Unlocks and the wallet save together. They cost 500 and 650 battle coins to place, respectively. Both train without changing species: Mew uses Ancient Power or Psychic; Mewtwo uses Aura Sphere or Psystrike. Their Arena attacks gain bounded constellation auras and psychic aftershocks, with stable reduced-motion effects. These rewards never enter visitor rolls, award catch points, or inflate run catch counts.

**Personal-best score is not spendable currency.** The Collection wallet shows spendable collection points. Special-partner cards show the current wallet, free team slots, and the exact missing requirement. A saved but unrecruited special partner is not marked as already unlocked.

Optional visitors enter **after the regular wave**. Defeat a marked visitor, then clear its wave to catch it. Ordinary wild Pokémon and bosses are **defeated**, not caught: they award coins, score, battle XP, and defeat points but do not enter the collection. Only confirmed collection additions count as catches. Every new catch stays in Collection until the player chooses to recruit it. Recruiting a basic Pokémon or Eevee costs **50 collection points**; a caught legendary bird costs **300**. Recruitment uses one open team slot and permanently unlocks the partner across restarts, routes, difficulties, and browser reloads. Uncaught visitors cannot be purchased. Battle placement still costs coins.

Catches celebrate directly over the battlefield with a portrait, name, and rewards **only when the Pokémon joins the collection** (including reserve). Ordinary defeats fade out with dust; they never show a Poké Ball or catch popup. Results separately count defeated and caught Pokémon. Cards never block taps, use real time at every battle speed, and respect reduced motion. Boss reward and victory dialogs wait for any collection celebration. Bosses and visitors display their Pokémon names above their health bars.

Start with **12 team slots**, including the four starters. Buy up to **44 slots** in Collection: the first extra slot costs **100 collection points**, and each following slot costs 50 more up to a 300-point cap. Earn 1 point per ordinary defeat and 5 per boss defeat. A confirmed visitor or Eevee catch awards 10; a legendary catch awards 25. Visitor points wait until the wave clears. Each cleared wave adds 10; completing a route adds another 50. This wallet is separate from score and coins, so purchases never lower personal bests. Earned points remain saved if a later wave fails.

All new catches wait **safely in Collection**, including their shiny preferences, even with empty team slots. Buying a slot only adds empty capacity: choose any caught Pokémon and pay its recruitment price separately. No slot or reload automatically activates a waiting Pokémon. Each recruited species uses one slot; duplicates, evolutions, and shiny variants need no additional space. Existing team members remain unlocked for free. Version-2 saves still receive their six additional slots once, but waiting catches stay waiting. Version-3 saves retain their capacity. The version-4 save preserves manual recruitment choices independently of older open game tabs.

Coins and spendable collection points appear together above the battlefield. Tap **Exchange** beside these balances, or **Exchange battle coins** in Collection to trade **250 coins for 50 collection points**. **Every cleared wave earns one trade**, for 15 trades per completed run. Unused trades are saved with your collection and survive difficulty changes, route changes, restarts, and refreshes. Trades are available between waves or after winning, including at the start of a different difficulty when you have saved trades. Starting or restarting a route grants no extra exchanges. Insufficient coins, exhausted allowances, and a full points wallet cannot spend currency. Points remain saved across runs; exchanges do not affect score, XP, or difficulty.

The 28 added basic visitors are Weedle, Pidgey, Rattata, Ekans, Sandshrew, Zubat, Oddish, Paras, Diglett, Meowth, Psyduck, Growlithe, Poliwag, Machop, Bellsprout, Geodude, Ponyta, Slowpoke, Gastly, Krabby, Cubone, Horsea, Staryu, Scyther, Pinsir, Magikarp, Omanyte, and Kabuto. Each is placeable, supports shiny colors, and has two Arena-matched training paths. Evolutions share their basic family’s collection slot. Scyther and Pinsir remain in their Kanto forms; two-stage families train their final form at level 3. Magikarp starts weak and earns a large power boost as Gyarados.

Discovery totals and maximum purchasable slots come from the available catalog, including reserve catches. They are independent of currently unlocked slot capacity and are no longer capped at 14. The current catalog has four starters, Eevee, 34 basic visitors, three legendary birds, Mew, and Mewtwo.

All 34 basic visitors and all three legendary birds can appear on **every route**. Route favorites have double selection weight; species not yet in your collection have triple weight. A rare visitor cannot repeat immediately after the previous visitor in that run. The encounter panel shows a question mark until the visitor actually arrives; it never displays route favorite portraits as predictions. These are weighted random encounters, not guarantees of a new species.

| Route | Favored rare visitors | Favored legendary |
| --- | --- | --- |
| Viridian Forest | Caterpie, Abra, Weedle, Pidgey, Oddish, Scyther | Zapdos |
| Cerulean Creek | Magnemite, Lapras, Psyduck, Poliwag, Slowpoke, Staryu | Articuno |
| Autumn Trail | Vulpix, Dratini, Meowth, Growlithe, Ponyta, Pinsir | Moltres |
| Moonlit Cavern | Abra, Magnemite, Zubat, Diglett, Geodude, Gastly | Articuno |
| Safari Circuit | Caterpie, Dratini, Rattata, Ekans, Sandshrew, Machop, Cubone, Magikarp | Zapdos |
| Cinnabar Coast | Vulpix, Lapras, Krabby, Horsea, Omanyte, Kabuto | Moltres |

- A random rare visitor is guaranteed on waves 4, 8, and 12. Waves 6, 7, 9, 11, and 13 each have a **35%** bonus visitor chance.
- A random legendary bird appears only on **wave 14**, as the very last arrival. It is an optional encounter, separate from the three scheduled bosses. Eevee remains the special wave-5 reward.
- Every visitor has a **10% shiny chance**. Shiny variants use a cosmetic color shift and sparkles with identical combat stats. Toggle owned shiny colors in the collection screen.
- Shiny colors stay on placed partners, attacks, both evolution stages, previews, recall, and future routes. Discovering a shiny also updates already placed partners of that kind. Cached recolored sprite sheets keep the battlefield consistent with roster colors even when the browser does not support canvas filters; static fallback portraits use the same treatment.
- A repeated catch gives **75 bonus coins**, unless it unlocks a shiny variant you did not already own.
- Escaped visitors cost **no hearts**. Catches are only added to your collection after a successful wave clear.
- Open **Collection / Pokédex** for slot upgrades, unlock instructions, evolution lines, and shiny preferences. Collection, points, slots, and unused exchanges are saved together under `pokewallclash-collection-v5`; v1–v4 collections migrate automatically and personal bests are preserved. Older saves did not store unused exchanges, so those cannot be recovered on migration. If storage fails, progress remains available for the current session.

## Reversible admin testing

Open **How to play → Admin testing** or **Trainer journal → Admin testing**, then enter **1234**. This intentionally public, browser-only test password is a convenience gate, not account authentication or server access.

Admin testing uses a separate in-memory game: all 44 Pokémon, shiny choices, and team slots are unlocked, with 100,000 coins and collection points. Every placed partner receives 120 XP immediately, so either evolution path can be tested. The visible **Test tools** panel can refill resources and hearts, open routes and difficulties, or prepare any wave from 1–15 while retaining the placed test team. Legendary visitors still use wave 14; wave selection lets testers reach it directly.

**Exit admin** restores the normal game exactly where it was paused, including its team, enemies, wave, wallet, and pause state. Test catches, spending, shiny choices, and scores never enter normal collection saves or personal bests. Refreshing closes the test session and loads normal saved progress; use Exit instead to resume an in-progress normal battle. Test mode is never stored or automatically enabled after a reload.

## Choose your difficulty

Six routes have different paths and scenery. The trainer passport tracks completion separately for each difficulty; existing route records keep their original IDs.

- **Moonlit Cavern:** a returning cavern path, crystal pools, and three marked violet clearings with **+20% attack range**. The range bonus also applies to evolved partners and placement previews.
- **Safari Circuit:** a wide savanna loop and **+15 collection points** for clearing each of waves 5, 10, and 15.
- **Cinnabar Coast:** a harbor hairpin, volcanic shores, and hot springs that **restore two hearts** at those milestones, up to the selected difficulty's cap.

The original Forest, Creek, and Autumn routes remain available. New routes share the gentle first five waves, then introduce their own enemy mixes. All routes can be played immediately with the four starters and earned coins; collected partners offer more strategies.

All four modes are available on every map. Map selection changes the route layout; the selected difficulty controls enemy strength and starting resources.

| Mode | Starting coins | Hearts | Enemy health | Enemy speed | Wave size |
| --- | ---: | ---: | ---: | ---: | ---: |
| Easy | 425 | 25 | 80% | 90% | 85% |
| Normal | 360 | 20 | 100% | 100% | 100% |
| Hard | 330 | 15 | 130% | 110% | 115% |
| Expert | 300 | 10 | 160% | 120% | 130% |

Wave sizes round to a whole Pokémon; scheduled bosses are added once. Hard and Expert also spawn enemies more closely together. Changing difficulty after recruiting or starting a wave asks before resetting the run. Restarting or moving to another map keeps the selected mode. A page reload starts a fresh Normal run.

Personal bests and completion marks are separate for every map and difficulty. Existing records are retained under Normal, and their original saved entries remain intact. Playing Easy cannot overwrite an Expert best.

## Opening pace

Normal can afford a three-starter opening, while Hard and Expert encourage a strong pair with coins in reserve. Every pair of distinct starters can defend the first Normal wave on all six routes when placed at clearings 1 and 4. A clean Normal opening with Pikachu, Bulbasaur, and Charmander leaves 119 coins after wave 1, enough to add Squirtle.

| Wave | Normal enemies | New threat | Health adjustment | Spawn interval | Clear bonus |
| --- | ---: | --- | ---: | ---: | ---: |
| 1 | 6 | Caterpie | 85% | 1.50 s | 60 coins |
| 2 | 8 | Weedle | 90% | 1.35 s | 55 coins |
| 3 | 10 | Rattata | 95% | 1.20 s | 60 coins |
| 4 | 13 | Pidgey | 100% | 1.05 s | 65 coins |
| 5 | 16 + Onix | Sandshrew and the first boss | 100% | 0.975 s | 90 coins |

Health adjustments multiply the normal wave growth and difficulty setting; spawn intervals also scale by difficulty. Normal defeat bounties are 75% on waves 1–4, rounded to whole coins. Boss and visitor bounties retain their full values. The first clear bonus gives the opening economy a small head start. Optional visitors are additional to the counts above. Onix has 650 base HP and arrives after the regular crowd so the developing team can focus on its first boss. From wave 6, regular wave size, health, bounties, and pacing follow the established curve.

## Grow your team

Every partner that helps defeat an enemy earns **2 XP**, regardless of which partner lands the final hit. Each partner can earn **12 combat XP per wave**. Attacks alone do not grant XP, so fast attacks, tougher difficulties, and repeated poison ticks cannot rush an evolution. Helping defeat a boss adds **8 bonus XP outside that cap**, once per boss.

Partners placed **before the wave starts** earn **6 team XP when it clears**, including defenders guarding a quiet stretch. Partners recruited mid-wave begin receiving that team bonus on the next wave; they can earn combat XP immediately. Failed waves give no clear bonus. Recalling and replacing a partner loses its earned XP.

At **40 total XP**, choose a free evolution path; at **120 total XP**, grow to level 3. XP banks up to 120. In the fixed starter-team balance simulations, the lead partner evolves during wave 3 and reaches level 3 around wave 7; placement, participation, and picnic rewards can change individual timing. Strong poison and slow effects cannot be overwritten or extended by weaker attacks from new teammates.

The battlefield marks ready partners with a gold star, and a ready-to-grow tray opens their choice screens. Selecting a partner shows its XP bar. Evolution screens pause the action and compare the new move, power, range, and attack rate. Closing a screen defers the choice without spending anything. The chosen path stays with that partner through level 3.

| Partner | Evolution paths |
| --- | --- |
| Pikachu → Raichu | Storm caller uses Thunder with three extra chain targets; Thunder striker uses Thunder Punch with focused damage and reach. Level 3 further trains Raichu. |
| Magnemite → Magneton | Triad keeper uses Tri Attack with three extra chain targets; Longshot uses Zap Cannon with power and range. Level 3 further trains Magneton. |
| Bulbasaur → Ivysaur → Venusaur | Petal garden: Vine Whip → Razor Leaf → Petal Blizzard, with stronger poison. Solar keeper: Vine Whip → Solar Beam → Frenzy Plant, with direct power and reach. |
| Charmander → Charmeleon → Charizard | Blast zone creates wide explosions; Flame stream attacks much faster with smaller splashes. |
| Squirtle → Wartortle → Blastoise | Deep current strengthens slowing; Pressure jet adds power and splash with a shorter slow. |
| Caterpie → Metapod → Butterfree | Swarm keeper: String Shot → Bug Bite → Bug Buzz. Focused striker: String Shot → Tackle → Gust. Each stage uses its Arena loadout. |
| Eevee | Water Stone → Vaporeon slows; Thunder Stone → Jolteon chains; Fire Stone → Flareon splashes. All three have directional animation sheets. |
| Abra → Kadabra → Alakazam; Vulpix → Ninetales; Dratini → Dragonair → Dragonite | Focused power adds damage and range; Crowd keeper adds splash and speed. |
| Lapras, Articuno, Zapdos, Moltres | Choose Focused power or Crowd keeper and train through three levels without evolving. |

Defeat Onix on wave 5 or Snorlax on wave 10 and clear the rest of that wave to pick **one boss reward**:

- **Training picnic:** +20 XP to every currently placed partner, outside the combat cap.
- **Power charm:** +12% power to current and future teammates for this run; charms stack additively.
- **Supply satchel:** +250 coins after Onix or +400 after Snorlax, plus 4 hearts (up to the selected difficulty’s heart cap).

The next wave waits until the reward is chosen. You can dismiss and reopen the choice from the wave button. Escaped bosses give no reward. Defeating Dragonite on wave 15 adds **1,000 bonus points** to the victory score. Resetting or changing routes clears placed partners, XP, choices, and run bonuses, but keeps the collection.

Animations reuse the reference engine’s SpriteCollab sheets and rendering approach: eight-direction idle/walk/attack/hurt poses, original frame durations, stable ground anchors, and attacks emitted from each Pokémon’s head. Defenders track targets during windup, fire on the attack frame, and recover before attacking again. Enemies turn at corners, react to hits, and animate into Poké Balls when caught.

Moves and animation effects now come directly from the reference engine. `dist/arena/` contains unchanged copies of its move data, species loadouts, effect renderers, and animation helpers, with source checksums. Every equipped move is checked against the current species’ exact Arena loadout. Custom moves such as Chain Thunder, Toxic Bloom, and Silk Storm have been replaced. Gen 1 still limits the Pokémon species; move selection follows Arena’s curated learnsets.

Raichu chooses Thunder (lightning from above) or Thunder Punch (a physical electric strike). Charmeleon uses Fire Fang or Flamethrower; Charizard uses Fire Blast or Flamethrower. Wartortle uses Water Pulse or Hydro Pump; Blastoise uses Hydro Pump or Hydro Cannon. Arena’s silhouettes, colors, multi-projectile patterns, flowing fire texture, beam rings, ground effects, contact poses and Charge sheets are reused. Physical attackers lunge and return to their clearing. Pose, charge, release, stream/contact, and recovery share a clock in battle and previews. Reduced motion retains recognizable static effects.

The adapter scales Arena effects for this battlefield and fits cast timings within each defender’s established attack cadence. Tower-defense perks (poison, slowing, splash, chains), power, costs, XP and difficulty settings remain separately tuned; damage uses the selected move’s element. This does not import Arena’s dueling cooldowns, stamina, recoil or status system. Splash outlines show the actual tower-defense damage radius. Level 3 increases effect size and intensity, including partners that train without changing species. Evolution transitions show the previous form, a burst, the new form, and the selected move name.

Attack pose frames use the current cast's age, including Charge and short animation sheets, so a fresh route or a different partner ID cannot change their synchronization with head emitters. Regression checks exercise actual placement and both upgrades on every route and evolution path against Arena's species loadouts.

Select a placed partner and use **Preview evolution moves** to compare its next attacks before earning enough XP. The evolution screen uses the same sprite and effect renderers as battle, with slower demonstrations and a pause control. Browsing a preview never spends XP or chooses a path; evolution still requires 40/120 XP. Fully trained partners can preview their signature move. Reduced motion uses stable silhouettes and still previews while preserving each move’s identity.

Each move has an original, locally synthesized sound synchronized to its attack release: electric crackles, leafy swishes, fire bursts and streams, watery jets and pulses, silk plucks, wind, psychic tones, dragon rumbles, and icy chimes. Sounds follow the Arena move identity; moves sharing a silhouette still have distinct tuning. Evolved levels deepen the sound, and Focused power/Crowd keeper add different accents. Evolution plays a rising arpeggio, a full chord, and a sparkling finish; final training has its own higher fanfare. Combat audio softens during the fanfare. A capped, compressed mix prevents busy 3× waves from piling up too many sounds, and sound clips are cached without external audio downloads.

Use the speaker control to enable sound. The saved `pokeall-sound` preference is preserved, and browsers unlock playback on a click or key press. Evolution previews include **Hear [move]** and **Hear evolution** buttons plus their own shared sound toggle; sounds play only when requested, not from every looping preview. Muting stops current sounds immediately. Pausing, resetting, and hiding the tab also stop playback; closing a preview stops its sample. No old attacks replay when sound resumes. Audio is optional: an unavailable or blocked audio device never prevents play.

The game pauses while a dialog is open or when its tab is hidden. Battle animation clocks pause with it and scale with the 1×/2×/3× speed control. Move demonstrations have their own clock while the battle is paused. Personal bests and sound preferences are saved locally when browser storage is available. A run is not restored after a page reload. The game works on touch devices and respects reduced-motion preferences.

## Layout and route scenery

The compact game window keeps the map, wave controls, and evolution alerts together. Sound, the speed dropdown, pause, and restart sit immediately left of Start Wave. Personal Best heads the team panel. Use **Routes** or the difficulty button in the red toolbar to open the six-route chooser. A change to a route or difficulty requires confirmation when a run is in progress. The team panel becomes a horizontal partner row on phones, and the trainer journal holds optional visitor and progression details.

Scenery is unique to each biome: flowered woodland and lily pools, a waterfall-fed creek, orange maple groves and a fallen-log hollow, dark crystal chambers, acacia savanna and reed beds, and a palm coast with surf and a volcanic shelf.

Each route ends at a themed entrance: Viridian Forest’s forest passage, Cerulean Creek’s river crossing, Autumn Trail’s golden grove, Moonlit Cavern’s mountain entrance, Safari Circuit’s gate, and Cinnabar Coast’s sea cave. Terrain uses locally packaged pixel tiles; scenery never changes path coordinates, clearing positions, or combat balance. The page uses system fonts, local assets, and a restrictive Content Security Policy with no external connections.

## Development

### GitHub Pages

The [Deploy PokeWallClash workflow](.github/workflows/deploy-pages.yml) runs `npm run check` on every push to `main` and publishes the contents of `dist/` to https://dk2code.github.io/PokeWallClash/. It can also be run manually from the repository's Actions tab. GitHub Pages uses **GitHub Actions** as its deployment source. No dependency installation, build step, or server is needed for the hosted game.

Keep asset and module URLs relative so the game works under the `/PokeWallClash/` project path. Saves stay in each browser and are separate between the hosted game and localhost. The Arena source checksums are preserved across Git checkouts by `.gitattributes`.

### Checks and source

`npm run check` checks JavaScript syntax and runs deterministic gameplay and animation tests. The simulation is in `dist/game.mjs`, frame sampling in `dist/sprite-animation.mjs`, rendering in `dist/art.mjs`, and controls/UI in `dist/app.mjs`. Static files in `dist/` can be hosted directly. System fonts keep the game independent of external font services. Run `npm run dev` to serve the game locally. Original browser save keys are retained so personal bests and sound preferences remain compatible.

`npm run balance` reports a fixed starter-only strategy across all 24 route/difficulty combinations using earned resources. `node scripts/balance-report.mjs --opening` shows wave-by-wave Normal opening income and XP. For focused checks, use `--difficulty=expert --waves=5 --summary`; `--reward=picnic` compares the training reward. Balance regressions cover all six starter pairs on all six routes, economy, progression timing, contribution caps, quiet defenders, boss XP, and stronger status effects.

Set `POKEWALLCLASH_REFERENCE_DIR` to a local reference engine’s `dist` directory, then run `npm run sync:arena` to refresh the copied Arena modules plus all used species’ seven animation states, retaining frame metadata, license and artist histories. Arena is only read; the finished game works independently of its folder and server. `dist/partner-moves.mjs` selects the Arena move for each stage and path, and `dist/combat-art.mjs` adapts the renderers to tower-defense coordinates. Tests verify byte-for-byte source consistency, move/species membership, all render paths, sound identity, collection gates, rewards, every animation sheet, and all 24 route/difficulty combinations using only the four starters and earned resources. `dist/records.mjs` handles save migration and per-difficulty records; `dist/collection.mjs` validates saves and schedules visitors.

PokeWallClash is an unofficial, noncommercial fan project. Pokémon artwork and names belong to Nintendo, Game Freak, and The Pokémon Company. Roster sprites are from [PokeAPI](https://github.com/PokeAPI/sprites). Directional animations are from [SpriteCollab](https://github.com/PMDCollab/SpriteCollab), including original CHUNSOFT artwork and community contributions under CC BY-NC 4.0. See `dist/assets/CREDITS.txt` and the license, contributor index, name mappings, and per-species histories in `dist/assets/directional/`.
