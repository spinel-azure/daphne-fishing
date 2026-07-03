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
        this.moveIndex(1);
      }else if(ev.key==='ArrowUp'||ev.key==='Up'){
        ev.preventDefault();
        this.moveIndex(-1);
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
  moveIndex(dir){
    let next=this.index;
    for(let count=0;count<this.items.length;count++){
      next=(next+dir+this.items.length)%this.items.length;
      if(!this.items[next].disabled){
        this.setIndex(next);
        return;
      }
    }
  },
  choose(i){
    this.setIndex(i);
    const item=this.items[i];
    if(!item||item.disabled)return;
    const action=item.dataset.titleAction;
    if(action==='howto'){
      HelpScene.show(0);
      return;
    }
    if(action==='options'){
      OptionScene.show();
      return;
    }
    if(action==='notice'){
      NoticeScene.show(0);
      return;
    }
    if(action!=='start')return;
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
  },
  returnToTitle(){
    if(!this.scene)return;
    this.chosen=false;
    this.active=true;
    this.scene.style.display='flex';
    this.scene.classList.remove('is-hidden');
    this.setIndex(Math.min(this.index,this.items.length-1));
    if(this.logoCanvas&&this.logoCtx&&this.logoImage?.complete){
      this.logoStart=performance.now();
      requestAnimationFrame(t=>this.drawLogo(t));
    }
  }
};

const HelpScene={
  scene:null,
  pages:[],
  page:0,
  init(){
    this.scene=document.getElementById('helpScene');
    this.pages=[...document.querySelectorAll('.helpPage')];
    if(!this.scene||!this.pages.length)return;
    document.getElementById('helpTitleBtn')?.addEventListener('click',()=>this.returnTitle());
    document.getElementById('helpPrevBtn')?.addEventListener('click',()=>this.prevHelpPage());
    document.getElementById('helpNextBtn')?.addEventListener('click',()=>this.nextHelpPage());
    window.addEventListener('keydown',ev=>{
      if(this.scene.classList.contains('is-hidden'))return;
      if(ev.key==='ArrowRight'||ev.key==='Right'){
        ev.preventDefault();
        this.nextHelpPage();
      }else if(ev.key==='ArrowLeft'||ev.key==='Left'){
        ev.preventDefault();
        this.prevHelpPage();
      }else if(ev.key==='Escape'){
        ev.preventDefault();
        this.returnTitle();
      }
    });
    this.drawCastFigure();
    this.showHelpPage(0);
  },
  show(index=0){
    if(!this.scene)return;
    TitleScene.active=false;
    this.scene.classList.remove('is-hidden');
    this.showHelpPage(index);
  },
  showHelpPage(index){
    this.page=clamp(Math.round(index),0,this.pages.length-1);
    this.pages.forEach((page,i)=>page.classList.toggle('is-active',i===this.page));
    const titleBtn=document.getElementById('helpTitleBtn');
    const prevBtn=document.getElementById('helpPrevBtn');
    const nextBtn=document.getElementById('helpNextBtn');
    const nav=document.querySelector('.helpNav');
    if(titleBtn)titleBtn.classList.toggle('is-hidden',this.page===1);
    if(prevBtn)prevBtn.classList.toggle('is-hidden',this.page===0);
    if(nextBtn)nextBtn.classList.toggle('is-hidden',this.page===2);
    if(nav)nav.classList.toggle('is-final',this.page===2);
    const pageText=document.getElementById('helpPageText');
    if(pageText)pageText.textContent=`${this.page+1}/3`;
  },
  nextHelpPage(){
    if(this.page>=this.pages.length-1)return;
    this.showHelpPage(this.page+1);
  },
  prevHelpPage(){
    if(this.page<=0)return;
    this.showHelpPage(this.page-1);
  },
  returnTitle(){
    if(!this.scene)return;
    this.scene.classList.add('is-hidden');
    TitleScene.returnToTitle();
  },
  drawCastFigure(){
    const canvas=document.getElementById('helpCastCanvas');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const img=new Image();
    img.draggable=false;
    img.onload=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(img,4,4,88,88);
      ctx.lineCap='round';
      ctx.lineWidth=7;
      ctx.strokeStyle='#151d28';
      ctx.beginPath();
      ctx.arc(48,48,41,Math.PI*1.14,Math.PI*1.86);
      ctx.stroke();
      ctx.strokeStyle='#54e67a';
      ctx.beginPath();
      ctx.arc(48,48,41,Math.PI*1.14,Math.PI*1.62);
      ctx.stroke();
    };
    img.src='images/cast_button.png';
  }
};

window.addEventListener('DOMContentLoaded',()=>HelpScene.init());

const NoticeScene={
  scene:null,
  page:0,
  init(){
    this.scene=document.getElementById('noticeScene');
    if(!this.scene)return;
    document.getElementById('noticeTitleBtn')?.addEventListener('click',()=>this.returnTitle());
    document.getElementById('noticePrevBtn')?.addEventListener('click',()=>this.prevPage());
    document.getElementById('noticeNextBtn')?.addEventListener('click',()=>this.nextPage());
    window.addEventListener('keydown',ev=>{
      if(this.scene.classList.contains('is-hidden'))return;
      if(ev.key==='ArrowRight'||ev.key==='Right'){
        ev.preventDefault();
        this.nextPage();
      }else if(ev.key==='ArrowLeft'||ev.key==='Left'){
        ev.preventDefault();
        this.prevPage();
      }else if(ev.key==='Escape'){
        ev.preventDefault();
        this.returnTitle();
      }
    });
    this.showPage(0);
  },
  get pages(){
    return I18N.dict[I18N.lang]?.noticePages??I18N.dict.ja.noticePages??[[]];
  },
  show(index=0){
    if(!this.scene)return;
    TitleScene.active=false;
    this.scene.classList.remove('is-hidden');
    this.showPage(index);
  },
  showPage(index){
    const max=Math.max(0,this.pages.length-1);
    this.page=clamp(Math.round(index),0,max);
    this.render();
  },
  render(){
    if(!this.scene)return;
    const body=document.getElementById('noticeBody');
    const pageText=document.getElementById('noticePageText');
    const prevBtn=document.getElementById('noticePrevBtn');
    const nextBtn=document.getElementById('noticeNextBtn');
    const pages=this.pages;
    const lines=I18N.noticePageText?.(this.page)??pages[this.page]??[];
    if(body)body.innerHTML=lines.map(text=>`<p>${text}</p>`).join('');
    if(pageText)pageText.textContent=`${this.page+1}/${pages.length}`;
    if(prevBtn)prevBtn.classList.toggle('is-hidden',this.page<=0);
    if(nextBtn)nextBtn.classList.toggle('is-hidden',this.page>=pages.length-1);
  },
  nextPage(){
    if(this.page>=this.pages.length-1)return;
    this.showPage(this.page+1);
  },
  prevPage(){
    if(this.page<=0)return;
    this.showPage(this.page-1);
  },
  returnTitle(){
    if(!this.scene)return;
    this.scene.classList.add('is-hidden');
    TitleScene.returnToTitle();
  }
};

window.addEventListener('DOMContentLoaded',()=>NoticeScene.init());
const OptionScene={
  scene:null,
  init(){
    this.scene=document.getElementById('optionScene');
    if(!this.scene)return;
    document.getElementById('optionTitleBtn')?.addEventListener('click',()=>this.returnTitle());
    document.querySelectorAll('input[name="lang"]').forEach(input=>{
      input.addEventListener('change',()=>{
        if(input.checked)I18N.setLang(input.value);
      });
    });
    document.querySelectorAll('input[name="ambienceEnabled"]').forEach(input=>{
      input.addEventListener('change',()=>{
        if(input.checked)AudioManager.setAmbienceEnabled(input.value==='on');
        this.syncAmbienceControls();
      });
    });
    document.getElementById('ambienceVolume')?.addEventListener('input',ev=>{
      AudioManager.setAmbienceVolume(Number(ev.currentTarget.value)/100);
      this.syncAmbienceControls();
    });
    window.addEventListener('keydown',ev=>{
      if(this.scene.classList.contains('is-hidden'))return;
      if(ev.key==='Escape'){
        ev.preventDefault();
        this.returnTitle();
      }
    });
    this.syncAmbienceControls();
  },
  show(){
    if(!this.scene)return;
    TitleScene.active=false;
    this.syncAmbienceControls();
    this.scene.classList.remove('is-hidden');
  },
  syncAmbienceControls(){
    if(typeof AudioManager==='undefined')return;
    const settings=AudioManager.getAmbienceSettings();
    document.querySelectorAll('input[name="ambienceEnabled"]').forEach(input=>{
      input.checked=input.value===(settings.ambienceEnabled?'on':'off');
    });
    const volume=document.getElementById('ambienceVolume');
    const volumeText=document.getElementById('ambienceVolumeText');
    const volumeWrap=document.querySelector('.optionVolumeWrap');
    const percent=Math.round(settings.ambienceVolume*100);
    if(volume){
      volume.value=String(percent);
      volume.disabled=!settings.ambienceEnabled;
    }
    if(volumeText)volumeText.textContent=`${percent}%`;
    if(volumeWrap)volumeWrap.classList.toggle('is-disabled',!settings.ambienceEnabled);
  },
  returnTitle(){
    if(!this.scene)return;
    this.scene.classList.add('is-hidden');
    TitleScene.returnToTitle();
  }
};

window.addEventListener('DOMContentLoaded',()=>OptionScene.init());
