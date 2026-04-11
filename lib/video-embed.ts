/** Normalize user input: empty → null, else valid http(s) URL or null if invalid. */
export function normalizeOptionalVideoUrl(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  try {
    const u = new URL(t)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}

function youtubeEmbedSrc(raw: string): string | null {
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        return `https://www.youtube-nocookie.com${u.pathname}${u.search}`
      }
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}`
      const shorts = /^\/shorts\/([^/?]+)/.exec(u.pathname)
      if (shorts?.[1]) {
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(shorts[1])}`
      }
    }
  } catch {
    return null
  }
  return null
}

function vimeoEmbedSrc(raw: string): string | null {
  try {
    const u = new URL(raw)
    if (!u.hostname.replace(/^www\./, '').toLowerCase().includes('vimeo.com')) return null
    const parts = u.pathname.split('/').filter(Boolean)
    const id = parts[0] === 'video' ? parts[1] : parts[0]
    if (id && /^\d+$/.test(id)) {
      return `https://player.vimeo.com/video/${encodeURIComponent(id)}`
    }
  } catch {
    return null
  }
  return null
}

function googleDriveEmbedSrc(raw: string): string | null {
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'drive.google.com') return null

    const fileMatch = /\/file\/d\/([^/]+)/.exec(u.pathname)
    if (fileMatch?.[1]) {
      return `https://drive.google.com/file/d/${encodeURIComponent(fileMatch[1])}/preview`
    }

    const idParam = u.searchParams.get('id')
    if (idParam && (u.pathname === '/open' || u.pathname === '/')) {
      return `https://drive.google.com/file/d/${encodeURIComponent(idParam)}/preview`
    }
  } catch {
    return null
  }
  return null
}

const DIRECT_VIDEO = /\.(mp4|webm|ogg|mov)(\?|#|$)/i

export type ResolvedVideo =
  | { kind: 'iframe'; src: string }
  | { kind: 'direct'; src: string }
  | { kind: 'external'; href: string }

/** Pick embed strategy for a stored video URL. */
export function resolveVideoEmbed(url: string): ResolvedVideo {
  const trimmed = url.trim()
  const y = youtubeEmbedSrc(trimmed)
  if (y) return { kind: 'iframe', src: y }

  const v = vimeoEmbedSrc(trimmed)
  if (v) return { kind: 'iframe', src: v }

  const d = googleDriveEmbedSrc(trimmed)
  if (d) return { kind: 'iframe', src: d }

  if (DIRECT_VIDEO.test(trimmed)) {
    return { kind: 'direct', src: trimmed }
  }

  return { kind: 'external', href: trimmed }
}
