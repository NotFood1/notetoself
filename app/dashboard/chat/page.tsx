'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Send, Sparkles, BookOpen } from 'lucide-react'

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)

  // Fetch user's saved materials on load
  useEffect(() => {
    const fetchMaterials = async () => {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setMaterials(data)
      }
      setLoadingMaterials(false)
    }

    fetchMaterials()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          materials: materials, // Pass saved materials context to backend
        }),
      })

      const data = await res.json()

      if (data.error) {
        alert(`Error: ${data.error}`)
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }])
      }
    } catch (err: any) {
      alert('Failed to send message.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles size={16} className="text-primary" /> AI Study Assistant
        </div>
      </header>

      {/* Main Chat Layout */}
      <main className="max-w-4xl w-full mx-auto px-6 py-6 flex-1 flex flex-col justify-between gap-4">
        {/* Active Context Banner */}
        <div className="border border-border rounded p-3 bg-card/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-primary" />
            <span>
              {loadingMaterials
                ? 'Loading study context...'
                : materials.length > 0
                ? `Context active: ${materials.length} saved material${materials.length > 1 ? 's' : ''} loaded`
                : 'No materials saved yet (Add materials in Materials Hub for AI context)'}
            </span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-[400px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 my-auto py-12">
              <Sparkles size={32} className="text-primary opacity-60 mb-2" />
              <p className="text-base font-medium text-foreground">What would you like to study today?</p>
              <p className="text-xs max-w-sm">
                {materials.length > 0
                  ? 'Your saved materials are connected! Try asking: "Quiz me on my saved materials" or "Summarize my notes."'
                  : 'Ask any question or save materials in the Materials Hub to give the AI context.'}
              </p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-muted-foreground mb-1 uppercase font-mono">
                  {m.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground mb-1 uppercase font-mono">AI Assistant</span>
              <div className="bg-card border border-border rounded-lg p-3 text-sm text-muted-foreground animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              materials.length > 0
                ? "Ask a question or try 'Quiz me on my materials'..."
                : 'Ask a question...'
            }
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground px-5 py-3 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
          >
            <Send size={16} /> Send
          </button>
        </form>
      </main>
    </div>
  )
}