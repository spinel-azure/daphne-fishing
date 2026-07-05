let THREE=null;
const THREE_URLS=[
  'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
  'https://unpkg.com/three@0.165.0/build/three.module.js'
];
const state={
  canvas:null,
  renderer:null,
  scene:null,
  camera:null,
  clock:null,
  uki:null,
  water:null,
  isBite:false,
  baseY:0,
  targetSink:0,
  currentSink:0,
  fallbackCtx:null,
  fallbackStart:0
};

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

function setLoadStatus(text,isError=false){
  const status=document.getElementById('loadStatus');
  if(!status)return;
  status.textContent=text;
  status.classList.toggle('is-error',isError);
}

function initUkiPrototype(){
  state.canvas=document.getElementById('ukiCanvas');
  if(!state.canvas)return;

  state.renderer=new THREE.WebGLRenderer({canvas:state.canvas,antialias:true,alpha:true});
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  state.renderer.setClearColor(0x06111f,0);

  state.scene=createScene();
  state.camera=createCamera();
  state.clock=new THREE.Clock();
  state.uki=createUki();
  state.scene.add(state.uki);

  state.water=createWater();
  state.scene.add(state.water);

  window.addEventListener('resize',resize);
  state.canvas.addEventListener('click',toggleBiteState);
  document.getElementById('toggleStateButton')?.addEventListener('click',toggleBiteState);

  resize();
  setBiteState(false);
  setLoadStatus('クリック/タップで通常状態とアタリ状態を切り替え');
  requestAnimationFrame(animate);
}

function initFallbackPrototype(reason){
  state.canvas=document.getElementById('ukiCanvas');
  if(!state.canvas)return;
  state.fallbackCtx=state.canvas.getContext('2d');
  state.fallbackStart=performance.now();
  window.addEventListener('resize',resizeFallback);
  state.canvas.addEventListener('click',toggleBiteState);
  document.getElementById('toggleStateButton')?.addEventListener('click',toggleBiteState);
  resizeFallback();
  setBiteState(false);
  setLoadStatus(`Three.js を読み込めないため2D代替表示中。file://直開きではCDN読み込みが止まる場合があります。${reason}`,true);
  requestAnimationFrame(animateFallback);
}

function createScene(){
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x06111f,6,18);

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
  const camera=new THREE.PerspectiveCamera(42,1,.1,100);
  camera.position.set(0,2.2,8.2);
  camera.lookAt(0,.2,0);
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

function createWater(){
  const geometry=new THREE.PlaneGeometry(12,12,24,24);
  const material=new THREE.MeshStandardMaterial({
    color:0x123f5f,
    roughness:.2,
    metalness:.05,
    transparent:true,
    opacity:.76
  });
  const water=new THREE.Mesh(geometry,material);
  water.rotation.x=-Math.PI/2;
  water.position.y=-.72;
  return water;
}

function setBiteState(isBite){
  state.isBite=!!isBite;
  state.targetSink=state.isBite ? .52 : 0;
  const label=document.getElementById('stateLabel');
  if(label)label.textContent=state.isBite?'アタリ状態':'通常状態';
}

function toggleBiteState(){
  setBiteState(!state.isBite);
}

function resize(){
  if(!state.renderer||!state.camera||!state.canvas)return;
  const rect=state.canvas.getBoundingClientRect();
  const width=Math.max(1,Math.floor(rect.width));
  const height=Math.max(1,Math.floor(rect.height));
  state.renderer.setSize(width,height,false);
  state.camera.aspect=width/height;
  state.camera.updateProjectionMatrix();
}

function resizeFallback(){
  if(!state.canvas)return;
  const rect=state.canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  state.canvas.width=Math.max(1,Math.floor(rect.width*dpr));
  state.canvas.height=Math.max(1,Math.floor(rect.height*dpr));
}

function update(dt,elapsed){
  if(!state.uki||!state.water)return;

  state.currentSink+=((state.targetSink||0)-state.currentSink)*Math.min(1,dt*5);
  const bobAmp=state.isBite?.055:.16;
  const bobSpeed=state.isBite?7.4:2.2;
  const shake=state.isBite?Math.sin(elapsed*18)*.035:0;

  state.uki.position.y=state.baseY-state.currentSink+Math.sin(elapsed*bobSpeed)*bobAmp+shake;
  state.uki.rotation.x=Math.sin(elapsed*1.4)*.055+(state.isBite?Math.sin(elapsed*12)*.025:0);
  state.uki.rotation.z=-.12+Math.sin(elapsed*1.8)*.04+(state.isBite?Math.sin(elapsed*15)*.03:0);

  state.water.position.y=-.72+Math.sin(elapsed*1.35)*.025;
  state.water.rotation.z=Math.sin(elapsed*.28)*.018;
}

function animate(){
  const dt=Math.min(.05,state.clock.getDelta());
  const elapsed=state.clock.elapsedTime;
  update(dt,elapsed);
  state.renderer.render(state.scene,state.camera);
  requestAnimationFrame(animate);
}

function animateFallback(now){
  drawFallback((now-state.fallbackStart)/1000);
  requestAnimationFrame(animateFallback);
}

function drawFallback(elapsed){
  const ctx=state.fallbackCtx;
  const canvas=state.canvas;
  if(!ctx||!canvas)return;

  const w=canvas.width;
  const h=canvas.height;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  state.currentSink+=((state.targetSink||0)-state.currentSink)*.08;
  const bobAmp=(state.isBite?4:14)*dpr;
  const shake=state.isBite?Math.sin(elapsed*18)*3*dpr:0;
  const cx=w*.52;
  const cy=h*.48-state.currentSink*42*dpr+Math.sin(elapsed*(state.isBite?7.4:2.2))*bobAmp+shake;
  const scale=Math.min(w,h)/520;

  ctx.clearRect(0,0,w,h);

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(-.12+Math.sin(elapsed*1.8)*.04);
  ctx.scale(scale,scale);
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

  ctx.strokeStyle='rgba(145,216,255,.42)';
  ctx.lineWidth=2*dpr;
  for(let i=0;i<4;i++){
    const x=w*(.35+i*.1)+Math.sin(elapsed+i)*12*dpr;
    const y=h*.62+Math.cos(elapsed*1.3+i)*9*dpr;
    ctx.beginPath();
    ctx.ellipse(x,y,34*dpr,8*dpr,0,0,Math.PI*2);
    ctx.stroke();
  }
}

function drawPolyPart(ctx,color,points){
  ctx.beginPath();
  points.forEach(([x,y],i)=>{
    if(i===0)ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle=color;
  ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.18)';
  ctx.lineWidth=2;
  ctx.stroke();
}

async function boot(){
  try{
    setLoadStatus('Three.js 読み込み中...');
    THREE=await loadThree();
    initUkiPrototype();
  }catch(err){
    console.error(err);
    initFallbackPrototype(err.message);
  }
}

boot();

export {initUkiPrototype,update,setBiteState,toggleBiteState};
