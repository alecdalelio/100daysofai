/**
 * POST /conversational_onboarding
 * Body: { action: 'create_thread' | 'send_message' | 'extract_data', thread_id?: string, message?: string }
 * Requires Authorization: Bearer <supabase user access token>
 * Returns: { thread_id, message, extracted_data? }
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Env = {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ONBOARDING_ASSISTANT_ID?: string
  ONBOARDING_MODEL?: string
}

// Lightweight domain glossary used to ground the coach's answers
const GLOSSARY = `
Key AI concepts (quick reference):
- Model Context Protocol (MCP, Anthropic): Open protocol for tool/data-source orchestration so agents can call tools across services via a common schema.
- Retrieval-Augmented Generation (RAG): Retrieve relevant documents/vectors and feed them to the model as context before generating an answer.
- Vector database: Store embeddings (numeric vectors) for semantic search (examples: pgvector, Pinecone, Weaviate, Qdrant).
- Embeddings: Numeric representations of text/images used for similarity search and clustering.
- Agent: An LLM that can plan and call tools (functions/APIs) to accomplish goals; includes tool-use, memory, and feedback loops.
- OpenAI Assistants v2: API for assistants with threads, messages, and tool execution; runs can be polled until completion.
- LangChain: Framework for building LLM apps (chains, tools, agents). Use sparingly; prefer direct, minimal integrations when possible.
- Multi-Channel Perception (MCP, alt meaning): Sensor fusion across modalities (vision, audio, LiDAR). Only relevant in robotics/perception contexts.
`

const ONBOARDING_ASSISTANT_INSTRUCTIONS = `
You are an expert AI learning coach guiding users to create their personalized AI learning plan. 
Your mission: gather all required onboarding details through a natural, engaging conversation.

CONVERSATION STRATEGY:
1. Begin with a warm, open question about the user's background and AI goals.
2. Ask focused follow-ups to clarify and fill any missing data.
3. Keep it human: be encouraging, curious, and concise (max 2–3 sentences per turn).
4. Guide naturally toward the required fields without feeling like a form.
5. Confirm and summarize as you go, so the user feels heard.

ACRONYMS & DOMAIN KNOWLEDGE:
- Defaults: Unless the surrounding context mentions sensors/robotics/perception/vision/LiDAR/cameras, treat MCP as **Model Context Protocol (Anthropic)** without asking. If those perception clues are present, briefly ask: "By MCP, do you mean Model Context Protocol or Multi‑Channel Perception?"
- When domain terms arise (RAG, vector DB, agents, embeddings, LangChain, etc.):
  * Give a single-sentence definition only if it helps progress the conversation.
  * Immediately follow with a question tied to the user’s goals or constraints.
- Avoid long lectures; prioritize relevance. You may rely on the glossary appended to this prompt as authoritative context.

REQUIRED DATA TO EXTRACT:
- currentRole
- AIExperienceLevel
- primaryGoals
- preferredLearningStyle
- availableTimePerWeek
- keyInterests (e.g., agents, automation, LLMs, vector DBs)
- constraints (time, budget, hardware)
- any special tools or platforms they want to focus on
- motivation drivers

GOAL:
Make the onboarding feel like a collaborative conversation with a trusted coach. 
Keep engagement high, ensure all required info is captured, and leave the user motivated to start their #100DaysOfAI journey.
`

const MODEL = (Deno.env.get('ONBOARDING_MODEL') ?? 'gpt-4o').toString()

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
    const { OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ONBOARDING_ASSISTANT_ID } = Deno.env.toObject() as unknown as Env
    
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
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, thread_id, message } = await req.json()

    switch (action) {
      case 'create_thread':
        return await createThread(OPENAI_API_KEY, user.id, supabase, ONBOARDING_ASSISTANT_ID)
      case 'send_message':
        if (!thread_id || !message) {
          return new Response(JSON.stringify({ error: 'thread_id and message required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return await sendMessage(OPENAI_API_KEY, thread_id, message, user.id, supabase)
      case 'extract_data':
        if (!thread_id) {
          return new Response(JSON.stringify({ error: 'thread_id required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return await extractOnboardingData(OPENAI_API_KEY, thread_id, user.id, supabase)
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error) {
    console.error('Conversational onboarding error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createThread(openaiApiKey: string, userId: string, supabase: any, assistantIdFromEnv?: string) {
  try {
    // Resolve assistant id (prefer pre-created)
    let assistantId = assistantIdFromEnv
    if (!assistantId) {
      const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: 'AI Learning Onboarding Coach',
          instructions: `${ONBOARDING_ASSISTANT_INSTRUCTIONS}

---
REFERENCE GLOSSARY
${GLOSSARY}
`,
          model: MODEL,
          tools: []
        })
      })
      if (!assistantResponse.ok) {
        throw new Error(`Failed to create assistant: ${assistantResponse.status}`)
      }
      const assistant = await assistantResponse.json()
      assistantId = assistant.id
    }

    // Create thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    })

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${threadResponse.status}`)
    }

    const thread = await threadResponse.json()

    // Store thread in database
    await supabase
      .from('conversation_threads')
      .insert({
        thread_id: thread.id,
        assistant_id: assistantId,
        user_id: userId,
        status: 'active',
        created_at: new Date().toISOString()
      })

    // Send initial message from assistant
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'assistant',
        content: "Hi! I'm excited to help you create your personalized AI learning plan. Let's start with the basics - what's your background, and what would you like to achieve with AI? Feel free to share as much or as little as you'd like!"
      })
    })

    return new Response(JSON.stringify({ 
      thread_id: thread.id,
      assistant_id: assistantId,
      message: "Hi! I'm excited to help you create your personalized AI learning plan. Let's start with the basics - what's your background, and what would you like to achieve with AI? Feel free to share as much or as little as you'd like!"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create thread error:', error)
    return new Response(JSON.stringify({ error: 'Failed to create conversation thread' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function sendMessage(openaiApiKey: string, threadId: string, message: string, userId: string, supabase: any) {
  try {
    // Get thread info from database
    const { data: threadData, error: threadError } = await supabase
      .from('conversation_threads')
      .select('assistant_id')
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .single()

    if (threadError || !threadData) {
      throw new Error('Thread not found or access denied')
    }

    // Add user message to thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      })
    })

    // Create run
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: threadData.assistant_id
      })
    })

    if (!runResponse.ok) {
      throw new Error(`Failed to create run: ${runResponse.status}`)
    }

    const run = await runResponse.json()

    // Poll for completion with a max wait (prevents UI hangs)
    let runStatus = run
    const startedAt = Date.now()
    const MAX_WAIT_MS = 25000
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && (Date.now() - startedAt) < MAX_WAIT_MS) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      })
      runStatus = await statusResponse.json()
    }

    // Get latest assistant message (even if run didn't fully complete)
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?limit=10`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    const messages = await messagesResponse.json()
    const latestAssistant = (messages.data || []).find((m: any) => m.role === 'assistant') || messages.data?.[0]
    const latestText = latestAssistant?.content?.[0]?.text?.value ?? 'Sorry, I ran into a delay. Could you try again?'
    const isPartial = runStatus.status !== 'completed'

    // Store conversation in database
    await supabase
      .from('conversation_messages')
      .insert([
        {
          thread_id: threadId,
          role: 'user',
          content: message,
          created_at: new Date().toISOString()
        },
        {
          thread_id: threadId,
          role: 'assistant',
          content: latestText,
          created_at: new Date().toISOString()
        }
      ])

    return new Response(JSON.stringify({ 
      thread_id: threadId,
      message: latestText,
      partial: isPartial
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Send message error:', error)
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function extractOnboardingData(openaiApiKey: string, threadId: string, userId: string, supabase: any) {
  try {
    // Get conversation history
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?limit=50`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    const messages = await messagesResponse.json()
    
    // Create conversation text
    const conversationText = messages.data
      .reverse()
      .map((msg: any) => `${msg.role}: ${msg.content[0].text.value}`)
      .join('\n')

    // Extract structured data using GPT
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Extract onboarding data from this conversation. Return ONLY valid JSON with these exact fields:
{
  "currentRole": "string",
  "industry": "string (optional)",
  "experienceLevels": {
    "ai_ml": "novice|beginner|intermediate|advanced|expert",
    "programming": "none|basic|intermediate|advanced|expert", 
    "math_stats": "basic|college|professional|advanced"
  },
  "primaryGoals": ["array of specific goals"],
  "learningTrack": "generalist|ml-engineer|data-scientist|ai-researcher|product-manager|entrepreneur",
  "timeAvailability": {
    "dailyHours": number,
    "weekendLearning": boolean,
    "preferredTimes": ["array of time slots"]
  },
  "learningPace": "intensive|steady|relaxed",
  "duration_days": 30|60|100|180,
  "motivation": ["array of motivations"],
  "learningStyles": ["visual|auditory|kinesthetic|reading"],
  "projectPreference": "theory-first|project-first|balanced",
  "note": "any additional context"
}

Use reasonable defaults if information is missing. Be conservative with experience levels.`
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        temperature: 0.1
      })
    })

    if (!extractionResponse.ok) {
      throw new Error(`Failed to extract data: ${extractionResponse.status}`)
    }

    const extractionResult = await extractionResponse.json()
    const extractedData = JSON.parse(extractionResult.choices[0].message.content)

    // Update thread status
    await supabase
      .from('conversation_threads')
      .update({ 
        status: 'completed',
        extracted_data: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('thread_id', threadId)
      .eq('user_id', userId)

    return new Response(JSON.stringify({ 
      thread_id: threadId,
      extracted_data: extractedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Extract data error:', error)
    return new Response(JSON.stringify({ error: 'Failed to extract onboarding data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}