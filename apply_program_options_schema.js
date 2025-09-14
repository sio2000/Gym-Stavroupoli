// Script to apply program options database schema
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Applying Program Options Database Schema...\n');

// Read the SQL schema file
const schema = readFileSync(join(__dirname, 'database', 'create_program_options_schema.sql'), 'utf8');

console.log('📄 SQL Schema to apply:');
console.log(schema);

console.log('\nPlease apply this SQL manually in the Supabase SQL Editor:');
console.log('1. Go to https://supabase.com/dashboard/project/nolqodpfaqdnprixaqlo/sql');
console.log('2. Copy and paste the SQL above');
console.log('3. Click "Run"');
console.log('\nAfter applying the schema, the program options will work correctly!');
