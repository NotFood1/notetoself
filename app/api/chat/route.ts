import { Groq } from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, materials, mode = 'diagnose' } = await req.json()

    // Format saved materials into a clean text block for system context
    let contextText = ''
    if (materials && materials.length > 0) {
      contextText = materials
        .map(
          (m: any, index: number) =>
            `${index + 1}. [${m.category || 'General'}] ${m.title}${m.notes ? `: ${m.notes}` : ''}${m.link ? ` (Link: ${m.link})` : ''}`
        )
        .join('\n')
    }

    // Define mode-specific instructions aligned with the core philosophy
    const modeInstructions: Record<string, string> = {
      diagnose: `MODE: TARGETED WEAKNESS DIAGNOSIS (Core Philosophy Mode)
- Your goal is to pinpoint the student's exact blind spots and knowledge gaps.
- Do NOT regurgitate what they already know or dump long summaries.
- Ask 1 or 2 targeted diagnostic questions to see where their understanding breaks down.
- Once a weakness is identified, isolate that specific concept and explain only what they are struggling with.`,

      pitfalls: `MODE: PITFALL & EXAM TRAP HUNTER
- Analyze the user's notes and questions specifically for common misconceptions, confusing terms, and exam pitfalls.
- Explicitly highlight: "⚠️ Trap Alert: Students often confuse [X] with [Y] because..."
- Provide the clear, foolproof mental model to never get it wrong again.`,

      tutor: `MODE: SOCRATIC TUTOR
- Do not give direct answers immediately.
- Guide the student step-by-step with probing questions, hints, and encouragement.
- Help them arrive at the correct deduction themselves so it sticks in long-term memory.`,

      feynman: `MODE: FEYNMAN EXPLAINER
- Explain the concept as simply as possible using relatable real-world analogies (Feynman Technique).
- Strip away jargon. Use vivid metaphors.
- Conclude with a quick 1-sentence intuitive takeaway.`,

      quiz: `MODE: ACTIVE RECALL QUIZZER
- Give the student ONE high-yield test question based on their materials.
- Give 4 multiple-choice options (A, B, C, D) or ask for a brief explanation.
- Wait for the user's response before grading and explaining.`,
    }

    const activeModeGuideline = modeInstructions[mode] || modeInstructions.diagnose

    // Build system prompt infused with the core philosophy
    const systemPrompt = {
      role: 'system',
      content: `You are 'notetoself AI', an elite, highly perceptive study copilot built around a single founding philosophy:

"A student could try to study everything, but they shouldn't. Everyone has specific weak points in a subject. True mastery comes from finding and eliminating those exact weaknesses—while leaving what is already mastered behind."

${activeModeGuideline}

${
  contextText
    ? `Here are the user's saved study materials for reference:\n${contextText}\n\nGround your coaching strictly in their materials whenever applicable.`
    : 'The user currently has no saved materials in their workspace. Help them study general topics, diagnose gaps, and encourage them to save key concepts in the Materials Hub.'
}

Formatting Rules:
- Keep answers tight, punchy, and formatted with clear Markdown headers, bold terms, and bullet points.
- Never write massive unreadable walls of text.
- Focus 80% of your energy on the difficult 20% of the topic that causes most mistakes.`,
    }

    const stream = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [systemPrompt, ...messages],
      stream: true,
      temperature: 0.4,
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}