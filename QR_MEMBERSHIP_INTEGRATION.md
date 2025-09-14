# QR Code Membership Integration

## Overview

This implementation ensures that QR code generation options are only displayed for packages where the user has an **active and approved** membership subscription.

## How It Works

### 1. Database Schema

The system uses the following tables:
- `memberships` - Stores user subscription data
- `membership_packages` - Stores package information
- `qr_codes` - Stores generated QR codes

### 2. Key Components

#### `src/utils/activeMemberships.ts`
- **`getUserActiveMembershipsForQR(userId)`** - Fetches user's active memberships
- **`getAvailableQRCategories(userId)`** - Returns QR categories available for user
- **`hasActiveMembershipForPackage(userId, packageType)`** - Checks specific package membership

#### `src/pages/QRCodes.tsx`
- **Dynamic QR Generation** - Only shows options for active memberships
- **Real-time Updates** - Refreshes when memberships change
- **User-friendly Messages** - Shows helpful messages when no active memberships

### 3. Package Type Mapping

```typescript
const PACKAGE_TYPE_TO_QR_CATEGORY = {
  'free_gym': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️' },
  'pilates': { key: 'pilates', label: 'Pilates', icon: '🧘' },
  'personal_training': { key: 'personal', label: 'Personal Training', icon: '🥊' }
};
```

### 4. User Experience

#### When User Has Active Memberships:
- Shows QR generation buttons for each active package
- Each button displays package icon, name, and "Create QR Code" text
- Hover effects and proper styling

#### When User Has No Active Memberships:
- Shows informative message: "Δεν έχετε ενεργά πακέτα"
- Provides link to membership page
- Explains that active subscriptions are required

#### Loading States:
- Shows loading spinner while fetching membership data
- Prevents interaction during loading
- Graceful error handling

### 5. Technical Implementation

#### Membership Query
```sql
SELECT m.id, m.package_id, m.status, m.start_date, m.end_date,
       mp.name, mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = ? 
  AND m.status = 'active'
  AND m.end_date >= CURRENT_DATE
```

#### Real-time Updates
- Categories refresh after QR code generation
- Manual refresh button updates both QR codes and categories
- Automatic refresh when user changes

### 6. Security & Validation

- **RLS Policies** - Users can only see their own memberships
- **Status Validation** - Only 'active' memberships are considered
- **Date Validation** - Only non-expired memberships are valid
- **Package Type Filtering** - Only supported package types are shown

### 7. Future Extensibility

#### Adding New Package Types:
1. Add package type to `membership_packages` table
2. Add mapping in `PACKAGE_TYPE_TO_QR_CATEGORY`
3. Update QR generation logic if needed

#### Adding New QR Categories:
1. Update `QRCodeCategory` interface
2. Add category to `generateQRCode` function
3. Update UI components

### 8. Testing

#### Manual Testing:
1. **No Memberships** - Should show "no active packages" message
2. **Single Membership** - Should show one QR generation option
3. **Multiple Memberships** - Should show multiple options
4. **Expired Membership** - Should not show expired package options
5. **Mixed Status** - Should only show active, non-expired options

#### Database Testing:
Run `database/TEST_QR_MEMBERSHIP_INTEGRATION.sql` to verify:
- Active memberships exist
- Package types are correct
- Query returns expected results

### 9. Error Handling

- **Network Errors** - Graceful fallback, shows empty state
- **Database Errors** - Logs errors, shows user-friendly message
- **Invalid Data** - Filters out invalid memberships
- **Missing Packages** - Handles missing package data

### 10. Performance Considerations

- **Efficient Queries** - Single query with JOIN
- **Caching** - Categories cached in component state
- **Lazy Loading** - Only loads when needed
- **Minimal Re-renders** - Optimized state updates

## Benefits

1. **Security** - Users can only generate QR codes for packages they own
2. **User Experience** - Clear indication of available options
3. **Data Integrity** - Prevents invalid QR code generation
4. **Scalability** - Easy to add new package types
5. **Maintainability** - Clean separation of concerns

## Migration Notes

- **Backward Compatible** - Existing QR codes continue to work
- **No Breaking Changes** - All existing functionality preserved
- **Database Safe** - Only reads data, no schema changes required
- **Progressive Enhancement** - Graceful degradation if data unavailable
