'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export const RECIPE_FORUM_TOUR_START_EVENT = 'recipe-forum-tour-start'
export const RECIPE_FORUM_TOUR_PENDING_KEY = 'recipe_forum_tour_pending'

type OnboardingTourProps = {
  userId: string | null
}

const TOUR_VERSION = 'v1'

export default function OnboardingTour({ userId }: OnboardingTourProps) {
  const [dismissedUserId, setDismissedUserId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)

  const steps = useMemo(
    () => [
      {
        title: 'Welcome to Recipe Forum',
        body: 'Discover global recipes and save time with search and filters on the home feed.',
      },
      {
        title: 'Share your recipes',
        body: 'Use the Share Recipe page to publish your own dishes with ingredients, steps, and prep/cook time in HH:MM.',
      },
      {
        title: 'Engage with the community',
        body: 'Open any recipe to like, comment, and share links with friends across devices.',
      },
      {
        title: 'Manage your profile',
        body: 'Update your profile details and review all your published recipes from your profile page.',
      },
    ],
    []
  )

  const hasSeenTour = useMemo(() => {
    if (!userId || typeof window === 'undefined') return true
    const storageKey = `recipe_forum_tour_seen_${TOUR_VERSION}_${userId}`
    return window.localStorage.getItem(storageKey) === 'true'
  }, [userId])

  const isOpen =
    Boolean(userId) &&
    (manualOpen || (!hasSeenTour && dismissedUserId !== userId))

  const openTourFromMenu = useCallback(() => {
    setManualOpen(true)
    setStepIndex(0)
    setDismissedUserId(null)
  }, [])

  useEffect(() => {
    function onStartTour() {
      openTourFromMenu()
    }
    window.addEventListener(RECIPE_FORUM_TOUR_START_EVENT, onStartTour)
    return () => window.removeEventListener(RECIPE_FORUM_TOUR_START_EVENT, onStartTour)
  }, [openTourFromMenu])

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    if (sessionStorage.getItem(RECIPE_FORUM_TOUR_PENDING_KEY) !== '1') return
    sessionStorage.removeItem(RECIPE_FORUM_TOUR_PENDING_KEY)
    const id = window.setTimeout(() => openTourFromMenu(), 0)
    return () => window.clearTimeout(id)
  }, [userId, openTourFromMenu])

  function closeTour() {
    if (!userId) return
    const storageKey = `recipe_forum_tour_seen_${TOUR_VERSION}_${userId}`
    window.localStorage.setItem(storageKey, 'true')
    setDismissedUserId(userId)
    setManualOpen(false)
  }

  function handleNext() {
    if (stepIndex >= steps.length - 1) {
      closeTour()
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  function handleBack() {
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <section
        style={{
          width: 'min(540px, 100%)',
          borderRadius: '14px',
          border: '1px solid #e5e7eb',
          background: 'var(--background)',
          padding: '18px',
          display: 'grid',
          gap: '14px',
        }}
      >
        <p style={{ fontSize: '13px', color: 'gray' }}>
          Step {stepIndex + 1} of {steps.length}
        </p>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{steps[stepIndex].title}</h2>
        <p style={{ color: 'gray' }}>{steps[stepIndex].body}</p>

        {stepIndex === steps.length - 1 && (
          <p style={{ fontSize: '14px' }}>
            Quick start: visit <Link href="/recipes/new">Share Recipe</Link> or <Link href="/profile">Profile</Link>.
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button
            onClick={closeTour}
            style={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'transparent',
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Skip tour
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBack}
              disabled={stepIndex === 0}
              style={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'transparent',
                padding: '8px 12px',
                cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              style={{
                borderRadius: '8px',
                border: 'none',
                background: '#dc2626',
                color: 'white',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
