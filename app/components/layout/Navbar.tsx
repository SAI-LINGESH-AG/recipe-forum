'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { List, Sun, Moon, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  RECIPE_FORUM_TOUR_PENDING_KEY,
  RECIPE_FORUM_TOUR_START_EVENT,
} from '@/app/components/onboarding/OnboardingTour'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
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
    if (!menuOpen) return
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUserEmail(null)
    setMenuOpen(false)
    window.location.href = '/login'
  }

  function handleStartTour() {
    setMenuOpen(false)
    if (typeof window === 'undefined') return
    if (pathname !== '/') {
      sessionStorage.setItem(RECIPE_FORUM_TOUR_PENDING_KEY, '1')
      router.push('/')
    } else {
      window.dispatchEvent(new Event(RECIPE_FORUM_TOUR_START_EVENT))
    }
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

  const menuPanelStyle = {
    position: 'absolute' as const,
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: '200px',
    padding: '8px',
    borderRadius: '12px',
    background: 'var(--background-elevated)',
    border: '1px solid var(--card-border)',
    boxShadow: '0 12px 40px color-mix(in srgb, var(--foreground) 12%, transparent)',
    zIndex: 100,
  }

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--foreground)',
    fontWeight: 600,
    fontSize: '15px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    textDecoration: 'none',
  }

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {hideAccountActions ? null : userEmail ? (
          <Link href="/recipes/new" style={navChipStyle}>
            Share Recipe
          </Link>
        ) : null}

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
            style={{
              ...navChipStyle,
              cursor: 'pointer',
              padding: '7px 12px',
            }}
          >
            <List size={22} strokeWidth={2.25} aria-hidden />
          </button>
          {menuOpen ? (
            <div style={menuPanelStyle} role="menu">
              {!hideAccountActions && userEmail ? (
                <>
                  <Link
                    href="/profile"
                    role="menuitem"
                    style={menuItemStyle}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleStartTour}
                    style={menuItemStyle}
                  >
                    Tour
                  </button>
                  <a
                    href="mailto:sailingesh664@gmail.com"
                    role="menuitem"
                    style={menuItemStyle}
                    onClick={() => setMenuOpen(false)}
                  >
                    Support
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    style={menuItemStyle}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <a
                  href="mailto:sailingesh664@gmail.com"
                  role="menuitem"
                  style={menuItemStyle}
                  onClick={() => setMenuOpen(false)}
                >
                  Support
                </a>
              )}
              {mounted ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  style={{
                    ...menuItemStyle,
                    gap: '10px',
                    marginTop: '4px',
                    borderTop: '1px solid var(--card-border)',
                    paddingTop: '12px',
                    borderRadius: '0 0 8px 8px',
                  }}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}