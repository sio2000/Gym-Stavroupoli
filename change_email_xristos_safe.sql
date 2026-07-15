-- Safe email change for a single user only
-- Target user: 7bff1d99-bd14-47ec-8b5b-527f136faadc
-- Current email: xristoso1101989@gmail.com
-- New email: xristos01101989@gmail.com

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = '7bff1d99-bd14-47ec-8b5b-527f136faadc'
      AND email = 'xristoso1101989@gmail.com'
  ) THEN
    RAISE EXCEPTION 'No matching auth user found for the provided UUID and current email.';
  END IF;
END $$;

UPDATE auth.users
SET email = 'xristos01101989@gmail.com'
WHERE id = '7bff1d99-bd14-47ec-8b5b-527f136faadc'
  AND email = 'xristoso1101989@gmail.com';

UPDATE public.user_profiles
SET email = 'xristos01101989@gmail.com'
WHERE user_id = '7bff1d99-bd14-47ec-8b5b-527f136faadc'
  AND COALESCE(email, '') = 'xristoso1101989@gmail.com';

COMMIT;

SELECT id, email
FROM auth.users
WHERE id = '7bff1d99-bd14-47ec-8b5b-527f136faadc';

SELECT user_id, email
FROM public.user_profiles
WHERE user_id = '7bff1d99-bd14-47ec-8b5b-527f136faadc';
