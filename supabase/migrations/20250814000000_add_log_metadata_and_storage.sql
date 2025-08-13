-- Add metadata fields to logs table
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tools text[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN IF NOT EXISTS minutes_spent integer;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS mood text CHECK (mood IN ('😄', '😊', '🙂', '😐', '😕', '😫'));

-- Create indexes for metadata fields
CREATE INDEX IF NOT EXISTS idx_logs_tags ON logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_logs_tools ON logs USING GIN(tools);
CREATE INDEX IF NOT EXISTS idx_logs_minutes_spent ON logs(minutes_spent);
CREATE INDEX IF NOT EXISTS idx_logs_mood ON logs(mood);

-- Create storage bucket for log audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logs',
    'logs',
    false,
    26214400, -- 25MB limit
    ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for logs bucket
CREATE POLICY "Users can upload their own audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'logs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'logs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
