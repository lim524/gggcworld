import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import '../public/characters.js';
import '../public/adventurer-motion.js';
const root=new URL('../public/',import.meta.url);
const hash=data=>createHash('sha256').update(data).digest('hex');
test('each registered character has a transparent portrait and 32 distinct aligned idle frames',async()=>{
 for(const character of globalThis.GGGCCharacters.all){
  const idle=character.animations.idle,manifest=JSON.parse(await readFile(new URL(idle.manifest,root),'utf8'));
  assert.equal(idle.frameCount,32);assert.equal(manifest.frames.length,32);assert.equal(idle.columns*idle.rows,32);
  assert.deepEqual(manifest.anchor,{x:96,y:210});assert(Object.isFrozen(character.portrait));
  const image=await loadImage(fileURLToPath(new URL(idle.src,root))),sheet=createCanvas(image.width,image.height),c=sheet.getContext('2d');c.drawImage(image,0,0);
  assert.equal(image.width,768);assert.equal(image.height,1792);
  const unique=new Set(),boots=new Set();
  manifest.frames.forEach((frame,i)=>{
   assert.equal(frame.x,i%4*192);assert.equal(frame.y,Math.floor(i/4)*224);assert.equal(frame.anchorY,210);
   const data=c.getImageData(frame.x,frame.y,192,224).data;assert(data.some((v,j)=>j%4===3&&v>0));unique.add(hash(data));
   boots.add(hash(c.getImageData(frame.x,frame.y+176,192,48).data));
  });
  assert.equal(unique.size,32);assert.equal(boots.size,1,'foot region stays pixel-identical');
  const portrait=await loadImage(fileURLToPath(new URL(character.portrait.src,root))),pc=createCanvas(portrait.width,portrait.height),p=pc.getContext('2d');p.drawImage(portrait,0,0);
  assert.equal(portrait.width,character.portrait.width);assert.equal(portrait.height,character.portrait.height);
  const pixels=p.getImageData(0,0,portrait.width,portrait.height).data;
  assert(pixels.some((v,i)=>i%4===3&&v===0),'portrait has transparent pixels');assert(pixels.some((v,i)=>i%4===3&&v>200),'portrait has visible subject');
 }
});
test('blink affects both eyes together while keeping the source eyebrows',async()=>{
 for(const character of globalThis.GGGCCharacters.all){
 const master=await loadImage(fileURLToPath(new URL(character.rigSource,root)));
 const rig=globalThis.GGGCAdventurerMotion,source=createCanvas(192,224),s=source.getContext('2d');s.drawImage(master,0,0);
 for(let i=0;i<32;i++){
  const pose=rig.pose(i),canvas=createCanvas(192,224),c=canvas.getContext('2d');rig.render(c,master,i,character.id);
  assert.equal(pose.blink,i===20||i===21);
  for(const [x,y,w,h]of rig.EYES[character.id]){
   const sameEyes=hash(c.getImageData(x,y+pose.headY,w,h).data)===hash(s.getImageData(x,y,w,h).data);
   assert.equal(sameEyes,!pose.blink,'same blink state for both eyes in frame '+i);
   assert.equal(hash(c.getImageData(x,y-6+pose.headY,w,5).data),hash(s.getImageData(x,y-6,w,5).data),'eyebrows drawn exactly once');
  }
 }
 }
});
