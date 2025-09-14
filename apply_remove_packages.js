import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is not defined. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const applySqlFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing SQL from: ${filePath}`);
    const { data, error } = await supabase.rpc('execute_sql_query', { query: sql });

    if (error) {
      console.error(`Error executing SQL from ${filePath}:`, error);
      throw error;
    }
    console.log(`Successfully executed SQL from ${filePath}.`);
    return true;
  } catch (error) {
    console.error(`Failed to execute SQL from ${filePath}:`, error);
    return false;
  }
};

const runMigrations = async () => {
  const migrationFilePath = path.join(__dirname, 'database', 'remove_unwanted_packages.sql');
  await applySqlFile(migrationFilePath);
};

runMigrations();
