const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking tables for user f725d678-2d60-49ce-be9d-14043d5f64d7');

  // Check user_transactions
  try {
    const { data: data1, error: error1 } = await supabase
      .from('user_transactions')
      .select('id, user_id, amount, transaction_type')
      .eq('user_id', 'f725d678-2d60-49ce-be9d-14043d5f64d7')
      .limit(5);
    if (!error1 && data1.length > 0) console.log('user_transactions:', data1);
    else console.log('user_transactions: no data or error');
  } catch (e) { console.log('user_transactions does not exist'); }

  // Check transactions
  try {
    const { data: data2, error: error2 } = await supabase
      .from('transactions')
      .select('id, user_id, amount, payment_method')
      .eq('user_id', 'f725d678-2d60-49ce-be9d-14043d5f64d7')
      .limit(5);
    if (!error2 && data2.length > 0) console.log('transactions:', data2);
    else console.log('transactions: no data or error');
  } catch (e) { console.log('transactions does not exist'); }

  // Check payment_records
  try {
    const { data: data3, error: error3 } = await supabase
      .from('payment_records')
      .select('id, user_id, amount, payment_type')
      .eq('user_id', 'f725d678-2d60-49ce-be9d-14043d5f64d7')
      .limit(5);
    if (!error3 && data3.length > 0) console.log('payment_records:', data3);
    else console.log('payment_records: no data or error');
  } catch (e) { console.log('payment_records does not exist'); }

  // Check user_cash_transactions again
  try {
    const { data: data4, error: error4 } = await supabase
      .from('user_cash_transactions')
      .select('id, user_id, amount, transaction_type')
      .eq('user_id', 'f725d678-2d60-49ce-be9d-14043d5f64d7')
      .limit(5);
    if (!error4 && data4.length > 0) console.log('user_cash_transactions:', data4);
    else console.log('user_cash_transactions: no data or error');
  } catch (e) { console.log('user_cash_transactions does not exist'); }
}

checkTables();