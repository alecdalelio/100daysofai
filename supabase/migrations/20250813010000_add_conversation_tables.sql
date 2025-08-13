-- Add conversation threads table for conversational onboarding
CREATE TABLE conversation_threads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id text NOT NULL UNIQUE,
    assistant_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    extracted_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add conversation messages table for storing chat history
CREATE TABLE conversation_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id text NOT NULL REFERENCES conversation_threads(thread_id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_conversation_threads_user_id ON conversation_threads(user_id);
CREATE INDEX idx_conversation_threads_thread_id ON conversation_threads(thread_id);
CREATE INDEX idx_conversation_threads_status ON conversation_threads(status);
CREATE INDEX idx_conversation_messages_thread_id ON conversation_messages(thread_id);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at);

-- Enable RLS
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_threads
CREATE POLICY "Users can view their own conversation threads" ON conversation_threads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation threads" ON conversation_threads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation threads" ON conversation_threads
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for conversation_messages
CREATE POLICY "Users can view messages from their threads" ON conversation_messages
    FOR SELECT USING (
        thread_id IN (
            SELECT thread_id FROM conversation_threads WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their threads" ON conversation_messages
    FOR INSERT WITH CHECK (
        thread_id IN (
            SELECT thread_id FROM conversation_threads WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON conversation_threads TO authenticated;
GRANT SELECT, INSERT ON conversation_messages TO authenticated;