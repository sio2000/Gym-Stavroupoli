import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env file manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const serviceKey = envVars['VITE_SUPABASE_SERVICE_KEY'];

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_SERVICE_KEY:', serviceKey ? '✅' : '❌');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('   URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceKey);

// Simple test
(async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .limit(1);
  
  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  console.log('✅ Database connection successful');
  console.log('   Sample data fetched');
})().catch(console.error);
