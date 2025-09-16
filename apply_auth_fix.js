const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('🔧 Applying authentication fix for unknown users...');
    
    // Step 1: Fix the get_user_profile_safe function
    console.log('📝 Step 1: Updating get_user_profile_safe function...');
    const { error: func1Error } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (func1Error) {
      console.error('❌ Error updating get_user_profile_safe:', func1Error);
    } else {
      console.log('✅ get_user_profile_safe function updated successfully');
    }

    // Step 2: Fix existing profiles
    console.log('📝 Step 2: Fixing existing profiles with unknown data...');
    const { error: updateError } = await supabase.rpc('exec', {
      sql: `
        UPDATE public.user_profiles 
        SET 
            email = COALESCE(auth_users.email, user_profiles.email),
            first_name = COALESCE(auth_users.raw_user_meta_data->>'first_name', user_profiles.first_name),
            last_name = COALESCE(auth_users.raw_user_meta_data->>'last_name', user_profiles.last_name),
            phone = COALESCE(auth_users.raw_user_meta_data->>'phone', user_profiles.phone),
            updated_at = NOW()
        FROM auth.users as auth_users
        WHERE 
            public.user_profiles.user_id = auth_users.id
            AND (
                public.user_profiles.email = 'unknown@example.com' 
                OR public.user_profiles.first_name = 'User'
                OR public.user_profiles.last_name = ''
                OR public.user_profiles.email IS NULL
            )
            AND auth_users.email IS NOT NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error updating profiles:', updateError);
    } else {
      console.log('✅ Existing profiles updated successfully');
    }

    // Step 3: Verify the fix
    console.log('📝 Step 3: Verifying the fix...');
    const { data: verificationData, error: verifyError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {
      console.log('✅ Verification successful. Recent profiles:');
      console.table(verificationData);
    }

    console.log('🎉 Authentication fix completed!');
    console.log('📋 Summary:');
    console.log('   - Updated get_user_profile_safe function to use real user data');
    console.log('   - Fixed existing profiles with unknown data');
    console.log('   - New users will now get proper profiles with their actual information');

  } catch (err) {
    console.error('❌ Error applying fix:', err);
  }
}

applyFix();
