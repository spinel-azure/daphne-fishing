const TitleScene={
  scene:null,items:[],index:0,active:true,chosen:false,logoCanvas:null,logoCtx:null,logoImage:null,logoStart:0,
  init(){
    this.scene=document.getElementById('titleScene');
    this.items=[...document.querySelectorAll('.titleMenuItem')];
    if(!this.scene||!this.items.length)return;
    this.initLogoCanvas();
    this.items.forEach((item,i)=>{
      const activate=()=>this.chooseOnce(i);
      item.addEventListener('click',activate);
      item.addEventListener('pointerup',ev=>{
        if(ev.pointerType==='touch'||ev.pointerType==='pen'){
          activate();
        }
      });
      item.addEventListener('touchend',activate,{passive:true});
      item.addEventListener('pointerdown',()=>this.setIndex(i));
      item.addEventListener('touchstart',()=>this.setIndex(i),{passive:true});
      item.addEventListener('pointerenter',()=>this.setIndex(i));
    });
    window.addEventListener('keydown',ev=>{
      if(!this.active)return;
      if(ev.key==='ArrowDown'||ev.key==='Down'){
        ev.preventDefault();
        this.setIndex((this.index+1)%this.items.length);
      }else if(ev.key==='ArrowUp'||ev.key==='Up'){
        ev.preventDefault();
        this.setIndex((this.index+this.items.length-1)%this.items.length);
      }else if(ev.key==='Enter'||ev.key===' '){
        ev.preventDefault();
        this.chooseOnce(this.index);
      }
    });
    this.setIndex(0);
  },
  initLogoCanvas(){
    this.logoCanvas=document.getElementById('titleLogoCanvas');
    if(!this.logoCanvas)return;
    this.logoCtx=this.logoCanvas.getContext('2d');
    this.logoCtx.imageSmoothingEnabled=false;
    this.logoImage=new Image();
    this.logoImage.src='images/title_logo.png';
    this.logoImage.onload=()=>{
      this.logoCanvas.width=this.logoImage.naturalWidth;
      this.logoCanvas.height=this.logoImage.naturalHeight;
      this.logoCtx.imageSmoothingEnabled=false;
      this.logoStart=performance.now();
      requestAnimationFrame(t=>this.drawLogo(t));
    };
  },
  drawLogo(now){
    if(!this.logoCanvas||!this.logoCtx||!this.logoImage?.complete)return;
    const w=this.logoCanvas.width;
    const h=this.logoCanvas.height;
    const ctx=this.logoCtx;
    const t=(now-this.logoStart)/1000;
    const sliceH=2;
    const amp=3.2;
    ctx.clearRect(0,0,w,h);
    ctx.imageSmoothingEnabled=false;
    for(let y=0;y<h;y+=sliceH){
      const offset=Math.sin(t*1.45+y*.055)*amp+Math.sin(t*.72+y*.022)*1.15;
      ctx.drawImage(this.logoImage,0,y,w,sliceH,Math.round(offset),y,w,sliceH);
    }
    if(this.active)requestAnimationFrame(n=>this.drawLogo(n));
  },
  setIndex(i){
    this.index=i;
    this.items.forEach((item,n)=>item.classList.toggle('is-active',n===i));
  },
  choose(i){
    this.setIndex(i);
    const item=this.items[i];
    if(item.dataset.titleAction!=='start')return;
    item.classList.remove('cursor-flash');
    void item.offsetWidth;
    item.classList.add('cursor-flash');
    this.startGame();
  },
  chooseOnce(i){
    const item=this.items[i];
    if(item?.dataset.titleAction!=='start'){
      this.choose(i);
      return;
    }
    if(this.chosen)return;
    this.chosen=true;
    this.choose(i);
  },
  startGame(){
    if(!this.active)return;
    this.active=false;
    this.scene.classList.add('is-hidden');
    window.setTimeout(()=>{this.scene.style.display='none'},360);
    if(typeof Game!=='undefined'&&typeof Game.reset==='function')Game.reset();
  }
};
