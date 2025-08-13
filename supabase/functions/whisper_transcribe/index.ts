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

    // Check content type
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (file upload)
      const formData = await req.formData()
      const file = formData.get('audio') as File
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'No audio file provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate file type
      if (!file.type.startsWith('audio/')) {
        return new Response(JSON.stringify({ error: 'File must be an audio file' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate file size (max 25MB)
      const maxSize = 25 * 1024 * 1024 // 25MB
      if (file.size > maxSize) {
        return new Response(JSON.stringify({ error: 'File too large (max 25MB)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Call OpenAI Whisper API
      const form = new FormData()
      form.append('file', new Blob([buffer], { type: file.type }), file.name)
      form.append('model', 'whisper-1')
      form.append('response_format', 'json')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: form
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI Whisper API error:', response.status, errorText)
        throw new Error(`Whisper API error: ${response.status}`)
      }

      const result = await response.json()
      const transcript = result.text.trim()

      // Log telemetry
      console.log(`[whisper_transcribe] User ${user.id} transcribed ${file.size} bytes to ${transcript.length} chars`)

      return new Response(JSON.stringify({ 
        transcript,
        durationSec: result.duration || null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (contentType.includes('application/json')) {
      // Handle JSON with file path (for Supabase Storage files)
      const { filePath } = await req.json()
      
      if (!filePath || typeof filePath !== 'string') {
        return new Response(JSON.stringify({ error: 'filePath field is required and must be a string' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('logs')
        .download(filePath)

      if (downloadError || !fileData) {
        console.error('Storage download error:', downloadError)
        return new Response(JSON.stringify({ error: 'Failed to download audio file' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Convert to buffer
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Call OpenAI Whisper API
      const form = new FormData()
      form.append('file', new Blob([buffer], { type: fileData.type }), 'audio.webm')
      form.append('model', 'whisper-1')
      form.append('response_format', 'json')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: form
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI Whisper API error:', response.status, errorText)
        throw new Error(`Whisper API error: ${response.status}`)
      }

      const result = await response.json()
      const transcript = result.text.trim()

      // Log telemetry
      console.log(`[whisper_transcribe] User ${user.id} transcribed ${filePath} (${buffer.length} bytes) to ${transcript.length} chars`)

      return new Response(JSON.stringify({ 
        transcript,
        durationSec: result.duration || null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      return new Response(JSON.stringify({ error: 'Unsupported content type. Use multipart/form-data or application/json' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Whisper transcribe error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
