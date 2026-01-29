-- Create RPC function to add test subscriptions (bypasses RLS)
CREATE OR REPLACE FUNCTION create_test_subscription(
  p_user_id UUID,
  p_package_id VARCHAR,
  p_duration_days INT
)
RETURNS JSON AS $$
DECLARE
  v_start_date DATE := CURRENT_DATE;
  v_end_date DATE := CURRENT_DATE + (p_duration_days || ' days')::INTERVAL;
  v_new_subscription_id UUID;
BEGIN
  INSERT INTO memberships (
    user_id,
    package_id,
    start_date,
    end_date,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_package_id,
    v_start_date,
    v_end_date,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_subscription_id;
  
  RETURN json_build_object(
    'success', true,
    'subscription_id', v_new_subscription_id,
    'user_id', p_user_id,
    'package_id', p_package_id,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'status', 'active'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_test_subscription(UUID, VARCHAR, INT) TO authenticated, anon, service_role;
