// Permanent collection-point rewards. These partners never enter visitor rolls.
export const SPECIAL_PARTNERS=Object.freeze({151:{price:2500,title:'Mythical discovery'},150:{price:4000,title:'Legendary power'}});
export const SPECIAL_TOWERS=[
  {id:151,name:'Mew',type:'psychic',cost:500,damage:49,range:185,rate:1.1,splash:60,color:'#e899cc',move:'Ancient Power',ability:'Mythical starburst',description:'Ancient Power launches orbiting gems. Train Mew to unleash Psychic rings or a faster gem barrage. A permanent collection-point reward.',stages:[151,151,151],names:['Mew','Mew','Mew'],legendary:true,signature:'mew'},
  {id:150,name:'Mewtwo',type:'psychic',cost:650,damage:68,range:195,rate:1.3,splash:65,color:'#ae79e2',move:'Aura Sphere',ability:'Psychic shockwave',description:'Aura Sphere gathers into a dense energy orb. Train Mewtwo to unleash Psystrike with a wide psychic shockwave. A permanent collection-point reward.',stages:[150,150,150],names:['Mewtwo','Mewtwo','Mewtwo'],legendary:true,signature:'mewtwo'},
];
export const SPECIAL_EVOLUTIONS={
  151:[{id:'focus',name:'Ancient constellation',ability:'Rapid gem barrage',description:'Ancient Power fires 25% faster with +25 reach.',tempo:.75,reach:25},{id:'surge',name:'Mythical awakening',ability:'Psychic starburst',description:'Psychic surrounds the target with rings. Gain 20% power and a 90-pixel splash.',power:1.2,splash:90}],
  150:[{id:'focus',name:'Aura master',ability:'Focused aura',description:'Aura Sphere gains 40% power and +25 reach.',power:1.4,reach:25},{id:'surge',name:'Psystrike',ability:'Psychic eruption',description:'Psystrike erupts beneath the target. Gain 15% power and a 110-pixel splash.',power:1.15,splash:110}],
};
