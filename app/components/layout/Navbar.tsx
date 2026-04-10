'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
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

  const navChipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--background-elevated)',
    border: '1px solid var(--card-border)',
    padding: '7px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 600,
    lineHeight: 1.2,
  } as const

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              ...navChipStyle,
              cursor: 'pointer',
              padding: '7px 10px',
              borderRadius: '999px',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <a href="mailto:sailingesh664@gmail.com" style={navChipStyle}>
          Support
        </a>

        {hideAccountActions ? null : userEmail ? (
          <>
            <Link href="/profile" style={navChipStyle}>
              Profile
            </Link>
            <Link href="/recipes/new" style={navChipStyle}>
              Share Recipe
            </Link>
            <button
              onClick={handleSignOut}
              style={{
                ...navChipStyle,
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