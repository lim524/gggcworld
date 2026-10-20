import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createWorker } from '../src/worker.js';

function fixture(){
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
  for(const file of ['0001_auth.sql','0002_member_profile.sql','0003_community.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  for(const id of ['a','b','new'])sql.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,0,0)').run(id,'Private '+id,id+'@example.com');
  sql.prepare('INSERT INTO member_profile VALUES (?,?,?)').run('a','여행자A','astra');sql.prepare('INSERT INTO member_profile VALUES (?,?,?)').run('b','여행자B','nox');
  const DB={prepare(query){let values=[];const stmt={bind(...params){values=params;return stmt;},async all(){const results=sql.prepare(query).all(...values);return {results,meta:{changes:sql.prepare('SELECT changes() AS n').get().n}};},async first(){return (await stmt.all()).results[0]||null;},async run(){return stmt.all();}};return stmt;}};
  const env={DB,BETTER_AUTH_URL:'https://gggc.example',BETTER_AUTH_SECRET:'x'.repeat(32),GOOGLE_CLIENT_ID:'x',GOOGLE_CLIENT_SECRET:'x'};
  // Session cryptography is covered by auth.test.js; inject identities to isolate authorization tests.
  const worker=createWorker(()=>({api:{getSession:async({headers})=>{const id=headers.get('Cookie');return ['a','b','new'].includes(id)?{user:{id}}:null;}}}));
  const request=(path,method='GET',body,uid,origin=env.BETTER_AUTH_URL)=>worker.fetch(new Request(env.BETTER_AUTH_URL+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(uid?{Cookie:uid}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
  return {sql,request};
}
const input={title:'첫 번째 글',body:'공유되는 내용\n두 번째 줄',category:'자유'};
test('posts are shared, require membership, and derive identity/faction on the server',async()=>{
  const {request}=fixture();
  assert.equal((await request('/api/posts','POST',input)).status,401);
  assert.equal((await request('/api/posts','POST',input,'new')).status,403);
  assert.equal((await request('/api/posts','POST',input,'a','https://evil.example')).status,403);
  const created=await request('/api/posts','POST',{...input,authorId:'b',author:'forged',faction:'nox'},'a');assert.equal(created.status,201);
  const {id}=await created.json();
  const data=await (await request('/api/posts/'+id)).json();
  assert.equal(data.post.author,'여행자A');assert.equal(data.post.faction,'astra');assert.equal(data.post.body,input.body);
  const second=await (await request('/api/posts','GET',null,'b')).json();assert.equal(second.total,1);assert.equal(second.posts[0].id,id);
  assert.equal((await request('/api/posts','POST',input,'a')).status,429);
  assert.equal((await request('/api/posts','POST',{...input,title:' '},'b')).status,400);
  assert.equal((await request('/api/posts','POST',{...input,body:'x'.repeat(10001)},'b')).status,400);
});
test('only the owner can edit or soft-delete; comments and votes persist safely',async()=>{
  const {request,sql}=fixture();const {id}=await (await request('/api/posts','POST',input,'a')).json();
  assert.equal((await request('/api/posts/'+id,'PATCH',{...input,title:'수정된 제목'},'b')).status,403);
  assert.equal((await request('/api/posts/'+id,'DELETE',null,'b')).status,403);
  assert.equal((await request('/api/posts/'+id,'PATCH',{...input,title:'수정된 제목'},'a')).status,200);
  assert.equal((await request('/api/posts/'+id+'/comments','POST',{body:'실제 댓글'},'b')).status,201);
  assert.equal((await request('/api/posts/'+id+'/comments','POST',{body:'중복 빠른 댓글'},'b')).status,429);
  assert.equal((await request('/api/posts/'+id+'/vote','POST',{},'b')).status,200);
  assert.equal((await (await request('/api/posts/'+id+'/vote','POST',{},'b')).json()).votes,1);
  let data=await (await request('/api/posts/'+id,'GET',null,'b')).json();assert.equal(data.voted,true);assert.equal(data.post.replies,1);assert.equal(data.comments[0].author,'여행자B');assert.equal(data.post.title,'수정된 제목');
  assert.equal((await (await request('/api/posts/'+id+'/vote','DELETE',null,'b')).json()).votes,0);
  assert.equal((await request('/api/posts/'+id,'DELETE',null,'a')).status,200);
  assert.equal((await request('/api/posts/'+id)).status,404);
  assert.equal((await request('/api/posts/'+id+'/comments','POST',{body:'삭제 후 댓글'},'b')).status,404);
  assert.equal((await (await request('/api/posts')).json()).total,0);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM community_post').get().n,1);
});
test('feed pagination and filters apply to server data and bind search input',async()=>{
  const {request,sql}=fixture();for(let i=0;i<21;i++)sql.prepare('INSERT INTO community_post(authorId,faction,category,title,body,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)').run(i%2?'a':'b',i%2?'astra':'nox','정보','글 '+i,'<script>alert(1)</script>',i,i);
  let data=await (await request('/api/posts?page=2')).json();assert.equal(data.total,21);assert.equal(data.posts.length,6);assert.equal(data.pages,2);
  data=await (await request('/api/posts?faction=astra&category='+encodeURIComponent('정보'))).json();assert.equal(data.total,10);
  data=await (await request('/api/posts?q='+encodeURIComponent("' OR 1=1 --"))).json();assert.equal(data.total,0);
  data=await (await request('/api/posts?ids=1,2,3')).json();assert.equal(data.total,3);
  assert.equal((await (await request('/api/posts?ids=')).json()).total,0);
  assert.equal((await request('/api/posts?category=invalid')).status,400);
});
test('atomic cooldown blocks simultaneous duplicate submissions',async()=>{
  const {request}=fixture();const results=await Promise.all([request('/api/posts','POST',input,'a'),request('/api/posts','POST',input,'a')]);assert.deepEqual(results.map(r=>r.status).sort(),[201,429]);
});
