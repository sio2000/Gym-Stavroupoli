import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const outDir = join(process.cwd(), "qa", "out");
const jsonPath = join(outDir, "report.json");
const htmlPath = join(outDir, "report.html");

mkdirSync(outDir, { recursive: true });

const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

const rows = (data.results as any[]).map((r) => {
  const status = r.passed ? "PASS" : "FAIL";
  const color = r.passed ? "#0a7" : "#d33";
  return `<tr>
    <td>${r.id}</td>
    <td>${r.domain}</td>
    <td>${r.name}</td>
    <td style="color:${color};font-weight:600">${status}</td>
    <td>${r.durationMs}</td>
    <td><pre>${JSON.stringify(r.audit, null, 2)}</pre></td>
  </tr>`;
}).join("\n");

const html = `<!doctype html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QA Report</title>
  <style>
    body{font-family:ui-sans-serif,system-ui; margin:24px;}
    .summary{display:flex; gap:16px; margin-bottom:16px}
    .pill{padding:6px 10px; border-radius:999px; background:#f1f5f9}
    table{border-collapse:collapse; width:100%}
    th,td{border:1px solid #e5e7eb; padding:8px; text-align:left; vertical-align:top}
    th{background:#f8fafc}
    pre{white-space:pre-wrap; word-break:break-word; margin:0}
  </style>
  </head>
  <body>
  <h1>QA Αναφορά</h1>
  <div class="summary">
    <div class="pill">Σύνολο: <b>${data.total}</b></div>
    <div class="pill" style="background:#ecfdf5">Πέρασαν: <b>${data.passed}</b></div>
    <div class="pill" style="background:#fef2f2">Απέτυχαν: <b>${data.failed}</b></div>
  </div>
  <table>
    <thead>
      <tr><th>ID</th><th>Τομέας</th><th>Όνομα</th><th>Κατάσταση</th><th>ms</th><th>Audit</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  </body>
  </html>`;

writeFileSync(htmlPath, html);
// eslint-disable-next-line no-console
console.log(`HTML report created at ${htmlPath}`);


