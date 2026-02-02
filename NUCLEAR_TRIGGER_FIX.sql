-- =====================================================
-- NUCLEAR OPTION: TRIGGER THAT DOES NOTHING
-- =====================================================
-- If the minimal trigger still causes issues, this version
-- just returns NEW without any database operations

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a do-nothing trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Intentionally minimal: always return NEW.
    RETURN NEW;
EXCEPTION WHEN others THEN
    -- If anything goes wrong, swallow the error and return NEW
    -- so auth flows are not blocked by trigger faults.
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role, postgres;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

SELECT 'Do-nothing trigger created' as status;
