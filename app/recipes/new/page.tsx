'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Difficulty = 'easy' | 'medium' | 'hard'
type DietType = 'veg' | 'non-veg' | 'vegan' | 'egg' | 'pescatarian'

type RecipeFormState = {
  title: string
  description: string
  cuisineType: string
  dietType: DietType
  difficulty: Difficulty
  prepTimeMins: string
  cookTimeMins: string
  servings: string
  ingredients: string[]
  steps: string[]
}

const initialState: RecipeFormState = {
  title: '',
  description: '',
  cuisineType: '',
  dietType: 'veg',
  difficulty: 'easy',
  prepTimeMins: '',
  cookTimeMins: '',
  servings: '',
  ingredients: [''],
  steps: [''],
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function parseDurationToMinutes(input: string): number | null {
  const value = input.trim()
  if (!value) return null

  // Accept HH:MM format.
  const hhmmMatch = /^(\d{1,2}):([0-5]\d)$/.exec(value)
  if (hhmmMatch) {
    const hours = Number(hhmmMatch[1])
    const minutes = Number(hhmmMatch[2])
    return hours * 60 + minutes
  }

  // Fallback: allow plain minutes for convenience.
  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  return null
}

export default function NewRecipePage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<RecipeFormState>(initialState)
  const ingredientRows = Array.isArray(form.ingredients) ? form.ingredients : ['']
  const stepRows = Array.isArray(form.steps) ? form.steps : ['']

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  function updateField<K extends keyof RecipeFormState>(field: K, value: RecipeFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateListItem(listType: 'ingredients' | 'steps', index: number, value: string) {
    setForm((prev) => {
      const currentList = Array.isArray(prev[listType]) ? prev[listType] : ['']
      const nextList = [...currentList]
      nextList[index] = value
      return { ...prev, [listType]: nextList }
    })
  }

  function addListItem(listType: 'ingredients' | 'steps') {
    setForm((prev) => ({
      ...prev,
      [listType]: [...(Array.isArray(prev[listType]) ? prev[listType] : ['']), ''],
    }))
  }

  function removeListItem(listType: 'ingredients' | 'steps', index: number) {
    setForm((prev) => {
      const currentList = Array.isArray(prev[listType]) ? prev[listType] : ['']
      if (currentList.length === 1) {
        return prev
      }
      const nextList = currentList.filter((_, i) => i !== index)
      return { ...prev, [listType]: nextList }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Please sign in again.')
      setIsSubmitting(false)
      router.push('/login')
      return
    }

    const generatedSlugBase = slugify(form.title)
    const randomSuffix = Math.random().toString(36).slice(2, 7)
    const generatedSlug = `${generatedSlugBase}-${randomSuffix}`

    const ingredients = ingredientRows.map((item) => item.trim()).filter(Boolean)
    const steps = stepRows.map((item) => item.trim()).filter(Boolean)
    const prepMinutes = parseDurationToMinutes(form.prepTimeMins)
    const cookMinutes = parseDurationToMinutes(form.cookTimeMins)

    if (!generatedSlugBase) {
      setMessage('Please enter a valid recipe title.')
      setIsSubmitting(false)
      return
    }

    if (ingredients.length === 0 || steps.length === 0) {
      setMessage('Please add at least one ingredient and one step.')
      setIsSubmitting(false)
      return
    }

    if (prepMinutes === null || cookMinutes === null) {
      setMessage('Please enter prep and cook time in HH:MM format or plain minutes.')
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from('recipes').insert({
      author_id: user.id,
      title: form.title.trim(),
      slug: generatedSlug,
      description: form.description.trim() || null,
      cuisine_type: form.cuisineType.trim(),
      diet_type: form.dietType,
      difficulty: form.difficulty,
      prep_time_mins: prepMinutes,
      cook_time_mins: cookMinutes,
      servings: Number(form.servings),
      ingredients,
      steps,
      is_published: true,
    })

    if (error) {
      if (error.message.toLowerCase().includes('recipes_author_id_fkey')) {
        setMessage('Profile not found for this account. Please complete profile setup first.')
      } else {
        setMessage(error.message)
      }
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setMessage('Recipe created successfully.')
    router.push('/')
  }

  if (isCheckingAuth) {
    return (
      <main style={{ maxWidth: '720px', margin: '48px auto', padding: '0 20px' }}>
        <p>Checking your account session...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '760px', margin: '56px auto', padding: '0 20px 20px' }}>
      <h1 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '8px' }}>Share Recipe</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '20px' }}>
        Add the details below to publish your recipe.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '18px' }}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          <div>
            <label htmlFor="cuisineType">Cuisine type</label>
            <input
              id="cuisineType"
              type="text"
              required
              value={form.cuisineType}
              onChange={(e) => updateField('cuisineType', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="dietType">Diet type</label>
            <select
              id="dietType"
              required
              value={form.dietType}
              onChange={(e) => updateField('dietType', e.target.value as DietType)}
            >
              <option value="veg">veg</option>
              <option value="non-veg">non-veg</option>
              <option value="vegan">vegan</option>
              <option value="egg">egg</option>
              <option value="pescatarian">pescatarian</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              required
              value={form.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value as Difficulty)}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>

          <div>
            <label htmlFor="prepTimeMins">Prep time</label>
            <input
              id="prepTimeMins"
              type="text"
              required
              value={form.prepTimeMins}
              onChange={(e) => updateField('prepTimeMins', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="cookTimeMins">Cook time</label>
            <input
              id="cookTimeMins"
              type="text"
              required
              value={form.cookTimeMins}
              onChange={(e) => updateField('cookTimeMins', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="servings">Servings</label>
            <input
              id="servings"
              type="number"
              min={1}
              required
              value={form.servings}
              onChange={(e) => updateField('servings', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Ingredients</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {ingredientRows.map((ingredient, index) => (
              <div key={`ingredient-${index}`} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateListItem('ingredients', index, e.target.value)}
                  required={index === 0}
                />
                <button
                  type="button"
                  onClick={() => removeListItem('ingredients', index)}
                  disabled={ingredientRows.length === 1}
                  style={{
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    background: 'var(--background-elevated)',
                    cursor: ingredientRows.length === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  -
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addListItem('ingredients')}
              style={{
                width: 'fit-content',
                border: '1px solid var(--card-border)',
                borderRadius: '10px',
                padding: '8px 12px',
                background: 'var(--background-elevated)',
                cursor: 'pointer',
              }}
            >
              + Add ingredient
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Steps</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {stepRows.map((step, index) => (
              <div key={`step-${index}`} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateListItem('steps', index, e.target.value)}
                  required={index === 0}
                />
                <button
                  type="button"
                  onClick={() => removeListItem('steps', index)}
                  disabled={stepRows.length === 1}
                  style={{
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    background: 'var(--background-elevated)',
                    cursor: stepRows.length === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  -
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addListItem('steps')}
              style={{
                width: 'fit-content',
                border: '1px solid var(--card-border)',
                borderRadius: '10px',
                padding: '8px 12px',
                background: 'var(--background-elevated)',
                cursor: 'pointer',
              }}
            >
              + Add step
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: '8px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid var(--brand)',
            backgroundColor: 'var(--brand)',
            color: 'white',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Publishing...' : 'Publish recipe'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '14px', color: message.includes('successfully') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
    </main>
  )
}
