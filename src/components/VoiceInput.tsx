import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Mic, MicOff, Send, Volume2 } from 'lucide-react'
import { useSpeechRecognition } from '../lib/speechRecognition'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onSend: () => void
  currentText: string
  onTextChange: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ 
  onTranscript, 
  onSend, 
  currentText, 
  onTextChange, 
  disabled 
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const {
    isSupported,
    startListening,
    stopListening,
    transcript,
    isListening: speechIsListening,
    error: speechError,
    resetTranscript
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (text: string, isFinal: boolean) => {
      onTextChange(text)
      if (isFinal) {
        onTranscript(text)
      }
    },
    onAudioLevel: setAudioLevel
  })

  useEffect(() => {
    setIsListening(speechIsListening)
  }, [speechIsListening])

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSend = () => {
    if (currentText.trim()) {
      onSend()
      // Clear buffers so interim events don't repopulate the box
      resetTranscript()
      onTextChange('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isSupported) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Voice input not supported in this browser. Type your message..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground placeholder:text-muted-foreground"
            rows={2}
            disabled={disabled}
          />
          <Button 
            onClick={handleSend}
            disabled={!currentText.trim() || disabled}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Voice input requires Chrome, Safari, or Edge browser
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Voice Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleToggleListening}
          disabled={disabled}
          variant={isListening ? "default" : "outline"}
          size="sm"
          className={`flex items-center gap-2 transition-all ${
            isListening ? 'bg-red-500 hover:bg-red-600' : ''
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start Listening
            </>
          )}
        </Button>

        {/* Audio Level Indicator */}
        {isListening && (
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded transition-all ${
                    audioLevel > i * 20 
                      ? 'bg-green-500' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleSend}
          disabled={!currentText.trim() || disabled}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Input/Display */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? "Listening... Speak your message" : "Click 'Start Listening' to use voice input, or type here"}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all bg-background text-foreground placeholder:text-muted-foreground ${
            isListening ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''
          }`}
          rows={3}
          disabled={disabled}
        />
        
        {isListening && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 text-red-500">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs">Recording</span>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {speechError && (
        <p className="text-xs text-red-600">
          Voice error: {speechError}
        </p>
      )}
      
      {isListening && (
        <p className="text-xs text-muted-foreground">
          💡 Tip: The message will auto-send when you finish speaking and pause
        </p>
      )}

      {!isListening && currentText && (
        <p className="text-xs text-muted-foreground">
          Press Enter to send, or Shift+Enter for new line
        </p>
      )}
    </div>
  )
}