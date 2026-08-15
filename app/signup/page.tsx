'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Success! Check your email.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4 p-8 border border-border rounded">
        <h1 className="text-xl font-semibold">Create Account</h1>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded" />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="p-2 border rounded" />
        <button type="submit" className="bg-primary text-primary-foreground p-2 rounded">Sign Up</button>
      </form>
    </div>
  )
}