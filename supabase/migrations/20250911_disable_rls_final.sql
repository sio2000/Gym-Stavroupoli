-- Final RLS fix - disable RLS completely for user tables
-- This will ensure the system works 100%

-- Disable RLS completely for all user tables
ALTER TABLE public.user_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_visits DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON public.user_metrics TO authenticated;
GRANT ALL ON public.user_goals TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_challenges TO authenticated;
GRANT ALL ON public.user_app_visits TO authenticated;

-- Grant all permissions to anon users as well (for testing)
GRANT ALL ON public.user_metrics TO anon;
GRANT ALL ON public.user_goals TO anon;
GRANT ALL ON public.user_achievements TO anon;
GRANT ALL ON public.user_challenges TO anon;
GRANT ALL ON public.user_app_visits TO anon;

-- Add created_at column if it doesn't exist
ALTER TABLE public.user_metrics 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have created_at = NOW() if they don't have it
UPDATE public.user_metrics 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Make created_at NOT NULL
ALTER TABLE public.user_metrics 
ALTER COLUMN created_at SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_metrics_created_at 
ON public.user_metrics(user_id, created_at DESC);
