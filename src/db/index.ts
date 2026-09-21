import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';
import { getAppConfig } from '../lib/config/env';
import { logger } from '../lib/logger';

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getPool(connectionStringOverride?: string): Pool {
  if (pool && !connectionStringOverride) {
    return pool;
  }

  const config = getAppConfig();
  const connectionString = connectionStringOverride || config.databaseUrl;

  if (!connectionString) {
    throw new Error('[Finspire DB] No database connection string provided.');
  }

  const poolConfig: PoolConfig = {
    connectionString,
    max: config.databaseMaxConnections,
    connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
    idleTimeoutMillis: 30000,
  };

  const newPool = new Pool(poolConfig);

  newPool.on('error', (err) => {
    logger.error('[Finspire DB] Unexpected error on idle database client', err);
  });

  if (!connectionStringOverride) {
    pool = newPool;
  }

  return newPool;
}

export function getDb(connectionStringOverride?: string) {
  if (dbInstance && !connectionStringOverride) {
    return dbInstance;
  }

  const p = getPool(connectionStringOverride);
  const db = drizzle(p, { schema });

  if (!connectionStringOverride) {
    dbInstance = db;
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
    logger.info('[Finspire DB] Connection pool closed successfully.');
  }
}

export async function withTransaction<T>(
  callback: (tx: Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0]) => Promise<T>,
  connectionStringOverride?: string
): Promise<T> {
  const db = getDb(connectionStringOverride);
  return db.transaction(async (tx) => {
    return callback(tx);
  });
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    const instance = getDb();
    const val = Reflect.get(instance, prop);
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(instance) : val;
  },
});

export { schema };

