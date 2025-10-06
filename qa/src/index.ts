import "dotenv/config";
import { assertStagingEnv } from "./lib/safety";
import { Reporter } from "./lib/reporter";
import { runAllScenarios } from "./scenarios";

async function main() {
  assertStagingEnv();

  const reporter = new Reporter();
  const startedAt = Date.now();
  await runAllScenarios(reporter);
  const { total, passed, failed, jsonPath } = reporter.summary();
  const ms = Date.now() - startedAt;
  // eslint-disable-next-line no-console
  console.log(`Σύνολο δοκιμών: ${total}, Πέρασαν: ${passed}, Απέτυχαν: ${failed} (${ms}ms)`);
  // eslint-disable-next-line no-console
  console.log(`Αναλυτική αναφορά: ${jsonPath}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("QA Runner error", err);
  process.exitCode = 1;
});


