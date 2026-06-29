'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, Mic, MicOff, Send, Volume2, VolumeX,
  RotateCcw, ChevronRight, AlertCircle, Lightbulb, Sparkles
} from 'lucide-react'

function checkIsMobile() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}
import { ConversationConfig } from '@/app/page'
import { useConversation } from '@/hooks/useConversation'
import { useSpeech } from '@/hooks/useSpeech'
import { Message, SessionReport } from '@/types'
import { getVoicePreferences, VoicePreferences, saveConversation } from '@/lib/storage'
import SessionReportCard from './SessionReportCard'
import { CONVERSATION_STARTERS } from '@/lib/constants'

interface Props {
  config: ConversationConfig
  onBack: () => void
}

export default function ConversationScreen({ config, onBack }: Props) {
  const [input, setInput] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [waitingForTap, setWaitingForTap] = useState(false)
  const [voicePrefs, setVoicePrefs] = useState<VoicePreferences>({ accent: 'indian', gender: 'female' })
  const [wpm, setWpm] = useState(0)
  const sessionStartRef = useRef<number | null>(null)
  const totalUserWordsRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isLoading, sessionScore, isSessionEnded, sendMessage, clearSession, resetInactivityTimer } =
    useConversation({
      mode: config.mode,
      roleplayContext: config.scenario
        ? `You are acting as: ${config.scenario.aiRole}\nContext: ${config.scenario.context}`
        : undefined,
      interviewContext: config.interview
        ? `You are conducting a ${config.interview.title}. Topic areas: ${config.interview.description}. Ask professional interview questions one at a time.`
        : undefined,
      onSessionEnd: (report) => setSessionReport(report),
    })

  const { isListening, transcript, startListening, stopListening, speak, stopSpeaking, supported } = useSpeech()

  useEffect(() => {
    setIsMobile(checkIsMobile())
    setVoicePrefs(getVoicePreferences())
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  // Show interim transcript in input while user is speaking
  useEffect(() => { if (isListening && transcript) setInput(transcript) }, [transcript, isListening])

  useEffect(() => {
    if (!hasStarted && messages.length === 0) {
      setHasStarted(true)
      const startingMsg = config.scenario?.startingPrompt ||
        config.missionPrompt ||
        CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)]
      setTimeout(() => {
        sendMessage(`[SYSTEM: Start the conversation. Use this as your opening: "${startingMsg}". Respond in JSON format as instructed.]`)
      }, 800)
    }
  }, [hasStarted, messages.length, config, sendMessage])

  const doStartListening = useCallback(() => {
    startListening((finalText) => {
      setWaitingForTap(false)
      stopSpeaking()
      sendMessage(finalText)
      setInput('')
    })
  }, [startListening, stopSpeaking, sendMessage])

  // On mobile: if mic stops without sending, bring the tap button back
  useEffect(() => {
    if (isMobile && waitingForTap && !isListening && !aiSpeaking && !isLoading) {
      // mic ended without result — keep button visible so user can tap again
      setWaitingForTap(true)
    }
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isListening) setWaitingForTap(false)
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-speak AI message, then auto-activate mic when done
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && last.content) {
      const wordCount = last.content.split(' ').length
      const estimatedMs = (wordCount / 2.5) * 1000 + 1200

      const afterAiSpeaks = () => {
        setTimeout(() => {
          setAiSpeaking(false)
          if (!isListening) {
            if (isMobile) {
              // Mobile: can't auto-start mic — needs a user tap
              setWaitingForTap(true)
            } else {
              startListening((finalText) => {
                stopSpeaking()
                sendMessage(finalText)
                setInput('')
              })
            }
          }
        }, 600)
      }

      if (autoSpeak) {
        setAiSpeaking(true)
        speak(last.content, 0.92, voicePrefs.accent, voicePrefs.gender)
        setTimeout(afterAiSpeaks, estimatedMs)
      } else {
        afterAiSpeaks()
      }
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length > 1) resetInactivityTimer(sendMessage)
  }, [messages, resetInactivityTimer, sendMessage])

  // WPM tracking — update whenever a user message is added
  useEffect(() => {
    const userMsgs = messages.filter(m => m.role === 'user' && m.content && !m.content.startsWith('[SYSTEM'))
    if (userMsgs.length === 0) return
    if (!sessionStartRef.current) sessionStartRef.current = Date.now()
    totalUserWordsRef.current = userMsgs.reduce((acc, m) => acc + m.content.trim().split(/\s+/).length, 0)
    const elapsedMin = (Date.now() - sessionStartRef.current) / 60000
    if (elapsedMin > 0) setWpm(Math.round(totalUserWordsRef.current / elapsedMin))
  }, [messages])

  // Save conversation when session ends
  useEffect(() => {
    if (isSessionEnded && messages.length > 0) {
      const userMsgs = messages.filter(m => m.role === 'user' && m.content && !m.content.startsWith('[SYSTEM'))
      const duration = sessionStartRef.current ? (Date.now() - sessionStartRef.current) / 1000 : 0
      saveConversation({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: config.title,
        mode: config.mode,
        messages: messages
          .filter(m => m.content && !m.content.startsWith('[SYSTEM'))
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        score: sessionScore,
        duration,
        wordCount: totalUserWordsRef.current,
        wpm,
      })
    }
  }, [isSessionEnded]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    const text = input.trim()
    if (!text || isLoading) return
    stopSpeaking()
    setAiSpeaking(false)
    sendMessage(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleRestart = () => { clearSession(); setSessionReport(null); setHasStarted(false) }

  const handleBack = () => {
    if (messages.filter(m => m.content && !m.content.startsWith('[SYSTEM')).length > 0) {
      const confirmed = window.confirm('End this session and go back to home?\n\nYour progress will be saved.')
      if (!confirmed) return
    }
    stopSpeaking()
    stopListening()
    onBack()
  }

  if (sessionReport) return <SessionReportCard report={sessionReport} onBack={onBack} onRestart={handleRestart} />

  const scoreColor = (v: number) => v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-blue-400' : 'text-yellow-400'
  const scoreBg   = (v: number) => v >= 80 ? 'bg-emerald-500/15 border-emerald-500/30' : v >= 60 ? 'bg-blue-500/15 border-blue-500/30' : 'bg-yellow-500/15 border-yellow-500/30'

  return (
    <div className="min-h-screen flex flex-col bg-[#06080f]">

      {/* Fixed background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full bg-indigo-600/08 blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={handleBack} className="p-2 rounded-xl glass-light hover:bg-white/08 text-slate-400 transition-all">
          <ArrowLeft size={19} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm truncate">{config.title}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${
              isLoading   ? 'bg-yellow-400 animate-pulse' :
              isListening ? 'bg-red-400 animate-pulse' :
              aiSpeaking  ? 'bg-blue-400 animate-pulse' :
              'bg-emerald-400'
            }`} />
            <p className="text-xs font-medium">
              {isLoading   ? <span className="text-yellow-400">🤔 Coach is thinking...</span> :
               isListening ? <span className="text-red-400">🎤 Listening — speak now</span> :
               aiSpeaking  ? <span className="text-blue-400">🔊 AI is speaking...</span> :
               <span className="text-emerald-400">✅ Ready — speak or type</span>}
            </p>
          </div>
        </div>

        {/* AI Voice toggle with clear label */}
        <button
          onClick={() => { if (autoSpeak) stopSpeaking(); setAutoSpeak(!autoSpeak) }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
            autoSpeak
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}>
          {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="text-[9px] font-semibold leading-none">
            {autoSpeak ? 'AI ON' : 'MUTED'}
          </span>
        </button>

        <button onClick={handleRestart} className="p-2 rounded-xl glass-light text-slate-500 hover:text-slate-300 transition-all">
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Score chips */}
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto">
        {[
          { label: 'Grammar',    value: sessionScore.grammar },
          { label: 'Vocab',      value: sessionScore.vocabulary },
          { label: 'Fluency',    value: sessionScore.fluency },
          { label: 'Confidence', value: sessionScore.confidence },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border whitespace-nowrap ${scoreBg(s.value)}`}>
            <span className="text-slate-400">{s.label}</span>
            <span className={`font-black ${scoreColor(s.value)}`}>{s.value}</span>
          </div>
        ))}
        {wpm > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border whitespace-nowrap ${
            wpm >= 120 ? 'bg-emerald-500/15 border-emerald-500/30' :
            wpm >= 80  ? 'bg-blue-500/15 border-blue-500/30' :
                         'bg-yellow-500/15 border-yellow-500/30'
          }`}>
            <span className="text-slate-400">Speed</span>
            <span className={`font-black ${wpm >= 120 ? 'text-emerald-400' : wpm >= 80 ? 'text-blue-400' : 'text-yellow-400'}`}>{wpm} wpm</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {messages.filter(m => m.content && !m.content.startsWith('[SYSTEM')).length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 float"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={28} className="text-white" />
            </div>
            <p className="text-slate-300 font-semibold text-lg">Starting your session...</p>
            <p className="text-slate-600 text-sm mt-2">Your AI coach is getting ready</p>
          </div>
        )}

        {messages.filter(m => m.content && !m.content.startsWith('[SYSTEM')).map(msg => (
          <MessageBubble key={msg.id} message={msg} onReplay={(text) => { stopSpeaking(); speak(text, 0.92, voicePrefs.accent, voicePrefs.gender) }} />
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              AI
            </div>
            <div className="glass-light rounded-2xl rounded-tl-sm px-5 py-3.5 flex gap-1.5 items-center"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>


      {/* Mobile: Tap to Speak button */}
      {isMobile && waitingForTap && !aiSpeaking && (
        <div className="px-4 pb-2 flex justify-center">
          <button
            onClick={doStartListening}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
            style={isListening
              ? { background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 0 30px rgba(22,163,74,0.5)' }
              : { background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            {isListening ? 'Listening... tap to stop' : 'Tap to Speak'}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3"
        style={{ background: 'rgba(6,8,15,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {aiSpeaking && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-0.5 rounded-full bg-indigo-400"
                  style={{ height: `${8 + (i % 2) * 8}px`, animation: `typing 0.8s ${i * 0.1}s ease-in-out infinite` }} />
              ))}
            </div>
            <span className="text-indigo-400 text-xs font-medium">AI speaking</span>
            <button onClick={stopSpeaking} className="text-slate-500 text-xs hover:text-slate-300 ml-auto transition-colors">stop</button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '🔴 Listening...' : 'Type or speak your message...'}
            rows={1}
            className="flex-1 text-white placeholder-slate-600 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 max-h-32"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '44px' }}
          />
          {supported && (
            <button onClick={() => {
              if (isListening) {
                stopListening()
                setWaitingForTap(false)
              } else {
                setInput('')
                setWaitingForTap(false)
                startListening((finalText) => {
                  stopSpeaking()
                  sendMessage(finalText)
                  setInput('')
                })
              }
            }}
              className={`p-3 rounded-2xl flex-shrink-0 transition-all relative ${
                isListening
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={isListening
                ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }
                : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {isListening && <span className="absolute inset-0 rounded-2xl bg-red-500 opacity-30 pulse-ring" />}
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-2xl flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed btn-primary text-white">
            <Send size={19} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, onReplay }: { message: Message, onReplay?: (text: string) => void }) {
  const [showCorrection, setShowCorrection] = useState(true)
  const [isReplaying, setIsReplaying] = useState(false)
  const isUser = message.role === 'user'

  const handleReplay = () => {
    if (!message.content || isReplaying) return
    setIsReplaying(true)
    onReplay?.(message.content)
    // Reset icon after estimated speech duration
    const ms = (message.content.split(' ').length / 2.5) * 1000 + 500
    setTimeout(() => setIsReplaying(false), ms)
  }

  return (
    <div className={`flex gap-3 slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
        isUser
          ? 'bg-emerald-600 text-white'
          : ''
      }`}
        style={!isUser ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
        {isUser ? 'You' : 'AI'}
      </div>

      <div className={`flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'text-white rounded-tr-sm'
            : 'text-slate-100 rounded-tl-sm'
        }`}
          style={isUser
            ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.3)' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {message.content}
          {!isUser && (
            <button
              onClick={handleReplay}
              className="mt-2 flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: isReplaying ? '#818cf8' : '#475569' }}>
              {isReplaying
                ? <><Volume2 size={13} className="animate-pulse" /> Playing...</>
                : <><Volume2 size={13} /> Replay</>}
            </button>
          )}
        </div>

        {/* Follow-up questions */}
        {!isUser && message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="space-y-1.5 max-w-[85%]">
            {message.followUpQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-400 px-1">
                <ChevronRight size={11} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                <span className="italic">{q}</span>
              </div>
            ))}
          </div>
        )}

        {/* Grammar Correction */}
        {message.grammarCorrection && showCorrection && (
          <div className="max-w-[90%] rounded-2xl p-4 space-y-2.5"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={13} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wide">Grammar Tip</span>
              </div>
              <button onClick={() => setShowCorrection(false)} className="text-slate-600 text-xs hover:text-slate-400 transition-colors">dismiss</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-red-400 font-semibold w-16 flex-shrink-0">You said:</span>
                <span className="text-slate-400 line-through">{message.grammarCorrection.original}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-semibold w-16 flex-shrink-0">Correct:</span>
                <span className="text-emerald-300 font-medium">{message.grammarCorrection.corrected}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-400 font-semibold w-16 flex-shrink-0">Why:</span>
                <span className="text-slate-300">{message.grammarCorrection.explanation}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400 font-semibold w-16 flex-shrink-0">Native:</span>
                <span className="text-purple-300 italic">"{message.grammarCorrection.nativeSpeakerVersion}"</span>
              </div>
            </div>
          </div>
        )}

        {/* Vocab Suggestions */}
        {message.vocabSuggestions && message.vocabSuggestions.length > 0 && (
          <div className="max-w-[90%] rounded-2xl p-4"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Lightbulb size={13} className="text-purple-400" />
              <span className="text-purple-400 text-xs font-bold uppercase tracking-wide">Better Vocabulary</span>
            </div>
            {message.vocabSuggestions.map((v, i) => (
              <div key={i} className="text-xs mb-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-slate-500">Instead of</span>
                <span className="text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded-md">"{v.original}"</span>
                <span className="text-slate-500">try:</span>
                {v.alternatives.map((alt, j) => (
                  <span key={j} className="text-purple-300 bg-purple-900/30 border border-purple-700/30 px-1.5 py-0.5 rounded-md">{alt}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
