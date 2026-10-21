// Normalize the generated 4x2 turnaround into shared foot-anchored rig tiles.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile} from 'node:fs/promises';
const source=await loadImage(process.argv[2]);
const input=createCanvas(source.width,source.height),ic=input.getContext('2d');ic.drawImage(source,0,0);
for(const [row,id]of ['rin','leo'].entries())for(const [col,direction]of ['down','up','left','right'].entries()){
 const sx=col*source.width/4,sy=row*source.height/2,w=source.width/4,h=source.height/2;
 const data=ic.getImageData(sx,sy,w,h).data;let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const target=createCanvas(192,224),c=target.getContext('2d');c.imageSmoothingEnabled=false;
 const scale=196/(y1-y0+1),dw=Math.round((x1-x0+1)*scale);
 c.drawImage(source,sx+x0,sy+y0,x1-x0+1,y1-y0+1,Math.round(96-dw/2),14,dw,196);
 await writeFile(new URL('../public/assets/characters/'+id+'/walk-master-'+direction+'-v1.png',import.meta.url),target.toBuffer('image/png'));
}
