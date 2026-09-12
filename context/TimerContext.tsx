'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'

interface TimerContextType {
  timerSeconds: number
  initialTimerMinutes: number
  isRunning: boolean
  targetEndTime: number | null
  timerTopic: string
  sessionCompletedAlert: boolean
  notificationStatus: string
  setTimerTopic: (topic: string) => void
  setSessionCompletedAlert: (alert: boolean) => void
  startPresetTimer: (minutes: number) => void
  toggleTimer: () => void
  resetTimer: () => void
  requestNotificationPermission: () => Promise<void>
  formatTime: (seconds: number) => string
}

const TimerContext = createContext<TimerContextType | null>(null)

// Web Audio API Focus Chime
function playFocusChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3) // A5

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(440, ctx.currentTime) // A4
    osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.4) // E5

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start()
    osc2.start()
    osc1.stop(ctx.currentTime + 1.2)
    osc2.stop(ctx.currentTime + 1.2)
  } catch (err) {
    console.log('Audio playback prevented by browser policy')
  }
}

// Send system notification
function sendDesktopNotification(topicName?: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ Focus Session Complete!', {
      body: topicName
        ? `Great job focusing on "${topicName}"! Take a break or log your notes.`
        : 'Great job! Your focus session is complete. Take a short break.',
      icon: '/favicon.ico',
    })
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [initialTimerMinutes, setInitialTimerMinutes] = useState(25)
  const [isRunning, setIsRunning] = useState(false)
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null)
  const [timerTopic, setTimerTopic] = useState('')
  const [sessionCompletedAlert, setSessionCompletedAlert] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState<string>('default')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load persisted state from localStorage on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('Notification' in window) {
      setNotificationStatus(Notification.permission)
    }

    try {
      const savedRunning = localStorage.getItem('notetoself_timer_running') === 'true'
      const savedTarget = localStorage.getItem('notetoself_timer_target')
      const savedInitial = localStorage.getItem('notetoself_timer_initial')
      const savedTopic = localStorage.getItem('notetoself_timer_topic')
      const savedSeconds = localStorage.getItem('notetoself_timer_seconds')

      if (savedInitial) {
        setInitialTimerMinutes(Number(savedInitial))
      }
      if (savedTopic) {
        setTimerTopic(savedTopic)
      }

      if (savedRunning && savedTarget) {
        const target = Number(savedTarget)
        const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000))

        if (remaining > 0) {
          setTargetEndTime(target)
          setTimerSeconds(remaining)
          setIsRunning(true)
        } else {
          // Completed while away
          setTimerSeconds(0)
          setIsRunning(false)
          setTargetEndTime(null)
          setSessionCompletedAlert(true)
          localStorage.removeItem('notetoself_timer_running')
          localStorage.removeItem('notetoself_timer_target')
        }
      } else if (savedSeconds) {
        setTimerSeconds(Number(savedSeconds))
      }
    } catch (e) {
      console.error('Failed to load timer from localStorage:', e)
    }

    setIsLoaded(true)
  }, [])

  // Sync state to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return

    try {
      localStorage.setItem('notetoself_timer_running', String(isRunning))
      localStorage.setItem('notetoself_timer_initial', String(initialTimerMinutes))
      localStorage.setItem('notetoself_timer_topic', timerTopic)
      localStorage.setItem('notetoself_timer_seconds', String(timerSeconds))

      if (targetEndTime) {
        localStorage.setItem('notetoself_timer_target', String(targetEndTime))
      } else {
        localStorage.removeItem('notetoself_timer_target')
      }
    } catch (e) {
      console.error('Failed to save timer to localStorage:', e)
    }
  }, [isRunning, targetEndTime, initialTimerMinutes, timerTopic, timerSeconds, isLoaded])

  // Countdown logic & Tab Title Sync
  useEffect(() => {
    if (!isRunning || !targetEndTime) {
      if (!sessionCompletedAlert && typeof document !== 'undefined') {
        document.title = 'notetoself — AI-Powered Study Platform'
      }
      return
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000))
      setTimerSeconds(remaining)

      // Update Browser Tab Title
      const mins = Math.floor(remaining / 60)
      const secs = remaining % 60
      if (typeof document !== 'undefined') {
        document.title = `(${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}) Focus Timer | notetoself`
      }

      if (remaining <= 0) {
        clearInterval(interval)
        setIsRunning(false)
        setTargetEndTime(null)
        setSessionCompletedAlert(true)
        if (typeof document !== 'undefined') {
          document.title = '⏰ (0:00) Focus Complete! | notetoself'
        }
        playFocusChime()
        sendDesktopNotification(timerTopic)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isRunning, targetEndTime, timerTopic, sessionCompletedAlert])

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationStatus(permission)
    }
  }

  const startPresetTimer = (minutes: number) => {
    setIsRunning(false)
    setTargetEndTime(null)
    setInitialTimerMinutes(minutes)
    setTimerSeconds(minutes * 60)
    setSessionCompletedAlert(false)
  }

  const toggleTimer = () => {
    if (!isRunning) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => setNotificationStatus(perm))
      }

      const target = Date.now() + timerSeconds * 1000
      setTargetEndTime(target)
      setIsRunning(true)
      setSessionCompletedAlert(false)
    } else {
      setIsRunning(false)
      setTargetEndTime(null)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTargetEndTime(null)
    setTimerSeconds(initialTimerMinutes * 60)
    setSessionCompletedAlert(false)
    if (typeof document !== 'undefined') {
      document.title = 'notetoself — AI-Powered Study Platform'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <TimerContext.Provider
      value={{
        timerSeconds,
        initialTimerMinutes,
        isRunning,
        targetEndTime,
        timerTopic,
        sessionCompletedAlert,
        notificationStatus,
        setTimerTopic,
        setSessionCompletedAlert,
        startPresetTimer,
        toggleTimer,
        resetTimer,
        requestNotificationPermission,
        formatTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}
