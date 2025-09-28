# Users-Information Tab Test Checklist

## Overview
This checklist covers testing the new "Χρήστες-Πληροφορίες" (Users-Information) tab in the Admin Panel.

## Test Scenarios

### 1. Tab Navigation
- [ ] Navigate to Admin Panel
- [ ] Verify "Χρήστες-Πληροφορίες" tab appears after "Ταμείο" tab
- [ ] Click on the tab and verify it loads correctly
- [ ] Verify tab icon (Users icon) displays correctly

### 2. Random Users List (Default View)
- [ ] Verify 10 users are displayed by default
- [ ] Verify pagination controls appear if more than 10 users exist
- [ ] Test "Previous" button (should be disabled on first page)
- [ ] Test "Next" button (should be disabled on last page)
- [ ] Verify page indicator shows correct page numbers
- [ ] Test refresh button functionality

### 3. Search Functionality
- [ ] Enter a user's first name in search box
- [ ] Verify search results appear instantly
- [ ] Enter a user's last name in search box
- [ ] Enter a user's email in search box
- [ ] Enter a user's ID in search box
- [ ] Test partial name/email matches
- [ ] Clear search and verify random users list returns
- [ ] Test search with no results

### 4. User Details Modal
- [ ] Click on any user from the list
- [ ] Verify modal opens with user details
- [ ] Test modal close button (X)
- [ ] Test clicking outside modal to close

### 5. Basic Information Section
- [ ] Verify user's full name displays correctly
- [ ] Verify email displays with mail icon
- [ ] Verify phone number displays with phone icon (if available)
- [ ] Verify date of birth displays with calendar icon (if available)
- [ ] Verify address displays with map pin icon (if available)
- [ ] Verify registration date displays with clock icon
- [ ] Verify referral code displays (if available)

### 6. Active Subscriptions Section
- [ ] Verify active subscriptions count
- [ ] Verify subscription package names
- [ ] Verify credits remaining vs total credits
- [ ] Verify start and end dates
- [ ] Verify "Ενεργή" status badge
- [ ] Test with user who has no active subscriptions

### 7. Subscription History Section
- [ ] Verify all subscriptions (active and inactive) are listed
- [ ] Verify different status badges (Ενεργή, expired, etc.)
- [ ] Verify chronological order (newest first)
- [ ] Test with user who has no subscription history

### 8. Payment History Section
- [ ] Verify total paid amount displays prominently
- [ ] Verify individual payment amounts
- [ ] Verify payment methods (if available)
- [ ] Verify transaction IDs (if available)
- [ ] Verify payment dates
- [ ] Verify payment status badges (approved, pending, etc.)
- [ ] Test with user who has no payment history

### 9. Kettlebell Points Section
- [ ] Verify total points display prominently
- [ ] Verify points history (last 10 entries)
- [ ] Verify program IDs (if available)
- [ ] Verify points dates
- [ ] Test with user who has no kettlebell points

### 10. Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify modal is scrollable on small screens
- [ ] Verify all sections are readable on mobile

### 11. Error Handling
- [ ] Test with network disconnected
- [ ] Test with invalid user ID
- [ ] Test with user who has corrupted data
- [ ] Verify error messages are user-friendly

### 12. Performance
- [ ] Verify initial load time is reasonable (< 3 seconds)
- [ ] Verify search response time is fast (< 1 second)
- [ ] Verify user details load time is reasonable (< 2 seconds)
- [ ] Test with large number of users (100+)

### 13. Data Accuracy
- [ ] Verify all displayed data matches database
- [ ] Verify calculations are correct (total paid, points, etc.)
- [ ] Verify date formatting is consistent
- [ ] Verify currency formatting is correct

### 14. Edge Cases
- [ ] Test with user who has special characters in name
- [ ] Test with user who has very long email
- [ ] Test with user who has multiple active subscriptions
- [ ] Test with user who has expired subscriptions
- [ ] Test with user who has cancelled subscriptions

## Expected Results
- All functionality works as described
- UI is consistent with existing Admin Panel design
- Performance is acceptable on all devices
- Error handling is graceful
- Data is accurate and up-to-date

## Notes
- Test with different user roles (admin, secretary)
- Test with different data scenarios
- Verify all database queries are optimized
- Check browser console for any errors
