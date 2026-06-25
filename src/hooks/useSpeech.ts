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
    const text = accumulatedRef.current.trim()
    if (text) {
      setTranscript(text)
      onFinalRef.current?.(text)
      accumulatedRef.current = ''
    }
    setIsListening(false)
    recognitionRef.current?.stop()
  }, [])

  const startListening = useCallback((onFinal?: (text: string) => void) => {
    if (!supported) return

    // Stop AI speaking when user starts talking
    synthRef.current?.cancel()
    setIsSpeaking(false)

    onFinalRef.current = onFinal || null
    accumulatedRef.current = ''

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // continuous = true so it keeps listening through natural pauses
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      accumulatedRef.current = ''
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

      // Show what user is saying in real time
      const displayText = accumulatedRef.current + interimText
      setTranscript(displayText.trim())

      // Wait 1.8 seconds of silence before auto-sending
      silenceTimerRef.current = setTimeout(() => {
        sendFinal()
      }, 1800)
    }

    recognition.onend = () => {
      // If continuous mode ended unexpectedly, restart unless we already sent
      if (accumulatedRef.current.trim()) {
        sendFinal()
      } else {
        setIsListening(false)
      }
    }

    recognition.onerror = (event) => {
      // Ignore no-speech errors — just means user paused
      if (event.error === 'no-speech') return
      console.error('Speech recognition error:', event.error)
      clearSilenceTimer()
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [supported, sendFinal])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
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
