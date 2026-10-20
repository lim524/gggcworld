/* Deterministic tile layouts shared by the server, browser and tests. */
export const WORLD_VERSION=1;
export const MAP_WIDTH=32,MAP_HEIGHT=24;
export const REGION_LIMIT=32;
export const REGION_NAMES={astra:'초록 초원',serin:'햇살 초원',lumi:'별빛 초원',nox:'황혼 초원'};
export function seedFor(faction,x,y){
 const text='gggc-meadow-v1:'+faction+':'+x+':'+y;let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return hash>>>0;
}
function random(seed){return()=>{seed+=0x6D2B79F5;let n=seed;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return((n^(n>>>14))>>>0)/4294967296;};}
export function generateChunk(faction,x,y){
 const seed=seedFor(faction,x,y),rng=random(seed),width=MAP_WIDTH,height=MAP_HEIGHT;
 const ground=Array(width*height).fill(0),objects=Array(width*height).fill(0),road=new Set();
 const cx=Math.floor(width/2),cy=Math.floor(height/2);
 const carve=(x,y)=>{if(x<0||y<0||x>=width||y>=height)return;const i=y*width+x;ground[i]=1;objects[i]=0;road.add(i);};
 // Meandering routes have matching entrances on all four boundaries.
 const bendX=Math.floor(rng()*7)-3,bendY=Math.floor(rng()*5)-2;
 for(let y=0;y<height;y++){const x=cx+Math.round(Math.sin(y/(height-1)*Math.PI*2)*bendX);for(let d=-1;d<=1;d++)carve(x+d,y);}
 for(let x=0;x<width;x++){const y=cy+Math.round(Math.sin(x/(width-1)*Math.PI*2)*bendY);for(let d=-1;d<=1;d++)carve(x,y+d);}
 for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++)carve(x,y);
 // Sparse dirt patches and clustered obstacles, without overwriting roads.
 const patches=Array.from({length:5},()=>({x:2+Math.floor(rng()*(width-4)),y:2+Math.floor(rng()*(height-4))}));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(road.has(i))continue;
  const edge=x===0||y===0||x===width-1||y===height-1;
  if(edge){objects[i]=1;continue;}
  if(patches.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<3)&&rng()<.7)ground[i]=1;
  const roll=rng(),cluster=(Math.sin(x*.7+seed%13)+Math.cos(y*.8))*.035;
  if(roll<.11+cluster)objects[i]=1;else if(roll<.15+cluster)objects[i]=2;
 }
 return{version:WORLD_VERSION,width,height,seed,ground,objects};
}
export function walkable(chunk,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<chunk.width&&y<chunk.height&&chunk.objects[y*chunk.width+x]===0;}
