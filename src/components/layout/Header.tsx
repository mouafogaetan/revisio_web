import React, { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/contexts/SidebarContext'
import { getCustomAds } from '@/services/api'
import { CustomAd } from '@/services/api'

export const Header: React.FC = () => {
  const { isOpen, toggleSidebar, isMobile } = useSidebar()
  const [ads, setAds] = useState<CustomAd[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // Charger les annonces personnalisées
  useEffect(() => {
    const loadAds = async () => {
      try {
        const customAds = await getCustomAds()
        setAds(customAds)
        if (customAds.length > 0) {
          setCurrentAdIndex(0)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAds()
  }, [])

  // Rotation automatique des annonces
  useEffect(() => {
    if (ads.length <= 1) return

    // Démarrer le carrousel si pas en survol
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length)
      }, 5000) // Changement toutes les 5 secondes
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [ads.length, isHovered])

  // Fonction pour aller à l'annonce suivante
  const goToNextAd = () => {
    if (ads.length === 0) return
    setCurrentAdIndex((prev) => (prev + 1) % ads.length)
    // Réinitialiser le timer
    resetTimer()
  }

  // Fonction pour aller à l'annonce précédente
  const goToPrevAd = () => {
    if (ads.length === 0) return
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length)
    // Réinitialiser le timer
    resetTimer()
  }

  // Réinitialiser le timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!isHovered && ads.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length)
      }, 5000)
    }
  }

  // Gérer le clic sur une annonce
  const handleAdClick = (ad: CustomAd) => {
    if (ad.ctaLink) {
      window.open(ad.ctaLink, '_blank')
    }
  }

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <header className="bg-primary text-white shadow-md z-30 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {!isMobile && (
                <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                  <Menu className="h-6 w-6" />
                </Button>
              )}
              <h1 className="text-2xl font-bold">Revisio</h1>
            </div>
            <div className="flex items-center">
              <div className="w-48 h-10 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Aucune annonce disponible
  if (ads.length === 0) {
    return (
      <header className="bg-primary text-white shadow-md z-30 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {!isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-primary-foreground/10"
                  onClick={toggleSidebar}
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              )}
              <h1 className="text-2xl font-bold">Revisio</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/60 text-sm">Aucune annonce</span>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const currentAd = ads[currentAdIndex]

  return (
    <header className="bg-primary text-white shadow-md z-30 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Partie gauche - Logo et menu */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-primary-foreground/10"
                onClick={toggleSidebar}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            )}
            <h1 className="text-2xl font-bold">Revisio</h1>
          </div>

          {/* Partie centrale - Annonce personnalisée */}
          <div 
            className="flex-1 max-w-md mx-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className="relative bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-white/20"
              onClick={() => handleAdClick(currentAd)}
              style={{
                backgroundColor: currentAd.backgroundColor || 'rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center px-3 py-1.5 min-h-[40px]">
                {/* Image de l'annonce si disponible */}
                {currentAd.imageUrl && (
                  <img 
                    src={currentAd.imageUrl}
                    alt=""
                    className="w-8 h-8 rounded object-cover mr-2 flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
                
                {/* Texte de l'annonce */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: currentAd.textColor || '#ffffff' }}
                  >
                    {currentAd.title}
                  </p>
                  <p 
                    className="text-xs truncate opacity-80"
                    style={{ color: currentAd.textColor || '#ffffff' }}
                  >
                    {currentAd.description}
                  </p>
                </div>

                {/* Indicateur de plusieurs annonces */}
                {ads.length > 1 && (
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        goToPrevAd()
                      }}
                      className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] opacity-70 min-w-[20px] text-center">
                      {currentAdIndex + 1}/{ads.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        goToNextAd()
                      }}
                      className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Indicateur de progression (barre) */}
              {ads.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${((currentAdIndex + 1) / ads.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Partie droite - Petit CTA si disponible */}
          {currentAd.ctaText && (
            <div className="flex-shrink-0 hidden sm:block">
              <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors cursor-pointer">
                {currentAd.ctaText}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}