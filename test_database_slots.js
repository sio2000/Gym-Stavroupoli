// Test 2: Ελέγχω τη βάση δεδομένων
console.log('=== TEST 2: DATABASE SLOTS CHECK ===');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSlots() {
  try {
    console.log('Fetching pilates_schedule_slots...');
    
    const { data: slots, error } = await supabase
      .from('pilates_schedule_slots')
      .select('*')
      .order('date', { ascending: true })
      .limit(20);
    
    if (error) {
      console.error('Error fetching slots:', error);
      return;
    }
    
    console.log('Fetched slots:', slots.length);
    
    // Group by date
    const slotsByDate = {};
    slots.forEach(slot => {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = [];
      }
      slotsByDate[slot.date].push(slot);
    });
    
    console.log('\nSlots by date:');
    Object.keys(slotsByDate).sort().forEach(date => {
      const dateSlots = slotsByDate[date];
      const activeSlots = dateSlots.filter(s => s.is_active).length;
      const inactiveSlots = dateSlots.filter(s => !s.is_active).length;
      console.log(`${date}: ${dateSlots.length} total (${activeSlots} active, ${inactiveSlots} inactive)`);
    });
    
    // Check specific dates from admin logs
    console.log('\n=== CHECKING ADMIN LOG DATES ===');
    const adminDates = ['2025-09-15', '2025-09-16', '2025-09-17', '2025-09-18', '2025-09-19'];
    
    adminDates.forEach(date => {
      const dateSlots = slotsByDate[date] || [];
      const activeSlots = dateSlots.filter(s => s.is_active).length;
      const inactiveSlots = dateSlots.filter(s => !s.is_active).length;
      console.log(`${date}: ${dateSlots.length} total (${activeSlots} active, ${inactiveSlots} inactive)`);
    });
    
    // Check what dates have slots
    const datesWithSlots = Object.keys(slotsByDate).sort();
    console.log('\nAll dates with slots:', datesWithSlots);
    
    // Check if there are slots for 2025-09-08 (expected Monday)
    const expectedMonday = '2025-09-08';
    const expectedMondaySlots = slotsByDate[expectedMonday] || [];
    console.log(`\nExpected Monday (${expectedMonday}): ${expectedMondaySlots.length} slots`);
    
    if (expectedMondaySlots.length > 0) {
      console.log('✅ There ARE slots for expected Monday');
    } else {
      console.log('❌ There are NO slots for expected Monday');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseSlots();
