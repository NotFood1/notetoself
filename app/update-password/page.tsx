'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      alert(error.message)
    } else {
      alert('Password updated successfully!')
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-8 border border-border rounded w-80">
        <h1 className="text-2xl font-semibold mb-4">Set New Password</h1>
        <input 
          type="password" 
          placeholder="New Password" 
          onChange={(e) => setPassword(e.target.value)} 
          className="p-2 border rounded" 
          required 
        />
        <button type="submit" className="bg-primary text-primary-foreground p-2 rounded hover:opacity-90">
          Update Password
        </button>
      </form>
    </div>
  )
}