import {generateChunk,walkable,REGION_LIMIT,REGION_NAMES} from '../public/worldgen.js';
import {blocksNoxStone} from '../public/meadow-event.js';
export const STORY_SCHEMA=`CREATE TABLE IF NOT EXISTS adventure_story (
 id TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
 slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 5),title TEXT NOT NULL,
 characterId TEXT NOT NULL CHECK(characterId IN ('rin','leo')),faction TEXT NOT NULL,seed TEXT NOT NULL,
 cx INTEGER NOT NULL DEFAULT 0,cy INTEGER NOT NULL DEFAULT 0,x INTEGER NOT NULL DEFAULT 16,y INTEGER NOT NULL DEFAULT 12,
 tutorialSeen INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL DEFAULT 0,
 createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL,deletedAt INTEGER
)`;
export const STORY_INDEX='CREATE UNIQUE INDEX IF NOT EXISTS adventure_story_active_slot ON adventure_story(userId,slot) WHERE deletedAt IS NULL';
export const CHUNK_SCHEMA=`CREATE TABLE IF NOT EXISTS adventure_chunk (
 storyId TEXT NOT NULL REFERENCES adventure_story(id) ON DELETE CASCADE,
 x INTEGER NOT NULL,y INTEGER NOT NULL,data TEXT NOT NULL,createdAt INTEGER NOT NULL,
 PRIMARY KEY(storyId,x,y)
)`;
export async function ensureStories(env){for(const sql of [STORY_SCHEMA,STORY_INDEX,CHUNK_SCHEMA])await env.DB.prepare(sql).run();}
export async function ownStory(env,userId,id){if(typeof id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(id))return null;return env.DB.prepare('SELECT * FROM adventure_story WHERE id=? AND userId=? AND deletedAt IS NULL').bind(id,userId).first();}
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function publicStory(s){const {userId,seed,deletedAt,...safe}=s;return safe;}
async function body(request){const reader=request.body?.getReader();if(!reader)return null;let size=0,parts=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw Error('BODY_TOO_LARGE');}parts.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{return null;}}
export async function stories(request,env,auth){
 const url=new URL(request.url),session=await auth.api.getSession({headers:request.headers});
 if(!session)return json({error:'로그인 후 나의 이야기를 시작할 수 있어요.'},401);
 const userId=session.user.id,profile=await env.DB.prepare('SELECT faction FROM member_profile WHERE userId=?').bind(userId).first();
 if(!profile||!Object.hasOwn(REGION_NAMES,profile.faction))return json({error:'프로필에서 닉네임과 진영을 먼저 확정해주세요.'},403);
 await ensureStories(env);
 const id=url.pathname.split('/')[3],base=!id;
 if(base&&request.method==='GET'){
  const rows=await env.DB.prepare('SELECT * FROM adventure_story WHERE userId=? AND deletedAt IS NULL ORDER BY slot').bind(userId).all();
  return json({stories:rows.results.map(publicStory),limit:5});
 }
 let input;try{input=await body(request);}catch{return json({error:'입력한 내용이 너무 길어요.'},413);}
 if(base&&request.method==='POST'){
  const title=typeof input?.title==='string'?input.title.trim().normalize('NFC'):'';
  if(!['rin','leo'].includes(input?.characterId)||!title||[...title].length>40||/[\p{C}<>]/u.test(title))return json({error:'시작 캐릭터와 1~40자의 이야기 이름을 정해주세요.'},400);
  const storyId=crypto.randomUUID(),now=Date.now();
  // One atomic statement + unique active slot index enforces five even across tabs.
  const result=await env.DB.prepare(`INSERT INTO adventure_story(id,userId,slot,title,characterId,faction,seed,createdAt,updatedAt)
   SELECT ?,?,available.slot,?,?,?,?,?,? FROM (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) available
   WHERE NOT EXISTS(SELECT 1 FROM adventure_story s WHERE s.userId=? AND s.slot=available.slot AND s.deletedAt IS NULL) ORDER BY available.slot LIMIT 1`)
   .bind(storyId,userId,title,input.characterId,profile.faction,crypto.randomUUID(),now,now,userId).run();
  if(!result.meta.changes)return json({error:'이야기는 최대 5개까지 저장할 수 있어요. 기존 로그를 보관 해제한 뒤 새로 시작해주세요.'},409);
  return json({story:publicStory(await ownStory(env,userId,storyId))},201);
 }
 if(url.pathname.endsWith('/restore')&&request.method==='POST'){
  const archived=await env.DB.prepare('SELECT * FROM adventure_story WHERE id=? AND userId=? AND deletedAt IS NOT NULL').bind(id,userId).first();
  if(!archived)return json({error:'복원할 로그를 찾을 수 없어요.'},404);
  const result=await env.DB.prepare(`UPDATE adventure_story SET deletedAt=NULL,slot=(SELECT available.slot FROM (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) available WHERE NOT EXISTS(SELECT 1 FROM adventure_story s WHERE s.userId=? AND s.slot=available.slot AND s.deletedAt IS NULL) ORDER BY available.slot LIMIT 1) WHERE id=? AND userId=? AND (SELECT COUNT(*) FROM adventure_story WHERE userId=? AND deletedAt IS NULL)<5`).bind(userId,id,userId,userId).run();
  if(!result.meta.changes)return json({error:'빈 저장 슬롯이 있어야 복원할 수 있어요.'},409);
  return json({story:publicStory(await ownStory(env,userId,id))});
 }
 const story=await ownStory(env,userId,id);if(!story)return json({error:'이야기를 찾을 수 없어요.'},404);
 if(request.method==='GET'){
  const visited=await env.DB.prepare('SELECT x,y FROM adventure_chunk WHERE storyId=? ORDER BY createdAt').bind(story.id).all();
  return json({story:publicStory(story),visited:visited.results});
 }
 if(request.method==='DELETE'){
  // Archive instead of deleting: old logs remain recoverable via the restore action.
  await env.DB.prepare('UPDATE adventure_story SET deletedAt=? WHERE id=? AND userId=? AND deletedAt IS NULL').bind(Date.now(),story.id,userId).run();
  return json({archived:true,id:story.id});
 }
 if(request.method!=='PATCH')return json({error:'지원하지 않는 요청이에요.'},405);
 const {cx,cy,x,y,revision,tutorialSeen}=input||{};
 if(![cx,cy,x,y,revision].every(Number.isInteger)||Math.abs(cx)>REGION_LIMIT||Math.abs(cy)>REGION_LIMIT||![undefined,true,false].includes(tutorialSeen))return json({error:'저장 위치를 확인해주세요.'},400);
 const region=await env.DB.prepare('SELECT data FROM adventure_chunk WHERE storyId=? AND x=? AND y=?').bind(story.id,cx,cy).first();
 if(!region||!walkable(JSON.parse(region.data),x,y)||blocksNoxStone(story.faction,cx,cy,x,y))return json({error:'탐험한 지역의 이동 가능한 위치만 저장할 수 있어요.'},400);
 const changed=await env.DB.prepare('UPDATE adventure_story SET cx=?,cy=?,x=?,y=?,tutorialSeen=MAX(tutorialSeen,?),revision=revision+1,updatedAt=? WHERE id=? AND userId=? AND deletedAt IS NULL AND revision=?')
  .bind(cx,cy,x,y,tutorialSeen?1:0,Date.now(),story.id,userId,revision).run();
 if(!changed.meta.changes)return json({error:'다른 창에서 이 이야기가 변경됐어요. 로그 목록에서 다시 열어주세요.',code:'STORY_CONFLICT'},409);
 return json({story:publicStory(await ownStory(env,userId,story.id))});
}
export async function storyChunk(request,env,auth){
 if(request.method!=='POST')return json({error:'지원하지 않는 요청이에요.'},405);
 const session=await auth.api.getSession({headers:request.headers});if(!session)return json({error:'로그인 후 탐험할 수 있어요.'},401);
 await ensureStories(env);let input;try{input=await body(request);}catch{return json({error:'입력한 내용이 너무 길어요.'},413);}
 const story=await ownStory(env,session.user.id,input?.storyId);if(!story)return json({error:'나의 이야기에서 탐험을 시작해주세요.'},404);
 const {x,y}=input;
 if(!Number.isInteger(x)||!Number.isInteger(y)||Math.abs(x)>REGION_LIMIT||Math.abs(y)>REGION_LIMIT)return json({error:'탐험 경계에 도착했어요.'},400);
 const find=()=>env.DB.prepare('SELECT data,createdAt FROM adventure_chunk WHERE storyId=? AND x=? AND y=?').bind(story.id,x,y).first();let row=await find();
 if(!row){const chunk=generateChunk(story.faction,x,y,story.seed),now=Date.now();
  await env.DB.prepare('INSERT INTO adventure_chunk(storyId,x,y,data,createdAt) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM adventure_chunk WHERE storyId=? AND createdAt>?)<12 ON CONFLICT(storyId,x,y) DO NOTHING').bind(story.id,x,y,JSON.stringify(chunk),now,story.id,now-60000).run();row=await find();
  if(!row)return json({error:'새 지역을 빠르게 탐험했어요. 잠시 후 다시 이동해주세요.'},429);
 }
 return json({chunk:{...JSON.parse(row.data),x,y,faction:story.faction},region:REGION_NAMES[story.faction],createdAt:row.createdAt});
}
