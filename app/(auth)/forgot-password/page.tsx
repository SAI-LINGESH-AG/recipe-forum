'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { makeAbsoluteUrl } from '@/lib/site-url'

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
      redirectTo: makeAbsoluteUrl('/reset-password'),
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: '460px', margin: '56px auto', padding: '0 20px' }}>
      <section style={{ border: '1px solid var(--card-border)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-soft)' }}>
      <h1 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '6px' }}>Forgot password</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>
        Enter your email and we will send you a reset link.
      </p>
      <form onSubmit={handleForgotPassword} style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px',
            cursor: 'pointer',
            borderRadius: '10px',
            border: '1px solid var(--brand)',
            background: 'var(--brand)',
            color: 'white',
            fontWeight: 700,
          }}
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
        <Link href="/login">Back to sign in</Link>
      </p>
      </section>
    </main>
  )
}