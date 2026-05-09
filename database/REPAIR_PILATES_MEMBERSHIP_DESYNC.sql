-- One-time / repair: re-sync memberships with active pilates_deposits when the row was
-- marked expired/inactive (e.g. after deposit hit 0) but the deposit was refilled via
-- set_user_pilates_lessons without updating memberships.
--
-- Run in Supabase SQL editor after review. Safe to run once; already-correct rows are unchanged.

BEGIN;

WITH repaired AS (
  UPDATE public.memberships m
  SET
    is_active = true,
    status = 'active',
    updated_at = NOW()
  WHERE m.deleted_at IS NULL
    AND m.end_date >= CURRENT_DATE
    AND (m.is_active = false OR m.status IS DISTINCT FROM 'active')
    AND m.status NOT IN ('cancelled', 'suspended')
    AND EXISTS (
      SELECT 1
      FROM public.pilates_deposits d
      WHERE d.user_id = m.user_id
        AND d.is_active = true
        AND d.deposit_remaining > 0
        AND (d.expires_at IS NULL OR d.expires_at > NOW())
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.membership_packages mp
        WHERE mp.id = m.package_id
          AND (
            lower(mp.package_type) = 'pilates'
            OR lower(trim(mp.name)) = 'pilates'
            OR mp.name ILIKE '%ultimate%'
          )
      )
      -- Safety net: same uuid may appear as auth id or user_profiles.id in admin UIs
      OR m.user_id = '197154db-d758-44d2-9530-9e96e1ff0964'::uuid
      OR EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = '197154db-d758-44d2-9530-9e96e1ff0964'::uuid
          AND up.user_id = m.user_id
      )
    )
  RETURNING m.id, m.user_id
)
INSERT INTO public.membership_logs (membership_id, action, details)
SELECT
  r.id,
  'desync_repair',
  jsonb_build_object(
    'reason', 'pilates_deposit_active_but_membership_inactive',
    'user_id', r.user_id,
    'repaired_at', NOW()
  )
FROM repaired r;

COMMIT;
