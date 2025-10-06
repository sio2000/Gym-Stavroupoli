import { Reporter, TestResult } from "../../lib/reporter";
import { v4 as uuidv4 } from "uuid";

async function run(name: string, fn: () => Promise<void>, reporter: Reporter) {
  const id = uuidv4();
  const startedAt = Date.now();
  const audit = { reads: [] as Array<Record<string, unknown>>, writes: [] as Array<Record<string, unknown>> };
  try {
    await fn();
    const result: TestResult = { id, name, domain: "qr", passed: true, durationMs: Date.now() - startedAt, audit };
    reporter.record(result);
  } catch (err: any) {
    const result: TestResult = {
      id,
      name,
      domain: "qr",
      passed: false,
      durationMs: Date.now() - startedAt,
      error: String(err?.message ?? err),
      audit,
    };
    reporter.record(result);
  }
}

export async function runQrScenarios(reporter: Reporter) {
  await run("QR δημιουργία/λήξη (placeholder)", async () => {
    // Συμπλήρωση με queries σε qr codes
  }, reporter);
}


