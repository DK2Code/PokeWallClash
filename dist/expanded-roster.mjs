import {MOVES} from './arena/moves.mjs';

// One entry per collectible Gen 1 family. Evolutions occupy the same slot.
// Every move is taken from the corresponding species' the reference engine loadout.
const colors={bug:'#99ae65',flying:'#a392b6',normal:'#bba080',poison:'#a77aaf',ground:'#b69a69',grass:'#69a672',water:'#76a9c1',fire:'#de8968',fighting:'#bc8070',rock:'#aa9c7b',ghost:'#9183b2'};
const abilities={bug:'Quick strikes',flying:'Sweeping gusts',normal:'Rapid attacks',poison:'Lingering poison',ground:'Steady ground power',grass:'Poison damage',water:'Slowing water',fire:'Splash damage',fighting:'Heavy close strikes',rock:'Rock splash',ghost:'Haunting reach'};
function partner(id,name,type,stats,stages,names,moves,description,perks={}){
  const [cost,damage,range,rate]=stats,[basic,focus,surge]=moves;
  return {id,name,type,cost,damage,range,rate,color:colors[type],ability:abilities[type],description,stages,names,move:MOVES[basic].name,
    ...(type==='rock'?{splash:32}:{}),...perks,movePlan:{basic,focus,surge}};
}
export const EXTRA_PARTNERS=[
  partner(13,'Weedle','poison',[90,11,140,.8],[13,14,15],['Weedle','Kakuna','Beedrill'],['poison-sting',['poison-sting','pin-missile'],['bug-bite','twineedle']],'A tiny poison specialist. Train through Kakuna into Beedrill’s needle attacks.'),
  partner(16,'Pidgey','flying',[115,15,150,1],[16,17,18],['Pidgey','Pidgeotto','Pidgeot'],['gust',['air-slash','air-slash'],['twister','hurricane']],'A breezy partner whose gusts cover nearby targets. Pidgeot brings a full hurricane.'),
  partner(19,'Rattata','normal',[80,11,125,.55],[19,20,20],['Rattata','Raticate','Raticate'],['quick-attack',['super-fang','super-fang'],['double-edge','double-edge']],'An inexpensive, fast attacker. Raticate trades little nibbles for powerful fangs.'),
  partner(23,'Ekans','poison',[110,15,145,1],[23,24,24],['Ekans','Arbok','Arbok'],['poison-sting',['acid','acid'],['gunk-shot','gunk-shot']],'Wear down tough targets with poison, then grow into Arbok’s acid and sludge attacks.'),
  partner(27,'Sandshrew','ground',[120,23,130,1],[27,28,28],['Sandshrew','Sandslash','Sandslash'],['dig',['dig','dig'],['earthquake','earthquake']],'A sturdy ground attacker. Choose focused digging or a crowd-shaking earthquake.'),
  partner(41,'Zubat','flying',[100,12,145,.95],[41,42,42],['Zubat','Golbat','Golbat'],['wing-attack',['wing-attack','wing-attack'],['air-slash','air-slash']],'Fast wings sweep small groups. Golbat stays within the original Kanto evolution line.'),
  partner(43,'Oddish','grass',[105,14,140,.9],[43,44,45],['Oddish','Gloom','Vileplume'],['absorb',['giga-drain','solar-beam'],['acid','petal-dance']],'A garden companion with lingering poison. Vileplume blooms into beams or dancing petals.'),
  partner(46,'Paras','bug',[95,15,130,.8],[46,47,47],['Paras','Parasect','Parasect'],['leech-life',['fury-cutter','fury-cutter'],['x-scissor','x-scissor']],'A nimble mushroom partner. Parasect’s crossing claws reward careful placement.'),
  partner(50,'Diglett','ground',[105,19,125,.8],[50,51,51],['Diglett','Dugtrio','Dugtrio'],['dig',['dig','dig'],['earthquake','earthquake']],'Small, quick ground attacks become Dugtrio’s focused strikes or wide earthquakes.'),
  partner(52,'Meowth','normal',[95,13,130,.6],[52,53,53],['Meowth','Persian','Persian'],['pay-day',['slash','slash'],['power-gem','power-gem']],'A quick attacker with coin-shaped shots. Persian chooses sharp claws or sparkling gems.'),
  partner(54,'Psyduck','water',[125,15,145,.95],[54,55,55],['Psyduck','Golduck','Golduck'],['water-gun',['zen-headbutt','zen-headbutt'],['hydro-pump','hydro-pump']],'Slowing water gives your team time. Golduck chooses a psychic strike or a powerful jet.'),
  partner(58,'Growlithe','fire',[145,25,140,1.1],[58,59,59],['Growlithe','Arcanine','Arcanine'],['ember',['flamethrower','flamethrower'],['flare-blitz','flare-blitz']],'A loyal fire partner. Arcanine brings flowing flames or a blazing rush.'),
  partner(60,'Poliwag','water',[100,11,145,.85],[60,61,62],['Poliwag','Poliwhirl','Poliwrath'],['bubble',['water-gun','hydro-pump'],['body-slam','dynamic-punch']],'Gentle bubbles slow the path. Train into Poliwrath for water power or fighting moves.'),
  partner(66,'Machop','fighting',[130,25,120,.95],[66,67,68],['Machop','Machoke','Machamp'],['karate-chop',['karate-chop','cross-chop'],['dynamic-punch','dynamic-punch']],'A strong close-range partner. Place near bends to make the most of Machamp’s punches.'),
  partner(69,'Bellsprout','grass',[115,16,150,1],[69,70,71],['Bellsprout','Weepinbell','Victreebel'],['vine-whip',['acid','leaf-blade'],['slam','leaf-storm']],'Long vines and lingering poison grow into Victreebel’s leaf blades or a leaf storm.'),
  partner(74,'Geodude','rock',[140,27,130,1.2],[74,75,76],['Geodude','Graveler','Golem'],['rock-throw',['rock-throw','rock-blast'],['rock-blast','earthquake']],'Heavy stones hit a small area. Golem rewards covering several bends with one clearing.'),
  partner(77,'Ponyta','fire',[130,19,135,.95],[77,78,78],['Ponyta','Rapidash','Rapidash'],['flame-charge',['quick-attack','quick-attack'],['flare-blitz','flare-blitz']],'A fiery sprinter. Rapidash chooses swift strikes or a blazing charge, retaining its fire splash.'),
  partner(79,'Slowpoke','water',[120,16,155,1.15],[79,80,80],['Slowpoke','Slowbro','Slowbro'],['water-gun',['psychic','psychic'],['surf','surf']],'A patient water partner with extra reach. Slowbro learns psychic rings or rolling surf.'),
  partner(92,'Gastly','ghost',[145,23,175,1.1],[92,93,94],['Gastly','Haunter','Gengar'],['night-shade',['shadow-ball','shadow-ball'],['lick','dark-pulse']],'Haunt distant targets. Gengar chooses shadow orbs or dark pulses without leaving Gen 1.'),
  partner(98,'Krabby','water',[105,13,135,.85],[98,99,99],['Krabby','Kingler','Kingler'],['bubble',['crabhammer','crabhammer'],['metal-claw','metal-claw']],'A small slowing-water partner. Kingler upgrades its claws for heavy blows.'),
  partner(104,'Cubone','ground',[125,23,150,1.1],[104,105,105],['Cubone','Marowak','Marowak'],['bone-club',['bonemerang','bonemerang'],['bone-rush','bone-rush']],'A determined ground attacker. Marowak’s thrown bones reach across winding paths.'),
  partner(116,'Horsea','water',[110,13,155,.9],[116,117,117],['Horsea','Seadra','Seadra'],['bubble',['water-gun','water-gun'],['hydro-pump','hydro-pump']],'A little bubble turret that grows into Seadra’s water jets. No later-generation evolution.'),
  partner(120,'Staryu','water',[135,16,150,.9],[120,121,121],['Staryu','Starmie','Starmie'],['water-gun',['swift','swift'],['hydro-pump','hydro-pump']],'Slowing water with a stellar twist. Starmie fires stars or a powerful water stream.'),
  partner(123,'Scyther','bug',[185,25,145,.85],[123,123,123],['Scyther','Scyther','Scyther'],['quick-attack',['fury-cutter','fury-cutter'],['x-scissor','x-scissor']],'A rare blade specialist. Training strengthens Scyther while keeping its Kanto form.'),
  partner(127,'Pinsir','bug',[170,27,130,.95],[127,127,127],['Pinsir','Pinsir','Pinsir'],['vice-grip',['brick-break','brick-break'],['x-scissor','x-scissor']],'A powerful close-range visitor. Train its fighting strikes or crossing bug blades.'),
  partner(129,'Magikarp','water',[70,7,115,.9],[129,130,130],['Magikarp','Gyarados','Gyarados'],['tackle',['bite','bite'],['hydro-pump','hydro-pump']],'A patient trainer’s project. Weak tackles become Gyarados’s bites or roaring water jets.'),
  partner(138,'Omanyte','water',[150,20,150,1.1],[138,139,139],['Omanyte','Omastar','Omastar'],['water-gun',['rock-blast','rock-blast'],['hydro-pump','hydro-pump']],'An ancient shell with slowing water. Omastar chooses fossil rocks or a high-pressure jet.'),
  partner(140,'Kabuto','rock',[150,24,140,1.1],[140,141,141],['Kabuto','Kabutops','Kabutops'],['ancient-power',['slash','slash'],['stone-edge','stone-edge']],'A fossil partner with a small rock splash. Kabutops develops blades or sharp stones.'),
];
export const EXTRA_MOVES=Object.fromEntries(EXTRA_PARTNERS.map(p=>[p.id,p.movePlan]));
export const EXTRA_TOWERS=EXTRA_PARTNERS.map(({movePlan,...tower})=>tower);
export const EXTRA_EVOLUTIONS=Object.fromEntries(EXTRA_PARTNERS.map(p=>[p.id,[
  {id:'focus',name:'Focused power',ability:'Long-range specialist',power:p.id===129?3.4:1.35,reach:25,
    description:`${[...new Set(p.movePlan.focus.map(slug=>MOVES[slug].name))].join(' → ')}. Gain ${p.id===129?240:35}% power and +25 range; keep your partner’s battle perk.`},
  {id:'surge',name:'Crowd keeper',ability:'Wide-area specialist',splash:65,tempo:.9,...(p.id===129?{power:2.4}:{}),
    description:`${[...new Set(p.movePlan.surge.map(slug=>MOVES[slug].name))].join(' → ')}. Attacks hit a 65-pixel area and fire 11% faster.${p.id===129?' Gyarados gains 140% power.':''}`},
]]));
export const EXTRA_ENEMIES=Object.fromEntries(EXTRA_PARTNERS.map(p=>[p.id,{name:p.name,type:p.type,hp:Math.round(p.cost*1.5),speed:p.type==='rock'?37:p.type==='flying'?65:48,reward:Math.round(p.cost*.22)}]));
