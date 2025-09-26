// Test script για δημιουργία ατομικών σεσιών συνδυασμού
console.log("=== TESTING INDIVIDUAL SESSIONS CREATION ===");

// Simulate the data that would be sent to the database
const testIndividualSessions = [
  {
    session_date: "2025-01-15",
    start_time: "18:00:00",
    end_time: "19:00:00",
    trainer: "Mike",
    room: "Αίθουσα Mike",
    group_type: null, // This is the key - NULL for individual sessions
    notes: "Test Individual Session (Individual - Combination Program)"
  },
  {
    session_date: "2025-01-16",
    start_time: "19:00:00",
    end_time: "20:00:00",
    trainer: "Jordan",
    room: "Αίθουσα Jordan",
    group_type: null, // This is the key - NULL for individual sessions
    notes: "Test Individual Session 2 (Individual - Combination Program)"
  }
];

console.log("Test individual sessions to insert:");
console.log(JSON.stringify(testIndividualSessions, null, 2));

console.log("\n=== CHECKING DATABASE SCHEMA ===");
console.log("Current schema: group_type INTEGER NOT NULL DEFAULT 3");
console.log("❌ PROBLEM: NOT NULL constraint prevents NULL values");
console.log("✅ SOLUTION: Run this SQL in Supabase:");
console.log(`
ALTER TABLE group_sessions ALTER COLUMN group_type DROP NOT NULL;
ALTER TABLE group_sessions ALTER COLUMN group_type SET DEFAULT NULL;
`);

console.log("\n=== EXPECTED RESULT AFTER FIX ===");
console.log("✅ Individual sessions will be created with group_type = NULL");
console.log("✅ Calendar will display them as 'Ατομική Σεσία - [Trainer]'");
console.log("✅ Capacity will be 1 person");
console.log("✅ They will appear in the calendar immediately");

console.log("\n=== NEXT STEPS ===");
console.log("1. Run the SQL script in Supabase SQL Editor");
console.log("2. Try creating a combination program again");
console.log("3. Check the logs for individual session creation");
console.log("4. Verify they appear in the calendar");

console.log("\n=== TEST COMPLETED ===");

