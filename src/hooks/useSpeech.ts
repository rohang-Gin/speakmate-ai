'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechReturn {
  isListening: boolean
  transcript: string
  startListening: (onFinal?: (text: string) => void) => void
  stopListening: () => void
  speak: (text: string, rate?: number) => void
  stopSpeaking: () => void
  isSpeaking: boolean
  supported: boolean
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedRef = useRef<string>('')
  const onFinalRef = useRef<((text: string) => void) | null>(null)
  const shouldRestartRef = useRef<boolean>(false)
  const hasSentRef = useRef<boolean>(false)

  useEffect(() => {
    const hasSpeechRecognition =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasSpeechSynthesis = 'speechSynthesis' in window
    setSupported(hasSpeechRecognition && hasSpeechSynthesis)
    if (hasSpeechSynthesis) synthRef.current = window.speechSynthesis
  }, [])

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const sendFinal = useCallback(() => {
    if (hasSentRef.current) return
    const text = accumulatedRef.current.trim()
    if (text) {
      hasSentRef.current = true
      shouldRestartRef.current = false
      setTranscript(text)
      onFinalRef.current?.(text)
      accumulatedRef.current = ''
    }
    setIsListening(false)
    recognitionRef.current?.stop()
  }, [])

  const createRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    const mobile = isMobile()

    // Mobile browsers don't support continuous well — use non-continuous + restart loop
    recognition.continuous = !mobile
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearSilenceTimer()

      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          accumulatedRef.current += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      const displayText = accumulatedRef.current + interimText
      setTranscript(displayText.trim())

      // On mobile with non-continuous mode, send as soon as we get a final result
      if (mobile && accumulatedRef.current.trim()) {
        silenceTimerRef.current = setTimeout(() => sendFinal(), 800)
      } else {
        silenceTimerRef.current = setTimeout(() => sendFinal(), 1800)
      }
    }

    recognition.onend = () => {
      // If we should restart (still listening, haven't sent yet), restart recognition
      if (shouldRestartRef.current && !hasSentRef.current) {
        const text = accumulatedRef.current.trim()
        if (text) {
          // We have accumulated text — restart without clearing it
          try {
            const newRecognition = createRecognition()
            recognitionRef.current = newRecognition
            newRecognition.start()
          } catch {
            // If restart fails, just send what we have
            sendFinal()
          }
        } else {
          // Nothing accumulated yet — restart cleanly to keep listening
          try {
            const newRecognition = createRecognition()
            recognitionRef.current = newRecognition
            newRecognition.start()
          } catch {
            setIsListening(false)
            shouldRestartRef.current = false
          }
        }
      } else if (!hasSentRef.current && accumulatedRef.current.trim()) {
        sendFinal()
      } else if (!shouldRestartRef.current) {
        setIsListening(false)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        // On mobile, no-speech ends the session — restart if we should still be listening
        if (shouldRestartRef.current && !hasSentRef.current) {
          try {
            const newRecognition = createRecognition()
            recognitionRef.current = newRecognition
            newRecognition.start()
          } catch {
            setIsListening(false)
            shouldRestartRef.current = false
          }
        }
        return
      }
      if (event.error === 'aborted') return
      console.error('Speech recognition error:', event.error)
      clearSilenceTimer()
      shouldRestartRef.current = false
      setIsListening(false)
    }

    return recognition
  }, [sendFinal])

  const startListening = useCallback((onFinal?: (text: string) => void) => {
    if (!supported) return

    // Stop AI speaking when user starts talking
    synthRef.current?.cancel()
    setIsSpeaking(false)

    onFinalRef.current = onFinal || null
    accumulatedRef.current = ''
    hasSentRef.current = false
    shouldRestartRef.current = true
    clearSilenceTimer()

    // Stop any existing recognition first
    try { recognitionRef.current?.stop() } catch { /* ignore */ }

    const recognition = createRecognition()
    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (e) {
      console.error('Failed to start recognition:', e)
      shouldRestartRef.current = false
      setIsListening(false)
    }
  }, [supported, createRecognition])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
    shouldRestartRef.current = false
    hasSentRef.current = true
    recognitionRef.current?.stop()
    setIsListening(false)
    accumulatedRef.current = ''
  }, [])

  const speak = useCallback((text: string, rate = 0.92) => {
    if (!synthRef.current) return
    synthRef.current.cancel()

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.pitch = 1
    utterance.volume = 1

    const voices = synthRef.current.getVoices()
    const preferred =
      voices.find(v => v.lang === 'en-US' && v.name.includes('Google US English')) ||
      voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
      voices.find(v => v.lang === 'en-US' && !v.localService) ||
      voices.find(v => v.lang.startsWith('en'))

    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }, [])

  return { isListening, transcript, startListening, stopListening, speak, stopSpeaking, isSpeaking, supported }
}
