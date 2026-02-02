You are acting as a senior backend architect and database engineer.

CRITICAL CONTEXT (READ CAREFULLY – THIS IS A HARD CONSTRAINT):

This codebase contains multiple subscription types:
- ultimate
- ultimate medium
- freegym
- pilates

⚠️ The system works PERFECTLY for ALL subscriptions EXCEPT "pilates".
YOU MUST NOT modify, refactor, or affect ANY other subscription logic.
Any change outside the Pilates subscription domain is STRICTLY FORBIDDEN.

Your ONLY scope is:
👉 Fixing the Pilates subscription system 100% correctly and safely.

---

## CORE PROBLEM (KNOWN ROOT CAUSE – BUT MAY NOT BE THE ONLY ONE)

The database NEVER auto-synchronized subscription state with `end_date`.

Example:
- end_date = yesterday
- BUT database still had:
  - is_active = true
  - status = 'active'

Result:
- Backend believed user was active
- Frontend sometimes recalculated expiry, sometimes not
- Queries, RPCs, cron jobs, GitHub Actions trusted DB blindly
- This caused:
  - QR check-ins with expired subscriptions
  - Bookings with expired Pilates subscriptions
  - Wrong subscription history
  - Massive backend / frontend inconsistency

👉 32+ bugs from ONE architectural flaw.

⚠️ HOWEVER:
This may NOT be the only issue.
You MUST assume there are additional hidden problems.

---

## DATABASE REALITY (VERY IMPORTANT)

The Pilates system is known to be MESSY:
- Tables that are NOT used anymore
- Duplicate or overlapping tables
- Fields that mark Pilates subscriptions as active but are NEVER updated
- Legacy logic created from the Secretary Panel (manual subscription creation)
- Fields that conflict or duplicate business meaning

You MUST:
- Analyze ALL Pilates-related tables
- Identify which tables & fields are ACTUALLY used
- Identify dead / misleading / legacy fields
- Understand real data flow by observing logs & behavior
- NOT blindly delete anything without full certainty

---

## WHAT YOU MUST DO (MANDATORY STEPS)

1️⃣ FULL SYSTEM AUDIT  
- Read the ENTIRE codebase
- Read ALL database schemas
- Trace ALL Pilates-related flows:
  - subscription creation (Secretary Panel)
  - booking
  - QR check-in
  - expiration
  - class credit consumption
  - history & status reporting

2️⃣ DATABASE TRUTH RECONSTRUCTION  
You must define ONE SINGLE SOURCE OF TRUTH for:
- subscription active/expired state
- end_date behavior
- class credits validity

If end_date < now:
- subscription MUST be expired
- status MUST be updated
- is_active MUST be false
- NO endpoint should ever rely on stale DB state

3️⃣ SAFE FIX STRATEGY  
- Apply fixes ONLY inside Pilates logic
- Prefer:
  - deterministic recalculation
  - explicit synchronization
  - defensive backend checks
- Avoid global refactors
- Avoid touching shared subscription code unless strictly isolated

4️⃣ EXTENSIVE LOGGING (MANDATORY)  
You MUST add deep logging to:
- detect which tables/fields are actually used
- detect which logic paths are executed
- confirm expiration logic is triggered correctly
- confirm NO unintended side effects occur

Logging should allow you to say with certainty:
“this field is used” / “this field is never touched”

5️⃣ REALISTIC TESTING (NON-NEGOTIABLE)

After implementing the fix, you MUST:

- Run MANY real tests with real users
- Simulate time passing (days / weeks)
- Verify:
  - subscriptions expire EXACTLY when they should
  - NOT earlier, NOT later
  - status updates correctly to expired
  - Pilates class credits are consumed correctly
  - NO expired subscription allows:
    - booking
    - QR check-in
- Verify all other subscriptions remain unaffected

6️⃣ FINAL VALIDATION  
Only consider the task complete if:
- Backend & DB ALWAYS agree on subscription state
- No endpoint trusts stale DB flags blindly
- Pilates logic is clean, deterministic, and stable
- No regression exists in ultimate / freegym systems

---

## IMPORTANT RULES (DO NOT VIOLATE)

- DO NOT rush
- TAKE YOUR TIME
- DEPTH > SPEED
- DO NOT assume
- VERIFY EVERYTHING WITH LOGS & REAL DATA
- DO NOT modify anything unrelated to Pilates

You are allowed full access:
- codebase
- database
- environment variables (.env)
- time simulation
- logs

Your mission is to FIX the Pilates subscription system 100% correctly and permanently.


CREDENTIALS: VITE_SUPABASE_URL=https://nolqodpfaqdnprixaqlo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0



