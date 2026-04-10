'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Heart, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Author =
  | {
      username: string
      full_name: string | null
    }
  | {
      username: string
      full_name: string | null
    }[]
  | null

type RecipeDetail = {
  id: string
  author_id: string
  title: string
  slug: string
  description: string | null
  cuisine_type: string
  diet_type: string
  difficulty: string
  prep_time_mins: number
  cook_time_mins: number
  servings: number
  ingredients: string[]
  steps: string[]
  view_count: number | null
  created_at: string
  author: Author
}

type CommentAuthor =
  | {
      username: string
      full_name: string | null
    }
  | {
      username: string
      full_name: string | null
    }[]
  | null

type CommentRow = {
  id: string
  recipe_id: string
  author_id: string
  content: string
  created_at: string | null
  author: CommentAuthor
}

function getAuthorDisplayName(author: Author): string {
  if (!author) return 'Unknown'
  if (Array.isArray(author)) {
    return author[0]?.full_name || author[0]?.username || 'Unknown'
  }
  return author.full_name || author.username || 'Unknown'
}

function getCommentAuthorDisplayName(author: CommentAuthor): string {
  if (!author) return 'Unknown'
  if (Array.isArray(author)) {
    return author[0]?.full_name || author[0]?.username || 'Unknown'
  }
  return author.full_name || author.username || 'Unknown'
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`
}

export default function RecipeDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likesCount, setLikesCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [commentError, setCommentError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [deletingRecipe, setDeletingRecipe] = useState(false)
  const [deleteRecipeError, setDeleteRecipeError] = useState('')

  useEffect(() => {
    async function fetchRecipe() {
      if (!slug) return

      setLoading(true)
      setError('')

      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select(
          'id,author_id,title,slug,description,cuisine_type,diet_type,difficulty,prep_time_mins,cook_time_mins,servings,ingredients,steps,view_count,created_at,author:profiles!recipes_author_id_fkey(username,full_name)'
        )
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      const recipeData = data as RecipeDetail
      setRecipe(recipeData)

      const [{ count }, { data: authData }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('recipe_id', recipeData.id),
        supabase.auth.getUser(),
      ])

      setLikesCount(count ?? 0)

      const currentUserId = authData.user?.id
      setCurrentUserId(currentUserId ?? null)
      if (currentUserId) {
        const { data: existingLike } = await supabase
          .from('likes')
          .select('id')
          .eq('recipe_id', recipeData.id)
          .eq('user_id', currentUserId)
          .maybeSingle()

        setHasLiked(Boolean(existingLike))
      } else {
        setHasLiked(false)
      }

      const { data: commentsData, error: commentsFetchError } = await supabase
        .from('comments')
        .select('id,recipe_id,author_id,content,created_at,author:profiles!comments_author_id_fkey(username,full_name)')
        .eq('recipe_id', recipeData.id)
        .order('created_at', { ascending: true })

      if (commentsFetchError) {
        setCommentError(commentsFetchError.message)
      } else {
        setComments((commentsData as CommentRow[]) ?? [])
      }

      setLoading(false)

      // Fire-and-forget view count increment.
      void supabase
        .from('recipes')
        .update({ view_count: (recipeData.view_count ?? 0) + 1 })
        .eq('id', recipeData.id)
    }

    fetchRecipe()
  }, [slug])

  async function handleLikeToggle() {
    if (!recipe || likeLoading) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    setLikeLoading(true)

    if (hasLiked) {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('recipe_id', recipe.id)
        .eq('user_id', user.id)

      if (!deleteError) {
        setHasLiked(false)
        setLikesCount((prev) => Math.max(0, prev - 1))
      }
    } else {
      const { error: insertError } = await supabase.from('likes').insert({
        recipe_id: recipe.id,
        user_id: user.id,
      })

      if (!insertError) {
        setHasLiked(true)
        setLikesCount((prev) => prev + 1)
      } else if (insertError.code === '23505') {
        // Unique key on (user_id, recipe_id) means user already liked it.
        setHasLiked(true)
      }
    }

    setLikeLoading(false)
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipe || submittingComment) return

    const content = commentInput.trim()
    if (!content) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    setSubmittingComment(true)
    setCommentError('')

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        recipe_id: recipe.id,
        author_id: user.id,
        content,
        parent_id: null,
      })
      .select('id,recipe_id,author_id,content,created_at,author:profiles!comments_author_id_fkey(username,full_name)')
      .single()

    if (insertError) {
      setCommentError(insertError.message)
      setSubmittingComment(false)
      return
    }

    setComments((prev) => [...prev, data as CommentRow])
    setCommentInput('')
    setSubmittingComment(false)
  }

  async function handleDeleteComment(commentId: string) {
    if (!recipe || !currentUserId || currentUserId !== recipe.author_id) return

    const supabase = createClient()
    setDeletingCommentId(commentId)
    setCommentError('')

    const { data: deletedRows, error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('recipe_id', recipe.id)
      .select('id')

    if (deleteError) {
      setCommentError(deleteError.message)
      setDeletingCommentId(null)
      return
    }

    if (!deletedRows || deletedRows.length === 0) {
      setCommentError('Unable to delete comment due to database permissions. Please update comment delete policy.')
      setDeletingCommentId(null)
      return
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId))
    setDeletingCommentId(null)
  }

  async function handleShareRecipe() {
    if (!recipe || typeof window === 'undefined') return

    const shareUrl = window.location.href
    setShareMessage('')

    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: recipe.description ?? `Check out this recipe: ${recipe.title}`,
          url: shareUrl,
        })
        setShareMessage('Recipe link shared successfully.')
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      setShareMessage('Recipe link copied to clipboard.')
    } catch {
      setShareMessage('Unable to share right now. Please try again.')
    }
  }

  async function handleDeleteRecipe() {
    if (!recipe || deletingRecipe) return

    const confirmed = window.confirm(`Delete "${recipe.title}" permanently? This cannot be undone.`)
    if (!confirmed) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (user.id !== recipe.author_id) {
      setDeleteRecipeError('Only the recipe owner can delete this recipe.')
      return
    }

    setDeletingRecipe(true)
    setDeleteRecipeError('')

    const { data: deletedRows, error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipe.id)
      .eq('author_id', user.id)
      .select('id')

    if (deleteError) {
      setDeleteRecipeError(deleteError.message)
      setDeletingRecipe(false)
      return
    }

    if (!deletedRows || deletedRows.length === 0) {
      setDeleteRecipeError('Unable to delete recipe due to database permissions. Please update recipe delete policy.')
      setDeletingRecipe(false)
      return
    }

    const { data: existingRow, error: verifyError } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipe.id)
      .maybeSingle()

    if (verifyError) {
      setDeleteRecipeError(verifyError.message)
      setDeletingRecipe(false)
      return
    }

    if (existingRow) {
      setDeleteRecipeError('Delete did not persist in database. Please check Supabase RLS/delete policies.')
      setDeletingRecipe(false)
      return
    }

    router.replace('/')
  }

  if (loading) {
    return (
      <main style={{ maxWidth: '900px', margin: '48px auto', padding: '0 20px' }}>
        <p>Loading recipe...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ maxWidth: '900px', margin: '48px auto', padding: '0 20px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <p style={{ marginTop: '12px' }}>
          <Link href="/">Back to recipes</Link>
        </p>
      </main>
    )
  }

  if (!recipe) {
    return (
      <main style={{ maxWidth: '900px', margin: '48px auto', padding: '0 20px' }}>
        <p>Recipe not found.</p>
        <p style={{ marginTop: '12px' }}>
          <Link href="/">Back to recipes</Link>
        </p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '920px', margin: '56px auto', padding: '0 20px 24px', display: 'grid', gap: '18px' }}>
      <div>
        <p style={{ marginBottom: '10px' }}>
          <Link href="/">Back to recipes</Link>
        </p>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>{recipe.title}</h1>
        {recipe.description && <p style={{ color: 'var(--muted-foreground)' }}>{recipe.description}</p>}
      </div>

      <section style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {currentUserId === recipe.author_id && (
            <>
              <Link
                href={`/recipes/${recipe.slug}/edit`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: '1px solid var(--card-border)',
                  background: 'transparent',
                  padding: '7px 12px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Edit recipe
              </Link>
              <button
                onClick={handleDeleteRecipe}
                disabled={deletingRecipe}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: '1px solid #ef4444',
                  background: 'transparent',
                  color: '#ef4444',
                  padding: '7px 12px',
                  cursor: deletingRecipe ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {deletingRecipe ? 'Deleting...' : 'Delete recipe'}
              </button>
            </>
          )}
          <button
            onClick={handleLikeToggle}
            disabled={likeLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '999px',
              border: `1px solid ${hasLiked ? 'var(--brand)' : 'var(--card-border)'}`,
              background: hasLiked ? 'color-mix(in srgb, var(--brand) 16%, transparent)' : 'transparent',
              color: hasLiked ? 'var(--brand-strong)' : 'inherit',
              padding: '7px 12px',
              cursor: likeLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <Heart size={16} fill={hasLiked ? 'var(--brand-strong)' : 'none'} />
            {hasLiked ? 'Liked' : 'Like'} ({likesCount})
          </button>

          <button
            onClick={handleShareRecipe}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '999px',
              border: '1px solid var(--card-border)',
              background: 'transparent',
              padding: '7px 12px',
              cursor: 'pointer',
            }}
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
        {shareMessage && (
          <p style={{ marginBottom: '10px', color: shareMessage.includes('Unable') ? 'red' : 'var(--muted-foreground)' }}>
            {shareMessage}
          </p>
        )}
        {deleteRecipeError && <p style={{ marginBottom: '10px', color: 'red' }}>{deleteRecipeError}</p>}
        <p>
          <strong>By:</strong> {getAuthorDisplayName(recipe.author)}
        </p>
        <p>
          <strong>Cuisine:</strong> {recipe.cuisine_type}
        </p>
        <p>
          <strong>Preference:</strong> {recipe.diet_type}
        </p>
        <p>
          <strong>Difficulty:</strong> {recipe.difficulty}
        </p>
        <p>
          <strong>Prep/Cook:</strong> {formatDuration(recipe.prep_time_mins)} / {formatDuration(recipe.cook_time_mins)}
        </p>
        <p>
          <strong>Servings:</strong> {recipe.servings}
        </p>
      </section>

      <section style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Ingredients</h2>
        <ul style={{ paddingLeft: '20px', display: 'grid', gap: '6px' }}>
          {recipe.ingredients.map((ingredient, index) => (
            <li key={`${ingredient}-${index}`}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Steps</h2>
        <ol style={{ paddingLeft: '20px', display: 'grid', gap: '8px' }}>
          {recipe.steps.map((step, index) => (
            <li key={`${step}-${index}`}>{step}</li>
          ))}
        </ol>
      </section>

      <section style={{ border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Comments</h2>

        <form onSubmit={handleCommentSubmit} style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            rows={3}
            placeholder="Write your comment"
          />
          <button
            type="submit"
            disabled={submittingComment || !commentInput.trim()}
            style={{
              width: 'fit-content',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
              cursor: submittingComment ? 'not-allowed' : 'pointer',
            }}
          >
            {submittingComment ? 'Posting...' : 'Post comment'}
          </button>
        </form>

        {commentError && <p style={{ color: 'red', marginBottom: '10px' }}>{commentError}</p>}

        {comments.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>No comments yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {comments.map((comment) => {
              const canDelete = currentUserId === recipe.author_id
              return (
                <article
                  key={comment.id}
                  style={{
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'grid',
                    gap: '6px',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    {getCommentAuthorDisplayName(comment.author)}
                  </p>
                  <p style={{ margin: 0 }}>{comment.content}</p>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      style={{
                        width: 'fit-content',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--card-border)',
                        color: 'var(--brand-strong)',
                        cursor: deletingCommentId === comment.id ? 'not-allowed' : 'pointer',
                        background: 'transparent',
                      }}
                    >
                      {deletingCommentId === comment.id ? 'Removing...' : 'Remove comment'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
