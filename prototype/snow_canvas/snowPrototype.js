const state={
  canvas:null,
  ctx:null,
  width:0,
  height:0,
  dpr:1,
  flakes:[],
  speedPercent:100,
  amountPercent:100,
  lastTime:0
};

function initSnowPrototype(){
  state.canvas=document.getElementById('snowCanvas');
  if(!state.canvas)return;
  state.ctx=state.canvas.getContext('2d');
  window.addEventListener('resize',resizeCanvas);
  initControls();
  resizeCanvas();
  resetFlakes();
  requestAnimationFrame(animate);
}

function initControls(){
  const speedSlider=document.getElementById('speedSlider');
  const amountSlider=document.getElementById('amountSlider');
  if(speedSlider){
    speedSlider.addEventListener('input',syncControls);
  }
  if(amountSlider){
    amountSlider.addEventListener('input',syncControls);
  }
  document.querySelectorAll('[data-control][data-preset]').forEach((button)=>{
    button.addEventListener('click',()=>{
      setPreset(button.dataset.control,Number(button.dataset.preset));
    });
  });
  syncControls();
}

function setPreset(control,percent){
  const slider=document.getElementById(control==='speed'?'speedSlider':'amountSlider');
  if(!slider)return;
  const min=Number(slider.min)||0;
  const max=Number(slider.max)||200;
  slider.value=String(Math.max(min,Math.min(max,Math.round(percent))));
  syncControls();
}

function syncControls(){
  const speedSlider=document.getElementById('speedSlider');
  const amountSlider=document.getElementById('amountSlider');
  state.speedPercent=Number(speedSlider?.value||100);
  state.amountPercent=Number(amountSlider?.value||100);
  updateValueLabel('speedValue',state.speedPercent);
  updateValueLabel('amountValue',state.amountPercent);
  updatePresetState('speed',state.speedPercent);
  updatePresetState('amount',state.amountPercent);
  reconcileFlakeCount();
}

function updateValueLabel(id,percent){
  const value=document.getElementById(id);
  if(value)value.textContent=`${percent}%`;
}

function updatePresetState(control,percent){
  document.querySelectorAll(`[data-control="${control}"][data-preset]`).forEach((button)=>{
    button.classList.toggle('is-active',Number(button.dataset.preset)===percent);
  });
}

function resizeCanvas(){
  if(!state.canvas)return;
  const rect=state.canvas.getBoundingClientRect();
  state.dpr=Math.min(window.devicePixelRatio||1,2);
  state.width=Math.max(1,Math.floor(rect.width*state.dpr));
  state.height=Math.max(1,Math.floor(rect.height*state.dpr));
  state.canvas.width=state.width;
  state.canvas.height=state.height;
  reconcileFlakeCount();
}

function resetFlakes(){
  state.flakes=[];
  reconcileFlakeCount(true);
}

function reconcileFlakeCount(fillScreen=false){
  if(!state.width||!state.height)return;
  const target=getTargetFlakeCount();
  while(state.flakes.length<target){
    state.flakes.push(createFlake(fillScreen));
  }
  if(state.flakes.length>target){
    state.flakes.length=target;
  }
}

function getTargetFlakeCount(){
  const base=Math.round((state.width/state.dpr)*(state.height/state.dpr)/3600);
  return Math.max(0,Math.round(base*state.amountPercent/100));
}

function createFlake(anywhere=false){
  const dpr=state.dpr||1;
  const radius=(Math.random()*1.9+.7)*dpr;
  return {
    x:Math.random()*state.width,
    y:anywhere?Math.random()*state.height:-radius*4,
    radius,
    drift:(Math.random()*28-14)*dpr,
    speed:(Math.random()*34+24)*dpr,
    phase:Math.random()*Math.PI*2,
    alpha:Math.random()*.46+.34
  };
}

function animate(time){
  const dt=state.lastTime?Math.min(.05,(time-state.lastTime)/1000):0;
  state.lastTime=time;
  updateSnow(dt,time/1000);
  drawSnow();
  requestAnimationFrame(animate);
}

function updateSnow(dt,elapsed){
  const speedScale=state.speedPercent/100;
  for(const flake of state.flakes){
    flake.phase+=dt*(.8+speedScale*.6);
    flake.x+=(flake.drift*Math.sin(flake.phase)+10*state.dpr)*dt*speedScale;
    flake.y+=flake.speed*dt*speedScale;
    if(flake.y>state.height+flake.radius*4||flake.x>state.width+flake.radius*8){
      Object.assign(flake,createFlake(false));
      flake.x=Math.random()*state.width-state.width*.08;
    }
  }
}

function drawSnow(){
  const ctx=state.ctx;
  if(!ctx)return;
  ctx.clearRect(0,0,state.width,state.height);
  ctx.save();
  ctx.globalCompositeOperation='screen';
  for(const flake of state.flakes){
    const glow=flake.radius*2.4;
    const gradient=ctx.createRadialGradient(flake.x,flake.y,0,flake.x,flake.y,glow);
    gradient.addColorStop(0,`rgba(255,255,255,${flake.alpha})`);
    gradient.addColorStop(.42,`rgba(220,244,255,${flake.alpha*.42})`);
    gradient.addColorStop(1,'rgba(220,244,255,0)');
    ctx.fillStyle=gradient;
    ctx.beginPath();
    ctx.arc(flake.x,flake.y,glow,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

initSnowPrototype();

export {initSnowPrototype,resizeCanvas,syncControls,setPreset,updateSnow,drawSnow};
