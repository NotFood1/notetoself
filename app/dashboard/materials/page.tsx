'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  MessageSquare,
  Layers,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

interface Material {
  id: string
  title: string
  category: string
  link?: string
  notes?: string
  created_at: string
}

interface Flashcard {
  front: string
  back: string
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [savedDecks, setSavedDecks] = useState<Record<string, Flashcard[]>>({})
  const router = useRouter()

  // Flashcard Modal State
  const [activeMaterialForFlashcards, setActiveMaterialForFlashcards] = useState<Material | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [generatingCards, setGeneratingCards] = useState(false)

  useEffect(() => {
    fetchMaterials()
  }, [])

  // Sync saved flashcard decks from localStorage whenever materials are loaded
  useEffect(() => {
    if (typeof window === 'undefined' || materials.length === 0) return

    try {
      const decks: Record<string, Flashcard[]> = {}
      materials.forEach((m) => {
        const raw = localStorage.getItem(`notetoself_deck_${m.id}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            decks[m.id] = parsed
          }
        }
      })
      setSavedDecks(decks)
    } catch (e) {
      console.error('Error loading saved decks:', e)
    }
  }, [materials])

  const fetchMaterials = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMaterials(data)
    }
    setLoading(false)
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('materials').insert([
      {
        title: title.trim(),
        category: category.trim() || 'General',
        link: link.trim() || null,
        notes: notes.trim() || null,
        user_id: user.id,
      },
    ])

    if (error) {
      alert(`Error saving material: ${error.message}`)
    } else {
      setTitle('')
      setCategory('General')
      setLink('')
      setNotes('')
      fetchMaterials()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) {
      setMaterials(materials.filter((m) => m.id !== id))
      // Clean up cached deck
      try {
        localStorage.removeItem(`notetoself_deck_${id}`)
        setSavedDecks((prev) => {
          const updated = { ...prev }
          delete updated[id]
          return updated
        })
      } catch (e) {}
    }
  }

  // Open Flashcard Generator or Load Saved Deck
  const handleOpenFlashcards = async (material: Material, forceRegenerate = false) => {
    setActiveMaterialForFlashcards(material)
    setCardIndex(0)
    setIsFlipped(false)

    // 1. Check if deck is already saved in state or localStorage
    if (!forceRegenerate && savedDecks[material.id] && savedDecks[material.id].length > 0) {
      setFlashcards(savedDecks[material.id])
      setGeneratingCards(false)
      return
    }

    // 2. Otherwise, generate fresh deck from AI
    setFlashcards([])
    setGeneratingCards(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please sign in to generate flashcards.')
        setActiveMaterialForFlashcards(null)
        setGeneratingCards(false)
        return
      }

      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: material.title,
          category: material.category,
          notes: material.notes,
        }),
      })

      const data = await res.json()
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards)
        // Persist deck permanently in localStorage
        try {
          localStorage.setItem(`notetoself_deck_${material.id}`, JSON.stringify(data.flashcards))
          setSavedDecks((prev) => ({ ...prev, [material.id]: data.flashcards }))
        } catch (e) {}
      } else {
        alert(data.error || 'Could not generate flashcards.')
        setActiveMaterialForFlashcards(null)
      }
    } catch (err: any) {
      alert('Failed to connect to flashcard generator.')
      setActiveMaterialForFlashcards(null)
    } finally {
      setGeneratingCards(false)
    }
  }

  // Categories extraction
  const categories = ['All', ...Array.from(new Set(materials.map((m) => m.category || 'General')))]

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

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
          <BookOpen size={16} className="text-accent" /> Materials Hub
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Add Material Form */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-xl p-6 bg-card sticky top-24 shadow-sm">
            <h2 className="text-xl font-semibold font-serif mb-1">Add Material</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Save lecture notes, study guides, and article summaries for AI analysis.
            </p>

            <form onSubmit={handleAddMaterial} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Molecular Genetics & DNA Replication"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Category / Subject
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Biology, History, Computer Science"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Reference URL (Optional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://notion.so/... or https://arxiv.org/..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">
                  Notes & Key Concepts
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste lecture excerpts, bullet points, or core formulas..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                />
              </div>

              <button
                type="submit"
                className="bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 mt-2 transition-opacity cursor-pointer"
              >
                <Plus size={16} /> Save Material
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List of Saved Materials */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold font-serif">Study Materials</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {materials.length} total saved item{materials.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Materials List */}
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
              Loading materials...
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/40">
              <BookOpen size={32} className="mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-medium text-foreground">No materials found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try clearing your filters or search query.'
                  : 'Add your first study guide or lecture note on the left to start learning!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMaterials.map((m) => {
                const hasSavedDeck = Boolean(savedDecks[m.id] && savedDecks[m.id].length > 0)

                return (
                  <div
                    key={m.id}
                    className="border border-border rounded-xl p-5 bg-card hover:border-border/80 transition-all flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-accent border border-accent/20 bg-accent/5 px-2.5 py-0.5 rounded-full">
                            {m.category || 'General'}
                          </span>
                          {hasSavedDeck && (
                            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={11} /> 5 Cards Ready
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold font-serif mt-2 text-foreground">
                          {m.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-muted"
                        title="Delete material"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {m.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {m.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        {/* AI Flashcards Button */}
                        <button
                          onClick={() => handleOpenFlashcards(m)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                            hasSavedDeck
                              ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white'
                              : 'bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Sparkles size={13} />
                          <span>{hasSavedDeck ? 'Review Deck' : 'Create Flashcards'}</span>
                        </button>

                        {/* Chat Link */}
                        <Link
                          href="/dashboard/chat"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md transition-colors"
                        >
                          <MessageSquare size={13} />
                          <span>Ask AI</span>
                        </Link>
                      </div>

                      {m.link && (
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1 transition-colors"
                        >
                          View Source <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* AI Flashcard Study Modal */}
      {activeMaterialForFlashcards && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl relative flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                    Active Recall Deck
                  </span>
                  {savedDecks[activeMaterialForFlashcards.id] && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Saved
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold font-serif text-foreground mt-0.5 line-clamp-1">
                  {activeMaterialForFlashcards.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Regenerate Button */}
                {!generatingCards && flashcards.length > 0 && (
                  <button
                    onClick={() => handleOpenFlashcards(activeMaterialForFlashcards, true)}
                    className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 border border-border px-2 py-1 rounded-md transition-colors cursor-pointer"
                    title="Generate a fresh deck of questions"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                )}
                <button
                  onClick={() => setActiveMaterialForFlashcards(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {generatingCards ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <Sparkles size={32} className="text-accent animate-spin" />
                <p className="text-sm font-medium text-foreground">
                  Synthesizing High-Yield Flashcards with AI...
                </p>
                <p className="text-xs text-muted-foreground">
                  Targeting tricky concepts and exam blind spots
                </p>
              </div>
            ) : flashcards.length > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Progress Bar & Counter */}
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>Card {cardIndex + 1} of {flashcards.length}</span>
                  <span>Click card to reveal answer</span>
                </div>

                {/* Flip Card Component */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[220px] rounded-xl border p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none ${
                    isFlipped
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 hover:bg-muted/70 text-foreground border-border'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-3">
                    {isFlipped ? 'Answer' : 'Question'}
                  </span>
                  <p className="text-base sm:text-lg font-serif font-medium leading-relaxed max-w-sm">
                    {isFlipped ? flashcards[cardIndex].back : flashcards[cardIndex].front}
                  </p>
                  <div className="mt-4 text-xs opacity-50 flex items-center gap-1">
                    <RotateCw size={12} /> {isFlipped ? 'Click to see question' : 'Click to flip'}
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={cardIndex === 0}
                    onClick={() => {
                      setIsFlipped(false)
                      setCardIndex((prev) => prev - 1)
                    }}
                    className="inline-flex items-center gap-1 text-xs border border-border px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="text-xs text-accent font-medium hover:underline"
                  >
                    {isFlipped ? 'Show Front' : 'Show Back'}
                  </button>

                  <button
                    disabled={cardIndex === flashcards.length - 1}
                    onClick={() => {
                      setIsFlipped(false)
                      setCardIndex((prev) => prev + 1)
                    }}
                    className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-30 cursor-pointer"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
