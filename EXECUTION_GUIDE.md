# EXECUTION GUIDE - INFINITE RECURSION FIX

## How to Run the SQL Scripts in Supabase

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to "SQL Editor" in the left sidebar

2. **Run Database Audit First**
   - Copy the contents of `database_audit.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Review the results to understand current state

3. **Apply the Safe Fix**
   - Copy the contents of `fix_infinite_recursion_safe.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Check for any errors in the output

4. **Verify the Fix**
   - Check that new policies are created
   - Verify new functions are working
   - Test with a sample query

### Method 2: Command Line (if you have psql)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the scripts
\i database_audit.sql
\i fix_infinite_recursion_safe.sql
```

## Step-by-Step Execution

### Step 1: Database Audit
**Use the final audit script: `database_audit_final.sql`**

This script works with Supabase and avoids all problematic functions like `pg_get_policydef()`.

### Step 2: Apply Safe Fix
**Use the final fix script: `fix_infinite_recursion_final.sql`**

This script handles foreign key constraints properly and works with real user IDs.

### Step 3: Test the Fix
**Use the test script: `test_fix_safe.sql`**

This script tests the functions with real user IDs from your database.

### Step 4: Update Frontend
```bash
# 1. Backup current AuthContext
cp src/contexts/AuthContext.tsx src/contexts/AuthContext.backup.tsx

# 2. Replace with safe version
cp src/contexts/AuthContextSafe.tsx src/contexts/AuthContext.tsx

# 3. Restart development server
npm run dev
```

## Verification Steps

### 1. Check Database Changes
```sql
-- Verify new policies exist
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_profiles'
ORDER BY policyname;

-- Verify new functions exist
SELECT proname, prokind
FROM pg_proc
WHERE proname LIKE '%user_profile%' OR proname LIKE '%safe%'
ORDER BY proname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';
```

### 2. Test Frontend
1. Open browser dev tools
2. Navigate to signup page
3. Fill out registration form
4. Submit form
5. Check for 500 errors in network tab
6. Verify signup completes quickly (< 3 seconds)

### 3. Test Login
1. Navigate to login page
2. Enter credentials
3. Submit form
4. Check for errors
5. Verify login completes quickly (< 2 seconds)

## Rollback (if needed)

**Use the final rollback script: `rollback_final.sql`**

This script will remove only the new policies and functions we added, restoring the table to its original state.

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Make sure you're using the service role key
   - Check that you have admin access to the project

2. **Function Already Exists**
   - This is normal, the script uses `CREATE OR REPLACE`
   - The function will be updated with the new definition

3. **Policy Already Exists**
   - This is normal, the script uses `CREATE POLICY` which will fail if it exists
   - You can drop the existing policy first if needed

4. **Syntax Errors**
   - Make sure you're running the script in Supabase SQL Editor
   - Check that all semicolons are in place
   - Verify the script is complete

### Getting Help

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Make sure you have the correct permissions
4. Test with a simple query first

## Success Indicators

After running the fix, you should see:
- ✅ New policies created successfully
- ✅ New functions created successfully
- ✅ No syntax errors
- ✅ Frontend signup works quickly
- ✅ No 500 errors in browser console
- ✅ User profiles load immediately
