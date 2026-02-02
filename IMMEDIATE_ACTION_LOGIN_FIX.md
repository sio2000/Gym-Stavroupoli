​# 🚨 IMMEDIATE ACTION REQUIRED

## Problem Diagnosis
The `handle_new_user_bulletproof()` function has TWO critical issues:

1. **Audit Logging During Auth**: The function tries to insert into `user_profile_audit_logs` during the Supabase auth token generation flow. If this table has RLS policies or if the insert fails, it crashes the entire auth endpoint, causing "Database error querying schema".

2. **Complex Function Call**: The trigger calls `ensure_user_profile()` which has additional complexity. Any exception in that function can silently fail.

**Evidence**: 
- Existing user (paxexi5763@arqsis.com) logs in successfully ✅
- New users fail with same 500 error ❌
- Error occurs during auth token generation (not login)
- Accounts exist in auth.users with correct data
- The difference: new accounts trigger the `handle_new_user()` function on insert

## Solution
Replace the complex trigger with a minimal one that:
1. ✅ Creates the user_profile record
2. ✅ Doesn't write to audit tables
3. ✅ Silently handles errors (doesn't fail auth)
4. ✅ Uses simple ON CONFLICT logic instead of exception handling

## Execution Steps

### Step 1: Apply the Minimal Trigger Fix
Go to **Supabase SQL Editor** and:
1. Open file: `EMERGENCY_MINIMAL_TRIGGER.sql`
2. Copy ALL content
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion

**Expected output:**
```
Function handle_new_user exists | status
Trigger on_auth_user_created exists | status
```

### Step 2: Delete Problematic Accounts
Still in Supabase SQL Editor:
```sql
DELETE FROM public.user_profiles 
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com');

DELETE FROM auth.users 
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com');
```

### Step 3: Recreate Accounts (NEW trigger will auto-create profiles)
```sql
-- Admin account
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, phone_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '63fd490e-e1c5-496a-94c8-a14339b696e4',
    'authenticated', 'authenticated', 'admin@freegym.gr',
    '$2a$10$l7y9lXPKKWNYj3KJ0ckQWe1TZP1dKfVvNSO1XHqNTKwYNZJhjQPFS',
    NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Admin","last_name":"FreeGym","phone":null,"language":"el","role":"admin"}'::jsonb,
    false, NOW(), NOW()
);

-- Reception account
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, phone_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user,
    created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b75f0648-8a24-4855-b6ec-ea203431452b',
    'authenticated', 'authenticated', 'receptiongym2025@gmail.com',
    '$2a$10$6TkBJ5zKdvv7cJ0ZKqOCp.rJcqsQGKO8vXJFNpYGrVUBi0GFK5h9e',
    NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Reception","last_name":"Desk","phone":null,"language":"el","role":"reception"}'::jsonb,
    false, NOW(), NOW()
);
```

### Step 4: Verify in App
Test login:
- Email: `admin@freegym.gr`
- Password: `admin123`
- Expected: Login succeeds ✅

Test login:
- Email: `receptiongym2025@gmail.com`
- Password: `Reception123!`
- Expected: Login succeeds ✅

## Why This Works

### Old Broken Flow:
```
User inserts into auth.users
  → Trigger: handle_new_user_bulletproof() fires
    → Calls: ensure_user_profile()
      → Tries: INSERT INTO user_profile_audit_logs
        → ⚠️ Audit table has RLS or fails
          → Exception caught but poorly handled
            → ❌ Auth token generation fails
              → "Database error querying schema" 500 error
```

### New Fixed Flow:
```
User inserts into auth.users
  → Trigger: handle_new_user() fires (MINIMAL)
    → Direct: INSERT INTO user_profiles (no audit)
      → ✅ Profile created or conflict ignored
        → ✅ Trigger doesn't fail
          → ✅ Auth token generation completes
            → ✅ Login works
```

## Files Created
- `EMERGENCY_MINIMAL_TRIGGER.sql` - The minimal trigger code
- `COMPLETE_LOGIN_FIX.sql` - Full fix with all steps

---

**Once this works:**
1. ✅ Re-enable RLS policies (carefully)
2. ✅ Test admin and reception panels
3. ✅ Prepare STEP 5 for production
