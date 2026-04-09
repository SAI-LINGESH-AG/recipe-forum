'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, UtensilsCrossed, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    window.location.href = '/login'
  }

  return (
    <nav style={{
      borderBottom: '1px solid #e5e7eb',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--background)',
    }}>

      {/* Logo */}
      <a href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '20px',
      }}>
        <UtensilsCrossed size={24} />
        <span>RecipeForum</span>
      </a>

      {/* Desktop nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        {userEmail ? (
          <>
            <a href="/recipes/new" style={{ textDecoration: 'none', fontWeight: '500' }}>
              Share Recipe
            </a>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: '1px solid #e5e7eb', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <a href="/login" style={{ textDecoration: 'none', fontWeight: '500' }}>
              Sign in
            </a>
            <a href="/signup" style={{
              textDecoration: 'none',
              fontWeight: '500',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
            }}>
              Sign up
            </a>
          </>
        )}
      </div>
    </nav>
  )
}