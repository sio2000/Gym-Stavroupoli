import { PoolClient } from "pg";
import { auditedQuery } from "./db";

export async function tableExists(client: PoolClient, tableName: string): Promise<boolean> {
  const { rows } = await auditedQuery<{ exists: boolean }>(
    client,
    `select exists (
       select 1 from information_schema.tables
       where table_schema in ('public') and table_name = $1
     ) as exists`,
    [tableName]
  );
  return rows[0]?.exists === true;
}

export async function columnExists(client: PoolClient, tableName: string, columnName: string): Promise<boolean> {
  const { rows } = await auditedQuery<{ exists: boolean }>(
    client,
    `select exists (
       select 1 from information_schema.columns
       where table_schema in ('public') and table_name = $1 and column_name = $2
     ) as exists`,
    [tableName, columnName]
  );
  return rows[0]?.exists === true;
}


