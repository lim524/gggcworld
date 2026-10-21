import {NOX_STONE,nearNoxStone} from './meadow-event.js';
/* UI for a fixed event. Opening/closing is free; only explicit AI questions call xAI. */
export function createStoneEvent({game,ui,canvas,getState,pause,resume,blocked,notice}){
 const inspect=document.createElement('button');inspect.className='stone-interact';inspect.hidden=true;inspect.textContent='보랏빛 돌 조사하기 · E';ui.append(inspect);
 const journal=document.createElement('button');journal.className='stone-journal';journal.hidden=true;journal.textContent='발견 기록 0 / 1';ui.append(journal);
 const dialog=document.createElement('dialog');dialog.className='stone-dialog';dialog.setAttribute('aria-labelledby','stone-title');
 dialog.innerHTML='<div class="stone-event-layout"><div class="stone-portrait" aria-hidden="true"><faction-sprite faction="nox"></faction-sprite></div><div class="stone-story"><span class="eyebrow">FIRST DISCOVERY</span><h2 id="stone-title">보랏빛 돌</h2><h3>녹스 · 자유와 변혁의 신</h3><p class="stone-opening"></p><details class="stone-facts"><summary>관찰한 사실</summary><ul></ul></details><div class="stone-messages" role="log" aria-label="녹스와의 이벤트 대화" aria-live="polite"></div></div></div><section class="stone-chat"><p class="stone-cost"></p><p class="stone-privacy">질문과 이 이벤트의 이전 대화는 xAI로 전송되고, 대화 기록은 계정에 저장됩니다.</p><p class="stone-key-note"><a href="/settings" target="_blank" rel="noopener">프로필에서 Grok API 키 관리 (새 탭)</a><button type="button" class="stone-refresh">키 상태 새로고침</button></p><div class="stone-choices" role="group" aria-label="녹스에게 질문하기"></div><form class="stone-question"><label for="stone-question-input">녹스에게 물어보기</label><div><input id="stone-question-input" maxlength="500" autocomplete="off" placeholder="이 돌에 대해 궁금한 점을 물어보세요"><button type="submit">AI 질문 보내기</button></div></form><p class="stone-message" role="status"></p></section><div class="stone-footer"><span>대화는 기록되며 아이템·재화 보상은 없습니다.</span><button type="button" class="pixel-button stone-finish">기록하고 돌아가기</button></div>';
 game.append(dialog);
 const log=document.createElement('dialog');log.className='stone-log';log.setAttribute('aria-labelledby','stone-log-title');
 log.innerHTML='<span class="eyebrow">DISCOVERY NOTES</span><h2 id="stone-log-title">나의 발견 기록</h2><div class="stone-log-content"></div><form method="dialog"><button class="pixel-button">닫기</button></form>';game.append(log);
 const message=dialog.querySelector('.stone-message'),input=dialog.querySelector('input'),finish=dialog.querySelector('.stone-finish');
 let data=null,pending=false,refreshing=false,draftRequest=null,generation=0;
 const canInteract=()=>{const s=getState();return s.active&&!s.motion&&s.chunk?.faction==='nox'&&nearNoxStone(s.cx,s.cy,s.player.x,s.player.y);};
 function position(action){const s=getState();return{action,storyId:s.storyId,cx:s.cx,cy:s.cy,x:s.player.x,y:s.player.y};}
 async function request(method='GET',body,ai=false){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ai?55000:15000);
  try{
   const response=await fetch('/api/world/events/nox-stone?storyId='+encodeURIComponent(getState().storyId),{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
   let result;try{result=await response.json();}catch{throw Error('응답을 확인하지 못했어요.');}
   if(!response.ok){const error=Error(result.error||'이벤트 요청을 완료하지 못했어요.');error.code=result.code;throw error;}
   return result;
  }catch(error){if(error.name==='AbortError')throw Error('응답 대기가 길어져 중단했어요. 자동으로 다시 보내지 않아요.');throw error;}finally{clearTimeout(timer);}
 }
 function controls(){
  const enabled=Boolean(data?.aiReady)&&data.turns<data.maxTurns&&!pending&&!refreshing;
  input.disabled=!enabled;dialog.querySelector('[type=submit]').disabled=!enabled;
  dialog.querySelectorAll('[data-stone-choice]').forEach(button=>button.disabled=!enabled);
  finish.disabled=pending||refreshing;inspect.disabled=pending||refreshing;journal.disabled=pending||refreshing;dialog.querySelector('.stone-refresh').disabled=pending||refreshing;
  finish.textContent=data?.found?'기록하고 돌아가기':'닫기';
  const ready=data?.aiReady,turns=data?.turns||0,limit=data?.maxTurns||8;
  dialog.querySelector('.stone-cost').textContent='AI 질문 '+turns+' / '+limit+' · '+(data?.model||'Grok')+' · 질문 전송 시 본인 API 사용료가 발생합니다.';
  dialog.querySelector('.stone-key-note').classList.toggle('key-needed',!ready);
  if(data&&turns>=limit)message.textContent='첫 이벤트의 AI 질문을 모두 사용했어요. 관찰 기록은 계속 볼 수 있습니다.';
 }
 function render(){
  dialog.querySelector('.stone-opening').textContent=data?.opening||NOX_STONE.opening;
  const facts=dialog.querySelector('.stone-facts ul');facts.replaceChildren();for(const fact of data?.facts||NOX_STONE.facts){const li=document.createElement('li');li.textContent=fact;facts.append(li);}
  const transcript=dialog.querySelector('.stone-messages');transcript.replaceChildren();for(const turn of data?.messages||[]){const row=document.createElement('p');row.className=turn.role==='user'?'stone-user':'stone-assistant';const speaker=document.createElement('strong');speaker.textContent=turn.role==='user'?'나':'녹스';const text=document.createElement('span');text.textContent=turn.content;row.append(speaker,text);transcript.append(row);}
  transcript.scrollTop=transcript.scrollHeight;
  const choices=dialog.querySelector('.stone-choices');choices.replaceChildren();for(const text of data?.choices||NOX_STONE.choices){const button=document.createElement('button');button.type='button';button.dataset.stoneChoice='';button.textContent=text;button.onclick=()=>ask(text);choices.append(button);}
  controls();update();
 }
 function update(){
  const s=getState(),isNox=s.active&&s.chunk?.faction==='nox';journal.hidden=!isNox;
  const journalText='발견 기록 '+(data?.found?'1':'0')+' / 1';if(journal.textContent!==journalText)journal.textContent=journalText;
  inspect.hidden=!isNox||!canInteract()||s.busy||Boolean(s.motion)||blocked()||dialog.open||log.open;
  const inspectText=(data?.inspected?'보랏빛 돌 다시 보기':'보랏빛 돌 조사하기')+' · E';if(inspect.textContent!==inspectText)inspect.textContent=inspectText;
 }
 async function refresh(){
  if(getState().chunk?.faction!=='nox'||pending||refreshing)return;
  const epoch=generation;refreshing=true;controls();
  try{const result=await request();if(epoch!==generation)return false;data=result;if(dialog.open){message.textContent=data.aiReady?'키 상태를 확인했어요. 질문을 보낼 수 있습니다.':'프로필에서 Grok API 키를 등록한 뒤 새로고침해주세요.';render();}update();return true;}catch(error){if(dialog.open)message.textContent=error.message;return false;}finally{if(epoch===generation){refreshing=false;controls();}}
 }
 async function open(){
  if(!canInteract()||blocked()||pending||refreshing||dialog.open)return;
  pause();message.textContent='돌을 살펴보고 있어요…';pending=true;render();dialog.showModal();
  try{data=await request('POST',position('open'));message.textContent=data.aiReady?'궁금한 점을 선택하거나 직접 질문해보세요.':'고정 안내는 무료로 볼 수 있어요. AI 대화에는 프로필의 Grok API 키가 필요합니다.';}catch(error){message.textContent=error.message;}
  finally{pending=false;render();}
 }
 async function ask(text){
  if(pending||refreshing||!dialog.open||!data?.aiReady||data.turns>=data.maxTurns)return;
  const content=text.trim();if(!content||content.length>500)return;
  if(!draftRequest||draftRequest.message!==content)draftRequest={message:content,id:crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('')};
  pending=true;message.textContent='녹스가 생각하고 있어요…';controls();
  try{data=await request('POST',{...position('chat'),message:content,requestId:draftRequest.id},true);draftRequest=null;input.value='';message.textContent=data.fallback?'세계의 규칙에 맞는 안내로 대신했어요.':'답변을 기록했어요.';render();}
  catch(error){if(['KEY_REQUIRED','KEY_REENTER','KEY_INVALID'].includes(error.code)&&data)data.aiReady=false;message.textContent=error.message;}
  finally{pending=false;controls();}
 }
 async function close(){
  if(pending||refreshing)return;
  if(!data?.found){dialog.close();return;}
  pending=true;controls();message.textContent='발견 기록을 저장하고 있어요…';
  try{data=await request('POST',position('complete'));dialog.close();notice('발견 기록에 ‘'+NOX_STONE.recordTitle+'’을 남겼어요.');}
  catch(error){message.textContent=error.message+' 발견 상태는 유지되며, 다시 저장할 수 있어요.';}
  finally{pending=false;controls();update();}
 }
 async function openLog(){
  if(pending||blocked())return;pause();log.showModal();const content=log.querySelector('.stone-log-content');content.textContent='기록을 불러오고 있어요.';
  const loaded=await refresh();content.replaceChildren();if(!loaded&&!data){content.textContent='발견 기록을 불러오지 못했어요. 잠시 후 다시 열어주세요.';return;}
  if(!data?.found){const p=document.createElement('p');p.textContent='아직 발견한 사건이 없어요. 황혼 초원의 시작 구역 (0, 0), 중앙 길가에 있는 보랏빛 돌을 찾아보세요.';content.append(p);return;}
  const title=document.createElement('h3');title.textContent=NOX_STONE.recordTitle;const meta=document.createElement('p');meta.textContent='시작 초원 (0, 0) · '+(data.inspected?'조사 기록 완료':'발견함');
  const text=document.createElement('p');text.textContent=NOX_STONE.facts.join(' ');
  content.append(title,meta,text);
  if(data.messages?.length){const saved=document.createElement('p');saved.textContent='저장된 대화 '+data.turns+'회 · 돌 옆에서 다시 열 수 있어요.';content.append(saved);}
 }
 inspect.onclick=open;journal.onclick=openLog;finish.onclick=close;
 dialog.querySelector('.stone-refresh').onclick=refresh;
 dialog.querySelector('.stone-question').onsubmit=event=>{event.preventDefault();ask(input.value);};
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{resume();update();});
 log.addEventListener('close',()=>{resume();update();});
 document.addEventListener('keydown',event=>{if(dialog.open||log.open||event.repeat||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(event.target.tagName))return;if((event.key.toLowerCase()==='e'||event.key==='Enter')&&canInteract()&&!blocked()){event.preventDefault();open();}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&dialog.open&&!pending)refresh();});
 return{update,refresh,openLog,reset(){generation++;data=null;draftRequest=null;refreshing=false;dialog.close();log.close();update();},get isOpen(){return dialog.open||log.open;},get progress(){return data;}};
}
