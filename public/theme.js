/* Theme preferences are cosmetic and follow the browser-local profile. */
(() => {
  'use strict';
  const factions = {astra:'GPT · 초록',serin:'Claude · 빨강',lumi:'Gemini · 파랑',nox:'Grok · 보라'};
  const read = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
  const chosenFaction = () => {
    const id=read('gggc-profile-v1',{}).faction;
    return Object.hasOwn(factions,id)?id:null;
  };
  const allowed = value => value==='white'||value==='dark'||Boolean(chosenFaction()&&value===chosenFaction());
  let theme=read('gggc-theme-v1','white');
  function apply(value,save=false) {
    theme=allowed(value)?value:'white';
    document.documentElement.dataset.theme=theme;
    document.documentElement.style.colorScheme=theme==='dark'?'dark':'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#15171c':'#ffffff');
    if(save) {try {localStorage.setItem('gggc-theme-v1',JSON.stringify(theme));} catch {}}
  }
  apply(theme);
  function refresh() {
    apply(theme,true);
    const select=document.querySelector('#site-theme');
    if(!select)return;
    select.replaceChildren();
    const choices=[['white','화이트'],['dark','다크']];
    const id=chosenFaction();
    if(id)choices.push([id,factions[id]]);
    choices.forEach(([value,label])=>select.add(new Option(label,value)));
    select.value=theme;
    const hint=document.querySelector('#theme-hint');
    if(hint)hint.textContent=id?'선택한 신의 색상 테마를 사용할 수 있어요.':'신을 선택하면 해당 진영의 색상 테마가 열려요.';
  }
  function connect() {
    refresh();
    document.querySelector('#site-theme')?.addEventListener('change',event=>{apply(event.target.value,true);refresh();});
    window.addEventListener('gggc:factionchange',refresh);
    window.addEventListener('storage',event=>{
      if(event.key==='gggc-theme-v1')theme=read('gggc-theme-v1','white');
      if(event.key===null)theme='white';
      if(event.key===null||event.key==='gggc-theme-v1'||event.key==='gggc-profile-v1')refresh();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});else connect();
})();
