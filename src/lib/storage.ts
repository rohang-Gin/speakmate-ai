import { UserProgress, SessionReport, VocabEntry, DifficultyLevel } from '@/types'

const KEYS = {
  PROGRESS: 'speakmate_progress',
  CURRENT_LEVEL: 'speakmate_level',
  VOICE_PREFS: 'speakmate_voice_prefs',
}

export interface VoicePreferences {
  accent: 'indian' | 'default'
  gender: 'male' | 'female'
}

export function getVoicePreferences(): VoicePreferences {
  if (typeof window === 'undefined') return { accent: 'indian', gender: 'female' }
  try {
    const raw = localStorage.getItem(KEYS.VOICE_PREFS)
    if (!raw) return { accent: 'indian', gender: 'female' }
    return JSON.parse(raw) as VoicePreferences
  } catch {
    return { accent: 'indian', gender: 'female' }
  }
}

export function saveVoicePreferences(prefs: VoicePreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.VOICE_PREFS, JSON.stringify(prefs))
}

export function getDefaultProgress(): UserProgress {
  return {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: '',
    xpPoints: 0,
    level: 'beginner',
    sessionHistory: [],
    vocabularyNotebook: [],
    badges: [],
  }
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return getDefaultProgress()
  try {
    const raw = localStorage.getItem(KEYS.PROGRESS)
    if (!raw) return getDefaultProgress()
    return JSON.parse(raw) as UserProgress
  } catch {
    return getDefaultProgress()
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress))
}

export function addSessionReport(report: SessionReport): void {
  const progress = loadProgress()
  progress.sessionHistory = [report, ...progress.sessionHistory].slice(0, 100)
  progress.totalSessions += 1
  progress.totalMinutes += Math.round(report.duration / 60)
  progress.xpPoints += report.score.overall

  const today = new Date().toDateString()
  if (progress.lastSessionDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (progress.lastSessionDate === yesterday) {
      progress.currentStreak += 1
    } else {
      progress.currentStreak = 1
    }
    progress.lastSessionDate = today
  }

  if (progress.currentStreak > progress.longestStreak) {
    progress.longestStreak = progress.currentStreak
  }

  checkAndAwardBadges(progress)
  saveProgress(progress)
}

export function addVocabEntry(entry: VocabEntry): void {
  const progress = loadProgress()
  const exists = progress.vocabularyNotebook.some(v => v.word === entry.word)
  if (!exists) {
    progress.vocabularyNotebook = [entry, ...progress.vocabularyNotebook]
    saveProgress(progress)
  }
}

export function getUserLevel(): DifficultyLevel {
  const progress = loadProgress()
  return progress.level
}

export function updateUserLevel(level: DifficultyLevel): void {
  const progress = loadProgress()
  progress.level = level
  saveProgress(progress)
}

function checkAndAwardBadges(progress: UserProgress): void {
  const badges = new Set(progress.badges)

  if (progress.totalSessions >= 1) badges.add('first-conversation')
  if (progress.totalSessions >= 10) badges.add('10-conversations')
  if (progress.totalSessions >= 50) badges.add('50-conversations')
  if (progress.currentStreak >= 3) badges.add('3-day-streak')
  if (progress.currentStreak >= 7) badges.add('7-day-streak')
  if (progress.currentStreak >= 30) badges.add('30-day-streak')
  if (progress.totalMinutes >= 60) badges.add('1-hour-speaking')
  if (progress.totalMinutes >= 600) badges.add('10-hours-speaking')
  if (progress.vocabularyNotebook.length >= 50) badges.add('vocab-50')
  if (progress.xpPoints >= 1000) badges.add('1000-xp')

  progress.badges = Array.from(badges)
}

export function getWeeklyScores(history: SessionReport[]) {
  const last7 = history.slice(0, 7).reverse()
  return last7.map(s => ({
    date: new Date(s.date).toLocaleDateString('en', { weekday: 'short' }),
    grammar: s.score.grammar,
    vocabulary: s.score.vocabulary,
    fluency: s.score.fluency,
    overall: s.score.overall,
  }))
}
