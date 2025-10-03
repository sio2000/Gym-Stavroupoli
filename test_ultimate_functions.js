// Test Ultimate functions directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzAsImV4cCI6MjA1MDU1MDg3MH0.2BwL3d7Qj8LfYz3B';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUltimateFunctions() {
    console.log('Testing Ultimate functions...');
    
    try {
        // First, get an Ultimate request ID
        const { data: requests, error: requestsError } = await supabase
            .from('membership_requests')
            .select(`
                id,
                package:membership_packages!membership_requests_package_id_fkey(name)
            `)
            .eq('package.name', 'Ultimate')
            .limit(1);
            
        if (requestsError) {
            console.error('Error fetching Ultimate requests:', requestsError);
            return;
        }
        
        if (!requests || requests.length === 0) {
            console.log('No Ultimate requests found for testing');
            return;
        }
        
        const testRequestId = requests[0].id;
        console.log('Found Ultimate request ID:', testRequestId);
        
        // Test lock function
        console.log('Testing lock_ultimate_installment...');
        const { data: lockResult, error: lockError } = await supabase
            .rpc('lock_ultimate_installment', {
                p_request_id: testRequestId,
                p_installment_number: 1,
                p_locked_by: 'ff37b8f6-29b2-4598-9f8f-351940e755a2'
            });
            
        if (lockError) {
            console.error('Lock function error:', lockError);
        } else {
            console.log('Lock function success:', lockResult);
        }
        
        // Test delete function
        console.log('Testing delete_ultimate_third_installment...');
        const { data: deleteResult, error: deleteError } = await supabase
            .rpc('delete_ultimate_third_installment', {
                p_request_id: testRequestId,
                p_deleted_by: 'ff37b8f6-29b2-4598-9f8f-351940e755a2'
            });
            
        if (deleteError) {
            console.error('Delete function error:', deleteError);
        } else {
            console.log('Delete function success:', deleteResult);
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

testUltimateFunctions();
