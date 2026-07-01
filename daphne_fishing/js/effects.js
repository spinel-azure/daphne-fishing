const Effects={
  canvas:null,ctx:null,ripples:[],lastAuto:0,
  init(){this.canvas=UI.$('effectCanvas');this.ctx=this.canvas.getContext('2d')},
  resize(w,h){this.canvas.width=w;this.canvas.height=h},
  addRipple(x,y,strong=false){this.ripples.push({x,y,r:strong?5:2,life:strong?1.1:.75,max:strong?38:24})},
  update(dt,now){if([GameState.WAIT,GameState.HIT,GameState.BATTLE].includes(game.state)&&now-this.lastAuto>520){this.lastAuto=now;this.addRipple(game.bob.x+rand(-3,3),game.bob.y+rand(-2,2),game.state!==GameState.WAIT)}for(const r of this.ripples){r.life-=dt;r.r+=dt*r.max*1.2}this.ripples=this.ripples.filter(r=>r.life>0)},
  draw(){const c=this.ctx;c.clearRect(0,0,this.canvas.width,this.canvas.height);for(const r of this.ripples){const a=clamp(r.life,0,1);c.strokeStyle=`rgba(205,240,255,${a*.65})`;c.lineWidth=2;c.beginPath();c.ellipse(r.x,r.y,r.r*1.45,r.r*.36,0,0,Math.PI*2);c.stroke();c.strokeStyle=`rgba(255,255,255,${a*.35})`;c.lineWidth=1;c.beginPath();c.ellipse(r.x,r.y,r.r*.72,r.r*.18,0,0,Math.PI*2);c.stroke()}}
};
