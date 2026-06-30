import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/groq'
import { AIResponse } from '@/types'

// Collect all configured API keys in order
function getApiKeys(): string[] {
  const keys = [
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY,   // old key last
  ].filter((k): k is string => !!k)

  // Deduplicate
  return keys.filter((k, i) => keys.indexOf(k) === i)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, mode, level, roleplayContext, interviewContext, systemPrompt: customSystemPrompt } = body

    const systemPrompt = customSystemPrompt || buildSystemPrompt(mode, level, roleplayContext, interviewContext)

    const groqBody = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    })

    const keys = getApiKeys()
    console.log(`[chat] Total keys available: ${keys.length}`)
    if (keys.length === 0) {
      console.error('[chat] ERROR: No API key configured in environment variables')
      return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
    }

    let lastStatus = 500
    for (let i = 0; i < keys.length; i++) {
      const keyPreview = keys[i].slice(0, 8) + '...' + keys[i].slice(-4)
      console.log(`[chat] Trying key ${i + 1}/${keys.length}: ${keyPreview}`)

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys[i]}`,
          'Content-Type': 'application/json',
        },
        body: groqBody,
      })

      lastStatus = response.status
      console.log(`[chat] Key ${i + 1} response status: ${response.status}`)

      if (response.status === 429) {
        const errBody = await response.text()
        console.warn(`[chat] Key ${i + 1} rate limited (429). Body: ${errBody.slice(0, 200)}`)
        continue  // try next key
      }

      if (!response.ok) {
        const errText = await response.text()
        console.error(`[chat] Key ${i + 1} error ${response.status}: ${errText.slice(0, 300)}`)
        return NextResponse.json({ error: `Groq error: ${response.status}`, detail: errText.slice(0, 200) }, { status: 500 })
      }

      // Success
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
    }

    // All keys exhausted
    console.error(`All ${keys.length} API key(s) rate limited (429)`)
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 })

  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
