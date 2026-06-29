'use client'
import { useState } from 'react'
import HomeScreen from '@/components/HomeScreen'
import ConversationScreen from '@/components/ConversationScreen'
import DashboardScreen from '@/components/DashboardScreen'
import VocabularyScreen from '@/components/VocabularyScreen'
import SettingsScreen from '@/components/SettingsScreen'
import HistoryScreen from '@/components/HistoryScreen'
import RepeatPracticeScreen from '@/components/RepeatPracticeScreen'
import { ConversationMode, RoleplayScenario, InterviewMode } from '@/types'

export type Screen =
  | 'home'
  | 'conversation'
  | 'dashboard'
  | 'vocabulary'
  | 'settings'
  | 'history'
  | 'repeat-practice'

export interface ConversationConfig {
  mode: ConversationMode
  title: string
  scenario?: RoleplayScenario
  interview?: InterviewMode
  missionPrompt?: string
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [convConfig, setConvConfig] = useState<ConversationConfig | null>(null)
  const [repeatTense, setRepeatTense] = useState<string>('')

  const startConversation = (config: ConversationConfig) => {
    setConvConfig(config)
    setScreen('conversation')
  }

  const startRepeat = (tense: string) => {
    setRepeatTense(tense)
    setScreen('repeat-practice')
  }

  const goHome = () => {
    setConvConfig(null)
    setScreen('home')
  }

  return (
    <main className="min-h-screen bg-surface">
      {screen === 'home' && (
        <HomeScreen onStartConversation={startConversation} onNavigate={setScreen} />
      )}
      {screen === 'conversation' && convConfig && (
        <ConversationScreen config={convConfig} onBack={goHome} />
      )}
      {screen === 'dashboard' && (
        <DashboardScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'vocabulary' && (
        <VocabularyScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('home')} onStartRepeat={startRepeat} />
      )}
      {screen === 'history' && (
        <HistoryScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'repeat-practice' && (
        <RepeatPracticeScreen tense={repeatTense} onBack={() => setScreen('settings')} />
      )}
    </main>
  )
}
