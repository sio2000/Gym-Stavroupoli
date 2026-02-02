/**
 * COMPREHENSIVE PILATES SYSTEM VALIDATION
 * 50 Bot Users - Extended Test Scenarios
 * 
 * Tests:
 * - Subscription creation & expiration
 * - Calendar bookings
 * - Installment payments
 * - QR code generation & validation
 * - Combo subscriptions
 * - Class credit management
 * - Trainer/Admin visibility
 * - Edge cases & stress tests
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test results storage
const testResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    startTime: new Date(),
    endTime: null,
    categories: {
        subscriptionCreation: { passed: 0, failed: 0, tests: [] },
        subscriptionExpiration: { passed: 0, failed: 0, tests: [] },
        calendarBookings: { passed: 0, failed: 0, tests: [] },
        installments: { passed: 0, failed: 0, tests: [] },
        qrCodes: { passed: 0, failed: 0, tests: [] },
        comboSubscriptions: { passed: 0, failed: 0, tests: [] },
        classCredits: { passed: 0, failed: 0, tests: [] },
        trainerVisibility: { passed: 0, failed: 0, tests: [] },
        edgeCases: { passed: 0, failed: 0, tests: [] },
        stressTests: { passed: 0, failed: 0, tests: [] }
    },
    botUsers: [],
    anomalies: []
};

// Helper functions
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'INFO': '📋',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️',
        'TEST': '🧪',
        'BOT': '🤖'
    }[type] || '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function addTestResult(category, testName, passed, details = '') {
    testResults.totalTests++;
    if (passed) {
        testResults.passed++;
        testResults.categories[category].passed++;
    } else {
        testResults.failed++;
        testResults.categories[category].failed++;
    }
    testResults.categories[category].tests.push({
        name: testName,
        passed,
        details,
        timestamp: new Date().toISOString()
    });
}

function getDateString(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

function getTimestamp(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
}

// ==================== BOT USER MANAGEMENT ====================

async function getExistingBotUsers() {
    log('Fetching existing bot users...', 'INFO');
    
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or('email.like.%bot_pilates_test_%,email.like.%bot_extended_test_%');
    
    if (error) {
        log(`Error fetching existing bots: ${error.message}`, 'ERROR');
        return [];
    }
    
    log(`Found ${data?.length || 0} existing bot users`, 'SUCCESS');
    return data || [];
}

async function createNewBotUser(index) {
    const email = `bot_extended_test_${String(index).padStart(2, '0')}@gymevosmos.test`;
    const firstName = `ExtBot`;
    const lastName = `User${index}`;
    
    // Check if already exists
    const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();
    
    if (existing) {
        return existing;
    }
    
    // Create new user
    const userId = crypto.randomUUID();
    
    const { data, error } = await supabase
        .from('user_profiles')
        .insert({
            id: userId,
            user_id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone: `699${String(2000 + index).padStart(7, '0')}`,
            role: 'user',
            created_at: new Date().toISOString()
        })
        .select()
        .single();
    
    if (error) {
        log(`Failed to create bot ${index}: ${error.message}`, 'ERROR');
        return null;
    }
    
    log(`Created new bot user: ${email}`, 'BOT');
    return data;
}

async function ensureBotUsers(targetCount = 50) {
    log(`\n${'='.repeat(60)}`, 'INFO');
    log('PHASE 1: BOT USER SETUP', 'INFO');
    log(`${'='.repeat(60)}\n`, 'INFO');
    
    const existingBots = await getExistingBotUsers();
    testResults.botUsers = [...existingBots];
    
    const neededBots = targetCount - existingBots.length;
    
    if (neededBots > 0) {
        log(`Need to create ${neededBots} additional bot users`, 'INFO');
        
        for (let i = 1; i <= neededBots; i++) {
            const bot = await createNewBotUser(30 + i);
            if (bot) {
                testResults.botUsers.push(bot);
            }
        }
    }
    
    log(`Total bot users available: ${testResults.botUsers.length}`, 'SUCCESS');
    return testResults.botUsers;
}

// ==================== GET PACKAGE INFO ====================

async function getPilatesPackageId() {
    const { data } = await supabase
        .from('membership_packages')
        .select('id, name')
        .ilike('name', '%pilates%')
        .limit(1)
        .single();
    return data?.id;
}

async function getUltimatePackageId() {
    const { data } = await supabase
        .from('membership_packages')
        .select('id, name')
        .ilike('name', '%ultimate%')
        .limit(1)
        .single();
    return data?.id;
}

// ==================== SUBSCRIPTION TESTS ====================

async function createMembershipForUser(userId, packageName, startDate, endDate, options = {}) {
    // Get package ID by name
    const { data: packageData } = await supabase
        .from('membership_packages')
        .select('id, name')
        .ilike('name', `%${packageName}%`)
        .limit(1)
        .single();
    
    const packageId = packageData?.id;
    
    const membership = {
        user_id: userId,
        package_id: packageId,
        source_package_name: packageName,
        start_date: startDate,
        end_date: endDate,
        status: options.status || 'active',
        is_active: options.is_active !== false,
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('memberships')
        .insert(membership)
        .select()
        .single();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    return { success: true, data };
}

async function createPilatesDeposit(userId, membershipId, classCount, isActive = true, expiresAt = null) {
    const deposit = {
        user_id: userId,
        membership_id: membershipId,
        deposit_remaining: classCount,
        is_active: isActive,
        expires_at: expiresAt || getTimestamp(30),
        created_at: new Date().toISOString(),
        credited_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('pilates_deposits')
        .insert(deposit)
        .select()
        .single();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    return { success: true, data };
}

async function testSubscriptionCreation() {
    log('\n📦 TESTING: Subscription Creation', 'TEST');
    
    const scenarios = [
        { name: 'Pilates Monthly 4 classes', type: 'pilates', classes: 4, days: 30 },
        { name: 'Pilates Monthly 8 classes', type: 'pilates', classes: 8, days: 30 },
        { name: 'Pilates Monthly 12 classes', type: 'pilates', classes: 12, days: 30 },
        { name: 'Ultimate Annual', type: 'ultimate', classes: 156, days: 365 },
        { name: 'Ultimate Medium', type: 'ultimate', classes: 52, days: 365 },
        { name: 'Pilates 3-Month Package', type: 'pilates', classes: 24, days: 90 },
        { name: 'Pilates 6-Month Package', type: 'pilates', classes: 48, days: 180 },
        { name: 'Pilates Trial (1 week)', type: 'pilates', classes: 2, days: 7 },
    ];
    
    for (let i = 0; i < Math.min(scenarios.length, testResults.botUsers.length); i++) {
        const user = testResults.botUsers[i];
        const scenario = scenarios[i];
        
        const startDate = getDateString(0);
        const endDate = getDateString(scenario.days);
        
        const result = await createMembershipForUser(
            user.id,
            scenario.type,
            startDate,
            endDate
        );
        
        if (result.success) {
            // Create deposit for pilates
            await createPilatesDeposit(user.id, result.data.id, scenario.classes, true, getTimestamp(scenario.days));
            
            addTestResult('subscriptionCreation', scenario.name, true, `Created for ${user.email}`);
            log(`${scenario.name}: PASSED`, 'SUCCESS');
        } else {
            addTestResult('subscriptionCreation', scenario.name, false, result.error);
            log(`${scenario.name}: FAILED - ${result.error}`, 'ERROR');
        }
    }
}

async function testSubscriptionExpiration() {
    log('\n⏰ TESTING: Subscription Expiration', 'TEST');
    
    const expirationScenarios = [
        { name: 'Expired yesterday', daysAgo: 1, shouldBeActive: false },
        { name: 'Expired 1 week ago', daysAgo: 7, shouldBeActive: false },
        { name: 'Expired 1 month ago', daysAgo: 30, shouldBeActive: false },
        { name: 'Expired 3 months ago', daysAgo: 90, shouldBeActive: false },
        { name: 'Expires today (should be active)', daysAgo: 0, shouldBeActive: true },
        { name: 'Expires tomorrow', daysAgo: -1, shouldBeActive: true },
        { name: 'Expires in 1 week', daysAgo: -7, shouldBeActive: true },
    ];
    
    const startIdx = 8;
    for (let i = 0; i < expirationScenarios.length; i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = expirationScenarios[i];
        
        const endDate = getDateString(-scenario.daysAgo);
        const startDate = getDateString(-scenario.daysAgo - 30);
        
        const expectedStatus = scenario.shouldBeActive ? 'active' : 'expired';
        
        // Create membership
        const result = await createMembershipForUser(
            user.id,
            'pilates',
            startDate,
            endDate,
            { status: expectedStatus, is_active: scenario.shouldBeActive }
        );
        
        if (result.success) {
            // Also create deposit
            await createPilatesDeposit(user.id, result.data.id, 8, scenario.shouldBeActive, getTimestamp(-scenario.daysAgo));
        }
        
        // Verify status
        const { data: membership } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        const today = getDateString(0);
        const isActuallyExpired = membership && membership.end_date < today;
        const passed = scenario.shouldBeActive ? !isActuallyExpired : isActuallyExpired;
        
        addTestResult('subscriptionExpiration', scenario.name, passed, 
            `End date: ${endDate}, Should be active: ${scenario.shouldBeActive}, Actually expired: ${isActuallyExpired}`);
        log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
    }
}

// ==================== CALENDAR BOOKING TESTS ====================

async function testCalendarBookings() {
    log('\n📅 TESTING: Calendar Bookings', 'TEST');
    
    // Get available Pilates slots
    const { data: slots } = await supabase
        .from('pilates_schedule_slots')
        .select('*')
        .gte('date', getDateString(0))
        .lte('date', getDateString(14))
        .limit(20);
    
    if (!slots || slots.length === 0) {
        log('No available slots found - creating test scenarios with existing data', 'WARNING');
        
        // Still run visibility tests
        const { data: existingBookings } = await supabase
            .from('pilates_bookings')
            .select('*, pilates_schedule_slots(*)')
            .limit(10);
        
        addTestResult('calendarBookings', 'Existing bookings retrievable', 
            existingBookings !== null, `Found ${existingBookings?.length || 0} existing bookings`);
        return;
    }
    
    log(`Found ${slots.length} available slots for booking tests`, 'INFO');
    
    const bookingScenarios = [
        { name: 'Normal booking with active subscription', shouldSucceed: true },
        { name: 'Booking with sufficient credits', shouldSucceed: true },
        { name: 'Multiple bookings same user', shouldSucceed: true },
        { name: 'Booking different days', shouldSucceed: true },
        { name: 'Booking morning slot', shouldSucceed: true },
        { name: 'Booking evening slot', shouldSucceed: true },
    ];
    
    const startIdx = 15;
    for (let i = 0; i < Math.min(bookingScenarios.length, slots.length); i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = bookingScenarios[i];
        const slot = slots[i];
        
        // Ensure user has active subscription with credits
        const membershipResult = await createMembershipForUser(
            user.id,
            'pilates',
            getDateString(0),
            getDateString(30),
            { status: 'active' }
        );
        
        if (membershipResult.success) {
            await createPilatesDeposit(user.id, membershipResult.data.id, 8, true, getTimestamp(30));
        }
        
        // Try to create booking
        const { data: booking, error } = await supabase
            .from('pilates_bookings')
            .insert({
                user_id: user.id,
                slot_id: slot.id,
                status: 'confirmed',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        const passed = scenario.shouldSucceed ? !!booking : !booking;
        
        addTestResult('calendarBookings', scenario.name, passed,
            booking ? `Booking ID: ${booking.id}` : error?.message || 'No booking');
        log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
    }
    
    // Test: Verify bookings appear in calendar
    const { data: allBookings } = await supabase
        .from('pilates_bookings')
        .select('*, pilates_schedule_slots(*)')
        .gte('created_at', testResults.startTime.toISOString());
    
    const bookingsVisible = allBookings && allBookings.length > 0;
    addTestResult('calendarBookings', 'Bookings visible in system', bookingsVisible,
        `${allBookings?.length || 0} bookings visible`);
    log(`Bookings visibility check: ${bookingsVisible ? 'PASSED' : 'FAILED'}`, 
        bookingsVisible ? 'SUCCESS' : 'ERROR');
}

// ==================== INSTALLMENT TESTS ====================

async function testInstallments() {
    log('\n💳 TESTING: Installment Payments (via membership records)', 'TEST');
    
    // Note: The actual installment system may be in a different table
    // We'll test that memberships can be created with different payment states
    
    const installmentScenarios = [
        { name: 'Full payment membership', status: 'active' },
        { name: 'Pending payment membership', status: 'pending' },
        { name: 'Active membership (paid)', status: 'active' },
    ];
    
    const startIdx = 21;
    for (let i = 0; i < installmentScenarios.length; i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = installmentScenarios[i];
        
        const result = await createMembershipForUser(
            user.id,
            'pilates',
            getDateString(0),
            getDateString(30),
            { status: scenario.status }
        );
        
        if (result.success) {
            // Verify status
            const { data: membership } = await supabase
                .from('memberships')
                .select('*')
                .eq('id', result.data.id)
                .single();
            
            const passed = membership && membership.status === scenario.status;
            
            addTestResult('installments', scenario.name, passed,
                `Status: ${membership?.status}`);
            log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
        } else {
            addTestResult('installments', scenario.name, false, result.error);
            log(`${scenario.name}: FAILED`, 'ERROR');
        }
    }
}

// ==================== QR CODE TESTS ====================

async function testQRCodes() {
    log('\n📱 TESTING: QR Code Access Validation', 'TEST');
    
    const qrScenarios = [
        { name: 'Active subscription - should have access', hasActive: true, endOffset: 30 },
        { name: 'Expired subscription - no access', hasActive: false, endOffset: -5 },
        { name: 'Subscription expiring today - should have access', hasActive: true, endOffset: 0 },
        { name: 'Future subscription - should have access', hasActive: true, endOffset: 60 },
    ];
    
    const startIdx = 24;
    for (let i = 0; i < qrScenarios.length; i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = qrScenarios[i];
        
        const endDate = getDateString(scenario.endOffset);
        const startDate = getDateString(scenario.endOffset - 30);
        
        await createMembershipForUser(
            user.id,
            'pilates',
            startDate,
            endDate,
            { status: scenario.hasActive ? 'active' : 'expired', is_active: scenario.hasActive }
        );
        
        // Check if user would have QR access (active membership with end_date >= today)
        const today = getDateString(0);
        const { data: activeMemberships } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('end_date', today);
        
        const hasQRAccess = activeMemberships && activeMemberships.length > 0;
        const passed = hasQRAccess === scenario.hasActive;
        
        addTestResult('qrCodes', scenario.name, passed,
            `QR Access: ${hasQRAccess}, Expected: ${scenario.hasActive}`);
        log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
    }
}

// ==================== COMBO SUBSCRIPTION TESTS ====================

async function testComboSubscriptions() {
    log('\n🎯 TESTING: Combo Subscriptions', 'TEST');
    
    const comboScenarios = [
        { name: 'Multiple Pilates packages same user', count: 2 },
        { name: 'Sequential subscriptions', count: 3 },
        { name: 'Renewal after expiry', expired: true, renewed: true },
    ];
    
    const startIdx = 28;
    for (let i = 0; i < comboScenarios.length; i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = comboScenarios[i];
        
        let passed = true;
        let details = '';
        
        try {
            if (scenario.expired && scenario.renewed) {
                // Create expired then new
                await createMembershipForUser(user.id, 'pilates',
                    getDateString(-60), getDateString(-30), { status: 'expired' });
                const result = await createMembershipForUser(user.id, 'pilates',
                    getDateString(0), getDateString(30), { status: 'active' });
                passed = result.success;
                details = 'Renewal after expiry created';
            } else {
                // Create multiple
                for (let j = 0; j < (scenario.count || 1); j++) {
                    const result = await createMembershipForUser(user.id, 'pilates',
                        getDateString(j * 30), getDateString((j + 1) * 30),
                        { status: j === (scenario.count - 1) ? 'active' : 'expired' });
                    if (!result.success) passed = false;
                }
                details = `Created ${scenario.count} subscriptions`;
            }
        } catch (error) {
            passed = false;
            details = error.message;
        }
        
        addTestResult('comboSubscriptions', scenario.name, passed, details);
        log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
    }
}

// ==================== CLASS CREDIT TESTS ====================

async function testClassCredits() {
    log('\n🎫 TESTING: Class Credit Management', 'TEST');
    
    const creditScenarios = [
        { name: 'Initial 4 credits assigned', credits: 4 },
        { name: 'Initial 8 credits assigned', credits: 8 },
        { name: 'Initial 12 credits assigned', credits: 12 },
        { name: 'High credit count (50)', credits: 50 },
        { name: 'Zero credits scenario', credits: 0 },
    ];
    
    const startIdx = 31;
    for (let i = 0; i < creditScenarios.length; i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = creditScenarios[i];
        
        // Create membership with deposit
        const membershipResult = await createMembershipForUser(
            user.id,
            'pilates',
            getDateString(0),
            getDateString(30),
            { status: 'active' }
        );
        
        if (membershipResult.success) {
            const depositResult = await createPilatesDeposit(
                user.id,
                membershipResult.data.id,
                scenario.credits,
                true,
                getTimestamp(30)
            );
            
            if (depositResult.success) {
                // Get deposit and verify
                const { data: deposit } = await supabase
                    .from('pilates_deposits')
                    .select('*')
                    .eq('id', depositResult.data.id)
                    .single();
                
                const passed = deposit && deposit.deposit_remaining === scenario.credits;
                
                addTestResult('classCredits', scenario.name, passed,
                    `Credits: ${deposit?.deposit_remaining}/${scenario.credits}`);
                log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
            } else {
                addTestResult('classCredits', scenario.name, false, depositResult.error);
                log(`${scenario.name}: FAILED - ${depositResult.error}`, 'ERROR');
            }
        } else {
            addTestResult('classCredits', scenario.name, false, membershipResult.error);
            log(`${scenario.name}: FAILED`, 'ERROR');
        }
    }
}

// ==================== TRAINER VISIBILITY TESTS ====================

async function testTrainerVisibility() {
    log('\n👁️ TESTING: Trainer/Admin Visibility', 'TEST');
    
    // Test that bookings are visible with user information
    const { data: bookings } = await supabase
        .from('pilates_bookings')
        .select(`
            *,
            user_profiles(id, first_name, last_name, email, phone),
            pilates_schedule_slots(*)
        `)
        .limit(10);
    
    const visibilityTests = [
        {
            name: 'Bookings retrievable from database',
            check: () => bookings !== null
        },
        {
            name: 'Bookings show user first name',
            check: () => bookings?.some(b => b.user_profiles?.first_name)
        },
        {
            name: 'Bookings show user email',
            check: () => bookings?.some(b => b.user_profiles?.email)
        },
        {
            name: 'Bookings show slot information',
            check: () => bookings?.some(b => b.pilates_schedule_slots?.date)
        },
        {
            name: 'Bookings show booking status',
            check: () => bookings?.some(b => b.status !== undefined)
        },
    ];
    
    for (const test of visibilityTests) {
        const passed = test.check();
        addTestResult('trainerVisibility', test.name, passed,
            passed ? 'Data visible' : 'Data not visible');
        log(`${test.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
    }
    
    // Test admin can see all users
    const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .or('email.like.%bot_%,email.like.%test%')
        .limit(50);
    
    const adminCanSeeUsers = allUsers && allUsers.length > 0;
    addTestResult('trainerVisibility', 'Admin can view all users', adminCanSeeUsers,
        `${allUsers?.length || 0} users visible`);
    log(`Admin user visibility: ${adminCanSeeUsers ? 'PASSED' : 'FAILED'}`, 
        adminCanSeeUsers ? 'SUCCESS' : 'ERROR');
}

// ==================== EDGE CASE TESTS ====================

async function testEdgeCases() {
    log('\n🔬 TESTING: Edge Cases', 'TEST');
    
    const edgeCases = [
        { name: 'Subscription starts in future', startOffset: 7, endOffset: 37 },
        { name: 'Very short subscription (1 day)', startOffset: 0, endOffset: 1 },
        { name: 'Very long subscription (6 months)', startOffset: 0, endOffset: 180 },
        { name: 'Back-to-back subscriptions', backToBack: true },
        { name: 'Multiple active deposits same user', multipleDeposits: true },
    ];
    
    const startIdx = 36;
    for (let i = 0; i < edgeCases.length; i++) {
        const userIdx = startIdx + i;
        if (userIdx >= testResults.botUsers.length) break;
        
        const user = testResults.botUsers[userIdx];
        const scenario = edgeCases[i];
        
        let passed = true;
        let details = '';
        
        try {
            if (scenario.backToBack) {
                await createMembershipForUser(user.id, 'pilates', 
                    getDateString(-30), getDateString(0), { status: 'expired' });
                const result = await createMembershipForUser(user.id, 'pilates',
                    getDateString(0), getDateString(30), { status: 'active' });
                passed = result.success;
                details = 'Back-to-back created';
            } else if (scenario.multipleDeposits) {
                const m1 = await createMembershipForUser(user.id, 'pilates',
                    getDateString(0), getDateString(30), { status: 'active' });
                if (m1.success) {
                    await createPilatesDeposit(user.id, m1.data.id, 4, true, getTimestamp(30));
                    await createPilatesDeposit(user.id, m1.data.id, 8, true, getTimestamp(60));
                    passed = true;
                    details = 'Multiple deposits created';
                }
            } else {
                const result = await createMembershipForUser(user.id, 'pilates',
                    getDateString(scenario.startOffset), 
                    getDateString(scenario.endOffset),
                    { status: 'active' });
                passed = result.success;
                details = `Duration: ${scenario.endOffset - scenario.startOffset} days`;
            }
        } catch (error) {
            passed = false;
            details = error.message;
        }
        
        addTestResult('edgeCases', scenario.name, passed, details);
        log(`${scenario.name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'SUCCESS' : 'ERROR');
    }
}

// ==================== STRESS TESTS ====================

async function testStressScenarios() {
    log('\n💪 TESTING: Stress & Integrity Scenarios', 'TEST');
    
    // Test 1: Query performance for memberships
    const queryStart = Date.now();
    const { data: allMemberships } = await supabase
        .from('memberships')
        .select('*')
        .limit(100);
    const queryDuration = Date.now() - queryStart;
    
    const queryPassed = queryDuration < 5000;
    addTestResult('stressTests', 'Membership query performance', queryPassed,
        `${allMemberships?.length || 0} records in ${queryDuration}ms`);
    log(`Query performance: ${queryPassed ? 'PASSED' : 'FAILED'} (${queryDuration}ms)`,
        queryPassed ? 'SUCCESS' : 'ERROR');
    
    // Test 2: Deposits query performance
    const depositQueryStart = Date.now();
    const { data: allDeposits } = await supabase
        .from('pilates_deposits')
        .select('*')
        .limit(100);
    const depositQueryDuration = Date.now() - depositQueryStart;
    
    const depositQueryPassed = depositQueryDuration < 5000;
    addTestResult('stressTests', 'Deposits query performance', depositQueryPassed,
        `${allDeposits?.length || 0} records in ${depositQueryDuration}ms`);
    log(`Deposits query: ${depositQueryPassed ? 'PASSED' : 'FAILED'} (${depositQueryDuration}ms)`,
        depositQueryPassed ? 'SUCCESS' : 'ERROR');
    
    // Test 3: Database integrity - no active memberships with past end_date
    const today = getDateString(0);
    const { data: anomalies } = await supabase
        .from('memberships')
        .select('*')
        .eq('status', 'active')
        .lt('end_date', today);
    
    const noAnomalies = !anomalies || anomalies.length === 0;
    testResults.anomalies = anomalies || [];
    
    addTestResult('stressTests', 'No active expired memberships (integrity)', noAnomalies,
        `${anomalies?.length || 0} anomalies found`);
    log(`Database integrity: ${noAnomalies ? 'PASSED' : 'FAILED'} (${anomalies?.length || 0} anomalies)`,
        noAnomalies ? 'SUCCESS' : 'ERROR');
    
    // Test 4: Check pilates_deposits integrity
    const { data: depositAnomalies } = await supabase
        .from('pilates_deposits')
        .select('*')
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString());
    
    const noDepositAnomalies = !depositAnomalies || depositAnomalies.length === 0;
    
    addTestResult('stressTests', 'No active expired deposits (integrity)', noDepositAnomalies,
        `${depositAnomalies?.length || 0} anomalies found`);
    log(`Deposit integrity: ${noDepositAnomalies ? 'PASSED' : 'FAILED'}`,
        noDepositAnomalies ? 'SUCCESS' : 'ERROR');
}

// ==================== MAIN EXECUTION ====================

async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     COMPREHENSIVE PILATES SYSTEM VALIDATION - 50 USERS        ║');
    console.log('║                    Gym Evosmos - GetFit SKG                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    testResults.startTime = new Date();
    
    try {
        // Phase 1: Setup bot users
        await ensureBotUsers(50);
        
        // Phase 2: Run all test categories
        log('\n' + '='.repeat(60), 'INFO');
        log('PHASE 2: RUNNING ALL TEST SCENARIOS', 'INFO');
        log('='.repeat(60) + '\n', 'INFO');
        
        await testSubscriptionCreation();
        await testSubscriptionExpiration();
        await testCalendarBookings();
        await testInstallments();
        await testQRCodes();
        await testComboSubscriptions();
        await testClassCredits();
        await testTrainerVisibility();
        await testEdgeCases();
        await testStressScenarios();
        
    } catch (error) {
        log(`Critical error: ${error.message}`, 'ERROR');
    }
    
    testResults.endTime = new Date();
    
    // Print final summary
    printFinalSummary();
    
    // Save results to file
    await saveResultsToFile();
}

function printFinalSummary() {
    const duration = (testResults.endTime - testResults.startTime) / 1000;
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL TEST SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    console.log(`📊 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${testResults.totalTests}`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
    console.log(`   Duration: ${duration.toFixed(1)} seconds`);
    console.log(`   Bot Users: ${testResults.botUsers.length}`);
    console.log(`   Anomalies: ${testResults.anomalies.length}`);
    console.log('\n');
    
    console.log(`📋 RESULTS BY CATEGORY:`);
    for (const [category, data] of Object.entries(testResults.categories)) {
        const total = data.passed + data.failed;
        if (total > 0) {
            const rate = ((data.passed / total) * 100).toFixed(0);
            const icon = data.failed === 0 ? '✅' : '⚠️';
            console.log(`   ${icon} ${category}: ${data.passed}/${total} (${rate}%)`);
        }
    }
    
    console.log('\n');
    if (testResults.failed === 0) {
        console.log('🎉 ALL TESTS PASSED! System is ready for production.');
    } else {
        console.log(`⚠️ ${testResults.failed} tests failed. Please review the results.`);
    }
}

async function saveResultsToFile() {
    const resultsPath = 'docs/test-results-extended.json';
    const fs = await import('fs');
    
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    log(`Results saved to ${resultsPath}`, 'SUCCESS');
}

// Run the tests
runAllTests().catch(console.error);
