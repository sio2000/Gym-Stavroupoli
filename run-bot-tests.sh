#!/bin/bash
# Run full subscription audit with bot users

export VITE_SUPABASE_URL="https://nolqodpfaqdnprixaqlo.supabase.co"
export VITE_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     RUNNING SUBSCRIPTION LIFECYCLE AUDIT WITH BOT USERS ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "Step 1: Running tests..."
npx vitest run tests/subscription-audit/subscription-lifecycle.test.ts 2>&1

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                 AUDIT COMPLETE                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Report saved to: tests/subscription-audit/AUDIT_REPORT.md"
echo ""
if [ -f "tests/subscription-audit/AUDIT_REPORT.md" ]; then
  echo "Report preview:"
  head -50 "tests/subscription-audit/AUDIT_REPORT.md"
fi
