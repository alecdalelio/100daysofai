-- Add LinkedIn integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_headline TEXT,
ADD COLUMN IF NOT EXISTS linkedin_company TEXT,
ADD COLUMN IF NOT EXISTS linkedin_id TEXT;

-- Add unique constraint on linkedin_id to prevent duplicate accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_linkedin_id 
ON public.profiles (linkedin_id) 
WHERE linkedin_id IS NOT NULL;

-- Add index for LinkedIn profile URL lookups
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_url 
ON public.profiles (linkedin_profile_url) 
WHERE linkedin_profile_url IS NOT NULL;

-- Update the handle_new_user function to handle LinkedIn OAuth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    display_name, 
    avatar_url,
    linkedin_id,
    linkedin_profile_url,
    linkedin_headline,
    linkedin_company
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'linkedin_id',
    NEW.raw_user_meta_data->>'linkedin_profile_url',
    NEW.raw_user_meta_data->>'linkedin_headline',
    NEW.raw_user_meta_data->>'linkedin_company'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    linkedin_id = COALESCE(EXCLUDED.linkedin_id, profiles.linkedin_id),
    linkedin_profile_url = COALESCE(EXCLUDED.linkedin_profile_url, profiles.linkedin_profile_url),
    linkedin_headline = COALESCE(EXCLUDED.linkedin_headline, profiles.linkedin_headline),
    linkedin_company = COALESCE(EXCLUDED.linkedin_company, profiles.linkedin_company),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;