'use client'
import { Trophy, RotateCcw, Home, Star, CheckCircle, BookOpen, TrendingUp } from 'lucide-react'
import { SessionReport } from '@/types'

interface Props {
  report: SessionReport
  onBack: () => void
  onRestart: () => void
}

const ScoreRing = ({ score, label, color, trackColor }: { score: number; label: string; color: string; trackColor: string }) => {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90 w-16 h-16" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} stroke={trackColor} strokeWidth="5" fill="none" />
          <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="5" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-black text-sm text-white">{score}</span>
      </div>
      <span className="text-slate-500 text-xs font-medium">{label}</span>
    </div>
  )
}

export default function SessionReportCard({ report, onBack, onRestart }: Props) {
  const duration = Math.round(report.duration / 60)
  const overall = report.score.overall
  const grade = overall >= 90 ? 'Excellent! 🏆' : overall >= 75 ? 'Great Job! 🌟' : overall >= 60 ? 'Good Work! 👍' : 'Keep Practicing! 💪'
  const gradeColor = overall >= 90 ? '#f59e0b' : overall >= 75 ? '#22c55e' : overall >= 60 ? '#3b82f6' : '#3d9e6b'

  return (
    <div className="min-h-screen bg-[#06080f] px-4 py-6 overflow-y-auto pb-12">

      {/* Confetti-like header */}
      <div className="relative rounded-3xl p-6 mb-5 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%)', border: '1px solid rgba(26,92,58,0.4)' }}>
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}>
            <Trophy size={38} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Session Complete!</h2>
          <p className="text-[#4db87e]/70 text-sm mt-1">{duration} min · {report.messageCount} exchanges</p>
          <p className="text-lg font-bold mt-2" style={{ color: gradeColor }}>{grade}</p>
        </div>
      </div>

      {/* Overall Score */}
      <div className="rounded-3xl p-6 mb-4 text-center"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Overall Score</p>
        <div className="relative w-28 h-28 mx-auto mb-3">
          <svg className="transform -rotate-90 w-28 h-28" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
            <circle cx="56" cy="56" r="48" stroke={gradeColor} strokeWidth="8" fill="none"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 - (overall / 100) * 2 * Math.PI * 48}
              strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${gradeColor}60)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white">{overall}</span>
            <span className="text-slate-500 text-xs">/ 100</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-3xl p-5 mb-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#3d9e6b]" />
          <h3 className="text-white font-bold">Score Breakdown</h3>
        </div>
        <div className="flex justify-around">
          <ScoreRing score={report.score.grammar}      label="Grammar"    color="#22c55e" trackColor="rgba(34,197,94,0.15)" />
          <ScoreRing score={report.score.vocabulary}   label="Vocab"      color="#1a5c3a" trackColor="rgba(26,92,58,0.15)" />
          <ScoreRing score={report.score.fluency}      label="Fluency"    color="#3d9e6b" trackColor="rgba(61,158,107,0.15)" />
          <ScoreRing score={report.score.pronunciation} label="Pronun."   color="#f59e0b" trackColor="rgba(245,158,11,0.15)" />
          <ScoreRing score={report.score.confidence}   label="Confidence" color="#ec4899" trackColor="rgba(236,72,153,0.15)" />
        </div>
      </div>

      {/* Top Mistakes */}
      {report.topMistakes.length > 0 && (
        <div className="rounded-3xl p-5 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-base">✏️</span> Top Corrections
          </h3>
          <div className="space-y-3">
            {report.topMistakes.map((m, i) => (
              <div key={i} className="rounded-2xl p-3.5 space-y-1.5"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex gap-2 text-xs">
                  <span className="text-red-400 font-semibold w-14 flex-shrink-0">Said:</span>
                  <span className="text-slate-400 line-through">{m.original}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-400 font-semibold w-14 flex-shrink-0">Better:</span>
                  <span className="text-emerald-300">{m.corrected}</span>
                </div>
                {m.explanation && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-blue-400 font-semibold w-14 flex-shrink-0">Why:</span>
                    <span className="text-slate-400">{m.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {report.vocabularyLearned.length > 0 && (
        <div className="rounded-3xl p-5 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-blue-400" />
            <h3 className="text-white font-bold">New Vocabulary</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.vocabularyLearned.map((word, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-xl font-medium"
                style={{ background: 'rgba(26,92,58,0.15)', color: '#a5b4fc', border: '1px solid rgba(26,92,58,0.3)' }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Homework */}
      {report.homework.length > 0 && (
        <div className="rounded-3xl p-5 mb-6"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <h3 className="text-white font-bold">Homework for Tomorrow</h3>
          </div>
          <div className="space-y-2.5">
            {report.homework.map((task, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300 text-sm leading-relaxed">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onRestart}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white btn-primary">
          <RotateCcw size={17} />
          Practice Again
        </button>
        <button onClick={onBack}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-slate-300 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Home size={17} />
          Home
        </button>
      </div>
    </div>
  )
}
