// Script to set up the contact messages table in the database
// Run this script to create the necessary database structure

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupContactTable() {
  try {
    console.log('🚀 Setting up contact_messages table...');

    // Create the table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create contact_messages table for storing contact form submissions
        CREATE TABLE IF NOT EXISTS public.contact_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'replied')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            processed_at TIMESTAMPTZ,
            processed_by UUID REFERENCES auth.users(id),
            notes TEXT
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
        CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
        CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);

        -- Enable RLS
        ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
        CREATE POLICY "Admins can view all contact messages" ON public.contact_messages
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );

        DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
        CREATE POLICY "Admins can update contact messages" ON public.contact_messages
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );

        -- Grant necessary permissions
        GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO authenticated;
        GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO anon;
      `
    });

    if (createError) {
      console.error('❌ Error creating table:', createError);
      
      // Try alternative approach - direct table creation
      console.log('🔄 Trying alternative approach...');
      
      const { error: directError } = await supabase
        .from('contact_messages')
        .select('id')
        .limit(1);
        
      if (directError && directError.code === 'PGRST116') {
        console.log('📝 Table does not exist, please create it manually using the SQL script:');
        console.log('📁 File: database/create_contact_messages_table.sql');
        console.log('💡 Run this SQL in your Supabase SQL Editor');
      }
    } else {
      console.log('✅ Contact messages table created successfully!');
    }

    // Test the table
    const { data, error: testError } = await supabase
      .from('contact_messages')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing table:', testError);
    } else {
      console.log('✅ Table is accessible and ready to use!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupContactTable().then(() => {
  console.log('🏁 Setup completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});
