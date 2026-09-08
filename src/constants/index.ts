// src/constants/index.ts

// URL des données locales
export const DATA_SOURCE_URL = import.meta.env.VITE_API_URL || '/data';

// URL du proxy (gardé pour compatibilité mais non utilisé)
export const API_URL = import.meta.env.VITE_API_URL || '/data';

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Revisio';

export const DIFFICULTY_ORDER = {
  easy: 1,
  medium: 2,
  hard: 3,
  'very hard': 4,
} as const;

export const DIFFICULTY_POINTS = {
  easy: 1,
  medium: 2,
  hard: 3,
  'very hard': 4,
} as const;

export const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true';
export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-2576899782923895';
export const ADSENSE_BANNER_SLOT = import.meta.env.VITE_ADSENSE_BANNER_SLOT || '3276800910';
export const ADSENSE_RECTANGLE_SLOT = import.meta.env.VITE_ADSENSE_RECTANGLE_SLOT || '3469257087';
export const ADSENSE_SIDEBAR_SLOT = import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || '3276800910';
export const ADSENSE_INARTICLE_SLOT = import.meta.env.VITE_ADSENSE_INARTICLE_SLOT || '7108285040';