'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  BarChart2,
  LogOut,
  Clock,
  Layers,
  Sparkles,
  Plus,
  Play,
  User,
} from 'lucide-react'

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

      // 2. Fetch User-Scoped Total Materials Count
      const { count: matCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      setMaterialsCount(matCount || 0)

      // 3. Fetch User-Scoped Total Focus Time
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('duration_minutes')
        .eq('user_id', session.user.id)

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
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="text-accent animate-spin" size={28} />
          <p className="text-sm text-muted-foreground font-mono">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Dashboard Nav */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight font-serif text-foreground hover:opacity-80 transition-opacity"
          >
            notetoself
          </Link>
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              <User size={13} className="text-accent" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-12 py-10 flex-1 flex flex-col gap-10">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <span className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
              Workspace Overview
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight font-serif mt-1">
              Welcome back.
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Track your focus sessions, map your study guides, and test your retention with AI.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/materials"
              className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              <Plus size={14} /> Add Study Note
            </Link>
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center gap-1.5 text-xs border border-border text-foreground font-medium px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Play size={13} className="text-accent" /> 25m Focus
            </Link>
          </div>
        </div>

        {/* Dynamic Grid Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. Materials Hub Card */}
          <Link
            href="/dashboard/materials"
            className="border border-border rounded-xl p-6 bg-card hover:border-accent transition-all cursor-pointer block group flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-accent/10 text-accent rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <BookOpen size={20} />
                </div>
                <div className="flex items-center gap-1 text-xs font-mono bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                  <Layers size={12} className="text-accent" /> {materialsCount} Saved
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-serif text-foreground group-hover:text-accent transition-colors">
                Materials Hub
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Organize lecture notes, create flashcards with AI, and manage study references.
              </p>
            </div>
            <span className="text-xs font-medium text-accent inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Materials &rarr;
            </span>
          </Link>

          {/* 2. AI Chatbot Card */}
          <Link
            href="/dashboard/chat"
            className="border border-accent/40 rounded-xl p-6 bg-card hover:border-accent transition-all cursor-pointer block group flex flex-col justify-between shadow-sm hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-accent text-accent-foreground rounded-lg">
                  <Sparkles size={20} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-full">
                  Groq Powered
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-serif text-foreground group-hover:text-accent transition-colors">
                AI Study Copilot
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Chat against your uploaded notes. Generate instant quizzes, find pitfalls, and review key concepts.
              </p>
            </div>
            <span className="text-xs font-medium text-accent inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Start Conversation &rarr;
            </span>
          </Link>

          {/* 3. Habit Analytics Card */}
          <Link
            href="/dashboard/analytics"
            className="border border-border rounded-xl p-6 bg-card hover:border-accent transition-all cursor-pointer block group flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-accent/10 text-accent rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <BarChart2 size={20} />
                </div>
                <div className="flex items-center gap-1 text-xs font-mono bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                  <Clock size={12} className="text-accent" /> {totalFocusHours}h Logged
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-serif text-foreground group-hover:text-accent transition-colors">
                Focus & Analytics
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Drift-safe Pomodoro focus timer with 7-day visual activity breakdown and streak tracking.
              </p>
            </div>
            <span className="text-xs font-medium text-accent inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Analytics &rarr;
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}