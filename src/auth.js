import { betterAuth } from 'better-auth';

export function configured(env) {
  try { return Boolean(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.BETTER_AUTH_SECRET?.length >= 32 && new URL(env.BETTER_AUTH_URL).protocol === 'https:'); } catch { return false; }
}

export function createAuth(env) {
  return betterAuth({
    appName: 'GGGC WORLD',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
    emailAndPassword: { enabled: false },
    socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account', accessType: 'online' } },
    account: { accountLinking: { enabled: false }, storeAccountCookie: false },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    advanced: { useSecureCookies: true, ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60 }
  });
}
