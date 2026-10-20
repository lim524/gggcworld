/* Browser-only world scene. No networking, gameplay rewards, or shared state. */
(() => {
  'use strict';
  const root = document.querySelector('#world');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const factions = [
    {id:'astra',name:'아스트라',god:'지혜와 창조의 신',ai:'GPT',place:'지혜의 숲',line:'잠깐 쉬어 가요. 새로운 이야기는 여기서 시작해요.',x:25,y:35,color:'#168653'},
    {id:'serin',name:'세린',god:'조화와 기록의 신',ai:'CLAUDE',place:'햇살 성채',line:'생각이 달라도 괜찮아요. 함께 답을 찾아볼까요?',x:73,y:34,color:'#ce4545'},
    {id:'lumi',name:'루미',god:'별과 탐구의 신',ai:'GEMINI',place:'별빛 호수',line:'호수에 별이 떨어졌어! 같이 보러 갈래?',x:27,y:73,color:'#2875d7'},
    {id:'nox',name:'녹스',god:'자유와 변혁의 신',ai:'GROK',place:'황혼 언덕',line:'뻔한 길 말고, 저쪽으로 가보는 건 어때?',x:74,y:73,color:'#9251cc'}
  ];
  const canvas = root.querySelector('canvas');
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  let night = false, paused = reduced.matches, selected = factions[0];
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  function tree(x,y,tint) {
    rect(x-2,y,4,12,'#6a7150');rect(x-12,y-15,24,17,tint);rect(x-8,y-22,16,9,tint);
    rect(x-8,y-15,4,9,'#ffffff15');rect(x+4,y-8,8,9,'#243e3b20');
  }
  function house(x,y,roof,wall) {
    rect(x-20,y+20,44,5,'#304b4030');rect(x-18,y-7,36,29,wall);
    rect(x-25,y-13,50,8,roof);rect(x-20,y-20,40,8,roof);rect(x-13,y-26,26,8,roof);
    rect(x-8,y+6,12,16,'#596b60');rect(x-13,y-1,7,7,'#f9dda1');rect(x+6,y-1,7,7,'#f9dda1');
    rect(x-9,y+22,18,4,'#c8bfa2');rect(x+12,y-31,5,15,'#b0ab94');
  }
  function draw() {
    c.clearRect(0,0,480,300);
    rect(0,0,480,300,night?'#233d48':'#b9d9d4');
    // Quiet water, fixed decorative ripples, and an island built on an 8px grid.
    for(let y=12;y<300;y+=21) for(let x=8;x<480;x+=39) rect(x+(y%4)*4,y,11,2,night?'#3c5962':'#cce4dc');
    for(let y=16;y<282;y+=8) for(let x=16;x<464;x+=8) {
      const d=((x-240)/230)**2+((y-151)/139)**2;
      if(d<1) {
        const shore=d>.88;
        let color=shore?'#d8d2a3':x<238?(y<151?'#a2be80':'#a6c6ae'):(y<151?'#c4bf88':'#aea9bf');
        rect(x,y+7,8,8,shore?'#8ea083':color);rect(x,y,8,8,color);
        if(!shore && (x*17+y*13)%11<2) rect(x+2,y+4,3,2,'#ffffff21');
      }
    }
    // Paths converge on the shared plaza.
    rect(105,99,256,16,'#ded8b3');rect(113,99,16,124,'#ded8b3');rect(345,99,16,124,'#ded8b3');
    rect(120,213,240,13,'#ded8b3');rect(232,101,16,119,'#ded8b3');
    // The stream stays on the island, crossed by a little timber bridge.
    rect(178,27,17,69,'#79b6c0');rect(187,88,14,58,'#79b6c0');rect(177,136,20,54,'#79b6c0');rect(184,183,15,83,'#79b6c0');
    rect(184,34,3,30,'#bee1dc');rect(183,147,3,25,'#bee1dc');
    rect(170,97,38,21,'#a78e64');for(let x=172;x<207;x+=7)rect(x,97,2,21,'#d1b889');rect(169,95,40,3,'#816c52');rect(169,117,40,3,'#816c52');
    // Lake, lily pads and a small dock.
    rect(57,180,43,29,'#80b6c1');rect(49,188,60,15,'#80b6c1');rect(63,177,25,35,'#80b6c1');
    rect(56,192,14,2,'#b6dedb');rect(82,199,12,2,'#b6dedb');rect(75,184,6,4,'#6f9f79');rect(78,183,2,2,'#f3d3ce');
    rect(101,189,26,12,'#b9a680');rect(102,193,24,2,'#867558');
    // A common meeting point.
    rect(209,132,64,43,'#c4c8ac');rect(217,125,48,57,'#dce0c5');
    rect(231,138,20,25,'#8aada1');rect(227,145,28,13,'#9dc8c1');rect(233,142,16,12,'#c8e2d4');rect(238,135,5,15,'#e5f0ce');
    // Four neighbourhoods use the existing faction palette.
    house(116,69,'#69896a','#e1e0be');house(352,68,'#bb8858','#ead9ad');
    house(124,184,'#719bb1','#dae3d4');house(356,184,'#8f789f','#ded5d7');
    // Flags.
    [[145,60,'#79a18a'],[382,60,'#d6a15c'],[151,177,'#7da7ce'],[384,176,'#a692b4']].forEach(([x,y,color])=>{rect(x,y,2,23,'#7a7862');rect(x+2,y,13,9,color);rect(x+2,y,3,9,'#ffffff36');});
    [[58,58],[80,41],[153,40],[45,91],[64,120],[146,130],[299,38],[402,87],[417,121],[314,116],[51,237],[78,257],[150,251],[160,204],[313,252],[401,226],[423,185],[322,207]].forEach(([x,y],i)=>tree(x,y,i<6?'#6e9469':i<10?'#a5a26a':i<14?'#739c8c':'#8d829e'));
    // Flowers, lamps and rocks (deterministic placement avoids shimmering).
    for(let i=0;i<35;i++) {const x=74+(i*47)%327,y=43+(i*37)%208;if(Math.abs(x-240)<37||Math.abs(y-109)<14||Math.abs(y-218)<12)continue;rect(x,y,2,4,'#779170');rect(x-1,y-2,4,3,['#f4e7b3','#e9d0cf','#d6dced'][i%3]);}
    [[214,107],[267,107],[215,208],[269,208]].forEach(([x,y])=>{rect(x,y,2,14,'#7b7b60');rect(x-2,y-4,6,6,'#fff0b5');if(night){c.fillStyle='#ffe5a326';c.beginPath();c.arc(x+1,y,14,0,Math.PI*2);c.fill();}});
    if(night)rect(0,0,480,300,'#18324835');
  }
  const travelers=root.querySelector('.world-travelers');
  travelers.innerHTML=factions.map(f=>`<button class="world-character" data-world-faction="${f.id}" style="--x:${f.x}%;--y:${f.y}%;--faction:${f.color}" aria-label="${f.ai} 진영 ${f.name}, ${f.god}, ${f.place}" aria-pressed="${f.id==='astra'}"><span class="character-art"><faction-sprite faction="${f.id}"></faction-sprite></span><span class="character-name">${f.name}</span></button>`).join('');
  function select(id) {
    selected=factions.find(f=>f.id===id)||factions[0];
    root.querySelectorAll('[data-world-faction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.worldFaction===selected.id)));
    root.querySelector('.world-speaker').textContent=`${selected.name} · ${selected.god}`;
    root.querySelector('.world-quote').textContent=selected.line;
    root.querySelector('.world-place').textContent=selected.place;
    root.querySelector('[data-world-visit]').textContent=`${selected.ai} 진영 둘러보기 →`;
    root.style.setProperty('--selected-color',selected.color);
  }
  travelers.addEventListener('click',e=>{const b=e.target.closest('[data-world-faction]');if(b)select(b.dataset.worldFaction);});
  root.querySelector('[data-world-visit]').onclick=()=>{
    document.querySelector(`#faction-tabs [data-channel="${selected.id}"]`)?.click();
    document.querySelector('.board').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  };
  function syncMotion() {
    root.classList.toggle('world-paused',paused||document.hidden);
    root.querySelectorAll('faction-sprite').forEach(sprite=>sprite.setPlaying(!paused));
    const button=root.querySelector('[data-world-motion]');
    button.textContent=paused?'▶ 동작 재생':'Ⅱ 동작 멈춤';button.setAttribute('aria-pressed',String(!paused));
  }
  root.querySelector('[data-world-motion]').onclick=()=>{paused=!paused;syncMotion();};
  root.querySelector('[data-world-night]').onclick=e=>{night=!night;root.classList.toggle('world-night',night);e.currentTarget.textContent=night?'☀ 낮으로':'☾ 밤으로';e.currentTarget.setAttribute('aria-pressed',String(night));draw();};
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  const observer=new IntersectionObserver(entries=>root.classList.toggle('world-offscreen',!entries[0].isIntersecting));observer.observe(root);
  select('astra');draw();syncMotion();
})();
