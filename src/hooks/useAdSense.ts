import { useState, useEffect } from 'react'
import { shouldShowAds, isAdSenseReady } from '@/utils/adUtils'

export const useAdSense = () => {
  const [isReady, setIsReady] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Vérifier si on doit afficher les annonces
    const show = shouldShowAds()
    setShouldShow(show)

    if (show) {
      // Vérifier si AdSense est chargé sans le pousser plusieurs fois
      const checkAdSense = () => {
        if (isAdSenseReady()) {
          setIsReady(true)
        } else {
          // Réessayer après un délai
          const interval = setInterval(() => {
            if (isAdSenseReady()) {
              setIsReady(true)
              clearInterval(interval)
            }
          }, 1000)

          // Nettoyer après 10 secondes
          setTimeout(() => clearInterval(interval), 10000)
        }
      }

      checkAdSense()
    }
  }, [])

  return {
    isReady,
    shouldShow,
    isEnabled: shouldShow && isReady
  }
}