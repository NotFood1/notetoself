'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen, MessageSquare, BarChart2, LogOut, Clock, Layers } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [materialsCount, setMaterialsCount] = useState(0)
  const [totalFocusHours, setTotalFocusHours] = useState('0.0')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Check Auth Session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // 2. Fetch Total Materials Count
      const { count: matCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
      
      setMaterialsCount(matCount || 0)

      // 3. Fetch Total Focus Time
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('duration_minutes')
      
      if (logs) {
        const totalMins = logs.reduce((acc, log) => acc + log.duration_minutes, 0)
        setTotalFocusHours((totalMins / 60).toFixed(1))
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Dashboard Nav */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            notetoself
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="mb-12">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
            Workspace Overview
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Welcome back.
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Here is your current study progress and active workspace modules.
          </p>
        </div>

        {/* Dynamic Grid Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* 1. Materials Hub Card (Dynamic) */}
          <Link 
            href="/dashboard/materials" 
            className="border border-border rounded p-6 bg-card hover:border-primary transition-colors cursor-pointer block group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="text-accent group-hover:text-primary transition-colors" size={24} />
                <div className="flex items-center gap-1 text-xs font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                  <Layers size={12} /> {materialsCount} Saved
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                Materials Hub
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your notes, design briefs, and study links.
              </p>
            </div>
            <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:underline">
              Open Hub <ArrowRight size={12} />
            </span>
          </Link>

          {/* 2. AI Chatbot Card */}
          <Link 
            href="/dashboard/chat" 
            className="border border-border rounded p-6 bg-card hover:border-primary transition-colors cursor-pointer block group flex flex-col justify-between shadow-sm border-primary/20"
          >
            <div>
              <MessageSquare className="text-primary mb-4" size={24} />
              <h3 className="text-lg font-semibold mb-2 text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                AI Chatbot (Groq)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your study assistant. Context is active and ready to answer questions.
              </p>
            </div>
            <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:underline">
              Start Chat <ArrowRight size={12} />
            </span>
          </Link>

          {/* 3. Habit Analytics Card (Dynamic) */}
          <Link 
            href="/dashboard/analytics" 
            className="border border-border rounded p-6 bg-card hover:border-primary transition-colors cursor-pointer block group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <BarChart2 className="text-accent group-hover:text-primary transition-colors" size={24} />
                <div className="flex items-center gap-1 text-xs font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                  <Clock size={12} /> {totalFocusHours}h Total
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                Focus & Analytics
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use the Pomodoro timer and track your logged study sessions.
              </p>
            </div>
            <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:underline">
              View Analytics <ArrowRight size={12} />
            </span>
          </Link>
          
        </div>
      </main>
    </div>
  )
}