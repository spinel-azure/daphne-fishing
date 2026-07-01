const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const GameState={
  READY:'ready',
  CASTING:'casting',
  WAIT:'wait',
  HIT:'hit',
  BATTLE:'battle',
  RESULT:'result'
};
const game={
  state:GameState.READY,
  depth:5,
  aim:50,
  bob:{x:260,y:330},
  biteTimer:0,
  fight:null,
  tension:50,
  lastTime:performance.now(),
  fishPulse:0,
  looseTimer:0,
  casting:false,
  castPower:0,
  castDistanceRate:50,
  castTarget:null,
  castStart:0,
  castFailed:false
};

const Game={
  init(){
    UI.updateDepth();
    UI.setTension(50);
    UI.setCastDistance(null);
    Water.init();
    TreeWind.init();
    Rod.init();
    Effects.init();
    Device.init();
    Input.init();
    this.resize();
    window.addEventListener('resize',()=>this.resize());
    requestAnimationFrame(t=>this.tick(t));
  },
  resize(){
    Device.refresh();
    const r=UI.$('wrap').getBoundingClientRect();
    Water.resize(r.width,r.height);
    TreeWind.resize(r.width,r.height);
    Rod.resize(r.width,r.height);
    Effects.resize(r.width,r.height);
    UI.resizeActionButton();
  },
  setState(s){
    game.state=s;
    UI.setStateText(s);
    UI.setButtons();
  },
  playBounds(){
    const wrap=UI.$('wrap').getBoundingClientRect();
    const cast=UI.$('castBtn').getBoundingClientRect();
    const back=UI.$('backBtn').getBoundingClientRect();
    const controlsTop=Math.min(cast.top,back.top)-wrap.top;
    return {
      left:28,
      right:wrap.width-28,
      top:wrap.height*.18,
      bottom:Math.max(wrap.height*.35,controlsTop-26),
      width:wrap.width,
      height:wrap.height
    };
  },
  castPoint(){
    return this.castPointFromPower(62,false);
  },
  castPowerToDistanceRate(power,failed=false){
    if(failed)return 0;
    const p=clamp(power,0,99);
    if(p<90)return p/90*86;
    if(p<98)return 86+(p-90)/8*14;
    return 100;
  },
  castPointFromPower(power,failed=false){
    const bounds=this.playBounds();
    const aimRate=clamp(Rod.getAimAngle?.()??0,-1,1);
    const distanceRate=this.castPowerToDistanceRate(power,failed)/100;
    const sidePad=.08;
    const castX=clamp((aimRate+1)/2,sidePad,1-sidePad);
    const usableTop=bounds.top;
    const usableBottom=bounds.bottom;
    const castY=failed?1:clamp(1-distanceRate,.04,.96);
    const x=bounds.left+(bounds.right-bounds.left)*castX;
    const y=usableTop+(usableBottom-usableTop)*castY;
    const col=clamp(Math.floor(castX*4),0,3);
    const row=clamp(Math.floor(castY*4),0,3);

    return {
      x:clamp(x,bounds.left,bounds.right),
      y:clamp(y,bounds.top,bounds.bottom),
      w:bounds.width,
      h:bounds.height,
      target:{
        x:castX,
        y:castY,
        distanceRate,
        aimRate,
        col,
        row,
        areaIndex:row*4+col+1
      }
    };
  },
  rayDistanceToBounds(x,y,dx,dy,bounds){
    const hits=[];
    if(dx>0)hits.push((bounds.right-x)/dx);
    if(dx<0)hits.push((bounds.left-x)/dx);
    if(dy>0)hits.push((bounds.bottom-y)/dy);
    if(dy<0)hits.push((bounds.top-y)/dy);
    const positive=hits.filter(v=>Number.isFinite(v)&&v>0);
    return Math.max(80,Math.min(...positive,420));
  },
  castAt(x,y){
    if(game.state!==GameState.READY)return;
    Rod.aimAt(x,y);
    UI.log('竿の向きを決めたら、キャスティングボタンを長押ししてね。');
  },
  startCasting(){
    if(game.state!==GameState.READY||game.casting)return;
    game.casting=true;
    game.castPower=0;
    game.castStart=performance.now();
    game.castFailed=false;
    this.setState(GameState.CASTING);
    UI.showCastPower(0);
  },
  releaseCasting(){
    if(!game.casting)return;
    if(game.castFailed)return;
    const power=game.castPower;
    game.casting=false;
    UI.hideCastPower();
    if(game.castFailed||power>=100){
      this.castByPower(100,true);
    }else{
      this.castByPower(power,false);
    }
  },
  failCasting(){
    if(!game.casting||game.castFailed)return;
    game.castFailed=true;
    game.castPower=100;
    UI.showCastPower(100,true);
    UI.showCastFail();
    UI.log('力みすぎた！');
    window.setTimeout(()=>{
      if(game.casting){
        game.casting=false;
        UI.hideCastPower();
        this.castByPower(100,true);
      }
    },520);
  },
  castByPower(power,failed=false){
    if(game.state!==GameState.CASTING&&game.state!==GameState.READY)return;
    const p=this.castPointFromPower(power,failed);
    this.cast(p,{failed,distanceRate:this.castPowerToDistanceRate(power,failed)});
  },
  cast(p=this.castPoint(),options={}){
    if(game.state!==GameState.CASTING&&game.state!==GameState.READY)return;
    this.setState(GameState.WAIT);
    game.bob.x=p.x;
    game.bob.y=p.y;
    game.castDistanceRate=clamp(options.distanceRate??game.castDistanceRate,0,100);
    game.castTarget=p.target??{
      x:clamp(p.x/p.w,0,1),
      y:clamp(p.y/p.h,0,1),
      distanceRate:game.castDistanceRate/100,
      aimRate:Rod.getAimAngle?.()??0
    };
    UI.setCastDistance(game.castDistanceRate,options.failed);
    game.aim=clamp(Math.round(p.x/p.w*100),0,100);
    Rod.aimAt(game.bob.x,game.bob.y,false);
    UI.$('bobber').src='images/uki_float.png';
    UI.$('bobber').style.display='block';
    UI.$('fishEmoji').style.display='none';
    UI.$('splash').style.display='none';
    UI.log(options.failed?'投げ損ねた！ ウキが足元に落ちた。':`${game.depth}mのタナへ仕掛けを投入！\n竿先から糸が伸びています。アタリを待とう。`);
    game.biteTimer=options.failed?rand(1800,3600):rand(1400,4200);
    Rod.drawLine();
    Effects.addRipple(game.bob.x,game.bob.y,true);
  },
  startBite(){
    if(game.state!==GameState.WAIT)return;
    this.setState(GameState.HIT);
    UI.$('bobber').src='images/uki_sink.png';
    UI.$('splash').style.left=game.bob.x+'px';
    UI.$('splash').style.top=game.bob.y+'px';
    UI.$('splash').style.display='block';
    UI.log('ウキが沈んだ！\nすばやく「アワセ！」を押せ！');
    game.biteTimer=2400;
    Effects.addRipple(game.bob.x,game.bob.y,true);
  },
  hook(){
    if(game.state!==GameState.HIT)return;
    const f=FishDB.pick(game.depth,game.castDistanceRate);
    const maxHp=Math.round((f.trash?18:58)+f.pow*38+game.depth*3);
    const distance=game.depth*1.3+f.pow*8.5+rand(5,8);
    game.fight={
      fish:f,
      distance,
      maxDistance:distance,
      hp:maxHp,
      maxHp,
      startX:game.bob.x,
      startY:game.bob.y
    };
    game.looseTimer=0;
    this.setState(GameState.BATTLE);
    UI.$('reelZone').style.display='flex';
    Rod.updateHandle(0);
    UI.$('fishEmoji').textContent='🐟';
    UI.$('fishEmoji').style.display='block';
    UI.$('fishEmoji').style.left=game.bob.x+'px';
    UI.$('fishEmoji').style.top=(game.bob.y+45)+'px';
    UI.setTension(48);
    UI.log('何かが掛かった！\nリールで引き寄せろ！');
    Effects.addRipple(game.bob.x,game.bob.y,true);
  },
  finish(ok,reason){
    if(game.state===GameState.RESULT)return;
    this.setState(GameState.RESULT);
    Rod.endReel();
    UI.$('reelZone').style.display='none';
    UI.$('splash').style.display='none';
    UI.$('bobber').style.display='none';
    UI.$('fishEmoji').style.display='none';
    UI.showResult(ok,reason);
    game.fight=null;
    Rod.drawLine();
  },
  reset(){
    this.setState(GameState.READY);
    game.fight=null;
    game.biteTimer=0;
    game.casting=false;
    game.castFailed=false;
    game.castDistanceRate=50;
    game.castTarget=null;
    UI.setCastDistance(null);
    UI.hideCastPower();
    Rod.endReel();
    UI.$('reelZone').style.display='none';
    UI.$('bobber').style.display='none';
    UI.$('fishEmoji').style.display='none';
    UI.$('splash').style.display='none';
    UI.setTension(50);
    UI.log('タナを選んで、竿の向きを決めて、キャスティングボタンを長押し！');
    Rod.drawLine();
  },
  updateFightPosition(now){
    if(!game.fight)return;
    const tip=Rod.getTip();
    const rate=clamp(game.fight.distance/game.fight.maxDistance,0,1);
    const nearX=tip.x+22;
    const nearY=tip.y+58;
    const shake=rate*(.25+.75*game.fight.hp/game.fight.maxHp);
    game.bob.x=nearX+(game.fight.startX-nearX)*rate+Math.sin(now/140)*8*shake;
    game.bob.y=nearY+(game.fight.startY-nearY)*rate+Math.sin(now/190)*5*shake;
    game.bob.x=clamp(game.bob.x,28,UI.$('wrap').clientWidth-28);
    game.bob.y=clamp(game.bob.y,UI.$('wrap').clientHeight*.25,UI.$('wrap').clientHeight*.82);
  },
  updateCasting(now){
    if(!game.casting||game.castFailed)return;
    game.castPower=clamp((now-game.castStart)/1350*100,0,100);
    UI.showCastPower(game.castPower,game.castPower>=100);
    if(game.castPower>=100)this.failCasting();
  },
  tick(now){
    const dt=Math.min(.05,(now-game.lastTime)/1000);
    game.lastTime=now;
    this.updateCasting(now);

    if(game.state===GameState.WAIT){
      game.biteTimer-=dt*1000;
      if(game.biteTimer<=0)this.startBite();
    }else if(game.state===GameState.HIT){
      game.biteTimer-=dt*1000;
      if(game.biteTimer<=0)this.finish(false,'アワセ失敗！');
    }else if(game.state===GameState.BATTLE&&game.fight){
      const f=game.fight.fish;
      const hpRate=clamp(game.fight.hp/game.fight.maxHp,0,1);
      const tired=1-hpRate;
      const reelHeld=Rod.isReelHeld();
      game.fishPulse-=dt;

      if(game.fishPulse<=0){
        game.fishPulse=rand(.35,1.0)+tired*.55;
        Effects.addRipple(game.bob.x,game.bob.y,true);
      }

      if(reelHeld){
        UI.setTension(game.tension-dt*(f.trash?6.5:3.5));
      }else{
        Rod.updateHandle(Rod.reelAngle-dt*(4.2+f.pow*.75));
        game.fight.distance+=dt*(.65+f.pow*.42)*(.72+.28*hpRate);
        UI.setTension(game.tension-dt*(f.trash?26:18+f.pow*3.2));
      }
      game.fight.distance=Math.max(0,game.fight.distance);
      game.fight.distance=Math.min(game.fight.distance,game.fight.maxDistance*1.35);
      if(game.fight.distance<.5)game.fight.distance=0;
      if(game.tension>=100){
        this.finish(false,'テンション限界！ 糸が切れた！');
        requestAnimationFrame(t=>this.tick(t));
        return;
      }
      this.updateFightPosition(now);

      UI.$('fishEmoji').style.left=game.bob.x+'px';
      UI.$('fishEmoji').style.top=(game.bob.y+48+Math.sin(now/180)*5)+'px';

      if(game.fight&&game.fight.distance<=0)this.finish(true,'');
      else{
        if(game.tension<=5){
          game.looseTimer+=dt;
          if(game.looseTimer>1.25)this.finish(false,'テンション不足！ 魚が逃げた！');
        }else{
          game.looseTimer=0;
        }
      }
    }

    if([GameState.WAIT,GameState.HIT,GameState.BATTLE].includes(game.state)){
      UI.$('bobber').style.left=game.bob.x+'px';
      UI.$('bobber').style.top=(game.bob.y+Math.sin(now/300)*2)+'px';
      UI.$('splash').style.left=game.bob.x+'px';
      UI.$('splash').style.top=game.bob.y+'px';
    }

    Effects.update(dt,now);
    Water.update(dt);
    TreeWind.update(now);
    Rod.drawLine();
    Effects.draw();
    requestAnimationFrame(t=>this.tick(t));
  }
};

Game.init();
TitleScene.init();
