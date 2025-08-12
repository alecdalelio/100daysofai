-- Add missing summary column to logs table
ALTER TABLE public.logs 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add index on summary for search optimization
CREATE INDEX IF NOT EXISTS idx_logs_summary ON public.logs USING gin(to_tsvector('english', summary)) WHERE summary IS NOT NULL;