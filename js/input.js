const Input={
  aimTimer:null,
  castPointerId:null,
  depthPointerId:null,
  reelPointerId:null,
  init(){
    this.preventBrowserGestures();
    this.bindDepthGauge();
    this.bindAimButtons();
    this.bindCastButton();
    this.bindReel();
    UI.$('backBtn').addEventListener('click',()=>Game.reset());
    UI.$('againBtn').addEventListener('click',()=>{UI.$('result').style.display='none';Game.reset()});
  },
  shouldUsePointer(ev){
    return Device.acceptsPointer(ev);
  },
  preventBrowserGestures(){
    document.querySelectorAll('img').forEach(img=>{
      img.draggable=false;
    });
    const block=ev=>{
      if(ev.target.closest?.('#wrap,button,img,canvas'))ev.preventDefault();
    };
    document.addEventListener('contextmenu',block);
    document.addEventListener('dragstart',block);
    document.addEventListener('selectstart',block);
    document.addEventListener('touchstart',block,{passive:false,capture:true});
  },
  bindDepthGauge(){
    const gauge=UI.$('depthGauge');
    const select=ev=>{
      if(!this.shouldUsePointer(ev))return;
      if(game.state!==GameState.READY)return;
      ev.preventDefault();
      const track=UI.$('gaugeTrack').getBoundingClientRect();
      const ratio=clamp((ev.clientY-track.top)/track.height,0,1);
      UI.setDepth(1+ratio*14);
      UI.log(`Depth ${game.depth}m selected.`);
    };
    gauge.addEventListener('pointerdown',ev=>{
      if(!this.shouldUsePointer(ev))return;
      this.depthPointerId=ev.pointerId;
      gauge.setPointerCapture?.(ev.pointerId);
      select(ev);
    });
    gauge.addEventListener('pointermove',ev=>{
      if(ev.pointerId!==this.depthPointerId)return;
      select(ev);
    });
    const clear=ev=>{
      if(!ev||ev.pointerId===this.depthPointerId)this.depthPointerId=null;
    };
    gauge.addEventListener('pointerup',clear);
    gauge.addEventListener('pointercancel',clear);
    gauge.addEventListener('lostpointercapture',clear);
  },
  bindAimButtons(){
    const start=dir=>{
      if(game.state!==GameState.READY)return;
      const step=()=>Rod.rotate(dir*.035);
      step();
      this.aimTimer=window.setInterval(step,32);
    };
    const stop=()=>{
      if(this.aimTimer!==null){
        window.clearInterval(this.aimTimer);
        this.aimTimer=null;
      }
    };
    const bind=(id,dir)=>{
      const btn=UI.$(id);
      btn.addEventListener('pointerdown',ev=>{
        if(!this.shouldUsePointer(ev))return;
        ev.preventDefault();
        btn.setPointerCapture?.(ev.pointerId);
        start(dir);
      });
      btn.addEventListener('pointerup',stop);
      btn.addEventListener('pointercancel',stop);
      btn.addEventListener('lostpointercapture',stop);
      btn.addEventListener('pointerleave',ev=>{if(!Device.isTouchMode())stop(ev)});
    };
    bind('aimLeftBtn',-1);
    bind('aimRightBtn',1);
    window.addEventListener('pointerup',stop);
    window.addEventListener('blur',stop);
  },
  bindCastButton(){
    const btn=UI.$('castBtn');
    btn.addEventListener('contextmenu',ev=>ev.preventDefault());
    btn.addEventListener('dragstart',ev=>ev.preventDefault());
    btn.addEventListener('touchstart',ev=>ev.preventDefault(),{passive:false,capture:true});
    btn.addEventListener('pointerdown',ev=>{
      if(!this.shouldUsePointer(ev))return;
      if(game.state===GameState.HIT){
        ev.preventDefault();
        Game.hook();
        return;
      }
      if(game.state!==GameState.READY)return;
      ev.preventDefault();
      this.castPointerId=ev.pointerId;
      btn.setPointerCapture?.(ev.pointerId);
      Game.startCasting();
    });
    btn.addEventListener('pointerup',ev=>{
      if(ev.pointerId!==this.castPointerId)return;
      ev.preventDefault();
      this.castPointerId=null;
      if(game.casting)Game.releaseCasting();
    });
    const cancel=ev=>{
      if(ev.pointerId!==this.castPointerId)return;
      this.castPointerId=null;
      if(game.casting)Game.releaseCasting();
    };
    btn.addEventListener('pointercancel',cancel);
    btn.addEventListener('lostpointercapture',cancel);
  },
  bindReel(){
    const z=UI.$('reelZone');
    z.addEventListener('pointerdown',ev=>{
      if(!this.shouldUsePointer(ev))return;
      if(game.state!==GameState.BATTLE)return;
      ev.preventDefault();
      this.reelPointerId=ev.pointerId;
      z.setPointerCapture?.(ev.pointerId);
      Rod.startReel(ev);
    });
    z.addEventListener('pointermove',ev=>{
      if(ev.pointerId!==this.reelPointerId)return;
      Rod.moveReel(ev);
    });
    const end=ev=>{
      if(!ev||ev.pointerId===this.reelPointerId){
        this.reelPointerId=null;
        Rod.endReel();
      }
    };
    z.addEventListener('pointerup',end);
    z.addEventListener('pointercancel',end);
    z.addEventListener('lostpointercapture',end);
    window.addEventListener('blur',end);
  }
};
