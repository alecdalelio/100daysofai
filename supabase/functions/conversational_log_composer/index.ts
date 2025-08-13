/**
 * POST /conversational_log_composer
 * Body: { action: 'create_thread' | 'send_message' | 'generate_log', thread_id?: string, message?: string, conversation_history?: Message[] }
 * Requires Authorization: Bearer <supabase user access token>
 * Returns: { thread_id, message, generated_log? }
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Env = {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  LOG_MODEL?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const LOG_ASSISTANT_INSTRUCTIONS = `
You are an expert AI writing assistant helping users create engaging daily log entries for their #100DaysOfAI journey.

CONVERSATION STRATEGY:
1. Start with a warm, encouraging greeting asking about their day's learning
2. Ask thoughtful follow-up questions to understand:
   - What they learned or worked on
   - Challenges they faced and how they solved them
   - Tools, technologies, or concepts they explored
   - How they plan to apply what they learned
   - Their mood and energy level
3. Keep responses conversational, encouraging, and concise (1-2 sentences)
4. Show genuine interest in their progress
5. When you have enough information (after 3-5 exchanges), naturally transition to log generation

Keep responses natural and engaging. Don't be robotic or repetitive.
`

const GREETING_PROMPTS = [
  "Hi there! 👋 I'm excited to help you capture today's AI learning journey. What did you work on today?",
  "Hello! 🚀 Ready to document your #100DaysOfAI progress? Tell me about your latest discoveries!",
  "Hey! ✨ I'm here to help you create an amazing log entry. What's the highlight of your AI learning today?",
  "Welcome back!  Let's capture your AI journey progress. What did you explore or build today?",
  "Hi! 🌟 I'd love to hear about your AI adventures today. What new things did you learn or create?",
  "Hello there! 💡 Ready to document your learning? What's the most interesting thing you worked on today?",
  "Hey! 🎉 Let's create a great log entry together. What did you accomplish in your AI journey today?",
  "Hi! 🔥 I'm here to help you reflect on your AI learning. What did you dive into today?",
  "Welcome! ⚡ Let's capture your progress. What did you learn or build in your AI journey today?",
  "Hello! 🎨 I'm excited to help you document your AI learning. What's the story of your day?"
]

const MODEL = (Deno.env.get('LOG_MODEL') ?? 'gpt-4o').toString()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject() as unknown as Env
    
    if (!OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY')
      return new Response(JSON.stringify({ error: 'Server missing OPENAI_API_KEY' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, thread_id, message, conversation_history } = await req.json()

    if (action === 'create_thread') {
      // Select a random greeting
      const randomGreeting = GREETING_PROMPTS[Math.floor(Math.random() * GREETING_PROMPTS.length)]

      // Generate a simple thread ID
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return new Response(JSON.stringify({
        thread_id: threadId,
        message: randomGreeting
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'send_message') {
      if (!thread_id || !message || !conversation_history) {
        return new Response(JSON.stringify({ error: 'Missing thread_id, message, or conversation_history' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: LOG_ASSISTANT_INSTRUCTIONS
        },
        ...conversation_history,
        {
          role: 'user',
          content: message
        }
      ]

      // Generate response using Chat Completions
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.8, // Slightly higher for more varied responses
          max_tokens: 200
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate response: ${response.statusText}`)
      }

      const { choices } = await response.json()
      const assistantMessage = choices[0].message.content

      return new Response(JSON.stringify({
        message: assistantMessage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'generate_log') {
      if (!conversation_history) {
        return new Response(JSON.stringify({ error: 'Missing conversation_history' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create conversation summary for log generation
      const userMessages = conversation_history
        .filter((m: Message) => m.role === 'user')
        .map((m: Message) => m.content)
        .join('\n')

      // Generate log using OpenAI Chat Completions
      const logResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an expert at creating engaging daily log entries for #100DaysOfAI journeys. Based on the conversation, create a structured log entry with:

1. A compelling title (max 60 chars)
2. A concise summary (1-2 sentences)
3. Detailed content that expands naturally on the conversation
4. Relevant tags (array of strings)
5. Tools/technologies mentioned (array of strings)
6. Estimated time spent in minutes
7. Mood emoji based on the conversation tone

Return as JSON:
{
  "title": "string",
  "summary": "string", 
  "content": "string",
  "tags": ["string"],
  "tools": ["string"],
  "minutes": number,
  "mood": "emoji"
}`
            },
            {
              role: 'user',
              content: `Generate a log entry based on this conversation:\n\n${userMessages}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!logResponse.ok) {
        throw new Error(`Failed to generate log: ${logResponse.statusText}`)
      }

      const { choices } = await logResponse.json()
      const generatedLog = JSON.parse(choices[0].message.content)

      return new Response(JSON.stringify({
        generated_log: generatedLog
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})