'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechReturn {
  isListening: boolean
  transcript: string
  startListening: (onFinal?: (text: string) => void) => void
  stopListening: () => void
  speak: (text: string, rate?: number, accent?: 'indian' | 'default', gender?: 'male' | 'female') => void
  stopSpeaking: () => void
  isSpeaking: boolean
  supported: boolean
  lastError: string
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
  const [lastError, setLastError] = useState('')
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

      // Wait for silence before sending — longer pause = user finished speaking
      silenceTimerRef.current = setTimeout(() => sendFinal(), mobile ? 2500 : 2800)
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
      setLastError(`err:${event.error} @${new Date().toLocaleTimeString()}`)
      if (event.error === 'no-speech') {
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
      clearSilenceTimer()
      shouldRestartRef.current = false
      setIsListening(false)
    }

    return recognition
  }, [sendFinal])

  const startListening = useCallback(async (onFinal?: (text: string) => void) => {
    if (!supported) return

    synthRef.current?.cancel()
    setIsSpeaking(false)

    onFinalRef.current = onFinal || null
    accumulatedRef.current = ''
    hasSentRef.current = false
    shouldRestartRef.current = true
    clearSilenceTimer()

    try { recognitionRef.current?.stop() } catch { /* ignore */ }

    const recognition = createRecognition()
    recognitionRef.current = recognition

    // Request mic permission explicitly first — this triggers the browser popup
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop()) // release immediately, we just needed permission
    } catch (e) {
      setLastError(`mic-permission-denied: ${e}`)
      shouldRestartRef.current = false
      setIsListening(false)
      return
    }

    try {
      recognition.start()
      setLastError('start() called...')
    } catch (e) {
      setLastError(`start() threw: ${e}`)
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

  const speak = useCallback((text: string, rate = 0.92, accent: 'indian' | 'default' = 'indian', gender: 'male' | 'female' = 'female') => {
    if (!synthRef.current) return
    synthRef.current.cancel()

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = rate
    utterance.volume = 1

    const voices = synthRef.current.getVoices()
    const isFemale = gender === 'female'
    const isIndian = accent === 'indian'

    const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'samantha', 'karen', 'victoria', 'moira', 'veena', 'raveena']
    const maleKeywords   = ['male', 'man', 'david', 'mark', 'daniel', 'alex', 'tom', 'fred', 'george', 'rishi']

    const matchesGender = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase()
      return isFemale ? femaleKeywords.some(k => n.includes(k)) : maleKeywords.some(k => n.includes(k))
    }

    let preferred: SpeechSynthesisVoice | undefined

    if (isIndian) {
      // Try Indian English with correct gender
      preferred = voices.find(v => v.lang === 'en-IN' && matchesGender(v))
      // Any Indian English voice
      if (!preferred) preferred = voices.find(v => v.lang === 'en-IN')
      // Indian Hindi voice as fallback
      if (!preferred) preferred = voices.find(v => v.lang === 'hi-IN')
    }

    if (!preferred) {
      // en-US with gender match
      preferred = voices.find(v => v.lang === 'en-US' && matchesGender(v))
      // Any en-US voice
      if (!preferred) preferred = voices.find(v => v.lang === 'en-US' && !v.localService)
      if (!preferred) preferred = voices.find(v => v.lang.startsWith('en') && matchesGender(v))
      if (!preferred) preferred = voices.find(v => v.lang.startsWith('en'))
    }

    if (preferred) {
      utterance.voice = preferred
      utterance.lang = preferred.lang
    } else {
      utterance.lang = isIndian ? 'en-IN' : 'en-US'
    }

    // Pitch as gender fallback when no named gender voice found
    utterance.pitch = isFemale ? 1.2 : 0.85

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }, [])

  return { isListening, transcript, startListening, stopListening, speak, stopSpeaking, isSpeaking, supported, lastError }
}
