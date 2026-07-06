let THREE=null;
const THREE_URLS=[
  'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
  'https://unpkg.com/three@0.165.0/build/three.module.js'
];

const state={
  panel:null,
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
  state.lineCanvas=document.getElementById('lineCanvas');
  state.lineCtx=state.lineCanvas?.getContext('2d');
  state.ukiCanvas=document.getElementById('ukiCanvas');
  state.ukiStage=document.getElementById('ukiStage');
  initControls();
  window.addEventListener('resize',resize);
  resize();
  bootUki();
}

function initControls(){
  bindSlider('aimSlider','aimValue',(value)=>{state.aimPercent=value;});
  bindSlider('distanceSlider','distanceValue',(value)=>{state.distancePercent=value;});
  bindSlider('scaleSlider','scaleValue',(value)=>{state.scalePercent=value;applyUkiScale();});
  document.getElementById('modeButton')?.addEventListener('click',toggleMode);
  document.getElementById('biteButton')?.addEventListener('click',toggleBite);
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

function syncControls(){
  state.aimPercent=Number(document.getElementById('aimSlider')?.value||50);
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
  resizeUkiRenderer();
  resizeFallbackUki();
  updateLayout();
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
  const rod=document.getElementById('rodImage');
  if(rod)rod.style.setProperty('--rodrot',`${getAimAngle()*18-10}deg`);
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
  const segmentCount=14;
  const segmentLength=32;
  const base=basePoint();
  const t=n/segmentCount;
  const len=segmentLength*segmentCount;
  const aim=getAimAngle();
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
  return curvePoint(14);
}

function drawLine(){
  const ctx=state.lineCtx;
  if(!ctx)return;
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
  updateUkiMotion(dt,elapsed);
  updateReel(dt);
  state.renderer.render(state.scene,state.camera);
  requestAnimationFrame(animateThree);
}

function animateFallback(now){
  const elapsed=(now-state.fallbackStart)/1000;
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
