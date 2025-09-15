# Referral System Implementation

## Overview
This implementation adds a complete referral system to the FreeGym app, allowing users to share referral codes and earn points when new users sign up using their codes.

## Features Implemented

### 1. Database Schema
- **user_referral_points**: Stores referral points for each user (separate from kettlebell points)
- **referral_transactions**: Tracks all referral transactions and point awards
- **Database functions**: For processing referrals and managing points

### 2. Backend Services
- **referralService.ts**: Complete API service for referral operations
- **Database functions**: 
  - `get_user_referral_code()`: Gets or creates referral code for user
  - `get_user_referral_points()`: Gets user's total referral points
  - `process_referral_signup()`: Processes referral and awards points
  - `ensure_user_referral_code()`: Ensures user has a referral code

### 3. Frontend Integration
- **Referral Page**: Updated to show real referral points
- **Registration Forms**: Added referral code input field
- **AuthContext**: Updated to load referral points
- **User Type**: Added referralPoints field

## Database Tables

### user_referral_points
```sql
CREATE TABLE user_referral_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### referral_transactions
```sql
CREATE TABLE referral_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 10,
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'referral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## How It Works

### 1. User Gets Referral Code
- When user logs in, system ensures they have a referral code
- Code is generated automatically if not exists
- Code is displayed in Referral page and Profile page

### 2. User Shares Referral Code
- User can copy or share their referral code
- Share functionality works on mobile and desktop
- Code is included in share URLs

### 3. New User Signs Up with Referral Code
- Registration form includes optional referral code field
- When user submits registration with referral code:
  - System validates the referral code
  - If valid, awards 10 points to referrer
  - Records transaction in database
  - Shows success/error message

### 4. Points Management
- Points are stored separately from kettlebell points
- Each successful referral awards 10 points
- Points are permanent and tied to user account
- Points are displayed in Referral page

## Installation Steps

### 1. Apply Database Schema
```bash
node apply_referral_points_system.js
```

### 2. Test the System
```bash
node test_referral_system.js
```

### 3. Verify in App
- Login to app
- Go to /referral page
- Check if referral code is displayed
- Test sharing functionality

## API Functions

### getUserReferralCode(userId)
Gets or creates referral code for user.

### getUserReferralPoints(userId)
Gets user's total referral points.

### processReferralSignup(referredUserId, referralCode)
Processes referral signup and awards points.

### getUserReferralStats(userId)
Gets user's referral statistics.

## Security Features

- **RLS Policies**: Users can only see their own referral data
- **Input Validation**: Referral codes are validated before processing
- **Error Handling**: Graceful error handling for invalid codes
- **Transaction Safety**: Database transactions ensure data consistency

## Edge Cases Handled

1. **Invalid Referral Code**: Shows error message, doesn't fail registration
2. **Self-Referral**: Prevents users from referring themselves
3. **Missing Referral Code**: System generates one automatically
4. **Database Errors**: Graceful fallback, doesn't break registration
5. **Network Errors**: Proper error messages to user

## Testing

The system includes comprehensive testing:
- Database table creation
- Function availability
- Referral code generation
- Points calculation
- Error handling

## Files Modified

### New Files
- `database/create_referral_points_system.sql`
- `src/services/referralService.ts`
- `apply_referral_points_system.js`
- `test_referral_system.js`

### Modified Files
- `src/types/index.ts` - Added referralPoints field
- `src/contexts/AuthContext.tsx` - Added referral points loading
- `src/pages/Referral.tsx` - Connected to backend
- `src/pages/PublicRegistration.tsx` - Added referral code field

## Points System

- **Award Amount**: 10 points per successful referral
- **Storage**: Separate table from kettlebell points
- **Persistence**: Permanent storage in database
- **Display**: Shown in Referral page and Profile
- **Transactions**: All point awards are tracked

## Future Enhancements

- Referral leaderboard
- Different point amounts for different actions
- Referral analytics
- Email notifications for point awards
- Referral rewards/prizes system

## Troubleshooting

### Common Issues

1. **Referral code not generated**: Check if user_profiles table has referral_code column
2. **Points not showing**: Verify user_referral_points table exists
3. **Registration fails**: Check if referral processing is optional (it should be)
4. **Database errors**: Run the test script to verify setup

### Debug Steps

1. Run `node test_referral_system.js`
2. Check browser console for errors
3. Verify database tables exist
4. Check RLS policies are correct
5. Test with different user accounts

## Support

For issues or questions about the referral system, check:
1. Database logs in Supabase
2. Browser console errors
3. Test script output
4. Network requests in browser dev tools
