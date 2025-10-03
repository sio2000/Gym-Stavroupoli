// Debug script to test the delete third installment functionality
// This can be run in the browser console to test the functionality

console.log('=== DEBUG: Delete Third Installment Button Test ===');

// Test 1: Check if the AdminUltimateInstallmentsTab component is loaded
const adminTab = document.querySelector('[data-testid="admin-ultimate-installments-tab"]');
console.log('AdminUltimateInstallmentsTab found:', !!adminTab);

// Test 2: Check if there are any delete third installment checkboxes
const deleteCheckboxes = document.querySelectorAll('input[type="checkbox"]');
const thirdInstallmentCheckboxes = Array.from(deleteCheckboxes).filter(checkbox => 
  checkbox.nextElementSibling?.textContent?.includes('Διαγραφή 3ης Δόσης')
);
console.log('Third installment delete checkboxes found:', thirdInstallmentCheckboxes.length);

// Test 3: Check if there are any installment management sections
const installmentSections = document.querySelectorAll('[class*="installment"]');
console.log('Installment sections found:', installmentSections.length);

// Test 4: Check if the confirmation dialogs exist
const deleteConfirmation = document.querySelector('[class*="delete"][class*="confirmation"]');
console.log('Delete confirmation dialog found:', !!deleteConfirmation);

// Test 5: Test the isInstallmentLocked function (if available in global scope)
if (typeof window.isInstallmentLocked === 'function') {
  console.log('isInstallmentLocked function available globally');
} else {
  console.log('isInstallmentLocked function not available globally');
}

// Test 6: Check for any JavaScript errors
window.addEventListener('error', (e) => {
  console.error('JavaScript error detected:', e.error);
});

console.log('=== Debug test completed ===');
