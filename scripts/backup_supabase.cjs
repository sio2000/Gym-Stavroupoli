/**
 * Backup script για Supabase (staging/production) χωρίς να τροποποιεί δεδομένα.
 * Τραβάει όλα τα rows από κρίσιμους πίνακες και τα αποθηκεύει σε JSON αρχεία
 * στον φάκελο `exports/backups/<timestamp>/`.
 *
 * Χρήση (PowerShell / bash):
 *   SUPABASE_URL="https://xxx.supabase.co" ^
 *   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" ^
 *   node scripts/backup_supabase.cjs
 *
 * Για να περιορίσετε σε συγκεκριμένο schema:
 *   SUPABASE_SCHEMA=public node scripts/backup_supabase.cjs
 *
 * ΣΗΜΕΙΩΣΗ: Το script είναι read-only. Δεν κάνει writes και δεν αλλάζει RLS.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA || 'public';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[backup] Λείπουν SUPABASE_URL ή SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: SCHEMA },
  auth: { autoRefreshToken: false, persistSession: false }
});

const TABLES = [
  'user_profiles',
  'memberships',
  'membership_packages',
  'membership_package_durations',
  'membership_requests',
  'user_installment_plans',
  'installment_payments',
  'qr_codes',
  'user_referral_points',
  'pilates_slots',
  'pilates_bookings',
  'ultimate_weekly_deposits'
];

const BATCH_SIZE = 1000;

async function fetchAllRows(table) {
  let offset = 0;
  const rows = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      throw new Error(`[backup] Σφάλμα ανάγνωσης ${table}: ${error.message}`);
    }

    rows.push(...(data || []));

    if (!data || data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return rows;
}

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'exports', 'backups', ts);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`[backup] Ξεκινά backup -> ${outDir}`);
  console.log(`[backup] Schema: ${SCHEMA}`);

  for (const table of TABLES) {
    try {
      console.log(`[backup] ${table} ...`);
      const rows = await fetchAllRows(table);
      const outFile = path.join(outDir, `${table}.json`);
      fs.writeFileSync(outFile, JSON.stringify(rows, null, 2), 'utf8');
      console.log(`[backup] ${table}: ${rows.length} rows -> ${outFile}`);
    } catch (err) {
      console.error(err.message);
    }
  }

  console.log('[backup] Ολοκληρώθηκε');
}

main().catch((err) => {
  console.error('[backup] Άγνωστο σφάλμα:', err);
  process.exit(1);
});

