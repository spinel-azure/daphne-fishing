const DexScene={
  scene:null,
  mode:'list',
  index:0,
  items:[],
  unknownName:'？？？？？',
  init(){
    this.scene=document.getElementById('dexScene');
    if(!this.scene)return;
    document.getElementById('dexTitleBtn')?.addEventListener('click',()=>this.returnTitle());
    document.getElementById('dexBackBtn')?.addEventListener('click',()=>this.showList());
    this.scene.addEventListener('click',ev=>{
      const item=ev.target.closest?.('.dexListItem');
      if(!item)return;
      this.showDetail(Number(item.dataset.index)||0);
    });
    this.scene.addEventListener('pointerenter',ev=>{
      const item=ev.target.closest?.('.dexListItem');
      if(item)this.setIndex(Number(item.dataset.index)||0);
    },true);
    window.addEventListener('keydown',ev=>{
      if(!this.scene||this.scene.classList.contains('is-hidden'))return;
      if(this.mode==='detail'){
        if(ev.key==='Escape'||ev.key==='Backspace'||ev.key==='ArrowLeft'||ev.key==='Left'){
          ev.preventDefault();
          this.showList();
        }
        return;
      }
      if(ev.key==='ArrowDown'||ev.key==='Down'){
        ev.preventDefault();
        this.moveIndex(1);
      }else if(ev.key==='ArrowUp'||ev.key==='Up'){
        ev.preventDefault();
        this.moveIndex(-1);
      }else if(ev.key==='Enter'||ev.key===' '){
        ev.preventDefault();
        this.showDetail(this.index);
      }else if(ev.key==='Escape'){
        ev.preventDefault();
        this.returnTitle();
      }
    });
    this.renderList();
  },
  show(){
    if(!this.scene)return;
    TitleScene.active=false;
    this.scene.classList.remove('is-hidden');
    this.showList();
  },
  dex(){
    return FishDB.readDex?.()??{};
  },
  isCaught(fish,dex=this.dex()){
    return !!dex[fish.id]?.caught;
  },
  displayName(fish,dex=this.dex()){
    return this.isCaught(fish,dex)?fish.name:this.unknownName;
  },
  renderList(){
    const list=document.getElementById('dexList');
    if(!list)return;
    const dex=this.dex();
    list.innerHTML=FishDB.data.map((fish,i)=>{
      const name=this.displayName(fish,dex);
      const caught=this.isCaught(fish,dex);
      return `<button class="dexListItem${i===this.index?' is-active':''}${caught?' is-caught':''}" type="button" data-index="${i}"><span>No.${fish.id}</span><strong>${name}</strong></button>`;
    }).join('');
    this.items=[...list.querySelectorAll('.dexListItem')];
    this.setIndex(this.index);
  },
  setIndex(index){
    this.index=clamp(Math.round(index),0,FishDB.data.length-1);
    this.items.forEach((item,i)=>item.classList.toggle('is-active',i===this.index));
    this.items[this.index]?.scrollIntoView?.({block:'nearest'});
  },
  moveIndex(dir){
    this.setIndex((this.index+dir+FishDB.data.length)%FishDB.data.length);
  },
  showList(){
    this.mode='list';
    this.renderList();
    document.getElementById('dexListView')?.classList.remove('is-hidden');
    document.getElementById('dexDetailView')?.classList.add('is-hidden');
    document.getElementById('dexTitleBtn')?.classList.remove('is-hidden');
    document.getElementById('dexBackBtn')?.classList.add('is-hidden');
  },
  showDetail(index){
    this.mode='detail';
    this.setIndex(index);
    this.renderDetail(FishDB.data[this.index]);
    document.getElementById('dexListView')?.classList.add('is-hidden');
    document.getElementById('dexDetailView')?.classList.remove('is-hidden');
    document.getElementById('dexTitleBtn')?.classList.add('is-hidden');
    document.getElementById('dexBackBtn')?.classList.remove('is-hidden');
  },
  silhouetteFromDraw(drawSource,size=96,color=[3,7,18]){
    const canvas=document.createElement('canvas');
    canvas.width=size;
    canvas.height=size;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,size,size);
    drawSource(ctx,size);
    const image=ctx.getImageData(0,0,size,size);
    for(let i=0;i<image.data.length;i+=4){
      if(image.data[i+3]>0){
        image.data[i]=color[0];
        image.data[i+1]=color[1];
        image.data[i+2]=color[2];
      }
    }
    ctx.putImageData(image,0,0);
    canvas.className='dexSilhouetteCanvas';
    return canvas;
  },
  silhouetteFromEmoji(emoji,size=96){
    return this.silhouetteFromDraw((ctx,s)=>{
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.font=`${Math.round(s*.62)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.fillText(emoji,s/2,s/2+s*.04);
    },size);
  },
  silhouetteFromImage(image,size=96){
    return this.silhouetteFromDraw((ctx,s)=>{
      const ratio=Math.min(s/image.naturalWidth,s/image.naturalHeight)*.86;
      const w=image.naturalWidth*ratio;
      const h=image.naturalHeight*ratio;
      ctx.drawImage(image,(s-w)/2,(s-h)/2,w,h);
    },size);
  },
  renderIcon(icon,fish,caught,unlocked){
    icon.innerHTML='';
    icon.classList.remove('is-silhouette','is-hint','is-mystery');
    if(caught){
      icon.textContent=fish.e;
      return;
    }
    icon.classList.add('is-silhouette');
    if(fish.id==='010'&&!unlocked){
      icon.textContent='?';
      icon.classList.add('is-mystery');
      return;
    }
    if(fish.id==='000'){
      icon.textContent='?';
      icon.classList.add('is-mystery');
      return;
    }
    icon.appendChild(this.silhouetteFromEmoji(fish.e));
    if(unlocked)icon.classList.add('is-hint');
  },
  renderDetail(fish){
    const dex=this.dex();
    const entry=dex[fish.id]??{};
    const caught=this.isCaught(fish,dex);
    const unlocked=fish.id==='010'&&FishDB.isUnlocked(fish);
    const name=caught?fish.name:this.unknownName;
    const description=caught?fish.description:(unlocked?(fish.unlockedDescription??this.unknownName):this.unknownName);
    const cooking=caught?fish.cooking:(unlocked?(fish.unlockedCooking??this.unknownName):this.unknownName);
    const count=caught?String(Number(entry.count)||0):this.unknownName;
    const max=caught&&Number(entry.maxSize)>0?`${Number(entry.maxSize).toFixed(1)}cm`:this.unknownName;
    document.getElementById('dexDetailNo').textContent=`No.${fish.id}`;
    document.getElementById('dexDetailName').textContent=name;
    const icon=document.getElementById('dexDetailIcon');
    if(icon)this.renderIcon(icon,fish,caught,unlocked);
    document.getElementById('dexDetailCount').textContent=count;
    document.getElementById('dexDetailMax').textContent=max;
    document.getElementById('dexDetailDescription').textContent=description;
    document.getElementById('dexDetailCooking').textContent=cooking;
  },
  returnTitle(){
    if(!this.scene)return;
    this.scene.classList.add('is-hidden');
    TitleScene.returnToTitle();
  }
};

window.addEventListener('DOMContentLoaded',()=>DexScene.init());