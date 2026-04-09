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
    <main style={{ maxWidth: '460px', margin: '72px auto', padding: '0 20px' }}>
      <section style={{ border: '1px solid var(--card-border)', borderRadius: '16px', padding: '22px' }}>
      <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '6px' }}>Reset password</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }}>Enter your new password below.</p>
      <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px' }}>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: '16px', color: message.includes('successfully') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
      </section>
    </main>
  )
}