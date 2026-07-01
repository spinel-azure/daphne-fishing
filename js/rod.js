const Rod={
  lineCanvas:null,
  ctx:null,
  rodCanvas:null,
  rodCtx:null,
  reelAngle:0,
  lastPointerAngle:null,
  aimAngle:0,
  targetAimAngle:0,
  lastDrawTime:0,

  init(){
    this.lineCanvas=UI.$('lineCanvas');
    this.ctx=this.lineCanvas.getContext('2d');
    this.rodCanvas=UI.$('rodCanvas');
    this.rodCtx=this.rodCanvas.getContext('2d');
    this.setRodMode(true);
    this.updateAim(50);
    this.updateHandle(0);
  },

  setRodMode(useCanvas){
    const rod=UI.$('rod');
    if(this.rodCanvas)this.rodCanvas.style.display=useCanvas?'block':'none';
    if(rod)rod.style.display=useCanvas?'none':'block';
  },

  resize(w,h){
    this.lineCanvas.width=w;
    this.lineCanvas.height=h;
    this.rodCanvas.width=w;
    this.rodCanvas.height=h;
    this.rodCanvas.style.width=w+'px';
    this.rodCanvas.style.height=h+'px';
    this.drawRod();
    this.drawLine();
  },

  updateAim(aim){
    this.setAimAngle((clamp(aim,0,100)-50)/50,true);
  },

  setAimAngle(value,instant=false){
    this.targetAimAngle=clamp(value,-1,1);
    if(instant)this.aimAngle=this.targetAimAngle;
  },

  getAimAngle(){
    return this.targetAimAngle;
  },

  setFacingRad(rad,instant=false){
    const base=this.basePoint();
    const farX=base.x+Math.cos(rad)*280;
    const bounds=Game?.playBounds?.()??{left:28,right:this.lineCanvas.width-28};
    const center=(bounds.left+bounds.right)/2;
    const half=Math.max(80,(bounds.right-bounds.left)/2);
    this.setAimAngle((farX-center)/half,instant);
  },

  rotate(deltaRad){
    this.setAimAngle(this.targetAimAngle+deltaRad*1.45);
  },

  facingRad(){
    const base=this.basePoint();
    const tip=this.getTip(this.targetAimAngle);
    return Math.atan2(tip.y-base.y,tip.x-base.x);
  },

  aimAt(x,y,instant=false){
    const bounds=Game?.playBounds?.()??{left:28,right:this.lineCanvas.width-28};
    const center=(bounds.left+bounds.right)/2;
    const half=Math.max(80,(bounds.right-bounds.left)/2);
    this.setAimAngle((x-center)/half,instant);
  },

  basePoint(){
    const bottomOffset=this.lineCanvas.height<680?34:42;
    return {
      x:this.lineCanvas.width-48,
      y:this.lineCanvas.height-bottomOffset
    };
  },

  rodPathPoints(aim=this.aimAngle){
    const w=this.rodCanvas.width||UI.$('wrap').clientWidth;
    const h=this.rodCanvas.height||UI.$('wrap').clientHeight;
    const base=this.basePoint();
    const waterTop=h*.25;
    const tipY=clamp(h*.43-(1-Math.abs(aim))*h*.035,waterTop+24,h*.62);
    const centerX=w*.56;
    const spread=w*.45;
    const tipX=clamp(centerX+aim*spread,24,w-24);
    const controlX=base.x-w*.12+aim*w*.16;
    const controlY=base.y-h*.31;
    const tensionBend=game?.state===GameState.BATTLE?clamp((game.tension-50)/50,-1,1)*18:0;
    return {
      base,
      c1:{x:controlX,y:controlY+tensionBend},
      tip:{x:tipX,y:tipY}
    };
  },

  pointOnRod(t,aim=this.aimAngle){
    const p=this.rodPathPoints(aim);
    const mt=1-t;
    return {
      x:mt*mt*p.base.x+2*mt*t*p.c1.x+t*t*p.tip.x,
      y:mt*mt*p.base.y+2*mt*t*p.c1.y+t*t*p.tip.y
    };
  },

  normalOnRod(t){
    const a=this.pointOnRod(clamp(t-.01,0,1));
    const b=this.pointOnRod(clamp(t+.01,0,1));
    const dx=b.x-a.x;
    const dy=b.y-a.y;
    const len=Math.hypot(dx,dy)||1;
    return {x:-dy/len,y:dx/len};
  },

  getTip(aim=this.aimAngle){
    return this.rodPathPoints(aim).tip;
  },

  drawRod(){
    if(!this.rodCtx)return;
    const now=performance.now();
    const dt=this.lastDrawTime?Math.min(.05,(now-this.lastDrawTime)/1000):.016;
    this.lastDrawTime=now;
    this.aimAngle+=(this.targetAimAngle-this.aimAngle)*(1-Math.exp(-dt/.16));

    const c=this.rodCtx;
    const w=this.rodCanvas.width;
    const h=this.rodCanvas.height;
    c.clearRect(0,0,w,h);

    const p=this.rodPathPoints();
    c.lineCap='round';
    c.lineJoin='round';

    c.strokeStyle='rgba(0,0,0,.95)';
    c.lineWidth=13;
    c.beginPath();
    c.moveTo(p.base.x,p.base.y);
    c.quadraticCurveTo(p.c1.x,p.c1.y,p.tip.x,p.tip.y);
    c.stroke();

    const body=c.createLinearGradient(p.base.x,p.base.y,p.tip.x,p.tip.y);
    body.addColorStop(0,'#f4f1df');
    body.addColorStop(.55,'#ffffff');
    body.addColorStop(1,'#e8fbff');
    c.strokeStyle=body;
    c.lineWidth=8;
    c.beginPath();
    c.moveTo(p.base.x,p.base.y);
    c.quadraticCurveTo(p.c1.x,p.c1.y,p.tip.x,p.tip.y);
    c.stroke();

    c.strokeStyle='#22d8ff';
    c.lineWidth=5;
    for(const t of [.23,.52,.78]){
      const q=this.pointOnRod(t);
      const n=this.normalOnRod(t);
      c.beginPath();
      c.moveTo(q.x-n.x*7,q.y-n.y*7);
      c.lineTo(q.x+n.x*7,q.y+n.y*7);
      c.stroke();
    }

    c.strokeStyle='#05070a';
    c.fillStyle='#dff8ff';
    c.lineWidth=3;
    for(const t of [.34,.47,.60,.72,.84,.94]){
      const q=this.pointOnRod(t);
      const n=this.normalOnRod(t);
      const gx=q.x+n.x*8;
      const gy=q.y+n.y*8;
      c.beginPath();
      c.moveTo(q.x,q.y);
      c.lineTo(gx,gy);
      c.stroke();
      c.beginPath();
      c.ellipse(gx,gy,5,3,Math.atan2(n.y,n.x),0,Math.PI*2);
      c.fill();
      c.stroke();
    }

    c.fillStyle='#36dfff';
    c.strokeStyle='#05070a';
    c.lineWidth=3;
    c.beginPath();
    c.moveTo(p.tip.x,p.tip.y-8);
    c.lineTo(p.tip.x+7,p.tip.y+6);
    c.lineTo(p.tip.x-5,p.tip.y+7);
    c.closePath();
    c.fill();
    c.stroke();

    this.drawReelOnRod(c);
  },

  drawReelOnRod(c){
    const q=this.pointOnRod(.16);
    const n=this.normalOnRod(.16);
    const x=q.x+n.x*18;
    const y=q.y+n.y*18;
    c.save();
    c.translate(x,y);
    c.rotate(Math.atan2(n.y,n.x));
    c.fillStyle='#1b2028';
    c.strokeStyle='#05070a';
    c.lineWidth=4;
    c.beginPath();
    c.ellipse(0,0,15,11,0,0,Math.PI*2);
    c.fill();
    c.stroke();
    c.fillStyle='#59606b';
    c.beginPath();
    c.ellipse(0,0,8,6,0,0,Math.PI*2);
    c.fill();
    c.beginPath();
    c.moveTo(12,3);
    c.lineTo(24,11);
    c.lineWidth=5;
    c.stroke();
    c.fillStyle='#0d1118';
    c.beginPath();
    c.arc(29,14,5,0,Math.PI*2);
    c.fill();
    c.restore();
  },

  drawLine(){
    const c=this.ctx;
    c.clearRect(0,0,this.lineCanvas.width,this.lineCanvas.height);
    this.drawRod();
    if(![GameState.WAIT,GameState.HIT,GameState.BATTLE].includes(game.state))return;
    const tip=this.getTip();
    const b=game.bob;
    const target=game.castTarget??{distanceRate:game.castDistanceRate/100,aimRate:this.aimAngle};
    const far=clamp(target.distanceRate??.5,0,1);
    const aim=clamp(target.aimRate??this.aimAngle,-1,1);
    const cx=(tip.x+b.x)/2+aim*18;
    const cy=(tip.y+b.y)/2+48-far*78;

    c.strokeStyle='rgba(235,250,255,.95)';
    c.lineWidth=2;
    c.shadowColor='rgba(80,170,255,.55)';
    c.shadowBlur=3;
    c.beginPath();
    c.moveTo(tip.x,tip.y);
    c.quadraticCurveTo(cx,cy,b.x,b.y);
    c.stroke();
    c.shadowBlur=0;

    if(game.state===GameState.BATTLE){
      c.strokeStyle='rgba(190,230,255,.55)';
      c.beginPath();
      c.moveTo(b.x,b.y);
      c.lineTo(b.x,b.y+55);
      c.stroke();
    }
  },

  updateHandle(angle){
    this.reelAngle=angle;
    const handle=UI.$('handleImg');
    const unit=UI.$('reelZone').getBoundingClientRect();
    const center=unit.width/2;
    const r=unit.width*.32;
    const x=center+Math.cos(angle)*r;
    const y=center+Math.sin(angle)*r;
    handle.style.left=x+'px';
    handle.style.top=y+'px';
    handle.style.transform=`translate(-50%,-50%) rotate(${angle+Math.PI/2}rad)`;
  },

  pointerAngle(ev){
    const zone=UI.$('reelZone').getBoundingClientRect();
    return Math.atan2(ev.clientY-(zone.top+zone.height/2),ev.clientX-(zone.left+zone.width/2));
  },

  isReelHeld(){
    return this.lastPointerAngle!==null;
  },

  startReel(ev){
    if(game.state!==GameState.BATTLE)return;
    ev.preventDefault();
    this.lastPointerAngle=this.pointerAngle(ev);
  },

  moveReel(ev){
    if(game.state!==GameState.BATTLE||this.lastPointerAngle===null)return;
    ev.preventDefault();
    const a=this.pointerAngle(ev);
    let d=a-this.lastPointerAngle;
    if(d>Math.PI)d-=Math.PI*2;
    if(d<-Math.PI)d+=Math.PI*2;
    this.lastPointerAngle=a;
    this.updateHandle(this.reelAngle+d);
    const clockwise=d>0?d:0;
    if(clockwise>0&&game.fight){
      const f=game.fight.fish;
      const hpRate=clamp(game.fight.hp/game.fight.maxHp,0,1);
      let zone=1;
      if(game.tension<28)zone=.28;
      else if(game.tension>84)zone=.42;
      else if(game.tension>=42&&game.tension<=68)zone=1.18;
      const damage=clockwise*12.5*zone/(f.pow*.85);
      const reelGain=clockwise*(.17+zone*.055)/(f.pow*.48);
      game.fight.hp=Math.max(0,game.fight.hp-damage);
      game.fight.distance=Math.max(0,game.fight.distance-reelGain);
      if(game.fight.distance<.5)game.fight.distance=0;
      UI.setTension(game.tension+clockwise*(2.3+f.pow*.9)*(.35+.65*hpRate));
      if(Math.random()<clockwise*.25)Effects.addRipple(game.bob.x,game.bob.y,true);
    }else if(d<0){
      UI.setTension(game.tension-1.0);
    }
  },

  endReel(){
    this.lastPointerAngle=null;
  }
};
