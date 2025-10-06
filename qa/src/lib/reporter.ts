import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { logger } from "./logger";

export type TestContext = {
  label: string;
  audit: { reads: Array<Record<string, unknown>>; writes: Array<Record<string, unknown>> };
};

export type TestResult = {
  id: string;
  name: string;
  domain: string;
  passed: boolean;
  error?: string;
  warnings?: string[];
  durationMs: number;
  audit: TestContext["audit"];
};

export class Reporter {
  private results: TestResult[] = [];
  private outDir: string;

  constructor(outDir = join(process.cwd(), "qa", "out")) {
    this.outDir = outDir;
    mkdirSync(this.outDir, { recursive: true });
  }

  record(result: TestResult) {
    this.results.push(result);
    const status = result.passed ? "PASS" : "FAIL";
    const prefix = `${status} [${result.domain}]`;
    const msg = `${prefix} ${result.name} (${result.durationMs}ms)`;
    if (result.passed) logger.info({ id: result.id }, msg);
    else logger.error({ id: result.id, error: result.error }, msg);
  }

  summary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    logger.info({ total, passed, failed }, "QA Summary");
    const jsonPath = join(this.outDir, "report.json");
    writeFileSync(jsonPath, JSON.stringify({ total, passed, failed, results: this.results }, null, 2));
    return { total, passed, failed, jsonPath };
  }
}


