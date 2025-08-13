import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onAudioLevel?: (level: number) => void
}

interface SpeechRecognitionHook {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onAudioLevel
  } = options

  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const finalBufferRef = useRef<string>('')
  const interimRef = useRef<string>('')

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
    } else {
      setIsSupported(false)
    }
  }, [])

  // Setup speech recognition
  useEffect(() => {
    if (!recognitionRef.current) return

    const recognition = recognitionRef.current

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
      stopAudioAnalysis()
    }

    recognition.onerror = (event: any) => {
      setError(event.error)
      setIsListening(false)
      stopAudioAnalysis()
    }

    recognition.onresult = (event: any) => {
      let gotFinal = false
      interimRef.current = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalBufferRef.current += result[0].transcript
          gotFinal = true
        } else {
          interimRef.current += result[0].transcript
        }
      }

      const full = finalBufferRef.current + interimRef.current
      setTranscript(full)
      onResult?.(full, gotFinal)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [continuous, interimResults, lang, onResult])

  // Audio level monitoring
  const startAudioAnalysis = useCallback(async () => {
    if (!onAudioLevel) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      microphoneRef.current.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateAudioLevel = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)
        
        // Calculate average volume level
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const averageLevel = sum / bufferLength
        const normalizedLevel = Math.min(100, (averageLevel / 255) * 100)
        
        onAudioLevel(normalizedLevel)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }

      updateAudioLevel()
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Could not access microphone')
    }
  }, [onAudioLevel])

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
      microphoneRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current = null
    }

    if (onAudioLevel) {
      onAudioLevel(0)
    }
  }, [onAudioLevel])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    setError(null)
    setTranscript('')
    finalBufferRef.current = ''
    interimRef.current = ''
    
    try {
      recognitionRef.current.start()
      startAudioAnalysis()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setError('Failed to start speech recognition')
    }
  }, [isListening, startAudioAnalysis])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return

    try {
      setIsListening(false)
      recognitionRef.current.stop()
      // Some browsers need abort() to cancel immediately
      try { recognitionRef.current.abort?.() } catch {}
      stopAudioAnalysis()
    } catch (error) {
      console.error('Error stopping speech recognition:', error)
    }
  }, [isListening, stopAudioAnalysis])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
      stopAudioAnalysis()
    }
  }, [stopListening, stopAudioAnalysis])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript: () => {
      setTranscript('')
      finalBufferRef.current = ''
      interimRef.current = ''
    }
  }
}