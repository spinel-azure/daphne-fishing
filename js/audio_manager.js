const AudioManager={
  storageKey:'daphneFishingAudioSettings',
  ambienceCatalog:{
    kaigan3:'audio/ambience/kaigan3.mp3'
  },
  ambience:null,
  currentAmbience:null,
  gameStarted:false,
  settings:{
    ambienceEnabled:true,
    ambienceVolume:.2
  },
  clamp01(value){
    return Math.max(0,Math.min(1,Number(value)||0));
  },
  init(){
    this.loadSettings();
    this.ensureAmbience('kaigan3');
    this.applyAmbienceSettings();
  },
  loadSettings(){
    try{
      const raw=localStorage.getItem(this.storageKey);
      if(!raw)return;
      const saved=JSON.parse(raw);
      if(typeof saved.ambienceEnabled==='boolean')this.settings.ambienceEnabled=saved.ambienceEnabled;
      if(Number.isFinite(Number(saved.ambienceVolume)))this.settings.ambienceVolume=this.clamp01(saved.ambienceVolume);
    }catch(err){
      console.warn('Audio settings could not be loaded.',err);
    }
  },
  saveSettings(){
    localStorage.setItem(this.storageKey,JSON.stringify(this.settings));
  },
  ensureAmbience(name='kaigan3'){
    if(this.currentAmbience===name&&this.ambience)return;
    const src=this.ambienceCatalog[name];
    if(!src)return;
    if(this.ambience){
      this.ambience.pause();
      this.ambience.currentTime=0;
    }
    this.currentAmbience=name;
    this.ambience=new Audio(src);
    this.ambience.loop=true;
    this.ambience.preload='auto';
    this.applyAmbienceSettings();
  },
  playAmbience(name='kaigan3'){
    this.gameStarted=true;
    this.ensureAmbience(name);
    if(!this.ambience||!this.settings.ambienceEnabled)return;
    this.applyAmbienceSettings();
    const playPromise=this.ambience.play();
    if(playPromise&&typeof playPromise.catch==='function'){
      playPromise.catch(err=>console.warn('Ambience playback was blocked or failed.',err));
    }
  },
  stopAmbience(){
    if(!this.ambience)return;
    this.ambience.pause();
    this.ambience.currentTime=0;
  },
  setAmbienceEnabled(enabled){
    this.settings.ambienceEnabled=!!enabled;
    this.saveSettings();
    this.applyAmbienceSettings();
    if(this.settings.ambienceEnabled){
      if(this.gameStarted)this.playAmbience(this.currentAmbience||'kaigan3');
    }else if(this.ambience){
      this.ambience.pause();
    }
  },
  setAmbienceVolume(value){
    this.settings.ambienceVolume=this.clamp01(value);
    this.saveSettings();
    this.applyAmbienceSettings();
  },
  applyAmbienceSettings(){
    if(!this.ambience)return;
    this.ambience.volume=this.clamp01(this.settings.ambienceVolume);
  },
  getAmbienceSettings(){
    return {...this.settings};
  }
};

AudioManager.init();