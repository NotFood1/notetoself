'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ExternalLink, BookOpen } from 'lucide-react'

interface Material {
  id: string
  title: string
  category: string
  link?: string
  notes?: string
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('materials')
      .select('*')
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
      { title, category, link, notes, user_id: user.id }
    ])

    if (error) {
      alert(error.message)
    } else {
      setTitle('')
      setLink('')
      setNotes('')
      fetchMaterials()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) {
      setMaterials(materials.filter(m => m.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="border-b border-border bg-background/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium">
          <BookOpen size={16} className="text-primary" /> Materials Hub
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="md:col-span-1">
          <form onSubmit={handleAddMaterial} className="border border-border p-5 rounded bg-card flex flex-col gap-4">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Add Material
            </h2>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Packaging Design Brief"
                className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Design, Research, Exam"
                className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Link URL (Optional)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key takeaways or summary..."
                rows={3}
                className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <button
              type="submit"
              className="bg-primary text-primary-foreground p-2 rounded text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 mt-2"
            >
              <Plus size={16} /> Save Material
            </button>
          </form>
        </div>

        {/* Display Column */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Saved Materials
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading materials...</p>
          ) : materials.length === 0 ? (
            <div className="border border-dashed border-border rounded p-8 text-center text-sm text-muted-foreground">
              No materials saved yet. Add your first study material on the left!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {materials.map((m) => (
                <div key={m.id} className="border border-border rounded p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-primary border border-primary/30 px-2 py-0.5 rounded font-mono">
                        {m.category}
                      </span>
                      <h3 className="text-base font-medium mt-2">{m.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Delete material"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {m.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {m.notes}
                    </p>
                  )}

                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary inline-flex items-center gap-1 hover:underline self-start"
                    >
                      View Source <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
