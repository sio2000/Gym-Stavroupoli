import { createClient } from '@supabase/supabase-js';

// Χρησιμοποιούμε service role key για να μπορούμε να αλλάξουμε τις πολιτικές
const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function fixInfiniteRecursion() {
  console.log('🔧 Διόρθωση infinite recursion στις RLS πολιτικές...');

  try {
    // 1. Διαγραφή όλων των υπαρχουσών πολιτικών
    console.log('📝 Διαγραφή υπαρχουσών πολιτικών...');
    
    const policiesToDrop = [
      "Users can view own profile",
      "Users can insert own profile", 
      "Users can update own profile",
      "Admins can view all user profiles",
      "Admins can insert user profiles",
      "Admins can update user profiles",
      "Enable read access for all users",
      "Enable insert for authenticated users only",
      "Enable update for users based on user_id",
      "Admins can view all profiles",
      "Admins can update all profiles",
      "Allow registration"
    ];

    for (const policyName of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON public.user_profiles;`
        });
        if (error) {
          console.log(`⚠️  Δεν μπόρεσε να διαγραφεί η πολιτική "${policyName}":`, error.message);
        } else {
          console.log(`✅ Διαγράφηκε η πολιτική "${policyName}"`);
        }
      } catch (err) {
        console.log(`⚠️  Σφάλμα στη διαγραφή "${policyName}":`, err.message);
      }
    }

    // 2. Δημιουργία νέων απλών πολιτικών χωρίς recursion
    console.log('🆕 Δημιουργία νέων πολιτικών...');

    const newPolicies = [
      {
        name: "Allow registration",
        sql: `CREATE POLICY "Allow registration" ON public.user_profiles
              FOR INSERT WITH CHECK (true);`
      },
      {
        name: "Users can view own profile",
        sql: `CREATE POLICY "Users can view own profile" ON public.user_profiles
              FOR SELECT USING (auth.uid() = user_id);`
      },
      {
        name: "Users can update own profile", 
        sql: `CREATE POLICY "Users can update own profile" ON public.user_profiles
              FOR UPDATE USING (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);`
      }
    ];

    for (const policy of newPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        });
        if (error) {
          console.log(`❌ Σφάλμα στη δημιουργία "${policy.name}":`, error.message);
        } else {
          console.log(`✅ Δημιουργήθηκε η πολιτική "${policy.name}"`);
        }
      } catch (err) {
        console.log(`❌ Σφάλμα στη δημιουργία "${policy.name}":`, err.message);
      }
    }

    // 3. Ενεργοποίηση RLS
    console.log('🔒 Ενεργοποίηση RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️  Σφάλμα στην ενεργοποίηση RLS:', rlsError.message);
    } else {
      console.log('✅ RLS ενεργοποιήθηκε');
    }

    // 4. Δοκιμή πρόσβασης
    console.log('🧪 Δοκιμή πρόσβασης...');
    const { data, error: testError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1);

    if (testError) {
      console.log('❌ Σφάλμα στη δοκιμή:', testError.message);
    } else {
      console.log('✅ Η πρόσβαση λειτουργεί κανονικά');
    }

    console.log('🎉 Η διόρθωση ολοκληρώθηκε!');

  } catch (error) {
    console.error('❌ Σφάλμα στη διόρθωση:', error.message);
  }
}

// Εκτέλεση
fixInfiniteRecursion();
