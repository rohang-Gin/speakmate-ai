import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/groq'
import { AIResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, mode, level, roleplayContext, interviewContext } = body

    const systemPrompt = buildSystemPrompt(mode, level, roleplayContext, interviewContext)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API error:', response.status, errText)
      return NextResponse.json({ error: `Groq error: ${response.status}` }, { status: 500 })
    }

    const completion = await response.json()
    const raw = completion.choices?.[0]?.message?.content || '{}'

    let parsed: AIResponse
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {
        message: raw,
        followUpQuestions: ['What do you think about that?'],
        grammarCorrection: undefined,
        vocabSuggestions: [],
        isSessionEnd: false,
      }
    }

    if (!parsed.message) {
      parsed.message = "I'm here! Let's have a great conversation. How are you doing today?"
    }

    if (!parsed.followUpQuestions || parsed.followUpQuestions.length === 0) {
      parsed.followUpQuestions = ['Can you tell me more?']
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
