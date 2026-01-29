#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  console.log('\n🔎 Searching for memberships where status=\'expired\' but end_date >= CURRENT_DATE');
  const sql = `
    SELECT id, user_id, package_id, duration_type, start_date, end_date, status, is_active, expires_at, created_at, updated_at, approved_at, cancelled_at, auto_renew, source_package_name
    FROM public.memberships
    WHERE status = 'expired' AND end_date >= CURRENT_DATE
    ORDER BY end_date DESC
    LIMIT 200
  `;

  try {
    const { data, error } = await supabase.rpc('sql', { q: sql }).catch(() => ({ data: null, error: 'rpc-sql-not-available' }));
    // Some Supabase setups don't expose rpc('sql'); fallback to from().select().filter() style
    if (error && error !== 'rpc-sql-not-available') {
      console.log('RPC error:', error);
    }

    let rows = null;
    if (data && Array.isArray(data)) {
      rows = data;
    } else {
      // Fallback using normal select with filters
      const { data: rows2, error: e2 } = await supabase
        .from('memberships')
        .select('id,user_id,package_id,duration_type,start_date,end_date,status,is_active,expires_at,created_at,updated_at,approved_at,cancelled_at,auto_renew,source_package_name')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .eq('status', 'expired')
        .order('end_date', { ascending: false })
        .limit(200);
      if (e2) {
        console.log('Query error:', e2.message || e2);
      } else {
        rows = rows2;
      }
    }

    if (!rows) {
      console.log('No rows retrieved or query failed.');
      process.exit(2);
    }

    console.log(`\nFound ${rows.length} memberships with status=expired and end_date >= today\n`);
    rows.forEach((r, idx) => {
      console.log(`${idx + 1}. id=${r.id} user=${r.user_id} package=${r.package_id} duration_type=${r.duration_type} start=${r.start_date} end=${r.end_date} status=${r.status} is_active=${r.is_active} expires_at=${r.expires_at} approved_at=${r.approved_at} cancelled_at=${r.cancelled_at}`);
    });

    // Also show aggregate counts for status vs end_date
    const { data: agg, error: aggErr } = await supabase
      .from('memberships')
      .select('status, count:count(*)', { count: 'exact' })
      .limit(1);
    // Above may not work; instead run simple counts

    const { data: countsByStatus, error: cErr } = await supabase.rpc('count_memberships_by_status').catch(() => ({ data: null }));
    if (cErr) {
      // fallback SQL via select
      const { data: simple, error: se } = await supabase
        .from('memberships')
        .select('status', { count: 'exact' })
        .limit(0);
    }

    process.exit(0);
  } catch (ex) {
    console.error('Fatal error:', ex.message || ex);
    process.exit(3);
  }
})();
