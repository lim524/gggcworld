/* Guardian browsing is cosmetic; joining always uses the existing account flow. */
(() => {
 'use strict';
 const {all,get}=globalThis.GGGCGuardians;
 const tabs=document.querySelector('#guardian-tabs'),panel=document.querySelector('#guardian-panel');
 let selected=get(new URL(location.href).searchParams.get('guardian'))||get(profile?.faction)||all[0];
 const text=(id,value)=>{document.getElementById(id).textContent=value;};
 function updateActions(){
  const join=document.getElementById('guardian-join'),adventure=document.getElementById('guardian-adventure'),note=document.getElementById('guardian-account-note');
  const member=account.user?.profile;
  join.hidden=Boolean(member);adventure.hidden=!member;join.disabled=account.loading;
  if(member){
   const own=get(member.faction);if(!own){adventure.hidden=true;note.textContent='프로필 설정에서 계정 상태를 확인해주세요.';return;}
   adventure.href='/adventure?faction='+own.id;
   adventure.textContent=own.name+'와 모험하기 (새 탭)';
   note.textContent=own.id===selected.id?'당신과 함께하는 수호신이에요. 모험은 새 탭에서 시작합니다.':'현재 '+own.name+' 진영으로 확정되어 있어요. 다른 수호신의 소개도 자유롭게 볼 수 있습니다.';
  }else{
   join.textContent=account.loading?'로그인 상태 확인 중':account.user?'이 수호신과 시작하기':'로그인하고 함께하기';
   note.textContent='소개를 둘러보는 것으로 진영이 바뀌지는 않아요. 가입 시 선택한 진영은 확정되며, 해당 제공자의 API 키만 등록할 수 있습니다.';
  }
 }
 function render(){
  const g=selected;panel.style.setProperty('--guardian-color',g.color);
  tabs.replaceChildren();
  for(const item of all){
   const button=document.createElement('button');button.type='button';button.id='guardian-tab-'+item.id;button.dataset.guardian=item.id;
   button.setAttribute('role','tab');button.setAttribute('aria-controls','guardian-panel');button.setAttribute('aria-selected',String(item.id===g.id));button.tabIndex=item.id===g.id?0:-1;
   const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');dot.style.background=item.color;
   const label=document.createElement('span');label.textContent=item.name+' · '+item.ai;button.append(dot,label);tabs.append(button);
  }
  panel.setAttribute('aria-labelledby','guardian-tab-'+g.id);
  text('guardian-title',g.ai+' · '+g.god);text('guardian-name',g.name);text('guardian-quote','“'+g.quote+'”');
  text('guardian-intro',g.intro);text('guardian-place',g.place);text('guardian-prop',g.prop);text('guardian-tags',g.tags.join(' · '));text('guardian-bond',g.bond);
  text('guardian-lore-heading',g.name+'의 이야기');text('guardian-belief',g.belief);text('guardian-prop-meaning',g.propMeaning);text('guardian-weakness',g.weakness);
  const background=document.getElementById('guardian-background');background.replaceChildren();
  for(const paragraph of g.story){const p=document.createElement('p');p.textContent=paragraph;background.append(p);}
  const art=document.getElementById('guardian-artwork');art.replaceChildren();
  const sprite=document.createElement('faction-sprite');sprite.setAttribute('faction',g.id);sprite.setAttribute('still','');sprite.setAttribute('aria-hidden','true');
  const caption=document.createElement('figcaption');caption.textContent=g.name+' · '+g.god;art.append(sprite,caption);
  const board=document.getElementById('guardian-board');board.href='/?channel='+g.id+'#board';board.textContent=g.ai+' 진영 둘러보기';
  document.title=g.name+' · 수호신 소개 · GGGC';
  document.querySelector('meta[name="description"]').setAttribute('content',g.intro);
  updateActions();
 }
 function select(id,{push=false,focus=false}={}){
  selected=get(id)||all[0];render();
  if(push){const url=new URL(location.href);url.searchParams.set('guardian',selected.id);history.pushState(null,'',url.pathname+url.search+url.hash);}
  if(focus)document.getElementById('guardian-tab-'+selected.id).focus();
 }
 tabs.addEventListener('click',event=>{const button=event.target.closest('[data-guardian]');if(button)select(button.dataset.guardian,{push:true,focus:true});});
 tabs.addEventListener('keydown',event=>{
  const button=event.target.closest('[data-guardian]');if(!button)return;
  const index=all.findIndex(g=>g.id===button.dataset.guardian);let next;
  if(event.key==='ArrowRight')next=(index+1)%all.length;
  if(event.key==='ArrowLeft')next=(index+all.length-1)%all.length;
  if(event.key==='Home')next=0;if(event.key==='End')next=all.length-1;
  if(next!==undefined){event.preventDefault();select(all[next].id,{push:true,focus:true});}
 });
 document.getElementById('guardian-join').onclick=()=>{
  if(account.loading)return;showAccount();
  if(account.user&&!account.user.profile){const select=document.querySelector('#account-faction');if(select)select.value=selected.id;}
 };
 window.addEventListener('popstate',()=>select(get(new URL(location.href).searchParams.get('guardian'))?.id||get(profile?.faction)?.id||all[0].id));
 window.addEventListener('gggc:accountchange',updateActions);
 accountReady.then(updateActions);
 render();
})();
