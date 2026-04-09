'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated successfully. Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    }

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: '400px', margin: '100px auto', padding: '0 20px' }}>
      <h1>Reset password</h1>
      <p style={{ color: 'gray' }}>Enter your new password below.</p>
      <form onSubmit={handleResetPassword}>
        <div style={{ marginBottom: '12px' }}>
          <label>New password</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '16px', color: message.includes('successfully') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
    </main>
  )
}