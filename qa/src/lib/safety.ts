import { logger } from "./logger";

export function assertStagingEnv(): void {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (!nodeEnv || (nodeEnv !== "staging" && nodeEnv !== "test")) {
    throw new Error(
      "Ασφαλιστική δικλείδα: Οι δοκιμές QA επιτρέπονται μόνο σε NODE_ENV=staging ή test"
    );
  }

  const forbidProdKeys = [
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes("prod"));

  if (forbidProdKeys) {
    throw new Error(
      "Εντοπίστηκαν πιθανώς production credentials. Σταματώ για ασφάλεια."
    );
  }

  logger.info({ nodeEnv }, "Staging/Test περιβάλλον επιβεβαιώθηκε");
}


