const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRegistration() {
  try {
    console.log('🔧 Fixing registration and profile creation...');
    
    // Step 1: Create the fixed get_user_profile_safe function
    console.log('📝 Step 1: Creating fixed get_user_profile_safe function...');
    
    // We'll need to apply this via SQL editor since we can't execute DDL via RPC
    const sqlFix = `
-- Fix the get_user_profile_safe function to use real user data
CREATE OR REPLACE FUNCTION public.get_user_profile_safe(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    auth_user_record record;
    actual_email text;
    actual_first_name text;
    actual_last_name text;
    actual_phone text;
BEGIN
    -- Try to get existing profile first
    SELECT to_json(up.*) INTO result
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;
    
    -- If profile exists, return it
    IF result IS NOT NULL THEN
        RETURN result;
    END IF;
    
    -- Profile doesn't exist, get real user data from auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name' as first_name,
        raw_user_meta_data->>'last_name' as last_name,
        raw_user_meta_data->>'phone' as phone
    INTO auth_user_record
    FROM auth.users 
    WHERE id = p_user_id;

    -- Use actual data from auth.users if available
    actual_email := COALESCE(auth_user_record.email, 'user@freegym.gr');
    actual_first_name := COALESCE(auth_user_record.first_name, 'User');
    actual_last_name := COALESCE(auth_user_record.last_name, '');
    actual_phone := COALESCE(auth_user_record.phone, NULL);

    -- Create new profile with real data
    INSERT INTO public.user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        language,
        role,
        referral_code,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        actual_email,
        actual_first_name,
        actual_last_name,
        actual_phone,
        'el',
        'user',
        'REF' || substr(p_user_id::text, 1, 8),
        NOW(),
        NOW()
    );
    
    -- Return the created profile
    SELECT to_json(up.*) INTO result
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;
    
    RETURN result;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile was created by another process, return it
        SELECT to_json(up.*) INTO result
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
        RETURN result;
    WHEN OTHERS THEN
        -- Return error information
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'detail', SQLSTATE,
            'user_id', p_user_id
        );
END;
$$;

-- Fix the create_user_profile_safe function
CREATE OR REPLACE FUNCTION public.create_user_profile_safe(
    p_user_id uuid,
    p_email text DEFAULT NULL,
    p_first_name text DEFAULT 'User',
    p_last_name text DEFAULT '',
    p_phone text DEFAULT NULL,
    p_language text DEFAULT 'el'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_profile json;
    actual_email text;
    actual_first_name text;
    actual_last_name text;
    actual_phone text;
    auth_user_record record;
BEGIN
    -- Get the actual user data from auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name' as first_name,
        raw_user_meta_data->>'last_name' as last_name,
        raw_user_meta_data->>'phone' as phone
    INTO auth_user_record
    FROM auth.users 
    WHERE id = p_user_id;

    -- Use actual data from auth.users if available, otherwise use provided values
    actual_email := COALESCE(auth_user_record.email, p_email, 'user@freegym.gr');
    actual_first_name := COALESCE(auth_user_record.first_name, p_first_name, 'User');
    actual_last_name := COALESCE(auth_user_record.last_name, p_last_name, '');
    actual_phone := COALESCE(auth_user_record.phone, p_phone, NULL);

    -- Try to insert the new profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        language,
        role,
        referral_code,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        actual_email,
        actual_first_name,
        actual_last_name,
        actual_phone,
        p_language,
        'user',
        'REF' || substr(p_user_id::text, 1, 8),
        NOW(),
        NOW()
    );

    -- Return the created profile
    SELECT to_json(up.*) INTO result_profile
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;

    RETURN result_profile;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, return it
        SELECT to_json(up.*) INTO result_profile
        FROM public.user_profiles up
        WHERE up.user_id = p_user_id;
        
        RETURN result_profile;
    WHEN OTHERS THEN
        -- Return error information
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_safe TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe TO anon;
`;

    console.log('📋 SQL Fix to apply in Supabase SQL Editor:');
    console.log('=====================================');
    console.log(sqlFix);
    console.log('=====================================');
    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Execute the SQL');
    console.log('5. Test registration with a new user');
    console.log('');
    
    // Step 2: Test the current state
    console.log('📝 Step 2: Testing current functions...');
    
    // Test if functions exist
    const { data: testProfile, error: testError } = await supabase
      .rpc('get_user_profile_safe', { p_user_id: '00000000-0000-0000-0000-000000000000' });

    if (testError) {
      console.log('❌ get_user_profile_safe function test failed:', testError.message);
    } else {
      console.log('✅ get_user_profile_safe function exists and works');
    }

    // Step 3: Check current profiles
    console.log('📝 Step 3: Checking current profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`📊 Current profiles (${profiles.length}):`);
      console.table(profiles);
    }

    console.log('🎉 Registration fix prepared!');
    console.log('📋 Next steps:');
    console.log('1. Apply the SQL fix in Supabase SQL Editor');
    console.log('2. Test registration with a new user');
    console.log('3. Verify the user profile is created with correct data');

  } catch (err) {
    console.error('❌ Error preparing fix:', err);
  }
}

fixRegistration();
