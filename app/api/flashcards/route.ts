import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { supabase } from '@/lib/supabase'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const MAX_FLASHCARD_NOTE_CHARS = 3000
const MAX_FLASHCARD_TOKENS = 1000

export async function POST(req: Request) {
  try {
    // 1. Auth Verification: Require valid Supabase Bearer token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to generate flashcards.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Session expired or invalid. Please log in again.' },
        { status: 401 }
      )
    }

    const { title, category, notes } = await req.json()

    if (!title && !notes) {
      return NextResponse.json({ error: 'Title or notes are required' }, { status: 400 })
    }

    // 2. Token Protection: Truncate notes if user pasted an entire textbook chapter
    const safeNotes = notes
      ? notes.length > MAX_FLASHCARD_NOTE_CHARS
        ? `${notes.slice(0, MAX_FLASHCARD_NOTE_CHARS)}... [truncated]`
        : notes
      : ''

    const prompt = `You are an expert exam strategist who specializes in targeted active recall.
Based on the following study material, generate 5 HIGH-YIELD flashcards targeting the concepts that students struggle with most or get tricked on during exams:

Title: ${title || 'Study Topic'}
Category: ${category || 'General'}
Notes/Summary: ${safeNotes || 'No detailed notes provided. Generate foundational high-yield active recall questions on the title topic.'}

Requirements:
- Target tricky distinctions, core mechanisms, and common misconceptions.
- Front: A clear, sharp question or active recall prompt.
- Back: A concise, memorable answer with key reasoning.
- Return ONLY a valid JSON array of objects with "front" and "back" keys. No markdown code blocks, backticks, or extra commentary.

Example:
[
  {"front": "What is the key difference between active transport and facilitated diffusion?", "back": "Active transport moves molecules against their concentration gradient using ATP; facilitated diffusion moves them down the gradient without energy."},
  {"front": "Why is ATP considered the energy currency of the cell?", "back": "Hydrolysis of its high-energy phosphoanhydride bonds releases easily accessible energy for metabolic work."}
]`

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: MAX_FLASHCARD_TOKENS,
    })

    const rawContent = completion.choices[0]?.message?.content?.trim() || '[]'
    
    // Clean potential markdown blocks if LLM adds ```json ... ```
    const cleaned = rawContent
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim()

    const flashcards = JSON.parse(cleaned)

    return NextResponse.json({ flashcards })
  } catch (error: any) {
    console.error('Error generating flashcards:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate flashcards' }, { status: 500 })
  }
}
