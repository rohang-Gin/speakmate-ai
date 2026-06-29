export type Role = 'user' | 'assistant'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ConversationMode =
  | 'free-talk'
  | 'roleplay'
  | 'interview'
  | 'daily-mission'
  | 'scenario'
  | 'repeat-practice'

export interface GrammarCorrection {
  original: string
  corrected: string
  explanation: string
  nativeSpeakerVersion: string
}

export interface VocabSuggestion {
  original: string
  alternatives: string[]
}

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: number
  grammarCorrection?: GrammarCorrection
  vocabSuggestions?: VocabSuggestion[]
  followUpQuestions?: string[]
}

export interface SessionScore {
  grammar: number
  vocabulary: number
  fluency: number
  pronunciation: number
  confidence: number
  overall: number
}

export interface SessionReport {
  id: string
  date: number
  duration: number
  mode: ConversationMode
  score: SessionScore
  topMistakes: GrammarCorrection[]
  vocabularyLearned: string[]
  homework: string[]
  messageCount: number
}

export interface DailyMission {
  id: string
  level: DifficultyLevel
  title: string
  description: string
  prompt: string
  completed: boolean
}

export interface RoleplayScenario {
  id: string
  title: string
  aiRole: string
  context: string
  startingPrompt: string
  icon: string
}

export interface InterviewMode {
  id: string
  title: string
  description: string
  icon: string
}

export interface UserProgress {
  totalSessions: number
  totalMinutes: number
  currentStreak: number
  longestStreak: number
  lastSessionDate: string
  xpPoints: number
  level: DifficultyLevel
  sessionHistory: SessionReport[]
  vocabularyNotebook: VocabEntry[]
  badges: string[]
}

export interface VocabEntry {
  word: string
  meaning: string
  example: string
  learnedOn: number
}

export interface AIResponse {
  message: string
  grammarCorrection?: GrammarCorrection
  vocabSuggestions?: VocabSuggestion[]
  followUpQuestions: string[]
  sessionScore?: SessionScore
  isSessionEnd?: boolean
  homework?: string[]
  targetSentence?: string | null
  isCorrect?: boolean | null
}
