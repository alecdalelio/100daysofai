-- Create tables needed for the 100daysofai application

-- Syllabi table for storing generated learning plans
CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  duration_weeks INTEGER DEFAULT 14,
  difficulty_level TEXT DEFAULT 'intermediate',
  plan JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding answers table for storing user preferences
CREATE TABLE IF NOT EXISTS public.onboarding_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily logs table (if needed)
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  day INTEGER,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for syllabi
CREATE POLICY "Users can view own syllabi" ON public.syllabi
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own syllabi" ON public.syllabi
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own syllabi" ON public.syllabi
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for onboarding_answers
CREATE POLICY "Users can view own answers" ON public.onboarding_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON public.onboarding_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for logs
CREATE POLICY "Users can view own logs" ON public.logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view published logs" ON public.logs
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can insert own logs" ON public.logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_syllabi_user_id ON public.syllabi (user_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_created_at ON public.syllabi (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_id ON public.onboarding_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_published ON public.logs (is_published) WHERE is_published = true;

-- Updated at trigger function (reuse from profiles)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_syllabi_updated_at
  BEFORE UPDATE ON public.syllabi
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_logs_updated_at
  BEFORE UPDATE ON public.logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();