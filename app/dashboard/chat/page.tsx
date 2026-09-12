'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Sparkles,
  BookOpen,
  Trash2,
  AlertTriangle,
  Bot,
  Target,
  HelpCircle,
  Zap,
  CheckSquare,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Material {
  id: string
  title: string
  category: string
  notes?: string
  link?: string
}

const STUDY_MODES = [
  {
    id: 'diagnose',
    label: 'Target Weakness',
    icon: Target,
    desc: 'Diagnoses blind spots & skips what you already know',
  },
  {
    id: 'pitfalls',
    label: 'Pitfall Hunter',
    icon: AlertTriangle,
    desc: 'Uncovers tricky exam traps & common misconceptions',
  },
  {
    id: 'tutor',
    label: 'Socratic Coach',
    icon: HelpCircle,
    desc: 'Guides you step-by-step with probing questions',
  },
  {
    id: 'feynman',
    label: 'Feynman Analogy',
    icon: Zap,
    desc: 'Explains complex concepts with simple real-world analogies',
  },
  {
    id: 'quiz',
    label: 'Exam Quizzer',
    icon: CheckSquare,
    desc: 'Tests your active recall with 1 targeted question at a time',
  },
]

const QUICK_PROMPTS_BY_MODE: Record<string, { label: string; text: string }[]> = {
  diagnose: [
    { label: '🎯 Test My Weaknesses', text: 'Quiz me on my saved materials to diagnose my weakest subtopic, then explain only that.' },
    { label: '🔍 Isolate Confusion', text: 'Here is what I understand about my notes: [type what you know]. Tell me what crucial part I am missing.' },
    { label: '⚖️ High-Yield Prioritization', text: 'Rank the concepts in my saved notes from hardest/most tested to easiest so I know where to focus.' },
  ],
  pitfalls: [
    { label: '⚠️ Exam Trap Alert', text: 'What are the top 3 mistakes and misconceptions students make on this topic during exams?' },
    { label: '🔀 Confusing Distinctions', text: 'What are two concepts in my notes that seem identical but have a critical difference?' },
  ],
  tutor: [
    { label: '🧠 Socratic Drill', text: 'Walk me through the hardest concept in my notes step-by-step. Ask me one question at a time.' },
    { label: '🤔 Challenge My Logic', text: 'Ask me a "why" question about my study materials that tests whether I truly understand the mechanism.' },
  ],
  feynman: [
    { label: '⚡ Explain Like I’m 5', text: 'Use a simple real-world analogy to explain the most complicated concept in my saved materials.' },
    { label: '🍕 Pizza / Car Metaphor', text: 'Break down how this process works using a relatable everyday metaphor.' },
  ],
  quiz: [
    { label: '📝 Multiple Choice Question', text: 'Give me 1 challenging multiple-choice question based on my materials. Wait for my answer before revealing the solution.' },
    { label: '✍️ Scenario Question', text: 'Give me a real-world scenario problem based on my notes to test my problem-solving ability.' },
  ],
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string>('diagnose')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Fetch user's saved materials on load
  useEffect(() => {
    const fetchMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setMaterials(data)
      }
      setLoadingMaterials(false)
    }

    fetchMaterials()
  }, [])

  // Auto-scroll to bottom as messages stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Handle textarea auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return

    const userMessage: Message = { role: 'user', content: textToSend.trim() }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)

    const assistantIndex = updatedMessages.length
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please sign in to use the AI Study Copilot.')
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          materials: materials,
          mode: selectedMode,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      if (!res.body) throw new Error('No response stream received')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedReply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulatedReply += chunk

        setMessages((prev) => {
          const next = [...prev]
          if (next[assistantIndex]) {
            next[assistantIndex] = { role: 'assistant', content: accumulatedReply }
          }
          return next
        })
      }
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev]
        if (next[assistantIndex]) {
          next[assistantIndex] = {
            role: 'assistant',
            content: `⚠️ *Error generating response:* ${err.message || 'Check your API key and connection.'}`,
          }
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    if (messages.length > 0 && confirm('Clear this study conversation?')) {
      setMessages([])
    }
  }

  const activeModeObj = STUDY_MODES.find((m) => m.id === selectedMode) || STUDY_MODES[0]
  const currentPrompts = QUICK_PROMPTS_BY_MODE[selectedMode] || QUICK_PROMPTS_BY_MODE.diagnose

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2 text-sm font-semibold font-serif">
          <Sparkles size={16} className="text-accent" /> AI Study Copilot
          <span className="text-[10px] font-mono uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            120B Model
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </header>

      {/* Main Chat Layout */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 flex-1 flex flex-col justify-between gap-4">
        {/* Study Mode Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Study Focus Mode
            </span>
            <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline-block">
              {activeModeObj.desc}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-secondary/70 border border-border rounded-xl">
            {STUDY_MODES.map((mode) => {
              const Icon = mode.icon
              const isSelected = selectedMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-card text-foreground shadow-xs border border-border/80'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-accent' : 'opacity-70'} />
                  <span className="truncate">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Context Banner */}
        <div className="border border-border/70 rounded-xl p-3 bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-accent shrink-0" />
            <span className="line-clamp-1">
              {loadingMaterials
                ? 'Loading study materials...'
                : materials.length > 0
                ? `Active Context: ${Math.min(materials.length, 10)} material${materials.length > 1 ? 's' : ''} loaded ${materials.length > 10 ? '(Top 10 token-optimized)' : ''}`
                : 'No materials saved (Add notes in Materials Hub for personalized weakness tracking)'}
            </span>
          </div>
          <Link href="/dashboard/materials" className="text-accent hover:underline font-mono text-[11px] shrink-0 ml-2">
            Manage Materials &rarr;
          </Link>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-h-[380px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-4 my-auto py-10">
              <div className="p-3.5 bg-accent/10 text-accent rounded-2xl mb-1 shadow-xs">
                <Target size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-semibold text-foreground">
                  Target Your Weaknesses
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                  "Someone can study everything, but they shouldn't. True mastery comes from isolating your exact blind spots and skipping what you already know."
                </p>
              </div>

              {/* Mode-specific Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl mt-3">
                {currentPrompts.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => handleSendMessage(qp.text)}
                    className="p-3 text-left border border-border rounded-xl bg-card hover:border-accent hover:bg-muted/40 transition-all text-xs flex flex-col gap-1 cursor-pointer group shadow-xs"
                  >
                    <span className="font-semibold text-foreground group-hover:text-accent flex items-center gap-1.5 font-serif">
                      {qp.label}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 leading-relaxed">{qp.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                  {m.role === 'user' ? 'You' : 'notetoself AI (120B)'}
                </span>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                      : 'bg-card border border-border text-foreground shadow-sm'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content || (loading && idx === messages.length - 1 ? 'Thinking & diagnosing...' : '')}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border border-border rounded-xl bg-card p-2 focus-within:ring-1 focus-within:ring-primary shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(input)
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedMode === 'diagnose'
                  ? 'Ask a question, or say: "Test me on my materials to find my weak points"...'
                  : selectedMode === 'pitfalls'
                  ? 'Ask: "What are the biggest exam traps in my notes?"...'
                  : 'Ask anything (Shift+Enter for newline)...'
              }
              className="flex-1 bg-transparent border-0 px-3 py-2 text-sm focus:outline-none resize-none max-h-40 placeholder:text-muted-foreground/60"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary text-primary-foreground p-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}