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

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface LogComposerProps {
  initial?: string
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

export default function LogComposer({ initial = '', onSave }: LogComposerProps) {
  const { session } = useAuth()
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

  const initializeConversation = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await callEdgeFunction('conversational_log_composer', {
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
      setError('Failed to start conversation. Please try again.')
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
      })

      setGeneratedLog(result.generated_log)
      setShowGeneratedLog(true)
    } catch (error) {
      console.error('Failed to generate log:', error)
      setError('Failed to generate your log entry. Please continue the conversation.')
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
      // Get the updated messages array including the new user message
      const updatedMessages = [...messages, userMessage]
      
      // Convert messages to the format expected by the API
      const conversationHistory = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const result = await callEdgeFunction('conversational_log_composer', {
        body: {
          action: 'send_message',
          thread_id: threadId,
          message: content.trim(),
          conversation_history: conversationHistory
        },
        timeoutMs: 45000
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if the assistant suggests generating a log
      // Only trigger if the AI explicitly says it has enough information
      if (result.message.toLowerCase().includes('enough information') || 
          result.message.toLowerCase().includes('ready to create') ||
          result.message.toLowerCase().includes('let me generate') ||
          result.message.toLowerCase().includes('create your log')) {
        setChatComplete(true)
        setTimeout(() => {
          generateLogEntry()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Failed to send message. Please try again.')
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
        day: 1, // This would be determined by the user or system
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
  }, [generatedLog, onSave])

  const handleContinueChat = useCallback(() => {
    setShowGeneratedLog(false)
    setChatComplete(false)
    setGeneratedLog(null)
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
            Generated Log Entry
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
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

          <div className="flex gap-4">
            <Button
              onClick={handleContinueChat}
              variant="outline"
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Continue Chat
            </Button>
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button
              onClick={handleSaveLog}
              disabled={isPublishing}
              className="flex-1"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Log
                </>
              )}
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
          AI Log Assistant
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
            {error}
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