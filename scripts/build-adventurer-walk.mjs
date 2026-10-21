import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../public/characters.js';
const root=new URL('../public/',import.meta.url);
const directions=['down','up','left','right'];
for(const character of globalThis.GGGCCharacters.all){
 const folder=new URL('assets/characters/'+character.id+'/',root);
 for(const direction of directions){
  const master=await loadImage(new URL('walk-master-'+direction+'-v1.png',folder).pathname);
  const sheet=createCanvas(768,1792),sc=sheet.getContext('2d'),unique=new Set(),frames=[];
  for(let i=0;i<32;i++){
   const t=i/32*Math.PI*2,tile=createCanvas(192,224),c=tile.getContext('2d');c.imageSmoothingEnabled=false;
   const bob=-Math.round((1-Math.cos(t*2))*1.5);
   // Separate legs move in opposite phases; feet lift only on the return stroke.
   for(const [x,w,phase]of [[0,96,t],[96,96,t+Math.PI]]){
    const stride=Math.sin(phase),dx=Math.round(stride*(direction==='left'||direction==='right'?7:3));
    const dy=Math.round(stride*4-Math.max(0,Math.cos(phase))*5);
    c.drawImage(master,x,155,w,69,x+dx,155+dy,w,69);
   }
   // Torso follows the gait; shoulder/arm and cape rows lag behind the step.
   for(let y=76;y<155;y++){
    const sway=Math.round(Math.sin(t+(y-76)*.025)*Math.sin((y-76)/79*Math.PI)*3);
    c.drawImage(master,0,y,192,1,sway,y+bob,192,1);
   }
   c.drawImage(master,0,0,192,78,0,bob,192,78);
   const x=i%4*192,y=Math.floor(i/4)*224;sc.drawImage(tile,x,y);
   unique.add(createHash('sha256').update(c.getImageData(0,0,192,224).data).digest('hex'));
   frames.push({x,y,width:192,height:224,anchorX:96,anchorY:210,duration:25});
  }
  if(unique.size!==32)throw Error(character.id+' '+direction+': '+unique.size+' unique frames');
  await writeFile(new URL('walk-'+direction+'-v1.png',folder),sheet.toBuffer('image/png'));
  await writeFile(new URL('walk-'+direction+'-v1.json',folder),JSON.stringify({version:1,id:character.id,direction,columns:4,rows:8,width:768,height:1792,frameCount:32,anchor:{x:96,y:210},frames},null,2)+'\n');
  console.log(character.id,direction,unique.size,(await readFile(new URL('walk-'+direction+'-v1.png',folder))).length);
 }
}
