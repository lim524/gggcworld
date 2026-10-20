(() => {
  'use strict';
  const widget=document.querySelector('#world-companion');
  if(!widget)return;
  const toggle=widget.querySelector('.world-companion-toggle');
  const menu=widget.querySelector('.world-companion-menu');
  const collapse=widget.querySelector('.companion-collapse');
  const names={astra:['아스트라','GPT'],serin:['세린','CLAUDE'],lumi:['루미','GEMINI'],nox:['녹스','GROK']};
  let current='astra';
  function refresh() {
    let id='astra';try{id=JSON.parse(localStorage.getItem('gggc-profile-v1'))?.faction||'astra';}catch{}
    if(!names[id])id='astra';current=id;
    toggle.innerHTML=(id==='astra'?'<astra-sprite></astra-sprite>':`<img src="assets/${id}-sprite.webp" alt="">`)+`<span class="companion-label">${names[id][0]} · 메뉴</span>`;
    toggle.setAttribute('aria-label',`${names[id][0]} 지휘관 메뉴`);
    widget.querySelector('strong').textContent=`${names[id][0]} · ${names[id][1]}`;
  }
  function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}
  toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};
  collapse.onclick=()=>{const hidden=widget.classList.toggle('is-collapsed');collapse.textContent=hidden?'✦ 지휘관 펼치기':'접기';toggle.querySelector('astra-sprite')?.setPlaying(!hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches);close();};
  widget.querySelector('[data-companion-world]').onclick=()=>{close();document.querySelector('#world').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.querySelector(`[data-world-faction="${current}"]`)?.click();};
  widget.querySelector('[data-companion-board]').onclick=()=>{close();document.querySelector(`#faction-tabs [data-channel="${current}"]`)?.click();document.querySelector('.board').scrollIntoView({behavior:'instant'});};
  document.addEventListener('click',e=>{if(e.target.closest('[data-pick]'))refresh();if(!widget.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  window.addEventListener('storage',e=>{if(e.key==='gggc-profile-v1')refresh();});
  refresh();
})();
