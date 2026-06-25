'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, Flame, Clock, MessageCircle, Star, Award, TrendingUp, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { loadProgress, getWeeklyScores } from '@/lib/storage'
import { UserProgress } from '@/types'
import { BADGE_INFO } from '@/lib/constants'

interface Props { onBack: () => void }

export default function DashboardScreen({ onBack }: Props) {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [chartData, setChartData] = useState<ReturnType<typeof getWeeklyScores>>([])

  useEffect(() => {
    const p = loadProgress()
    setProgress(p)
    setChartData(getWeeklyScores(p.sessionHistory))
  }, [])

  if (!progress) return null

  const avgScore = progress.sessionHistory.length > 0
    ? Math.round(progress.sessionHistory.slice(0, 10).reduce((a, s) => a + s.score.overall, 0) / Math.min(10, progress.sessionHistory.length))
    : 0

  return (
    <div className="min-h-screen bg-[#06080f] pb-10">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full bg-indigo-600/08 blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(6,8,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} className="p-2 rounded-xl glass-light text-slate-400 hover:text-slate-200 transition-all">
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-white font-black text-lg">My Progress</h1>
      </div>

      <div className="px-4 py-5 space-y-4 relative">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Flame,          label: 'Day Streak',    value: progress.currentStreak, sub: `Best: ${progress.longestStreak}`,  color: '#f97316', bg: 'card-gradient-orange' },
            { icon: Zap,            label: 'XP Points',     value: progress.xpPoints,       sub: `Level: ${progress.level}`,        color: '#a855f7', bg: 'card-gradient-purple' },
            { icon: MessageCircle,  label: 'Sessions',      value: progress.totalSessions,  sub: `Avg score: ${avgScore}`,          color: '#6366f1', bg: 'card-gradient-blue'   },
            { icon: Clock,          label: 'Minutes',       value: progress.totalMinutes,   sub: 'speaking time',                   color: '#10b981', bg: 'card-gradient-green'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-slate-400 text-xs font-medium">{s.label}</span>
              </div>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="rounded-3xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-indigo-400" />
              <h3 className="text-white font-bold">Weekly Progress</h3>
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="grammar"    stroke="#22c55e" strokeWidth={2} dot={false} name="Grammar" />
                <Line type="monotone" dataKey="vocabulary" stroke="#6366f1" strokeWidth={2} dot={false} name="Vocab" />
                <Line type="monotone" dataKey="overall"    stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} name="Overall" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-5 mt-3 justify-center">
              {[{ c: '#22c55e', l: 'Grammar' }, { c: '#6366f1', l: 'Vocab' }, { c: '#f59e0b', l: 'Overall' }].map(i => (
                <div key={i.l} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-4 h-0.5 rounded-full" style={{ background: i.c }} />
                  {i.l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {progress.badges.length > 0 && (
          <div className="rounded-3xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-yellow-400" />
              <h3 className="text-white font-bold">Badges Earned</h3>
              <span className="ml-auto text-xs text-slate-500">{progress.badges.length} badges</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {progress.badges.map(badge => {
                const info = BADGE_INFO[badge]
                if (!info) return null
                return (
                  <div key={badge} className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-2xl">{info.icon}</span>
                    <span className="text-slate-300 text-xs font-medium">{info.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {progress.sessionHistory.length > 0 && (
          <div className="rounded-3xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-white font-bold mb-4">Recent Sessions</h3>
            <div className="space-y-2">
              {progress.sessionHistory.slice(0, 5).map(s => {
                const scoreColor = s.score.overall >= 80 ? 'text-emerald-400' : s.score.overall >= 60 ? 'text-blue-400' : 'text-yellow-400'
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl p-3.5"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <p className="text-slate-200 text-sm font-semibold capitalize">{s.mode.replace('-', ' ')}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{new Date(s.date).toLocaleDateString()} · {Math.round(s.duration / 60)} min</p>
                    </div>
                    <div className={`text-2xl font-black ${scoreColor}`}>{s.score.overall}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {progress.totalSessions === 0 && (
          <div className="rounded-3xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-5xl mb-4">🎯</p>
            <p className="text-white font-bold text-lg">No sessions yet</p>
            <p className="text-slate-500 text-sm mt-2">Start a conversation to see your progress here</p>
          </div>
        )}
      </div>
    </div>
  )
}
