import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getYouTubeId(url: string): string | null {
  try {
    const cleanUrl = url.trim()
    const patterns = [
      /youtu.be\/([^?]+)/,
      /watch\?v=([^&]+)/,
      /embed\/([^?]+)/,
      /shorts\/([^?]+)/
    ]
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]?.length === 11) {
        return match[1]
      }
    }
    return null
  } catch {
    return null
  }
}