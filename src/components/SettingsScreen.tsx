'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Brain, Volume2, Trash2, ChevronRight, Sparkles } from 'lucide-react'
import { getUserLevel, updateUserLevel, saveProgress, getDefaultProgress, getVoicePreferences, saveVoicePreferences, VoicePreferences } from '@/lib/storage'
import { DifficultyLevel } from '@/types'

interface Props { onBack: () => void }

export default function SettingsScreen({ onBack }: Props) {
  const [level, setLevel] = useState<DifficultyLevel>('beginner')
  const [voicePrefs, setVoicePrefs] = useState<VoicePreferences>({ accent: 'indian', gender: 'female' })
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    setLevel(getUserLevel())
    setVoicePrefs(getVoicePreferences())
  }, [])

  const handleLevelChange = (l: DifficultyLevel) => { setLevel(l); updateUserLevel(l) }

  const handleVoiceChange = (key: keyof VoicePreferences, value: string) => {
    const updated = { ...voicePrefs, [key]: value } as VoicePreferences
    setVoicePrefs(updated)
    saveVoicePreferences(updated)
  }

  const handleClearData = () => {
    if (confirm('Are you sure? This will delete all your progress, sessions, and vocabulary.')) {
      saveProgress(getDefaultProgress())
      setCleared(true)
      setTimeout(() => setCleared(false), 3000)
    }
  }

  const levels: { id: DifficultyLevel; label: string; desc: string; emoji: string; color: string; bg: string; border: string }[] = [
    { id: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: 'Simple words, like talking to a child',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)'   },
    { id: 'intermediate', label: 'Intermediate', emoji: '📈', desc: 'Daily life & workplace communication',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)' },
    { id: 'advanced',     label: 'Advanced',     emoji: '🚀', desc: 'Complex topics & idiomatic English',     color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)' },
  ]

  const OptionBtn = ({
    active, onClick, label, sub
  }: { active: boolean; onClick: () => void; label: string; sub?: string }) => (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all"
      style={{
        background: active ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)',
        border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.05)'}`,
      }}>
      <span className="text-sm font-bold" style={{ color: active ? '#a5b4fc' : '#94a3b8' }}>{label}</span>
      {sub && <span className="text-xs" style={{ color: active ? '#6366f1' : '#475569' }}>{sub}</span>}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#06080f] pb-10">
      <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="p-2 rounded-xl glass-light text-slate-400 hover:text-slate-200 transition-all">
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-white font-black text-lg">Settings</h1>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* Level */}
        <div className="rounded-3xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={17} className="text-purple-400" />
            <h3 className="text-white font-bold">My English Level</h3>
          </div>
          <div className="space-y-2.5">
            {levels.map(l => (
              <button key={l.id} onClick={() => handleLevelChange(l.id)}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all"
                style={{
                  background: level === l.id ? l.bg : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${level === l.id ? l.border : 'rgba(255,255,255,0.05)'}`,
                }}>
                <span className="text-2xl">{l.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: level === l.id ? l.color : '#e2e8f0' }}>{l.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{l.desc}</p>
                </div>
                {level === l.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: l.color }}>
                    <div className="w-2 h-2 rounded-full bg-[#06080f]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Settings */}
        <div className="rounded-3xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={17} className="text-blue-400" />
            <h3 className="text-white font-bold">AI Voice Settings</h3>
          </div>

          {/* Accent */}
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Accent</p>
          <div className="flex gap-2 mb-4">
            <OptionBtn
              active={voicePrefs.accent === 'indian'}
              onClick={() => handleVoiceChange('accent', 'indian')}
              label="🇮🇳 Indian"
              sub="en-IN"
            />
            <OptionBtn
              active={voicePrefs.accent === 'default'}
              onClick={() => handleVoiceChange('accent', 'default')}
              label="🇺🇸 American"
              sub="en-US"
            />
          </div>

          {/* Gender */}
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Voice Gender</p>
          <div className="flex gap-2">
            <OptionBtn
              active={voicePrefs.gender === 'female'}
              onClick={() => handleVoiceChange('gender', 'female')}
              label="Female"
              sub="Higher pitch"
            />
            <OptionBtn
              active={voicePrefs.gender === 'male'}
              onClick={() => handleVoiceChange('gender', 'male')}
              label="Male"
              sub="Lower pitch"
            />
          </div>

          <p className="text-slate-600 text-xs mt-3 leading-relaxed">
            Voice availability depends on your device. If the selected voice is not available, the closest alternative will be used.
          </p>
        </div>

        {/* About */}
        <div className="rounded-3xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={17} className="text-yellow-400" />
            <h3 className="text-white font-bold">About SpeakMate AI</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Version',      value: '1.0.0' },
              { label: 'AI Model',     value: 'Llama 3.3 70B' },
              { label: 'Powered by',   value: 'Groq (Ultra Fast)' },
              { label: 'Data Storage', value: 'Local — your device only' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-slate-500 text-sm">{row.label}</span>
                <span className="text-slate-300 text-sm font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-3xl p-5"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h3 className="text-red-400 font-bold mb-3 text-sm uppercase tracking-wider">Danger Zone</h3>
          <button onClick={handleClearData}
            className="w-full flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-red-500/10"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex items-center gap-3">
              <Trash2 size={16} className="text-red-400" />
              <div className="text-left">
                <p className="text-red-400 font-semibold text-sm">Clear All Data</p>
                <p className="text-slate-500 text-xs mt-0.5">Delete all sessions, vocabulary & progress</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-red-500/50" />
          </button>
          {cleared && (
            <p className="text-emerald-400 text-xs text-center mt-3 font-medium">Data cleared successfully</p>
          )}
        </div>
      </div>
    </div>
  )
}
