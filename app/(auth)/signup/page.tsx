'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username,
        },
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Success! Check your email to confirm your account.')
    }

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: '460px', margin: '72px auto', padding: '0 20px' }}>
      <section style={{ border: '1px solid var(--card-border)', borderRadius: '16px', padding: '22px' }}>
      <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '4px' }}>Create your account</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '18px' }}>Join and start sharing your best recipes.</p>
      <form onSubmit={handleSignup} style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
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
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '16px', color: message.includes('Success') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
      <p style={{ marginTop: '14px', color: 'var(--muted-foreground)', fontSize: '14px' }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
      </section>
    </main>
  )
}