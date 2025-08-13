import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { callEdgeFunction } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Input } from './ui/input'
import { Loader2, Send, Mic, MicOff, Bot, User, Sparkles } from 'lucide-react'
import { VoiceInput } from './VoiceInput'
import { ConversationSummary } from './ConversationSummary'
import { EnhancedOnboardingData } from '../lib/onboardingTypes'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationalOnboardingProps {
  onComplete?: (data: EnhancedOnboardingData) => void
  onFallbackToForm?: () => void
}

export function ConversationalOnboarding({ 
  onComplete,
  onFallbackToForm 
}: ConversationalOnboardingProps) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [extractedData, setExtractedData] = useState<EnhancedOnboardingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    initializeConversation()
  }, [])

  const initializeConversation = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await callEdgeFunction('conversational_onboarding', {
        body: { action: 'create_thread' }
      })

      setThreadId(result.thread_id)
      setMessages([{
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to initialize conversation:', error)
      setError('Failed to start conversation. Please try again or use the traditional form.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || !threadId || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const result = await callEdgeFunction('conversational_onboarding', {
        body: {
          action: 'send_message',
          thread_id: threadId,
          message: content.trim()
        },
        timeoutMs: 45000
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.message + (result.partial ? ' (partial)' : ''),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if we should extract data (after several exchanges)
      if (messages.length >= 6) {
        setTimeout(() => {
          extractOnboardingData()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const extractOnboardingData = async () => {
    if (!threadId) return

    try {
      setIsLoading(true)
      const result = await callEdgeFunction('conversational_onboarding', {
        body: {
          action: 'extract_data',
          thread_id: threadId
        },
        timeoutMs: 45000
      })

      setExtractedData(result.extracted_data)
      setShowSummary(true)
    } catch (error) {
      console.error('Failed to extract data:', error)
      setError('Failed to extract your information. Please continue the conversation or use the traditional form.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = (transcript: string) => {
    setInput(transcript)
    // Auto-send if transcript seems complete (ends with punctuation)
    if (transcript.match(/[.!?]$/)) {
      sendMessage(transcript)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const finalizeSyllabus = async (finalData: EnhancedOnboardingData) => {
    try {
      setIsLoading(true)
      
      // Convert to legacy format for existing syllabus generation
      const legacyAnswers = {
        experience_level: finalData.experienceLevels.ai_ml,
        goals: finalData.primaryGoals,
        weekly_hours: finalData.weekly_hours || 7,
        duration_days: finalData.duration_days,
        focus_areas: finalData.specialization ? [finalData.specialization] : [],
        output_preferences: ['docs', 'code-first'],
        note: finalData.note,
        enhanced_data: finalData
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate_syllabus`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: legacyAnswers }),
        signal: AbortSignal.timeout(150000)
      })

      if (!response.ok) {
        throw new Error(`Failed to generate syllabus: ${response.status}`)
      }

      const { syllabus } = await response.json()
      if (!syllabus?.id) throw new Error('No syllabus ID returned')
      
      navigate(`/syllabus/${syllabus.id}`)
    } catch (error) {
      console.error('Failed to generate syllabus:', error)
      setError('Failed to generate your learning plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (showSummary && extractedData) {
    return (
      <ConversationSummary
        data={extractedData}
        onConfirm={finalizeSyllabus}
        onEdit={() => setShowSummary(false)}
        onFallbackToForm={onFallbackToForm}
        isLoading={isLoading}
        error={error}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl h-[78vh] md:h-[80vh] flex flex-col">
      <Card className="flex-1 flex flex-col shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Learning Coach
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className="flex items-center gap-2"
            >
              {isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isVoiceMode ? 'Text Mode' : 'Voice Mode'}
            </Button>
            {onFallbackToForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFallbackToForm}
              >
                Use Form Instead
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-primary">
                    <AvatarFallback>
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 bg-muted">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            {isVoiceMode ? (
              <VoiceInput
                onTranscript={handleVoiceInput}
                onSend={() => sendMessage(input)}
                currentText={input}
                onTextChange={setInput}
                disabled={isLoading}
              />
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
            
            {messages.length >= 4 && !showSummary && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={extractOnboardingData}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Generate My Learning Plan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}