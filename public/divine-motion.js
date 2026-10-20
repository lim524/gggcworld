/* Stable idle rig: one retained drawing, fixed scale, synchronized eyelids.
 * Thirty-two procedural poses, not 32 independently redrawn characters.
 */
(() => {
  'use strict';
  const rigs={
    astra:{eyes:[[68,107,24,23],[102,107,24,23]],closedOffset:[0,0],hair:[50,140,138],color:'#6bdcb4',prop:[101,156],phase:0},
    serin:{eyes:[[63,96,25,23],[100,96,25,23]],closedOffset:[0,5],hair:[47,147,133],color:'#f3aa66',prop:[49,170],phase:0.6},
    lumi:{eyes:[[69,101,25,24],[104,101,25,24]],closedOffset:[0,1],hair:[47,148,133],color:'#7dbbff',prop:[163,95],phase:1.2},
    nox:{eyes:[[62,95,26,22],[96,95,26,22]],closedOffset:[0,4],hair:[45,149,133],color:'#ce8cff',prop:[42,147],phase:1.8}
  };
  function pose(id,frame) {
    const t=(frame%32)/32*Math.PI*2;
    const blink=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.45,1,0.45,0,0,0,0,0,0,0,0,0][frame%32];
    return {t,blink,tilt:Math.sin(t)*0.025,bob:-Math.round((1-Math.cos(t))*1.5),sway:Math.sin(t+rigs[id].phase)*3};
  }
  function blinkEyes(c,image,closed,rig,amount) {
    if(!amount)return;
    const [dx,dy]=rig.closedOffset;
    for(const [x,y,w,h]of rig.eyes) {
      // Reuse the character's actual closed-eye art; only this small eye region
      // changes, with one shared blink value for left and right.
      c.drawImage(closed,x+dx,y+dy,w,h,x,y,w,h);
      if(amount<1) {
        const height=Math.max(2,Math.round(h*(1-amount)));
        c.drawImage(image,x,y,w,h,x,y+h-height,w,height);
      }
    }
  }
  function render(c,image,closed,id,frame) {
    const rig=rigs[id],p=pose(id,frame),[left,right,top]=rig.hair;
    c.save();c.translate(96,212);c.rotate(p.tilt);c.translate(-96,-210+p.bob);
    // Draw side hair/cape strips behind the stable face and body. Overlap the
    // inner edge so the small sway never opens a transparent cut through hair.
    const shift=Math.round(p.sway);
    c.drawImage(image,0,top,left+5,224-top,-shift,top,left+5,224-top);
    c.drawImage(image,right-5,top,192-right+5,224-top,right+shift-5,top,192-right+5,224-top);
    c.drawImage(image,0,0,192,top,0,0,192,top);
    c.drawImage(image,left,top,right-left,224-top,left,top,right-left,224-top);
    blinkEyes(c,image,closed,rig,p.blink);
    // Small orbiting glints give each held symbol energy without changing its
    // shape or redrawing the hands. No opacity ghosting or global scale changes.
    const [px,py]=rig.prop;
    c.fillStyle=rig.color;
    for(let i=0;i<3;i++) {
      const angle=p.t+i*Math.PI*2/3;
      const x=Math.round(px+Math.cos(angle)*19),y=Math.round(py+Math.sin(angle)*11);
      c.globalAlpha=.45+.4*(1+Math.sin(angle))/2;
      c.fillRect(x-1,y,3,1);c.fillRect(x,y-1,1,3);
    }
    c.restore();
  }
  window.DivineMotion=Object.freeze({pose,render});
})();
