'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: '400px', margin: '100px auto', padding: '0 20px' }}>
      <h1>Forgot password</h1>
      <p style={{ color: 'gray' }}>
        Enter your email and we will send you a reset link.
      </p>
      <form onSubmit={handleForgotPassword}>
        <div style={{ marginBottom: '12px' }}>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '16px', color: message.includes('Check') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
      <p style={{ marginTop: '16px' }}>
        <a href="/login">Back to sign in</a>
      </p>
    </main>
  )
}