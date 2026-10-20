/* Fixed prologue introduction. AI generation and BYOK are intentionally not connected yet. */
(() => {
  'use strict';
  const gods={
    astra:{name:'아스트라',ai:'GPT',role:'지혜와 창조의 신',color:'#a3dab5',lines:['도착했네요. 여기가 우리 여행의 시작, 바람 항구예요.','저 바다 너머에는 아직 책에 적히지 않은 이야기가 있어요.\n어떤 이야기가 될지는, 우리 둘이 함께 정해봐요.','서두르지 않아도 괜찮아요.\n첫 페이지는 늘, 작은 만남에서 시작하니까요.']},
    serin:{name:'세린',ai:'Claude',role:'조화와 기록의 신',color:'#ffb5a5',lines:['바람 항구에 온 걸 환영해. 기다리고 있었어.','이곳에서부터 우리 발걸음을 기록해 보자.\n지도에 없는 길도, 함께라면 찾아낼 수 있을 거야.','준비가 되면 말해 줘.\n네 첫 번째 모험에 내가 함께할게.']},
    lumi:{name:'루미',ai:'Gemini',role:'별과 탐구의 신',color:'#a6d5ff',lines:['왔구나! 여기야, 바람 항구!\n바다에서 반짝이는 게 보이지 않아?','저 섬마다 어떤 비밀이 있을까?\n생각만 해도 궁금한 게 너무 많아!','괜찮아, 아직 다 알 필요는 없어.\n우리 하나씩 찾아보면 되잖아.']},
    nox:{name:'녹스',ai:'Grok',role:'자유와 변혁의 신',color:'#d9b6ff',lines:['이제 왔네. 바람 항구는 처음이지?','저 멀리 보이는 섬들 말이야.\n다들 정해진 길로만 가던데, 그럼 재미없잖아.','이번엔 네가 골라 봐.\n어디로 가든, 꽤 재미있는 일이 생길 것 같거든.']}
  };
  let profile;try{profile=JSON.parse(localStorage.getItem('gggc-profile-v1'));}catch{}
  const requested=new URLSearchParams(location.search).get('faction');
  const faction=Object.hasOwn(gods,requested)?requested:Object.hasOwn(gods,profile?.faction)?profile.faction:'astra';
  const god=gods[faction],game=document.querySelector('#game'),begin=document.querySelector('#begin-adventure'),next=document.querySelector('#next-dialogue'),settings=document.querySelector('#settings-dialog');
  let page=0,started=false;
  document.documentElement.style.setProperty('--accent',god.color);
  document.querySelectorAll('faction-sprite').forEach(sprite=>sprite.setAttribute('faction',faction));
  document.querySelector('#speaker-name').textContent=god.name;
  document.querySelector('#speaker-role').textContent=god.role;
  document.querySelector('#settings-name').textContent=god.name+' · '+god.ai;
  const saveKey='gggc-prologue-v1-'+faction;
  let saved;try{saved=JSON.parse(localStorage.getItem(saveKey));}catch{}
  if(saved?.started)begin.textContent='첫 만남 이어보기';
  function showLine(){
    document.querySelector('#dialogue-line').textContent=god.lines[page];
    document.querySelector('#dialogue-count').textContent=String(page+1).padStart(2,'0')+' / 03';
    const end=page===god.lines.length-1;
    next.disabled=end;next.textContent=end?'첫 만남 완료':'다음 대화 ▾';
    document.querySelector('#opening-caption').hidden=!end;
    try{localStorage.setItem(saveKey,JSON.stringify({started:true,page}));}catch{}
  }
  begin.onclick=()=>{
    started=true;page=Number.isInteger(saved?.page)?Math.max(0,Math.min(god.lines.length-1,saved.page)):0;
    document.querySelector('#title-screen').hidden=true;document.querySelector('#opening-scene').hidden=false;game.classList.add('playing');showLine();next.disabled?document.querySelector('#game-settings').focus():next.focus();
  };
  next.onclick=()=>{if(page<god.lines.length-1){page++;showLine();}};
  document.addEventListener('keydown',e=>{if(!started||settings.open||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;if((e.key==='Enter'||e.key===' ')&&!['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();next.click();}});
  document.querySelector('#game-settings').onclick=()=>settings.showModal();
  const full=document.querySelector('#game-fullscreen');
  if(!document.fullscreenEnabled||!game.requestFullscreen){full.hidden=true;}
  full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await game.requestFullscreen();}catch{document.querySelector('#game-status').textContent='이 브라우저에서는 전체화면 전환을 사용할 수 없어요.';}};
  document.addEventListener('fullscreenchange',()=>{const active=Boolean(document.fullscreenElement);full.textContent=active?'전체화면 해제':'전체화면';full.setAttribute('aria-pressed',String(active));});
  function syncMotion(){document.querySelectorAll('faction-sprite').forEach(sprite=>sprite.setPlaying(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches));}
  document.addEventListener('visibilitychange',syncMotion);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',syncMotion);customElements.whenDefined('faction-sprite').then(syncMotion);
})();
