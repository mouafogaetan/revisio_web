import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Smartphone, Monitor, X, Plus } from 'lucide-react'

interface AddToHomeScreenProps {
  className?: string
  variant?: 'icon' | 'button' | 'banner' | 'fab'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export const AddToHomeScreen: React.FC<AddToHomeScreenProps> = ({
  className = '',
  variant = 'icon',
  position = 'bottom-right'
}) => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  useEffect(() => {
    // Vérifier si l'app est déjà en mode standalone (PWA installée)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isStandaloneMode)

    // Détecter le type d'appareil
    const userAgent = navigator.userAgent
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)
    setIsMobile(isMobileDevice)

    const isIOSDevice = /iPhone|iPad|iPod/i.test(userAgent)
    setIsIOS(isIOSDevice)

    const isAndroidDevice = /Android/i.test(userAgent)
    setIsAndroid(isAndroidDevice)

    // Vérifier si l'utilisateur a déjà fermé la notification
    const dismissed = localStorage.getItem('addToHomeScreenDismissed')
    if (dismissed) {
      setIsDismissed(true)
    }

    // Afficher automatiquement après un délai
    if (!isStandaloneMode && isMobileDevice && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    setIsDismissed(true)
    setIsVisible(false)
    localStorage.setItem('addToHomeScreenDismissed', 'true')
  }

  const handleAddToHomeScreen = async () => {
    // Pour Android (Chrome)
    if (isAndroid && window.navigator && 'share' in window.navigator) {
      try {
        // @ts-ignore - window.navigator.share
        await window.navigator.share({
          title: 'Revisio',
          text: 'Rejoignez-nous sur Revisio pour réviser vos cours !',
          url: window.location.origin
        })
      } catch (error) {
        console.warn('Share cancelled:', error)
      }
    } else {
      // Pour les autres navigateurs, ouvrir une boîte de dialogue
      alert(
        isIOS 
          ? "Pour ajouter Revisio à votre écran d'accueil :\n\n1. Appuyez sur le bouton 'Partager' (carré avec une flèche)\n2. Faites défiler vers le bas\n3. Appuyez sur 'Sur l'écran d'accueil'\n4. Appuyez sur 'Ajouter'"
          : "Pour ajouter Revisio à votre écran d'accueil :\n\n1. Ouvrez le menu du navigateur (⋮)\n2. Appuyez sur 'Ajouter à l'écran d'accueil'\n3. Appuyez sur 'Ajouter'"
      )
    }
    setShowPrompt(false)
  }

  // Si l'app est déjà installée, l'utilisateur a fermé ou ce n'est pas mobile
  if (isStandalone || isDismissed || !isMobile || !isVisible) {
    return null
  }

  // Version FAB (Floating Action Button)
  if (variant === 'fab') {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {showPrompt && (
          <div className="absolute bottom-16 right-0 mb-2 w-72 bg-white rounded-lg shadow-xl p-4 border border-gray-200 animate-slideUp">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                {isAndroid ? (
                  <Smartphone className="w-6 h-6 text-primary" />
                ) : isIOS ? (
                  <Smartphone className="w-6 h-6 text-primary" />
                ) : (
                  <Monitor className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Ajouter à l'écran d'accueil
                </p>
                <p className="text-xs text-gray-600">
                  {isIOS 
                    ? "Appuyez sur Partager puis 'Sur l'écran d'accueil'"
                    : isAndroid
                    ? "Appuyez sur ⋮ puis 'Ajouter à l'écran d'accueil'"
                    : "Utilisez votre navigateur pour ajouter ce site"
                  }
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToHomeScreen}
              className="w-full mt-3"
            >
              {isIOS ? 'Partager' : 'Ajouter'}
            </Button>
          </div>
        )}
        
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className={`
            w-14 h-14 rounded-full bg-primary text-white shadow-lg 
            hover:shadow-xl hover:bg-primary/90 transition-all duration-200
            flex items-center justify-center
            ${className}
          `}
          title="Ajouter à l'écran d'accueil"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    )
  }

  // Version icône (pour le header)
  if (variant === 'icon') {
    return (
      <button
        onClick={() => setShowPrompt(!showPrompt)}
        className={`relative p-2 rounded-full hover:bg-white/20 transition-colors ${className}`}
        title="Ajouter à l'écran d'accueil"
      >
        <Download className="w-5 h-5 text-white" />
        {showPrompt && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200">
            <button
              onClick={handleDismiss}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                {isAndroid ? (
                  <Smartphone className="w-6 h-6 text-primary" />
                ) : isIOS ? (
                  <Smartphone className="w-6 h-6 text-primary" />
                ) : (
                  <Monitor className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  Ajouter à l'écran d'accueil
                </p>
                <p className="text-xs text-gray-600">
                  {isIOS 
                    ? "Appuyez sur Partager puis 'Sur l'écran d'accueil'"
                    : isAndroid
                    ? "Appuyez sur ⋮ puis 'Ajouter à l'écran d'accueil'"
                    : "Utilisez votre navigateur pour ajouter ce site"
                  }
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToHomeScreen}
              className="w-full mt-3"
            >
              {isIOS ? 'Partager' : 'Ajouter'}
            </Button>
          </div>
        )}
      </button>
    )
  }

  // Version bannière
  if (variant === 'banner') {
    return (
      <div className={`relative bg-primary/10 rounded-lg p-3 ${className}`}>
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-3">
          <img 
            src="/src/assets/icon.png" 
            alt="Revisio" 
            className="w-10 h-10 rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Ajouter Revisio à l'écran d'accueil
            </p>
            <p className="text-xs text-gray-600">
              Accédez à Revisio en un clic
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleAddToHomeScreen}
            className="flex-shrink-0"
          >
            {isIOS ? 'Partager' : 'Ajouter'}
          </Button>
        </div>
      </div>
    )
  }

  // Version bouton standard
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleAddToHomeScreen}
      className={`${className}`}
    >
      <Download className="w-4 h-4 mr-2" />
      {isIOS ? 'Installer' : 'Ajouter à l\'écran d\'accueil'}
    </Button>
  )
}