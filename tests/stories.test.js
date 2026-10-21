import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {createWorker} from '../src/worker.js';import {generateChunk} from '../public/worldgen.js';import {createWorldEvents} from '../src/world-events.js';
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');for(const file of ['0001_auth.sql','0002_member_profile.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 for(const id of ['a','b','new'])sql.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,0,0)').run(id,'Name '+id,id+'@example.com');
 for(const id of ['a','b'])sql.prepare('INSERT INTO member_profile(userId,name,faction) VALUES (?,?,?)').run(id,'여행자'+id,'nox');
 const DB={prepare(query){let values=[];const stmt={bind(...p){values=p;return stmt;},async all(){return{results:sql.prepare(query).all(...values),meta:{changes:sql.prepare('SELECT changes() AS n').get().n}};},async first(){return(await stmt.all()).results[0]||null;},async run(){return stmt.all();}};return stmt;}};
 const env={DB,BETTER_AUTH_URL:'https://gggc.example',BETTER_AUTH_SECRET:'test-only-secret-with-32-characters',GOOGLE_CLIENT_ID:'x',GOOGLE_CLIENT_SECRET:'x'};
 const auth={api:{getSession:async({headers})=>{const id=headers.get('Cookie');return ['a','b','new'].includes(id)?{user:{id}}:null;}}};const worker=createWorker(()=>auth);
 const request=(path='/api/stories',method='GET',body,uid='a',origin=env.BETTER_AUTH_URL)=>worker.fetch(new Request(env.BETTER_AUTH_URL+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(uid?{Cookie:uid}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
 const make=async(char='rin')=>{const r=await request('/api/stories','POST',{title:'첫 이야기',characterId:char,faction:'astra',userId:'b'});assert.equal(r.status,201);return(await r.json()).story;};
 return{sql,env,auth,request,make};
}
test('stories require login/profile, accept only starters, and atomically cap five active slots',async()=>{
 const f=fixture();assert.equal((await f.request(undefined,'GET',undefined,null)).status,401);assert.equal((await f.request(undefined,'GET',undefined,'new')).status,403);
 for(const body of [{characterId:'nox',title:'Nox'},{characterId:'leo',title:''},{characterId:'leo',title:'<bad>'}])assert.equal((await f.request('/api/stories','POST',body)).status,400);
 assert.equal((await f.request('/api/stories','POST',{characterId:'rin',title:'Hi'},'a','https://evil.example')).status,403);
 const results=await Promise.all(Array.from({length:7},(_,i)=>f.request('/api/stories','POST',{characterId:i%2?'leo':'rin',title:'로그 '+i})));
 assert.equal(results.filter(r=>r.status===201).length,5);assert.equal(results.filter(r=>r.status===409).length,2);
 const list=await(await f.request()).json();assert.equal(list.stories.length,5);assert.deepEqual(list.stories.map(s=>s.slot),[1,2,3,4,5]);assert(list.stories.every(s=>s.faction==='nox'));assert.equal(list.limit,5);
 assert.equal((await(await f.request(undefined,'GET',undefined,'b')).json()).stories.length,0);
});
test('stories own their map, checkpoint and visits, with revision conflicts and reload persistence',async()=>{
 const f=fixture(),a=await f.make(),b=await f.make('leo');assert.equal(a.characterId,'rin');assert.equal(b.characterId,'leo');
 assert.equal((await f.request('/api/stories/'+a.id,'GET',undefined,'b')).status,404);
 assert.equal((await f.request('/api/world/chunks','POST',{storyId:a.id,x:0,y:0},'b')).status,404);
 const chunk=async id=>{const r=await f.request('/api/world/chunks','POST',{storyId:id,x:0,y:0});assert.equal(r.status,200);return(await r.json()).chunk;};
 const ca=await chunk(a.id),cb=await chunk(b.id);assert.notEqual(ca.seed,cb.seed);assert.deepEqual(await chunk(a.id),ca);
 assert.equal((await f.request('/api/world/chunks','POST',{x:0,y:0})).status,404);
 const patch={cx:0,cy:0,x:17,y:12,revision:0,tutorialSeen:true};
 const r=await f.request('/api/stories/'+a.id,'PATCH',patch);assert.equal(r.status,200);assert.equal((await r.json()).story.revision,1);
 assert.equal((await f.request('/api/stories/'+a.id,'PATCH',patch)).status,409);
 assert.equal((await f.request('/api/stories/'+a.id,'PATCH',{...patch,revision:1,x:18})).status,400);
 const saved=await(await f.request('/api/stories/'+a.id)).json();assert.equal(saved.story.x,17);assert.equal(saved.story.tutorialSeen,1);assert.deepEqual(saved.visited,[{x:0,y:0}]);
 const untouched=await(await f.request('/api/stories/'+b.id)).json();assert.equal(untouched.story.x,16);assert.equal(untouched.story.tutorialSeen,0);assert(!('seed' in saved.story));assert(!('userId' in saved.story));
});
test('archiving frees one slot and undo restoration respects owner and five-slot cap',async()=>{
 const f=fixture(),a=await f.make();await f.request('/api/stories/'+a.id,'DELETE',{});assert.equal((await f.request('/api/stories/'+a.id)).status,404);
 assert.equal((await f.request('/api/stories/'+a.id+'/restore','POST',{},'b')).status,404);
 assert.equal((await f.request('/api/stories/'+a.id+'/restore','POST',{})).status,200);
 await f.request('/api/stories/'+a.id,'DELETE',{});for(let i=0;i<5;i++)await f.make();assert.equal((await f.request('/api/stories/'+a.id+'/restore','POST',{})).status,409);
});
test('event discovery and dialogue namespace cannot bleed into another story or user',async()=>{
 const f=fixture(),a=await f.make(),b=await f.make('leo');for(const s of [a,b])await f.request('/api/world/chunks','POST',{storyId:s.id,x:0,y:0});
 const endpoint='/api/world/events/nox-stone';
 const body={storyId:a.id,action:'open',cx:0,cy:0,x:17,y:12};assert.equal((await f.request(endpoint,'POST',body)).status,200);
 assert.equal((await(await f.request(endpoint+'?storyId='+a.id)).json()).found,true);
 assert.equal((await(await f.request(endpoint+'?storyId='+b.id)).json()).found,false);
 assert.equal((await f.request(endpoint+'?storyId='+a.id,'GET',undefined,'b')).status,404);
 assert.equal((await f.request(endpoint+'?storyId='+b.id,'POST',{...body,storyId:b.id,action:'complete'})).status,409);
 await f.request('/api/stories/'+a.id,'DELETE',{});assert.equal((await f.request(endpoint+'?storyId='+a.id)).status,404);
});
test('story seeds generate deterministic separate maps without changing legacy generation',()=>{assert.deepEqual(generateChunk('nox',0,0,'a'),generateChunk('nox',0,0,'a'));assert.notDeepEqual(generateChunk('nox',0,0,'a'),generateChunk('nox',0,0,'b'));});
