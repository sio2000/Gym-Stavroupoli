/**
 * SUBSCRIPTION AUDIT - CONFIGURATION & UTILITIES
 */

export const AUDIT_CONFIG = {
  // Time checkpoints (days from start)
  timeCheckpoints: {
    T0: 0,    // Start (2026-01-31)
    T1: 15,   // Mid-subscription
    T2: 30,   // Refill boundary
    T3: 31,   // Past refill / expiration boundary
    T4: 60,   // Long-term
    T5: 90    // Final validation
  },

  // Subscription types and their properties
  subscriptionTypes: {
    pilates: {
      name: 'Pilates',
      refill_cycle_days: 30,
      refill_credits: 8,
      duration_days: 30
    },
    free_gym: {
      name: 'Open Gym',
      refill_cycle_days: null, // No refill
      duration_days: 30
    },
    ultimate: {
      name: 'Ultimate',
      refill_cycle_days: 30,
      refill_credits: 3,
      duration_days: 30
    },
    ultimate_medium: {
      name: 'Ultimate Medium',
      refill_cycle_days: 30,
      refill_credits: 1,
      duration_days: 30
    }
  },

  // Bug severity levels
  severityLevels: {
    CRITICAL: 'Membership shows as active after expiration',
    HIGH: 'Refill does not occur at expected time',
    MEDIUM: 'Status transition delayed',
    LOW: 'Minor date display issue'
  }
};

/**
 * Test data scenarios
 */
export const TEST_SCENARIOS = {
  // Scenario 1: Edge case - subscription expires today
  expiresT oday: {
    description: 'Subscription expires today at start',
    expectedBehavior: {
      T0: 'Should be ACTIVE (end_date >= today)',
      T1: 'Should be EXPIRED (end_date < today)'
    }
  },

  // Scenario 2: Edge case - subscription expires tomorrow
  expiresTomorrow: {
    description: 'Subscription expires tomorrow',
    expectedBehavior: {
      T0: 'Should be ACTIVE',
      T1: 'Should be EXPIRED'
    }
  },

  // Scenario 3: Long-term subscription
  longTerm: {
    description: 'Subscription spans 60+ days',
    expectedBehavior: {
      T0: 'ACTIVE',
      T2: 'ACTIVE (refill at 30 days)',
      T3: 'ACTIVE',
      T4: 'EXPIRED (end_date passed)',
      T5: 'EXPIRED'
    }
  },

  // Scenario 4: Back-to-back subscriptions
  backToBack: {
    description: 'Two subscriptions in succession',
    expectedBehavior: {
      'At boundary': 'Old subscription EXPIRED, new subscription ACTIVE'
    }
  },

  // Scenario 5: Multiple active subscriptions (should not happen)
  multipleActive: {
    description: 'User has multiple concurrent active subscriptions',
    expectedBehavior: {
      'Should occur': 'Only if user purchased multiple packages',
      'Each should': 'Have independent expiration'
    }
  }
};

/**
 * Expected status matrix
 */
export const STATUS_MATRIX = {
  // [current_date vs end_date] → [expected_is_active, expected_status]
  'before_start': [false, 'pending'],
  'during_active': [true, 'active'],
  'on_end_date': [true, 'active'], // Inclusive
  'after_end_date': [false, 'expired'],
  'no_subscription': [false, 'none']
};

/**
 * QR Code access rules
 */
export const QR_ACCESS_RULES = {
  requires_active_membership: true,
  requires_valid_deposit: false, // Can depend on package
  allows_expired: false,
  timezone_aware: true
};

/**
 * Booking rules
 */
export const BOOKING_RULES = {
  requires_active_membership: true,
  requires_available_credits: false, // Depends on package
  allows_future_booking: true,
  max_advance_booking_days: 30,
  refund_on_cancellation: true
};

/**
 * Deposit refill rules (Pilates/Ultimate)
 */
export const DEPOSIT_REFILL_RULES = {
  refill_interval_days: 30,
  refill_on_subscription_start: true,
  refill_on_subscription_renew: true,
  no_refill_after_expiration: true,
  refill_should_happen_once_per_cycle: true
};
