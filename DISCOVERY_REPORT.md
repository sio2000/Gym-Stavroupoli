# Discovery Report: Weekly Pilates Deposit Refill Feature

## Executive Summary

Αυτή η αναφορά περιγράφει τα ευρεθέντα στοιχεία του codebase για την υλοποίηση του weekly Pilates deposit refill feature για Ultimate (500€) και Ultimate Medium (400€) packages.

## Key Findings

### 1. Subscription Packages Structure

**Ultimate Package:**
- **Name**: "Ultimate" 
- **Price**: 500€ (αλλά σε ορισμένα αρχεία φαίνεται 1200€ για installments)
- **Package Type**: "ultimate"
- **Duration**: 365 days
- **Features**: "3x/week Pilates + Free Gym for 1 year"
- **Duration Type**: "ultimate_1year"

**Ultimate Medium Package:**
- **Name**: "Ultimate Medium"
- **Price**: 400€
- **Package Type**: "ultimate" 
- **Duration**: 365 days
- **Features**: "3x/week Pilates + Free Gym for 1 year"
- **Duration Type**: "ultimate_medium_1year"

### 2. Database Tables Structure

#### Core Tables:
- **`membership_packages`**: Βασικός πίνακας packages
- **`membership_requests`**: Αιτήματα συνδρομών
- **`memberships`**: Ενεργές συνδρομές
- **`pilates_deposits`**: Pilates deposit storage
- **`membership_package_durations`**: Δυναμικές τιμές packages

#### Key Columns:
- **`memberships.start_date`**: Activation date (DATE)
- **`memberships.end_date`**: Expiration date (DATE) 
- **`memberships.is_active`**: Active status (BOOLEAN)
- **`memberships.source_request_id`**: Link to original request
- **`memberships.source_package_name`**: "Ultimate" or "Ultimate Medium"
- **`pilates_deposits.deposit_remaining`**: Current deposit balance
- **`pilates_deposits.credited_at`**: When deposit was credited
- **`pilates_deposits.expires_at`**: When deposit expires
- **`pilates_deposits.is_active`**: Deposit active status

### 3. Activation Flow Analysis

#### Current Ultimate Activation Process:
1. **Request Creation**: User creates membership request for Ultimate/Ultimate Medium
2. **Admin Approval**: `approveUltimateMembershipRequest()` in `src/utils/membershipApi.ts`
3. **Dual Membership Creation**: `create_ultimate_dual_memberships()` function creates:
   - Pilates membership (365 days)
   - Free Gym membership (365 days)
4. **Membership Storage**: Stored in `memberships` table with `source_package_name` tracking

#### Critical Finding: **NO PILATES DEPOSIT CREDITING**
Το Ultimate activation **ΔΕΝ** δημιουργεί Pilates deposits! Δημιουργεί μόνο memberships. Αυτό σημαίνει ότι:
- Οι Ultimate users δεν έχουν Pilates deposits
- Το Pilates deposit system λειτουργεί ξεχωριστά
- Χρειάζεται να προστεθεί Pilates deposit crediting στο Ultimate activation

### 4. Pilates Deposit System

#### Current Structure:
- **Table**: `pilates_deposits`
- **Function**: `credit_pilates_deposit()` για crediting
- **Function**: `get_active_pilates_deposit()` για retrieval
- **Function**: `book_pilates_class()` για consumption

#### Deposit Logic:
- Deposits έχουν `expires_at` timestamp
- Deposits έχουν `is_active` status
- Deposits μπορούν να expire automatically
- Υπάρχει `check_and_expire_pilates_deposits()` function

### 5. Scheduling System Analysis

#### Current Scheduling:
- **pg_cron Extension**: Δεν είναι διαθέσιμο στο Supabase
- **Manual Functions**: Υπάρχουν manual expiration functions
- **No Automatic Jobs**: Δεν υπάρχει automatic scheduling system

#### Existing Manual Functions:
- `expire_memberships()`: Manual membership expiration
- `check_and_expire_pilates_deposits()`: Manual Pilates deposit expiration
- `manual_expire_memberships()`: Frontend-callable expiration

### 6. Files and Functions Identified

#### Database Functions:
- `create_ultimate_dual_memberships()`: Ultimate activation
- `credit_pilates_deposit()`: Pilates deposit crediting
- `get_active_pilates_deposit()`: Get user's active deposit
- `book_pilates_class()`: Consume Pilates deposit
- `check_and_expire_pilates_deposits()`: Expire old deposits

#### Frontend Files:
- `src/utils/membershipApi.ts`: Membership management
- `src/utils/pilatesScheduleApi.ts`: Pilates booking
- `src/pages/AdminPanel.tsx`: Admin interface
- `src/pages/SecretaryDashboard.tsx`: Secretary interface

#### Database Files:
- `database/ADD_ULTIMATE_DUAL_ACTIVATION.sql`: Ultimate activation system
- `database/20250922_create_pilates_deposits_up.sql`: Pilates deposit system
- `database/20250922_credit_pilates_deposit_fn.sql`: Deposit crediting function

## Implementation Requirements

### 1. Missing Components:
- **Pilates Deposit Crediting**: Ultimate activation δεν δημιουργεί deposits
- **Weekly Refill Logic**: Δεν υπάρχει weekly refill mechanism
- **Scheduling System**: Δεν υπάρχει automatic job runner
- **Audit Logging**: Δεν υπάρχει refill audit trail

### 2. Required Changes:
1. **Modify Ultimate Activation**: Προσθήκη Pilates deposit crediting
2. **Create Weekly Refill Job**: Scheduled job για weekly top-ups
3. **Add Refill Tracking**: Table/columns για refill timestamps
4. **Implement Feature Flag**: Toggle για enabling/disabling refills
5. **Add Audit Logging**: Log όλων των refill operations

### 3. Safety Considerations:
- **Idempotent Updates**: Χρήση `GREATEST(current, target)` για top-ups
- **Transaction Safety**: Atomic updates με database transactions
- **Feature Flag**: Ability to disable χωρίς code rollback
- **Rollback Plan**: Safe rollback mechanism

## Next Steps

1. **Create Migration Scripts**: Weekly refill table και columns
2. **Modify Ultimate Activation**: Προσθήκη Pilates deposit crediting
3. **Implement Weekly Job**: Scheduled refill logic
4. **Add Feature Flag**: Toggle mechanism
5. **Create Tests**: Unit και integration tests
6. **Add Monitoring**: Audit logs και error handling

## Uncertainties Identified

1. **Ultimate Package Prices**: Φαίνεται να υπάρχει inconsistency (500€ vs 1200€)
2. **Pilates Deposit Amounts**: Δεν είναι σαφές πόσα deposits δημιουργούνται
3. **Scheduling Infrastructure**: Πώς θα τρέχει το weekly job στο Supabase
4. **Existing Ultimate Users**: Πώς θα handle users που έχουν ήδη Ultimate χωρίς deposits

## Recommendations

1. **Verify Package Prices**: Επιβεβαίωση των ακριβών τιμών Ultimate packages
2. **Define Deposit Amounts**: Προσδιορισμός των αρχικών Pilates deposits
3. **Choose Scheduling Method**: Supabase Edge Functions ή external cron
4. **Plan Migration Strategy**: Πώς να handle existing Ultimate users
