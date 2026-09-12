import React from 'react'
import { TimerProvider } from '@/context/TimerContext'
import FloatingTimer from '@/components/FloatingTimer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TimerProvider>
      {children}
      <FloatingTimer />
    </TimerProvider>
  )
}
