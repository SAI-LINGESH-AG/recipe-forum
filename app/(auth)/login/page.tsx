'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setShowForgotPassword(false)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      const loweredMessage = error.message.toLowerCase()
      const invalidCredentials =
        loweredMessage.includes('invalid login credentials') ||
        loweredMessage.includes('invalid email') ||
        loweredMessage.includes('invalid password')
      setShowForgotPassword(invalidCredentials)
    } else {
      router.push('/')
    }

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: '460px', margin: '56px auto', padding: '0 20px' }}>
      <section style={{ border: '1px solid var(--card-border)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-soft)' }}>
      <h1 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '4px' }}>Sign in</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '18px' }}>Welcome back to your recipe community.</p>
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {showForgotPassword && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/forgot-password" style={{ fontSize: '14px', color: '#dc2626', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px',
            cursor: 'pointer',
            marginTop: '2px',
            borderRadius: '10px',
            border: '1px solid var(--brand)',
            background: 'var(--brand)',
            color: 'white',
            fontWeight: 700,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '16px', color: 'red' }}>
          {message}
        </p>
      )}
      <p style={{ marginTop: '14px', color: 'var(--muted-foreground)', fontSize: '14px' }}>
        New to RecipeForum? <Link href="/signup">Create an account</Link>
      </p>
      </section>
    </main>
  )
}