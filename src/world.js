import {generateChunk,REGION_LIMIT,REGION_NAMES} from '../public/worldgen.js';
const SCHEMA="CREATE TABLE IF NOT EXISTS world_chunk (\n faction TEXT NOT NULL CHECK(faction IN ('astra','serin','lumi','nox')),\n x INTEGER NOT NULL,y INTEGER NOT NULL,version INTEGER NOT NULL,data TEXT NOT NULL,\n firstDiscoveredBy TEXT REFERENCES user(id) ON DELETE SET NULL,createdAt INTEGER NOT NULL,\n PRIMARY KEY(faction,x,y)\n)";
const INDEX="CREATE INDEX IF NOT EXISTS world_chunk_discovery_rate ON world_chunk(firstDiscoveredBy,createdAt)";
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function world(request,env,auth){
 if(new URL(request.url).pathname!=='/api/world/chunks')return json({error:'찾을 수 없는 요청이에요.'},404);
 if(request.method!=='POST')return json({error:'지원하지 않는 요청이에요.'},405);
 const session=await auth.api.getSession({headers:request.headers});if(!session)return json({error:'로그인 후 초원을 탐험할 수 있어요.'},401);
 const profile=await env.DB.prepare('SELECT name,faction FROM member_profile WHERE userId = ?').bind(session.user.id).first();
 if(!profile||!Object.hasOwn(REGION_NAMES,profile.faction))return json({error:'먼저 프로필에서 닉네임과 진영을 확정해주세요.'},403);
 const reader=request.body?.getReader();if(!reader)return json({error:'지역 좌표를 확인해주세요.'},400);
 let length=0,parts=[];while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>1024){await reader.cancel();return json({error:'입력한 내용이 너무 길어요.'},413);}parts.push(value);}
 const raw=new Uint8Array(length);let offset=0;for(const part of parts){raw.set(part,offset);offset+=part.length;}
 let body;try{body=JSON.parse(new TextDecoder().decode(raw));}catch{return json({error:'지역 좌표를 확인해주세요.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'지역 좌표를 확인해주세요.'},400);
 const {x,y}=body;
 if(!Number.isInteger(x)||!Number.isInteger(y)||Math.abs(x)>REGION_LIMIT||Math.abs(y)>REGION_LIMIT)return json({error:'지금은 이 지역의 탐험 경계까지 왔어요.'},400);
 await env.DB.prepare(SCHEMA).run();await env.DB.prepare(INDEX).run();
 const faction=profile.faction;
 const find=()=>env.DB.prepare('SELECT c.data,c.createdAt,p.name AS discoveredBy FROM world_chunk c LEFT JOIN member_profile p ON p.userId=c.firstDiscoveredBy WHERE c.faction=? AND c.x=? AND c.y=?').bind(faction,x,y).first();
 let row=await find();
 if(!row){
  const chunk=generateChunk(faction,x,y),now=Date.now();
  await env.DB.prepare('INSERT INTO world_chunk(faction,x,y,version,data,firstDiscoveredBy,createdAt) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM world_chunk WHERE firstDiscoveredBy=? AND createdAt>?) < 12 ON CONFLICT(faction,x,y) DO NOTHING').bind(faction,x,y,chunk.version,JSON.stringify(chunk),session.user.id,now,session.user.id,now-60000).run();
  row=await find();if(!row)return json({error:'새 지역을 잠시 많이 발견했어요. 조금 후 다시 이동해주세요.'},429);
 }
 return json({chunk:{...JSON.parse(row.data),x,y,faction},region:REGION_NAMES[faction],discoveredBy:row.discoveredBy||'이전 여행자',createdAt:row.createdAt});
}
