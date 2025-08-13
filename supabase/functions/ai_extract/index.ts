import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Env = {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

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
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text field is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const systemPrompt = `You are an expert at extracting structured metadata from daily learning logs.

TASK: Analyze the text and extract specific metadata in JSON format only.

EXTRACTION RULES:
- tags: Array of lowercase topic tags (max 8, no spaces, use hyphens)
- tools: Array of specific tools/technologies mentioned (max 6)
- minutes: Number of minutes spent learning (extract from text, null if not mentioned)
- mood: One emoji from: 😄 😊 🙂 😐 😕 😫 (based on tone/content, null if neutral)

EXAMPLES:
- "Spent 2 hours learning React hooks" → minutes: 120
- "Built a neural network with PyTorch" → tools: ["pytorch"], tags: ["neural-networks", "machine-learning"]
- "Frustrated with debugging" → mood: 😕
- "Excited to deploy my first app" → mood: 😄

OUTPUT: Return ONLY valid JSON with these exact fields:
{
  "tags": ["array", "of", "lowercase", "tags"],
  "tools": ["array", "of", "tools"],
  "minutes": number|null,
  "mood": "😄"|"😊"|"🙂"|"😐"|"😕"|"😫"|null
}`

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices[0].message.content.trim()
    
    // Parse JSON response
    let extracted
    try {
      extracted = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content)
      throw new Error('Failed to parse extraction result')
    }

    // Validate structure
    if (!extracted.tags || !extracted.tools || !('minutes' in extracted) || !('mood' in extracted)) {
      throw new Error('Invalid extraction result structure')
    }

    // Ensure arrays and normalize
    const normalized = {
      tags: Array.isArray(extracted.tags) ? extracted.tags.slice(0, 8) : [],
      tools: Array.isArray(extracted.tools) ? extracted.tools.slice(0, 6) : [],
      minutes: typeof extracted.minutes === 'number' ? extracted.minutes : null,
      mood: ['😄', '😊', '🙂', '😐', '😕', '😫'].includes(extracted.mood) ? extracted.mood : null
    }

    // Log telemetry
    console.log(`[ai_extract] User ${user.id} extracted ${normalized.tags.length} tags, ${normalized.tools.length} tools, ${normalized.minutes}min, mood: ${normalized.mood}`)

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI extract error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
