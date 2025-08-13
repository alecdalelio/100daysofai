import { callEdgeFunction } from './supabase'
import { useToast } from '@/hooks/use-toast'

// Types for AI function responses
export interface EnhanceResponse {
  enhanced: string
}

export interface ExpandResponse {
  draft: string
}

export interface SummarizeResponse {
  tldr: string
}

export interface ExtractResponse {
  tags: string[]
  tools: string[]
  minutes: number | null
  mood: '😄' | '😊' | '🙂' | '😐' | '😕' | '😫' | null
}

export interface TranscribeResponse {
  transcript: string
  durationSec?: number
}

// AI enhancement function
export async function enhanceText(
  text: string, 
  style: 'neutral' | 'casual' | 'concise' = 'neutral'
): Promise<string> {
  try {
    const result = await callEdgeFunction<EnhanceResponse>('ai_enhance', {
      body: { text, style },
      timeoutMs: 30000
    })
    return result.enhanced
  } catch (error) {
    console.error('AI enhance error:', error)
    throw new Error('Failed to enhance text. Please try again.')
  }
}

// AI expand function
export async function expandBullets(bullets: string): Promise<string> {
  try {
    const result = await callEdgeFunction<ExpandResponse>('ai_expand', {
      body: { bullets },
      timeoutMs: 30000
    })
    return result.draft
  } catch (error) {
    console.error('AI expand error:', error)
    throw new Error('Failed to expand bullets. Please try again.')
  }
}

// AI summarize function
export async function summarizeText(text: string): Promise<string> {
  try {
    const result = await callEdgeFunction<SummarizeResponse>('ai_summarize', {
      body: { text },
      timeoutMs: 15000
    })
    return result.tldr
  } catch (error) {
    console.error('AI summarize error:', error)
    throw new Error('Failed to generate summary. Please try again.')
  }
}

// AI extract function
export async function extractMetadata(text: string): Promise<ExtractResponse> {
  try {
    const result = await callEdgeFunction<ExtractResponse>('ai_extract', {
      body: { text },
      timeoutMs: 15000
    })
    return result
  } catch (error) {
    console.error('AI extract error:', error)
    throw new Error('Failed to extract metadata. Please try again.')
  }
}

// Whisper transcription function
export async function transcribeAudio(audioBlob: Blob): Promise<TranscribeResponse> {
  try {
    // Create form data
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    // Get auth token
    const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession())
    const token = session?.access_token

    if (!token) {
      throw new Error('Not authenticated')
    }

    // Call the edge function with multipart data
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whisper_transcribe`, {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Transcription failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    return result as TranscribeResponse
  } catch (error) {
    console.error('Transcribe error:', error)
    throw new Error('Failed to transcribe audio. Please try again.')
  }
}

// Upload audio to Supabase Storage and transcribe
export async function uploadAndTranscribe(
  audioBlob: Blob, 
  userId: string
): Promise<TranscribeResponse> {
  try {
    const { supabase } = await import('./supabase')
    
    // Generate file path
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const fileName = `${crypto.randomUUID()}.webm`
    const filePath = `audio/${userId}/${date}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('logs')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload audio file')
    }

    // Transcribe using the uploaded file
    const result = await callEdgeFunction<TranscribeResponse>('whisper_transcribe', {
      body: { filePath },
      timeoutMs: 60000
    })

    return result
  } catch (error) {
    console.error('Upload and transcribe error:', error)
    throw new Error('Failed to process audio. Please try again.')
  }
}

// Hook for AI operations with toast notifications
export function useAI() {
  const { toast } = useToast()

  const enhance = async (text: string, style: 'neutral' | 'casual' | 'concise' = 'neutral') => {
    try {
      toast({
        title: 'Enhancing text...',
        description: 'Improving clarity and tone...'
      })
      const result = await enhanceText(text, style)
      toast({
        title: 'Text enhanced!',
        description: 'Your text has been improved.',
        variant: 'default'
      })
      return result
    } catch (error) {
      toast({
        title: 'Enhancement failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const expand = async (bullets: string) => {
    try {
      toast({
        title: 'Expanding bullets...',
        description: 'Converting to coherent text...'
      })
      const result = await expandBullets(bullets)
      toast({
        title: 'Bullets expanded!',
        description: 'Your notes have been converted to a draft.',
        variant: 'default'
      })
      return result
    } catch (error) {
      toast({
        title: 'Expansion failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const summarize = async (text: string) => {
    try {
      toast({
        title: 'Generating summary...',
        description: 'Creating TL;DR...'
      })
      const result = await summarizeText(text)
      toast({
        title: 'Summary ready!',
        description: 'TL;DR generated successfully.',
        variant: 'default'
      })
      return result
    } catch (error) {
      toast({
        title: 'Summary failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const extract = async (text: string) => {
    try {
      toast({
        title: 'Extracting metadata...',
        description: 'Analyzing content...'
      })
      const result = await extractMetadata(text)
      toast({
        title: 'Metadata extracted!',
        description: `Found ${result.tags.length} tags and ${result.tools.length} tools.`,
        variant: 'default'
      })
      return result
    } catch (error) {
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const transcribe = async (audioBlob: Blob, userId: string) => {
    try {
      toast({
        title: 'Processing audio...',
        description: 'Uploading and transcribing...'
      })
      const result = await uploadAndTranscribe(audioBlob, userId)
      toast({
        title: 'Transcription complete!',
        description: 'Audio has been converted to text.',
        variant: 'default'
      })
      return result
    } catch (error) {
      toast({
        title: 'Transcription failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  return {
    enhance,
    expand,
    summarize,
    extract,
    transcribe
  }
}
