'use client'
import { useState, useCallback, useRef } from 'react'
import { Message, AIResponse, ConversationMode, SessionScore, SessionReport } from '@/types'
import { addSessionReport, addVocabEntry, getUserLevel } from '@/lib/storage'

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

interface UseConversationOptions {
  mode: ConversationMode
  roleplayContext?: string
  interviewContext?: string
  onSessionEnd?: (report: SessionReport) => void
}

export function useConversation({
  mode,
  roleplayContext,
  interviewContext,
  onSessionEnd,
}: UseConversationOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStartTime] = useState(Date.now())
  const [sessionScore, setSessionScore] = useState<SessionScore>({
    grammar: 85, vocabulary: 75, fluency: 80, pronunciation: 70, confidence: 75, overall: 77,
  })
  const [isSessionEnded, setIsSessionEnded] = useState(false)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = useCallback((sendMessage: (text: string) => void) => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(() => {
      sendMessage('__inactivity__')
    }, 180000) // 3 minutes — was 30s which burned API quota
  }, [])

  const sendMessage = useCallback(async (userText: string) => {
    const ts = new Date().toLocaleTimeString('en-IN', { hour12: false })
    console.log(`[${ts}] sendMessage called: "${userText.slice(0,60)}" | isLoading=${isLoading} isSessionEnded=${isSessionEnded}`)
    if (!userText.trim() || isLoading || isSessionEnded) {
      console.log(`[${ts}] sendMessage BLOCKED: empty=${!userText.trim()} loading=${isLoading} ended=${isSessionEnded}`)
      return
    }

    const isInactivity = userText === '__inactivity__'
    const isSystem = userText.startsWith('[SYSTEM:')
    const displayText = isInactivity ? '' : userText

    if (!isInactivity && !isSystem) {
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: displayText,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, userMsg])
    }

    setIsLoading(true)

    try {
      const level = getUserLevel()
      const historyForApi = messages.slice(-12).map(m => ({
        role: m.role,
        content: m.content,
      }))

      if (!isInactivity && !isSystem) {
        historyForApi.push({ role: 'user', content: userText })
      } else if (isSystem) {
        historyForApi.push({ role: 'user', content: userText })
      } else {
        historyForApi.push({
          role: 'user',
          content: '[System: User has been inactive for 30 seconds. Re-engage them warmly and ask if they are still there, then prompt them with an interesting question.]',
        })
      }

      const ts2 = new Date().toLocaleTimeString('en-IN', { hour12: false })
      console.log(`[${ts2}] Calling /api/chat — mode=${mode} level=${level} historyLen=${historyForApi.length}`)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          mode,
          level,
          roleplayContext,
          interviewContext,
        }),
      })

      const data: AIResponse & { error?: string } = await res.json()
      const ts3 = new Date().toLocaleTimeString('en-IN', { hour12: false })
      console.log(`[${ts3}] API response status=${res.status} error=${data.error} message="${data.message?.slice(0,60)}"`)

      if (!res.ok || data.error) {
        throw new Error(data.error || `API error ${res.status}`)
      }

      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        grammarCorrection: data.grammarCorrection,
        vocabSuggestions: data.vocabSuggestions,
        followUpQuestions: data.followUpQuestions,
      }

      setMessages(prev => [...prev, aiMsg])

      if (data.grammarCorrection) {
        setSessionScore(prev => ({
          ...prev,
          grammar: Math.max(40, prev.grammar - 2),
        }))
      }

      if (data.vocabSuggestions && data.vocabSuggestions.length > 0) {
        data.vocabSuggestions.forEach(v => {
          if (v.alternatives[0]) {
            addVocabEntry({
              word: v.alternatives[0],
              meaning: `Better alternative for "${v.original}"`,
              example: `Instead of "${v.original}", say "${v.alternatives[0]}"`,
              learnedOn: Date.now(),
            })
          }
        })
      }

      if (data.isSessionEnd) {
        const finalScore = data.sessionScore || sessionScore
        setSessionScore(finalScore)
        setIsSessionEnded(true)

        const report: SessionReport = {
          id: generateId(),
          date: Date.now(),
          duration: Math.round((Date.now() - sessionStartTime) / 1000),
          mode,
          score: finalScore,
          topMistakes: messages
            .filter(m => m.grammarCorrection)
            .slice(0, 5)
            .map(m => m.grammarCorrection!),
          vocabularyLearned: messages
            .flatMap(m => m.vocabSuggestions || [])
            .flatMap(v => v.alternatives)
            .slice(0, 10),
          homework: data.homework || [],
          messageCount: messages.length,
        }

        addSessionReport(report)
        onSessionEnd?.(report)
      }
    } catch (err) {
      console.error(err)
      const errText = err instanceof Error ? err.message : ''
      const isRateLimit = errText.includes('429') || errText.includes('rate_limit')
      const errMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: isRateLimit
          ? "⏳ Too many requests — please wait 10–15 seconds and try again."
          : "I'm having a little trouble connecting. Please check your internet and try again!",
        timestamp: Date.now(),
        followUpQuestions: [],
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, isSessionEnded, messages, mode, roleplayContext, interviewContext, sessionScore, sessionStartTime, onSessionEnd])

  const clearSession = useCallback(() => {
    setMessages([])
    setIsSessionEnded(false)
    setSessionScore({ grammar: 85, vocabulary: 75, fluency: 80, pronunciation: 70, confidence: 75, overall: 77 })
  }, [])

  return {
    messages,
    isLoading,
    sessionScore,
    isSessionEnded,
    sendMessage,
    clearSession,
    resetInactivityTimer,
  }
}
