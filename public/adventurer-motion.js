/* Stable 32-pose idle rig. Lower legs stay on a fixed baseline; the face is
 * always drawn once. A blink replaces both eye regions below the eyebrows. */
(function(root){
 'use strict';
 const WIDTH=192,HEIGHT=224,FRAMES=32,ANCHOR=Object.freeze({x:96,y:210});
 function pose(frame){
  const index=((Math.floor(frame)%FRAMES)+FRAMES)%FRAMES,t=index/FRAMES*Math.PI*2;
  return {index,t,headY:-Math.round((1-Math.cos(t))*0.6),sway:Math.round(Math.sin(t)),blink:index===20||index===21};
 }
 function faceBlink(c,dy){
  // No open-eye or eyebrow texture is overlaid onto a second lash line.
  for(const [x,w]of [[75,15],[98,14]]){
   c.fillStyle='#f8ceb1';c.fillRect(x,48+dy,w,3);
   c.fillStyle='#ffdcc2';c.fillRect(x,51+dy,w,3);
   c.fillStyle='#ffdfc6';c.fillRect(x,54+dy,w,6);
   c.fillStyle='#492b27';c.fillRect(x+2,54+dy,w-4,2);
   c.fillRect(x+1,53+dy,2,2);c.fillRect(x+w-3,53+dy,2,2);
  }
 }
 function render(c,image,frame){
  const p=pose(frame);c.save();c.imageSmoothingEnabled=false;
  // Retain all boot pixels exactly across the loop.
  c.drawImage(image,0,170,WIDTH,HEIGHT-170,0,170,WIDTH,HEIGHT-170);
  // Soft cloth sway returns to zero at the fixed lower-leg seam.
  for(let y=76;y<173;y++){
   const weight=Math.sin((y-76)/(173-76)*Math.PI);
   const dx=Math.round(Math.sin(p.t+(y-76)*0.012)*weight*1.1);
   const dy=y<104?p.headY:0;
   c.drawImage(image,0,y,WIDTH,2,dx,y+dy,WIDTH,2);
  }
  c.drawImage(image,0,0,WIDTH,80,0,p.headY,WIDTH,80);
  if(p.blink)faceBlink(c,p.headY);
  // A two-pixel light catch on the brass compass, not a world interaction.
  c.fillStyle='rgba(255,243,190,'+(0.12+(1+Math.sin(p.t+0.4))*0.27)+')';
  c.fillRect(86,88+p.headY,1,1);
  c.fillStyle='rgba(255,255,226,'+(0.10+(1+Math.cos(p.t+0.2))*0.24)+')';
  c.fillRect(87,89+p.headY,1,1);
  c.restore();
 }
 root.GGGCAdventurerMotion=Object.freeze({WIDTH,HEIGHT,FRAMES,ANCHOR,pose,render});
})(globalThis);
