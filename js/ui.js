const UI={
  $(id){return document.getElementById(id)},
  text(id,value){const el=this.$(id);if(el)el.textContent=value},
  log(t){this.text('log',t)},
  setStateText(){},
  actionButton:{
    gauge:null,
    ctx:null,
    progress:0,
    active:false,
    image:null,
    imageReady:false
  },
  setTension(v){
    game.tension=clamp(v,0,100);
    const value=Math.round(game.tension);
    this.text('tenText',value+'%');
    const f=this.$('tenFill');
    if(!f)return;
    f.style.setProperty('width',game.tension+'%','important');
    f.style.background=game.tension<25||game.tension>82?'var(--danger)':game.tension<35||game.tension>70?'var(--warn)':'var(--safe)';
  },
  setCastDistance(rate,failed=false){
    if(rate===null||rate===undefined){
      this.text('castDistanceText','--');
      this.setBackgroundZoom(null);
      return;
    }
    const value=clamp(rate,0,100);
    const meters=this.castDistanceMeters(value);
    this.text('castDistanceText',failed?`${meters}m MISS`:`${meters}m`);
    this.setBackgroundZoom(meters);
  },
  castDistanceMeters(rate){
    const normalized=clamp(rate,0,100)/100;
    return Math.round(5+normalized*75);
  },
  setBackgroundZoom(meters){
    const wrap=this.$('wrap');
    if(!wrap)return;
    if(meters===null||meters===undefined){
      wrap.style.setProperty('--bgZoom','1');
      return;
    }
    const distanceRate=clamp((meters-5)/75,0,1);
    const zoom=1+(Math.pow(1-distanceRate,1.75)*.36);
    wrap.style.setProperty('--bgZoom',zoom.toFixed(3));
  },
  setDepth(depth){
    game.depth=clamp(Math.round(depth),1,15);
    this.text('gaugeNow',game.depth+'m');
    this.drawGauge();
  },
  updateDepth(){this.setDepth(game.depth)},
  drawGauge(){
    const gt=this.$('gaugeTrack');
    if(!gt)return;
    gt.innerHTML='';
    [1,5,10,15].forEach(m=>{
      const y=(m-1)/14*100;
      const mark=document.createElement('div');
      mark.className='gaugeMark';
      mark.style.top=y+'%';
      const lab=document.createElement('div');
      lab.className='gaugeLabel';
      lab.style.top=`calc(${y}% - 7px)`;
      lab.textContent=m;
      gt.appendChild(mark);
      gt.appendChild(lab);
    });
    const now=document.createElement('div');
    now.className='gaugeNowMark';
    now.style.top=(game.depth-1)/14*100+'%';
    gt.appendChild(now);
  },
  setButtons(){
    const castBtn=this.$('castBtn');
    const label=this.$('castActionLabel');
    let ready=false;
    let enabled=false;
    let hidden=false;
    castBtn.classList.remove('is-bite','is-hit','is-fail','is-waiting','is-battle','is-full-charge');
    if(label)label.textContent='';

    switch(game.state){
      case GameState.READY:
        ready=true;
        enabled=true;
        break;
      case GameState.CASTING:
        enabled=true;
        break;
      case GameState.WAIT:
        castBtn.classList.add('is-waiting');
        this.hideCastPower();
        break;
      case GameState.HIT:
        enabled=true;
        castBtn.classList.add('is-hit','is-bite');
        if(label)label.textContent='HIT!!';
        this.hideCastPower();
        break;
      case GameState.BATTLE:
        hidden=true;
        castBtn.classList.add('is-battle');
        this.hideCastPower();
        break;
      default:
        this.hideCastPower();
        break;
    }

    castBtn.disabled=!enabled;
    castBtn.classList.toggle('is-hidden',hidden);
    this.$('aimLeftBtn').disabled=!ready;
    this.$('aimRightBtn').disabled=!ready;
    this.$('depthGauge').classList.toggle('is-disabled',!ready);
    this.$('backBtn').disabled=ready;
  },
  showCastPower(power,failed=false){
    const value=clamp(power,0,100);
    this.actionButton.active=true;
    this.actionButton.progress=value;
    const btn=this.$('castBtn');
    if(btn)btn.classList.toggle('is-full-charge',failed||value>=100);
    this.text('castPowerText',Math.round(value)+'%');
    this.drawCastGauge(value,failed);
  },
  showCastFail(){
    const btn=this.$('castBtn');
    const label=this.$('castActionLabel');
    if(!btn)return;
    btn.classList.add('is-fail','is-full-charge');
    if(label)label.textContent='MISS!!';
  },
  hideCastPower(){
    const box=this.$('castPower');
    if(box)box.classList.add('hide');
    this.actionButton.active=false;
    this.actionButton.progress=0;
    const btn=this.$('castBtn');
    if(btn)btn.classList.remove('is-full-charge','is-fail');
    const label=this.$('castActionLabel');
    if(label&&label.textContent==='MISS!!')label.textContent='';
    this.clearCastGauge();
  },
  resizeActionButton(){
    const canvas=this.$('castGaugeCanvas');
    if(!canvas)return;
    this.ensureCastButtonImage();
    const rect=canvas.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    const w=Math.max(1,Math.round(rect.width*dpr));
    const h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;
      canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    this.clearCastGauge();
  },
  ensureCastButtonImage(){
    if(this.actionButton.image)return;
    const img=new Image();
    img.draggable=false;
    img.onload=()=>{
      this.actionButton.imageReady=true;
      this.clearCastGauge();
    };
    img.src='images/cast_button.png';
    this.actionButton.image=img;
  },
  drawCastButtonBase(ctx,rect){
    this.ensureCastButtonImage();
    const img=this.actionButton.image;
    if(!img||!this.actionButton.imageReady)return;
    const boxW=rect.width/1.22;
    const boxH=rect.height/1.22;
    const imageRatio=img.naturalWidth/img.naturalHeight;
    const boxRatio=boxW/boxH;
    const drawW=boxRatio>imageRatio?boxH*imageRatio:boxW;
    const drawH=boxRatio>imageRatio?boxH:boxW/imageRatio;
    const x=(rect.width-drawW)/2;
    const y=(rect.height-drawH)/2;
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.58)';
    ctx.shadowBlur=0;
    ctx.shadowOffsetY=Math.max(3,drawH*.03);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,x,y,drawW,drawH);
    ctx.restore();
  },
  castGaugeColor(value,failed=false){
    if(failed||value>=100)return '#ff3d35';
    if(value>=95)return '#ff8b22';
    if(value>=90)return '#ffd84a';
    return '#54e67a';
  },
  drawCastGauge(power,failed=false){
    const canvas=this.$('castGaugeCanvas');
    if(!canvas)return;
    this.resizeActionButton();
    const ctx=canvas.getContext('2d');
    const rect=canvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);
    this.drawCastButtonBase(ctx,rect);
    const value=clamp(power,0,100);
    if(value<=0&&!failed)return;
    const cx=rect.width/2;
    const cy=rect.height/2;
    const radius=Math.min(rect.width,rect.height)*.405;
    const start=210*Math.PI/180;
    const end=330*Math.PI/180;
    const current=start+(end-start)*(value/100);
    ctx.lineCap='round';
    ctx.lineWidth=Math.max(8,rect.width*.062);
    ctx.strokeStyle='rgba(2,8,12,.58)';
    ctx.beginPath();
    ctx.arc(cx,cy,radius,start,end,false);
    ctx.stroke();
    ctx.strokeStyle=this.castGaugeColor(value,failed);
    ctx.shadowColor=failed||value>=100?'rgba(255,55,44,.95)':'rgba(255,255,255,.45)';
    ctx.shadowBlur=failed||value>=100?16:6;
    ctx.beginPath();
    ctx.arc(cx,cy,radius,start,current,false);
    ctx.stroke();
    ctx.shadowBlur=0;
  },
  clearCastGauge(){
    const canvas=this.$('castGaugeCanvas');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const rect=canvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);
    this.drawCastButtonBase(ctx,rect);
  },
  showResult(ok,reason){
    this.$('result').style.display='flex';
    if(ok){
      this.text('resultEmoji',game.fight.fish.e);
      this.text('resultTitle',I18N.t('caught',game.fight.fish.n));
      this.text('resultInfo',I18N.t('resultInfo',game.fight.fish.rare,game.depth));
    }else{
      this.text('resultEmoji','💨');
      this.text('resultTitle',reason);
      this.text('resultInfo',I18N.t('retry'));
    }
  }
};
