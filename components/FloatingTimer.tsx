'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTimer } from '@/context/TimerContext'
import { Play, Pause, Clock, ArrowRight, CheckCircle } from 'lucide-react'

export default function FloatingTimer() {
  const pathname = usePathname()
  const {
    timerSeconds,
    isRunning,
    timerTopic,
    formatTime,
    toggleTimer,
    sessionCompletedAlert,
    initialTimerMinutes,
  } = useTimer()

  // Don't show floating timer if user is already on the Analytics page
  if (pathname === '/dashboard/analytics') {
    return null
  }

  // Only show if running, or if paused with time elapsed, or if completed alert is active
  const isTimerActive = isRunning || timerSeconds < initialTimerMinutes * 60 || sessionCompletedAlert

  if (!isTimerActive) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="border border-border/80 bg-card/95 backdrop-blur-md shadow-xl rounded-2xl p-3 pr-4 flex items-center gap-3 text-foreground">
        {sessionCompletedAlert ? (
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <CheckCircle size={18} className="animate-bounce shrink-0" />
            <span className="font-medium font-serif">Focus Complete! Click to log</span>
            <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            {/* Pulsing indicator */}
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-accent/10 text-accent">
              <Clock size={16} />
              {isRunning && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                </span>
              )}
            </div>

            {/* Time & Topic */}
            <Link
              href="/dashboard/analytics"
              className="flex flex-col cursor-pointer group"
              title="Open Focus & Analytics"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm text-foreground tracking-tight group-hover:text-accent transition-colors">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                  {isRunning ? 'Focusing' : 'Paused'}
                </span>
              </div>
              {timerTopic && (
                <span className="text-[11px] text-muted-foreground max-w-[120px] truncate leading-tight">
                  {timerTopic}
                </span>
              )}
            </Link>

            {/* Quick Play/Pause Control */}
            <button
              onClick={toggleTimer}
              className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors cursor-pointer"
              title={isRunning ? 'Pause Timer' : 'Resume Timer'}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>

            {/* Link to Analytics */}
            <Link
              href="/dashboard/analytics"
              className="text-xs text-muted-foreground hover:text-foreground p-1"
              title="Expand to Full Analytics"
            >
              <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
