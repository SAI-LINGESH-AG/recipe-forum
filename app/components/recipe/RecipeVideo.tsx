'use client'

import { resolveVideoEmbed } from '@/lib/video-embed'

type Props = {
  url: string
}

export default function RecipeVideo({ url }: Props) {
  const resolved = resolveVideoEmbed(url)

  if (resolved.kind === 'direct') {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        src={resolved.src}
        style={{
          width: '100%',
          maxHeight: 'min(70vh, 520px)',
          borderRadius: '12px',
          background: 'black',
        }}
      >
        Your browser does not support embedded video.
      </video>
    )
  }

  if (resolved.kind === 'external') {
    return (
      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '16px',
          background: 'var(--background-elevated)',
        }}
      >
        <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Recipe video</p>
        <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--muted-foreground)' }}>
          This link is not auto-embedded here. Open it to watch (YouTube, Google Drive, Vimeo, and direct
          .mp4/.webm links play inline when supported).
        </p>
        <a
          href={resolved.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 600, color: 'var(--brand-strong)' }}
        >
          Open video in new tab
        </a>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        borderRadius: '12px',
        background: 'black',
      }}
    >
      <iframe
        src={resolved.src}
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        title="Recipe video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </div>
  )
}
