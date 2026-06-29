'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Mic, MicOff, CheckCircle, XCircle, RefreshCw, Volume2 } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'
import { buildRepeatPracticePrompt } from '@/lib/groq'
import { getVoicePreferences } from '@/lib/storage'

interface Props {
  tense: string
  onBack: () => void
}

type Status = 'loading' | 'showing' | 'speaking' | 'listening' | 'processing' | 'feedback'

interface TurnMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function isMobile() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export default function RepeatPracticeScreen({ tense, onBack }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [targetSentence, setTargetSentence] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [waitingTap, setWaitingTap] = useState(false)
  const messagesRef = useRef<TurnMessage[]>([])
  const voicePrefs = useRef(getVoicePreferences())

  const { speak, stopSpeaking, startListening, stopListening, isListening, supported } = useSpeech()

  const callAI = useCallback(async (userText?: string) => {
    setStatus('processing')
    const systemPrompt = buildRepeatPracticePrompt(tense)

    if (userText) {
      messagesRef.current.push({ role: 'user', content: userText })
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current.filter(m => m.role !== 'system'),
          systemPrompt,
          mode: 'repeat-practice',
          level: 'beginner',
        }),
      })

      const data = await res.json()
      let parsed: {
        message: string
        targetSentence?: string | null
        isCorrect?: boolean | null
      }

      try {
        parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data
      } catch {
        parsed = { message: data.content || data.message || '' }
      }

      messagesRef.current.push({ role: 'assistant', content: parsed.message })

      setFeedbackText(parsed.message)
      setIsCorrect(parsed.isCorrect ?? null)

      if (parsed.targetSentence) {
        setTargetSentence(parsed.targetSentence)
      }

      if (parsed.isCorrect === true) {
        setCorrectCount(p => p + 1)
      }

      // Speak the feedback message
      setStatus('speaking')
      speak(parsed.message, 0.88, voicePrefs.current.accent, voicePrefs.current.gender)

      // After speaking, go to showing state
      const wordCount = parsed.message.split(' ').length
      const speakDuration = (wordCount / 2.5) * 1000 + 1000
      setTimeout(() => {
        setStatus('showing')
        if (isMobile()) setWaitingTap(true)
      }, speakDuration)

    } catch {
      setFeedbackText('Something went wrong. Please try again.')
      setStatus('showing')
    }
  }, [tense, speak])

  // Start session on mount
  useEffect(() => {
    voicePrefs.current = getVoicePreferences()
    callAI()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRepeat = useCallback(() => {
    if (!supported) return
    setWaitingTap(false)
    setStatus('listening')
    stopSpeaking()

    startListening((finalText) => {
      if (!finalText.trim()) {
        setStatus('showing')
        if (isMobile()) setWaitingTap(true)
        return
      }
      setTotalAttempts(p => p + 1)
      callAI(finalText)
    })
  }, [supported, startListening, stopSpeaking, callAI])

  // Auto-start mic on desktop after speaking
  useEffect(() => {
    if (status === 'showing' && !isMobile() && supported) {
      const t = setTimeout(() => {
        setStatus('listening')
        startListening((finalText) => {
          if (!finalText.trim()) {
            setStatus('showing')
            return
          }
          setTotalAttempts(p => p + 1)
          callAI(finalText)
        })
      }, 600)
      return () => clearTimeout(t)
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplaySentence = () => {
    if (!targetSentence) return
    stopSpeaking()
    speak(`Repeat after me: ${targetSentence}`, 0.85, voicePrefs.current.accent, voicePrefs.current.gender)
  }

  const statusLabel = () => {
    if (status === 'loading' || status === 'processing') return { text: 'AI is thinking...', color: 'text-yellow-400', dot: 'bg-yellow-400' }
    if (status === 'speaking') return { text: 'AI is speaking — listen carefully', color: 'text-blue-400', dot: 'bg-blue-400' }
    if (status === 'listening') return { text: 'Listening — repeat the sentence!', color: 'text-red-400', dot: 'bg-red-400' }
    return { text: 'Tap to repeat', color: 'text-emerald-400', dot: 'bg-emerald-400' }
  }

  const sl = statusLabel()

  return (
    <div className="min-h-screen flex flex-col bg-[#06080f]">

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="p-2 rounded-xl glass-light hover:bg-white/08 text-slate-400 transition-all">
          <ArrowLeft size={19} />
        </button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-sm">{tense}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full animate-pulse ${sl.dot}`} />
            <p className={`text-xs font-medium ${sl.color}`}>{sl.text}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="text-emerald-400">{correctCount} ✓</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-5 gap-4">

        {/* Target sentence card */}
        {targetSentence && (
          <div className="rounded-3xl p-6 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.4)' }}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Repeat after me</p>
            <p className="text-white text-xl font-bold leading-relaxed">"{targetSentence}"</p>
            <button onClick={handleReplaySentence}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs text-indigo-300 transition-all hover:text-indigo-200"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Volume2 size={13} />
              Hear it again
            </button>
          </div>
        )}

        {/* Feedback card */}
        {feedbackText && status !== 'loading' && (
          <div className={`rounded-2xl p-4 flex items-start gap-3`}
            style={{
              background: isCorrect === true
                ? 'rgba(34,197,94,0.08)' : isCorrect === false
                ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isCorrect === true ? 'rgba(34,197,94,0.3)' : isCorrect === false ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {isCorrect === true && <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
            {isCorrect === false && <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />}
            {isCorrect === null && <RefreshCw size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />}
            <p className={`text-sm leading-relaxed ${isCorrect === true ? 'text-emerald-300' : isCorrect === false ? 'text-red-300' : 'text-slate-200'}`}>
              {feedbackText}
            </p>
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white text-2xl font-black">AI</span>
            </div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-slate-500 text-sm">Preparing your lesson...</p>
          </div>
        )}

        <div className="flex-1" />

        {/* Mobile tap button */}
        {isMobile() && waitingTap && status === 'showing' && (
          <button onClick={handleRepeat}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}>
            <Mic size={26} />
            Tap to Repeat
          </button>
        )}

        {/* Listening indicator */}
        {status === 'listening' && (
          <div className="w-full flex flex-col items-center gap-3 py-4">
            <div className="relative w-20 h-20 flex items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 pulse-ring" />
              <Mic size={32} className="text-white" />
            </div>
            <p className="text-red-400 text-sm font-semibold">Listening... speak now</p>
            <button onClick={() => { stopListening(); setStatus('showing'); setWaitingTap(isMobile()) }}
              className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
              Cancel
            </button>
          </div>
        )}

        {/* Desktop mic button when showing */}
        {!isMobile() && status === 'showing' && (
          <button onClick={handleRepeat}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Mic size={22} />
            Click to Repeat
          </button>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <p className="text-slate-400 text-sm">Checking your answer...</p>
          </div>
        )}
      </div>
    </div>
  )
}
