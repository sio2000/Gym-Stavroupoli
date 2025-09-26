# Group Training Calendar Implementation

## Overview

This document describes the implementation of the Group Training Calendar feature for the Admin Panel. The feature allows administrators to view and manage group training sessions in a calendar interface within the Personal Training section.

## Features Implemented

### ✅ Core Features
- **Calendar View**: Monthly calendar display of group training sessions
- **Session Details**: Click on events to view detailed session information
- **Capacity Management**: Visual indicators for session capacity (X/Y format)
- **Session Cancellation**: Admin ability to cancel sessions
- **Responsive Design**: Mobile and desktop compatible
- **Real-time Updates**: Calendar refreshes when sessions are created/updated

### ✅ Technical Features
- **Feature Flag**: Safe rollout with `groupCalendarEnabled` flag
- **API Integration**: Dedicated API for calendar data
- **Error Handling**: Graceful handling of API failures
- **Type Safety**: Full TypeScript implementation
- **Testing**: Comprehensive unit, integration, and E2E tests

## File Structure

```
src/
├── utils/
│   └── groupTrainingCalendarApi.ts          # API functions for calendar data
├── components/admin/
│   └── GroupTrainingCalendar.tsx             # Main calendar component
├── pages/
│   └── AdminPanel.tsx                       # Integration point
├── __tests__/
│   ├── groupTrainingCalendar.test.ts        # API unit tests
│   └── components/
│       └── GroupTrainingCalendar.test.tsx   # Component tests
└── cypress/e2e/
    └── group_training_calendar_spec.js      # E2E tests
```

## Database Schema

The feature uses the existing `group_sessions` table:

```sql
CREATE TABLE group_sessions (
    id UUID PRIMARY KEY,
    program_id UUID REFERENCES personal_training_schedules(id),
    user_id UUID REFERENCES user_profiles(user_id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trainer VARCHAR(255) NOT NULL,
    room VARCHAR(255) NOT NULL,
    group_type INTEGER DEFAULT 3,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### `getGroupTrainingCalendarEvents(startDate, endDate)`
- **Purpose**: Fetch group sessions for calendar display
- **Parameters**: 
  - `startDate`: Start date in YYYY-MM-DD format
  - `endDate`: End date in YYYY-MM-DD format
- **Returns**: Array of calendar events with participant details
- **Features**: Groups sessions by date/time/trainer/room, includes capacity info

### `getGroupTrainingSessionDetails(sessionId)`
- **Purpose**: Get detailed information for a specific session
- **Parameters**: `sessionId`: UUID of the session
- **Returns**: Complete session details with participants
- **Features**: Used for modal display

### `cancelGroupTrainingSession(sessionId)`
- **Purpose**: Cancel a group training session
- **Parameters**: `sessionId`: UUID of the session
- **Returns**: Success/error status
- **Features**: Sets `is_active` to false

## Component Architecture

### GroupTrainingCalendar Component

```typescript
interface GroupTrainingCalendarProps {
  featureEnabled?: boolean;
}
```

**Key Features:**
- Monthly calendar grid
- Event display with capacity indicators
- Session details modal
- Navigation controls (prev/next/today)
- Responsive design
- Loading states
- Error handling

**Event Display:**
- Time range (HH:MM format)
- Capacity status (X/Y format)
- Trainer and room information
- Color coding based on capacity:
  - Green: Available slots
  - Yellow: Almost full
  - Red: Full

## Integration Points

### Admin Panel Integration

The calendar is integrated into the Personal Training section of the Admin Panel:

```typescript
// Feature flag for safe rollout
const [groupCalendarEnabled] = useState(true);

// Calendar section in Personal Training tab
{groupCalendarEnabled && (
  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg border-2 border-green-200">
    <div className="p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">NEW FEATURE</span>
      </div>
      <GroupTrainingCalendar featureEnabled={groupCalendarEnabled} />
    </div>
  </div>
)}
```

## Testing Strategy

### Unit Tests
- **API Functions**: Test data fetching, error handling, data transformation
- **Component Logic**: Test rendering, user interactions, state management
- **Mocking**: Supabase client, external dependencies

### Integration Tests
- **API Integration**: Test real database queries
- **Component Integration**: Test with real data
- **Error Scenarios**: Test API failures, network issues

### E2E Tests
- **User Journey**: Complete workflow from login to session management
- **Cross-browser**: Chrome, Firefox, Safari
- **Mobile Testing**: Responsive design verification
- **Performance**: Load testing with large datasets

## Deployment Instructions

### 1. Database Setup
Ensure the `group_sessions` table exists with proper indexes:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trainer VARCHAR(255) NOT NULL,
    room VARCHAR(255) NOT NULL,
    group_type INTEGER NOT NULL DEFAULT 3,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_sessions_date ON group_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_group_sessions_active ON group_sessions(is_active) WHERE is_active = true;
```

### 2. Feature Flag Configuration
The feature is controlled by the `groupCalendarEnabled` flag in `AdminPanel.tsx`:

```typescript
// Enable/disable the feature
const [groupCalendarEnabled] = useState(true); // Set to false to disable
```

### 3. Environment Variables
No additional environment variables required. Uses existing Supabase configuration.

### 4. Build and Deploy
```bash
# Install dependencies
npm install

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build

# Deploy
npm run deploy
```

## Usage Guide

### For Administrators

1. **Accessing the Calendar**
   - Navigate to Admin Panel
   - Click on "Personal Training" tab
   - Scroll down to "Group Training Calendar" section

2. **Viewing Sessions**
   - Calendar displays current month by default
   - Sessions appear as colored blocks on their respective dates
   - Color indicates capacity status (green=available, yellow=almost full, red=full)

3. **Session Details**
   - Click on any session to view details
   - Modal shows: date, time, room, trainer, participants, capacity
   - View participant list with names and emails

4. **Managing Sessions**
   - Cancel sessions using the "Cancel Session" button
   - Confirmation required for cancellation
   - Calendar updates automatically after changes

5. **Navigation**
   - Use arrow buttons to navigate between months
   - Click "Today" to return to current month
   - Calendar is responsive for mobile devices

## Troubleshooting

### Common Issues

1. **Calendar Not Loading**
   - Check feature flag is enabled
   - Verify database connection
   - Check browser console for errors

2. **Sessions Not Displaying**
   - Verify `group_sessions` table has data
   - Check date range in API calls
   - Verify RLS policies allow admin access

3. **Performance Issues**
   - Check database indexes are created
   - Monitor API response times
   - Consider pagination for large datasets

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'GroupTrainingCalendar:*');
```

## Security Considerations

- **RLS Policies**: Proper row-level security for data access
- **Admin Only**: Feature restricted to admin users
- **Input Validation**: All API inputs validated
- **Error Handling**: No sensitive data in error messages

## Performance Optimization

- **Database Indexes**: Optimized queries with proper indexes
- **Caching**: Component-level caching for repeated requests
- **Lazy Loading**: Events loaded only when needed
- **Responsive Images**: Optimized for mobile devices

## Future Enhancements

- **Bulk Operations**: Select multiple sessions for batch operations
- **Export Functionality**: Export calendar data to CSV/PDF
- **Advanced Filtering**: Filter by trainer, room, or capacity
- **Drag & Drop**: Reschedule sessions by dragging
- **Recurring Sessions**: Support for recurring session patterns

## Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review the test files for expected behavior
- Contact the development team for advanced issues

## Changelog

### Version 1.0.0 (Initial Release)
- ✅ Basic calendar display
- ✅ Session details modal
- ✅ Capacity management
- ✅ Session cancellation
- ✅ Responsive design
- ✅ Feature flag implementation
- ✅ Comprehensive testing
- ✅ Documentation
