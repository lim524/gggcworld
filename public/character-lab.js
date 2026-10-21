/* Read-only asset preview. This page never grants characters or spends currency. */
(() => {
 'use strict';
 const character=globalThis.GGGCCharacters.get(new URL(location.href).searchParams.get('character'))||globalThis.GGGCCharacters.all[0];
 let idle=character.animations.idle;
 const canvas=document.getElementById('character-sprite');
 const play=document.getElementById('character-play'),speedInput=document.getElementById('character-speed'),status=document.getElementById('frame-status'),error=document.getElementById('character-error');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),image=new Image();
 let ready=false,playing=!reduced.matches,frame=0,speed=1,raf=0,last=0,elapsed=0,offscreen=false;
 const buttons=[],thumbnails=[];
 function fail(message){playing=false;error.textContent=message;sync();}
 document.getElementById('character-name').textContent=character.name;
 document.title=character.name+' · 모험가 제작실';
 canvas.setAttribute('aria-label','모험가 '+character.name+'의 32프레임 도트 대기 동작');
 document.getElementById('character-description').textContent=character.description;
 document.getElementById('character-quote').textContent='“'+character.quote+'”';
 const portrait=document.getElementById('character-portrait');portrait.src=character.portrait.src;portrait.alt=character.portrait.alt;
 portrait.width=character.portrait.width;portrait.height=character.portrait.height;
 portrait.addEventListener('error',()=>{error.textContent='프로필 일러스트를 불러오지 못했어요. 새로고침해주세요.';});
 document.getElementById('download-portrait').href=character.portrait.src;document.getElementById('download-sheet').href=idle.src;
 function draw(target,index){
  const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);c.imageSmoothingEnabled=false;
  c.drawImage(image,index%idle.columns*idle.tileWidth,Math.floor(index/idle.columns)*idle.tileHeight,idle.tileWidth,idle.tileHeight,0,0,target.width,target.height);
 }
 function show(){
  if(!ready)return;draw(canvas,frame);status.textContent='FRAME '+String(frame+1).padStart(2,'0')+' / 32';
  buttons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===frame)));
 }
 function loop(now){
  raf=0;if(!ready||!playing||document.hidden||offscreen)return;
  if(last){elapsed+=now-last;if(elapsed>=idle.frameDuration/speed){const steps=Math.floor(elapsed/(idle.frameDuration/speed));frame=(frame+steps)%32;elapsed%=idle.frameDuration/speed;show();}}
  last=now;raf=requestAnimationFrame(loop);
 }
 function sync(){
  cancelAnimationFrame(raf);raf=0;last=0;elapsed=0;play.disabled=!ready;speedInput.disabled=!ready;
  play.setAttribute('aria-pressed',String(playing));play.textContent=playing?'일시정지':'재생';
  if(playing&&ready&&!document.hidden&&!offscreen)raf=requestAnimationFrame(loop);
 }
 if(idle.frameCount!==32||idle.columns*idle.rows!==32){fail('이 캐릭터의 32프레임 설정을 확인해주세요.');return;}
 const picker=document.createElement('select');picker.setAttribute('aria-label','미리볼 캐릭터 동작');
 for(const [value,text]of [['idle','정면 대기'],['down','아래로 걷기'],['up','위로 걷기'],['left','왼쪽으로 걷기'],['right','오른쪽으로 걷기']]){const option=document.createElement('option');option.value=value;option.textContent=text;picker.append(option);}
 document.querySelector('.character-playback').prepend(picker);
 picker.onchange=()=>{idle=picker.value==='idle'?character.animations.idle:character.animations.walk[picker.value];ready=false;frame=0;sync();buttons.forEach(b=>b.disabled=true);image.src=idle.src;document.getElementById('download-sheet').href=idle.src;canvas.setAttribute('aria-label',character.name+' '+picker.selectedOptions[0].textContent+' 32프레임');};
 const group=document.getElementById('character-frame-buttons'),gallery=document.getElementById('character-frame-gallery');
 for(let i=0;i<32;i++){
  const button=document.createElement('button');button.type='button';button.textContent=String(i+1).padStart(2,'0');button.setAttribute('aria-label',(i+1)+'번 프레임');button.setAttribute('aria-pressed','false');button.disabled=true;
  button.onclick=()=>{playing=false;frame=i;show();sync();};group.append(button);buttons.push(button);
  const figure=document.createElement('figure'),tile=document.createElement('canvas'),caption=document.createElement('figcaption');tile.width=idle.tileWidth;tile.height=idle.tileHeight;tile.setAttribute('aria-hidden','true');caption.textContent='FRAME '+String(i+1).padStart(2,'0');figure.append(tile,caption);gallery.append(figure);thumbnails.push(tile);
 }
 play.onclick=()=>{playing=!playing;sync();};speedInput.onchange=()=>{const value=Number(speedInput.value);speed=[0.5,1,2].includes(value)?value:1;sync();};
 image.onload=()=>{
  if(image.naturalWidth!==idle.columns*idle.tileWidth||image.naturalHeight!==idle.rows*idle.tileHeight){fail('도트 시트 크기가 설정과 달라요.');return;}
  ready=true;buttons.forEach(button=>button.disabled=false);thumbnails.forEach((tile,index)=>draw(tile,index));show();sync();
 };
 image.onerror=()=>fail('도트 캐릭터를 불러오지 못했어요. 새로고침해주세요.');image.src=idle.src;
 document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});window.addEventListener('pageshow',sync);
 reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;sync();}});
 if(typeof IntersectionObserver!=='undefined'){new IntersectionObserver(entries=>{offscreen=!entries[0].isIntersecting;sync();}).observe(canvas);}
 sync();
})();
