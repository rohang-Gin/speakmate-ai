'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Mic, CheckCircle, XCircle, Volume2, Star } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'
import { buildRepeatPracticePrompt } from '@/lib/groq'
import { getVoicePreferences } from '@/lib/storage'

interface Props {
  tense: string
  onBack: () => void
}

type Status = 'loading' | 'speaking' | 'showing' | 'listening' | 'evaluating'

interface SentenceItem {
  id: number
  target: string
  attempts: { text: string; correct: boolean }[]
  done: boolean   // true once user got it correct
}

interface TurnMessage {
  role: 'user' | 'assistant'
  content: string
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function getSimilarity(userSaid: string, target: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const wordsTarget = normalize(target).split(/\s+/)
  const wordsUser   = normalize(userSaid).split(/\s+/)
  const setTarget   = new Set(wordsTarget)
  const matches     = wordsUser.filter(w => setTarget.has(w)).length
  return matches / wordsTarget.length
}

export default function RepeatPracticeScreen({ tense, onBack }: Props) {
  const [sentences, setSentences]   = useState<SentenceItem[]>([])
  const [status, setStatus]         = useState<Status>('loading')
  const [score, setScore]           = useState(0)
  const [waitingTap, setWaitingTap] = useState(false)
  const [debugLogs, setDebugLogs]   = useState<string[]>([])
  const sentenceIdRef  = useRef(0)
  const messagesRef    = useRef<TurnMessage[]>([])
  const voicePrefs     = useRef(getVoicePreferences())
  const mobile         = useRef(isMobileDevice())
  const bottomRef      = useRef<HTMLDivElement>(null)
  const activeTarget   = useRef<string | null>(null)

  const { speak, stopSpeaking, startListening, stopListening, supported } = useSpeech()

  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-IN', { hour12: false })
    const line = `[${ts}] ${msg}`
    console.log(line)
    setDebugLogs(prev => [...prev.slice(-19), line])
  }

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

  // ── Speak sentence then show mic ────────────────────────────────────
  const speakThenShow = useCallback((sentence: string, preamble = 'Repeat after me:') => {
    setStatus('speaking')
    const fullText = `${preamble} ${sentence}`
    speak(fullText, 0.85, voicePrefs.current.accent, voicePrefs.current.gender)
    const ms = (fullText.split(' ').length / 2.5) * 1000 + 800
    log(`speakThenShow: will show mic in ${ms}ms`)
    setTimeout(() => {
      setStatus('showing')
      if (mobile.current) setWaitingTap(true)
    }, ms)
  }, [speak]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch next sentence from AI ─────────────────────────────────────
  const fetchSentence = useCallback(async (prevMsg?: string) => {
    setStatus('loading')
    log(`fetchSentence called. prevMsg=${prevMsg ?? 'none'}`)
    if (prevMsg) messagesRef.current.push({ role: 'user', content: prevMsg })

    try {
      log('Calling /api/chat ...')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current,
          systemPrompt: buildRepeatPracticePrompt(tense),
          mode: 'repeat-practice',
          level: 'beginner',
        }),
      })

      log(`API response status: ${res.status}`)
      const data = await res.json()
      log(`Raw data keys: ${Object.keys(data).join(', ')}`)
      log(`data.content type: ${typeof data.content} | data.message type: ${typeof data.message}`)

      let parsed: { message: string; targetSentence?: string | null }
      try {
        parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data
        log(`Parsed OK. message="${parsed.message?.slice(0,60)}" targetSentence="${parsed.targetSentence}"`)
      } catch (e) {
        log(`JSON parse failed: ${e}. Fallback to raw.`)
        parsed = { message: data.content || data.message || '' }
      }

      messagesRef.current.push({ role: 'assistant', content: parsed.message })

      // Extract target sentence
      let target = parsed.targetSentence
      log(`targetSentence from parsed: "${target}"`)
      if (!target) {
        const match = parsed.message.match(/Repeat after me[:\s]+[""]?([^"""]+?)[""]?[.!]?\s*$/i)
        target = match?.[1]?.trim() ?? null
        log(`Regex extract: "${target}"`)
      }

      if (target) {
        log(`Got target sentence: "${target}" — adding to list`)
        sentenceIdRef.current += 1
        activeTarget.current = target
        setSentences(prev => [...prev, {
          id: sentenceIdRef.current,
          target: target!,
          attempts: [],
          done: false,
        }])
        scrollToBottom()
        speakThenShow(target)
      } else {
        log(`ERROR: No target sentence found! message was: "${parsed.message?.slice(0, 100)}"`)
        setStatus('showing')
      }
    } catch (e) {
      log(`FETCH ERROR: ${e}`)
      setStatus('showing')
    }
  }, [tense, speakThenShow]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Evaluate user's attempt ─────────────────────────────────────────
  const evaluate = useCallback((finalText: string) => {
    const target = activeTarget.current
    if (!target || !finalText.trim()) {
      setStatus('showing')
      if (mobile.current) setWaitingTap(true)
      return
    }

    const correct = getSimilarity(finalText, target) >= 0.65
    setStatus('evaluating')

    // Record attempt on current sentence
    setSentences(prev => prev.map(s =>
      s.target === target && !s.done
        ? { ...s, attempts: [...s.attempts, { text: finalText, correct }], done: correct }
        : s
    ))
    scrollToBottom()

    if (correct) {
      setScore(n => n + 1)
      speak('Perfect! Well done!', 0.9, voicePrefs.current.accent, voicePrefs.current.gender)
      setTimeout(() => fetchSentence('[Correct! Give me the next sentence.]'), 2200)
    } else {
      speak(`Almost! Try again. Repeat after me: ${target}`, 0.85, voicePrefs.current.accent, voicePrefs.current.gender)
      const ms = ((target.split(' ').length + 8) / 2.5) * 1000 + 600
      setTimeout(() => {
        setStatus('showing')
        if (mobile.current) setWaitingTap(true)
        scrollToBottom()
      }, ms)
    }
  }, [speak, fetchSentence])

  // ── Start mic ────────────────────────────────────────────────────────
  const handleRepeat = useCallback(() => {
    if (!supported) return
    setWaitingTap(false)
    setStatus('listening')
    stopSpeaking()
    startListening((finalText) => evaluate(finalText))
  }, [supported, startListening, stopSpeaking, evaluate])

  // ── Auto-start mic on desktop ────────────────────────────────────────
  useEffect(() => {
    if (status === 'showing' && !mobile.current && supported) {
      const t = setTimeout(handleRepeat, 500)
      return () => clearTimeout(t)
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    voicePrefs.current = getVoicePreferences()
    fetchSentence()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentTarget = activeTarget.current

  return (
    <div className="min-h-screen flex flex-col bg-[#06080f]">

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="p-2 rounded-xl glass-light text-slate-400 transition-all">
          <ArrowLeft size={19} />
        </button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-sm">{tense}</h2>
          <p className="text-slate-500 text-xs">Repeat &amp; Learn</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)' }}>
          <Star size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 font-black text-sm">{score}</span>
        </div>
      </div>

      {/* Sentence list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Initial loading */}
        {sentences.length === 0 && status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white text-2xl font-black">AI</span>
            </div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <p className="text-slate-500 text-sm">Preparing your lesson...</p>
          </div>
        )}

        {sentences.map((s, idx) => {
          const isActive = !s.done && idx === sentences.length - 1

          return (
            <div key={s.id} className="space-y-2">

              {/* Sentence number + target */}
              <div className={`rounded-2xl p-4 ${isActive ? 'rounded-3xl p-5' : ''}`}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    #{idx + 1}
                  </span>
                  {s.done && <CheckCircle size={15} className="text-emerald-400" />}
                  {isActive && <span className="text-xs text-indigo-400 font-semibold">Repeat after me</span>}
                </div>
                <p className={`font-bold leading-relaxed ${isActive ? 'text-white text-xl' : 'text-slate-300 text-base'}`}>
                  "{s.target}"
                </p>
                {isActive && (
                  <button onClick={() => {
                    stopSpeaking()
                    speak(`Repeat after me: ${s.target}`, 0.82, voicePrefs.current.accent, voicePrefs.current.gender)
                  }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-indigo-300 transition-all"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <Volume2 size={12} /> Hear again
                  </button>
                )}
              </div>

              {/* Attempts for this sentence */}
              {s.attempts.map((attempt, ai) => (
                <div key={ai} className={`rounded-xl px-4 py-3 flex items-start gap-2.5`}
                  style={{
                    background: attempt.correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${attempt.correct ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                  {attempt.correct
                    ? <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle    size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 space-y-1">
                    <div className="flex gap-2 text-xs">
                      <span className="text-slate-500 w-16 flex-shrink-0">You said:</span>
                      <span className={attempt.correct ? 'text-emerald-300 font-semibold' : 'text-red-300 line-through'}>
                        "{attempt.text}"
                      </span>
                    </div>
                    {!attempt.correct && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-slate-500 w-16 flex-shrink-0">Correct:</span>
                        <span className="text-emerald-300 font-semibold">"{s.target}"</span>
                      </div>
                    )}
                    {attempt.correct && (
                      <p className="text-emerald-400 text-xs font-bold">✅ +1 point!</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {/* Loading next sentence */}
        {sentences.length > 0 && status === 'loading' && (
          <div className="flex items-center gap-2 py-2 px-4">
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <p className="text-slate-500 text-xs">Loading next sentence...</p>
          </div>
        )}

        <div ref={bottomRef} />

        {/* DEBUG PANEL */}
        <div className="mt-4 rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,0,0.2)' }}>
          <p className="text-yellow-400 text-xs font-bold mb-2">🐛 Debug Log</p>
          {debugLogs.length === 0
            ? <p className="text-slate-600 text-xs">No logs yet...</p>
            : debugLogs.map((l, i) => (
              <p key={i} className="text-green-400 text-xs font-mono leading-5 break-all">{l}</p>
            ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-4 py-3"
        style={{ background: 'rgba(6,8,15,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* AI speaking */}
        {status === 'speaking' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Volume2 size={17} className="text-blue-400 animate-pulse" />
            <p className="text-blue-400 text-sm font-medium">Listen carefully...</p>
          </div>
        )}

        {/* Listening */}
        {status === 'listening' && (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 24px rgba(239,68,68,0.5)' }}>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 pulse-ring" />
              <Mic size={28} className="text-white" />
            </div>
            <p className="text-red-400 text-xs font-semibold">Listening — speak now!</p>
            <button onClick={() => { stopListening(); setStatus('showing'); setWaitingTap(mobile.current) }}
              className="text-slate-600 text-xs hover:text-slate-400 transition-colors">Cancel</button>
          </div>
        )}

        {/* Mobile tap button */}
        {(status === 'showing' || status === 'evaluating') && mobile.current && waitingTap && currentTarget && (
          <button onClick={handleRepeat}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 24px rgba(239,68,68,0.4)' }}>
            <Mic size={22} /> Tap to Repeat
          </button>
        )}

        {/* Desktop button */}
        {status === 'showing' && !mobile.current && currentTarget && (
          <button onClick={handleRepeat}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Mic size={20} /> Click to Repeat
          </button>
        )}
      </div>
    </div>
  )
}
