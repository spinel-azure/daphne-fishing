const I18N={
  lang:'ja',
  dict:{
    ja:{
      titleStart:'はじめる',
      titleContinue:'つづきから',
      titleHowTo:'あそびかた',
      titleOptions:'オプション',
      saveNotice:'セーブデータはこのブラウザに自動保存されます。<br>ブラウザのキャッシュやサイトデータを削除すると、セーブデータが消える場合があります。',
      helpTitle:'あそびかた',
      helpPages:[
        [
          '① 深度ゲージを直接クリックまたはタップして深度を選びます。',
          '② 左右ボタンをクリックまたはタップして釣り竿の向きを変えます。',
          '③ キャストボタンを長押しするとキャストゲージが上がります。',
          'ゲージが多いほど遠くに飛びますが、最大まで上がると力みすぎて近くに落としてしまいます。',
          '④ 魚がかかると「HIT!!」マークが出るので、すばやくキャストボタンを押してください。'
        ],
        [
          '⑤ キャストボタンがリールに変わるので、リールをクリックまたはタップしながら時計回りに回すと巻き上げます。',
          '巻けば巻くほどテンションが上がり、100%になると糸が切れて失敗扱いです。',
          'リールを止めると少しずつテンションが下がります。',
          'リールを離すと一気にテンションが下がりますが、距離も離れてしまいます。',
          'テンションに気をつけながら魚を釣り上げましょう。'
        ],
        [
          '現在はMVP版です。',
          'セーブ機能や魚店、効果音はまだ未実装です。',
          '今後アップデート予定です。'
        ]
      ],
      optionsTitle:'オプション',
      language:'言語選択',
      japanese:'日本語',
      english:'英語',
      bgm:'BGM',
      se:'SE',
      ambience:'環境音',
      ambienceOn:'ON',
      ambienceOff:'OFF',
      ambienceVolume:'環境音の音量',
      notReady:'未実装',
      titleButton:'TITLE',
      prevButton:'PREV',
      nextButton:'NEXT',
      tension:'TENSION',
      distance:'DISTANCE',
      depth:'DEPTH',
      castPower:'CAST POWER',
      back:'BACK',
      again:'AGAIN',
      reelHint:'リールを回そう',
      depthSelected:d=>`Depth ${d}m selected.`,
      aimPrompt:'竿の向きを決めたら、キャスティングボタンを長押ししてね。',
      overCast:'力みすぎた！',
      castFailed:'投げ損ねた！ ウキが足元に落ちた。',
      castWait:d=>`${d}mのタナへ仕掛けを投入！\n竿先から糸が伸びています。アタリを待とう。`,
      bite:'ウキが沈んだ！\nすばやく「アワセ！」を押せ！',
      hooked:'何かが掛かった！\nリールで引き寄せろ！',
      ready:'タナを選んで、竿の向きを決めて、キャスティングボタンを長押し！',
      hookFail:'アワセ失敗！',
      tensionBreak:'テンション限界！ 糸が切れた！',
      looseFail:'テンション不足！ 魚が逃げた！',
      caught:name=>`${name}を釣り上げた！`,
      resultInfo:(rare,depth)=>`レア度 ${rare} / タナ ${depth}m`,
      retry:'もう一度挑戦しよう。'
    },
    en:{
      titleStart:'START',
      titleContinue:'CONTINUE',
      titleHowTo:'HOW TO PLAY',
      titleOptions:'OPTIONS',
      saveNotice:'Save data is stored automatically in this browser.<br>Clearing browser cache or site data may delete your save data.',
      helpTitle:'HOW TO PLAY',
      helpPages:[
        [
          '1. Click or tap the depth gauge to choose a depth.',
          '2. Click or tap the left and right buttons to aim the rod.',
          '3. Hold the cast button to raise the cast gauge.',
          'More gauge power sends the float farther, but maxing it out overthrows and drops it nearby.',
          '4. When a fish bites, a HIT!! mark appears. Press the cast button quickly.'
        ],
        [
          '5. The cast button changes into a reel. Hold and rotate it clockwise to reel in.',
          'The more you reel, the more tension rises. At 100%, the line snaps and you fail.',
          'Stopping the reel lowers tension little by little.',
          'Letting go lowers tension quickly, but the fish also gets farther away.',
          'Watch the tension and land the fish.'
        ],
        [
          'This is currently the MVP version.',
          'Save features, the fish shop, and sound effects are not implemented yet.',
          'More updates are planned.'
        ]
      ],
      optionsTitle:'OPTIONS',
      language:'Language',
      japanese:'Japanese',
      english:'English',
      bgm:'BGM',
      se:'SE',
      ambience:'Ambience',
      ambienceOn:'ON',
      ambienceOff:'OFF',
      ambienceVolume:'Ambience volume',
      notReady:'Not yet',
      titleButton:'TITLE',
      prevButton:'PREV',
      nextButton:'NEXT',
      tension:'TENSION',
      distance:'DISTANCE',
      depth:'DEPTH',
      castPower:'CAST POWER',
      back:'BACK',
      again:'AGAIN',
      reelHint:'Rotate the reel',
      depthSelected:d=>`Depth ${d}m selected.`,
      aimPrompt:'Aim the rod, then hold the cast button.',
      overCast:'Too much power!',
      castFailed:'Bad cast! The float dropped near your feet.',
      castWait:d=>`Cast to the ${d}m depth!\nThe line stretches from the rod tip. Wait for a bite.`,
      bite:'The float sank!\nPress HIT!! quickly!',
      hooked:'Something is hooked!\nReel it in!',
      ready:'Choose a depth, aim the rod, then hold the cast button!',
      hookFail:'Hook failed!',
      tensionBreak:'Tension limit! The line snapped!',
      looseFail:'Too little tension! The fish escaped!',
      caught:name=>`Caught ${name}!`,
      resultInfo:(rare,depth)=>`Rarity ${rare} / Depth ${depth}m`,
      retry:'Try again.'
    }
  },
  init(){
    const saved=localStorage.getItem('daphneFishingLang');
    this.lang=saved==='en'?'en':'ja';
    document.documentElement.lang=this.lang;
    this.apply();
  },
  t(key,...args){
    const value=(this.dict[this.lang]&&this.dict[this.lang][key])??this.dict.ja[key]??key;
    return typeof value==='function'?value(...args):value;
  },
  pageText(index){
    return this.dict[this.lang].helpPages[index]??this.dict.ja.helpPages[index]??[];
  },
  setLang(lang){
    this.lang=lang==='en'?'en':'ja';
    localStorage.setItem('daphneFishingLang',this.lang);
    document.documentElement.lang=this.lang;
    this.apply();
  },
  setText(id,value){
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  },
  apply(){
    document.querySelector('[data-title-action="start"]')?.replaceChildren(document.createTextNode(this.t('titleStart')));
    document.querySelector('[data-title-action="continue"]')?.replaceChildren(document.createTextNode(this.t('titleContinue')));
    document.querySelector('[data-title-action="howto"]')?.replaceChildren(document.createTextNode(this.t('titleHowTo')));
    document.querySelector('[data-title-action="options"]')?.replaceChildren(document.createTextNode(this.t('titleOptions')));
    const notice=document.querySelector('.saveNotice');
    if(notice)notice.innerHTML=this.t('saveNotice');
    document.querySelectorAll('.helpTitle').forEach(el=>el.textContent=this.t('helpTitle'));
    this.applyHelpPages();
    this.setText('optionTitle',this.t('optionsTitle'));
    this.setText('optionLanguageLabel',this.t('language'));
    this.setText('optionJapaneseLabel',this.t('japanese'));
    this.setText('optionEnglishLabel',this.t('english'));
    this.setText('optionBgmLabel',this.t('bgm'));
    this.setText('optionSeLabel',this.t('se'));
    this.setText('optionAmbienceLabel',this.t('ambience'));
    this.setText('optionAmbienceOnLabel',this.t('ambienceOn'));
    this.setText('optionAmbienceOffLabel',this.t('ambienceOff'));
    const ambienceVolume=document.getElementById('ambienceVolume');
    if(ambienceVolume)ambienceVolume.setAttribute('aria-label',this.t('ambienceVolume'));
    document.querySelectorAll('.optionNotReady').forEach(el=>el.textContent=this.t('notReady'));
    document.querySelectorAll('[data-i18n-title-button]').forEach(el=>el.textContent=this.t('titleButton'));
    document.querySelectorAll('[data-i18n-prev-button]').forEach(el=>el.textContent=this.t('prevButton'));
    document.querySelectorAll('[data-i18n-next-button]').forEach(el=>el.textContent=this.t('nextButton'));
    this.setText('tensionLabel',this.t('tension'));
    this.setText('distanceLabel',this.t('distance'));
    this.setText('depthLabel',this.t('depth'));
    this.setText('castPowerLabelText',this.t('castPower'));
    this.setText('backBtn',this.t('back'));
    this.setText('againBtn',this.t('again'));
    this.setText('reelHint',this.t('reelHint'));
    document.querySelector(`input[name="lang"][value="${this.lang}"]`)?.setAttribute('checked','checked');
    document.querySelectorAll('input[name="lang"]').forEach(input=>{input.checked=input.value===this.lang});
  },
  applyHelpPages(){
    const first=document.querySelector('[data-help-page="0"] .helpText');
    if(first){
      first.innerHTML=this.pageText(0).map((text,index)=>`
        <div class="helpStep">
          <p>${text}</p>
          ${this.helpFigure(index)}
        </div>
      `).join('');
    }
    document.querySelectorAll('.helpPage:not(:first-child) .helpBody').forEach(el=>{
      const index=Number(el.closest('.helpPage')?.dataset.helpPage??0);
      el.innerHTML=this.pageText(index).map(text=>`<p>${text}</p>`).join('');
    });
  },
  helpFigure(index){
    if(index===0){
      return '<div class="helpStepFigure helpDepthMini"><b>DEPTH</b><span></span><i></i><em>5m</em></div>';
    }
    if(index===1){
      return '<div class="helpStepFigure helpAimMini"><button type="button">&lt;</button><button type="button">&gt;</button></div>';
    }
    if(index===2||index===3){
      return '<div class="helpStepFigure helpCastIcon"><span class="helpCastArc"></span></div>';
    }
    if(index===4){
      return '<div class="helpStepFigure helpHitIcon"><div class="helpCastIcon"><span class="helpCastArc"></span></div><strong>HIT!!</strong></div>';
    }
    return '<span class="helpStepFigure"></span>';
  }
};

I18N.init();
