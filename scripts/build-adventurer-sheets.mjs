import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import '../public/adventurer-motion.js';

const root=new URL('../',import.meta.url),folder=new URL('public/assets/characters/rin/',root);
const master=await loadImage(fileURLToPath(new URL('master-v1.webp',folder)));
const rig=globalThis.GGGCAdventurerMotion;
if(master.width!==rig.WIDTH||master.height!==rig.HEIGHT)throw Error('Master must use the shared tile dimensions');
const sheet=createCanvas(768,1792),hashes=new Set(),frames=[],bootHashes=new Set();
await mkdir(new URL('output/rin-qa/',root),{recursive:true});
for(let i=0;i<32;i++){
 const tile=createCanvas(192,224),c=tile.getContext('2d');rig.render(c,master,i);
 hashes.add(createHash('sha256').update(c.getImageData(0,0,192,224).data).digest('hex'));
 bootHashes.add(createHash('sha256').update(c.getImageData(0,176,192,48).data).digest('hex'));
 const x=(i%4)*192,y=Math.floor(i/4)*224;sheet.getContext('2d').drawImage(tile,x,y);
 frames.push({x,y,width:192,height:224,anchorX:96,anchorY:210,duration:80});
 if([0,14,19,20,21,22,31].includes(i))await writeFile(new URL('output/rin-qa/frame-'+String(i+1).padStart(2,'0')+'.png',root),tile.toBuffer('image/png'));
}
if(hashes.size!==32)throw Error('Every idle frame must be distinct: '+hashes.size);
if(bootHashes.size!==1)throw Error('Foot pixels must remain fixed');
// Lossless PNG keeps pixel colours and the fixed boot region identical.
await writeFile(new URL('idle-v1.png',folder),sheet.toBuffer('image/png'));
await writeFile(new URL('idle-v1.json',folder),JSON.stringify({version:1,id:'rin',columns:4,rows:8,width:768,height:1792,frameCount:32,anchor:rig.ANCHOR,frames},null,2)+'\n');
console.log(JSON.stringify({frames:frames.length,unique:hashes.size,bootVariants:bootHashes.size,bytes:(await readFile(new URL('idle-v1.png',folder))).length}));
