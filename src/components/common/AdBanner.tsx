import React, { useEffect, useState, useRef } from 'react'
import { useAdSense } from '@/hooks/useAdSense'
import { cn } from '@/lib/utils'
import {
  ADSENSE_CLIENT,
  ADSENSE_BANNER_SLOT,
} from '@/constants'

interface AdBannerProps {
  adSlot?: string
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  adLayout?: string
  className?: string
  style?: React.CSSProperties
  isResponsive?: boolean
  fallbackComponent?: React.ReactNode
}

export const AdBanner: React.FC<AdBannerProps> = ({
  adSlot = ADSENSE_BANNER_SLOT,
  adFormat = 'auto',
  adLayout,
  className = '',
  style,
  isResponsive = true,
  fallbackComponent
}) => {
  const { shouldShow, isEnabled } = useAdSense()
  const [adLoaded, setAdLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Observer pour détecter le chargement des annonces
  useEffect(() => {
    if (!isEnabled || !containerRef.current) return

    const observer = new MutationObserver(() => {
      if (containerRef.current && isMounted.current) {
        const adElement = containerRef.current.querySelector('ins.adsbygoogle')
        const hasAdContent = !!adElement && (adElement.innerHTML?.length ?? 0) > 0
        if (hasAdContent) {
          setAdLoaded(true)
        }
      }
    })

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return () => observer.disconnect()
  }, [isEnabled])

  // Réessayer de charger l'annonce si elle échoue
  const retryLoad = () => {
    setError(null)
    setAdLoaded(false)

    try {
      const adsbygoogle = window.adsbygoogle
      if (adsbygoogle) {
        adsbygoogle.push({})
      }
    } catch (e) {
      console.warn('Erreur lors du rechargement de l\'annonce:', e)
      setError('Impossible de charger la publicité')
    }
  }

  // En développement ou si les annonces ne sont pas activées
  if (!shouldShow) {
    // Afficher un placeholder en développement
    if (import.meta.env.DEV) {
      return (
        <div 
          className={cn(
            'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center',
            className
          )}
          style={{ minHeight: '90px', ...style }}
        >
          <p className="text-gray-500 text-sm">📢 Espace publicitaire</p>
          <p className="text-xs text-gray-400 mt-1">Slot: {adSlot}</p>
          <p className="text-xs text-gray-400">(Visible uniquement en production)</p>
        </div>
      )
    }
    
    // Sinon, ne rien afficher
    return null
  }

  // En production, afficher l'annonce
  return (
    <div 
      ref={containerRef}
      className={cn('ad-container', className)}
      style={style}
    >
      {!adLoaded && !error && (
        <div className="ad-loading bg-gray-100 rounded-lg p-4 text-center animate-pulse">
          <p className="text-gray-400 text-sm">Chargement de la publicité...</p>
        </div>
      )}

      {error && (
        <div className="ad-error bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={retryLoad}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {fallbackComponent && !adLoaded && (
        <div className="ad-fallback">
          {fallbackComponent}
        </div>
      )}

      {/* L'annonce AdSense */}
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block',
          backgroundColor: 'transparent'
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-full-width-responsive={isResponsive ? 'true' : 'false'}
      />
      
      {/* Script pour pousser l'annonce */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
              console.warn('Erreur AdSense:', e);
            }
          `
        }}
      />
    </div>
  )
}