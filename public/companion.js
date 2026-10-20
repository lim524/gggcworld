(() => {
  'use strict';
  const widget=document.querySelector('#world-companion');
  if(!widget)return;
  const toggle=widget.querySelector('.world-companion-toggle');
  const menu=widget.querySelector('.world-companion-menu');
  const collapse=widget.querySelector('.companion-collapse');
  const names={astra:['아스트라','GPT'],serin:['세린','CLAUDE'],lumi:['루미','GEMINI'],nox:['녹스','GROK']};
  const gods={astra:'지혜와 창조의 신',serin:'조화와 기록의 신',lumi:'별과 탐구의 신',nox:'자유와 변혁의 신'};
  let current='astra';
  function refresh() {
    let id='astra';try{id=JSON.parse(localStorage.getItem('gggc-profile-v1'))?.faction||'astra';}catch{}
    if(!names[id])id='astra';current=id;
    toggle.innerHTML=`<faction-sprite faction="${id}"></faction-sprite>`+`<span class="companion-label">${names[id][0]} · 메뉴</span>`;
    toggle.setAttribute('aria-label',`${names[id][0]} 수호신 메뉴`);
    widget.querySelector('a[href*="sprite-lab"]').href=`sprite-lab.html?faction=${id}`;
    widget.querySelector('[data-companion-world]').href='/adventure?faction='+id;
    widget.querySelector('strong').textContent=`${names[id][0]} · ${gods[id]}`;
  }
  function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}
  toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};
  collapse.onclick=()=>{const hidden=widget.classList.toggle('is-collapsed');collapse.textContent=hidden?'✦ 수호신 펼치기':'접기';toggle.querySelector('faction-sprite')?.setPlaying(!hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches);close();};
  widget.querySelector('[data-companion-world]').onclick=close;
  widget.querySelector('[data-companion-board]').onclick=()=>{close();if(!document.querySelector('.board')){location.assign('/?channel='+current+'#board');return;}document.querySelector(`#faction-tabs [data-channel="${current}"]`)?.click();document.querySelector('.board').scrollIntoView({behavior:'instant'});};
  document.addEventListener('click',e=>{if(e.target.closest('[data-pick]'))refresh();if(!widget.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  window.addEventListener('gggc:factionchange',refresh);
  window.addEventListener('storage',e=>{if(e.key==='gggc-profile-v1')refresh();});
  refresh();
})();
