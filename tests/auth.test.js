import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createWorker, validateProfile } from '../src/worker.js';
import { createAuth } from '../src/auth.js';
import { makeSignature } from 'better-auth/crypto';

function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_auth.sql', import.meta.url), 'utf8'));
  sql.exec(readFileSync(new URL('../migrations/0002_member_profile.sql', import.meta.url), 'utf8'));
  // Exercise Better Auth's real D1 dialect against SQLite, including introspection.
  const DB = { exec: q => sql.exec(q), batch: async list => Promise.all(list.map(s => s.all())), prepare(query) {
    let params = [];
    const statement = { bind(...values) { params = values; return statement; }, async all() {
      const stmt = sql.prepare(query);
      const results = stmt.all(...params);
      return { results, success: true, meta: { changes: sql.prepare('SELECT changes() AS n').get().n } };
    }, async run() { return statement.all(); }, async first() { return (await statement.all()).results[0] || null; } };
    return statement;
  } };
  const env = { DB, BETTER_AUTH_URL: 'https://gggc.example', BETTER_AUTH_SECRET: 'test-secret-long-and-random-12345678901234', GOOGLE_CLIENT_ID: 'test-client', GOOGLE_CLIENT_SECRET: 'test-secret', ASSETS: { fetch: () => new Response('asset') } };
  const worker = createWorker();
  const request = (path, method = 'GET', body, cookie, origin = env.BETTER_AUTH_URL) => worker.fetch(new Request(env.BETTER_AUTH_URL + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }), env);
  return { sql, env, request };
}
async function signedSession(env, id) {
  const auth = createAuth(env), ctx = await auth.$context;
  await ctx.internalAdapter.createUser({ id, name: 'Private Google Name', email: `${id}@example.com`, emailVerified: true });
  const session = await ctx.internalAdapter.createSession(id);
  const signed = session.token + '.' + await makeSignature(session.token, env.BETTER_AUTH_SECRET);
  return `${ctx.authCookies.sessionToken.name}=${encodeURIComponent(signed)}`;
}
test('unconfigured auth stays disabled; static site remains available', async () => {
  const worker = createWorker();
  const env = { ASSETS: { fetch: () => new Response('asset') } };
  assert.equal((await worker.fetch(new Request('https://x/api/config'), env)).status, 200);
  assert.equal((await worker.fetch(new Request('https://x/api/me'), env)).status, 503);
  assert.equal(await (await worker.fetch(new Request('https://x/'), env)).text(), 'asset');
});
test('profile input rejects invalid factions, controls, and invalid lengths', () => {
  for (const name of ['', 'a', 'x'.repeat(21), '<img>', 'aa\u0000']) assert.equal(validateProfile({ name, faction: 'astra' }), null);
  assert.equal(validateProfile({ name: '여행자', faction: 'admin' }), null);
});
test('real signed sessions isolate accounts; faction is immutable even in SQL', async () => {
  const { env, sql, request } = fixture();
  const a = await signedSession(env, 'one'), b = await signedSession(env, 'two');
  assert.equal((await request('/api/me', 'PATCH', { name: '아스트라친구', faction: 'astra' })).status, 401);
  assert.equal((await request('/api/me', 'PATCH', { name: '아스트라친구', faction: 'astra' }, a, 'https://evil.example')).status, 403);
  assert.equal((await request('/api/me', 'PATCH', { name: '아스트라친구', faction: 'astra' }, a)).status, 200);
  assert.equal((await request('/api/me', 'PATCH', { name: '수정닉네임', faction: 'astra' }, a)).status, 200);
  assert.equal((await request('/api/me', 'PATCH', { name: '변경시도', faction: 'nox' }, a)).status, 409);
  assert.equal((await (await request('/api/me', 'GET', null, a)).json()).user.profile.name, '수정닉네임');
  assert.equal((await (await request('/api/me', 'GET', null, b)).json()).user.profile, null);
  assert.throws(() => sql.exec("UPDATE member_profile SET faction='nox' WHERE userId='one'"));
  assert.equal((await request('/api/auth/update-user', 'POST', { faction: 'nox' }, a)).status, 404);
  assert.equal((await request('/api/auth/sign-out', 'POST', {}, a)).status, 200);
  assert.equal((await (await request('/api/me', 'GET', null, a)).json()).user, null);
  sql.exec("UPDATE session SET expiresAt=0 WHERE userId='two'");
  assert.equal((await (await request('/api/me', 'GET', null, b)).json()).user, null);
});
test('Google OAuth creates secure state; blocks external callbacks and forged state', async () => {
  const { request } = fixture();
  const response = await request('/api/auth/sign-in/social', 'POST', { provider: 'google', callbackURL: 'https://gggc.example/?login=success' });
  assert.equal(response.status, 200);
  const data = await response.json(), url = new URL(data.url);
  assert.equal(url.hostname, 'accounts.google.com');
  assert.ok(url.searchParams.get('state'));
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('set-cookie'), /Secure/i);
  assert.equal((await request('/api/auth/sign-in/social', 'POST', { provider: 'google', callbackURL: 'https://evil.example' })).status, 403);
  const invalid = await request('/api/auth/callback/google?code=forged&state=forged');
  assert.equal(invalid.status, 302);
  assert.ok(!invalid.headers.get('set-cookie')?.includes('session_token='));
});
