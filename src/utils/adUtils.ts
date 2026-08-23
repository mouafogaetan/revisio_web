
import { ADSENSE_ENABLED } from '@/constants'
/**
 * Utilitaires pour la gestion des annonces Google AdSense
 */

// Détermine si les annonces doivent être affichées
export const shouldShowAds = (): boolean => {
  // Si AdSense n'est pas activé dans la config
  if (!ADSENSE_ENABLED) {
    return false
  }

  // En développement, on n'affiche pas les vraies annonces
  if (import.meta.env.DEV) {
    return false
  }
  
  // En production, on vérifie que le site est en ligne
  if (import.meta.env.PROD) {
    // Vérifier si on est sur le bon domaine
    const hostname = window.location.hostname
    const allowedDomains = ['revisio.com', 'www.revisio.com', 'revisio-web.vercel.app']
    
    const isAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    )
    
    // Vérifier si AdSense est chargé
    const isAdSenseLoaded = typeof window.adsbygoogle !== 'undefined'
    
    return isAllowed && isAdSenseLoaded
  }
  
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