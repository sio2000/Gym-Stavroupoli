/**
 * TEST: Weekly Pilates Refill - Κάθε Κυριακή
 * 
 * Αυτό το script τεστάρει ότι:
 * 1. Οι Ultimate χρήστες παίρνουν 3 μαθήματα κάθε Κυριακή
 * 2. Οι Ultimate Medium χρήστες παίρνουν 1 μάθημα κάθε Κυριακή
 * 3. Το feature flag λειτουργεί σωστά
 * 4. Τα deposits γίνονται reset (όχι top-up)
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test results
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
    const prefix = {
        'info': '📋',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'test': '🧪',
        'header': '═══════════════════════════════════════════════════════════════'
    };
    console.log(`${prefix[type] || '→'} ${message}`);
}

function assert(condition, testName) {
    testsRun++;
    if (condition) {
        testsPassed++;
        log(`PASS: ${testName}`, 'success');
        return true;
    } else {
        testsFailed++;
        log(`FAIL: ${testName}`, 'error');
        return false;
    }
}

async function runTests() {
    log('WEEKLY PILATES REFILL TEST SUITE', 'header');
    log('Έναρξη tests για Sunday refill...', 'info');
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Έλεγχος feature flag
    // ─────────────────────────────────────────────────────────────────
    log('TEST 1: Έλεγχος feature flag', 'test');
    
    const { data: featureFlag, error: ffError } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('name', 'weekly_pilates_refill_enabled')
        .single();

    if (ffError) {
        log(`Σφάλμα ανάκτησης feature flag: ${ffError.message}`, 'error');
        assert(false, 'Feature flag exists');
    } else {
        assert(featureFlag !== null, 'Feature flag exists');
        assert(featureFlag?.is_enabled === true, 'Feature flag is enabled');
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Έλεγχος Ultimate χρηστών
    // ─────────────────────────────────────────────────────────────────
    log('TEST 2: Έλεγχος Ultimate χρηστών', 'test');
    
    const { data: ultimateUsers, error: usersError } = await supabase
        .from('memberships')
        .select(`
            id,
            user_id,
            source_package_name,
            is_active,
            start_date,
            end_date,
            user_profiles!inner(first_name, last_name)
        `)
        .in('source_package_name', ['Ultimate', 'Ultimate Medium'])
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);

    if (usersError) {
        log(`Σφάλμα ανάκτησης χρηστών: ${usersError.message}`, 'error');
        assert(false, 'Ultimate users query successful');
    } else {
        log(`Βρέθηκαν ${ultimateUsers?.length || 0} ενεργοί Ultimate χρήστες`, 'info');
        
        const ultimateCount = ultimateUsers?.filter(u => u.source_package_name === 'Ultimate').length || 0;
        const ultimateMediumCount = ultimateUsers?.filter(u => u.source_package_name === 'Ultimate Medium').length || 0;
        
        log(`  - Ultimate: ${ultimateCount}`, 'info');
        log(`  - Ultimate Medium: ${ultimateMediumCount}`, 'info');
        
        assert(ultimateUsers !== null, 'Ultimate users query returned data');
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Έλεγχος τρεχόντων deposits
    // ─────────────────────────────────────────────────────────────────
    log('TEST 3: Έλεγχος τρεχόντων deposits', 'test');
    
    const depositsBefore = [];
    for (const user of (ultimateUsers || [])) {
        const { data: deposit } = await supabase
            .from('pilates_deposits')
            .select('*')
            .eq('user_id', user.user_id)
            .eq('is_active', true)
            .order('credited_at', { ascending: false })
            .limit(1)
            .single();
        
        depositsBefore.push({
            user_id: user.user_id,
            name: `${user.user_profiles?.first_name || ''} ${user.user_profiles?.last_name || ''}`,
            package: user.source_package_name,
            deposit_before: deposit?.deposit_remaining || 0
        });
        
        log(`  ${user.user_profiles?.first_name} ${user.user_profiles?.last_name}: ${deposit?.deposit_remaining || 0} μαθήματα (${user.source_package_name})`, 'info');
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Εκτέλεση refill function
    // ─────────────────────────────────────────────────────────────────
    log('TEST 4: Εκτέλεση process_weekly_pilates_refills()', 'test');
    
    const { data: refillResult, error: refillError } = await supabase
        .rpc('process_weekly_pilates_refills');

    if (refillError) {
        log(`Σφάλμα εκτέλεσης refill: ${refillError.message}`, 'error');
        assert(false, 'Refill function executed successfully');
    } else {
        const result = refillResult?.[0] || {};
        log(`Αποτέλεσμα refill:`, 'info');
        log(`  - Επεξεργασμένοι: ${result.processed_count || 0}`, 'info');
        log(`  - Επιτυχείς: ${result.success_count || 0}`, 'info');
        log(`  - Σφάλματα: ${result.error_count || 0}`, 'info');
        
        assert(refillError === null, 'Refill function executed successfully');
        assert((result.error_count || 0) === 0, 'No errors during refill');
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Επαλήθευση deposits μετά το refill
    // ─────────────────────────────────────────────────────────────────
    log('TEST 5: Επαλήθευση deposits μετά το refill', 'test');
    
    for (const userBefore of depositsBefore) {
        const { data: depositAfter } = await supabase
            .from('pilates_deposits')
            .select('*')
            .eq('user_id', userBefore.user_id)
            .eq('is_active', true)
            .order('credited_at', { ascending: false })
            .limit(1)
            .single();
        
        const expectedDeposit = userBefore.package === 'Ultimate' ? 3 : 1;
        const actualDeposit = depositAfter?.deposit_remaining || 0;
        
        const passed = actualDeposit === expectedDeposit;
        
        log(`  ${userBefore.name}: ${userBefore.deposit_before} → ${actualDeposit} (αναμενόμενο: ${expectedDeposit}) ${passed ? '✅' : '❌'}`, passed ? 'success' : 'error');
        
        assert(passed, `${userBefore.name} deposit is ${expectedDeposit}`);
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Έλεγχος refill history
    // ─────────────────────────────────────────────────────────────────
    log('TEST 6: Έλεγχος refill history', 'test');
    
    const today = new Date().toISOString().split('T')[0];
    const { data: refillHistory, error: historyError } = await supabase
        .from('ultimate_weekly_refills')
        .select(`
            *,
            user_profiles!ultimate_weekly_refills_user_id_fkey(first_name, last_name)
        `)
        .eq('refill_date', today)
        .order('created_at', { ascending: false });

    if (historyError) {
        log(`Σφάλμα ανάκτησης history: ${historyError.message}`, 'error');
    } else {
        log(`Βρέθηκαν ${refillHistory?.length || 0} refills για σήμερα`, 'info');
        
        for (const refill of (refillHistory || [])) {
            log(`  ${refill.user_profiles?.first_name} ${refill.user_profiles?.last_name}: ${refill.previous_deposit_amount} → ${refill.new_deposit_amount} (${refill.package_name})`, 'info');
        }
        
        assert((refillHistory?.length || 0) > 0 || (ultimateUsers?.length || 0) === 0, 'Refill history recorded');
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: Test get_user_weekly_refill_status
    // ─────────────────────────────────────────────────────────────────
    log('TEST 7: Test get_user_weekly_refill_status function', 'test');
    
    if (ultimateUsers && ultimateUsers.length > 0) {
        const testUser = ultimateUsers[0];
        
        const { data: statusData, error: statusError } = await supabase
            .rpc('get_user_weekly_refill_status', { p_user_id: testUser.user_id });

        if (statusError) {
            log(`Σφάλμα get_user_weekly_refill_status: ${statusError.message}`, 'error');
            assert(false, 'get_user_weekly_refill_status works');
        } else {
            const status = statusData?.[0];
            if (status) {
                log(`Status για ${testUser.user_profiles?.first_name}:`, 'info');
                log(`  - Package: ${status.package_name}`, 'info');
                log(`  - Current deposit: ${status.current_deposit_amount}`, 'info');
                log(`  - Target deposit: ${status.target_deposit_amount}`, 'info');
                log(`  - Next refill: ${status.next_refill_date}`, 'info');
                log(`  - Is Sunday: ${status.is_refill_due}`, 'info');
                
                assert(status.package_name !== null, 'Status returns package_name');
                assert(status.target_deposit_amount > 0, 'Status returns valid target_deposit_amount');
            } else {
                assert(false, 'Status data returned');
            }
        }
    } else {
        log('Δεν υπάρχουν Ultimate χρήστες για test', 'warning');
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────
    // FINAL SUMMARY
    // ─────────────────────────────────────────────────────────────────
    log('TEST SUMMARY', 'header');
    console.log();
    log(`Tests εκτελέστηκαν: ${testsRun}`, 'info');
    log(`Επιτυχημένα: ${testsPassed}`, 'success');
    log(`Αποτυχημένα: ${testsFailed}`, testsFailed > 0 ? 'error' : 'info');
    console.log();
    
    const successRate = testsRun > 0 ? ((testsPassed / testsRun) * 100).toFixed(1) : 0;
    log(`Ποσοστό επιτυχίας: ${successRate}%`, successRate === '100.0' ? 'success' : 'warning');
    
    if (testsFailed === 0) {
        log('', 'header');
        log('🎉 ΟΛΑ ΤΑ TESTS ΠΕΡΑΣΑΝ! Το Sunday refill λειτουργεί σωστά!', 'success');
        log('', 'header');
    } else {
        log('', 'header');
        log(`⚠️  ${testsFailed} test(s) απέτυχαν. Ελέγξτε τα σφάλματα παραπάνω.`, 'error');
        log('', 'header');
    }

    return testsFailed === 0;
}

// Run tests
runTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });

