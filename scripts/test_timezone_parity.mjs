// No external deps; this test validates local date math and formatting only

function toLocalDateKey(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function combineLocal(dateKey, timeHHMM) {
	const [y, m, d] = dateKey.split('-').map(Number);
	const [hh, mm] = timeHHMM.split(':').map(Number);
	return new Date(y, m - 1, d, hh, mm || 0, 0, 0);
}

function assertEqual(a, b, name) {
	if (a !== b) throw new Error(`Assertion failed: ${name} => ${a} !== ${b}`);
}

async function runScenario(dateKey, timeHHMM) {
	const local = combineLocal(dateKey, timeHHMM);
	const derivedKey = toLocalDateKey(local);
	assertEqual(derivedKey, dateKey, `local derived day for ${dateKey} ${timeHHMM}`);
	return { ok: true };
}

async function main() {
	const scenarios = [
		['2025-01-01', '00:00'],
		['2025-01-01', '23:30'],
		['2025-03-30', '00:00'], // DST edge EU
		['2025-10-26', '23:30'], // DST edge EU
		['2025-09-13', '08:00'],
		['2025-02-28', '23:59'],
		['2024-02-29', '12:00'],
		['2025-12-31', '23:59'],
		['2026-01-01', '00:00'],
	];

	let pass = 0; let fail = 0;
	for (const [d, t] of scenarios) {
		try {
			await runScenario(d, t);
			console.log(`PASS: ${d} ${t}`);
			pass++;
		} catch (e) {
			console.log(`FAIL: ${d} ${t} -> ${e.message}`);
			fail++;
		}
	}

	console.log(`\nResults: ${pass} passed, ${fail} failed`);
	if (fail > 0) process.exit(1);
}

main();


