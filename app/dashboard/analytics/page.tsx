'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTimer } from '@/context/TimerContext'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Flame,
  BarChart2,
  Play,
  Pause,
  RotateCcw,
  Save,
  Bell,
  CheckCircle,
} from 'lucide-react'

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
  const router = useRouter()

  // Use Global Persistent Timer Context
  const {
    timerSeconds,
    initialTimerMinutes,
    isRunning,
    timerTopic,
    setTimerTopic,
    sessionCompletedAlert,
    setSessionCompletedAlert,
    notificationStatus,
    startPresetTimer,
    toggleTimer,
    resetTimer,
    requestNotificationPermission,
    formatTime,
  } = useTimer()

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSaveTimerSession = async () => {
    if (!timerTopic.trim()) {
      alert('Please enter what topic you focused on.')
      return
    }

    const elapsedSeconds = initialTimerMinutes * 60 - timerSeconds
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('habit_logs').insert([
      {
        topic: timerTopic.trim(),
        duration_minutes: elapsedMinutes,
        notes: `Logged from ${initialTimerMinutes}m focus timer`,
        user_id: user.id,
      },
    ])

    if (error) {
      alert(error.message)
    } else {
      setTimerTopic('')
      setSessionCompletedAlert(false)
      resetTimer()
      fetchLogs()
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
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
      {
        topic: topic.trim(),
        duration_minutes: Number(duration),
        notes: notes.trim() || null,
        user_id: user.id,
      },
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
    if (!confirm('Delete this habit entry?')) return
    const { error } = await supabase.from('habit_logs').delete().eq('id', id)
    if (!error) {
      setLogs(logs.filter((l) => l.id !== id))
    }
  }

  // Analytics Metrics
  const totalMinutes = logs.reduce((acc, log) => acc + log.duration_minutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const totalSessions = logs.length

  // Calculate Streak
  const streakCount = useMemo(() => {
    if (logs.length === 0) return 0
    const dates = Array.from(
      new Set(logs.map((l) => new Date(l.created_at).toISOString().split('T')[0]))
    ).sort().reverse()

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (dates[0] !== today && dates[0] !== yesterday) return 0

    let count = 0
    let checkDate = new Date(dates[0])

    for (let i = 0; i < dates.length; i++) {
      const current = new Date(dates[i])
      const diffDays = Math.round(
        (checkDate.getTime() - current.getTime()) / (1000 * 3600 * 24)
      )
      if (diffDays <= 1) {
        count++
        checkDate = current
      } else {
        break
      }
    }
    return count
  }, [logs])

  // Weekly 7-Day Activity Chart
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const result = days.map((day) => ({ day, minutes: 0 }))

    const now = new Date()

    logs.forEach((log) => {
      const logDate = new Date(log.created_at)
      const diffTime = now.getTime() - logDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))

      if (diffDays < 7) {
        const logDayIndex = (logDate.getDay() + 6) % 7
        result[logDayIndex].minutes += log.duration_minutes
      }
    })

    const maxMinutes = Math.max(...result.map((r) => r.minutes), 60)
    return { days: result, maxMinutes }
  }, [logs])

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
          <BarChart2 size={16} className="text-accent" /> Habit Analytics & Timer
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Live Focus Timer Component */}
        <div className="border border-border rounded-2xl p-8 bg-card flex flex-col items-center justify-center text-center gap-4 shadow-sm relative overflow-hidden">
          {sessionCompletedAlert && (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 mb-2 animate-bounce shadow-xs">
              <CheckCircle size={16} />
              <span>Great job! Session complete. Enter a topic below to save your progress.</span>
            </div>
          )}

          <div className="flex items-center justify-between w-full max-w-sm px-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              Focus Session
            </span>
            {notificationStatus !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="text-[11px] text-muted-foreground hover:text-accent flex items-center gap-1 font-mono cursor-pointer transition-colors"
                title="Enable desktop notifications"
              >
                <Bell size={12} /> Enable Alerts
              </button>
            )}
          </div>

          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight font-mono my-2 text-foreground">
            {formatTime(timerSeconds)}
          </h1>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mb-2">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => startPresetTimer(mins)}
                className={`px-3.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  initialTimerMinutes === mins && !isRunning
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTimer}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-medium hover:opacity-90 inline-flex items-center gap-2 transition-opacity cursor-pointer shadow-sm"
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Pause Focus' : 'Start Focus'}
            </button>
            <button
              onClick={resetTimer}
              className="border border-border p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Quick Save Session */}
          <div className="w-full max-w-md mt-4 pt-4 border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={timerTopic}
              onChange={(e) => setTimerTopic(e.target.value)}
              placeholder="What did you focus on? (e.g. Biochem Chapter 2)"
              className="flex-1 bg-background border border-border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSaveTimerSession}
              className="bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-lg text-xs font-medium hover:bg-muted inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Save size={14} /> Log Session
            </button>
          </div>
        </div>

        {/* Overview Metric Cards + Streak */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border p-5 rounded-xl bg-card flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
                Total Focus Time
              </p>
              <h3 className="text-2xl font-bold mt-1 font-serif">
                {totalHours} <span className="text-sm font-sans font-normal text-muted-foreground">hrs</span>
              </h3>
            </div>
          </div>

          <div className="border border-border p-5 rounded-xl bg-card flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
                Study Streak
              </p>
              <h3 className="text-2xl font-bold mt-1 font-serif">
                {streakCount} <span className="text-sm font-sans font-normal text-muted-foreground">day{streakCount === 1 ? '' : 's'}</span>
              </h3>
            </div>
          </div>

          <div className="border border-border p-5 rounded-xl bg-card flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-accent/10 rounded-xl text-accent">
              <BarChart2 size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
                Total Sessions
              </p>
              <h3 className="text-2xl font-bold mt-1 font-serif">
                {totalSessions} <span className="text-sm font-sans font-normal text-muted-foreground">logged</span>
              </h3>
            </div>
          </div>
        </div>

        {/* 7-Day Weekly Focus Bar Chart */}
        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold font-serif">Weekly Focus Breakdown</h2>
              <p className="text-xs text-muted-foreground">Study minutes logged over the last 7 days</p>
            </div>
            <span className="text-xs font-mono text-accent">
              {weeklyData.days.reduce((acc, d) => acc + d.minutes, 0)} mins this week
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-40 pt-4">
            {weeklyData.days.map((item) => {
              const heightPercent = Math.max(8, (item.minutes / weeklyData.maxMinutes) * 100)
              return (
                <div key={item.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.minutes}m
                  </span>
                  <div
                    className={`w-full max-w-[36px] rounded-t-md transition-all ${
                      item.minutes > 0
                        ? 'bg-accent group-hover:opacity-90'
                        : 'bg-muted border border-border/50'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-mono text-muted-foreground">
                    {item.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form and Log History */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Manual Entry Column */}
          <div className="md:col-span-1">
            <form onSubmit={handleAddLog} className="border border-border p-6 rounded-xl bg-card flex flex-col gap-4 shadow-sm">
              <h2 className="text-lg font-semibold font-serif">Manual Log Entry</h2>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Topic / Subject *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Duration (Minutes) *</label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1 font-medium">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What key problems did you solve?"
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                />
              </div>

              <button
                type="submit"
                className="bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2 mt-2 transition-opacity cursor-pointer"
              >
                <Plus size={16} /> Log Session
              </button>
            </form>
          </div>

          {/* Session History List */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold font-serif mb-4">Recent Sessions</h2>

            {loading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading history...</p>
            ) : logs.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center text-sm text-muted-foreground bg-card/40">
                No study sessions logged yet. Use the timer or form to record your first session!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border rounded-xl p-4 bg-card flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-foreground font-serif">{log.topic}</h3>
                        <span className="text-xs bg-accent/10 text-accent font-mono px-2 py-0.5 rounded-md font-medium">
                          {log.duration_minutes} mins
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{log.notes}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono mt-1.5">
                        {new Date(log.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-muted"
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