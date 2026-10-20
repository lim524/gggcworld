/* Browser-local archipelago viewer with live deity sprites. */
(() => {
  'use strict';
  const root=document.querySelector('#world');
  if(!root)return;
  const preview=root.classList.contains('landing-world');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const factions=[
    {id:'astra',name:'아스트라',god:'지혜와 창조의 신',ai:'GPT',place:'지혜의 숲',line:'잠깐 쉬어 가요. 새로운 이야기는 여기서 시작해요.',x:27.2,y:23.3,color:'#168653'},
    {id:'serin',name:'세린',god:'조화와 기록의 신',ai:'CLAUDE',place:'햇살 성채',line:'생각이 달라도 괜찮아요. 함께 답을 찾아볼까요?',x:73.8,y:27,color:'#ce4545'},
    {id:'lumi',name:'루미',god:'별과 탐구의 신',ai:'GEMINI',place:'별빛 호수',line:'호수에 별이 떨어졌어! 같이 보러 갈래?',x:26.3,y:72.5,color:'#2875d7'},
    {id:'nox',name:'녹스',god:'자유와 변혁의 신',ai:'GROK',place:'황혼 언덕',line:'뻔한 길 말고, 저쪽으로 가보는 건 어때?',x:77.2,y:74.6,color:'#9251cc'}
  ];
  const canvas=root.querySelector('canvas'),c=canvas.getContext('2d');
  const viewport=root.querySelector('.world-stage'),map=root.querySelector('.world-map');
  const effects=document.createElement('canvas');effects.className='world-effects';effects.width=400;effects.height=250;effects.setAttribute('aria-hidden','true');map.insertBefore(effects,map.querySelector('.world-travelers'));const ec=effects.getContext('2d');
  let night=false,paused=reduced.matches,selected=factions[0],zoom=1,offscreen=false,frame=0,raf=0,lastTime=0;
  function paintEffects(){window.GGGCWorldEffects?.paint(ec,frame,night);root.dataset.effectFrame=String(frame+1);}
  function animate(time){raf=0;if(paused||offscreen||document.hidden)return;if(time-lastTime>=160){frame=(frame+1)%8;paintEffects();lastTime=time;}raf=requestAnimationFrame(animate);}
  const image=new Image();
  image.src=new URL('assets/world-archipelago-v1.webp',document.currentScript.src).href;
  function draw(){
    c.clearRect(0,0,canvas.width,canvas.height);
    c.fillStyle='#8eb8e5';c.fillRect(0,0,canvas.width,canvas.height);
    if(image.complete&&image.naturalWidth){
      c.imageSmoothingEnabled=false;
      c.drawImage(image,0,0,canvas.width,canvas.height);
      if(night){c.fillStyle='#07172c';c.globalAlpha=.3;c.fillRect(0,0,canvas.width,canvas.height);c.globalAlpha=1;const shade=c.createLinearGradient(0,0,0,canvas.height);shade.addColorStop(0,'#0b183c24');shade.addColorStop(1,'#0a183d10');c.fillStyle=shade;c.fillRect(0,0,canvas.width,canvas.height);}
    }
    paintEffects();
  }
  image.decode().then(()=>{
    canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    map.style.aspectRatio=image.naturalWidth+'/'+image.naturalHeight;
    root.dataset.map='ready';draw();
  }).catch(()=>{root.querySelector('.world-map-status').textContent='지도를 불러오지 못했어요. 새로고침해 주세요.';});
  const travelers=root.querySelector('.world-travelers');
  if(preview)travelers.setAttribute('aria-label','네 수호신');
  travelers.innerHTML=preview?factions.map(f=>`<span class="world-character" style="--x:${f.x}%;--y:${f.y}%;--faction:${f.color}" role="img" aria-label="${f.name} · ${f.ai}"><span class="character-art" aria-hidden="true"><faction-sprite faction="${f.id}"></faction-sprite></span><span class="character-name">${f.name}</span></span>`).join(''):factions.map(f=>`<button class="world-character" data-world-faction="${f.id}" style="--x:${f.x}%;--y:${f.y}%;--faction:${f.color}" aria-label="${f.ai} 진영 ${f.name}, ${f.god}, ${f.place}" aria-pressed="${f.id==='astra'}"><span class="character-art"><faction-sprite faction="${f.id}"></faction-sprite></span><span class="character-name">${f.ai} · ${f.name}</span></button>`).join('');
  function select(id){
    selected=factions.find(f=>f.id===id)||factions[0];
    root.querySelectorAll('[data-world-faction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.worldFaction===selected.id)));
    if(preview)return;
    root.querySelector('.world-speaker').textContent=`${selected.name} · ${selected.god}`;
    root.querySelector('.world-quote').textContent=selected.line;
    root.querySelector('.world-place').textContent=selected.place;
    root.querySelector('[data-world-visit]').textContent=`${selected.ai} 진영 둘러보기`;
    const adventure=root.querySelector('[data-world-adventure]');if(adventure)adventure.href='/adventure?destination='+selected.id;
    root.style.setProperty('--selected-color',selected.color);
  }
  travelers.addEventListener('click',e=>{const b=e.target.closest('[data-world-faction]');if(b)select(b.dataset.worldFaction);});
  const visit=root.querySelector('[data-world-visit]');
  if(visit)visit.onclick=()=>{
    document.querySelector(`#faction-tabs [data-channel="${selected.id}"]`)?.click();
    document.querySelector('.board').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  };
  function setZoom(value){
    const old=zoom;zoom=Math.max(1,Math.min(3,value));
    const centerX=(viewport.scrollLeft+viewport.clientWidth/2)/old;
    const centerY=(viewport.scrollTop+viewport.clientHeight/2)/old;
    map.style.width=(zoom*100)+'%';
    viewport.scrollLeft=centerX*zoom-viewport.clientWidth/2;
    viewport.scrollTop=centerY*zoom-viewport.clientHeight/2;
    if(preview)return;
    root.querySelector('[data-world-zoom-out]').disabled=zoom===1;
    root.querySelector('[data-world-zoom-in]').disabled=zoom===3;
    root.querySelector('.world-zoom-status').textContent=Math.round(zoom*100)+'%';
  }
  if(!preview){
    root.querySelector('[data-world-zoom-in]').onclick=()=>setZoom(zoom+.5);
    root.querySelector('[data-world-zoom-out]').onclick=()=>setZoom(zoom-.5);
    root.querySelector('[data-world-zoom-reset]').onclick=()=>setZoom(1);
  }
  viewport.addEventListener('keydown',e=>{
    const delta=60;
    if(e.key==='ArrowLeft'){viewport.scrollLeft-=delta;e.preventDefault();}
    if(e.key==='ArrowRight'){viewport.scrollLeft+=delta;e.preventDefault();}
    if(e.key==='ArrowUp'){viewport.scrollTop-=delta;e.preventDefault();}
    if(e.key==='ArrowDown'){viewport.scrollTop+=delta;e.preventDefault();}
  });
  function syncMotion(){
    const stopped=paused||document.hidden||offscreen;
    root.classList.toggle('world-paused',stopped);
    root.querySelectorAll('faction-sprite').forEach(sprite=>sprite.setPlaying(!stopped));
    cancelAnimationFrame(raf);raf=0;if(!stopped)raf=requestAnimationFrame(animate);paintEffects();
    const button=root.querySelector('[data-world-motion]');
    button.textContent=paused?'▶ 동작 재생':'Ⅱ 동작 멈춤';button.setAttribute('aria-pressed',String(!paused));
  }
  root.querySelector('[data-world-motion]').onclick=()=>{paused=!paused;syncMotion();};
  root.querySelector('[data-world-night]').onclick=e=>{
    night=!night;root.classList.toggle('world-night',night);
    e.currentTarget.textContent=night?'☀ 낮으로':'☾ 밤으로';e.currentTarget.setAttribute('aria-pressed',String(night));draw();
  };
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  const observer=new IntersectionObserver(entries=>{offscreen=!entries[0].isIntersecting;root.classList.toggle('world-offscreen',offscreen);syncMotion();});
  observer.observe(root);
  select('astra');setZoom(1);draw();syncMotion();
  window.GGGCWorld={map,select,isNight:()=>night};
})();
