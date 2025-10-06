import { Pool, PoolClient, QueryResult } from "pg";
import { logger } from "./logger";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
  }
  return pool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withReadOnlyTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withClient(async (client) => {
    await client.query("BEGIN");
    await client.query("SET TRANSACTION READ ONLY");
    try {
      const result = await fn(client);
      return result;
    } finally {
      await client.query("ROLLBACK");
    }
  });
}

export async function withRollbackTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      return result;
    } finally {
      await client.query("ROLLBACK");
    }
  });
}

export async function auditedQuery<T = any>(
  client: PoolClient,
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const startedAt = Date.now();
  try {
    const res = await client.query<T>(sql, params);
    logger.debug({ sql, params, rows: res.rowCount, ms: Date.now() - startedAt }, "SQL OK");
    return res;
  } catch (err) {
    logger.error({ sql, params, ms: Date.now() - startedAt, err }, "SQL ERROR");
    throw err;
  }
}


