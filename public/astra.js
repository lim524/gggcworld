/* Astra sprite pilot: four generated frames, foot-anchored at a shared baseline. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sheets = {"serin": {"width": 627, "height": 627, "scale": 0.313059, "frames": [{"x": 0, "y": 0, "anchor": 334, "foot": 579}, {"x": 627, "y": 0, "anchor": 291, "foot": 579}, {"x": 0, "y": 627, "anchor": 334, "foot": 552}, {"x": 627, "y": 627, "anchor": 296, "foot": 552}]}, "lumi": {"width": 627, "height": 627, "scale": 0.330813, "frames": [{"x": 0, "y": 0, "anchor": 319, "foot": 569}, {"x": 627, "y": 0, "anchor": 318, "foot": 569}, {"x": 0, "y": 627, "anchor": 320, "foot": 569}, {"x": 627, "y": 627, "anchor": 320, "foot": 569}]}, "nox": {"width": 627, "height": 627, "scale": 0.342466, "frames": [{"x": 0, "y": 0, "anchor": 330, "foot": 576}, {"x": 627, "y": 0, "anchor": 300, "foot": 576}, {"x": 0, "y": 627, "anchor": 334, "foot": 571}, {"x": 627, "y": 627, "anchor": 293, "foot": 571}]}, "astra": {"width": 627, "height": 627, "scale": 0.32, "frames": [{"x": 0, "y": 0, "anchor": 334, "foot": 602}, {"x": 627, "y": 0, "anchor": 324, "foot": 602}, {"x": 0, "y": 627, "anchor": 334, "foot": 585}, {"x": 627, "y": 627, "anchor": 324, "foot": 585}]}};
  const names = {astra:'아스트라',serin:'세린',lumi:'루미',nox:'녹스'};
  const durations = [1500,600,140,600];
  const cache = new Map();
  const scriptURL = document.currentScript.src;
  function loadSheet(id) {
    if(!cache.has(id)) {
      const image=new Image();
      image.src=new URL(`assets/${id}-idle-v1.webp`,scriptURL).href;
      const ready=image.decode();ready.catch(()=>{});
      cache.set(id,{image,ready});
    }
    return cache.get(id);
  }
  const labFaction = new URLSearchParams(location.search).get('faction');
  if(document.querySelector('#lab-sprite') && names[labFaction]) {
    document.querySelectorAll('astra-sprite').forEach(s=>s.setAttribute('faction',labFaction));
  }
  class AstraSprite extends HTMLElement {
    connectedCallback() {
      if(this.canvas) return;
      this.faction=names[this.getAttribute('faction')]?this.getAttribute('faction'):'astra';
      this.sheet=sheets[this.faction];
      const {image,ready}=loadSheet(this.faction);this.image=image;
      this.innerHTML = '<canvas width="384" height="448" aria-hidden="true"></canvas>';
      this.canvas = this.querySelector('canvas');
      this.setAttribute('role','img');
      this.setAttribute('aria-label',`${names[this.faction]} · 숨쉬기와 눈 깜빡임 도트 애니메이션`);
      this.ctx = this.canvas.getContext('2d');
      this.frame = Number(this.getAttribute('frame') || 0);
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
      const c=this.ctx,f=this.sheet.frames[this.frame],scale=this.sheet.scale;
      c.setTransform(2,0,0,2,0,0);
      c.clearRect(0,0,192,224);
      c.imageSmoothingEnabled=false;
      c.drawImage(this.image,f.x,f.y,this.sheet.width,this.sheet.height,96-f.anchor*scale,212-f.foot*scale,this.sheet.width*scale,this.sheet.height*scale);
      this.dataset.frame=String(this.frame+1);
      this.dispatchEvent(new CustomEvent('spriteframe',{detail:{frame:this.frame}}));
    }
    schedule() {
      clearTimeout(this.timer);
      if(!this.ready || !this.playing || !this.visible || document.hidden) return;
      this.timer=setTimeout(() => {this.frame=(this.frame+1)%4;this.draw();this.schedule();},durations[this.frame]/this.speed);
    }
    setPlaying(value) {this.playing=Boolean(value);this.schedule();}
    setFrame(frame) {this.frame=Math.max(0,Math.min(3,frame));this.draw();this.schedule();}
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
    chooser.onchange=()=>{location.search=new URLSearchParams({faction:chooser.value}).toString();};
    const play=document.querySelector('#lab-play');
    const update=()=>{play.textContent=lab.playing?'Ⅱ 일시정지':'▶ 재생';play.setAttribute('aria-pressed',String(lab.playing));};
    play.onclick=()=>{lab.setPlaying(!lab.playing);update();};
    document.querySelectorAll('[data-lab-frame]').forEach(button=>button.onclick=()=>{lab.setPlaying(false);lab.setFrame(Number(button.dataset.labFrame));update();});
    document.querySelector('#lab-speed').onchange=e=>lab.setSpeed(Number(e.target.value));
    document.querySelector('#lab-dark').onclick=e=>{const stage=document.querySelector('.lab-stage');stage.classList.toggle('night');e.currentTarget.setAttribute('aria-pressed',String(stage.classList.contains('night')));};
    lab.addEventListener('spriteframe',e=>{document.querySelector('#lab-status').textContent=`FRAME 0${e.detail.frame+1} / 04`;document.querySelectorAll('[data-lab-frame]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.labFrame)===e.detail.frame)));});
    update();
  }
})();
