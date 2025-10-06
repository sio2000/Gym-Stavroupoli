import { getSupabaseService, auditCall } from "./supa";

export async function execSql<T = any>(sql: string): Promise<T[]> {
  const supa = getSupabaseService();
  const { data, error } = await auditCall("rpc.exec_sql", async () =>
    supa.rpc("exec_sql", { sql })
  );
  if (error) throw error;
  // exec_sql typically returns { rows: any[] } or array depending on implementation
  if (Array.isArray((data as any)?.rows)) return (data as any).rows as T[];
  if (Array.isArray(data)) return data as T[];
  return [];
}

export async function fetchTableRows<T = any>(table: string, limit: number): Promise<T[]> {
  const supa = getSupabaseService();
  const { data, error } = await auditCall(`from.${table}.select`, async () =>
    supa.from(table).select("*").limit(limit)
  );
  if (error) throw error;
  return (data as T[]) ?? [];
}


