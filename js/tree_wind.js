const TreeWind={
  AMP:2.2,
  SPEED:.9,
  canvas:null,
  ctx:null,
  image:null,
  leafCanvas:null,
  ready:false,
  width:1,
  height:1,
  init(){
    this.canvas=UI.$('treeWindCanvas');
    if(!this.canvas)return;
    this.ctx=this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled=false;
    this.image=new Image();
    this.image.src='images/bg.png';
    this.image.onload=()=>{
      this.buildLeafMask();
      this.ready=true;
      this.resize(UI.$('wrap').clientWidth,UI.$('wrap').clientHeight);
    };
  },
  buildLeafMask(){
    const img=this.image;
    const src=document.createElement('canvas');
    src.width=img.naturalWidth;
    src.height=img.naturalHeight;
    const sctx=src.getContext('2d');
    sctx.imageSmoothingEnabled=false;
    sctx.drawImage(img,0,0);
    const data=sctx.getImageData(0,0,src.width,src.height);
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

    sctx.putImageData(data,0,0);
    this.leafCanvas=src;
  },
  resize(w,h){
    if(!this.canvas)return;
    this.width=Math.max(1,Math.floor(w));
    this.height=Math.max(1,Math.floor(h));
    this.canvas.width=this.width;
    this.canvas.height=this.height;
    this.canvas.style.width=this.width+'px';
    this.canvas.style.height=this.height+'px';
    if(this.ctx)this.ctx.imageSmoothingEnabled=false;
  },
  update(now){
    if(!this.ready||!this.ctx||!this.leafCanvas)return;
    const ctx=this.ctx;
    const img=this.leafCanvas;
    const w=this.width;
    const h=this.height;
    const sourceW=img.width;
    const sourceH=img.height;
    const scale=Math.max(w/sourceW,h/sourceH);
    const drawW=sourceW*scale;
    const drawH=sourceH*scale;
    const dx=(w-drawW)/2;
    const dy=(h-drawH)/2;
    const t=now/1000*this.SPEED;
    const sliceH=2;
    const startY=Math.floor(h*.12);
    const endY=Math.floor(h*.45);

    ctx.clearRect(0,0,w,h);
    ctx.imageSmoothingEnabled=false;
    for(let y=startY;y<endY;y+=sliceH){
      const sy=(y-dy)/scale;
      if(sy<0||sy>=sourceH)continue;
      const sh=Math.min(sliceH/scale,sourceH-sy);
      const sway=Math.round(Math.sin(t+y*.045)*this.AMP+Math.sin(t*1.7+y*.022)*.8);
      ctx.drawImage(img,0,sy,sourceW,sh,dx+sway,y,drawW,sliceH);
    }
  }
};
