'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setErrorMsg('')
    setInfoMsg('')

    if (!email) {
      setErrorMsg('Please enter your email address above first.')
      return
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/update-password`
        : 'http://localhost:3000/update-password'

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setInfoMsg('Password reset link sent! Please check your email inbox.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email.')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-semibold font-serif hover:opacity-80 transition-opacity">
          notetoself
        </Link>
        <Link href="/signup" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Create an Account &rarr;
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md border border-border rounded-xl p-8 bg-card shadow-sm">
          <div className="mb-6">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              Welcome back
            </span>
            <h1 className="text-3xl font-semibold font-serif mt-1">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Access your saved study materials, AI copilot, and habit logs.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                Email Address
              </label>
              <input
                type="email"
                placeholder="nathan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto text-center py-4 text-xs text-muted-foreground font-mono">
        notetoself study system &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}