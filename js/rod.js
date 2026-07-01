const Rod={
  lineCanvas:null,ctx:null,rodCanvas:null,angleDeg:-10,reelAngle:0,lastPointerAngle:null,currentRad:-Math.PI*.58,targetRad:-Math.PI*.58,currentAimAngle:0,targetAimAngle:0,lastAimTime:0,
  THREE:null,renderer:null,scene:null,camera:null,root:null,segments:[],guides:[],rodReady:false,renderScale:.5,segmentCount:14,segmentLength:32,minRad:-2.86,maxRad:-1.36,
  init(){
    this.lineCanvas=UI.$('lineCanvas');
    this.ctx=this.lineCanvas.getContext('2d');
    this.rodCanvas=UI.$('rodCanvas');
    this.setRodMode(false);
    this.updateAim(50);
    this.updateHandle(0);
    this.initThree();
  },
  setRodMode(use3d){
    const rod=UI.$('rod');
    if(this.rodCanvas)this.rodCanvas.style.display=use3d?'block':'none';
    if(rod)rod.style.display=use3d?'none':'block';
  },
  async initThree(){
    try{
      const THREE=await import('https://unpkg.com/three@0.165.0/build/three.module.js');
      this.THREE=THREE;
      this.scene=new THREE.Scene();
      this.camera=new THREE.OrthographicCamera(0,1,1,0,-1000,1000);
      this.renderer=new THREE.WebGLRenderer({canvas:this.rodCanvas,alpha:true,antialias:false,powerPreference:'high-performance'});
      this.renderer.setPixelRatio(1);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.scene.add(new THREE.AmbientLight(0x6d7280,1.75));
      const key=new THREE.DirectionalLight(0xffdf9c,2.1);
      key.position.set(-2,3,6);
      this.scene.add(key);
      const fill=new THREE.DirectionalLight(0x4b8fcf,.75);
      fill.position.set(3,1,4);
      this.scene.add(fill);
      this.root=new THREE.Group();
      this.scene.add(this.root);
      this.buildRod();
      this.rodReady=true;
      this.setRodMode(true);
      this.resize(this.lineCanvas.width||UI.$('wrap').clientWidth,this.lineCanvas.height||UI.$('wrap').clientHeight);
      this.drawLine();
    }catch(e){
      console.warn('Three.js rod failed to load:',e);
      this.rodReady=false;
      this.setRodMode(false);
    }
  },
  buildRod(){
    const THREE=this.THREE;
    const rodMat=new THREE.MeshLambertMaterial({color:0xf4f2e8,flatShading:true});
    const wrapMat=new THREE.MeshLambertMaterial({color:0xdff8ff,flatShading:true});
    const handleMat=new THREE.MeshLambertMaterial({color:0x392617,flatShading:true});

    for(let i=0;i<this.segmentCount;i++){
      const t=i/(this.segmentCount-1);
      const r=THREE.MathUtils.lerp(6.5,2.4,t);
      const geo=new THREE.CylinderGeometry(r*.75,r,this.segmentLength,6,1,false);
      geo.rotateZ(Math.PI/2);
      const mesh=new THREE.Mesh(geo,rodMat);
      mesh.matrixAutoUpdate=false;
      this.root.add(mesh);
      this.segments.push(mesh);
      if(i%3===1||i===this.segmentCount-1){
        const guide=new THREE.Mesh(new THREE.TorusGeometry(r*1.35,r*.16,4,6),wrapMat);
        guide.rotation.y=Math.PI/2;
        guide.matrixAutoUpdate=false;
        this.root.add(guide);
        this.guides.push({mesh:guide,index:i,offset:this.segmentLength*.38});
      }
    }

    const handle=new THREE.Mesh(new THREE.CylinderGeometry(9,12,46,6,1,false),handleMat);
    handle.rotation.z=Math.PI/2;
    handle.matrixAutoUpdate=false;
    this.root.add(handle);
    this.handle=handle;
  },
  resize(w,h){
    this.lineCanvas.width=w;
    this.lineCanvas.height=h;
    if(this.rodCanvas){
      this.rodCanvas.width=Math.max(1,Math.floor(w*this.renderScale));
      this.rodCanvas.height=Math.max(1,Math.floor(h*this.renderScale));
      this.rodCanvas.style.width=w+'px';
      this.rodCanvas.style.height=h+'px';
    }
    if(this.rodReady){
      this.renderer.setSize(Math.max(1,Math.floor(w*this.renderScale)),Math.max(1,Math.floor(h*this.renderScale)),false);
      this.camera.left=0;
      this.camera.right=w;
      this.camera.top=0;
      this.camera.bottom=h;
      this.camera.updateProjectionMatrix();
      this.updateRodMesh();
    }
    this.drawLine();
  },
  updateAim(aim){
    this.setAimAngle((clamp(aim,0,100)-50)/50,true);
    const rod=UI.$('rod');
    if(rod)rod.style.setProperty('--rodrot',this.angleDeg+'deg');
  },
  setAimAngle(value,instant=false){
    this.targetAimAngle=clamp(value,-1,1);
    const center=(this.minRad+this.maxRad)/2;
    const half=(this.maxRad-this.minRad)/2;
    this.targetRad=center+this.targetAimAngle*half;
    this.angleDeg=this.targetAimAngle*18-10;
    const rod=UI.$('rod');
    if(rod)rod.style.setProperty('--rodrot',this.angleDeg+'deg');
    if(instant){
      this.currentAimAngle=this.targetAimAngle;
      this.currentRad=this.targetRad;
    }
  },
  setFacingRad(rad,instant=false){
    const center=(this.minRad+this.maxRad)/2;
    const half=(this.maxRad-this.minRad)/2;
    this.setAimAngle((clamp(rad,this.minRad,this.maxRad)-center)/half,instant);
  },
  rotate(deltaRad){this.setAimAngle(this.targetAimAngle+deltaRad*1.35)},
  facingRad(){
    const base=this.basePoint();
    const tip=this.getTip();
    return Math.atan2(tip.y-base.y,tip.x-base.x);
  },
  getAimAngle(){
    return this.targetAimAngle;
  },
  aimAt(x,y,instant=false){
    const w=this.lineCanvas.width||UI.$('wrap').clientWidth;
    const center=w*.5;
    const half=Math.max(90,w*.42);
    this.setAimAngle((x-center)/half,instant);
  },
  basePoint(){
    const w=this.lineCanvas.width||UI.$('wrap').clientWidth;
    const h=this.lineCanvas.height||UI.$('wrap').clientHeight;
    const cast=UI.$('castBtn')?.getBoundingClientRect?.();
    const wrap=UI.$('wrap')?.getBoundingClientRect?.();
    if(cast&&wrap&&cast.width>1&&cast.height>1){
      return {
        x:clamp(cast.left-wrap.left+cast.width*.82,48,w-34),
        y:clamp(cast.top-wrap.top+cast.height+24,h*.72,h+34)
      };
    }
    return {
      x:w*.66,
      y:h+24
    };
  },
  curvePoint(n){
    const THREE=this.THREE;
    const base=this.basePoint();
    const t=n/this.segmentCount;
    const len=this.segmentLength*this.segmentCount;
    const aim=this.rodReady?this.currentAimAngle:this.targetAimAngle;
    const bend=5+(game.tension??50)*1.35;
    const wobble=Math.sin(t*Math.PI*1.25)*3;
    const upright=-len*.86*t;
    const naturalLean=-len*.22*t;
    const sideSwing=aim*len*.30*Math.pow(t,1.28);
    const x=base.x+naturalLean+sideSwing+wobble;
    const y=base.y+upright+bend*t*t;
    return THREE?new THREE.Vector3(x,y,0):{x,y};
  },
  getTip(){
    const p=this.curvePoint(this.segmentCount);
    return {x:p.x,y:p.y};
  },
  updateRodMesh(){
    if(!this.rodReady)return;
    const THREE=this.THREE;
    const now=performance.now();
    const dt=this.lastAimTime?Math.min(.05,(now-this.lastAimTime)/1000):.016;
    this.lastAimTime=now;
    this.currentAimAngle+=(this.targetAimAngle-this.currentAimAngle)*(1-Math.exp(-dt/.22));
    this.currentRad+=(this.targetRad-this.currentRad)*(1-Math.exp(-dt/.22));
    for(let i=0;i<this.segmentCount;i++){
      const a=this.curvePoint(i);
      const b=this.curvePoint(i+1);
      const mid=a.clone().add(b).multiplyScalar(.5);
      const dir=b.clone().sub(a).normalize();
      const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
      const mesh=this.segments[i];
      mesh.position.copy(mid);
      mesh.quaternion.copy(quat);
      mesh.updateMatrix();
    }
    for(const guide of this.guides){
      const p=this.curvePoint(guide.index+guide.offset/this.segmentLength);
      const n=this.curvePoint(Math.min(this.segmentCount,guide.index+1+guide.offset/this.segmentLength));
      const dir=n.sub(p).normalize();
      const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
      guide.mesh.position.copy(p);
      guide.mesh.quaternion.copy(quat);
      guide.mesh.updateMatrix();
    }
    const base=this.basePoint();
    this.handle.position.set(base.x+16,base.y+8,0);
    this.handle.updateMatrix();
    this.renderer.render(this.scene,this.camera);
  },
  drawLine(){
    const c=this.ctx;
    c.clearRect(0,0,this.lineCanvas.width,this.lineCanvas.height);
    this.updateRodMesh();
    if(![GameState.WAIT,GameState.HIT,GameState.BATTLE].includes(game.state))return;
    const tip=this.getTip();
    const b=game.bob;
    const target=game.castTarget??{distanceRate:game.castDistanceRate/100,aimRate:this.getAimAngle()};
    const far=clamp(target.distanceRate??.5,0,1);
    const aim=clamp(target.aimRate??this.getAimAngle(),-1,1);
    const cx=(tip.x+b.x)/2+aim*18;
    const cy=(tip.y+b.y)/2+48-far*78;
    c.strokeStyle='rgba(235,250,255,.92)';
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
  pointerAngle(ev){const zone=UI.$('reelZone').getBoundingClientRect();return Math.atan2(ev.clientY-(zone.top+zone.height/2),ev.clientX-(zone.left+zone.width/2))},
  isReelHeld(){return this.lastPointerAngle!==null},
  startReel(ev){if(game.state!==GameState.BATTLE)return;ev.preventDefault();this.lastPointerAngle=this.pointerAngle(ev)},
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
      if(game.tension>=100){
        Game.finish(false,'テンション限界！ 糸が切れた！');
        return;
      }
      if(Math.random()<clockwise*.25)Effects.addRipple(game.bob.x,game.bob.y,true);
    }else if(d<0){
      UI.setTension(game.tension-1.0);
    }
  },
  endReel(){this.lastPointerAngle=null}
};
