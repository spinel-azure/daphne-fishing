const FishDB={
  data:[
    {id:'000',name:'骨',distanceMin:0,distanceMax:30,depthMin:1,depthMax:5,sizeMin:0,sizeMax:0,pow:0,stamina:0,rare:5,bait:'any',trash:true,e:'🦴',description:'なにかの骨のようだ。',cooking:'…食べる…？これを…！？'},
    {id:'001',name:'ウグイ',distanceMin:5,distanceMax:15,depthMin:1,depthMax:4,sizeMin:15,sizeMax:45,pow:10,stamina:20,rare:80,bait:'worm',trash:false,e:'🐟',description:'川や湖に広く生息する身近な淡水魚。小さくても元気よく糸を引く。',cooking:'甘露煮や塩焼きなど。'},
    {id:'002',name:'ザリガニ',distanceMin:0,distanceMax:5,depthMin:14,depthMax:15,sizeMin:5,sizeMax:15,pow:5,stamina:10,rare:70,bait:'worm',trash:false,e:'🦞',description:'水草の影や岩場に潜む小さな甲殻類。意外と力強く糸を引く。',cooking:'泥抜きして塩ゆでやスープに。'},
    {id:'003',name:'テナガエビ',distanceMin:2,distanceMax:8,depthMin:14,depthMax:15,sizeMin:5,sizeMax:20,pow:8,stamina:15,rare:55,bait:'worm',trash:false,e:'🦐',description:'長いハサミ脚が特長の淡水エビ。夜になると活発に動き回る。',cooking:'素揚げや唐揚げで香ばしく。'},
    {id:'004',name:'ニジマス',distanceMin:10,distanceMax:20,depthMin:3,depthMax:8,sizeMin:25,sizeMax:60,pow:35,stamina:50,rare:35,bait:'shrimp',trash:false,e:'🐟',description:'冷たい水を好む美しい魚。引きが強く、釣り人にも人気が高い。',cooking:'塩焼きやムニエルがおすすめ。'},
    {id:'005',name:'ナマズ',distanceMin:10,distanceMax:20,depthMin:13,depthMax:15,sizeMin:40,sizeMax:100,pow:50,stamina:80,rare:25,bait:'worm',trash:false,e:'🐟',description:'湖底に潜む大きな口の魚。ぬるりとした体で力強く暴れる。',cooking:'蒲焼きや天ぷらにすると美味。'},
    {id:'006',name:'ウナギ',distanceMin:20,distanceMax:30,depthMin:14,depthMax:15,sizeMin:40,sizeMax:100,pow:60,stamina:90,rare:15,bait:'worm',trash:false,e:'🐍',description:'夜の湖底を静かに泳ぐ細長い魚。釣れればかなりのごちそう。',cooking:'蒲焼き一択！'},
    {id:'007',name:'サーモン',distanceMin:20,distanceMax:30,depthMin:4,depthMax:8,sizeMin:50,sizeMax:90,pow:65,stamina:100,rare:10,bait:'shrimp',trash:false,e:'🐟',description:'海と湖を往き来する力強い魚。大きく育った個体は迫力満点。',cooking:'塩焼き・ムニエル・ちゃんちゃん焼きなど。'},
    {id:'008',name:'スズキ',distanceMin:15,distanceMax:25,depthMin:2,depthMax:7,sizeMin:40,sizeMax:100,pow:55,stamina:80,rare:20,bait:'shrimp',trash:false,e:'🐟',description:'汽水域を代表する銀色の魚。鋭い引きと上品な味で知られる。',cooking:'洗い・塩焼き・ムニエルなど。'},
    {id:'009',name:'ソウギョ',distanceMin:20,distanceMax:30,depthMin:1,depthMax:4,sizeMin:70,sizeMax:150,pow:75,stamina:120,rare:8,bait:'paste',trash:false,e:'🐟',description:'水草を好む大型の草食魚。巨大な個体はまるで丸太のよう。',cooking:'唐揚げ・甘酢あんかけなど。'},
    {id:'010',name:'深淵の主',distanceMin:28,distanceMax:30,depthMin:15,depthMax:15,sizeMin:300,sizeMax:500,pow:100,stamina:300,rare:1,bait:'abyss',trash:false,e:'🐉',description:'この湖を支配する魚たちの王。',cooking:'ぬしを　たべるなんて　とんでもない！',lockedDescription:'？？？？？',lockedCooking:'？？？？？',unlockedDescription:'湖の奥深くに何かが潜んでいるようだ…。',unlockedCooking:'？？？？？',requiresCollection:['000','001','002','003','004','005','006','007','008','009']}
  ],
  distanceRateToMeters(rate){
    const value=Math.max(0,Math.min(100,Number(rate)||0));
    return value/100*30;
  },
  hasDepth(fish,depth){
    return depth>=fish.depthMin&&depth<=fish.depthMax;
  },
  hasDistance(fish,distance){
    return distance>=fish.distanceMin&&distance<=fish.distanceMax;
  },
  currentBait(){
    try{
      return localStorage.getItem('daphneFishingSelectedBait')||'any';
    }catch(err){
      return 'any';
    }
  },
  hasBait(fish,bait='any'){
    const current=String(bait||'any');
    if(current==='any'||fish.bait==='any')return true;
    return fish.bait===current;
  },
  readDex(){
    try{
      return JSON.parse(localStorage.getItem('daphneFishingFishDex')||'{}')||{};
    }catch(err){
      return {};
    }
  },
  caughtIds(){
    const ids=new Set();
    const keys=['daphneFishingFishDex','daphneFishingDex','daphneFishingEncyclopedia','daphneFishingCaughtFish'];
    keys.forEach(key=>{
      try{
        const raw=localStorage.getItem(key);
        if(!raw)return;
        const saved=JSON.parse(raw);
        if(Array.isArray(saved)){
          saved.forEach(item=>ids.add(typeof item==='string'?item:String(item?.id??item?.fishId??'')));
        }else if(saved&&typeof saved==='object'){
          Object.entries(saved).forEach(([id,value])=>{
            if(value)ids.add(String(value.id??value.fishId??id));
          });
        }
      }catch(err){}
    });
    return ids;
  },
  isUnlocked(fish){
    if(!fish.requiresCollection)return true;
    if(window.DAPHNE_DEBUG_UNLOCK_ABYSS===true)return true;
    const caught=this.caughtIds();
    return fish.requiresCollection.every(id=>caught.has(id));
  },
  candidates(depth,castDistanceRate=50,bait=this.currentBait()){
    const distance=this.distanceRateToMeters(castDistanceRate);
    return this.data.filter(fish=>this.hasDepth(fish,depth)&&this.hasDistance(fish,distance)&&this.hasBait(fish,bait)&&this.isUnlocked(fish));
  },
  weightedPick(list){
    const total=list.reduce((sum,fish)=>sum+Math.max(0,Number(fish.rare)||0),0);
    if(total<=0)return list[Math.floor(Math.random()*list.length)];
    let roll=Math.random()*total;
    for(const fish of list){
      roll-=Math.max(0,Number(fish.rare)||0);
      if(roll<=0)return fish;
    }
    return list[list.length-1];
  },
  rollSize(fish){
    if(fish.sizeMax<=0)return 0;
    const min=Number(fish.sizeMin)||0;
    const max=Number(fish.sizeMax)||min;
    return Math.round((min+Math.random()*(max-min))*10)/10;
  },
  battlePower(fish){
    if(fish.trash)return .25;
    return Math.max(.18,(Number(fish.pow)||0)/55);
  },
  recordCatch(fish){
    if(!fish||!fish.id)return {newRecord:false,previousMaxSize:0,maxSize:0};
    try{
      const key='daphneFishingFishDex';
      const raw=localStorage.getItem(key);
      const dex=raw?JSON.parse(raw):{};
      const current=dex[fish.id]&&typeof dex[fish.id]==='object'?dex[fish.id]:{};
      const size=Number(fish.sizeCm??fish.size??0)||0;
      const previousMaxSize=Number(current.maxSize)||0;
      const newRecord=size>0&&(previousMaxSize<=0||size>previousMaxSize);
      const maxSize=Math.max(previousMaxSize,size);
      dex[fish.id]={
        ...current,
        id:fish.id,
        name:fish.name??fish.n,
        caught:true,
        count:(Number(current.count)||0)+1,
        lastSize:size,
        maxSize
      };
      localStorage.setItem(key,JSON.stringify(dex));
      return {newRecord,previousMaxSize,maxSize};
    }catch(err){
      return {newRecord:false,previousMaxSize:0,maxSize:Number(fish.sizeCm??fish.size??0)||0};
    }
  },
  pick(depth,castDistanceRate=50,bait=this.currentBait()){
    let list=this.candidates(depth,castDistanceRate,bait);
    if(!list.length){
      const distance=this.distanceRateToMeters(castDistanceRate);
      const unlocked=this.data.filter(fish=>this.isUnlocked(fish));
      list=unlocked.filter(fish=>this.hasDepth(fish,depth)&&this.hasDistance(fish,distance));
      if(!list.length)list=unlocked.filter(fish=>!fish.trash&&this.hasDepth(fish,depth));
      if(!list.length)list=unlocked.filter(fish=>!fish.trash);
    }
    const picked=this.weightedPick(list);
    const size=this.rollSize(picked);
    return {
      ...picked,
      n:picked.name,
      e:picked.e,
      size,
      sizeCm:size,
      rareWeight:picked.rare,
      selectedBait:bait,
      fightPow:this.battlePower(picked)
    };
  }
};