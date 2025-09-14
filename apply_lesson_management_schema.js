import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL schema file
const schemaPath = path.join(__dirname, 'database', 'lesson_management_schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📚 Lesson Management Schema');
console.log('==========================');
console.log('');
console.log('This script contains the SQL schema for the lesson management system.');
console.log('');
console.log('To apply this schema:');
console.log('1. Copy the SQL content below');
console.log('2. Paste it into your Supabase SQL Editor');
console.log('3. Execute the script');
console.log('');
console.log('SQL Schema:');
console.log('===========');
console.log(schema);
console.log('');
console.log('Schema ready to apply!');