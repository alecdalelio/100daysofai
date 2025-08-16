import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { callEdgeFunction } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, Mic, MicOff, Bot, User, Sparkles, Check, RotateCcw, MessageSquare } from 'lucide-react'
import { VoiceInput } from '@/components/VoiceInput'
import { useProgress } from '@/hooks/useProgress'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ApiResponse {
  thread_id?: string
  message?: string
  generated_log?: {
    title: string
    summary: string
    content: string
    tags: string[]
    tools: string[]
    minutes: number
    mood: string
  }
}

interface LogComposerProps {
  initial?: string
  initialData?: {
    day: number
    title: string
    summary: string
    content: string
    is_published: boolean
    tags?: string[]
    tools?: string[]
    minutes?: number
    mood?: string
  }
  onSave: (payload: {
    day: number
    title: string
    summary: string
    content: string
    is_published: boolean
    tags?: string[]
    tools?: string[]
    minutes?: number
    mood?: string
  }) => Promise<void>
}

export default function LogComposer({ initial = '', initialData, onSave }: LogComposerProps) {
  const { session } = useAuth()
  const { day: currentDay } = useProgress({ countDrafts: true })
  const nextDay = initialData ? initialData.day : currentDay + 1
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [showGeneratedLog, setShowGeneratedLog] = useState(false)
  const [generatedLog, setGeneratedLog] = useState<{
    title: string
    summary: string
    content: string
    tags: string[]
    tools: string[]
    minutes: number
    mood: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [chatComplete, setChatComplete] = useState(false)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    initializeConversation()
  }, [])

  // Initialize with existing data when editing
  useEffect(() => {
    if (initialData) {
      setGeneratedLog({
        title: initialData.title,
        summary: initialData.summary,
        content: initialData.content,
        tags: initialData.tags || [],
        tools: initialData.tools || [],
        minutes: initialData.minutes || 0,
        mood: initialData.mood || 'neutral'
      })
      setShowGeneratedLog(true)
    }
  }, [initialData])

  const initializeConversation = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await callEdgeFunction('conversational_log_composer', {
        body: { action: 'create_thread' }
      }) as ApiResponse

      setThreadId(result.thread_id!)
      setMessages([{
        role: 'assistant',
        content: result.message!,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to initialize conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to start conversation: ${errorMessage}. Please refresh the page or try again later.`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateLogEntry = useCallback(async () => {
    if (!threadId) return

    try {
      setIsLoading(true)
      
      // Convert messages to the format expected by the API
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const result = await callEdgeFunction('conversational_log_composer', {
        body: {
          action: 'generate_log',
          conversation_history: conversationHistory
        },
        timeoutMs: 45000
      }) as ApiResponse

      setGeneratedLog(result.generated_log!)
      setShowGeneratedLog(true)
    } catch (error) {
      console.error('Failed to generate log:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('JSON')) {
        setError('Failed to generate log entry due to formatting issue. Please try again or continue the conversation.')
      } else if (errorMessage.includes('timeout')) {
        setError('Request timed out while generating log. Please try again.')
      } else {
        setError(`Failed to generate your log entry: ${errorMessage}. Please continue the conversation or try again.`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [threadId, messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !threadId || isLoading || chatComplete) return

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    // Add user message to state immediately
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      console.log('[LogComposer] Sending message:', content.trim())
      
      // Get the updated messages array including the new user message
      const updatedMessages = [...messages, userMessage]
      
      // Convert messages to the format expected by the API
      const conversationHistory = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      console.log('[LogComposer] Calling edge function with history length:', conversationHistory.length)
      
      const result = await callEdgeFunction('conversational_log_composer', {
        body: {
          action: 'send_message',
          thread_id: threadId,
          message: content.trim(),
          conversation_history: conversationHistory
        },
        timeoutMs: 45000
      }) as ApiResponse

      console.log('[LogComposer] Received response:', result.message?.substring(0, 100) + '...')
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.message!,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if the assistant suggests generating a log
      // Only trigger if the AI explicitly says it has enough information
      if (result.message!.toLowerCase().includes('enough information') || 
          result.message!.toLowerCase().includes('ready to create') ||
          result.message!.toLowerCase().includes('let me generate') ||
          result.message!.toLowerCase().includes('create your log')) {
        setChatComplete(true)
        setTimeout(() => {
          generateLogEntry()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('timeout')) {
        setError('Request timed out. The AI service may be slow. Please try again.')
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(`Failed to send message: ${errorMessage}. Please try again.`)
      }
      
      // Remove the user message that was added optimistically if the request failed
      setMessages(prev => prev.slice(0, -1))
      
      // Store the message for retry
      setRetryMessage(content.trim())
    } finally {
      setIsLoading(false)
    }
  }, [threadId, messages, isLoading, chatComplete, generateLogEntry])

  const handleVoiceInput = useCallback((transcript: string) => {
    if (chatComplete) return
    setInput(transcript)
    // Auto-send if transcript seems complete (ends with punctuation)
    if (transcript.match(/[.!?]$/)) {
      sendMessage(transcript)
    }
  }, [sendMessage, chatComplete])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!chatComplete) {
      sendMessage(input)
    }
  }, [input, sendMessage, chatComplete])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!chatComplete) {
        sendMessage(input)
      }
    }
  }, [input, sendMessage, chatComplete])

  const handleSaveLog = useCallback(async () => {
    if (!generatedLog) return

    try {
      setIsPublishing(true)
      await onSave({
        day: nextDay,
        title: generatedLog.title,
        summary: generatedLog.summary,
        content: generatedLog.content,
        is_published: false,
        tags: generatedLog.tags,
        tools: generatedLog.tools,
        minutes: generatedLog.minutes,
        mood: generatedLog.mood
      })
    } catch (error) {
      console.error('Failed to save log:', error)
      setError('Failed to save your log entry. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }, [generatedLog, onSave, nextDay])

  const handleApproveAndPublish = useCallback(async () => {
    if (!generatedLog) return

    try {
      setIsPublishing(true)
      await onSave({
        day: nextDay,
        title: generatedLog.title,
        summary: generatedLog.summary,
        content: generatedLog.content,
        is_published: true,
        tags: generatedLog.tags,
        tools: generatedLog.tools,
        minutes: generatedLog.minutes,
        mood: generatedLog.mood
      })
    } catch (error) {
      console.error('Failed to save log:', error)
      setError('Failed to save your log entry. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }, [generatedLog, onSave, nextDay])

  const handleContinueChat = useCallback(() => {
    setShowGeneratedLog(false)
    setChatComplete(false)
  }, [])

  const handleStartOver = useCallback(() => {
    setMessages([])
    setInput('')
    setShowGeneratedLog(false)
    setGeneratedLog(null)
    setChatComplete(false)
    setError(null)
    initializeConversation()
  }, [initializeConversation])

  // Early return for generated log view
  if (showGeneratedLog && generatedLog) {
    return (
      <Card className="rounded-2xl border border-white/10 p-4 md:p-6 bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Day {nextDay} Log Entry Ready
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and edit your log entry, then approve to publish or continue chatting to refine it.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Day</label>
            <Input 
              value={nextDay} 
              disabled
              className="border-white/10 bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              value={generatedLog.title} 
              onChange={(e) => setGeneratedLog(prev => prev ? {...prev, title: e.target.value} : null)}
              className="border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Summary</label>
            <Input 
              value={generatedLog.summary} 
              onChange={(e) => setGeneratedLog(prev => prev ? {...prev, summary: e.target.value} : null)}
              className="border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea 
              value={generatedLog.content} 
              onChange={(e) => setGeneratedLog(prev => prev ? {...prev, content: e.target.value} : null)}
              rows={8}
              className="border-white/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={handleContinueChat}
              variant="outline"
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Keep Chatting
            </Button>
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Chat
            </Button>
            <Button
              onClick={handleSaveLog}
              disabled={isPublishing}
              variant="secondary"
              className="w-full"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={handleApproveAndPublish}
              disabled={isPublishing}
              className="w-full"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Approve & Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main chat interface
  return (
    <Card className="rounded-2xl border border-white/10 p-4 md:p-6 bg-zinc-900/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Log Assistant - Day {nextDay}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 border border-white/10'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-zinc-800 border border-white/10 rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              {retryMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    const messageToRetry = retryMessage
                    setRetryMessage(null)
                    sendMessage(messageToRetry)
                  }}
                  className="ml-2 h-8 px-3"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Chat Complete Notice */}
        {chatComplete && !showGeneratedLog && (
          <div className="text-blue-400 text-sm p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating your log entry...
            </div>
          </div>
        )}

        {/* Manual Generate Button - Show after several messages */}
        {messages.length >= 4 && !chatComplete && !showGeneratedLog && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => {
                setChatComplete(true)
                generateLogEntry()
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Log Entry Now
            </Button>
          </div>
        )}

        {/* Input - Disabled when chat is complete */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={chatComplete ? "Chat complete - generating log..." : "Tell me about your day..."}
              disabled={isLoading || chatComplete}
              className="pr-12 border-white/10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => !chatComplete && setIsVoiceMode(!isVoiceMode)}
              disabled={chatComplete}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || chatComplete}
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Voice Input */}
        {isVoiceMode && !chatComplete && (
          <VoiceInput 
            onTranscript={handleVoiceInput}
            onSend={() => sendMessage(input)}
            currentText={input}
            onTextChange={setInput}
            disabled={isLoading}
          />
        )}
      </CardContent>
    </Card>
  )
}