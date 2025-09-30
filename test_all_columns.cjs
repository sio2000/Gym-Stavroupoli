const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllColumns() {
  console.log('🔍 Testing all required columns for Secretary Dashboard...\n');

  try {
    // Test 1: Get all columns
    console.log('📋 Test 1: Getting all columns...');
    const { data: allData, error: allError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .limit(1);

    if (allError) {
      console.error('❌ Error selecting all columns:', allError);
      return;
    }

    if (allData && allData.length > 0) {
      const columns = Object.keys(allData[0]);
      console.log('✅ All columns retrieved successfully');
      console.log('📊 Available columns:', columns);

      // Check for required columns
      const requiredColumns = [
        'id',
        'user_id', 
        'training_type',
        'sessions',
        'approval_status',
        'program_options',
        'created_at',
        'updated_at'
      ];

      console.log('\n📋 Test 2: Checking required columns...');
      requiredColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`✅ ${col}: exists`);
        } else {
          console.log(`❌ ${col}: MISSING`);
        }
      });

      // Test 3: Try to insert a complete record
      console.log('\n📋 Test 3: Testing complete record insertion...');
      const testRecord = {
        user_id: '00000000-0000-0000-0000-000000000000',
        training_type: 'individual',
        sessions: [
          {
            id: 'test-session-1',
            date: '2025-01-15',
            startTime: '18:00',
            endTime: '19:00',
            trainer: 'Mike',
            room: 'Αίθουσα Mike',
            type: 'personal'
          }
        ],
        approval_status: 'pending',
        program_options: {
          oldMembers: false,
          first150Members: false,
          paymentOptions: {
            cash: false,
            pos: false,
            installment: false
          }
        }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('personal_training_schedules')
        .insert(testRecord)
        .select();

      if (insertError) {
        console.error('❌ Error inserting complete record:', insertError);
      } else {
        console.log('✅ Complete record inserted successfully');
        console.log('📊 Inserted record ID:', insertData[0].id);
        
        // Clean up
        const { error: deleteError } = await supabase
          .from('personal_training_schedules')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.log('⚠️ Could not clean up test record:', deleteError);
        } else {
          console.log('🧹 Test record cleaned up');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAllColumns();
