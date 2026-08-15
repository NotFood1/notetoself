'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Clock, Flame, BarChart2, Play, Pause, RotateCcw, Save } from 'lucide-react'

interface HabitLog {
  id: string
  topic: string
  duration_minutes: number
  notes?: string
  created_at: string
}

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(25 * 60) // Default 25 mins
  const [initialTimerMinutes, setInitialTimerMinutes] = useState(25)
  const [isRunning, setIsRunning] = useState(false)
  const [timerTopic, setTimerTopic] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  // Timer Tick Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout)
            setIsRunning(false)
            alert('Great focus session! Your session is ready to save.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const startPresetTimer = (minutes: number) => {
    setIsRunning(false)
    setInitialTimerMinutes(minutes)
    setTimerSeconds(minutes * 60)
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimerSeconds(initialTimerMinutes * 60)
  }

  const handleSaveTimerSession = async () => {
    if (!timerTopic.trim()) {
      alert('Please enter a topic for your timer session!')
      return
    }

    // Calculate completed elapsed minutes
    const elapsedSeconds = initialTimerMinutes * 60 - timerSeconds
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habit_logs').insert([
      { topic: timerTopic, duration_minutes: elapsedMinutes, notes: 'Logged via Focus Timer', user_id: user.id }
    ])

    if (error) {
      alert(error.message)
    } else {
      setTimerTopic('')
      resetTimer()
      fetchLogs()
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLogs(data)
    }
    setLoading(false)
  }

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !duration) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habit_logs').insert([
      { topic, duration_minutes: Number(duration), notes, user_id: user.id }
    ])

    if (error) {
      alert(error.message)
    } else {
      setTopic('')
      setDuration('')
      setNotes('')
      fetchLogs()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('habit_logs').delete().eq('id', id)
    if (!error) {
      setLogs(logs.filter(l => l.id !== id))
    }
  }

  // Formatting helper for time display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Analytics calculations
  const totalMinutes = logs.reduce((acc, log) => acc + log.duration_minutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const totalSessions = logs.length

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="border-b border-border bg-background/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium">
          <BarChart2 size={16} className="text-primary" /> Habit Analytics & Timer
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Live Focus Timer Section */}
        <div className="border border-border rounded-lg p-6 bg-card flex flex-col items-center justify-center text-center gap-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Focus Timer
          </span>
          
          <h1 className="text-6xl font-bold tracking-tight font-mono my-2 text-primary">
            {formatTime(timerSeconds)}
          </h1>

          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => startPresetTimer(15)}
              className="px-3 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
            >
              15m
            </button>
            <button
              onClick={() => startPresetTimer(25)}
              className="px-3 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
            >
              25m (Pomodoro)
            </button>
            <button
              onClick={() => startPresetTimer(45)}
              className="px-3 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
            >
              45m
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTimer}
              className="bg-primary text-primary-foreground px-6 py-2 rounded text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Pause' : 'Start Focus'}
            </button>
            <button
              onClick={resetTimer}
              className="border border-border p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Quick Save Session Form */}
          <div className="w-full max-w-md mt-4 pt-4 border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={timerTopic}
              onChange={(e) => setTimerTopic(e.target.value)}
              placeholder="What topic are you studying?"
              className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSaveTimerSession}
              className="bg-secondary text-secondary-foreground border border-border px-3 py-2 rounded text-xs font-medium hover:bg-muted inline-flex items-center gap-1"
            >
              <Save size={14} /> Save Session
            </button>
          </div>
        </div>

        {/* Analytics Overview Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border p-5 rounded bg-card flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Focus Time</p>
              <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {totalHours} <span className="text-sm font-sans font-normal text-muted-foreground">hrs</span>
              </h3>
            </div>
          </div>

          <div className="border border-border p-5 rounded bg-card flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sessions</p>
              <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {totalSessions} <span className="text-sm font-sans font-normal text-muted-foreground">logged</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Form and Log History */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Manual Session Form */}
          <div className="md:col-span-1">
            <form onSubmit={handleAddLog} className="border border-border p-5 rounded bg-card flex flex-col gap-4">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Manual Log Entry
              </h2>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Topic / Subject *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Packaging Analysis"
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you get done?"
                  rows={3}
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                className="bg-primary text-primary-foreground p-2 rounded text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={16} /> Log Session
              </button>
            </form>
          </div>

          {/* Session History List */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Session History
            </h2>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading history...</p>
            ) : logs.length === 0 ? (
              <div className="border border-dashed border-border rounded p-8 text-center text-sm text-muted-foreground">
                No study sessions logged yet. Use the timer or manual form to log your first session!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {logs.map((log) => (
                  <div key={log.id} className="border border-border rounded p-4 bg-card flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium">{log.topic}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                          {log.duration_minutes} mins
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Delete log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}