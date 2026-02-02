#!/usr/bin/env bash

# SUBSCRIPTION AUDIT - QUICK START SCRIPT
# =========================================
#
# This script automates the complete audit workflow:
# 1. Setup environment
# 2. Seed test data
# 3. Run time-travel tests
# 4. Generate and display report
#
# Usage:
#   bash tests/subscription-audit/quick-start.sh
#
# Or with options:
#   bash tests/subscription-audit/quick-start.sh --seed-only
#   bash tests/subscription-audit/quick-start.sh --tests-only
#   bash tests/subscription-audit/quick-start.sh --report-only

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AUDIT_DIR="tests/subscription-audit"
LOG_FILE="${AUDIT_DIR}/audit.log"
REPORT_FILE="${AUDIT_DIR}/AUDIT_REPORT.md"

# Create log directory
mkdir -p "$AUDIT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SUBSCRIPTION LIFECYCLE AUDIT - QUICK START           ║${NC}"
echo -e "${BLUE}║   Comprehensive validation system                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Parse arguments
SEED_ONLY=false
TESTS_ONLY=false
REPORT_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --seed-only)
      SEED_ONLY=true
      shift
      ;;
    --tests-only)
      TESTS_ONLY=true
      shift
      ;;
    --report-only)
      REPORT_ONLY=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Step 1: Verify environment
echo -e "${YELLOW}📋 Verifying environment...${NC}"

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo -e "${RED}❌ VITE_SUPABASE_URL not set${NC}"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Environment verified${NC}\n"

# Step 2: Seed test data
if [ "$REPORT_ONLY" = false ]; then
  echo -e "${YELLOW}🌱 Seeding test data...${NC}"
  echo "   This creates 20 test users with various subscription scenarios"
  echo ""
  
  if npx ts-node "$AUDIT_DIR/seed-test-data.ts" 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Test data seeded${NC}\n"
  else
    echo -e "${RED}❌ Seeding failed${NC}"
    exit 1
  fi
fi

# Step 3: Run time-travel tests
if [ "$TESTS_ONLY" = false ] && [ "$REPORT_ONLY" = false ] && [ "$SEED_ONLY" = false ]; then
  echo -e "${YELLOW}⏰ Running time-travel tests...${NC}"
  echo "   This simulates 90 days of time progression"
  echo ""
  
  if npx vitest "$AUDIT_DIR/subscription-lifecycle.test.ts" --run 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Tests completed${NC}\n"
  else
    echo -e "${RED}❌ Tests failed${NC}"
    # Continue to report generation even if tests have issues
  fi
fi

# Step 4: Display results
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  AUDIT REPORT                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

if [ -f "$REPORT_FILE" ]; then
  echo -e "${GREEN}📊 Report generated:${NC}\n"
  cat "$REPORT_FILE"
  echo ""
  echo -e "${GREEN}✅ Full report saved to: ${REPORT_FILE}${NC}\n"
else
  echo -e "${YELLOW}⚠️  Report file not found. Skipping display.${NC}\n"
fi

# Step 5: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    AUDIT COMPLETE                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}📋 Files created:${NC}"
echo -e "  • ${GREEN}${REPORT_FILE}${NC}"
echo -e "  • ${GREEN}${LOG_FILE}${NC}\n"

echo -e "${YELLOW}📖 Documentation:${NC}"
echo -e "  • ${GREEN}${AUDIT_DIR}/COMPREHENSIVE_GUIDE.md${NC}"
echo -e "  • ${GREEN}${AUDIT_DIR}/README.md${NC}\n"

echo -e "${YELLOW}🔄 To re-run specific steps:${NC}"
echo -e "  • Seed only:  ${GREEN}bash ${AUDIT_DIR}/quick-start.sh --seed-only${NC}"
echo -e "  • Tests only: ${GREEN}bash ${AUDIT_DIR}/quick-start.sh --tests-only${NC}"
echo -e "  • Report:     ${GREEN}cat ${REPORT_FILE}${NC}\n"

echo -e "${GREEN}✨ Audit workflow complete!${NC}\n"
