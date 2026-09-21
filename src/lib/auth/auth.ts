/**
 * src/lib/auth/auth.ts
 *
 * Canonical Better Auth instance (ADR-002 Opsi 1).
 *
 * Strategy:
 *  - Students authenticate with PlayerCode + Passphrase.
 *  - The 'email' field (mandatory in Better Auth credential provider) is
 *    populated with the technical alias: playerCode.toLowerCase()@finspire.invalid
 *  - Domain '.invalid' (IETF RFC 2606) guarantees no actual email is ever sent.
 *  - Teachers may use a real work email (guru@sekolah.sch.id).
 *
 * This file is the SINGLE source of truth for Better Auth configuration.
 * Route handlers at /api/auth/[...all] use toNextJsHandler(auth).
 * All other auth flows (register, login, session) delegate to auth.api.*
 */

import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db';
import { getAppConfig } from '@/lib/config/env';
import * as schema from '@/db/schema';

import { username } from 'better-auth/plugins';

function createAuth() {
  const config = getAppConfig();

  return betterAuth({
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,

    plugins: [
      username({
        immutableUsername: true,
        displayUsername: false,
        minUsernameLength: 3,
        maxUsernameLength: 32,
        usernameValidator: (uname) => {
          // Hanya izinkan alphanumeric, dash, dan underscore
          return /^[a-zA-Z0-9-_]+$/.test(uname);
        },
        usernameNormalization: (uname) => uname.trim().toUpperCase(),
      }),
    ],

    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
      },
      usePlural: true,
    }),

    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: false,
    },

    session: {
      expiresIn: 30 * 24 * 60 * 60,
      cookieCache: {
        enabled: false,
      },
    },

    advanced: {
      cookiePrefix: 'finspire',
      generateId: () => crypto.randomUUID(),
      crossSubDomainCookies: {
        enabled: false,
      },
    },
  });
}

// Singleton — created lazily so tests can set env vars before first call.
let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

/** Reset Better Auth singleton — for test isolation only. */
export function _resetAuthInstance(): void {
  _auth = null;
}
