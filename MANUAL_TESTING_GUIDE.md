# Manual Testing Guide - Pilates Calendar Fixes

## Overview
This guide provides step-by-step instructions for manually testing the Pilates Calendar fixes implemented:

1. **Previous Button Fix**: Navigation now works with 2-week increments in both Admin and User panels
2. **Info Button**: Blue "Info" button appears in green cells with bookings ≥ 1 in Admin panel
3. **Info Panel**: Shows list of users booked in a slot with real-time updates

## Test Environment Setup

### Prerequisites
- Access to staging environment
- Admin user account with pilates schedule management permissions
- Regular user account with active pilates deposit
- At least one pilates slot with existing bookings

### Test Data Requirements
- Create pilates slots for multiple weeks (current + next + previous)
- Create bookings in some slots to test info button functionality
- Ensure slots have different occupancy levels (0/4, 1/4, 2/4, 3/4, 4/4)

## Test Cases

### 1. Previous Button Navigation (User Panel)

#### Test Steps:
1. **Login as regular user**
   - Navigate to Pilates Calendar page
   - Verify initial view shows current 2-week period

2. **Test Previous Navigation**
   - Click "Previous" button
   - Verify calendar moves back by exactly 14 days
   - Verify data loads correctly for previous period
   - Verify slot availability matches expected data

3. **Test Multiple Previous Clicks**
   - Click "Previous" button multiple times (3-4 times)
   - Verify each click moves exactly 14 days backward
   - Verify no data drift or inconsistencies
   - Verify all slots load correctly

4. **Test Previous + Next Navigation**
   - Navigate back 2 periods using Previous button
   - Navigate forward 2 periods using Next button
   - Verify you return to original starting point
   - Verify data consistency

#### Expected Results:
- ✅ Previous button works (no longer disabled)
- ✅ Each click moves exactly 14 days backward
- ✅ Data loads correctly for all periods
- ✅ No console errors or UI glitches

### 2. Previous Button Navigation (Admin Panel)

#### Test Steps:
1. **Login as admin user**
   - Navigate to Admin Panel → Pilates Schedule tab
   - Verify initial view shows current 2-week period

2. **Test Previous Navigation**
   - Click "← Προηγούμενη" button
   - Verify calendar moves back by exactly 14 days
   - Verify schedule grid loads correctly
   - Verify occupancy data displays correctly

3. **Test Schedule Management in Previous Weeks**
   - Navigate to a previous week
   - Toggle some slots on/off
   - Save the schedule
   - Verify changes persist
   - Navigate back to current week and verify changes remain

#### Expected Results:
- ✅ Previous button works in admin panel
- ✅ Schedule management works in previous weeks
- ✅ Changes persist across navigation
- ✅ Occupancy data updates correctly

### 3. Info Button Visibility (Admin Panel)

#### Test Steps:
1. **Setup Test Data**
   - Ensure you have slots with different occupancy levels:
     - 0/4 bookings (should NOT show info button)
     - 1/4 bookings (should show info button)
     - 2/4 bookings (should show info button)
     - 3/4 bookings (should show info button)
     - 4/4 bookings (should NOT show info button)

2. **Test Info Button Visibility**
   - Navigate to Admin Panel → Pilates Schedule
   - Verify info button (blue "i") appears only in green cells with bookings
   - Verify info button does NOT appear in:
     - Red cells (inactive slots)
     - Green cells with 0 bookings
     - Red cells that are full (4/4)

3. **Test Info Button Styling**
   - Verify info button is small blue circle
   - Verify it's positioned in top-right corner of slot
   - Verify hover effects work correctly

#### Expected Results:
- ✅ Info button appears only when appropriate (green + bookings ≥ 1 + not full)
- ✅ Info button styling is correct
- ✅ Info button positioning is correct

### 4. Info Panel Functionality

#### Test Steps:
1. **Open Info Panel**
   - Click on a blue "i" button in a slot with bookings
   - Verify panel opens below the calendar
   - Verify panel shows correct slot information (date/time)

2. **Verify Booking List**
   - Verify all booked users are listed
   - Verify user information is complete (name, email)
   - Verify booking dates are displayed
   - Verify list is scrollable if many bookings

3. **Test Panel Interactions**
   - Click the "X" button to close panel
   - Verify panel closes correctly
   - Re-open panel by clicking info button again

#### Expected Results:
- ✅ Panel opens correctly below calendar
- ✅ All booked users are listed accurately
- ✅ User information is complete and correct
- ✅ Panel can be opened/closed multiple times

### 5. Real-time Updates

#### Test Steps:
1. **Setup Real-time Test**
   - Open info panel for a slot with bookings
   - Keep panel open while testing

2. **Create New Booking**
   - Login as different user in another browser/tab
   - Book the same slot that has info panel open
   - Verify info panel updates automatically
   - Verify new user appears in list without page refresh

3. **Cancel Booking**
   - Cancel a booking for the slot with open info panel
   - Verify user disappears from list automatically
   - Verify no page refresh required

4. **Test Multiple Changes**
   - Make multiple booking changes
   - Verify all changes reflect in real-time
   - Verify no performance issues

#### Expected Results:
- ✅ Info panel updates automatically when bookings change
- ✅ No page refresh required for updates
- ✅ Real-time updates work reliably
- ✅ No performance degradation

### 6. Integration Testing

#### Test Steps:
1. **Cross-Panel Consistency**
   - Navigate to same week in both Admin and User panels
   - Verify both show same 2-week period
   - Verify data consistency between panels

2. **Navigation Consistency**
   - Navigate forward/backward in both panels
   - Verify both panels stay synchronized
   - Verify URL parameters (if used) are consistent

3. **Data Consistency**
   - Make changes in Admin panel (toggle slots)
   - Verify changes appear in User panel
   - Create bookings in User panel
   - Verify bookings appear in Admin panel info

#### Expected Results:
- ✅ Both panels show consistent data
- ✅ Navigation stays synchronized
- ✅ Changes in one panel reflect in the other

### 7. Error Handling

#### Test Steps:
1. **Network Error Simulation**
   - Disconnect internet while navigating
   - Verify graceful error handling
   - Reconnect and verify recovery

2. **Invalid Data Handling**
   - Test with corrupted slot data
   - Verify app doesn't crash
   - Verify error messages are user-friendly

3. **Concurrent User Testing**
   - Multiple users navigating simultaneously
   - Multiple users making bookings
   - Verify no race conditions or data conflicts

#### Expected Results:
- ✅ Graceful error handling
- ✅ User-friendly error messages
- ✅ No crashes or data corruption
- ✅ No race conditions

## Performance Testing

### Load Testing
- Test with large number of slots (full month)
- Test with many concurrent users
- Test navigation speed with large datasets

### Memory Testing
- Navigate through many weeks repeatedly
- Open/close info panels many times
- Verify no memory leaks

## Accessibility Testing

### Keyboard Navigation
- Test all buttons are keyboard accessible
- Test tab order is logical
- Test screen reader compatibility

### Visual Accessibility
- Test color contrast ratios
- Test with high contrast mode
- Test with zoomed in interface

## Browser Compatibility

### Tested Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing
- Test on mobile devices
- Test touch interactions
- Test responsive design

## Rollback Testing

### Rollback Procedure
1. Revert code changes
2. Deploy previous version
3. Verify all functionality returns to original state
4. Verify no data loss occurred

## Test Results Template

```
Test Case: [Name]
Date: [Date]
Tester: [Name]
Environment: [Staging/Production]

Results:
- ✅ Pass
- ❌ Fail
- ⚠️ Partial Pass

Issues Found:
[Describe any issues]

Screenshots:
[Attach screenshots if issues found]

Notes:
[Additional notes]
```

## Sign-off Criteria

All tests must pass before production deployment:
- ✅ Previous button works in both panels
- ✅ Info button appears correctly
- ✅ Info panel functions properly
- ✅ Real-time updates work
- ✅ No regressions in existing functionality
- ✅ Performance is acceptable
- ✅ No console errors
- ✅ Cross-browser compatibility
- ✅ Mobile compatibility
