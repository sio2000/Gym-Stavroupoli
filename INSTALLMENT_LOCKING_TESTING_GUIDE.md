# Installment Locking Feature - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the new installment locking functionality in the Ultimate Package tab for both Admin and Secretary panels.

## Feature Summary
- **Target**: 👑 Ultimate Package tab (Admin panel and Secretariat panel)
- **New Feature**: Installment locking with confirmation popup
- **Functionality**: Admins can lock individual installments to prevent further editing

## Manual Testing Instructions

### Prerequisites
1. Ensure you have access to both Admin Panel and Secretary Dashboard
2. Have at least one Ultimate Package request with installments in the system
3. Access to a browser with developer tools for console verification

### Test 1: Checkbox Appearance
**Objective**: Verify that checkboxes appear under each installment

**Steps**:
1. Navigate to Admin Panel → Ultimate Package tab
2. Look for a request with installments (has "💳 Με Δόσεις" badge)
3. Scroll down to the "Διαχείριση Δόσεων" section
4. Verify that under each installment (1η, 2η, 3η Δόση) there is:
   - A checkbox with lock icon
   - Text "Κλείδωμα Δόσης"
   - Checkbox is initially unchecked

**Expected Result**: ✅ All three installments show checkboxes with lock icons

### Test 2: Popup Trigger
**Objective**: Verify that clicking checkbox triggers confirmation popup

**Steps**:
1. Click on the checkbox under "1η Δόση"
2. Verify that a modal popup appears with:
   - Orange lock icon
   - Title "🔒 Κλείδωμα Δόσης"
   - Question "Do you confirm locking installment 1?"
   - Greek explanation text
   - Two buttons: "❌ Cancel" and "✅ Yes, Lock"

**Expected Result**: ✅ Popup appears with correct content and styling

### Test 3: Confirm Lock
**Objective**: Verify that confirming locks the installment

**Steps**:
1. With popup open from Test 2, click "✅ Yes, Lock"
2. Verify that:
   - Popup closes
   - Checkbox under "1η Δόση" becomes checked
   - Amount input becomes disabled with orange styling
   - Payment method select becomes disabled with orange styling
   - Due date input becomes disabled with orange styling
   - All inputs show "cursor-not-allowed" behavior

**Expected Result**: ✅ Installment 1 is locked and cannot be edited

### Test 4: Cancel Lock
**Objective**: Verify that canceling does not lock the installment

**Steps**:
1. Click on the checkbox under "2η Δόση"
2. When popup appears, click "❌ Cancel"
3. Verify that:
   - Popup closes
   - Checkbox remains unchecked
   - All inputs remain editable
   - No orange styling is applied

**Expected Result**: ✅ Installment 2 remains editable

### Test 5: Database Persistence
**Objective**: Verify that locking state is saved to database

**Steps**:
1. Lock installment 3 using the process from Test 3
2. Click the "💾 Αποθήκευση Δόσεων & Ημερομηνιών" button
3. Refresh the page
4. Verify that installment 3 remains locked after page refresh

**Expected Result**: ✅ Locking state persists after page refresh

### Test 6: Secretary Panel Functionality
**Objective**: Verify that Secretary panel has identical functionality

**Steps**:
1. Navigate to Secretary Dashboard → Ultimate Package tab
2. Repeat Tests 1-5 on the Secretary panel
3. Verify identical behavior and styling

**Expected Result**: ✅ Secretary panel has identical locking functionality

### Test 7: Multiple Installments
**Objective**: Verify that multiple installments can be locked independently

**Steps**:
1. Lock installment 1 (should be locked from Test 3)
2. Lock installment 3 (should be locked from Test 5)
3. Verify that:
   - Only installment 2 remains editable
   - Installments 1 and 3 are locked with orange styling
   - Save button works correctly

**Expected Result**: ✅ Multiple installments can be locked independently

### Test 8: WebView Compatibility
**Objective**: Verify that popup works correctly in mobile WebView

**Steps**:
1. Open the application in a mobile browser or WebView
2. Perform Test 2 (popup trigger) on mobile
3. Verify that:
   - Popup is responsive and fits mobile screen
   - Touch interactions work correctly
   - Buttons are properly sized for touch

**Expected Result**: ✅ Popup works correctly on mobile devices

## Automated Testing

### Run Unit Tests
```bash
# Run the automated test script
node test-installment-locking.js
```

### Browser Console Testing
Open browser developer tools and run these commands:

```javascript
// Test 1: Verify checkbox elements exist
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
  console.log(`Checkbox ${index + 1}:`, checkbox.checked);
});

// Test 2: Verify popup modal exists
const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
console.log('Modal exists:', !!modal);

// Test 3: Verify locked inputs are disabled
const disabledInputs = document.querySelectorAll('input:disabled, select:disabled');
console.log('Disabled inputs count:', disabledInputs.length);
```

## Error Scenarios to Test

### Test 9: Edge Cases
**Objective**: Verify behavior in edge cases

**Steps**:
1. Try to lock an installment when network is disconnected
2. Try to lock an installment with invalid data
3. Try to edit a locked installment directly via browser dev tools

**Expected Result**: ✅ Appropriate error handling and security measures

## Performance Testing

### Test 10: Large Dataset Performance
**Objective**: Verify performance with many requests

**Steps**:
1. Create multiple Ultimate Package requests (10+)
2. Navigate between requests quickly
3. Lock/unlock installments rapidly
4. Monitor browser performance

**Expected Result**: ✅ No performance degradation

## Rollback Testing

### Test 11: Reversibility
**Objective**: Verify that changes can be easily rolled back

**Steps**:
1. Note the current state of all files modified
2. Verify that the feature can be disabled by removing the checkbox UI
3. Confirm that database schema changes are backward compatible

**Expected Result**: ✅ Changes are easily reversible

## Browser Compatibility

### Test 12: Cross-Browser Testing
**Objective**: Verify functionality across different browsers

**Test on**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Expected Result**: ✅ Consistent behavior across all browsers

## Success Criteria

All tests must pass for the feature to be considered successfully implemented:

✅ **Checkbox appears under each installment**
✅ **Popup triggers correctly when checkbox is clicked**
✅ **Confirming locks the installment**
✅ **Cancel does not lock the installment**
✅ **Locked installments cannot be edited**
✅ **Database updates include locking state**
✅ **Secretary panel has identical functionality**
✅ **WebView compatibility confirmed**
✅ **Performance is acceptable**
✅ **Rollback is possible**

## Troubleshooting

### Common Issues

1. **Checkbox not appearing**: Verify that the component is receiving the correct props
2. **Popup not showing**: Check browser console for JavaScript errors
3. **Locking not persisting**: Verify database connection and API calls
4. **Styling issues**: Check that Tailwind CSS classes are properly applied

### Debug Commands

```bash
# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint

# Build and verify
npm run build
```

## Conclusion

This testing guide ensures that the installment locking functionality works correctly across all scenarios and platforms. The feature provides admins with the ability to lock individual installments with proper confirmation, while maintaining all existing functionality.
