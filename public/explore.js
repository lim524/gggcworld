import {MAP_WIDTH,MAP_HEIGHT,REGION_LIMIT,REGION_NAMES,walkable} from './worldgen.js';
/* Four reusable pixel assets. Terrain has no AI/API image generation cost. */
let tint={},colors={grass:'#78a84b',dirt:'#cba36a'};
function asset(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');paint({fillRect:(...args)=>c.fillRect(...args),set fillStyle(value){c.fillStyle=tint[value]||value;}});return canvas;}
function tiles(faction='nox'){
 const palettes={
 nox:{'#78a84b':'#6f687e','#cba36a':'#b49c9c','#8bb953':'#857a96','#648f3e':'#5c566e','#81ae4f':'#7c728b','#ba915d':'#99838d','#dbb67c':'#c9b6b0','#244e38':'#322c49','#356b3e':'#4b3c63','#4e8942':'#725383','#75a54b':'#ac87b3','#5f9747':'#8d689f','#565f59':'#514d65','#808b7e':'#80758f','#adb49f':'#b5abc5','#687367':'#655d78'},
 serin:{'#244e38':'#603c35','#356b3e':'#924d3a','#4e8942':'#bb6844','#75a54b':'#e5a35e','#5f9747':'#cf8250'},
 lumi:{'#244e38':'#24495a','#356b3e':'#35687a','#4e8942':'#4d8d91','#75a54b':'#8bb5af','#5f9747':'#6da4a8'},
 astra:{}
 };
 tint=palettes[faction]||{};colors={grass:tint['#78a84b']||'#78a84b',dirt:tint['#cba36a']||'#cba36a'};
 const grass=asset(32,32,c=>{c.fillStyle=colors.grass;c.fillRect(0,0,32,32);for(const [x,y]of[[3,6],[20,3],[12,22],[27,18]]){c.fillStyle='#8bb953';c.fillRect(x,y,3,1);c.fillStyle='#648f3e';c.fillRect(x+1,y-1,1,2);}c.fillStyle='#81ae4f';c.fillRect(7,13,2,1);c.fillRect(23,28,2,1);});
 const dirt=asset(32,32,c=>{c.fillStyle=colors.dirt;c.fillRect(0,0,32,32);for(const [x,y]of[[5,7],[22,4],[13,20],[27,26]]){c.fillStyle='#ba915d';c.fillRect(x,y,2,1);c.fillStyle='#dbb67c';c.fillRect(x-1,y+1,2,1);}});
 const tree=asset(32,48,c=>{c.fillStyle='#284b3738';c.fillRect(5,42,23,4);c.fillStyle='#62442f';c.fillRect(13,28,7,16);c.fillStyle='#99613b';c.fillRect(15,28,3,14);c.fillStyle='#244e38';for(const[x,y,w,h]of[[7,5,19,25],[3,14,26,17],[8,29,18,7]])c.fillRect(x,y,w,h);c.fillStyle='#356b3e';c.fillRect(7,8,18,21);c.fillRect(4,17,23,10);c.fillStyle='#4e8942';c.fillRect(9,6,13,16);c.fillRect(6,15,13,9);c.fillRect(19,18,7,8);c.fillStyle='#75a54b';c.fillRect(11,7,9,5);c.fillRect(7,16,7,5);c.fillStyle='#5f9747';c.fillRect(16,12,7,7);c.fillRect(10,26,9,5);});
 const rock=asset(32,32,c=>{c.fillStyle='#284b3738';c.fillRect(5,25,23,4);c.fillStyle='#565f59';c.fillRect(5,16,23,10);c.fillRect(9,10,15,16);c.fillStyle='#808b7e';c.fillRect(7,16,18,8);c.fillRect(10,11,12,12);c.fillStyle='#adb49f';c.fillRect(11,11,9,4);c.fillRect(8,17,6,4);c.fillStyle='#687367';c.fillRect(19,17,7,7);});
 return{grass,dirt,tree,rock};
}
let art=tiles('nox');const game=document.querySelector('#game'),status=document.querySelector('#game-status'),settings=document.querySelector('#settings-dialog');
const ui=document.createElement('section');ui.className='explore-screen';ui.hidden=true;ui.setAttribute('aria-label','초원 탐험');
ui.innerHTML='<canvas id="explore-canvas" tabindex="0" role="img" aria-label="초원 지도. 방향키 또는 WASD로 이동하세요."></canvas><div class="explore-hud"><span class="explore-eyebrow">FACTION MEADOW</span><h2 id="explore-region"></h2><p id="explore-coordinate"></p><small id="explore-discovery"></small></div><button class="explore-return" id="leave-exploration">이야기로</button><p class="explore-notice" id="explore-notice" role="status"></p><div class="explore-help">PC 방향키 · WASD / 모바일 스와이프 · 방향패드<span>나무·돌은 통과할 수 없어요. 열린 길 끝에서 다음 구역으로 이동해요.</span></div><div class="explore-pad" role="group" aria-label="이동 방향패드"><button data-dir="up" aria-label="위로 이동">▲</button><button data-dir="left" aria-label="왼쪽으로 이동">◀</button><span></span><button data-dir="right" aria-label="오른쪽으로 이동">▶</button><button data-dir="down" aria-label="아래로 이동">▼</button></div><div class="explore-loading" hidden role="status">다음 초원을 불러오고 있어요…</div>';
game.append(ui);
const canvas=ui.querySelector('canvas'),ctx=canvas.getContext('2d');
const launch=document.createElement('button');launch.id='open-exploration';launch.textContent='초원 탐험';game.querySelector('.game-bar>div').prepend(launch);
const directions={up:[0,-1],left:[-1,0],right:[1,0],down:[0,1]};
const keyDirections={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
let active=false,busy=false,user=null,chunk=null,cx=0,cy=0,player={x:16,y:12},motion=null,frame=0,lastMove=0,lastSave=0;
let heldKeys=[],padDirection=null,swipe=null,avatar=null,lastSpriteFrame=-1,previousTitle=false;
let viewport={w:1,h:1,dpr:1},raf=0,storageKey='';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function notice(text){const node=ui.querySelector('#explore-notice');if(node.textContent!==text)node.textContent=text;}
function clearHeld(){heldKeys=[];padDirection=null;swipe=null;}
function save(){if(!user||!chunk)return;try{localStorage.setItem(storageKey,JSON.stringify({cx,cy,x:player.x,y:player.y}));}catch{}}
async function api(path,method='GET',body){
 const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{throw Error('서버 응답을 확인하지 못했어요.');}
 if(!response.ok){const error=Error(data.error||'초원을 불러오지 못했어요.');error.status=response.status;throw error;}return data;
}
function showLogin(message){
 status.textContent=message+' ';const link=document.createElement('a');link.href='/settings';link.textContent='프로필 설정으로';link.style.textDecoration='underline';status.append(link);
}
function resize(){const rect=canvas.getBoundingClientRect();viewport={w:rect.width,h:rect.height,dpr:Math.min(devicePixelRatio||1,2)};canvas.width=Math.max(1,Math.round(rect.width*viewport.dpr));canvas.height=Math.max(1,Math.round(rect.height*viewport.dpr));}
new ResizeObserver(()=>{if(active)resize();}).observe(canvas);
function updateHud(data){
 ui.querySelector('#explore-region').textContent=data.region;
 ui.querySelector('#explore-coordinate').textContent='구역 '+cx+', '+cy+' · '+(cx===0&&cy===0?'시작 초원':'진영 탐험지');
 ui.querySelector('#explore-discovery').textContent='최초 발견 · '+data.discoveredBy;
 canvas.setAttribute('aria-label',data.region+' 지도. 구역 '+cx+', '+cy+'. 방향키, WASD 또는 스와이프로 이동하세요.');
}
async function loadRegion(x,y){
 if(Math.abs(x)>REGION_LIMIT||Math.abs(y)>REGION_LIMIT)throw Error('지금은 이 지역의 탐험 경계까지 왔어요.');
 return api('/api/world/chunks','POST',{x,y});
}
async function start(){
 if(active||busy)return;busy=true;launch.disabled=true;status.textContent='내 진영의 초원을 불러오고 있어요.';
 try{
  const data=await api('/api/me');if(!data.user?.profile){showLogin('로그인하고 진영을 확정하면 초원을 탐험할 수 있어요.');return;}user=data.user;
  storageKey='gggc-explorer-v1:'+user.id;
  let saved;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
  const valid=saved&&[saved.cx,saved.cy,saved.x,saved.y].every(Number.isInteger)&&Math.abs(saved.cx)<=REGION_LIMIT&&Math.abs(saved.cy)<=REGION_LIMIT;
  cx=valid?saved.cx:0;cy=valid?saved.cy:0;
  const region=await loadRegion(cx,cy);chunk=region.chunk;art=tiles(chunk.faction);ui.dataset.faction=chunk.faction;
  player=valid&&walkable(chunk,saved.x,saved.y)?{x:saved.x,y:saved.y}:{x:Math.floor(MAP_WIDTH/2),y:Math.floor(MAP_HEIGHT/2)};
  avatar?.remove();avatar=document.createElement('faction-sprite');avatar.setAttribute('faction',chunk.faction);avatar.setAttribute('still','');avatar.className='explore-avatar-source';avatar.setAttribute('aria-hidden','true');game.append(avatar);lastSpriteFrame=-1;
  previousTitle=!document.querySelector('#title-screen').hidden;
  document.querySelector('#title-screen').hidden=true;document.querySelector('#opening-scene').hidden=true;
  active=true;motion=null;game.classList.add('exploring');ui.hidden=false;status.textContent='';clearHeld();notice('길을 따라 나의 진영을 둘러보세요.');
  updateHud(region);resize();canvas.focus();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);save();
 }catch(error){if(error.status===401||error.status===403)showLogin(error.message);else status.textContent=error.message;}finally{busy=false;launch.disabled=false;}
}
function stop(){
 if(busy)return;save();active=false;motion=null;clearHeld();cancelAnimationFrame(raf);ui.hidden=true;game.classList.remove('exploring');avatar?.remove();avatar=null;
 document.querySelector('#title-screen').hidden=!previousTitle;document.querySelector('#opening-scene').hidden=previousTitle;launch.focus();
}
async function step(direction,now){
 if(!active||busy||motion||settings.open)return;
 const [dx,dy]=directions[direction],x=player.x+dx,y=player.y+dy;lastMove=now;
 if(x<0||y<0||x>=MAP_WIDTH||y>=MAP_HEIGHT){
  busy=true;clearHeld();ui.querySelector('.explore-loading').hidden=false;
  try{
   const nextCX=cx+(x<0?-1:x>=MAP_WIDTH?1:0),nextCY=cy+(y<0?-1:y>=MAP_HEIGHT?1:0);
   const data=await loadRegion(nextCX,nextCY);
   const target={x:(x+MAP_WIDTH)%MAP_WIDTH,y:(y+MAP_HEIGHT)%MAP_HEIGHT};
   if(!walkable(data.chunk,target.x,target.y))throw Error('다음 지역의 길이 막혀 있어 이동하지 않았어요.');
   chunk=data.chunk;cx=nextCX;cy=nextCY;player=target;motion=null;updateHud(data);notice('새 구역에 들어왔어요.');save();
  }catch(error){notice(error.message);if(error.status===401||error.status===403)showLogin(error.message);}finally{busy=false;ui.querySelector('.explore-loading').hidden=true;}
  return;
 }
 if(!walkable(chunk,x,y)){notice(chunk.objects[y*MAP_WIDTH+x]===1?'나무가 있어 지나갈 수 없어요.':'돌이 있어 지나갈 수 없어요.');return;}
 notice('');motion={from:{...player},to:{x,y},started:now,duration:reduced.matches?1:150};
}
function draw(time){
 if(!chunk||!viewport.w)return;
 const tile=viewport.w<700||viewport.h<500?32:64,scale=tile/32;
 const t=motion?Math.min(1,(time-motion.started)/motion.duration):0;
 const position=motion?{x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t}:player;
 const width=chunk.width*tile,height=chunk.height*tile;
 const cameraX=Math.max(0,Math.min(width-viewport.w,(position.x+.5)*tile-viewport.w/2));
 const cameraY=Math.max(0,Math.min(height-viewport.h,(position.y+.5)*tile-viewport.h/2));
 const offsetX=Math.round(width<viewport.w?(viewport.w-width)/2:-cameraX),offsetY=Math.round(height<viewport.h?(viewport.h-height)/2:-cameraY);
 ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#254231';ctx.fillRect(0,0,viewport.w,viewport.h);
 const fromX=Math.max(0,Math.floor(-offsetX/tile)),toX=Math.min(chunk.width-1,Math.ceil((viewport.w-offsetX)/tile));
 const fromY=Math.max(0,Math.floor(-offsetY/tile)-1),toY=Math.min(chunk.height-1,Math.ceil((viewport.h-offsetY)/tile)+1);
 for(let y=fromY;y<=toY;y++)for(let x=fromX;x<=toX;x++){const i=y*chunk.width+x,px=offsetX+x*tile,py=offsetY+y*tile;ctx.drawImage(chunk.ground[i]===1?art.dirt:art.grass,px,py,tile,tile);
  // Small stepped grass overlaps soften the otherwise square dirt borders.
  if(chunk.ground[i]===1){ctx.fillStyle=colors.grass;const edge=(xx,yy)=>xx>=0&&yy>=0&&xx<chunk.width&&yy<chunk.height&&chunk.ground[yy*chunk.width+xx]===0;if(edge(x,y-1))for(let k=0;k<4;k++)ctx.fillRect(px+k*8*scale,py,(k%2?5:3)*scale,2*scale);if(edge(x-1,y))ctx.fillRect(px,py+8*scale,2*scale,8*scale);if(edge(x,y+1))ctx.fillRect(px+8*scale,py+tile-2*scale,7*scale,2*scale);if(edge(x+1,y))ctx.fillRect(px+tile-2*scale,py+18*scale,2*scale,6*scale);}
 }
 const spriteFrame=reduced.matches?0:Math.floor(time/90)%32;if(avatar?.ready&&spriteFrame!==lastSpriteFrame){avatar.setFrame(spriteFrame);lastSpriteFrame=spriteFrame;}
 for(let y=fromY;y<=toY;y++){
  for(let x=fromX;x<=toX;x++){const object=chunk.objects[y*chunk.width+x],px=offsetX+x*tile,py=offsetY+y*tile;if(object===1)ctx.drawImage(art.tree,px,py-16*scale,tile,48*scale);else if(object===2)ctx.drawImage(art.rock,px,py,tile,tile);}
  if(y===Math.floor(position.y)){
   const px=offsetX+(position.x+.5)*tile,py=offsetY+(position.y+1)*tile,bob=motion&&!reduced.matches?Math.sin(t*Math.PI)*2*scale:0;
   ctx.fillStyle='#1b392d55';ctx.beginPath();ctx.ellipse(px,py-3*scale,9*scale,3*scale,0,0,Math.PI*2);ctx.fill();
   if(avatar?.ready&&avatar.canvas)ctx.drawImage(avatar.canvas,Math.round(px-12*scale),Math.round(py-28*scale-bob),24*scale,28*scale);
   else{ctx.fillStyle='#f7eac4';ctx.fillRect(px-5*scale,py-18*scale,10*scale,15*scale);}
  }
 }
}
function loop(now){
 if(!active)return;
 if(!document.hidden){
  if(motion&&now-motion.started>=motion.duration){player={...motion.to};motion=null;if(now-lastSave>1000){save();lastSave=now;}}
  if(!settings.open){const direction=padDirection||heldKeys[heldKeys.length-1];if(direction&&now-lastMove>165)step(direction,now);}
  draw(now);
 }
 raf=requestAnimationFrame(loop);
}
document.addEventListener('keydown',event=>{
 if(!active||settings.open||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
 const key=event.key.length===1?event.key.toLowerCase():event.key,direction=keyDirections[key];if(!direction)return;event.preventDefault();
 if(!heldKeys.includes(direction))heldKeys.push(direction);
 if(!event.repeat)step(direction,performance.now());
});
document.addEventListener('keyup',event=>{const key=event.key.length===1?event.key.toLowerCase():event.key,direction=keyDirections[key];if(direction)heldKeys=heldKeys.filter(d=>d!==direction);});
ui.querySelectorAll('[data-dir]').forEach(button=>{
 button.addEventListener('pointerdown',event=>{event.preventDefault();if(!active)return;button.setPointerCapture(event.pointerId);padDirection=button.dataset.dir;step(padDirection,performance.now());});
 const release=()=>{padDirection=null;};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
 // Keyboard and screen-reader activation can also move one tile.
 button.addEventListener('click',event=>{if(event.detail===0)step(button.dataset.dir,performance.now());});
});
canvas.addEventListener('pointerdown',event=>{if(!active||settings.open)return;canvas.focus();canvas.setPointerCapture(event.pointerId);swipe={x:event.clientX,y:event.clientY};});
canvas.addEventListener('pointermove',event=>{if(!swipe)return;const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;const direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';step(direction,performance.now());swipe={x:event.clientX,y:event.clientY};});
canvas.addEventListener('pointerup',()=>{swipe=null;});canvas.addEventListener('pointercancel',()=>{swipe=null;});
window.addEventListener('blur',clearHeld);document.addEventListener('visibilitychange',()=>{clearHeld();if(document.hidden)save();});
window.addEventListener('pagehide',()=>{save();clearHeld();cancelAnimationFrame(raf);});window.addEventListener('pageshow',()=>{if(active){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}});
settings.addEventListener('close',()=>{clearHeld();if(active)canvas.focus();});settings.addEventListener('toggle',clearHeld);
launch.onclick=start;ui.querySelector('#leave-exploration').onclick=stop;
window.GGGCExplore={start,get active(){return active;}};
