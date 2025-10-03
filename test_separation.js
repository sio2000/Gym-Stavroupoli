// Test script to verify Ultimate and Regular requests separation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzAsImV4cCI6MjA1MDU1MDg3MH0.2BwL3d7Qj8LfYz3B';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSeparation() {
    console.log('🧪 Testing Ultimate and Regular requests separation...\n');
    
    try {
        // Test 1: Get all requests (should include Ultimate)
        console.log('1️⃣ Testing getMembershipRequests (should EXCLUDE Ultimate)...');
        const { data: allRequests, error: allError } = await supabase
            .from('membership_requests')
            .select(`
                id,
                package:membership_packages!membership_requests_package_id_fkey(name)
            `);
            
        if (allError) {
            console.error('❌ Error fetching all requests:', allError);
            return;
        }
        
        const ultimateCount = allRequests?.filter(r => r.package?.name === 'Ultimate').length || 0;
        const regularCount = allRequests?.filter(r => r.package?.name !== 'Ultimate').length || 0;
        
        console.log(`📊 Total requests: ${allRequests?.length || 0}`);
        console.log(`👑 Ultimate requests: ${ultimateCount}`);
        console.log(`📋 Regular requests: ${regularCount}`);
        
        // Test 2: Get Ultimate requests only
        console.log('\n2️⃣ Testing getUltimateMembershipRequests (should ONLY include Ultimate)...');
        const { data: ultimateRequests, error: ultimateError } = await supabase
            .from('membership_requests')
            .select(`
                id,
                package:membership_packages!membership_requests_package_id_fkey(name)
            `)
            .eq('package.name', 'Ultimate');
            
        if (ultimateError) {
            console.error('❌ Error fetching Ultimate requests:', ultimateError);
            return;
        }
        
        console.log(`👑 Ultimate requests found: ${ultimateRequests?.length || 0}`);
        
        // Test 3: Get regular requests (should EXCLUDE Ultimate)
        console.log('\n3️⃣ Testing regular requests (should EXCLUDE Ultimate)...');
        const { data: regularRequests, error: regularError } = await supabase
            .from('membership_requests')
            .select(`
                id,
                package:membership_packages!membership_requests_package_id_fkey(name)
            `)
            .not('package.name', 'eq', 'Ultimate');
            
        if (regularError) {
            console.error('❌ Error fetching regular requests:', regularError);
            return;
        }
        
        console.log(`📋 Regular requests found: ${regularRequests?.length || 0}`);
        
        // Test 4: Verify separation
        console.log('\n4️⃣ Verifying separation...');
        const hasUltimateInRegular = regularRequests?.some(r => r.package?.name === 'Ultimate');
        const hasRegularInUltimate = ultimateRequests?.some(r => r.package?.name !== 'Ultimate');
        
        if (hasUltimateInRegular) {
            console.log('❌ ERROR: Ultimate requests found in regular requests!');
        } else {
            console.log('✅ Regular requests correctly exclude Ultimate');
        }
        
        if (hasRegularInUltimate) {
            console.log('❌ ERROR: Regular requests found in Ultimate requests!');
        } else {
            console.log('✅ Ultimate requests correctly include only Ultimate');
        }
        
        // Test 5: Check ultimate_installment_locks table
        console.log('\n5️⃣ Testing ultimate_installment_locks table...');
        const { data: ultimateLocks, error: locksError } = await supabase
            .from('ultimate_installment_locks')
            .select('*')
            .limit(5);
            
        if (locksError) {
            console.error('❌ Error fetching Ultimate locks:', locksError);
        } else {
            console.log(`🔒 Ultimate locks found: ${ultimateLocks?.length || 0}`);
            if (ultimateLocks && ultimateLocks.length > 0) {
                console.log('📋 Sample lock:', ultimateLocks[0]);
            }
        }
        
        console.log('\n🎉 Separation test completed!');
        
    } catch (error) {
        console.error('💥 Unexpected error:', error);
    }
}

testSeparation();
