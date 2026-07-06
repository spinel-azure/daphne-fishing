let THREE=null;
const THREE_URLS=[
  'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
  'https://unpkg.com/three@0.165.0/build/three.module.js'
];

const state={
  panel:null,
  waterRoot:null,
  waterTiles:[],
  waterWidth:1,
  waterOffset:0,
  treeCanvas:null,
  treeCtx:null,
  treeImage:null,
  treeLeafCanvas:null,
  treeReady:false,
  rodCanvas:null,
  rodRenderer:null,
  rodScene:null,
  rodCamera:null,
  rodRoot:null,
  rodSegments:[],
  rodGuides:[],
  rodHandle:null,
  rodReady:false,
  rodRenderScale:.5,
  segmentCount:14,
  segmentLength:32,
  currentAimAngle:0,
  targetAimAngle:0,
  lastAimTime:0,
  aimHold:0,
  lineCanvas:null,
  lineCtx:null,
  ukiCanvas:null,
  ukiStage:null,
  renderer:null,
  scene:null,
  camera:null,
  clock:null,
  uki:null,
  fallbackCtx:null,
  fallbackStart:0,
  aimPercent:50,
  distancePercent:62,
  scalePercent:42,
  isBite:false,
  showReel:false,
  currentSink:0,
  targetSink:0,
  reelAngle:0,
  size:{width:1,height:1,dpr:1},
  bob:{x:260,y:330}
};

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

async function loadThree(){
  const errors=[];
  for(const url of THREE_URLS){
    try{
      return await withTimeout(import(url),6500,`timeout: ${url}`);
    }catch(err){
      errors.push(`${url}: ${err.message}`);
    }
  }
  throw new Error(errors.join(' / '));
}

function withTimeout(promise,ms,message){
  return Promise.race([
    promise,
    new Promise((_,reject)=>window.setTimeout(()=>reject(new Error(message)),ms))
  ]);
}

function init(){
  state.panel=document.getElementById('viewerPanel');
  state.waterRoot=document.getElementById('waterSurface');
  state.waterTiles=state.waterRoot?[...state.waterRoot.querySelectorAll('.waterSurfaceTile')]:[];
  state.treeCanvas=document.getElementById('treeWindCanvas');
  state.treeCtx=state.treeCanvas?.getContext('2d');
  state.rodCanvas=document.getElementById('rodCanvas');
  state.lineCanvas=document.getElementById('lineCanvas');
  state.lineCtx=state.lineCanvas?.getContext('2d');
  state.ukiCanvas=document.getElementById('ukiCanvas');
  state.ukiStage=document.getElementById('ukiStage');
  initControls();
  initTreeWind();
  window.addEventListener('resize',resize);
  resize();
  bootUki();
}

function initTreeWind(){
  if(!state.treeCanvas||!state.treeCtx)return;
  state.treeCtx.imageSmoothingEnabled=false;
  state.treeImage=new Image();
  state.treeImage.src='../../images/bg.png';
  state.treeImage.onload=()=>{
    buildLeafMask();
    state.treeReady=true;
    resize();
  };
}

function buildLeafMask(){
  const img=state.treeImage;
  if(!img)return;
  const src=document.createElement('canvas');
  src.width=img.naturalWidth;
  src.height=img.naturalHeight;
  const ctx=src.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img,0,0);
  const data=ctx.getImageData(0,0,src.width,src.height);
  const pixels=data.data;
  const maxLeafY=src.height*.42;

  for(let y=0;y<src.height;y++){
    for(let x=0;x<src.width;x++){
      const i=(y*src.width+x)*4;
      const r=pixels[i];
      const g=pixels[i+1];
      const b=pixels[i+2];
      const a=pixels[i+3];
      const greenLeaf=y<maxLeafY&&a>180&&g>55&&g>r*1.08&&g>b*1.08&&r<100&&b<100;
      if(!greenLeaf)pixels[i+3]=0;
    }
  }

  ctx.putImageData(data,0,0);
  state.treeLeafCanvas=src;
}

function initControls(){
  bindSlider('aimSlider','aimValue',(value)=>{
    state.aimPercent=value;
    state.targetAimAngle=getAimAngle();
  });
  bindSlider('distanceSlider','distanceValue',(value)=>{state.distancePercent=value;});
  bindSlider('scaleSlider','scaleValue',(value)=>{state.scalePercent=value;applyUkiScale();});
  document.getElementById('modeButton')?.addEventListener('click',toggleMode);
  document.getElementById('biteButton')?.addEventListener('click',toggleBite);
  bindAimButton('aimLeftButton',-1);
  bindAimButton('aimRightButton',1);
  syncControls();
}

function bindSlider(sliderId,valueId,apply){
  const slider=document.getElementById(sliderId);
  if(!slider)return;
  slider.addEventListener('input',()=>{
    const value=Number(slider.value);
    apply(value);
    const label=document.getElementById(valueId);
    if(label)label.textContent=`${value}%`;
    updateLayout();
  });
}

function bindAimButton(id,direction){
  const button=document.getElementById(id);
  if(!button)return;
  const start=(event)=>{
    event.preventDefault();
    state.aimHold=direction;
    button.classList.add('is-held');
    nudgeAim(direction*5);
  };
  const stop=()=>{
    if(state.aimHold===direction)state.aimHold=0;
    button.classList.remove('is-held');
  };
  button.addEventListener('pointerdown',start);
  button.addEventListener('pointerup',stop);
  button.addEventListener('pointercancel',stop);
  button.addEventListener('pointerleave',stop);
  button.addEventListener('click',(event)=>event.preventDefault());
}

function nudgeAim(delta){
  setAimPercent(state.aimPercent+delta);
}

function syncControls(){
  state.aimPercent=Number(document.getElementById('aimSlider')?.value||50);
  state.currentAimAngle=getAimAngle();
  state.targetAimAngle=getAimAngle();
  state.distancePercent=Number(document.getElementById('distanceSlider')?.value||62);
  state.scalePercent=Number(document.getElementById('scaleSlider')?.value||42);
  setBiteState(false);
  setMode(false);
  updateLayout();
}

async function bootUki(){
  try{
    if(location.protocol==='file:'){
      initFallbackUki('ローカル直開きのため2D代替表示中。GitHub PagesではThree.js表示になります。');
      return;
    }
    setLoadStatus('Three.js 読み込み中...');
    THREE=await loadThree();
    initThreeRod();
    initThreeUki();
  }catch(err){
    console.error(err);
    initFallbackUki(`Three.js を読み込めないため2D代替表示中。${err.message}`);
  }
}

function setLoadStatus(text,isError=false){
  const status=document.getElementById('loadStatus');
  if(!status)return;
  status.textContent=text;
  status.classList.toggle('is-error',isError);
}

function initThreeUki(){
  if(!state.ukiCanvas)return;
  state.renderer=new THREE.WebGLRenderer({canvas:state.ukiCanvas,antialias:true,alpha:true});
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  state.renderer.setClearColor(0x06111f,0);
  state.scene=createScene();
  state.camera=createCamera();
  state.clock=new THREE.Clock();
  state.uki=createUki();
  state.scene.add(state.uki);
  resizeUkiRenderer();
  applyUkiScale();
  setLoadStatus('竿角度・投げ先・ウキサイズを調整できます');
  requestAnimationFrame(animateThree);
}

function initThreeRod(){
  if(!state.rodCanvas||!THREE)return;
  state.rodScene=new THREE.Scene();
  state.rodCamera=new THREE.OrthographicCamera(0,1,1,0,-1000,1000);
  state.rodRenderer=new THREE.WebGLRenderer({
    canvas:state.rodCanvas,
    alpha:true,
    antialias:false,
    powerPreference:'high-performance'
  });
  state.rodRenderer.setPixelRatio(1);
  state.rodRenderer.outputColorSpace=THREE.SRGBColorSpace;
  state.rodScene.add(new THREE.AmbientLight(0x6d7280,1.75));
  const key=new THREE.DirectionalLight(0xffdf9c,2.1);
  key.position.set(-2,3,6);
  state.rodScene.add(key);
  const fill=new THREE.DirectionalLight(0x4b8fcf,.75);
  fill.position.set(3,1,4);
  state.rodScene.add(fill);
  state.rodRoot=new THREE.Group();
  state.rodScene.add(state.rodRoot);
  buildRod();
  state.rodReady=true;
  resizeRodRenderer();
  updateLayout();
}

function buildRod(){
  if(!THREE||!state.rodRoot)return;
  state.rodSegments=[];
  state.rodGuides=[];
  const rodMat=new THREE.MeshLambertMaterial({color:0xf4f2e8,flatShading:true});
  const wrapMat=new THREE.MeshLambertMaterial({color:0xdff8ff,flatShading:true});
  const handleMat=new THREE.MeshLambertMaterial({color:0x392617,flatShading:true});

  for(let i=0;i<state.segmentCount;i++){
    const t=i/(state.segmentCount-1);
    const radius=THREE.MathUtils.lerp(6.5,2.4,t);
    const geo=new THREE.CylinderGeometry(radius*.75,radius,state.segmentLength,6,1,false);
    geo.rotateZ(Math.PI/2);
    const mesh=new THREE.Mesh(geo,rodMat);
    mesh.matrixAutoUpdate=false;
    state.rodRoot.add(mesh);
    state.rodSegments.push(mesh);
    if(i%3===1||i===state.segmentCount-1){
      const guide=new THREE.Mesh(new THREE.TorusGeometry(radius*1.35,radius*.16,4,6),wrapMat);
      guide.rotation.y=Math.PI/2;
      guide.matrixAutoUpdate=false;
      state.rodRoot.add(guide);
      state.rodGuides.push({mesh:guide,index:i,offset:state.segmentLength*.38});
    }
  }

  state.rodHandle=new THREE.Mesh(new THREE.CylinderGeometry(9,12,46,6,1,false),handleMat);
  state.rodHandle.rotation.z=Math.PI/2;
  state.rodHandle.matrixAutoUpdate=false;
  state.rodRoot.add(state.rodHandle);
}

function initFallbackUki(message){
  state.fallbackCtx=state.ukiCanvas?.getContext('2d');
  state.fallbackStart=performance.now();
  resizeFallbackUki();
  setLoadStatus(message,true);
  requestAnimationFrame(animateFallback);
}

function createScene(){
  const scene=new THREE.Scene();
  const ambient=new THREE.HemisphereLight(0xcfefff,0x102438,1.8);
  scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffffff,2.4);
  key.position.set(3,5,4);
  scene.add(key);
  const rim=new THREE.DirectionalLight(0x66ccff,1.2);
  rim.position.set(-4,2,-3);
  scene.add(rim);
  return scene;
}

function createCamera(){
  const camera=new THREE.PerspectiveCamera(38,1,.1,100);
  camera.position.set(0,1.7,7);
  camera.lookAt(0,.08,0);
  return camera;
}

function createUki(){
  const group=new THREE.Group();
  group.rotation.z=-0.12;
  const red=new THREE.MeshStandardMaterial({color:0xd7272e,roughness:.48,metalness:.02});
  const white=new THREE.MeshStandardMaterial({color:0xf6f0df,roughness:.42,metalness:.02});
  const black=new THREE.MeshStandardMaterial({color:0x1b1b20,roughness:.58});
  const tipMat=new THREE.MeshStandardMaterial({color:0xffe06a,roughness:.35,emissive:0x2a1a00});

  const top=new THREE.Mesh(new THREE.CylinderGeometry(.2,.42,1.04,18,1),red);
  top.position.y=.82;
  group.add(top);
  const middle=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.9,18,1),white);
  middle.position.y=.02;
  group.add(middle);
  const bottom=new THREE.Mesh(new THREE.CylinderGeometry(.38,.16,.92,18,1),red);
  bottom.position.y=-.82;
  group.add(bottom);
  const bandA=new THREE.Mesh(new THREE.CylinderGeometry(.446,.446,.06,18,1),black);
  bandA.position.y=.46;
  group.add(bandA);
  const bandB=new THREE.Mesh(new THREE.CylinderGeometry(.404,.404,.06,18,1),black);
  bandB.position.y=-.44;
  group.add(bandB);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.1,.42,16),tipMat);
  tip.position.y=1.55;
  group.add(tip);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.9,10),black);
  stem.position.y=-1.48;
  group.add(stem);
  return group;
}

function resize(){
  if(!state.panel||!state.lineCanvas)return;
  const rect=state.panel.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  state.size={width:rect.width,height:rect.height,dpr};
  state.lineCanvas.width=Math.max(1,Math.floor(rect.width*dpr));
  state.lineCanvas.height=Math.max(1,Math.floor(rect.height*dpr));
  resizeWater(rect.width,rect.height);
  resizeTreeWind(rect.width,rect.height);
  resizeRodRenderer();
  resizeUkiRenderer();
  resizeFallbackUki();
  updateLayout();
}

function resizeWater(width,height){
  if(!state.waterRoot)return;
  state.waterWidth=Math.max(1,Math.ceil(width));
  state.waterRoot.style.height=`${Math.ceil(height)}px`;
  state.waterTiles.forEach((tile)=>{
    tile.style.width=`${state.waterWidth+2}px`;
    tile.style.height=`${Math.ceil(height)}px`;
  });
  drawWater();
}

function resizeTreeWind(width,height){
  if(!state.treeCanvas)return;
  const w=Math.max(1,Math.floor(width));
  const h=Math.max(1,Math.floor(height));
  state.treeCanvas.width=w;
  state.treeCanvas.height=h;
  state.treeCanvas.style.width=`${w}px`;
  state.treeCanvas.style.height=`${h}px`;
  if(state.treeCtx)state.treeCtx.imageSmoothingEnabled=false;
}

function updateWater(dt){
  if(!state.waterTiles.length)return;
  state.waterOffset=(state.waterOffset+8*dt)%(state.waterWidth*2);
  drawWater();
}

function drawWater(){
  if(!state.waterTiles.length)return;
  const x=-Math.round(state.waterOffset);
  state.waterTiles.forEach((tile,index)=>{
    const mirror=tile.classList.contains('is-mirror');
    const tx=x+state.waterWidth*(mirror?index+1:index)+(mirror?2:0);
    tile.style.transform=`translate3d(${tx}px,0,0)${mirror?' scaleX(-1)':''}`;
  });
}

function updateTreeWind(now){
  if(!state.treeReady||!state.treeCtx||!state.treeLeafCanvas)return;
  const ctx=state.treeCtx;
  const img=state.treeLeafCanvas;
  const w=state.treeCanvas.width;
  const h=state.treeCanvas.height;
  const sourceW=img.width;
  const sourceH=img.height;
  const scale=Math.max(w/sourceW,h/sourceH);
  const drawW=sourceW*scale;
  const drawH=sourceH*scale;
  const dx=(w-drawW)/2;
  const dy=(h-drawH)/2;
  const t=now/1000*.9;
  const sliceH=2;
  const startY=Math.floor(h*.12);
  const endY=Math.floor(h*.45);

  ctx.clearRect(0,0,w,h);
  ctx.imageSmoothingEnabled=false;
  for(let y=startY;y<endY;y+=sliceH){
    const sy=(y-dy)/scale;
    if(sy<0||sy>=sourceH)continue;
    const sh=Math.min(sliceH/scale,sourceH-sy);
    const sway=Math.round(Math.sin(t+y*.045)*2.2+Math.sin(t*1.7+y*.022)*.8);
    ctx.drawImage(img,0,sy,sourceW,sh,dx+sway,y,drawW,sliceH);
  }
}

function resizeRodRenderer(){
  if(!state.rodCanvas)return;
  const {width,height}=state.size;
  const renderWidth=Math.max(1,Math.floor(width*state.rodRenderScale));
  const renderHeight=Math.max(1,Math.floor(height*state.rodRenderScale));
  state.rodCanvas.width=renderWidth;
  state.rodCanvas.height=renderHeight;
  state.rodCanvas.style.width=`${width}px`;
  state.rodCanvas.style.height=`${height}px`;
  if(!state.rodReady||!state.rodRenderer||!state.rodCamera)return;
  state.rodRenderer.setSize(renderWidth,renderHeight,false);
  state.rodCamera.left=0;
  state.rodCamera.right=width;
  state.rodCamera.top=0;
  state.rodCamera.bottom=height;
  state.rodCamera.updateProjectionMatrix();
  updateRodMesh(true);
}

function resizeUkiRenderer(){
  if(!state.renderer||!state.camera||!state.ukiCanvas)return;
  const rect=state.ukiCanvas.getBoundingClientRect();
  const width=Math.max(1,Math.floor(rect.width));
  const height=Math.max(1,Math.floor(rect.height));
  state.renderer.setSize(width,height,false);
  state.camera.aspect=width/height;
  state.camera.updateProjectionMatrix();
}

function resizeFallbackUki(){
  if(!state.fallbackCtx||!state.ukiCanvas)return;
  const rect=state.ukiCanvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  state.ukiCanvas.width=Math.max(1,Math.floor(rect.width*dpr));
  state.ukiCanvas.height=Math.max(1,Math.floor(rect.height*dpr));
}

function updateLayout(){
  const point=castPoint();
  state.bob=point;
  if(state.ukiStage){
    state.ukiStage.style.left=`${point.x}px`;
    state.ukiStage.style.top=`${point.y}px`;
  }
  updateRodMesh(true);
  drawLine();
}

function playBounds(){
  const {width,height}=state.size;
  const action=document.getElementById(state.showReel?'reelZone':'castButton')?.getBoundingClientRect();
  const panel=state.panel?.getBoundingClientRect();
  const actionTop=action&&panel?action.top-panel.top:height-190;
  return {
    left:28,
    right:width-28,
    top:height*.34,
    bottom:Math.max(height*.35,actionTop-26)
  };
}

function castPoint(){
  const bounds=playBounds();
  const aim=getAimAngle();
  const distance=clamp(state.distancePercent/100,0,1);
  const sidePad=.08;
  const castX=clamp((aim+1)/2,sidePad,1-sidePad);
  const castY=clamp(1-distance,.04,.96);
  return {
    x:bounds.left+(bounds.right-bounds.left)*castX,
    y:bounds.top+(bounds.bottom-bounds.top)*castY
  };
}

function getAimAngle(){
  return (clamp(state.aimPercent,0,100)-50)/50;
}

function setAimPercent(value){
  state.aimPercent=clamp(value,0,100);
  state.targetAimAngle=getAimAngle();
  const slider=document.getElementById('aimSlider');
  const label=document.getElementById('aimValue');
  if(slider)slider.value=String(Math.round(state.aimPercent));
  if(label)label.textContent=`${Math.round(state.aimPercent)}%`;
  updateLayout();
}

function basePoint(){
  const {width,height}=state.size;
  const action=document.getElementById(state.showReel?'reelZone':'castButton')?.getBoundingClientRect();
  const panel=state.panel?.getBoundingClientRect();
  if(action&&panel&&action.width>1&&action.height>1){
    return {
      x:clamp(action.left-panel.left+action.width*.82,48,width-34),
      y:clamp(action.top-panel.top+action.height+24,height*.72,height+34)
    };
  }
  return {x:width*.66,y:height+24};
}

function curvePoint(n){
  const segmentCount=state.segmentCount;
  const segmentLength=state.segmentLength;
  const base=basePoint();
  const t=n/segmentCount;
  const len=segmentLength*segmentCount;
  const aim=state.rodReady?state.currentAimAngle:state.targetAimAngle;
  const bend=5+50*1.35;
  const wobble=Math.sin(t*Math.PI*1.25)*3;
  const upright=-len*.86*t;
  const naturalLean=-len*.22*t;
  const sideSwing=aim*len*.30*Math.pow(t,1.28);
  return {
    x:base.x+naturalLean+sideSwing+wobble,
    y:base.y+upright+bend*t*t
  };
}

function getTip(){
  return curvePoint(state.segmentCount);
}

function updateRodMesh(force=false){
  if(!state.rodReady||!THREE||!state.rodRenderer||!state.rodScene||!state.rodCamera)return;
  const now=performance.now();
  const dt=state.lastAimTime?Math.min(.05,(now-state.lastAimTime)/1000):.016;
  state.lastAimTime=now;
  const ease=force?1:(1-Math.exp(-dt/.22));
  state.currentAimAngle+=(state.targetAimAngle-state.currentAimAngle)*ease;

  for(let i=0;i<state.segmentCount;i++){
    const a=vectorFromPoint(curvePoint(i));
    const b=vectorFromPoint(curvePoint(i+1));
    const mid=a.clone().add(b).multiplyScalar(.5);
    const dir=b.clone().sub(a).normalize();
    const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
    const mesh=state.rodSegments[i];
    mesh.position.copy(mid);
    mesh.quaternion.copy(quat);
    mesh.updateMatrix();
  }

  for(const guide of state.rodGuides){
    const p=vectorFromPoint(curvePoint(guide.index+guide.offset/state.segmentLength));
    const n=vectorFromPoint(curvePoint(Math.min(state.segmentCount,guide.index+1+guide.offset/state.segmentLength)));
    const dir=n.sub(p).normalize();
    const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
    guide.mesh.position.copy(p);
    guide.mesh.quaternion.copy(quat);
    guide.mesh.updateMatrix();
  }

  const base=basePoint();
  if(state.rodHandle){
    state.rodHandle.position.set(base.x+16,base.y+8,0);
    state.rodHandle.updateMatrix();
  }
  state.rodRenderer.render(state.rodScene,state.rodCamera);
}

function vectorFromPoint(point){
  return new THREE.Vector3(point.x,point.y,0);
}

function drawLine(){
  const ctx=state.lineCtx;
  if(!ctx)return;
  updateRodMesh();
  const {width,height,dpr}=state.size;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  const tip=getTip();
  const bob=state.bob;
  const aim=getAimAngle();
  const far=clamp(state.distancePercent/100,0,1);
  const cx=(tip.x+bob.x)/2+aim*18;
  const cy=(tip.y+bob.y)/2+48-far*78;
  ctx.strokeStyle='rgba(235,250,255,.92)';
  ctx.lineWidth=2;
  ctx.shadowColor='rgba(80,170,255,.55)';
  ctx.shadowBlur=3;
  ctx.beginPath();
  ctx.moveTo(tip.x,tip.y);
  ctx.quadraticCurveTo(cx,cy,bob.x,bob.y);
  ctx.stroke();
  ctx.shadowBlur=0;
  if(state.showReel){
    ctx.strokeStyle='rgba(190,230,255,.55)';
    ctx.beginPath();
    ctx.moveTo(bob.x,bob.y);
    ctx.lineTo(bob.x,bob.y+55);
    ctx.stroke();
  }
}

function setBiteState(isBite){
  state.isBite=!!isBite;
  state.targetSink=state.isBite ? .42 : 0;
  const label=document.getElementById('stateLabel');
  if(label)label.textContent=state.isBite?'アタリ状態':'通常状態';
}

function toggleBite(){
  setBiteState(!state.isBite);
}

function setMode(showReel){
  state.showReel=!!showReel;
  const cast=document.getElementById('castButton');
  const reel=document.getElementById('reelZone');
  const mode=document.getElementById('modeButton');
  if(cast)cast.style.display=state.showReel?'none':'flex';
  if(reel)reel.style.display=state.showReel?'flex':'none';
  if(mode)mode.textContent=state.showReel?'キャスト表示':'リール表示';
  updateLayout();
}

function toggleMode(){
  setMode(!state.showReel);
}

function updateReel(dt){
  if(!state.showReel)return;
  state.reelAngle+=dt*2.2;
  const handle=document.getElementById('handleImg');
  const zone=document.getElementById('reelZone')?.getBoundingClientRect();
  if(!handle||!zone)return;
  const center=zone.width/2;
  const r=zone.width*.32;
  const x=center+Math.cos(state.reelAngle)*r;
  const y=center+Math.sin(state.reelAngle)*r;
  handle.style.left=`${x}px`;
  handle.style.top=`${y}px`;
  handle.style.transform=`translate(-50%,-50%) rotate(${state.reelAngle+Math.PI/2}rad)`;
}

function updateAimHold(dt){
  if(!state.aimHold)return;
  setAimPercent(state.aimPercent+state.aimHold*dt*44);
}

function applyUkiScale(){
  const scale=state.scalePercent/100;
  if(state.uki){
    state.uki.scale.set(scale*getMobileWidthBoost(),scale,scale);
  }
}

function getMobileWidthBoost(){
  return state.size.width<430 ? 1.28 : 1;
}

function updateUkiMotion(dt,elapsed){
  state.currentSink+=(state.targetSink-state.currentSink)*Math.min(1,dt*5);
  if(state.uki){
    const bobAmp=state.isBite ? .04 : .11;
    const bobSpeed=state.isBite?7.4:2.2;
    const shake=state.isBite?Math.sin(elapsed*18)*.026:0;
    state.uki.position.y=-state.currentSink+Math.sin(elapsed*bobSpeed)*bobAmp+shake;
    state.uki.rotation.x=Math.sin(elapsed*1.4)*.045+(state.isBite?Math.sin(elapsed*12)*.02:0);
    state.uki.rotation.z=-.12+Math.sin(elapsed*1.8)*.035+(state.isBite?Math.sin(elapsed*15)*.025:0);
  }
}

function animateThree(){
  const dt=Math.min(.05,state.clock.getDelta());
  const elapsed=state.clock.elapsedTime;
  updateWater(dt);
  updateTreeWind(performance.now());
  updateAimHold(dt);
  updateRodMesh();
  drawLine();
  updateUkiMotion(dt,elapsed);
  updateReel(dt);
  state.renderer.render(state.scene,state.camera);
  requestAnimationFrame(animateThree);
}

function animateFallback(now){
  const elapsed=(now-state.fallbackStart)/1000;
  updateWater(.016);
  updateTreeWind(now);
  updateAimHold(.016);
  updateRodMesh();
  drawLine();
  updateReel(.016);
  drawFallbackUki(elapsed);
  requestAnimationFrame(animateFallback);
}

function drawFallbackUki(elapsed){
  const ctx=state.fallbackCtx;
  const canvas=state.ukiCanvas;
  if(!ctx||!canvas)return;
  const w=canvas.width;
  const h=canvas.height;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  state.currentSink+=(state.targetSink-state.currentSink)*.08;
  const bobAmp=(state.isBite?3:8)*dpr;
  const shake=state.isBite?Math.sin(elapsed*18)*2*dpr:0;
  const scale=Math.min(w,h)/520*(state.scalePercent/42);
  const widthBoost=getMobileWidthBoost();
  ctx.clearRect(0,0,w,h);
  ctx.save();
  ctx.translate(w*.5,h*.5-state.currentSink*36*dpr+Math.sin(elapsed*(state.isBite?7.4:2.2))*bobAmp+shake);
  ctx.rotate(-.12+Math.sin(elapsed*1.8)*.04);
  ctx.scale(scale*widthBoost,scale);
  ctx.shadowColor='rgba(0,0,0,.65)';
  ctx.shadowBlur=18;
  ctx.shadowOffsetY=8;
  drawPolyPart(ctx,'#d7272e',[[-28,-132],[28,-132],[48,-58],[-48,-58]]);
  drawPolyPart(ctx,'#f6f0df',[[-48,-58],[48,-58],[48,34],[-48,34]]);
  drawPolyPart(ctx,'#d7272e',[[-48,34],[48,34],[18,122],[-18,122]]);
  drawPolyPart(ctx,'#1b1b20',[[-52,-64],[52,-64],[52,-52],[-52,-52]]);
  drawPolyPart(ctx,'#1b1b20',[[-48,28],[48,28],[48,40],[-48,40]]);
  drawPolyPart(ctx,'#ffe06a',[[-9,-166],[9,-166],[0,-132]]);
  drawPolyPart(ctx,'#101015',[[-5,122],[5,122],[5,188],[-5,188]]);
  ctx.restore();
}

function drawPolyPart(ctx,color,points){
  ctx.beginPath();
  points.forEach(([x,y],index)=>{
    if(index===0)ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle=color;
  ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.18)';
  ctx.lineWidth=2;
  ctx.stroke();
}

init();

export {init,updateLayout,setBiteState,setMode};
