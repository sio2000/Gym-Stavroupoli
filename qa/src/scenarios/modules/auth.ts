import { Reporter, TestResult } from "../../lib/reporter";
import { getSupabaseAnon } from "../../lib/supa";
import { v4 as uuidv4 } from "uuid";

async function run(name: string, domain: string, fn: () => Promise<void>, reporter: Reporter) {
  const id = uuidv4();
  const startedAt = Date.now();
  const audit = { reads: [] as Array<Record<string, unknown>>, writes: [] as Array<Record<string, unknown>> };
  try {
    await fn();
    const result: TestResult = { id, name, domain, passed: true, durationMs: Date.now() - startedAt, audit };
    reporter.record(result);
  } catch (err: any) {
    const result: TestResult = {
      id,
      name,
      domain,
      passed: false,
      durationMs: Date.now() - startedAt,
      error: String(err?.message ?? err),
      audit,
    };
    reporter.record(result);
  }
}

export async function runAuthScenarios(reporter: Reporter) {
  const supa = getSupabaseAnon();

  await run("Ανώνυμη φόρτωση landing χωρίς session", "auth", async () => {
    // No-op: sanity
    if (!supa) throw new Error("supabase client not created");
  }, reporter);

  await run("Login με λάθος κωδικό αποτυγχάνει", "auth", async () => {
    const { data, error } = await supa.auth.signInWithPassword({ email: "nouser@example.com", password: "wrong" });
    if (error == null) throw new Error("Περίμενα σφάλμα στα λάθος creds");
    if (data?.session) throw new Error("Δεν θα έπρεπε να υπάρχει session");
  }, reporter);
}


