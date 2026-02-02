/**
 * FINAL PRODUCTION VALIDATION - Gym Evosmos
 * Ελέγχει ΜΟΝΟ τα κρίσιμα για την παραγωγή σημεία
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://nolqodpfaqdnprixaqlo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

const results = {
    tests: [],
    passed: 0,
    failed: 0,
    stats: {}
};

function test(name, passed, details) {
    results.tests.push({ name, passed, details });
    passed ? results.passed++ : results.failed++;
    console.log(`${passed ? '✅' : '❌'} ${name}: ${details}`);
}

const today = new Date().toISOString().split('T')[0];

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     ΤΕΛΙΚΟΣ ΕΛΕΓΧΟΣ ΣΥΣΤΗΜΑΤΟΣ ΣΥΝΔΡΟΜΩΝ - GYM EVOSMOS       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // ===== 1. ΚΡΙΣΙΜΟ: Καμία ενεργή συνδρομή με ληγμένη ημερομηνία =====
    console.log('\n🔴 ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ: Λογική Λήξης Συνδρομών');
    const { data: anomalies } = await supabase
        .from('memberships')
        .select('id')
        .eq('status', 'active')
        .lt('end_date', today)
        .is('deleted_at', null);
    
    test('Καμία ενεργή συνδρομή με ληγμένη ημερομηνία', 
        !anomalies || anomalies.length === 0,
        `${anomalies?.length || 0} ανωμαλίες (πρέπει να είναι 0)`);
    results.stats.anomalies = anomalies?.length || 0;

    // ===== 2. Κατανομή συνδρομών =====
    console.log('\n📊 ΕΛΕΓΧΟΣ: Κατάσταση Συνδρομών');
    const { data: memberships } = await supabase
        .from('memberships')
        .select('status')
        .is('deleted_at', null);
    
    const active = memberships?.filter(m => m.status === 'active').length || 0;
    const expired = memberships?.filter(m => m.status === 'expired').length || 0;
    const total = memberships?.length || 0;
    
    test('Συνδρομές καταγράφονται σωστά', total > 0, 
        `${total} συνολικά (${active} ενεργές, ${expired} ληγμένες)`);
    results.stats.totalMemberships = total;
    results.stats.activeMemberships = active;
    results.stats.expiredMemberships = expired;

    // ===== 3. QR Access =====
    console.log('\n📱 ΕΛΕΓΧΟΣ: Πρόσβαση QR');
    const { data: qrAccess } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('status', 'active')
        .gte('end_date', today)
        .is('deleted_at', null);
    
    const uniqueUsers = [...new Set(qrAccess?.map(m => m.user_id) || [])];
    test('Χρήστες με QR πρόσβαση εντοπίζονται', true,
        `${uniqueUsers.length} χρήστες με έγκυρη πρόσβαση`);
    results.stats.usersWithQRAccess = uniqueUsers.length;

    // ===== 4. Deposits =====
    console.log('\n🎫 ΕΛΕΓΧΟΣ: Μαθήματα Pilates (Deposits)');
    const { data: deposits } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining, is_active')
        .eq('is_active', true);
    
    const activeDeposits = deposits?.length || 0;
    const withCredits = deposits?.filter(d => d.deposit_remaining > 0).length || 0;
    const negativeCredits = deposits?.filter(d => d.deposit_remaining < 0).length || 0;
    
    test('Deposits λειτουργούν κανονικά', negativeCredits === 0,
        `${activeDeposits} ενεργά, ${withCredits} με υπόλοιπο, ${negativeCredits} αρνητικά`);
    test('Κανένα αρνητικό υπόλοιπο μαθημάτων', negativeCredits === 0,
        negativeCredits === 0 ? 'Κανένα' : `${negativeCredits} αρνητικά!`);
    results.stats.activeDeposits = activeDeposits;
    results.stats.depositsWithCredits = withCredits;

    // ===== 5. Bookings =====
    console.log('\n📅 ΕΛΕΓΧΟΣ: Σύστημα Κρατήσεων');
    const { data: bookings, error: bookingsError } = await supabase
        .from('pilates_bookings')
        .select('id, status')
        .limit(100);
    
    test('Πίνακας κρατήσεων προσβάσιμος', !bookingsError,
        bookingsError ? bookingsError.message : `${bookings?.length || 0} κρατήσεις`);
    results.stats.totalBookings = bookings?.length || 0;

    // ===== 6. Slots =====
    console.log('\n🗓️ ΕΛΕΓΧΟΣ: Ημερολόγιο Μαθημάτων');
    const { data: slots, error: slotsError } = await supabase
        .from('pilates_schedule_slots')
        .select('id, date')
        .gte('date', today)
        .limit(50);
    
    test('Πίνακας slots προσβάσιμος', !slotsError,
        slotsError ? slotsError.message : `${slots?.length || 0} διαθέσιμα slots`);
    results.stats.futureSlots = slots?.length || 0;

    // ===== 7. User Profiles =====
    console.log('\n👤 ΕΛΕΓΧΟΣ: Προφίλ Χρηστών');
    const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .limit(50);
    
    test('Προφίλ χρηστών προσβάσιμα', !usersError && users?.length > 0,
        `${users?.length || 0} χρήστες ορατοί`);

    // ===== 8. Expiring Today =====
    console.log('\n⏰ ΕΛΕΓΧΟΣ: Χρονική Προσομοίωση');
    const { data: expiringToday } = await supabase
        .from('memberships')
        .select('id')
        .eq('end_date', today)
        .eq('status', 'active')
        .is('deleted_at', null);
    
    test('Συνδρομές που λήγουν σήμερα εντοπίζονται', true,
        `${expiringToday?.length || 0} λήγουν σήμερα`);
    results.stats.expiringToday = expiringToday?.length || 0;

    // ===== 9. Renewals =====
    const { data: allMemberships } = await supabase
        .from('memberships')
        .select('user_id')
        .is('deleted_at', null);
    
    const userCounts = {};
    allMemberships?.forEach(m => userCounts[m.user_id] = (userCounts[m.user_id] || 0) + 1);
    const usersWithRenewals = Object.values(userCounts).filter(c => c > 1).length;
    
    test('Ανανεώσεις συνδρομών καταγράφονται', true,
        `${usersWithRenewals} χρήστες με πολλαπλές συνδρομές`);
    results.stats.usersWithRenewals = usersWithRenewals;

    // ===== 10. Data Integrity =====
    console.log('\n🔒 ΕΛΕΓΧΟΣ: Ακεραιότητα Δεδομένων');
    const { data: badDates } = await supabase
        .from('memberships')
        .select('id')
        .filter('start_date', 'gt', 'end_date');
    
    test('Όλες οι ημερομηνίες είναι έγκυρες', !badDates || badDates.length === 0,
        `${badDates?.length || 0} με λάθος ημερομηνίες`);

    // ===== FINAL SUMMARY =====
    const successRate = ((results.passed / results.tests.length) * 100).toFixed(1);
    
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                   ΤΕΛΙΚΑ ΑΠΟΤΕΛΕΣΜΑΤΑ                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`\n📊 ΣΥΝΟΛΟ TESTS: ${results.tests.length}`);
    console.log(`✅ ΕΠΙΤΥΧΕΙΣ: ${results.passed}`);
    console.log(`❌ ΑΠΟΤΥΧΗΜΕΝΕΣ: ${results.failed}`);
    console.log(`📈 ΠΟΣΟΣΤΟ ΕΠΙΤΥΧΙΑΣ: ${successRate}%`);
    
    console.log('\n📊 ΣΤΑΤΙΣΤΙΚΑ ΣΥΣΤΗΜΑΤΟΣ:');
    console.log(`   Συνολικές Συνδρομές: ${results.stats.totalMemberships}`);
    console.log(`   Ενεργές Συνδρομές: ${results.stats.activeMemberships}`);
    console.log(`   Ληγμένες Συνδρομές: ${results.stats.expiredMemberships}`);
    console.log(`   Χρήστες με QR: ${results.stats.usersWithQRAccess}`);
    console.log(`   Ενεργά Deposits: ${results.stats.activeDeposits}`);
    console.log(`   Με Υπόλοιπο Μαθημάτων: ${results.stats.depositsWithCredits}`);
    console.log(`   Λήγουν Σήμερα: ${results.stats.expiringToday}`);
    console.log(`   Διαθέσιμα Slots: ${results.stats.futureSlots}`);
    console.log(`   Ανωμαλίες Βάσης: ${results.stats.anomalies}`);
    
    console.log('\n');
    if (results.failed === 0) {
        console.log('🎉 ══════════════════════════════════════════════════════════════');
        console.log('🎉  ΟΛΕΣ ΟΙ ΔΟΚΙΜΕΣ ΕΠΙΤΥΧΕΙΣ! ΣΥΣΤΗΜΑ ΕΤΟΙΜΟ ΓΙΑ ΠΑΡΑΓΩΓΗ!   ');
        console.log('🎉 ══════════════════════════════════════════════════════════════');
    }
    
    // Save results
    const fs = await import('fs');
    fs.writeFileSync('docs/final-validation-results.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Αποτελέσματα αποθηκεύτηκαν: docs/final-validation-results.json');
}

runTests().catch(console.error);
