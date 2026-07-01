const Device={
  type:'desktop',
  inputMode:'mouse',
  width:0,
  height:0,
  init(){
    this.refresh();
  },
  refresh(){
    const w=window.innerWidth||document.documentElement.clientWidth||0;
    const h=window.innerHeight||document.documentElement.clientHeight||0;
    const shortSide=Math.min(w,h);
    const longSide=Math.max(w,h);
    const aspect=shortSide>0?longSide/shortSide:1;
    let type='desktop';
    if(shortSide<=640){
      type='phone';
    }else if((shortSide<=920&&longSide<=1200)||(shortSide<=1100&&longSide<=1366&&aspect<1.6)){
      type='tablet';
    }
    this.width=w;
    this.height=h;
    this.type=type;
    this.inputMode=type==='desktop'?'mouse':'touch';
    if(document.body){
      document.body.dataset.device=this.type;
      document.body.dataset.input=this.inputMode;
    }
  },
  isTouchMode(){
    return this.inputMode==='touch';
  },
  acceptsPointer(ev){
    if(!ev||!ev.pointerType)return true;
    if(this.isTouchMode())return ev.pointerType==='touch'||ev.pointerType==='pen';
    return ev.pointerType==='mouse';
  }
};
