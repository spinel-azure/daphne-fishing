const Water={
  SPEED:8,
  OVERLAP:2,
  root:null,
  tiles:[],
  width:1,
  offset:0,
  init(){
    this.root=UI.$('waterSurface');
    this.tiles=this.root?[...this.root.querySelectorAll('.waterSurfaceTile')]:[];
    this.offset=0;
    this.resize(UI.$('wrap').clientWidth,UI.$('wrap').clientHeight);
  },
  resize(w,h){
    if(!this.root)return;
    this.width=Math.max(1,Math.ceil(w));
    this.root.style.height=Math.ceil(h)+'px';
    this.tiles.forEach(tile=>{
      tile.style.width=this.width+this.OVERLAP+'px';
      tile.style.height=Math.ceil(h)+'px';
    });
    this.draw();
  },
  update(dt){
    if(!this.root||!this.tiles.length)return;
    this.offset=(this.offset+this.SPEED*dt)%(this.width*2);
    this.draw();
  },
  draw(){
    if(!this.tiles.length)return;
    const x=-Math.round(this.offset);
    this.tiles.forEach((tile,i)=>{
      const mirror=tile.classList.contains('is-mirror');
      const tx=x+this.width*(mirror?i+1:i)+(mirror?this.OVERLAP:0);
      tile.style.transform=`translate3d(${tx}px,0,0)${mirror?' scaleX(-1)':''}`;
    });
  }
};
