'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard') // Redirects them to the dashboard after login
    }
  }

  const handleForgotPassword = async () => {
  if (!email) {
    alert("Please enter your email address first.")
    return
  }

  // PUT IT HERE: This triggers the email with the correct redirect path
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/update-password',
  })

  if (error) {
    alert(error.message)
  } else {
    alert('Check your email for the password reset link!')
  }
}
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 border border-border rounded w-80">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          className="p-2 border rounded" 
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
          className="p-2 border rounded" 
        />
        <button 
          type="button" 
          onClick={handleForgotPassword}
          className="text-xs text-muted-foreground hover:text-foreground text-left underline"
        >
          Forgot password?
        </button>
        
        <button type="submit" className="bg-primary text-primary-foreground p-2 rounded hover:opacity-90">
          Login
        </button>
      </form>
    </div>
  )
}