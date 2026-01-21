-- Create helper RPC to credit pilates deposits with SECURITY DEFINER (bypass RLS)
CREATE OR REPLACE FUNCTION public.credit_pilates_deposit(
  p_user_id uuid,
  p_package_id uuid,
  p_deposit_remaining integer,
  p_expires_at timestamptz,
  p_created_by uuid
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.pilates_deposits(
    user_id, package_id, deposit_remaining, expires_at, is_active, created_by
  ) VALUES (
    p_user_id, p_package_id, GREATEST(0, COALESCE(p_deposit_remaining,0)), p_expires_at, true, p_created_by
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


