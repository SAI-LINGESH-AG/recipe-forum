'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    getUser()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserEmail(null)
  }

  return (
    <main style={{ maxWidth: '400px', margin: '100px auto', padding: '0 20px' }}>
      <h1>Recipe Forum — coming soon</h1>
      {userEmail ? (
        <div>
          <p>Logged in as: <strong>{userEmail}</strong></p>
          <button onClick={handleSignOut} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      ) : (
        <p>You are not logged in. <a href="/login">Sign in</a></p>
      )}
    </main>
  )
}