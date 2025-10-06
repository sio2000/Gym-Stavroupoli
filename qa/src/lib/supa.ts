import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabaseAnon(): SupabaseClient {
  if (!anonClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error("Λείπουν SUPABASE_URL/ANON_KEY για ανώνυμο client");
    }
    anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { "x-client-info": "qa-runner-anon" } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return anonClient;
}

export function getSupabaseService(): SupabaseClient {
  if (!serviceClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Λείπουν SUPABASE_URL/SERVICE_ROLE_KEY για service client");
    }
    serviceClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        global: { headers: { "x-client-info": "qa-runner-service" } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
  }
  return serviceClient;
}

export async function auditCall<T>(name: string, call: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const res = await call();
    logger.debug({ name, ms: Date.now() - startedAt }, "Supabase call OK");
    return res;
  } catch (err) {
    logger.error({ name, ms: Date.now() - startedAt, err }, "Supabase call ERROR");
    throw err;
  }
}


