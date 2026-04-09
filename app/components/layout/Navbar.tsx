'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function syncUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }

    void syncUser()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => {
      authSubscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUserEmail(null)
    window.location.href = '/login'
  }

  const hideAccountActions =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'

  return (
    <nav style={{
      padding: '0 24px',
      height: '72px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(10px)',
      backgroundColor: 'color-mix(in srgb, var(--background) 85%, transparent)',
    }}>

      {/* Logo */}
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '22px',
      }}>
        <UtensilsCrossed size={22} />
        <span>RecipeForum</span>
      </Link>

      {/* Desktop nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'var(--background-elevated)',
              border: '1px solid var(--card-border)',
              cursor: 'pointer',
              padding: '7px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        {hideAccountActions ? null : userEmail ? (
          <>
            <Link href="/profile" style={{ textDecoration: 'none', fontWeight: '500' }}>
              Profile
            </Link>
            <Link href="/recipes/new" style={{ textDecoration: 'none', fontWeight: '500' }}>
              Share Recipe
            </Link>
            <button
              onClick={handleSignOut}
              style={{
                background: 'var(--background-elevated)',
                border: '1px solid var(--card-border)',
                padding: '7px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    </nav>
  )
}