// Frontend debug test for delete third installment functionality
// Run this in the browser console when on the admin panel

console.log('=== FRONTEND DEBUG TEST FOR DELETE THIRD INSTALLMENT ===');

// Test 1: Check if the component is loaded
const checkComponentLoaded = () => {
    console.log('1. Checking if AdminUltimateInstallmentsTab component is loaded...');
    
    // Look for the main container
    const mainContainer = document.querySelector('[class*="space-y-8"]');
    console.log('Main container found:', !!mainContainer);
    
    // Look for installment management sections
    const installmentSections = document.querySelectorAll('[class*="installment"]');
    console.log('Installment sections found:', installmentSections.length);
    
    // Look for delete checkboxes
    const deleteCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const thirdInstallmentCheckboxes = Array.from(deleteCheckboxes).filter(checkbox => 
        checkbox.nextElementSibling?.textContent?.includes('Διαγραφή 3ης Δόσης')
    );
    console.log('Third installment delete checkboxes found:', thirdInstallmentCheckboxes.length);
    
    return {
        mainContainer: !!mainContainer,
        installmentSections: installmentSections.length,
        deleteCheckboxes: thirdInstallmentCheckboxes.length
    };
};

// Test 2: Check for JavaScript errors
const checkForErrors = () => {
    console.log('2. Checking for JavaScript errors...');
    
    let errorCount = 0;
    const originalError = window.onerror;
    
    window.onerror = (message, source, lineno, colno, error) => {
        errorCount++;
        console.error(`JavaScript Error #${errorCount}:`, {
            message,
            source,
            line: lineno,
            column: colno,
            error
        });
        return true; // Prevent default error handling
    };
    
    // Restore original error handler after 5 seconds
    setTimeout(() => {
        window.onerror = originalError;
        console.log(`Error monitoring completed. Found ${errorCount} errors.`);
    }, 5000);
    
    return errorCount;
};

// Test 3: Check if Supabase client is available
const checkSupabaseClient = () => {
    console.log('3. Checking Supabase client...');
    
    // Check if supabase is available globally
    if (typeof window.supabase !== 'undefined') {
        console.log('Supabase client found globally');
        return true;
    }
    
    // Check if it's available in modules
    if (typeof window.__webpack_require__ !== 'undefined') {
        try {
            const supabaseModule = window.__webpack_require__.cache;
            console.log('Webpack modules found, checking for Supabase...');
            return true;
        } catch (e) {
            console.log('Could not access webpack modules');
        }
    }
    
    console.log('Supabase client not found globally');
    return false;
};

// Test 4: Test the delete button click
const testDeleteButtonClick = () => {
    console.log('4. Testing delete button click...');
    
    const deleteCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const thirdInstallmentCheckboxes = Array.from(deleteCheckboxes).filter(checkbox => 
        checkbox.nextElementSibling?.textContent?.includes('Διαγραφή 3ης Δόσης')
    );
    
    if (thirdInstallmentCheckboxes.length > 0) {
        console.log('Found delete checkboxes, testing click...');
        
        // Add click event listener to see what happens
        thirdInstallmentCheckboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('click', (e) => {
                console.log(`Delete checkbox ${index + 1} clicked:`, {
                    checked: e.target.checked,
                    requestId: e.target.closest('[data-request-id]')?.dataset?.requestId || 'unknown'
                });
            });
        });
        
        console.log('Click event listeners added to delete checkboxes');
        return true;
    } else {
        console.log('No delete checkboxes found');
        return false;
    }
};

// Test 5: Check for confirmation dialogs
const checkConfirmationDialogs = () => {
    console.log('5. Checking for confirmation dialogs...');
    
    // Look for confirmation dialog elements
    const confirmationDialogs = document.querySelectorAll('[class*="confirmation"], [class*="popup"], [class*="modal"]');
    console.log('Confirmation dialogs found:', confirmationDialogs.length);
    
    // Look for delete confirmation specifically
    const deleteConfirmations = document.querySelectorAll('[class*="delete"][class*="confirmation"]');
    console.log('Delete confirmation dialogs found:', deleteConfirmations.length);
    
    return {
        totalDialogs: confirmationDialogs.length,
        deleteDialogs: deleteConfirmations.length
    };
};

// Run all tests
const runAllTests = () => {
    console.log('Starting comprehensive frontend debug test...');
    console.log('==========================================');
    
    const results = {
        componentLoaded: checkComponentLoaded(),
        errorCount: checkForErrors(),
        supabaseAvailable: checkSupabaseClient(),
        deleteButtonsFound: testDeleteButtonClick(),
        confirmationDialogs: checkConfirmationDialogs()
    };
    
    console.log('==========================================');
    console.log('TEST RESULTS SUMMARY:');
    console.log('==========================================');
    console.log('Component loaded:', results.componentLoaded);
    console.log('JavaScript errors found:', results.errorCount);
    console.log('Supabase client available:', results.supabaseAvailable);
    console.log('Delete buttons found:', results.deleteButtonsFound);
    console.log('Confirmation dialogs:', results.confirmationDialogs);
    
    // Overall assessment
    const hasIssues = !results.componentLoaded.mainContainer || 
                     results.errorCount > 0 || 
                     !results.supabaseAvailable || 
                     !results.deleteButtonsFound;
    
    console.log('==========================================');
    console.log('OVERALL ASSESSMENT:', hasIssues ? 'ISSUES FOUND' : 'ALL SYSTEMS OK');
    console.log('==========================================');
    
    return results;
};

// Auto-run the tests
runAllTests();

// Export functions for manual testing
window.debugInstallmentDelete = {
    runAllTests,
    checkComponentLoaded,
    checkForErrors,
    checkSupabaseClient,
    testDeleteButtonClick,
    checkConfirmationDialogs
};

console.log('Debug functions available as window.debugInstallmentDelete');
