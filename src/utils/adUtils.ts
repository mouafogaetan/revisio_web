
import { ADSENSE_ENABLED } from '@/constants'
/**
 * Utilitaires pour la gestion des annonces Google AdSense
 */

// Détermine si les annonces doivent être affichées
export const shouldShowAds = (): boolean => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown'
  const isAdSenseLoaded = typeof window !== 'undefined' && typeof window.adsbygoogle !== 'undefined'
  const isProduction = import.meta.env.PROD
  const isAllowed = ['revisio.com', 'www.revisio.com', 'revisio-web.vercel.app'].some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  )

  console.log('[AdSense debug]', {
    ADSENSE_ENABLED,
    isProduction,
    hostname,
    isAllowed,
    isAdSenseLoaded,
    windowDefined: typeof window !== 'undefined'
  })

  // Si AdSense n'est pas activé dans la config
  if (!ADSENSE_ENABLED) {
    console.log('[AdSense debug] Bloqué: ADSENSE_ENABLED est false')
    return false
  }

  // En développement, on n'affiche pas les vraies annonces
  if (import.meta.env.DEV) {
    console.log('[AdSense debug] Bloqué: mode développement')
    return false
  }
  
  // En production, on vérifie que le site est en ligne
  if (import.meta.env.PROD) {
    console.log('[AdSense debug] Vérification production:', { hostname, isAllowed, isAdSenseLoaded })
    
    return isAllowed && isAdSenseLoaded
  }
  
  console.log('[AdSense debug] Bloqué: pas en production')
  return false
}

// Vérifier si les annonces sont prêtes
export const isAdSenseReady = (): boolean => {
  try {
    // @ts-ignore
    return typeof window.adsbygoogle !== 'undefined'
  } catch {
    return false
  }
}

// Fonction pour forcer le chargement d'AdSense
export const loadAdSense = (): void => {
  try {
    // @ts-ignore
    if (window.adsbygoogle) {
      // @ts-ignore
      window.adsbygoogle.push({})
    }
  } catch (error) {
    console.warn('Erreur lors du chargement d\'AdSense:', error)
  }
}