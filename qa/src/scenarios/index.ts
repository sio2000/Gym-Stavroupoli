import { Reporter } from "../lib/reporter";
import { runAuthScenarios } from "./modules/auth";
import { runRoleAccessScenarios } from "./modules/roles";
import { runProfileScenarios } from "./modules/profile";
import { runMembershipScenarios } from "./modules/memberships";
import { runReferralScenarios } from "./modules/referrals";
import { runQrScenarios } from "./modules/qr";
import { runPilatesScenarios } from "./modules/pilates";
import { runPtScenarios } from "./modules/personalTraining";
import { runPaspartuScenarios } from "./modules/paspartu";
import { runAdminScenarios } from "./modules/admin";
import { runCashRegisterScenarios } from "./modules/cashRegister";
import { runAnalyticsScenarios } from "./modules/analytics";
import { generateAndRunScenarios } from "./generator";

export async function runAllScenarios(reporter: Reporter) {
  await runAuthScenarios(reporter);
  await runRoleAccessScenarios(reporter);
  await runProfileScenarios(reporter);
  await runMembershipScenarios(reporter);
  await runReferralScenarios(reporter);
  await runQrScenarios(reporter);
  await runPilatesScenarios(reporter);
  await runPtScenarios(reporter);
  await runPaspartuScenarios(reporter);
  await runAdminScenarios(reporter);
  await runCashRegisterScenarios(reporter);
  await runAnalyticsScenarios(reporter);
  // Auto-generated bulk tests από πραγματικούς πίνακες (read-only)
  // Θα χρησιμοποιηθεί PG αν υπάρχουν creds, διαφορετικά Supabase RPC exec_sql
  await generateAndRunScenarios(reporter);
}


