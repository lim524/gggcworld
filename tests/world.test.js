import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createWorker} from '../src/worker.js';
import {generateChunk,walkable} from '../public/worldgen.js';
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0001_auth.sql','0002_member_profile.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 for(const id of ['a','b','c','new'])sql.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,0,0)').run(id,'Name '+id,id+'@example.com');
 for(const[id,name,faction]of[['a','여행자A','astra'],['b','여행자B','astra'],['c','여행자C','nox']])sql.prepare('INSERT INTO member_profile(userId,name,faction) VALUES (?,?,?)').run(id,name,faction);
 const DB={prepare(query){let values=[];const stmt={bind(...params){values=params;return stmt;},async all(){return {results:sql.prepare(query).all(...values),meta:{changes:sql.prepare('SELECT changes() AS n').get().n}};},async first(){return (await stmt.all()).results[0]||null;},async run(){return stmt.all();}};return stmt;}};
 const env={DB,BETTER_AUTH_URL:'https://gggc.example',BETTER_AUTH_SECRET:'test-only-secret-with-32-characters',GOOGLE_CLIENT_ID:'x',GOOGLE_CLIENT_SECRET:'x'};
 const worker=createWorker(()=>({api:{getSession:async({headers})=>{const id=headers.get('Cookie');return ['a','b','c','new'].includes(id)?{user:{id}}:null;}}}));
 const request=(body,uid,origin=env.BETTER_AUTH_URL)=>worker.fetch(new Request(env.BETTER_AUTH_URL+'/api/world/chunks',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(uid?{Cookie:uid}:{})},body:JSON.stringify(body)}),env);
 return{sql,request};
}
test('generated maps are deterministic and all entrances connect to the safe spawn',()=>{
 for(const faction of ['astra','serin','lumi','nox'])for(let x=-3;x<=3;x++){
  const chunk=generateChunk(faction,x,2);assert.deepEqual(chunk,generateChunk(faction,x,2));assert.equal(chunk.ground.length,32*24);assert.equal(chunk.objects.length,32*24);
  const visited=new Set(),queue=[[16,12]];
  for(let i=0;i<queue.length;i++){const [px,py]=queue[i],key=py*32+px;if(visited.has(key))continue;visited.add(key);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(walkable(chunk,px+dx,py+dy)&&!visited.has((py+dy)*32+px+dx))queue.push([px+dx,py+dy]);}
  for(const[px,py]of[[16,0],[16,23],[0,12],[31,12]])assert(visited.has(py*32+px));
  assert(!walkable(chunk,-1,0));assert(!walkable(chunk,32,0));assert(!walkable(chunk,0,-1));assert(!walkable(chunk,0,24));
  const blocked=chunk.objects.findIndex(o=>o!==0);assert(!walkable(chunk,blocked%32,Math.floor(blocked/32)));
 }
 assert.notDeepEqual(generateChunk('nox',0,0),generateChunk('nox',1,0));
 assert.notDeepEqual(generateChunk('nox',0,0),generateChunk('astra',0,0));
});
