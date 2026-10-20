const FACTIONS = new Set(['astra','serin','lumi','nox']);
const CATEGORIES = new Set(['자유','정보','질문','프롬프트','창작']);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' } });
const fields = `p.id, p.authorId, m.name AS author, p.faction, p.category, p.title, p.views, p.createdAt, p.updatedAt,
  (SELECT COUNT(*) FROM community_vote v WHERE v.postId=p.id) AS votes,
  (SELECT COUNT(*) FROM community_comment c WHERE c.postId=p.id AND c.deletedAt IS NULL) AS replies`;
const base = ' FROM community_post p JOIN member_profile m ON m.userId=p.authorId ';
export function validatePost(input) {
  if (typeof input?.title !== 'string' || typeof input?.body !== 'string' || !CATEGORIES.has(input.category)) return null;
  const title=input.title.trim(), body=input.body.trim();
  if (!title || [...title].length>100 || !body || [...body].length>10000 || /[\u0000-\u001f\u007f]/.test(title) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body)) return null;
  return { title, body, category:input.category };
}
async function readBody(request) {
  if (Number(request.headers.get('Content-Length'))>65536) throw new Error('BODY_TOO_LARGE');
  const reader=request.body?.getReader(); if(!reader) return null;
  const parts=[];let length=0;
  while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>65536){await reader.cancel();throw new Error('BODY_TOO_LARGE');}parts.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{return null;}
}
export async function community(request, env, auth) {
  const url=new URL(request.url), path=url.pathname, method=request.method;
  try {
    if(path==='/api/posts' && method==='GET') {
      const where=['p.deletedAt IS NULL'], args=[];
      const faction=url.searchParams.get('faction'),category=url.searchParams.get('category'),q=(url.searchParams.get('q')||'').trim().slice(0,100);
      if(faction && !FACTIONS.has(faction))return json({error:'진영을 확인해주세요.'},400);
      if(faction){where.push('p.faction=?');args.push(faction);}
      if(category){if(!CATEGORIES.has(category))return json({error:'카테고리를 확인해주세요.'},400);where.push('p.category=?');args.push(category);}
      if(q){const field=url.searchParams.get('field');const expression=field==='author'?'m.name':field==='title'?'p.title':"p.title || ' ' || p.body";where.push(`instr(lower(${expression}),lower(?))>0`);args.push(q);}
      if(url.searchParams.has('ids')){const ids=(url.searchParams.get('ids')||'').split(',').filter(x=>/^\d{1,12}$/.test(x)).slice(0,100).map(Number);where.push(ids.length?`p.id IN (${ids.map(()=>'?').join(',')})`:'0');args.push(...ids);}
      const clause=' WHERE '+where.join(' AND ');
      const {total}=await env.DB.prepare('SELECT COUNT(*) AS total'+base+clause).bind(...args).first();
      const limit=Math.max(1,Math.min(15,parseInt(url.searchParams.get('limit'),10)||15));
      const pages=Math.max(1,Math.ceil(total/limit)),page=Math.min(pages,Math.max(1,parseInt(url.searchParams.get('page'),10)||1));
      const sort=url.searchParams.get('sort')==='best'?'votes DESC,p.id DESC':'p.id DESC';
      const result=await env.DB.prepare('SELECT '+fields+base+clause+` ORDER BY ${sort} LIMIT ? OFFSET ?`).bind(...args,limit,(page-1)*limit).all();
      return json({posts:result.results,total,page,pages});
    }
    const match=path.match(/^\/api\/posts\/(\d{1,12})(?:\/(comments|vote))?$/);
    const id=match?Number(match[1]):null, action=match?.[2];
    if(path!=='/api/posts' && !match)return json({error:'찾을 수 없는 요청이에요.'},404);
    if(match && method==='GET' && !action){
      const post=await env.DB.prepare('SELECT '+fields+',p.body'+base+' WHERE p.id=? AND p.deletedAt IS NULL').bind(id).first();
      if(!post)return json({error:'삭제되었거나 존재하지 않는 글이에요.'},404);
      await env.DB.prepare('UPDATE community_post SET views=views+1 WHERE id=? AND deletedAt IS NULL').bind(id).run();post.views++;
      const session=await auth.api.getSession({headers:request.headers});
      const voted=session?Boolean(await env.DB.prepare('SELECT 1 FROM community_vote WHERE postId=? AND userId=?').bind(id,session.user.id).first()):false;
      const comments=await env.DB.prepare(`SELECT c.id,c.body,c.createdAt,c.authorId,m.name AS author,m.faction FROM community_comment c JOIN member_profile m ON m.userId=c.authorId WHERE c.postId=? AND c.deletedAt IS NULL ORDER BY c.id DESC LIMIT 100`).bind(id).all();
      return json({post,comments:comments.results.reverse(),voted,canEdit:session?.user.id===post.authorId});
    }
    if(!['POST','PATCH','DELETE'].includes(method))return json({error:'지원하지 않는 요청이에요.'},405);
    const session=await auth.api.getSession({headers:request.headers});
    if(!session)return json({error:'로그인 후 이용해주세요.',code:'LOGIN_REQUIRED'},401);
    const member=await env.DB.prepare('SELECT name,faction FROM member_profile WHERE userId=?').bind(session.user.id).first();
    if(!member)return json({error:'먼저 닉네임과 진영을 확정해주세요.',code:'PROFILE_REQUIRED'},403);
    const uid=session.user.id,now=Date.now();
    const data=method==='DELETE'?null:await readBody(request);
    if(path==='/api/posts' && method==='POST'){
      const input=validatePost(data);if(!input)return json({error:'제목(100자), 내용(10,000자), 카테고리를 확인해주세요.'},400);
      // Conditional insert keeps the posting cooldown atomic across concurrent requests.
      const result=await env.DB.prepare(`INSERT INTO community_post(authorId,faction,category,title,body,createdAt,updatedAt)
        SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM community_post WHERE authorId=? AND createdAt>?) RETURNING id`).bind(uid,member.faction,input.category,input.title,input.body,now,now,uid,now-15000).first();
      if(!result)return json({error:'잠깐만요. 새 글은 15초 간격으로 작성할 수 있어요.'},429);
      return json({id:result.id},201);
    }
    if(!match)return json({error:'지원하지 않는 요청이에요.'},405);
    const post=await env.DB.prepare('SELECT authorId FROM community_post WHERE id=? AND deletedAt IS NULL').bind(id).first();
    if(!post)return json({error:'삭제되었거나 존재하지 않는 글이에요.'},404);
    if(!action && ['PATCH','DELETE'].includes(method)){
      if(post.authorId!==uid)return json({error:'본인이 작성한 글만 수정하거나 삭제할 수 있어요.'},403);
      if(method==='DELETE'){await env.DB.prepare('UPDATE community_post SET deletedAt=? WHERE id=? AND authorId=? AND deletedAt IS NULL').bind(now,id,uid).run();return json({success:true});}
      const input=validatePost(data);if(!input)return json({error:'제목, 내용, 카테고리를 확인해주세요.'},400);
      await env.DB.prepare('UPDATE community_post SET title=?,body=?,category=?,updatedAt=? WHERE id=? AND authorId=? AND deletedAt IS NULL').bind(input.title,input.body,input.category,now,id,uid).run();return json({id});
    }
    if(action==='comments' && method==='POST'){
      const body=typeof data?.body==='string'?data.body.trim():'';
      if(!body || [...body].length>2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body))return json({error:'댓글은 1~2,000자로 작성해주세요.'},400);
      const result=await env.DB.prepare(`INSERT INTO community_comment(postId,authorId,body,createdAt)
        SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM community_post WHERE id=? AND deletedAt IS NULL)
        AND NOT EXISTS(SELECT 1 FROM community_comment WHERE authorId=? AND createdAt>?) RETURNING id`).bind(id,uid,body,now,id,uid,now-5000).first();
      if(!result)return json({error:'잠깐만요. 댓글은 5초 간격으로 작성할 수 있어요.'},429);
      return json({id:result.id},201);
    }
    if(action==='vote' && ['POST','DELETE'].includes(method)){
      if(method==='POST')await env.DB.prepare('INSERT OR IGNORE INTO community_vote(postId,userId) SELECT ?,? WHERE EXISTS(SELECT 1 FROM community_post WHERE id=? AND deletedAt IS NULL)').bind(id,uid,id).run();
      else await env.DB.prepare('DELETE FROM community_vote WHERE postId=? AND userId=?').bind(id,uid).run();
      const {votes}=await env.DB.prepare('SELECT COUNT(*) AS votes FROM community_vote WHERE postId=?').bind(id).first();return json({votes,voted:method==='POST'});
    }
    return json({error:'지원하지 않는 요청이에요.'},405);
  }catch(error){
    if(error.message==='BODY_TOO_LARGE')return json({error:'입력한 내용이 너무 길어요.'},413);
    return json({error:'게시판에 연결하지 못했어요. 잠시 후 다시 시도해주세요.'},503);
  }
}
