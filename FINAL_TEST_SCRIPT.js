// Final comprehensive test script for the delete third installment functionality
// This script tests both frontend and backend functionality

console.log('=== FINAL COMPREHENSIVE TEST FOR DELETE THIRD INSTALLMENT ===');
console.log('Testing both frontend and backend functionality...');
console.log('============================================================');

// Test 1: Frontend Component Check
const testFrontendComponent = () => {
    console.log('1. FRONTEND COMPONENT TEST');
    console.log('--------------------------');
    
    // Check if the admin panel is loaded
    const adminPanel = document.querySelector('[class*="admin"]') || document.querySelector('body');
    console.log('Admin panel found:', !!adminPanel);
    
    // Check for installment management sections
    const installmentSections = document.querySelectorAll('[class*="installment"]');
    console.log('Installment sections found:', installmentSections.length);
    
    // Check for delete checkboxes
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const deleteCheckboxes = Array.from(allCheckboxes).filter(checkbox => 
        checkbox.nextElementSibling?.textContent?.includes('Διαγραφή 3ης Δόσης')
    );
    console.log('Delete third installment checkboxes found:', deleteCheckboxes.length);
    
    // Check for confirmation dialogs
    const confirmationDialogs = document.querySelectorAll('[class*="confirmation"], [class*="popup"], [class*="modal"]');
    console.log('Confirmation dialogs found:', confirmationDialogs.length);
    
    return {
        adminPanel: !!adminPanel,
        installmentSections: installmentSections.length,
        deleteCheckboxes: deleteCheckboxes.length,
        confirmationDialogs: confirmationDialogs.length
    };
};

// Test 2: JavaScript Error Check
const testJavaScriptErrors = () => {
    console.log('2. JAVASCRIPT ERROR TEST');
    console.log('------------------------');
    
    let errorCount = 0;
    const errors = [];
    
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
        errorCount++;
        errors.push({
            message,
            source,
            line: lineno,
            column: colno,
            error: error?.stack
        });
        console.error(`Error #${errorCount}:`, message, 'at', source, ':', lineno);
        return true;
    };
    
    // Monitor for 3 seconds
    setTimeout(() => {
        window.onerror = originalError;
        console.log('Error monitoring completed. Found', errorCount, 'errors');
        if (errors.length > 0) {
            console.log('Error details:', errors);
        }
    }, 3000);
    
    return { errorCount, errors };
};

// Test 3: Supabase Connection Test
const testSupabaseConnection = async () => {
    console.log('3. SUPABASE CONNECTION TEST');
    console.log('----------------------------');
    
    try {
        // Check if supabase is available
        if (typeof window.supabase === 'undefined') {
            console.log('Supabase not available globally');
            return { available: false, error: 'Supabase not found' };
        }
        
        // Test a simple query
        const { data, error } = await window.supabase
            .from('membership_requests')
            .select('id, has_installments')
            .limit(1);
        
        if (error) {
            console.log('Supabase query error:', error);
            return { available: true, error: error.message };
        }
        
        console.log('Supabase connection successful');
        console.log('Sample data:', data);
        return { available: true, error: null, data };
        
    } catch (err) {
        console.log('Supabase connection failed:', err);
        return { available: false, error: err.message };
    }
};

// Test 4: Delete Button Functionality Test
const testDeleteButtonFunctionality = () => {
    console.log('4. DELETE BUTTON FUNCTIONALITY TEST');
    console.log('-----------------------------------');
    
    const deleteCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'))
        .filter(checkbox => 
            checkbox.nextElementSibling?.textContent?.includes('Διαγραφή 3ης Δόσης')
        );
    
    if (deleteCheckboxes.length === 0) {
        console.log('No delete checkboxes found');
        return { found: false, testable: false };
    }
    
    console.log('Found', deleteCheckboxes.length, 'delete checkboxes');
    
    // Add event listeners to test functionality
    deleteCheckboxes.forEach((checkbox, index) => {
        const originalHandler = checkbox.onchange;
        
        checkbox.addEventListener('change', (e) => {
            console.log(`Delete checkbox ${index + 1} changed:`, {
                checked: e.target.checked,
                requestId: e.target.closest('[data-request-id]')?.dataset?.requestId || 'unknown',
                timestamp: new Date().toISOString()
            });
        });
        
        console.log(`Event listener added to delete checkbox ${index + 1}`);
    });
    
    return { found: true, testable: true, count: deleteCheckboxes.length };
};

// Test 5: Database Function Test (if possible)
const testDatabaseFunctions = async () => {
    console.log('5. DATABASE FUNCTION TEST');
    console.log('-------------------------');
    
    try {
        if (typeof window.supabase === 'undefined') {
            console.log('Cannot test database functions - Supabase not available');
            return { testable: false, error: 'Supabase not available' };
        }
        
        // Test the is_installment_locked function
        const { data, error } = await window.supabase
            .rpc('is_installment_locked', {
                p_request_id: '00000000-0000-0000-0000-000000000000',
                p_installment_number: 1
            });
        
        if (error) {
            console.log('Database function test error:', error);
            return { testable: true, error: error.message };
        }
        
        console.log('Database function test successful');
        console.log('Function result:', data);
        return { testable: true, error: null, result: data };
        
    } catch (err) {
        console.log('Database function test failed:', err);
        return { testable: false, error: err.message };
    }
};

// Test 6: Overall System Health Check
const testSystemHealth = () => {
    console.log('6. SYSTEM HEALTH CHECK');
    console.log('----------------------');
    
    const health = {
        frontendLoaded: document.readyState === 'complete',
        reactLoaded: typeof window.React !== 'undefined',
        supabaseLoaded: typeof window.supabase !== 'undefined',
        consoleWorking: typeof console.log === 'function',
        localStorageWorking: typeof localStorage !== 'undefined',
        sessionStorageWorking: typeof sessionStorage !== 'undefined'
    };
    
    console.log('System health status:', health);
    
    const healthScore = Object.values(health).filter(Boolean).length / Object.keys(health).length;
    console.log('Health score:', Math.round(healthScore * 100) + '%');
    
    return { ...health, score: healthScore };
};

// Run all tests
const runAllTests = async () => {
    console.log('Starting comprehensive test suite...');
    console.log('=====================================');
    
    const results = {
        frontend: testFrontendComponent(),
        errors: testJavaScriptErrors(),
        supabase: await testSupabaseConnection(),
        deleteButtons: testDeleteButtonFunctionality(),
        database: await testDatabaseFunctions(),
        systemHealth: testSystemHealth()
    };
    
    console.log('=====================================');
    console.log('FINAL TEST RESULTS:');
    console.log('=====================================');
    
    // Frontend results
    console.log('FRONTEND:');
    console.log('- Admin panel loaded:', results.frontend.adminPanel);
    console.log('- Installment sections:', results.frontend.installmentSections);
    console.log('- Delete checkboxes:', results.frontend.deleteCheckboxes);
    console.log('- Confirmation dialogs:', results.frontend.confirmationDialogs);
    
    // Error results
    console.log('ERRORS:');
    console.log('- JavaScript errors found:', results.errors.errorCount);
    
    // Supabase results
    console.log('SUPABASE:');
    console.log('- Available:', results.supabase.available);
    console.log('- Error:', results.supabase.error || 'None');
    
    // Delete button results
    console.log('DELETE BUTTONS:');
    console.log('- Found:', results.deleteButtons.found);
    console.log('- Testable:', results.deleteButtons.testable);
    console.log('- Count:', results.deleteButtons.count || 0);
    
    // Database results
    console.log('DATABASE:');
    console.log('- Testable:', results.database.testable);
    console.log('- Error:', results.database.error || 'None');
    
    // System health
    console.log('SYSTEM HEALTH:');
    console.log('- Score:', Math.round(results.systemHealth.score * 100) + '%');
    
    // Overall assessment
    const hasCriticalIssues = !results.frontend.adminPanel || 
                             results.errors.errorCount > 0 || 
                             !results.supabase.available ||
                             !results.deleteButtons.found;
    
    console.log('=====================================');
    console.log('OVERALL ASSESSMENT:', hasCriticalIssues ? 'CRITICAL ISSUES FOUND' : 'SYSTEM OPERATIONAL');
    console.log('=====================================');
    
    if (hasCriticalIssues) {
        console.log('RECOMMENDATIONS:');
        if (!results.frontend.adminPanel) console.log('- Check if admin panel is loaded correctly');
        if (results.errors.errorCount > 0) console.log('- Fix JavaScript errors');
        if (!results.supabase.available) console.log('- Check Supabase connection');
        if (!results.deleteButtons.found) console.log('- Check if installment requests are loaded');
    }
    
    return results;
};

// Auto-run the tests
runAllTests().then(results => {
    console.log('Test suite completed. Results available in window.testResults');
    window.testResults = results;
});

// Export for manual testing
window.runInstallmentTests = runAllTests;
