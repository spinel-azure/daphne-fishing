const FishDB={
  tables:[
   {min:1,max:3,list:[{n:'メダカ',e:'🐟',pow:.7,rare:'C'},{n:'小アユ',e:'🐟',pow:.8,rare:'C'},{n:'ブルーギル',e:'🐠',pow:1.0,rare:'C'}]},
   {min:4,max:6,list:[{n:'フナ',e:'🐟',pow:1.1,rare:'C'},{n:'コイ',e:'🐠',pow:1.4,rare:'R'},{n:'ブラックバス',e:'🐟',pow:1.5,rare:'R'}]},
   {min:7,max:10,list:[{n:'ナマズ',e:'🐡',pow:1.7,rare:'R'},{n:'ライギョ',e:'🐍',pow:2.0,rare:'SR'},{n:'大ゴイ',e:'🐠',pow:2.1,rare:'SR'}]},
   {min:11,max:13,list:[{n:'深場イカ',e:'🦑',pow:2.2,rare:'SR'},{n:'古代ガニ',e:'🦀',pow:2.4,rare:'SR'},{n:'夜光魚',e:'🐟',pow:2.6,rare:'SSR'}]},
   {min:14,max:15,list:[{n:'ヌシ',e:'🦈',pow:3.0,rare:'SSR'},{n:'ダフューン',e:'🐬',pow:3.2,rare:'SSR'},{n:'深淵の影',e:'🦑',pow:3.5,rare:'L'}]}
  ],
  distanceBand(index){
    return [
      {min:0,max:58},
      {min:26,max:86},
      {min:58,max:100}
    ][index]||{min:0,max:100};
  },
  castRange(fish,index){
    return {
      min:fish.castMin??this.distanceBand(index).min,
      max:fish.castMax??this.distanceBand(index).max
    };
  },
  pick(depth,castDistanceRate=50){
    const castRate=Math.max(0,Math.min(100,castDistanceRate));
    // 深度1mは浅すぎるので、ハズレ枠として骨が掛かりやすい。
    if(depth===1&&Math.random()<0.65*(1-castRate/150)){
      return {n:'骨',e:'🦴',pow:.45,rare:'ハズレ',trash:true};
    }
    const g=this.tables.find(t=>depth>=t.min&&depth<=t.max);
    const list=g.list.filter((fish,index)=>{
      const range=this.castRange(fish,index);
      return castRate>=range.min&&castRate<=range.max;
    });
    if(!list.length)list.push(...g.list);
    return {...list[Math.floor(Math.random()*list.length)]};
  }
};
