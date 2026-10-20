/* First playable exploration loop; discoveries stay on this device. No paid rewards or combat. */
(() => {
  'use strict';
  const scene=window.GGGCWorld;if(!scene)return;
  const locations=[
    {id:'astra',name:'지혜의 숲',x:27.2,y:25,color:'#168653',tag:'GPT 영역',text:'나뭇잎 사이로 초록빛이 번져요. 아스트라의 서재로 이어지는 작은 길을 발견했어요.',note:'숲길의 오래된 책갈피'},
    {id:'serin',name:'햇살 성채',x:73.8,y:29,color:'#ce4545',tag:'Claude 영역',text:'성문 위 붉은 깃발이 바람에 흔들려요. 세린이 지키는 광장의 종소리가 들립니다.',note:'성채의 붉은 인장'},
    {id:'lumi',name:'별빛 호수',x:26.3,y:74,color:'#2875d7',tag:'Gemini 영역',text:'잔잔한 호수 위로 별빛이 반짝여요. 루미와 함께 물가에 남은 발자국을 따라가 봤어요.',note:'호수에 비친 별자리'},
    {id:'nox',name:'황혼 언덕',x:77.2,y:76,color:'#9251cc',tag:'Grok 영역',text:'보랏빛 수정이 낮게 울려요. 녹스가 가리킨 돌무더기 사이로 낯선 문양이 보입니다.',note:'황혼 유적의 별 문양'},
    {id:'harbor',name:'바람 항구',x:49,y:54,color:'#b68b49',tag:'공용 마을',text:'작은 배들이 선착장에서 쉬고 있어요. 광장에 모인 여행자들이 다음 항로를 이야기합니다.',note:'선착장의 항해 일지'},
    {id:'snow',name:'고요한 설원',x:58,y:14,color:'#7c9db7',tag:'미지의 북쪽',text:'눈 덮인 돌다리를 건너왔어요. 멀리 무너진 성벽 너머로 아직 가보지 못한 길이 이어집니다.',note:'눈 위에 남은 여행자의 발자국'},
    {id:'farm',name:'노을 들판',x:53,y:83,color:'#a3833a',tag:'남쪽 마을',text:'바람에 밀밭이 물결쳐요. 작은 풍차 아래에서 이 섬을 돌보는 사람들의 이야기를 들었어요.',note:'들판 마을의 작은 지도'},
    {id:'ruin',name:'안개 유적',x:8,y:42,color:'#728d89',tag:'서쪽 탐험지',text:'안개 사이로 오래된 기둥이 드러나요. 무너진 계단 끝에서 다른 섬을 바라볼 수 있었어요.',note:'이름 없는 섬의 석판'}
  ];
  const root=document.querySelector('#adventure-console'),map=scene.map;
  let record;try{record=JSON.parse(localStorage.getItem('gggc-exploration-v1'))||{};}catch{record={};}
  let found=Array.isArray(record.found)?record.found.filter(id=>locations.some(p=>p.id===id)):[];
  let current=locations.find(p=>p.id===record.current)||locations[4],selected=locations.find(p=>p.id===new URLSearchParams(location.search).get('destination'))||locations[0],traveling=false,step=0,travelTimer=0;
  const markers=document.createElement('div');markers.className='adventure-markers';markers.setAttribute('role','group');markers.setAttribute('aria-label','탐험 장소 선택');
  markers.innerHTML=locations.map(p=>`<button data-destination="${p.id}" style="--x:${p.x}%;--y:${p.y}%;--destination:${p.color}" aria-label="${p.name} 선택"><span aria-hidden="true">◇</span><small>${p.name}</small></button>`).join('');map.append(markers);
  const traveler=document.createElement('div');traveler.className='adventure-traveler';traveler.setAttribute('aria-hidden','true');map.append(traveler);
  const route=document.createElementNS('http://www.w3.org/2000/svg','svg');route.classList.add('adventure-route');route.setAttribute('viewBox','0 0 100 100');route.setAttribute('preserveAspectRatio','none');route.setAttribute('aria-hidden','true');map.append(route);
  function avatar(){let id='astra';try{id=JSON.parse(localStorage.getItem('gggc-profile-v1'))?.faction||id;}catch{}if(!locations.slice(0,4).some(p=>p.id===id))id='astra';traveler.innerHTML=`<faction-sprite faction="${id}"></faction-sprite><span>나의 여행자</span>`;}
  function position(x,y){traveler.style.left=x+'%';traveler.style.top=y+'%';}
  function render(){
    markers.querySelectorAll('button').forEach(b=>{b.disabled=traveling;b.setAttribute('aria-pressed',String(b.dataset.destination===selected.id));b.classList.toggle('discovered',found.includes(b.dataset.destination));});
    root.innerHTML=`<section class="adventure-destination"><div><span class="micro">${esc(selected.tag)}</span><h2>${esc(selected.name)}</h2><p>${traveling?'수호신과 함께 길을 따라 이동하고 있어요.':selected.id===current.id?'지금 이곳에 머물고 있어요. 주변을 살펴볼까요?':'지도의 장소를 선택하고 탐험을 시작해보세요.'}</p></div><button class="write" id="start-exploring" ${traveling?'disabled':''}><span aria-hidden="true">✦</span> ${traveling?'이동 중':selected.id===current.id?'주변 살펴보기':'탐험 시작'}</button></section><div class="adventure-progress" role="progressbar" aria-label="탐험 진행" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${traveling?step:0}"><i style="width:${traveling?step/8*100:0}%"></i></div><div id="exploration-result" role="status" aria-live="polite"></div><section class="exploration-notes"><div><h3>탐험 노트</h3><span>${found.length} / ${locations.length}곳 발견</span></div>${found.length?`<ul>${locations.filter(p=>found.includes(p.id)).map(p=>`<li><span style="--destination:${p.color}"></span><b>${esc(p.name)}</b><small>${esc(p.note)}</small></li>`).join('')}</ul>`:'<p>아직 기록이 없어요. 첫 번째 장소를 탐험해보세요.</p>'}<p class="exploration-storage">이 모험의 탐험 기록은 현재 기기에 저장됩니다.</p></section>`;
    document.querySelector('#start-exploring').onclick=start;document.querySelectorAll('[data-place]').forEach(b=>{b.disabled=traveling;b.setAttribute('aria-pressed',String(b.dataset.place===selected.id));});
  }
  function choose(id){if(traveling)return;selected=locations.find(p=>p.id===id)||selected;render();route.innerHTML=`<path d="M ${current.x} ${current.y} Q 50 51 ${selected.x} ${selected.y}"/>`;}
  function finish(){clearInterval(travelTimer);traveling=false;current=selected;position(current.x,current.y);if(!found.includes(current.id))found.push(current.id);let stored=true;try{localStorage.setItem('gggc-exploration-v1',JSON.stringify({found,current:current.id}));}catch{stored=false;}route.innerHTML='';render();document.querySelector('#exploration-result').innerHTML=`<div class="exploration-arrival"><span class="micro">도착 기록</span><h3>${esc(current.name)}에 도착했어요</h3><p>${esc(current.text)}</p><small>발견한 이야기 · ${esc(current.note)}</small>${stored?'':'<p>기기에 기록을 저장하지 못했어요.</p>'}</div>`;}
  function start(){if(traveling)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}traveling=true;step=0;const from={x:current.x,y:current.y};route.innerHTML=`<path d="M ${from.x} ${from.y} Q 50 51 ${selected.x} ${selected.y}"/>`;render();travelTimer=setInterval(()=>{if(document.hidden)return;step++;const t=step/8,u=1-t;position(u*u*from.x+2*u*t*50+t*t*selected.x,u*u*from.y+2*u*t*51+t*t*selected.y);const progress=root.querySelector('[role=progressbar]');progress.setAttribute('aria-valuenow',String(step));progress.querySelector('i').style.width=t*100+'%';if(step>=8)finish();},240);}
  markers.addEventListener('click',e=>{const button=e.target.closest('[data-destination]');if(button)choose(button.dataset.destination);});
  document.querySelector('#destination-list').innerHTML=locations.map(p=>`<button data-place="${p.id}" style="--destination:${p.color}"><i></i>${esc(p.name)}</button>`).join('');
  document.querySelector('#destination-list').onclick=e=>{const b=e.target.closest('[data-place]');if(b)choose(b.dataset.place);};
  window.addEventListener('gggc:factionchange',avatar);window.addEventListener('pagehide',()=>{clearInterval(travelTimer);if(traveling){traveling=false;position(current.x,current.y);render();}});avatar();position(current.x,current.y);choose(selected.id);
})();
