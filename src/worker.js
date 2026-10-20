import { configured, createAuth } from './auth.js';
import { community } from './community.js';
import { byok } from './byok.js';

const NICKNAME_GUARDS = ["CREATE INDEX IF NOT EXISTS member_profile_name_lookup ON member_profile(name COLLATE NOCASE)","CREATE TRIGGER IF NOT EXISTS member_profile_unique_name_insert BEFORE INSERT ON member_profile WHEN EXISTS (SELECT 1 FROM member_profile WHERE name = NEW.name COLLATE NOCASE AND userId <> NEW.userId) BEGIN SELECT RAISE(ABORT, 'nickname_taken'); END","CREATE TRIGGER IF NOT EXISTS member_profile_unique_name_update BEFORE UPDATE OF name ON member_profile WHEN EXISTS (SELECT 1 FROM member_profile WHERE name = NEW.name COLLATE NOCASE AND userId <> NEW.userId) BEGIN SELECT RAISE(ABORT, 'nickname_taken'); END"];
const FACTIONS = new Set(['astra', 'serin', 'lumi', 'nox']);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export function validateProfile(body) {
  const name = typeof body?.name === 'string' ? body.name.trim().normalize('NFC') : '';
  if ([...name].length < 2 || [...name].length > 20 || /[\p{C}<>]/u.test(name)) return null;
  if (!FACTIONS.has(body.faction)) return null;
  return { name, faction: body.faction };
}

export function createWorker(authFactory = createAuth) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
      if (url.pathname === '/api/config' && request.method === 'GET') return json({ loginEnabled: configured(env) });
      if (!configured(env)) return json({ error: '로그인 연결을 준비하고 있어요.' }, 503);
      if (url.origin !== new URL(env.BETTER_AUTH_URL).origin) return json({ error: '등록된 사이트에서 로그인해주세요.' }, 403);
      if (!['GET', 'HEAD'].includes(request.method) && (request.headers.get('Origin') !== url.origin || !request.headers.get('Content-Type')?.startsWith('application/json'))) return json({ error: '잘못된 요청이에요.' }, 403);
      try {
        const auth = authFactory(env);
        if (url.pathname === '/api/me/keys' || url.pathname.startsWith('/api/me/keys/')) return await byok(request, env, auth);
        if (url.pathname === '/api/posts' || url.pathname.startsWith('/api/posts/')) return community(request, env, auth);
        // Expose only the login flow; member profile writes belong to /api/me.
        if (url.pathname.startsWith('/api/auth/')) {
          if (url.pathname === '/api/auth/error' && request.method === 'GET') return new Response(null, { status: 302, headers: { Location: url.origin + '/?login=error', 'Cache-Control': 'no-store' } });
          const allowed = new Map([['/api/auth/sign-in/social', 'POST'], ['/api/auth/callback/google', 'GET'], ['/api/auth/sign-out', 'POST']]);
          if (allowed.get(url.pathname) !== request.method) return json({ error: '찾을 수 없는 요청이에요.' }, 404);
          const response = await auth.handler(request);
          const secured = new Response(response.body, response);
          secured.headers.set('Cache-Control', 'no-store');
          return secured;
        }
        if (url.pathname !== '/api/me') return json({ error: '찾을 수 없는 요청이에요.' }, 404);
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return json({ user: null }, request.method === 'GET' ? 200 : 401);
        if (request.method === 'GET') {
          const profile = await env.DB.prepare('SELECT name, faction FROM member_profile WHERE userId = ?').bind(session.user.id).first();
          return json({ user: { id: session.user.id, profile, needsOnboarding: !profile } });
        }
        if (request.method !== 'PATCH') return json({ error: '지원하지 않는 요청이에요.' }, 405);
        const text = await request.text();
        if (text.length > 2048) return json({ error: '입력한 내용이 너무 길어요.' }, 413);
        let body; try { body = JSON.parse(text); } catch { return json({ error: '입력한 내용을 확인해주세요.' }, 400); }
        const profile = validateProfile(body);
        if (!profile) return json({ error: '닉네임은 2~20자, 진영은 네 진영 중 하나를 골라주세요.' }, 400);
        for (const statement of NICKNAME_GUARDS) await env.DB.prepare(statement).run();
        // Atomic conflict guard: even concurrent requests cannot switch an established faction.
        const result = await env.DB.prepare(`INSERT INTO member_profile (userId, name, faction) VALUES (?, ?, ?)
          ON CONFLICT(userId) DO UPDATE SET name = excluded.name WHERE member_profile.faction = excluded.faction`)
          .bind(session.user.id, profile.name, profile.faction).run();
        if (!result.meta.changes) return json({ error: '가입할 때 확정한 진영은 변경할 수 없어요.' }, 409);
        return json({ user: { id: session.user.id, profile, needsOnboarding: false } });
      } catch (error) {
        if (String(error?.message || '').includes('nickname_taken')) return json({ error: '이미 사용 중인 닉네임이에요. 다른 이름을 입력해주세요.' }, 409);
        return json({ error: '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.' }, 503);
      }
    }
  };
}
export default createWorker();
