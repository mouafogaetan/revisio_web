// Utiliser le proxy en développement et en production
export const API_URL = import.meta.env.DEV 
  ? '/api/revisio_data' 
  : '/api/revisio_data'  // Maintenant le proxy fonctionne aussi en production

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Revisio'

export const DIFFICULTY_ORDER = {
  easy: 1,
  medium: 2,
  hard: 3,
  'very hard': 4,
} as const

export const DIFFICULTY_POINTS = {
  easy: 1,
  medium: 2,
  hard: 3,
  'very hard': 4,
} as const

export const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true'
export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-2576899782923895'
export const ADSENSE_BANNER_SLOT = import.meta.env.VITE_ADSENSE_BANNER_SLOT || '1234567890'
export const ADSENSE_RECTANGLE_SLOT = import.meta.env.VITE_ADSENSE_RECTANGLE_SLOT || '1234567891'
export const ADSENSE_SIDEBAR_SLOT = import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || '1234567892'
export const ADSENSE_INARTICLE_SLOT = import.meta.env.VITE_ADSENSE_INARTICLE_SLOT || '1234567893'