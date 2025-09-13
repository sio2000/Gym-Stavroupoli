-- Add created_at column to user_metrics if it doesn't exist
-- This will help with proper ordering of metrics

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
