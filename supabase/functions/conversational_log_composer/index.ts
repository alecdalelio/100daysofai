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

function extractJsonFromMarkdown(text: string): string {
  console.log('[extractJsonFromMarkdown] Input text:', text.substring(0, 200) + '...')
  
  let cleanedText = text.trim()
  
  // Remove any markdown code block formatting
  // Handle multiple formats: ```json, ```, ``` json, etc.
  cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '')
  cleanedText = cleanedText.replace(/\s*```$/, '')
  
  // Remove any remaining backticks at start/end
  cleanedText = cleanedText.replace(/^`+/, '')
  cleanedText = cleanedText.replace(/`+$/, '')
  
  // Find the first { and last } to extract just the JSON object
  const firstBrace = cleanedText.indexOf('{')
  const lastBrace = cleanedText.lastIndexOf('}')
  
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
  }
  
  // Final cleanup - remove any non-JSON text before/after
  cleanedText = cleanedText.trim()
  
  console.log('[extractJsonFromMarkdown] Cleaned text:', cleanedText.substring(0, 200) + '...')
  return cleanedText
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

      console.log(`[send_message] Generating response for user ${user.id}, messages count: ${messages.length}`)
      
      // Generate response using Chat Completions with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
      
      let assistantMessage: string
      
      try {
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
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`Failed to generate response: ${response.statusText}`)
        }

        const responseData = await response.json()
        console.log(`[send_message] OpenAI response received successfully`)
        
        if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
          console.error('Invalid OpenAI response structure:', responseData)
          throw new Error('Invalid response from OpenAI')
        }
        
        assistantMessage = responseData.choices[0].message.content
        
        if (!assistantMessage) {
          console.error('Empty message from OpenAI')
          throw new Error('Empty response from OpenAI')
        }
        
      } catch (error) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          console.error('OpenAI request timeout')
          throw new Error('Request timeout - please try again')
        }
        throw error
      }

      console.log(`[send_message] Returning response: ${assistantMessage.substring(0, 100)}...`)
      
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
              content: `You are an expert at creating engaging daily log entries for #100DaysOfAI journeys. Based on the conversation, create a structured log entry.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON
- NO markdown code blocks (no \`\`\`)
- NO explanatory text before or after
- NO backticks anywhere
- Start directly with { and end with }

Required fields:
1. title: Compelling title (max 60 chars)
2. summary: Concise summary (1-2 sentences)
3. content: Detailed content expanding on the conversation
4. tags: Array of relevant tags
5. tools: Array of tools/technologies mentioned
6. minutes: Estimated time spent (number)
7. mood: Single emoji from this list ONLY: 😄, 😊, 🙂, 😐, 😕, 😫

Return exactly this format (no extra formatting):
{
  "title": "Your title here",
  "summary": "Your summary here",
  "content": "Your detailed content here",
  "tags": ["tag1", "tag2"],
  "tools": ["tool1", "tool2"],
  "minutes": 30,
  "mood": "😊"
}`
            },
            {
              role: 'user',
              content: `Generate a log entry based on this conversation:\n\n${userMessages}`
            }
          ],
          temperature: 0.3,  // Lower temperature for more consistent JSON
          max_tokens: 1000,
          response_format: { type: "json_object" }  // Force JSON mode if supported
        })
      })

      if (!logResponse.ok) {
        throw new Error(`Failed to generate log: ${logResponse.statusText}`)
      }

      const { choices } = await logResponse.json()
      const rawContent = choices[0].message.content
      console.log('[generate_log] Raw OpenAI response:', rawContent)
      
      // Extract JSON from potential markdown formatting
      const cleanJsonString = extractJsonFromMarkdown(rawContent)
      console.log('[generate_log] Cleaned JSON string:', cleanJsonString)
      
      let generatedLog
      
      // Try multiple parsing strategies
      const parseStrategies = [
        () => JSON.parse(cleanJsonString),
        () => {
          // Try removing everything before first { and after last }
          const firstBrace = cleanJsonString.indexOf('{')
          const lastBrace = cleanJsonString.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(cleanJsonString.substring(firstBrace, lastBrace + 1))
          }
          throw new Error('No JSON object found')
        },
        () => {
          // Try fixing common JSON issues
          let fixed = cleanJsonString
            .replace(/\\n/g, '\\\\n')  // Fix newlines
            .replace(/'/g, '"')        // Fix single quotes
            .replace(/,\s*}/g, '}')    // Remove trailing commas
            .replace(/,\s*]/g, ']')    // Remove trailing commas in arrays
          return JSON.parse(fixed)
        },
        () => {
          // Aggressive JSON extraction - find anything that looks like JSON
          const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
          const matches = rawContent.match(jsonRegex)
          if (matches && matches.length > 0) {
            // Try the largest match (most likely to be complete)
            const largestMatch = matches.reduce((a, b) => a.length > b.length ? a : b)
            return JSON.parse(largestMatch)
          }
          throw new Error('No JSON pattern found')
        }
      ]
      
      let lastError: Error | null = null
      
      for (let i = 0; i < parseStrategies.length; i++) {
        try {
          console.log(`[generate_log] Trying parse strategy ${i + 1}`)
          generatedLog = parseStrategies[i]()
          console.log(`[generate_log] Parse strategy ${i + 1} succeeded`)
          break
        } catch (error) {
          console.error(`[generate_log] Parse strategy ${i + 1} failed:`, error)
          lastError = error as Error
          continue
        }
      }
      
      if (!generatedLog) {
        console.error('[generate_log] All parse strategies failed')
        console.error('[generate_log] Raw content:', rawContent)
        console.error('[generate_log] Cleaned content:', cleanJsonString)
        throw new Error(`Failed to parse generated log JSON: ${lastError?.message || 'Unknown error'}`)
      }
      
      // Validate and fix the parsed object
      try {
        // Validate required fields
        const requiredFields = ['title', 'summary', 'content']
        for (const field of requiredFields) {
          if (!generatedLog[field]) {
            throw new Error(`Missing required field: ${field}`)
          }
        }
        
        // Ensure arrays exist and fix types
        if (!Array.isArray(generatedLog.tags)) generatedLog.tags = []
        if (!Array.isArray(generatedLog.tools)) generatedLog.tools = []
        if (typeof generatedLog.minutes !== 'number') generatedLog.minutes = 30
        
        // Validate mood against allowed values
        const allowedMoods = ['😄', '😊', '🙂', '😐', '😕', '😫']
        if (!generatedLog.mood || !allowedMoods.includes(generatedLog.mood)) {
          generatedLog.mood = '😊'  // Default to happy
        }
        
        console.log('[generate_log] Successfully generated and validated log:', generatedLog.title)
        
      } catch (validationError) {
        console.error('[generate_log] Validation error:', validationError)
        throw new Error(`Generated log validation failed: ${validationError.message}`)
      }

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