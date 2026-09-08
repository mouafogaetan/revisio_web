import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface NotFoundScreenProps {
  message?: string
  redirectTo?: string
  delay?: number // Délai avant redirection en ms
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({
  message = 'Le contenu demandé n\'existe pas ou a été déplacé.',
  redirectTo = '/',
  delay = 3000
}) => {
  const navigate = useNavigate()

  useEffect(() => {
    // Rediriger automatiquement après le délai
    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true })
    }, delay)

    return () => clearTimeout(timer)
  }, [navigate, redirectTo, delay])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page non trouvée</h1>
      <p className="text-gray-600 mb-2">{message}</p>
      <p className="text-sm text-gray-400">
        Redirection vers l'accueil dans {Math.ceil(delay / 1000)} secondes...
      </p>
      <button
        onClick={() => navigate(redirectTo, { replace: true })}
        className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  )
}

export default NotFoundScreen