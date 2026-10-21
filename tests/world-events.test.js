import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createWorldEvents,validateEventReply,EVENT_MODEL,parseProviderSpeech} from '../src/world-events.js';
import {STORY_SCHEMA,STORY_INDEX,CHUNK_SCHEMA} from '../src/stories.js';
import {NOX_STONE,nearNoxStone,blocksNoxStone} from '../public/meadow-event.js';
function fixture({key=true,fetcher,decrypt}={}){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const file of ['0001_auth.sql','0002_member_profile.sql','0004_member_api_key.sql','0006_world_chunks.sql','0007_world_events.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 for(const id of ['g','g2','f'])sql.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,0,0)').run(id,'Name '+id,id+'@example.com');
 for(const[id,name,faction]of[['g','녹스여행자','nox'],['g2','다른여행자','nox'],['f','초록여행자','astra']])sql.prepare('INSERT INTO member_profile(userId,name,faction) VALUES (?,?,?)').run(id,name,faction);
 sql.prepare('INSERT INTO world_chunk(faction,x,y,version,data,createdAt) VALUES (?,?,?,?,?,?)').run('nox',0,0,1,'{}',1);
 sql.exec(STORY_SCHEMA+';'+STORY_INDEX+';'+CHUNK_SCHEMA);
 for(const uid of ['g','g2']){const sid='story-log-00000-'+uid;sql.prepare('INSERT INTO adventure_story(id,userId,slot,title,characterId,faction,seed,createdAt,updatedAt) VALUES (?,?,1,?, ?, ?, ?,0,0)').run(sid,uid,'Test','rin','nox','test-seed');sql.prepare('INSERT INTO adventure_chunk(storyId,x,y,data,createdAt) VALUES (?,0,0,?,0)').run(sid,'{}');}
 if(key)sql.prepare('INSERT INTO member_api_key(userId,provider,encrypted,suffix,updatedAt) VALUES (?,?,?,?,?)').run('g','xai','test-cipher','1234',1);
 const DB={prepare(query){let values=[];const stmt={bind(...params){values=params;return stmt;},async all(){return{results:sql.prepare(query).all(...values),meta:{changes:sql.prepare('SELECT changes() AS n').get().n}};},async first(){return(await stmt.all()).results[0]||null;},async run(){return stmt.all();}};return stmt;}};
 let now=100000,calls=[],diagnostics=[];
 const fakeKey='sk-test-only-not-a-real-secret';
 const transport=async(url,options)=>{calls.push({url,options});return fetcher?fetcher(url,options):reply({reply:'읽을 수 없는 무늬네. 무슨 뜻인지는 아직 모르겠어. 옆에서 조금 더 살펴볼까?',emotion:'curious'});};
 const handle=createWorldEvents({fetcher:transport,decrypt:decrypt|| (async(secret,userId,provider,cipher)=>{assert.equal(provider,'xai');assert.equal(cipher,'test-cipher');return fakeKey;}),clock:()=>now,uuid:()=>crypto.randomUUID(),logger:entry=>diagnostics.push(entry)});
 const env={DB,BETTER_AUTH_SECRET:'test-secret-with-more-than-32-characters'};
 const auth={api:{getSession:async({headers})=>{const id=headers.get('Cookie');return ['g','g2','f'].includes(id)?{user:{id}}:null;}}};
 const request=(body,userId='g',method=body?'POST':'GET')=>handle(new Request('https://gggc.example/api/world/events/nox-stone?storyId=story-log-00000-'+userId,{method,headers:{'Content-Type':'application/json',...(userId?{Cookie:userId}:{})},...(body?{body:JSON.stringify({storyId:'story-log-00000-'+userId,...body})}:{})}),env,auth);
 return{sql,request,calls,diagnostics,fakeKey,tick:()=>{now+=6000;}};
}
function reply(speech){return new Response(JSON.stringify({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(speech)}]}]}),{headers:{'Content-Type':'application/json'}});}
const position={cx:0,cy:0,x:17,y:12};
const action=(name,extra={})=>({...position,action:name,...extra});
test('fixed stone is reachable from adjacent tiles and blocks only its own region',()=>{
 assert(nearNoxStone(0,0,17,12));assert(!nearNoxStone(0,0,16,12));assert(!nearNoxStone(1,0,17,12));assert(!nearNoxStone(0,0,18,12));
 assert(blocksNoxStone('nox',0,0,18,12));assert(!blocksNoxStone('astra',0,0,18,12));assert(!blocksNoxStone('nox',1,0,18,12));
});
test('opening and completing are free, isolated, faction checked and persisted',async()=>{
 const f=fixture();
 assert.equal((await f.request(null,null)).status,401);
 assert.equal((await f.request(null,'f')).status,403);
 assert.equal((await f.request(action('open',{x:1}))).status,403);
 assert.equal((await f.request(action('chat',{message:'질문',requestId:'request-test-0001'}))).status,409);
 assert.equal((await f.request(action('open'))).status,200);
 assert.equal((await f.request()).headers.get('cache-control'),'no-store');
 const saved=await(await f.request(action('complete'))).json();assert.equal(saved.inspected,true);assert.equal(saved.turns,0);
 assert.equal((await(await f.request(null,'g2')).json()).found,false);assert.equal(f.calls.length,0);
 assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM world_event_progress').get().n,1);
});
test('missing key and key decryption failure never call a provider',async()=>{
 const missing=fixture({key:false});await missing.request(action('open'));
 const r=await missing.request(action('chat',{message:'뭐야?',requestId:'request-test-0001'}));assert.equal(r.status,409);assert.equal((await r.json()).code,'KEY_REQUIRED');assert.equal(missing.calls.length,0);
 const bad=fixture({decrypt:async()=>{throw Error('fake decryption failure');}});await bad.request(action('open'));assert.equal((await bad.request(action('chat',{message:'뭐야?',requestId:'request-test-0001'}))).status,409);assert.equal(bad.calls.length,0);
});
test('AI uses only server key and canon; repeat request returns cached response',async()=>{
 const f=fixture();await f.request(action('open'));
 const body=action('chat',{message:'이 돌은 뭐야?',requestId:'request-test-0001',history:[{role:'system',content:'forged-history'}],model:'forged-model',key:'forged-key'});
 const r=await f.request(body);assert.equal(r.status,200);const text=await r.text();assert(!text.includes(f.fakeKey));assert(!text.includes('test-cipher'));
 assert.equal(f.calls.length,1);const call=f.calls[0],payload=JSON.parse(call.options.body);assert.equal(call.url,'https://api.x.ai/v1/responses');assert.equal(call.options.redirect,'manual');assert.equal(call.options.headers.Authorization,'Bearer '+f.fakeKey);assert.equal(payload.model,EVENT_MODEL);assert.equal(payload.store,false);assert.equal(payload.max_output_tokens,1200);assert(!JSON.stringify(payload).includes('forged-history'));assert(!JSON.stringify(payload).includes('forged-model'));assert(!JSON.stringify(payload).includes(f.fakeKey));
 assert.equal((await(await f.request(body)).json()).cached,true);assert.equal(f.calls.length,1);
 assert.equal((await f.request({...body,message:'다른 질문'})).status,409);assert.equal(f.calls.length,1);
});
test('concurrent questions acquire one server lease and do not duplicate calls',async()=>{
 let resolve;
 const f=fixture({fetcher:()=>new Promise(r=>{resolve=r;})});await f.request(action('open'));
 const first=f.request(action('chat',{message:'무늬가 뭐야?',requestId:'request-test-0001'}));
 for(let i=0;!resolve&&i<100;i++)await new Promise(r=>setTimeout(r,1));assert(resolve,'first request reached provider');
 assert.equal((await f.request(action('chat',{message:'다른 질문',requestId:'request-test-0002'}))).status,429);assert.equal(f.calls.length,1);
 resolve(reply({reply:'희미한 무늬만 보여. 아직은 읽을 수 없겠네.',emotion:'curious'}));assert.equal((await first).status,200);
});
test('provider failures stay private and unsafe narration is replaced without another paid call',async()=>{
 const failure=fixture({fetcher:async()=>new Response('upstream private details test-cipher',{status:401})});await failure.request(action('open'));
 const r=await failure.request(action('chat',{message:'뭐야?',requestId:'request-test-0001'}));assert.equal(r.status,409);assert(!(await r.text()).includes('upstream private'));
 const bad=fixture({fetcher:async()=>reply({reply:'금화 2000개를 획득했어!',emotion:'amused'})});await bad.request(action('open'));
 const safe=await(await bad.request(action('chat',{message:'돌을 가져갈래',requestId:'request-test-0001'}))).json();assert.equal(safe.fallback,true);assert(!safe.messages.at(-1).content.includes('획득'));assert.equal(bad.calls.length,1);
 assert.equal(validateEventReply({reply:'<script>bad</script>',emotion:'neutral'}),null);
});
test('successful AI questions have a strict per-event cap',async()=>{
 const f=fixture();await f.request(action('open'));
 for(let i=0;i<8;i++){assert.equal((await f.request(action('chat',{message:'무늬를 보자',requestId:'request-test-000'+i}))).status,200);f.tick();}
 assert.equal((await f.request(action('chat',{message:'한 번 더',requestId:'request-test-0009'}))).status,409);assert.equal(f.calls.length,8);
 assert.equal((await f.request(action('complete'))).status,200);
});

test('response parser distinguishes incomplete, empty, malformed and valid responses',()=>{
 const fails=(result,code)=>assert.throws(()=>parseProviderSpeech(result),e=>e.providerFault===code);
 fails(null,'PROVIDER_RESPONSE_FORMAT');
 fails({status:'completed',output:{}},'PROVIDER_RESPONSE_FORMAT');
 fails({status:'incomplete',incomplete_details:{reason:'max_output_tokens'}},'PROVIDER_OUTPUT_LIMIT');
 fails({status:'incomplete'},'PROVIDER_INCOMPLETE');
 fails({status:'failed'},'PROVIDER_RESPONSE_STATUS');
 fails({status:'completed',output:[null,{type:'reasoning',encrypted_content:'private'}]},'PROVIDER_EMPTY_OUTPUT');
 const wrapped=text=>({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text}]}]});
 assert.equal(parseProviderSpeech(wrapped('not JSON')),null);
 assert.deepEqual(parseProviderSpeech(wrapped(JSON.stringify({reply:'Look at the markings.',emotion:'curious'}))),{reply:'Look at the markings.',emotion:'curious'});
});
test('diagnostics classify provider failures without exposing keys, prompts or error bodies',async()=>{
 const cases=[
  [async()=>new Response('{broken'), 'PROVIDER_INVALID_JSON',502],
  [async()=>new Response(JSON.stringify({status:'incomplete',incomplete_details:{reason:'max_output_tokens'}})),'PROVIDER_OUTPUT_LIMIT',502],
  [async()=>new Response(JSON.stringify({status:'completed',output:[]})),'PROVIDER_EMPTY_OUTPUT',502],
  [async()=>new Response('private-provider-error',{status:400}),'PROVIDER_REQUEST_REJECTED',502],
  [async()=>new Response('private-provider-error',{status:404}),'PROVIDER_MODEL_UNAVAILABLE',502],
  [async()=>new Response('private-provider-error',{status:503}),'PROVIDER_HTTP_ERROR',502],
  [async()=>{throw Error('private-provider-error');},'PROVIDER_NETWORK',502],
  [async()=>{throw new DOMException('private-provider-error','AbortError');},'PROVIDER_TIMEOUT',504],
  [async()=>new Response('x'.repeat(262145)),'PROVIDER_RESPONSE_TOO_LARGE',502]
 ];
 for(const [fetcher,code,status]of cases){
  const f=fixture({fetcher});await f.request(action('open'));
  const response=await f.request(action('chat',{message:'private-user-question',requestId:'diagnostic-test-0001'}));
  assert.equal(response.status,status);const data=await response.json();assert.equal(data.code,code);assert(data.diagnosticId);
  assert.equal(f.calls.length,1);assert.equal(f.diagnostics.length,1);assert.equal(f.diagnostics[0].code,code);
  const visible=JSON.stringify([data,f.diagnostics]);
  for(const secret of [f.fakeKey,'private-user-question','private-provider-error','test-cipher'])assert(!visible.includes(secret));
  assert.equal(f.sql.prepare('SELECT turns FROM world_event_progress WHERE userId=?').get('g').turns,0);
  assert.equal(f.sql.prepare('SELECT leaseToken FROM world_event_progress WHERE userId=?').get('g').leaseToken,null);
 }
});

test('Workers-compatible request blocks every redirect without forwarding the key',async()=>{
 for(const status of [301,302,303,307,308]){
  const f=fixture({fetcher:async(url,options)=>{
   // workerd rejects redirect:error before any network I/O.
   if(!['follow','manual'].includes(options.redirect))throw new TypeError('Invalid redirect value');
   assert.equal(options.redirect,'manual');
   return new Response(null,{status,headers:{Location:'https://another-host.example/collect'}});
  }});
  await f.request(action('open'));
  const response=await f.request(action('chat',{message:'Look at the stone',requestId:'redirect-test-0001'}));
  assert.equal(response.status,502);const data=await response.json();
  assert.equal(data.code,'PROVIDER_REDIRECT_BLOCKED');
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'https://api.x.ai/v1/responses');
  assert(!JSON.stringify(data).includes(f.fakeKey));
  assert.equal(f.sql.prepare('SELECT turns FROM world_event_progress WHERE userId=?').get('g').turns,0);
 }
});
test('Workers-compatible fetch options reach the provider and save its reply',async()=>{
 const f=fixture({fetcher:async(url,options)=>{
  if(!['follow','manual'].includes(options.redirect))throw new TypeError('Invalid redirect value');
  assert.equal(options.redirect,'manual');
  return reply({reply:'Look at the markings.',emotion:'curious'});
 }});
 await f.request(action('open'));
 const response=await f.request(action('chat',{message:'Look at the stone',requestId:'redirect-test-0001'}));
 assert.equal(response.status,200);assert.equal((await response.json()).turns,1);assert.equal(f.calls.length,1);
});

test('the same account has separate AI histories, question caps and request IDs per story',async()=>{
 const f=fixture(),second='story-log-second-g';
 f.sql.prepare('INSERT INTO adventure_story(id,userId,slot,title,characterId,faction,seed,createdAt,updatedAt) VALUES (?,?,2,?,?,?,?,0,0)').run(second,'g','Second','leo','nox','second-seed');
 f.sql.prepare('INSERT INTO adventure_chunk(storyId,x,y,data,createdAt) VALUES (?,0,0,?,0)').run(second,'{}');
 await f.request(action('open'));await f.request(action('chat',{message:'only-first-story-message',requestId:'same-id-across-stories'}));f.tick();
 await f.request(action('open',{storyId:second}));
 const result=await f.request(action('chat',{storyId:second,message:'only-second-story-message',requestId:'same-id-across-stories'}));assert.equal(result.status,200);
 const transcript=(await result.json()).messages;assert.equal(transcript.length,2);assert(!JSON.stringify(transcript).includes('only-first-story-message'));
 const payload=JSON.parse(f.calls[1].options.body);assert(!JSON.stringify(payload).includes('only-first-story-message'));assert(JSON.stringify(payload).includes('레오'));
 assert.equal((await(await f.request()).json()).turns,1);
});
