'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Difficulty = 'easy' | 'medium' | 'hard'
type FoodPreference = 'veg' | 'non-veg'

type RecipeFormState = {
  title: string
  description: string
  cuisineType: string
  foodPreference: FoodPreference
  difficulty: Difficulty
  prepTime: string
  cookTime: string
  servings: string
  ingredients: string[]
  steps: string[]
}

type RecipeRow = {
  id: string
  author_id: string
  slug: string
  title: string
  description: string | null
  cuisine_type: string
  diet_type: string
  difficulty: Difficulty
  prep_time_mins: number
  cook_time_mins: number
  servings: number
  ingredients: string[]
  steps: string[]
}

function formatMinutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function parseDurationToMinutes(input: string): number | null {
  const value = input.trim()
  if (!value) return null

  const hhmmMatch = /^(\d{1,2}):([0-5]\d)$/.exec(value)
  if (hhmmMatch) {
    return Number(hhmmMatch[1]) * 60 + Number(hhmmMatch[2])
  }

  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  return null
}

export default function EditRecipePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug

  const [recipeId, setRecipeId] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [notAllowed, setNotAllowed] = useState(false)
  const [form, setForm] = useState<RecipeFormState>({
    title: '',
    description: '',
    cuisineType: '',
    foodPreference: 'veg',
    difficulty: 'easy',
    prepTime: '',
    cookTime: '',
    servings: '',
    ingredients: [''],
    steps: [''],
  })

  const ingredientRows = Array.isArray(form.ingredients) ? form.ingredients : ['']
  const stepRows = Array.isArray(form.steps) ? form.steps : ['']

  useEffect(() => {
    async function fetchForEdit() {
      if (!slug) return

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('id,author_id,slug,title,description,cuisine_type,diet_type,difficulty,prep_time_mins,cook_time_mins,servings,ingredients,steps')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setMessage(error?.message ?? 'Recipe not found.')
        setIsChecking(false)
        return
      }

      const recipe = data as RecipeRow
      if (recipe.author_id !== user.id) {
        setNotAllowed(true)
        setIsChecking(false)
        return
      }

      setRecipeId(recipe.id)
      setForm({
        title: recipe.title ?? '',
        description: recipe.description ?? '',
        cuisineType: recipe.cuisine_type ?? '',
        foodPreference: recipe.diet_type === 'non-veg' ? 'non-veg' : 'veg',
        difficulty: recipe.difficulty ?? 'easy',
        prepTime: formatMinutesToHHMM(recipe.prep_time_mins ?? 0),
        cookTime: formatMinutesToHHMM(recipe.cook_time_mins ?? 0),
        servings: String(recipe.servings ?? ''),
        ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? recipe.ingredients : [''],
        steps: Array.isArray(recipe.steps) && recipe.steps.length > 0 ? recipe.steps : [''],
      })

      setIsChecking(false)
    }

    fetchForEdit()
  }, [router, slug])

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
      if (currentList.length === 1) return prev
      return { ...prev, [listType]: currentList.filter((_, i) => i !== index) }
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeId) return

    setMessage('')
    setIsSubmitting(true)

    const prepMinutes = parseDurationToMinutes(form.prepTime)
    const cookMinutes = parseDurationToMinutes(form.cookTime)
    const servingsNumber = Number(form.servings)
    const ingredients = ingredientRows.map((item) => item.trim()).filter(Boolean)
    const steps = stepRows.map((item) => item.trim()).filter(Boolean)

    if (prepMinutes === null || cookMinutes === null) {
      setMessage('Please enter prep and cook time in HH:MM format or plain minutes.')
      setIsSubmitting(false)
      return
    }

    if (!Number.isFinite(servingsNumber) || servingsNumber <= 0) {
      setMessage('Please enter a valid servings count.')
      setIsSubmitting(false)
      return
    }

    if (!form.title.trim() || !form.cuisineType.trim() || ingredients.length === 0 || steps.length === 0) {
      setMessage('Please complete required fields before saving.')
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('recipes')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        cuisine_type: form.cuisineType.trim(),
        diet_type: form.foodPreference,
        difficulty: form.difficulty,
        prep_time_mins: prepMinutes,
        cook_time_mins: cookMinutes,
        servings: servingsNumber,
        ingredients,
        steps,
      })
      .eq('id', recipeId)

    if (error) {
      setMessage(error.message)
      setIsSubmitting(false)
      return
    }

    router.push(`/recipes/${slug}`)
  }

  if (isChecking) {
    return (
      <main style={{ maxWidth: '760px', margin: '56px auto', padding: '0 20px' }}>
        <p>Loading recipe editor...</p>
      </main>
    )
  }

  if (notAllowed) {
    return (
      <main style={{ maxWidth: '760px', margin: '56px auto', padding: '0 20px' }}>
        <p>You are not allowed to edit this recipe.</p>
        <p style={{ marginTop: '10px' }}>
          <Link href={`/recipes/${slug}`}>Back to recipe</Link>
        </p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '760px', margin: '56px auto', padding: '0 20px 20px' }}>
      <h1 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '8px' }}>Edit Recipe</h1>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '20px' }}>
        Update your recipe details and save changes.
      </p>

      <form
        onSubmit={handleSave}
        style={{
          display: 'grid',
          gap: '14px',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          padding: '18px',
          background: 'var(--background-elevated)',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <div>
          <label htmlFor="title">Title</label>
          <input id="title" type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          <div>
            <label htmlFor="cuisineType">Cuisine type</label>
            <input id="cuisineType" type="text" value={form.cuisineType} onChange={(e) => updateField('cuisineType', e.target.value)} required />
          </div>
          <div>
            <label htmlFor="foodPreference">Food preference</label>
            <select id="foodPreference" value={form.foodPreference} onChange={(e) => updateField('foodPreference', e.target.value as FoodPreference)} required>
              <option value="veg">veg</option>
              <option value="non-veg">non-veg</option>
            </select>
          </div>
          <div>
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value as Difficulty)} required>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>
          <div>
            <label htmlFor="prepTime">Prep time</label>
            <input id="prepTime" type="text" value={form.prepTime} onChange={(e) => updateField('prepTime', e.target.value)} required />
          </div>
          <div>
            <label htmlFor="cookTime">Cook time</label>
            <input id="cookTime" type="text" value={form.cookTime} onChange={(e) => updateField('cookTime', e.target.value)} required />
          </div>
          <div>
            <label htmlFor="servings">Servings</label>
            <input id="servings" type="number" min={1} value={form.servings} onChange={(e) => updateField('servings', e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Ingredients</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {ingredientRows.map((ingredient, index) => (
              <div key={`ingredient-${index}`} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={ingredient} onChange={(e) => updateListItem('ingredients', index, e.target.value)} required={index === 0} />
                <button type="button" onClick={() => removeListItem('ingredients', index)} disabled={ingredientRows.length === 1} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '8px 10px', background: 'var(--background-elevated)', cursor: ingredientRows.length === 1 ? 'not-allowed' : 'pointer' }}>
                  -
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addListItem('ingredients')} style={{ width: 'fit-content', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '8px 12px', background: 'var(--background-elevated)', cursor: 'pointer' }}>
              + Add ingredient
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Steps</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {stepRows.map((step, index) => (
              <div key={`step-${index}`} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={step} onChange={(e) => updateListItem('steps', index, e.target.value)} required={index === 0} />
                <button type="button" onClick={() => removeListItem('steps', index)} disabled={stepRows.length === 1} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '8px 10px', background: 'var(--background-elevated)', cursor: stepRows.length === 1 ? 'not-allowed' : 'pointer' }}>
                  -
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addListItem('steps')} style={{ width: 'fit-content', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '8px 12px', background: 'var(--background-elevated)', cursor: 'pointer' }}>
              + Add step
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--brand)',
              backgroundColor: 'var(--brand)',
              color: 'white',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
          <Link href={`/recipes/${slug}`} style={{ alignSelf: 'center' }}>
            Cancel
          </Link>
        </div>
      </form>

      {message && (
        <p style={{ marginTop: '14px', color: 'red' }}>
          {message}
        </p>
      )}
    </main>
  )
}
