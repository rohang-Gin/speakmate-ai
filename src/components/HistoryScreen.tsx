'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, MessageCircle, Clock, Zap, ChevronDown, ChevronUp, Mic } from 'lucide-react'
import { getConversations, SavedConversation } from '@/lib/storage'

interface Props { onBack: () => void }

export default function HistoryScreen({ onBack }: Props) {
  const [conversations, setConversations] = useState<SavedConversation[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { setConversations(getConversations()) }, [])

  const scoreColor = (v: number) => v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-blue-400' : 'text-yellow-400'
  const scoreBg   = (v: number) => v >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : v >= 60 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-yellow-500/10 border-yellow-500/30'

  return (
    <div className="min-h-screen bg-[#06080f] pb-10">
      <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="p-2 rounded-xl glass-light text-slate-400 hover:text-slate-200 transition-all">
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-white font-black text-lg">Conversation History</h1>
      </div>

      <div className="px-4 py-5 space-y-3">
        {conversations.length === 0 && (
          <div className="rounded-3xl p-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-5xl mb-4">💬</p>
            <p className="text-white font-bold text-lg">No conversations yet</p>
            <p className="text-slate-500 text-sm mt-2">Your past conversations will appear here</p>
          </div>
        )}

        {conversations.map(conv => {
          const isOpen = expanded === conv.id
          const date = new Date(conv.date)
          const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          const userMsgs = conv.messages.filter(m => m.role === 'user')
          const aiMsgs   = conv.messages.filter(m => m.role === 'assistant')

          return (
            <div key={conv.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

              {/* Header row */}
              <button className="w-full p-4 text-left" onClick={() => setExpanded(isOpen ? null : conv.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{conv.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{dateStr} · {timeStr}</p>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageCircle size={11} /> {userMsgs.length} replies
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={11} /> {Math.max(1, Math.round(conv.duration / 60))} min
                      </span>
                      {conv.wpm > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mic size={11} /> {conv.wpm} wpm
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-black border ${scoreBg(conv.score.overall)}`}>
                      <span className={scoreColor(conv.score.overall)}>{conv.score.overall}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </div>
              </button>

              {/* Scores */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Grammar',    value: conv.score.grammar },
                      { label: 'Vocab',      value: conv.score.vocabulary },
                      { label: 'Fluency',    value: conv.score.fluency },
                      { label: 'Overall',    value: conv.score.overall },
                    ].map(s => (
                      <div key={s.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border ${scoreBg(s.value)}`}>
                        <span className="text-slate-400">{s.label}</span>
                        <span className={`font-black ${scoreColor(s.value)}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Messages */}
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {conv.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-emerald-600 text-white' : ''
                        }`}
                          style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                          {msg.role === 'user' ? 'U' : 'AI'}
                        </div>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === 'user' ? 'text-white' : 'text-slate-200'
                        }`}
                          style={msg.role === 'user'
                            ? { background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.25)' }
                            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
