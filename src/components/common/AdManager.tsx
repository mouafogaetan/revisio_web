import React, { useState, useEffect } from 'react'
import { AdBanner } from './AdBanner'
import { useAdSense } from '@/hooks/useAdSense'
import { cn } from '@/lib/utils'
import {
  ADSENSE_BANNER_SLOT,
  ADSENSE_RECTANGLE_SLOT,
  ADSENSE_SIDEBAR_SLOT,
  ADSENSE_INARTICLE_SLOT,
} from '@/constants'

interface AdManagerProps {
  type?: 'banner' | 'rectangle' | 'sidebar' | 'inArticle'
  position?: 'top' | 'bottom' | 'inline'
  className?: string
  delay?: number // Délai avant d'afficher l'annonce (ms)
  showLabel?: boolean
}

export const AdManager: React.FC<AdManagerProps> = ({
  type = 'banner',
  position = 'bottom',
  className = '',
  delay = 1000,
  showLabel = true
}) => {
  const [showAd, setShowAd] = useState(false)
  const { shouldShow, isEnabled } = useAdSense()

  useEffect(() => {
    // Délai avant d'afficher l'annonce pour ne pas ralentir le chargement
    const timer = setTimeout(() => {
      setShowAd(shouldShow && isEnabled)
    }, delay)

    return () => clearTimeout(timer)
  }, [shouldShow, isEnabled, delay])

  if (!showAd) {
    // En développement, afficher un petit placeholder
    if (import.meta.env.DEV) {
      return (
        <div className={cn('ad-placeholder-dev', className)}>
          <div className="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-300 rounded">
            📢 Espace publicitaire ({type})
          </div>
        </div>
      )
    }
    return null
  }

  const positionStyles = {
    top: 'mb-4',
    bottom: 'mt-4',
    inline: 'my-4'
  }

  const slotMap = {
    banner: ADSENSE_BANNER_SLOT,
    rectangle: ADSENSE_RECTANGLE_SLOT,
    sidebar: ADSENSE_SIDEBAR_SLOT,
    inArticle: ADSENSE_INARTICLE_SLOT,
  } as const

  const formatMap = {
    banner: 'auto' as const,
    rectangle: 'rectangle' as const,
    sidebar: 'vertical' as const,
    inArticle: 'auto' as const
  }

  return (
    <div className={cn(`ad-wrapper ${positionStyles[position]}`, className)}>
      {showLabel && (
        <div className="ad-label text-xs text-gray-400 text-center mb-1">
          Publicité
        </div>
      )}
      <AdBanner
        adSlot={slotMap[type]}
        adFormat={formatMap[type]}
        className="w-full"
      />
    </div>
  )
}