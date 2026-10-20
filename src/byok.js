// Server-only encrypted BYOK vault. No endpoint returns or sends plaintext keys to providers.
export const VAULT_SCHEMA="CREATE TABLE IF NOT EXISTS member_api_key (\n userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,\n provider TEXT NOT NULL CHECK(provider IN ('openai','anthropic','google','xai')),\n encrypted TEXT NOT NULL, suffix TEXT NOT NULL, updatedAt INTEGER NOT NULL,\n PRIMARY KEY(userId,provider)\n)";
const factionProvider={astra:'openai',serin:'anthropic',lumi:'google',nox:'xai'};
const providers=new Set(['openai','anthropic','google','xai']);
const encoder=new TextEncoder();
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const bytes=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
async function vaultKey(secret){
 const material=await crypto.subtle.importKey('raw',encoder.encode(secret),'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode('gggc-vault-v1'),info:encoder.encode('member-api-key-encryption')},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function sealKey(secret,userId,provider,key){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(JSON.stringify([userId,provider]))},await vaultKey(secret),encoder.encode(key));
 return 'v1.'+b64(iv)+'.'+b64(new Uint8Array(encrypted));
}
// Reserved for future server-side provider requests; not exposed through HTTP.
export async function openKey(secret,userId,provider,sealed){
 const [version,iv,data]=sealed.split('.');if(version!=='v1')throw new Error('Invalid vault version');
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:encoder.encode(JSON.stringify([userId,provider]))},await vaultKey(secret),bytes(data));
 return new TextDecoder().decode(plain);
}
export async function byok(request,env,auth){
 const session=await auth.api.getSession({headers:request.headers});
 if(!session)return json({error:'로그인 후 API 키를 관리할 수 있어요.'},401);
 const path=new URL(request.url).pathname;
 const provider=path.slice('/api/me/keys/'.length);
 const listing=path==='/api/me/keys';
 if(!listing&&!providers.has(provider))return json({error:'지원하지 않는 AI 제공자예요.'},404);
 if((listing&&request.method!=='GET')||(!listing&&!['PUT','DELETE'].includes(request.method)))return json({error:'지원하지 않는 요청이에요.'},405);
 const member=await env.DB.prepare('SELECT faction FROM member_profile WHERE userId = ?').bind(session.user.id).first();
 const allowedProvider=factionProvider[member?.faction];
 if(request.method!=='DELETE'&&!allowedProvider)return json({error:'먼저 닉네임과 진영을 확정해주세요.'},403);
 if(request.method==='PUT'&&provider!==allowedProvider)return json({error:'선택한 진영과 같은 AI 제공자의 API 키만 등록할 수 있어요.'},403);
 // Idempotent schema creation allows existing D1 installations to use settings immediately.
 await env.DB.prepare(VAULT_SCHEMA).run();
 if(listing){const {results}=await env.DB.prepare('SELECT provider,suffix,updatedAt FROM member_api_key WHERE userId = ? ORDER BY provider').bind(session.user.id).all();return json({keys:results,allowedProvider});}
 if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM member_api_key WHERE userId = ? AND provider = ?').bind(session.user.id,provider).run();return json({deleted:true});}
 const reader=request.body?.getReader();let length=0,chunks=[];
 if(!reader)return json({error:'API 키를 입력해주세요.'},400);
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>2048){await reader.cancel();return json({error:'입력한 내용이 너무 길어요.'},413);}chunks.push(value);}
 const raw=new Uint8Array(length);let offset=0;for(const part of chunks){raw.set(part,offset);offset+=part.length;}
 let body;try{body=JSON.parse(new TextDecoder().decode(raw));}catch{return json({error:'입력한 내용을 확인해주세요.'},400);}
 const key=typeof body.key==='string'?body.key.trim():'';
 if(!/^[\x21-\x7e]{20,512}$/.test(key))return json({error:'공백 없이 API 키 전체를 입력해주세요. (20~512자)'},400);
 const encrypted=await sealKey(env.BETTER_AUTH_SECRET,session.user.id,provider,key),updatedAt=Date.now(),suffix=key.slice(-4);
 await env.DB.prepare('INSERT INTO member_api_key(userId,provider,encrypted,suffix,updatedAt) VALUES (?,?,?,?,?) ON CONFLICT(userId,provider) DO UPDATE SET encrypted=excluded.encrypted,suffix=excluded.suffix,updatedAt=excluded.updatedAt').bind(session.user.id,provider,encrypted,suffix,updatedAt).run();
 return json({provider,suffix,updatedAt});
}
