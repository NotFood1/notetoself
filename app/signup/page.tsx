'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.session) {
        // Auto-confirmed / instant session
        router.push('/dashboard')
      } else {
        setSuccessMsg('Account created! Check your email to confirm your account and sign in.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-semibold font-serif hover:opacity-80 transition-opacity">
          notetoself
        </Link>
        <Link href="/login" className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          Already have an account? &rarr;
        </Link>
      </header>

      {/* Main Signup Card */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md border border-border rounded-xl p-8 bg-card shadow-sm">
          <div className="mb-6">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              Get Started
            </span>
            <h1 className="text-3xl font-semibold font-serif mt-1">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start building your focused study system today.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign In
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