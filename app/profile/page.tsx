'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { friendlyProfilesWriteError } from '@/lib/user-friendly-errors'

type Profile = {
  id: string
  username: string
  full_name: string | null
  bio: string | null
}

type UserRecipe = {
  id: string
  title: string
  slug: string
  description: string | null
  created_at: string
  is_published: boolean | null
}

type ProfileFormState = {
  username: string
  fullName: string
  bio: string
}

function trimFormState(f: ProfileFormState): ProfileFormState {
  return {
    username: f.username.trim(),
    fullName: f.fullName.trim(),
    bio: f.bio.trim(),
  }
}

function formStatesEqual(a: ProfileFormState, b: ProfileFormState): boolean {
  const ta = trimFormState(a)
  const tb = trimFormState(b)
  return ta.username === tb.username && ta.fullName === tb.fullName && ta.bio === tb.bio
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<UserRecipe[]>([])
  const [form, setForm] = useState<ProfileFormState>({
    username: '',
    fullName: '',
    bio: '',
  })
  const [baselineForm, setBaselineForm] = useState<ProfileFormState>({
    username: '',
    fullName: '',
    bio: '',
  })

  const hasUnsavedChanges = useMemo(() => !formStatesEqual(form, baselineForm), [form, baselineForm])

  useEffect(() => {
    async function fetchProfileAndRecipes() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      setUserId(user.id)

      const [{ data: profileData, error: profileError }, { data: recipeData, error: recipeError }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id,username,full_name,bio')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('recipes')
            .select('id,title,slug,description,created_at,is_published')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false }),
        ])

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      if (recipeError) {
        setError(recipeError.message)
      } else {
        setRecipes((recipeData as UserRecipe[]) ?? [])
      }

      const nextForm: ProfileFormState = profileData
        ? (() => {
            const profile = profileData as Profile
            return {
              username: (profile.username ?? '').trim(),
              fullName: (profile.full_name ?? '').trim(),
              bio: (profile.bio ?? '').trim(),
            }
          })()
        : {
            username: (user.email?.split('@')[0] ?? '').trim(),
            fullName: '',
            bio: '',
          }

      setForm(nextForm)
      setBaselineForm(nextForm)

      setLoading(false)
    }

    fetchProfileAndRecipes()
  }, [router])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const payload = {
      id: userId,
      username: form.username.trim(),
      full_name: form.fullName.trim() || null,
      bio: form.bio.trim() || null,
    }

    if (!payload.username) {
      setError('Username is required.')
      setSaving(false)
      return
    }

    const { error: upsertError } = await supabase.from('profiles').upsert(payload)

    if (upsertError) {
      setError(friendlyProfilesWriteError(upsertError))
      setSaving(false)
      return
    }

    const savedForm: ProfileFormState = {
      username: payload.username,
      fullName: payload.full_name ?? '',
      bio: payload.bio ?? '',
    }
    setForm(savedForm)
    setBaselineForm(savedForm)
    setMessage('Profile saved successfully.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main style={{ maxWidth: '960px', margin: '48px auto', padding: '0 20px' }}>
        <p>Loading profile...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '960px', margin: '56px auto', padding: '0 20px', display: 'grid', gap: '18px' }}>
      <section style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '18px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '10px' }}>My Profile</h1>
        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '10px' }}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !hasUnsavedChanges}
            style={{
              width: 'fit-content',
              borderRadius: '10px',
              padding: '9px 14px',
              border: '1px solid var(--brand)',
              background: 'var(--brand)',
              color: 'white',
              fontWeight: 700,
              cursor: saving || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
              opacity: saving || !hasUnsavedChanges ? 0.55 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
        {error && <p style={{ marginTop: '10px', color: 'red' }}>{error}</p>}
        {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
      </section>

      <section style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '18px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>My Recipes</h2>
        {recipes.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>
            You have not published any recipes yet. <Link href="/recipes/new">Share your first recipe</Link>.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {recipes.map((recipe) => (
              <article key={recipe.id} style={{ border: '1px solid var(--card-border)', borderRadius: '12px', padding: '13px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{recipe.title}</h3>
                {recipe.description && <p style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>{recipe.description}</p>}
                <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                  {recipe.is_published ? 'Published' : 'Draft'} · {new Date(recipe.created_at).toLocaleDateString()}
                </p>
                <p style={{ marginTop: '8px' }}>
                  <Link href={`/recipes/${recipe.slug}`}>View recipe</Link>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
