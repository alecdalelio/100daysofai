# AI-Assist Log Composer

A powerful AI-enhanced log writing experience for the #100DaysOfAI platform.

## Features

### 🤖 AI Enhancement
- **Enhance with AI**: Improve clarity, tone, and readability of your logs
- **Draft from bullets**: Convert brief notes into coherent daily logs
- **TL;DR Generation**: Auto-generate concise summaries
- **Auto-tags & metadata**: Extract topics, tools, time spent, and mood

### 🎙️ Voice Recording
- **Voice-to-text**: Record audio and get instant transcription
- **Smart insertion**: Transcripts are inserted at cursor position
- **Secure storage**: Audio files stored in Supabase Storage with user isolation

### 📝 Smart Editor
- **Draft persistence**: Auto-save to localStorage with user-specific keys
- **Character/word count**: Real-time writing statistics
- **Keyboard shortcuts**: Quick access to AI features
- **Responsive design**: Works on desktop and mobile

## Keyboard Shortcuts

- `Cmd/Ctrl + E`: Enhance text
- `Cmd/Ctrl + J`: Generate TL;DR
- `Cmd/Ctrl + Shift + R`: Start/stop recording

## AI Functions

### Edge Functions (Supabase)

1. **`ai_enhance`** - Improves text clarity and tone
   - Input: `{ text: string, style?: "neutral"|"casual"|"concise" }`
   - Output: `{ enhanced: string }`

2. **`ai_expand`** - Converts bullet points to coherent text
   - Input: `{ bullets: string }`
   - Output: `{ draft: string }`

3. **`ai_summarize`** - Generates TL;DR summaries
   - Input: `{ text: string }`
   - Output: `{ tldr: string }`

4. **`ai_extract`** - Extracts metadata from content
   - Input: `{ text: string }`
   - Output: `{ tags: string[], tools: string[], minutes: number|null, mood: string|null }`

5. **`whisper_transcribe`** - Transcribes audio files
   - Input: Audio file (multipart/form-data) or file path
   - Output: `{ transcript: string, durationSec?: number }`

## Database Schema

### New Log Fields
```sql
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN IF NOT EXISTS tools text[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN IF NOT EXISTS minutes_spent integer;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS mood text CHECK (mood IN ('😄', '😊', '🙂', '😐', '😕', '😫'));
```

### Storage Bucket
- **Bucket**: `logs` (private)
- **Path structure**: `audio/{userId}/{yyyy-mm-dd}/{uuid}.webm`
- **RLS Policies**: Users can only access their own audio files

## Usage

### Basic Usage
1. Navigate to "Create New Log Entry"
2. Toggle to "AI-Assist Composer"
3. Start writing or use AI features

### Voice Recording
1. Click the microphone button or use `Cmd/Ctrl + Shift + R`
2. Allow microphone access
3. Speak your log entry
4. Click stop to transcribe
5. Transcript is inserted at cursor position

### AI Enhancement
1. Write your initial content
2. Click "Enhance" or use `Cmd/Ctrl + E`
3. Choose style: neutral, casual, or concise
4. Review and edit the enhanced text

### Bullet Expansion
1. Click "Draft from bullets"
2. Enter your bullet points or brief notes
3. Click "Expand" to generate coherent text
4. Replace current content with expanded draft

### Auto-tagging
- Tags and tools are automatically extracted when content exceeds 100 characters
- Click on tags/tools to remove them
- Time spent and mood are auto-detected and can be manually adjusted

## Environment Variables

Required in Supabase:
- `OPENAI_API_KEY`: OpenAI API key for AI functions

## Security

- All edge functions require authentication
- Audio files are user-isolated via RLS policies
- API keys are stored securely in Supabase secrets
- Input validation on all endpoints

## Performance

- Debounced auto-extraction (2s delay)
- Optimized audio processing with WebM format
- Efficient localStorage usage with user-specific keys
- Timeout handling for all API calls

## Error Handling

- Graceful fallbacks for AI failures
- Clear error messages with toast notifications
- Offline draft persistence
- Retry mechanisms for failed operations

## Future Enhancements

- Rich text editor with markdown support
- Batch processing for multiple logs
- Advanced audio features (noise reduction, speaker detection)
- Custom AI prompts and styles
- Integration with external note-taking apps
