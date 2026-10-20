/* Eight cached pixel frames. Geography stays fixed; only small environmental details move. */
(() => {
  'use strict';
  const W=400,H=250,FRAMES=8;
  const water=[[11,19],[16,33],[32,45],[40,19],[51,25],[62,40],[88,43],[93,62],[63,66],[39,67],[12,63],[44,83],[62,86],[83,88],[26,91],[54,13]];
  const lamps=[[26.4,22.8],[28,25],[48.5,52],[50,53],[52.2,51],[73.7,25],[75.2,27],[25.2,71],[28,73],[76,72.5],[78.5,73.5],[87,48]];
  function build(night){
    const atlas=document.createElement('canvas');atlas.width=W*FRAMES;atlas.height=H;const c=atlas.getContext('2d');
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    for(let frame=0;frame<FRAMES;frame++){
      c.save();c.translate(frame*W,0);
      water.forEach(([x,y],i)=>{
        const phase=(frame+i)%8,xx=x*W/100,yy=y*H/100;
        c.globalAlpha=(night?.16:.28)+[0,.03,.07,.12,.16,.12,.07,.03][phase];
        rect(xx,yy,phase<4?4:6,1,night?'#b0d9ff':'#f1fbff');rect(xx+3,yy+2,3,1,night?'#81b4e0':'#c5e8ff');
      });c.globalAlpha=1;
      // Fountain drops at the common harbour, kept within its original basin.
      for(let i=0;i<4;i++){const p=(frame+i*2)%8;rect(49.5*W/100+(i-1)*2,49.7*H/100-4+p,1,2,night?'#8de1f8':'#e4fbff');}
      // Small flags next to the four homeland landmarks.
      [[28.8,21,'#48b57d'],[76.2,24,'#ed7469'],[27.8,68,'#71b5fa'],[79,69,'#bc87ef']].forEach(([x,y,color],i)=>{
        const offset=[0,0,1,1,0,-1,-1,0][(frame+i)%8];rect(x*W/100,y*H/100,1,6,night?'#96a5bb':'#756656');rect(x*W/100+1,y*H/100+offset,3,2,color);
      });
      if(night){
        lamps.forEach(([x,y],i)=>{const strength=[.15,.18,.2,.23,.25,.23,.2,.18][(frame+i)%8];c.globalAlpha=strength;rect(x*W/100-2,y*H/100-2,5,5,'#ffc86c');c.globalAlpha=.9;rect(x*W/100,y*H/100,1,2,'#ffe0a0');});
        [[22,28],[32,25],[25,34],[73,68],[82,75],[69,76],[37,56],[63,21]].forEach(([x,y],i)=>{const p=(frame+i)%8;c.globalAlpha=p<4?.7:.3;rect(x*W/100+(p%3),y*H/100-Math.floor(p/3),1,1,i<3?'#b6ecb4':'#d6c6ff');});
      }else{
        [[20,25],[29,32],[71,31],[80,73]].forEach(([x,y],i)=>{const p=(frame+i*2)%8;rect(x*W/100+p/2,y*H/100+(p<4?0:1),1,1,'#fff1c2');});
      }
      c.restore();c.globalAlpha=1;
    }
    return atlas;
  }
  let day=null,night=null;
  window.GGGCWorldEffects={frames:FRAMES,width:W,height:H,paint(context,frame,isNight){if(isNight&&!night)night=build(true);if(!isNight&&!day)day=build(false);context.clearRect(0,0,W,H);context.imageSmoothingEnabled=false;context.drawImage(isNight?night:day,(frame%FRAMES)*W,0,W,H,0,0,W,H);}};
})();
