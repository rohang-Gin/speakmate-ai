'use client'
import { useState, useEffect } from 'react'
import {
  MessageCircle, Mic, Trophy, BookOpen, Settings,
  Zap, Target, Star, ChevronRight, Play, Users,
  Briefcase, Flame, TrendingUp, Globe
} from 'lucide-react'
import { Screen, ConversationConfig } from '@/app/page'
import { ROLEPLAY_SCENARIOS, INTERVIEW_MODES, DAILY_MISSIONS, CONVERSATION_STARTERS } from '@/lib/constants'
import { loadProgress } from '@/lib/storage'
import { UserProgress } from '@/types'

interface Props {
  onStartConversation: (config: ConversationConfig) => void
  onNavigate: (screen: Screen) => void
}

export default function HomeScreen({ onStartConversation, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<'home' | 'roleplay' | 'interview' | 'mission'>('home')
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [greeting, setGreeting] = useState('')
  const [starterIndex, setStarterIndex] = useState(0)

  useEffect(() => {
    setProgress(loadProgress())
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening')
    setStarterIndex(Math.floor(Math.random() * CONVERSATION_STARTERS.length))
  }, [])

  const tabs = [
    { id: 'home', label: 'Free Talk', icon: MessageCircle },
    { id: 'roleplay', label: 'Roleplay', icon: Users },
    { id: 'interview', label: 'Interview', icon: Briefcase },
    { id: 'mission', label: 'Missions', icon: Target },
  ]

  return (
    <div className="min-h-screen bg-[#06080f] pb-28 relative overflow-x-hidden">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-purple-600/08 blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 px-5 py-4 flex items-center justify-between"
        style={{ background: 'rgba(6,8,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <p className="text-slate-500 text-xs font-medium tracking-wide">{greeting} 👋</p>
          <h1 className="text-xl font-black tracking-tight">
            <span className="text-white">Speak</span><span className="gradient-text">Mate</span>
            <span className="text-white text-base font-medium ml-1.5 text-slate-400">AI</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('dashboard')}
            className="p-2.5 rounded-2xl glass-light hover:bg-white/08 text-slate-400 hover:text-indigo-400 transition-all">
            <Trophy size={19} />
          </button>
          <button onClick={() => onNavigate('settings')}
            className="p-2.5 rounded-2xl glass-light hover:bg-white/08 text-slate-400 hover:text-slate-200 transition-all">
            <Settings size={19} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {progress && (
        <div className="px-5 pt-5 grid grid-cols-3 gap-3">
          <div className="card-gradient-orange rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame size={16} className="text-orange-400" />
              <span className="text-2xl font-black text-orange-300">{progress.currentStreak}</span>
            </div>
            <p className="text-orange-400/70 text-xs font-medium">Day Streak</p>
          </div>
          <div className="card-gradient-blue rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MessageCircle size={16} className="text-indigo-400" />
              <span className="text-2xl font-black text-indigo-300">{progress.totalSessions}</span>
            </div>
            <p className="text-indigo-400/70 text-xs font-medium">Sessions</p>
          </div>
          <div className="card-gradient-purple rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap size={16} className="text-purple-400" />
              <span className="text-2xl font-black text-purple-300">{progress.xpPoints}</span>
            </div>
            <p className="text-purple-400/70 text-xs font-medium">XP Points</p>
          </div>
        </div>
      )}

      {/* Tab Pills */}
      <div className="px-5 mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'btn-primary text-white'
                : 'glass-light text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-5 mt-5 space-y-4">

        {/* Free Talk */}
        {activeTab === 'home' && (
          <>
            {/* Hero Card */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%)', border: '1px solid rgba(99,102,241,0.4)' }}>
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="relative p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 float"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.5)' }}>
                    <Mic size={26} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-xl leading-tight">Talk to Your<br />AI English Coach</h2>
                    <p className="text-indigo-300/70 text-sm mt-1">Available 24/7 · Always patient</p>
                  </div>
                </div>

                {/* Starter quote */}
                <div className="rounded-2xl p-4 mb-5"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs text-indigo-300/60 font-semibold uppercase tracking-wider mb-2">Your coach will ask:</p>
                  <p className="text-slate-200 text-sm leading-relaxed italic">
                    "{CONVERSATION_STARTERS[starterIndex]}"
                  </p>
                </div>

                <button
                  onClick={() => onStartConversation({ mode: 'free-talk', title: 'Free Conversation' })}
                  className="w-full btn-primary text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-base">
                  <Play size={18} className="fill-white" />
                  Start Speaking Now
                </button>
              </div>
            </div>

            {/* Topic Grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={15} className="text-slate-500" />
                <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Choose a Topic</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: '🏠', topic: 'Daily Life', color: 'from-blue-900/40 to-blue-800/20', border: 'border-blue-700/30', prompt: 'daily life, morning routines, and everyday activities' },
                  { emoji: '✈️', topic: 'Travel', color: 'from-cyan-900/40 to-cyan-800/20', border: 'border-cyan-700/30', prompt: 'travel, countries, airports, and adventure' },
                  { emoji: '💼', topic: 'Work & Career', color: 'from-indigo-900/40 to-indigo-800/20', border: 'border-indigo-700/30', prompt: 'work, career growth, and professional life' },
                  { emoji: '🎬', topic: 'Movies & Shows', color: 'from-pink-900/40 to-pink-800/20', border: 'border-pink-700/30', prompt: 'movies, TV shows, and entertainment' },
                  { emoji: '⚽', topic: 'Sports', color: 'from-green-900/40 to-green-800/20', border: 'border-green-700/30', prompt: 'sports, fitness, and competitions' },
                  { emoji: '💻', topic: 'Technology', color: 'from-violet-900/40 to-violet-800/20', border: 'border-violet-700/30', prompt: 'technology, AI, gadgets, and innovation' },
                  { emoji: '🍕', topic: 'Food & Cooking', color: 'from-orange-900/40 to-orange-800/20', border: 'border-orange-700/30', prompt: 'food, cooking, restaurants, and cuisine' },
                  { emoji: '📚', topic: 'Education', color: 'from-teal-900/40 to-teal-800/20', border: 'border-teal-700/30', prompt: 'education, learning, and personal development' },
                ].map(item => (
                  <button
                    key={item.topic}
                    onClick={() => onStartConversation({
                      mode: 'free-talk',
                      title: item.topic,
                      missionPrompt: `Start a great conversation about ${item.prompt}. Ask an engaging opening question.`,
                    })}
                    className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="text-white text-sm font-semibold mt-2">{item.topic}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-slate-400 text-xs">Practice now</span>
                      <ChevronRight size={11} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Roleplay */}
        {activeTab === 'roleplay' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}>
              <h2 className="font-black text-white text-lg">Real-Life Roleplay 🎭</h2>
              <p className="text-purple-300/70 text-sm mt-1">Practice real conversations with an AI playing different roles</p>
            </div>
            {ROLEPLAY_SCENARIOS.map(scenario => (
              <button key={scenario.id}
                onClick={() => onStartConversation({ mode: 'roleplay', title: `Roleplay: ${scenario.title}`, scenario })}
                className="w-full glass-light rounded-2xl p-4 text-left hover:bg-white/06 active:scale-[0.99] transition-all group"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {scenario.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold">{scenario.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{scenario.startingPrompt}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl glass-light flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-all">
                    <ChevronRight size={15} className="text-slate-500 group-hover:text-indigo-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Interview */}
        {activeTab === 'interview' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <h2 className="font-black text-white text-lg">Interview Prep 💼</h2>
              <p className="text-emerald-300/70 text-sm mt-1">Practice with a realistic AI interviewer — get instant feedback</p>
            </div>
            {INTERVIEW_MODES.map(mode => (
              <button key={mode.id}
                onClick={() => onStartConversation({ mode: 'interview', title: mode.title, interview: mode })}
                className="w-full glass-light rounded-2xl p-4 text-left hover:bg-white/06 active:scale-[0.99] transition-all group"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{mode.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{mode.description}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl glass-light flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-all">
                    <ChevronRight size={15} className="text-slate-500 group-hover:text-emerald-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Daily Missions */}
        {activeTab === 'mission' && (
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                <h2 className="font-black text-white text-lg">Daily Missions</h2>
              </div>
              <p className="text-yellow-300/70 text-sm mt-1">Complete missions, earn XP, build your streak</p>
            </div>
            {DAILY_MISSIONS.map(mission => (
              <button key={mission.id}
                onClick={() => onStartConversation({ mode: 'daily-mission', title: mission.title, missionPrompt: mission.prompt })}
                className="w-full glass-light rounded-2xl p-4 text-left hover:bg-white/06 active:scale-[0.99] transition-all group"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    mission.level === 'beginner'     ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                    mission.level === 'intermediate' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                    mission.level === 'advanced'     ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                                                      'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}>
                    {mission.level.charAt(0).toUpperCase() + mission.level.slice(1)}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={13} className="fill-yellow-400" />
                    <span className="text-xs font-bold">+{mission.level === 'beginner' ? 10 : mission.level === 'intermediate' ? 20 : mission.level === 'advanced' ? 35 : 50} XP</span>
                  </div>
                </div>
                <p className="text-white font-bold">{mission.title}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{mission.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-6 py-4 flex justify-around"
        style={{ background: 'rgba(6,8,15,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { icon: MessageCircle, label: 'Home',       screen: 'home'       as Screen, active: true },
          { icon: TrendingUp,    label: 'Progress',   screen: 'dashboard'  as Screen, active: false },
          { icon: BookOpen,      label: 'Vocabulary', screen: 'vocabulary' as Screen, active: false },
          { icon: Settings,      label: 'Settings',   screen: 'settings'   as Screen, active: false },
        ].map(item => (
          <button key={item.label}
            onClick={() => !item.active && onNavigate(item.screen)}
            className={`flex flex-col items-center gap-1.5 transition-all ${
              item.active ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'
            }`}>
            <div className={`p-2 rounded-xl transition-all ${item.active ? 'bg-indigo-500/15' : ''}`}>
              <item.icon size={20} />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
