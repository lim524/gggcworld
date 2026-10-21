/* Account-scoped, server-backed five-slot story selection. No paid AI calls. */
export function createStoryLibrary({api,onOpen}){
 const library=document.querySelector('#story-library'),slots=document.querySelector('#story-slots'),dialog=document.querySelector('#new-story-dialog'),form=document.querySelector('#new-story-form'),feedback=document.querySelector('#story-feedback');
 let selected='rin',busy=false,lastArchived=null,rows=[];
 const restore=document.querySelector('#restore-story');
 const choices=document.querySelector('#starter-choices');
 for(const character of globalThis.GGGCCharacters.all.filter(c=>c.role==='starter')){
  const label=document.createElement('label');label.className='starter-card';
  const radio=document.createElement('input');radio.type='radio';radio.name='starter';radio.value=character.id;radio.checked=character.id===selected;
  const img=document.createElement('img');img.src=character.portrait.src;img.alt=character.name+' · '+(character.id==='rin'?'여성':'남성')+' 시작 모험가';
  const name=document.createElement('strong');name.textContent=character.name;
  const text=document.createElement('span');text.textContent=character.id==='rin'?'여성 모험가':'남성 모험가';
  radio.onchange=()=>{selected=character.id;};label.append(radio,img,name,text);choices.append(label);
 }
 function controls(disabled){library.querySelectorAll('button').forEach(b=>b.disabled=disabled);form.querySelectorAll('button,input').forEach(b=>b.disabled=disabled);document.querySelector('#cancel-new-story').disabled=disabled;}
 function error(message){feedback.textContent=message;}
 async function load(){
  library.hidden=false;feedback.textContent='로그를 불러오고 있어요.';slots.replaceChildren();
  try{const data=await api('/api/stories');rows=data.stories;render();feedback.textContent=rows.length+' / 5개의 이야기를 저장했어요.';}catch(e){feedback.textContent=e.message;throw e;}
 }
 function render(){
  slots.replaceChildren();
  for(let slot=1;slot<=5;slot++){
   const story=rows.find(s=>s.slot===slot),card=document.createElement('article');card.className='story-slot';
   const tag=document.createElement('span');tag.className='slot-number';tag.textContent='LOG '+String(slot).padStart(2,'0');card.append(tag);
   if(story){
    const char=globalThis.GGGCCharacters.get(story.characterId),img=document.createElement('img');img.src=char.portrait.src;img.alt=char.name;card.append(img);
    const title=document.createElement('h2');title.textContent=story.title;
    const meta=document.createElement('p');meta.textContent=char.name+' · 구역 ('+story.cx+', '+story.cy+')';
    const time=document.createElement('small');time.textContent=new Date(story.updatedAt).toLocaleString('ko-KR');
    const actions=document.createElement('div');actions.className='slot-actions';
    const open=document.createElement('button');open.textContent='이어하기';open.onclick=async()=>{if(busy)return;busy=true;controls(true);try{await onOpen(story.id);library.hidden=true;}catch(e){error(e.message);}finally{busy=false;controls(false);}};
    const remove=document.createElement('button');remove.textContent='로그 지우기';remove.className='archive-story';remove.onclick=async()=>{if(busy||!confirm('“'+story.title+'” 로그를 저장 슬롯에서 지울까요? 방금 지운 로그는 복원할 수 있어요.'))return;busy=true;controls(true);try{await api('/api/stories/'+story.id,'DELETE',{});lastArchived=story.id;restore.hidden=false;await load();}catch(e){error(e.message);}finally{busy=false;controls(false);}};
    actions.append(open,remove);card.append(title,meta,time,actions);
   }else{
    card.classList.add('empty');const title=document.createElement('h2');title.textContent='아직 쓰이지 않은 이야기';const text=document.createElement('p');text.textContent='새로운 여정을 시작하세요.';
    const add=document.createElement('button');add.textContent='+ 새 이야기';add.onclick=()=>{document.querySelector('#new-story-name').value='나의 '+slot+'번째 이야기';dialog.showModal();};card.append(title,text,add);
   }
   slots.append(card);
  }
 }
 form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;controls(true);const err=form.querySelector('[role=alert]');err.textContent='';let created;
  try{const result=await api('/api/stories','POST',{characterId:selected,title:document.querySelector('#new-story-name').value});created=result.story;dialog.close();await onOpen(created.id);library.hidden=true;}
  catch(e){if(created){await load();feedback.textContent='로그가 만들어졌어요. 이어하기로 다시 입장해주세요. '+e.message;}else err.textContent=e.message;}
  finally{busy=false;controls(false);}
 };
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 document.querySelector('#cancel-new-story').onclick=()=>{if(!busy)dialog.close();};
 restore.onclick=async()=>{if(busy||!lastArchived)return;busy=true;controls(true);try{await api('/api/stories/'+lastArchived+'/restore','POST',{});restore.hidden=true;lastArchived=null;await load();}catch(e){error(e.message);}finally{busy=false;controls(false);}};
 return{show:load,hide(){library.hidden=true;},get visible(){return !library.hidden;}};
}
