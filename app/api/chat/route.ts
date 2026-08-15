import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, materials } = await req.json()

    // Format saved materials into a clean text block for the system context
    let contextText = ''
    if (materials && materials.length > 0) {
      contextText = materials
        .map(
          (m: any, index: number) =>
            `${index + 1}. [${m.category}] ${m.title}${m.notes ? `: ${m.notes}` : ''}${m.link ? ` (Link: ${m.link})` : ''}`
        )
        .join('\n')
    }

    // Build system message with materials context
    const systemPrompt = {
      role: 'system',
      content: `You are 'notetoself AI', an intelligent, encouraging study assistant built to help the user master their study materials.

${
  contextText
    ? `Here are the user's saved study materials for reference:\n${contextText}\n\nUse this information to answer their questions, provide insights, or quiz them when relevant.`
    : 'The user currently has no saved materials in their workspace.'
}

Keep responses clear, concise, well-structured, and helpful.`,
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [systemPrompt, ...messages],
    })

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content || 'No response generated.',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}