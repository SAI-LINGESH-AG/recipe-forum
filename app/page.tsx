'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import OnboardingTour from '@/app/components/onboarding/OnboardingTour'

type RecipeRow = {
  id: string
  title: string
  slug: string
  description: string | null
  cuisine_type: string
  diet_type: string
  difficulty: string
  prep_time_mins: number
  cook_time_mins: number
  servings: number
  created_at: string
  author:
    | {
        username: string
        full_name: string | null
      }
    | {
        username: string
        full_name: string | null
      }[]
    | null
}

const PAGE_SIZE = 9

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`
}

export default function Home() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')
  const [dietFilter, setDietFilter] = useState('')
  const [maxTotalTimeFilter, setMaxTotalTimeFilter] = useState('')

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      setUserId(user?.id ?? null)
    }
    getUser()
  }, [router])

  useEffect(() => {
    async function fetchRecipes() {
      setLoadingFeed(true)
      setFeedError('')

      const supabase = createClient()
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('recipes')
        .select(
          'id,title,slug,description,cuisine_type,diet_type,difficulty,prep_time_mins,cook_time_mins,servings,created_at,author:profiles!recipes_author_id_fkey(username,full_name)',
          { count: 'exact' }
        )
        .eq('is_published', true)

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`)
      }

      if (cuisineFilter) {
        query = query.ilike('cuisine_type', cuisineFilter)
      }

      if (dietFilter) {
        query = query.eq('diet_type', dietFilter)
      }

      if (maxTotalTimeFilter) {
        query = query.lte('prep_time_mins', Number(maxTotalTimeFilter))
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        setFeedError(error.message)
      } else {
        setRecipes((data as RecipeRow[]) ?? [])
        setTotalCount(count ?? 0)
      }

      setLoadingFeed(false)
    }

    fetchRecipes()
  }, [currentPage, searchQuery, cuisineFilter, dietFilter, maxTotalTimeFilter])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function getAuthorDisplayName(recipe: RecipeRow): string {
    if (!recipe.author) return 'Unknown'
    if (Array.isArray(recipe.author)) {
      return recipe.author[0]?.full_name || recipe.author[0]?.username || 'Unknown'
    }
    return recipe.author.full_name || recipe.author.username || 'Unknown'
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault()
    setCurrentPage(1)
  }

  function clearFilters() {
    setSearchQuery('')
    setCuisineFilter('')
    setDietFilter('')
    setMaxTotalTimeFilter('')
    setCurrentPage(1)
  }

  return (
    <main style={{ maxWidth: '1080px', margin: '56px auto', padding: '0 20px 24px' }}>
      <OnboardingTour userId={userId} />
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '8px' }}>Recipe Forum</h1>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: '640px' }}>
          Discover and share recipes from around the world in one vibrant food community.
        </p>
      </div>

      <form
        onSubmit={handleApplyFilters}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '18px',
          border: '1px solid var(--card-border)',
          borderRadius: '14px',
          padding: '12px',
          background: 'var(--background-elevated)',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes"
        />
        <input
          type="text"
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          placeholder="Cuisine type"
        />
        <select value={dietFilter} onChange={(e) => setDietFilter(e.target.value)}>
          <option value="">All diet types</option>
          <option value="veg">veg</option>
          <option value="non-veg">non-veg</option>
          <option value="vegan">vegan</option>
          <option value="egg">egg</option>
          <option value="pescatarian">pescatarian</option>
        </select>
        <input
          type="number"
          min={1}
          value={maxTotalTimeFilter}
          onChange={(e) => setMaxTotalTimeFilter(e.target.value)}
          placeholder="Max prep time"
        />
        <button
          type="submit"
          style={{
            borderRadius: '10px',
            border: '1px solid var(--brand)',
            background: 'var(--brand)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={clearFilters}
          style={{
            borderRadius: '10px',
            border: '1px solid var(--card-border)',
            background: 'var(--background-elevated)',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </form>

      {loadingFeed ? (
        <p>Loading recipes...</p>
      ) : feedError ? (
        <p style={{ color: 'red' }}>{feedError}</p>
      ) : recipes.length === 0 ? (
        <div style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '20px' }}>
          <p>No recipes published yet.</p>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '6px' }}>Be the first one to share a recipe.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {recipes.map((recipe) => (
            <article
              key={recipe.id}
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: '14px',
                padding: '16px',
                display: 'grid',
                gap: '9px',
                background: 'var(--background)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{recipe.title}</h2>
              {recipe.description && (
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>{recipe.description}</p>
              )}
              <p style={{ fontSize: '13px' }}>
                {recipe.cuisine_type} · {recipe.diet_type} · {recipe.difficulty}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                Prep {formatDuration(recipe.prep_time_mins)} · Cook {formatDuration(recipe.cook_time_mins)} · Serves {recipe.servings}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                By {getAuthorDisplayName(recipe)}
              </p>
              <Link
                href={`/recipes/${recipe.slug}`}
                style={{ textDecoration: 'none', color: 'var(--brand-strong)', fontWeight: 700 }}
              >
                View recipe
              </Link>
            </article>
          ))}
        </div>
      )}

      {!loadingFeed && totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginTop: '18px' }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--card-border)',
              background: 'var(--background-elevated)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--card-border)',
              background: 'var(--background-elevated)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}