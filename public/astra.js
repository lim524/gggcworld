/* Shared idle sprite player: versioned sheets with foot-anchored frames. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const legacySheets = {"serin": {"width": 627, "height": 627, "scale": 0.313059, "frames": [{"x": 0, "y": 0, "anchor": 334, "foot": 579}, {"x": 627, "y": 0, "anchor": 291, "foot": 579}, {"x": 0, "y": 627, "anchor": 334, "foot": 552}, {"x": 627, "y": 627, "anchor": 296, "foot": 552}]}, "lumi": {"width": 627, "height": 627, "scale": 0.330813, "frames": [{"x": 0, "y": 0, "anchor": 319, "foot": 569}, {"x": 627, "y": 0, "anchor": 318, "foot": 569}, {"x": 0, "y": 627, "anchor": 320, "foot": 569}, {"x": 627, "y": 627, "anchor": 320, "foot": 569}]}, "nox": {"width": 627, "height": 627, "scale": 0.342466, "frames": [{"x": 0, "y": 0, "anchor": 330, "foot": 576}, {"x": 627, "y": 0, "anchor": 300, "foot": 576}, {"x": 0, "y": 627, "anchor": 334, "foot": 571}, {"x": 627, "y": 627, "anchor": 293, "foot": 571}]}, "astra": {"width": 627, "height": 627, "scale": 0.32, "frames": [{"x": 0, "y": 0, "anchor": 334, "foot": 602}, {"x": 627, "y": 0, "anchor": 324, "foot": 602}, {"x": 0, "y": 627, "anchor": 334, "foot": 585}, {"x": 627, "y": 627, "anchor": 324, "foot": 585}]}};
  const currentSheets = {"astra": {"frames": [{"x": 0, "y": 0, "width": 396, "height": 496, "anchor": 204.0, "foot": 465, "scale": 0.402299}, {"x": 396, "y": 0, "width": 397, "height": 496, "anchor": 204.0, "foot": 464, "scale": 0.403226}, {"x": 793, "y": 0, "width": 397, "height": 496, "anchor": 204.0, "foot": 464, "scale": 0.398633}, {"x": 1190, "y": 0, "width": 396, "height": 496, "anchor": 204.0, "foot": 464, "scale": 0.403226}, {"x": 0, "y": 496, "width": 396, "height": 496, "anchor": 203.0, "foot": 465, "scale": 0.402299}, {"x": 396, "y": 496, "width": 397, "height": 496, "anchor": 204.0, "foot": 464, "scale": 0.403226}, {"x": 793, "y": 496, "width": 397, "height": 496, "anchor": 205.0, "foot": 465, "scale": 0.402299}, {"x": 1190, "y": 496, "width": 396, "height": 496, "anchor": 203.0, "foot": 465, "scale": 0.402299}]}, "serin": {"frames": [{"x": 0, "y": 0, "width": 398, "height": 496, "anchor": 205.5, "foot": 464, "scale": 0.406977}, {"x": 398, "y": 0, "width": 394, "height": 496, "anchor": 209.0, "foot": 464, "scale": 0.405093}, {"x": 792, "y": 0, "width": 390, "height": 496, "anchor": 201.0, "foot": 464, "scale": 0.397727}, {"x": 1182, "y": 0, "width": 404, "height": 496, "anchor": 197.0, "foot": 464, "scale": 0.406977}, {"x": 0, "y": 496, "width": 400, "height": 496, "anchor": 221.0, "foot": 455, "scale": 0.398633}, {"x": 400, "y": 496, "width": 393, "height": 496, "anchor": 208.0, "foot": 454, "scale": 0.401376}, {"x": 793, "y": 496, "width": 389, "height": 496, "anchor": 201.0, "foot": 454, "scale": 0.401376}, {"x": 1182, "y": 496, "width": 404, "height": 496, "anchor": 183.0, "foot": 454, "scale": 0.399543}]}, "lumi": {"frames": [{"x": 0, "y": 0, "width": 444, "height": 444, "anchor": 231.0, "foot": 431, "scale": 0.443038}, {"x": 444, "y": 0, "width": 443, "height": 444, "anchor": 210.0, "foot": 431, "scale": 0.443038}, {"x": 0, "y": 444, "width": 444, "height": 443, "anchor": 230.0, "foot": 416, "scale": 0.443038}, {"x": 444, "y": 444, "width": 443, "height": 443, "anchor": 210.0, "foot": 416, "scale": 0.443038}, {"x": 0, "y": 887, "width": 444, "height": 443, "anchor": 230.0, "foot": 410, "scale": 0.440806}, {"x": 444, "y": 887, "width": 443, "height": 443, "anchor": 210.0, "foot": 410, "scale": 0.440806}, {"x": 0, "y": 1330, "width": 444, "height": 444, "anchor": 230.0, "foot": 396, "scale": 0.443038}, {"x": 444, "y": 1330, "width": 443, "height": 444, "anchor": 209.0, "foot": 396, "scale": 0.443038}]}, "nox": {"frames": [{"x": 0, "y": 0, "width": 314, "height": 627, "anchor": 156.0, "foot": 579, "scale": 0.464191}, {"x": 314, "y": 0, "width": 313, "height": 627, "anchor": 155.0, "foot": 580, "scale": 0.462963}, {"x": 627, "y": 0, "width": 314, "height": 627, "anchor": 155.0, "foot": 580, "scale": 0.454545}, {"x": 941, "y": 0, "width": 313, "height": 627, "anchor": 152.0, "foot": 580, "scale": 0.464191}, {"x": 0, "y": 627, "width": 314, "height": 627, "anchor": 155.0, "foot": 527, "scale": 0.464191}, {"x": 314, "y": 627, "width": 313, "height": 627, "anchor": 156.0, "foot": 527, "scale": 0.464191}, {"x": 627, "y": 627, "width": 313, "height": 627, "anchor": 155.5, "foot": 527, "scale": 0.464191}, {"x": 940, "y": 627, "width": 314, "height": 627, "anchor": 154.0, "foot": 527, "scale": 0.464191}]}};
  const divineSheets = {"astra":{"frames":[{"x":0,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1}]},"serin":{"frames":[{"x":0,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1}]},"lumi":{"frames":[{"x":0,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1}]},"nox":{"frames":[{"x":0,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":0,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":224,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":448,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":672,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":896,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1120,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1344,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":0,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":192,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":384,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1},{"x":576,"y":1568,"width":192,"height":224,"anchor":96,"foot":210,"scale":1}]}};
  const names = {astra:'아스트라',serin:'세린',lumi:'루미',nox:'녹스'};
  const timings = {1:[1500,600,140,600],2:[1100,180,220,220,65,95,65,550],3:Array.from({length:32},(_,i)=>i===0?650:i>=12&&i<=18?35:i===31?350:85)};
  const requestedVersion=Number(new URLSearchParams(location.search).get('version'));
  const labVersion=document.querySelector('#lab-sprite')&&[1,2,3].includes(requestedVersion)?requestedVersion:3;
  const cache = new Map();
  const scriptURL = document.currentScript.src;
  function loadSheet(id,version) {
    const key=`${id}:${version}`;
    if(!cache.has(key)) {
      const image=new Image();
      image.src=new URL(`assets/${id}-idle-v${version}.webp`,scriptURL).href;
      const ready=image.decode();ready.catch(()=>{});
      cache.set(key,{image,ready});
    }
    return cache.get(key);
  }
  const labFaction = new URLSearchParams(location.search).get('faction');
  if(document.querySelector('#lab-sprite') && names[labFaction]) {
    document.querySelectorAll('astra-sprite').forEach(s=>s.setAttribute('faction',labFaction));
  }
  class AstraSprite extends HTMLElement {
    connectedCallback() {
      if(this.canvas) return;
      this.faction=names[this.getAttribute('faction')]?this.getAttribute('faction'):'astra';
      this.version=labVersion;
      this.sheet=(this.version===1?legacySheets:this.version===2?currentSheets:divineSheets)[this.faction];
      this.durations=timings[this.version];
      const {image,ready}=loadSheet(this.faction,this.version);this.image=image;
      this.innerHTML = '<canvas width="384" height="448" aria-hidden="true"></canvas>';
      this.canvas = this.querySelector('canvas');
      this.setAttribute('role','img');
      this.setAttribute('aria-label',`${names[this.faction]} · 숨쉬기와 눈 깜빡임 도트 애니메이션`);
      this.ctx = this.canvas.getContext('2d');
      this.frame = Math.max(0,Math.min(this.sheet.frames.length-1,Number(this.getAttribute('frame'))||0));
      this.speed = 1;
      this.playing = !this.hasAttribute('still') && !reduced.matches;
      this.visible = false;
      this.onVisibility = () => this.schedule();
      this.onMotion = () => { if(reduced.matches) this.playing=false; this.schedule(); };
      document.addEventListener('visibilitychange',this.onVisibility);
      reduced.addEventListener('change',this.onMotion);
      this.observer = new IntersectionObserver(entries => {this.visible = entries[0].isIntersecting; this.schedule();});
      this.observer.observe(this);
      ready.then(() => {this.ready=true; this.draw(); this.schedule();}).catch(() => {
        this.textContent='캐릭터를 불러오지 못했어요.';
        this.setAttribute('aria-label','캐릭터 이미지를 불러오지 못했습니다');
      });
    }
    draw() {
      if(!this.ready) return;
      const c=this.ctx,f=this.sheet.frames[this.frame],scale=f.scale??this.sheet.scale;
      const width=f.width??this.sheet.width,height=f.height??this.sheet.height;
      c.setTransform(2,0,0,2,0,0);
      c.clearRect(0,0,192,224);
      c.imageSmoothingEnabled=false;
      c.drawImage(this.image,f.x,f.y,width,height,96-f.anchor*scale,212-f.foot*scale,width*scale,height*scale);
      this.dataset.frame=String(this.frame+1);
      this.dispatchEvent(new CustomEvent('spriteframe',{detail:{frame:this.frame}}));
    }
    schedule() {
      clearTimeout(this.timer);
      if(!this.ready || !this.playing || !this.visible || document.hidden) return;
      this.timer=setTimeout(() => {this.frame=(this.frame+1)%this.sheet.frames.length;this.draw();this.schedule();},this.durations[this.frame]/this.speed);
    }
    setPlaying(value) {this.playing=Boolean(value);this.schedule();}
    setFrame(frame) {this.frame=Math.max(0,Math.min(this.sheet.frames.length-1,Number(frame)||0));this.draw();this.schedule();}
    setSpeed(value) {this.speed=value;this.schedule();}
    disconnectedCallback() {
      clearTimeout(this.timer);this.observer?.disconnect();
      document.removeEventListener('visibilitychange',this.onVisibility);
      reduced.removeEventListener('change',this.onMotion);
    }
  }
  customElements.define('astra-sprite',AstraSprite);
  customElements.define('faction-sprite',class extends AstraSprite {});

  const widget=document.querySelector('#astra-companion');
  if(widget) {
    const toggle=widget.querySelector('.companion-toggle');
    const panel=widget.querySelector('.companion-panel');
    const sprite=widget.querySelector('astra-sprite');
    let hidden=false;
    toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
    widget.querySelector('[data-companion-hide]').onclick=()=>{
      hidden=!hidden;widget.classList.toggle('compact',hidden);
      widget.querySelector('[data-companion-hide]').textContent=hidden?'캐릭터 펼치기':'접기';
      sprite.setPlaying(!hidden&&!reduced.matches);panel.hidden=true;toggle.setAttribute('aria-expanded','false');
    };
    widget.querySelector('[data-companion-pause]').onclick=e=>{
      sprite.setPlaying(!sprite.playing);
      e.currentTarget.textContent=sprite.playing?'동작 멈추기':'동작 재생';
    };
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}});
  }
  const lab=document.querySelector('#lab-sprite');
  if(lab) {
    const chooser=document.querySelector('#lab-faction');
    chooser.value=names[labFaction]?labFaction:'astra';
    const versionChooser=document.querySelector('#lab-version');
    versionChooser.value=String(labVersion);
    const navigate=()=>{location.search=new URLSearchParams({faction:chooser.value,version:versionChooser.value}).toString();};
    chooser.onchange=navigate;versionChooser.onchange=navigate;
    const frameCount=lab.sheet.frames.length;
    const descriptions=labVersion===3?Array.from({length:32},(_,i)=>i<8?'숨 들이쉬기':i<12?'숨 내쉬기 시작':i<16?'눈 감기':i<20?'눈 뜨기':i<28?'숨 내쉬기':'다시 대기'):labVersion===1?['기본 대기','가벼운 숨쉬기','눈 감기','다시 대기']:['기본 대기','숨 들이쉬기','숨쉬기 정점','숨 내쉬기','눈 감기 시작','눈 감기','눈 뜨기','다시 대기'];
    document.querySelector('#lab-frame-buttons').innerHTML=descriptions.map((_,i)=>`<button data-lab-frame="${i}" aria-pressed="${i===0}">${String(i+1).padStart(2,'0')}</button>`).join('');
    document.querySelector('.frame-grid').innerHTML=descriptions.map((label,i)=>`<article class="frame-tile"><span>FRAME ${String(i+1).padStart(2,'0')}</span><faction-sprite faction="${chooser.value}" still frame="${i}"></faction-sprite><p>${label}</p></article>`).join('');
    document.querySelector('#lab-status').textContent=`FRAME 01 / ${String(frameCount).padStart(2,'0')}`;
    document.querySelector('#lab-description').textContent=labVersion===3?'책 · 검 · 지팡이 · 보랏빛 별조각을 든 네 신의 32프레임 대기 동작이에요.':labVersion===1?'기존 네 장의 대기 프레임을 비교해보세요.':'숨쉬기와 눈 깜빡임의 중간 단계를 더한 여덟 장의 대기 프레임이에요.';
    const play=document.querySelector('#lab-play');
    const update=()=>{play.textContent=lab.playing?'Ⅱ 일시정지':'▶ 재생';play.setAttribute('aria-pressed',String(lab.playing));};
    play.onclick=()=>{lab.setPlaying(!lab.playing);update();};
    document.querySelectorAll('[data-lab-frame]').forEach(button=>button.onclick=()=>{lab.setPlaying(false);lab.setFrame(Number(button.dataset.labFrame));update();});
    document.querySelector('#lab-speed').onchange=e=>lab.setSpeed(Number(e.target.value));
    document.querySelector('#lab-dark').onclick=e=>{const stage=document.querySelector('.lab-stage');stage.classList.toggle('night');e.currentTarget.setAttribute('aria-pressed',String(stage.classList.contains('night')));};
    lab.addEventListener('spriteframe',e=>{document.querySelector('#lab-status').textContent=`FRAME ${String(e.detail.frame+1).padStart(2,'0')} / ${String(frameCount).padStart(2,'0')}`;document.querySelectorAll('[data-lab-frame]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.labFrame)===e.detail.frame)));});
    update();
  }
})();
