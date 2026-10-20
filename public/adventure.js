/* Adventure shell. Exploration owns the opening event and character movement. */
(() => {
 'use strict';
 const game=document.querySelector('#game'),settings=document.querySelector('#settings-dialog');
 document.querySelector('#game-settings').onclick=()=>settings.showModal();
 const full=document.querySelector('#game-fullscreen');
 if(!document.fullscreenEnabled||!game.requestFullscreen)full.hidden=true;
 full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await game.requestFullscreen();}catch{document.querySelector('#game-status').textContent='이 브라우저에서는 전체화면 전환을 사용할 수 없어요.';}};
 document.addEventListener('fullscreenchange',()=>{const active=Boolean(document.fullscreenElement);full.textContent=active?'전체화면 해제':'전체화면';full.setAttribute('aria-pressed',String(active));});
 function syncMotion(){document.querySelectorAll('faction-sprite').forEach(sprite=>sprite.setPlaying(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches));}
 document.addEventListener('visibilitychange',syncMotion);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',syncMotion);customElements.whenDefined('faction-sprite').then(syncMotion);
})();
