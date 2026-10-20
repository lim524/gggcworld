import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createWorker } from '../src/worker.js';
import { openKey, sealKey } from '../src/byok.js';
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0001_auth.sql','0002_member_profile.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 for(const id of ['a','b'])sql.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,0,0)').run(id,'Name '+id,id+'@example.com');
 sql.prepare('INSERT INTO member_profile(userId,name,faction) VALUES (?,?,?)').run('a','여행자A','astra');sql.prepare('INSERT INTO member_profile(userId,name,faction) VALUES (?,?,?)').run('b','여행자B','nox');
 const DB={prepare(query){let values=[];const stmt={bind(...params){values=params;return stmt;},async all(){return {results:sql.prepare(query).all(...values)};},async first(){return (await stmt.all()).results[0]||null;},async run(){return stmt.all();}};return stmt;}};
 const env={DB,BETTER_AUTH_URL:'https://gggc.example',BETTER_AUTH_SECRET:'test-only-vault-secret-32-characters',GOOGLE_CLIENT_ID:'x',GOOGLE_CLIENT_SECRET:'x'};
 const worker=createWorker(()=>({api:{getSession:async({headers})=>{const id=headers.get('Cookie');return ['a','b'].includes(id)?{user:{id}}:null;}}}));
 const request=(path,method='GET',body,uid,origin=env.BETTER_AUTH_URL)=>worker.fetch(new Request(env.BETTER_AUTH_URL+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(uid?{Cookie:uid}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
 return {sql,request,env};
}
const key='sk-test-only-not-a-real-api-key-1234';
test('BYOK storage encrypts keys, isolates accounts and only returns masked metadata',async()=>{
 const {sql,request,env}=fixture();
 assert.equal((await request('/api/me/keys')).status,401);
 assert.equal((await request('/api/me/keys/openai','PUT',{key},'a','https://evil.example')).status,403);
 let r=await request('/api/me/keys/openai','PUT',{key,userId:'b'},'a');assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert(!(await r.text()).includes(key));
 const saved=sql.prepare('SELECT * FROM member_api_key').get();assert.equal(saved.userId,'a');assert(!saved.encrypted.includes(key));assert.equal(saved.suffix,'1234');assert.equal(await openKey(env.BETTER_AUTH_SECRET,'a','openai',saved.encrypted),key);
 let data=await (await request('/api/me/keys','GET',null,'a')).json();assert.equal(data.keys.length,1);assert.deepEqual(Object.keys(data.keys[0]).sort(),['provider','suffix','updatedAt']);assert.equal((await (await request('/api/me/keys','GET',null,'b')).json()).keys.length,0);
 await request('/api/me/keys/openai','DELETE',null,'b');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM member_api_key').get().n,1);
 const replacement=key+'5678';await request('/api/me/keys/openai','PUT',{key:replacement},'a');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM member_api_key').get().n,1);assert.equal((await (await request('/api/me/keys','GET',null,'a')).json()).keys[0].suffix,'5678');
 await request('/api/me/keys/openai','DELETE',null,'a');assert.equal((await (await request('/api/me/keys','GET',null,'a')).json()).keys.length,0);
});
test('vault authentication rejects moved, modified or incorrectly decrypted ciphertext',async()=>{
 const secret='test-secret-which-is-longer-than-32';const sealed=await sealKey(secret,'a','openai',key);
 assert.notEqual(await sealKey(secret,'a','openai',key),sealed);
 for(const [s,u,p] of [[secret,'b','openai'],[secret,'a','google'],[secret+'changed','a','openai']])await assert.rejects(()=>openKey(s,u,p,sealed));
 const parts=sealed.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);await assert.rejects(()=>openKey(secret,'a','openai',parts.join('.')));
});
test('BYOK rejects unsupported providers, malformed keys and oversized bodies',async()=>{
 const {request}=fixture();
 assert.equal((await request('/api/me/keys/unknown','PUT',{key},'a')).status,404);
 assert.equal((await request('/api/me/keys/openai','GET',null,'a')).status,405);
 for(const invalid of ['', 'short', 'x'.repeat(513), 'sk-test with whitespace', 'sk-test-control\u0000andcharacters'])assert.equal((await request('/api/me/keys/openai','PUT',{key:invalid},'a')).status,400);
 assert.equal((await request('/api/me/keys/openai','PUT',{key:'x'.repeat(3000)},'a')).status,413);
});

test('BYOK only accepts the provider belonging to the immutable account faction',async()=>{
 const {request,sql}=fixture();
 for(const provider of ['anthropic','google','xai'])assert.equal((await request('/api/me/keys/'+provider,'PUT',{key},'a')).status,403);
 assert.equal((await request('/api/me/keys/openai','PUT',{key,faction:'astra'},'b')).status,403);
 assert.equal((await request('/api/me/keys/xai','PUT',{key},'b')).status,200);
 assert.equal((await (await request('/api/me/keys','GET',null,'a')).json()).allowedProvider,'openai');
 assert.equal((await (await request('/api/me/keys','GET',null,'b')).json()).allowedProvider,'xai');
 sql.prepare('DELETE FROM member_profile WHERE userId = ?').run('a');
 assert.equal((await request('/api/me/keys/openai','PUT',{key},'a')).status,403);
});
