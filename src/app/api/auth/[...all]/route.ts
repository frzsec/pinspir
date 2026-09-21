/**
 * /api/auth/[...all]/route.ts
 *
 * D-11 fix: Replace stub echo handler with real Better Auth route handler.
 * All Better Auth internal endpoints (sign-in, sign-out, session, etc.)
 * are handled by toNextJsHandler(auth).
 *
 * Note: Finspire's pseudonymous auth flows (register, login) are at
 * /api/v1/auth/pseudonymous/* and use auth.api.* internally.
 * This catch-all route covers Better Auth's own protocol endpoints.
 */
import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth/auth';

export const { GET, POST } = toNextJsHandler(getAuth());
