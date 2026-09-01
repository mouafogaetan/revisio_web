import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, Trophy, Eye } from 'lucide-react'
import { QuizResult } from '@/types/classeTypes'
import { FullScreenAdModal } from '@/components/common/FullScreenAdModal'

export const ResultScreen: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showFullScreenAd, setShowFullScreenAd] = useState(true)
  
  const { result, quiz } = location.state || {}
  
  if (!result || !quiz) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Aucun résultat disponible</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const totalQuestions = result.nbrQuestions
  const correctAnswers = result.correctAnswers
  const wrongAnswers = totalQuestions - correctAnswers
  const score = result.score || Math.round((correctAnswers / totalQuestions) * 20)
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  
  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-green-600'
    if (score >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 15) return 'Excellent ! 🎉'
    if (score >= 10) return 'Peut mieux faire ! 💪'
    return 'Continue à t\'entraîner ! 📚'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 15) return '🏆'
    if (score >= 10) return '⭐'
    return '📖'
  }

  const handleViewAnswers = () => {
    navigate('/reponses', { state: { quiz } })
  }

  const handleRetry = () => {
    navigate(-1)
  }

  const handleBackToLesson = () => {
    navigate(-2) // Retourner à la leçon
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center w-full">
          <Button 
            variant="ghost" 
            onClick={handleBackToLesson} 
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-xl font-bold text-gray-800 break-words">Résultats</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* En-tête */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{getScoreEmoji(score)}</div>
            <h3 className="text-2xl font-bold text-gray-800">{quiz.title}</h3>
            {quiz.matiereName && (
              <p className="text-sm text-gray-500">{quiz.matiereName}</p>
            )}
          </div>

          {/* Score */}
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
              {score}/20
            </div>
            <p className="text-lg text-gray-600 mt-2">
              {getScoreMessage(score)}
            </p>
            <div className="mt-3 w-full max-w-xs h-3 bg-gray-200 rounded-full overflow-hidden mx-auto">
              <div 
                className={`h-full transition-all duration-1000 ${
                  score >= 15 ? 'bg-green-500' : 
                  score >= 10 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{percentage}% de réussite</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{totalQuestions}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
              <p className="text-sm text-gray-500">Correctes</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
              <p className="text-sm text-gray-500">Incorrectes</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleViewAnswers} 
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir les réponses détaillées
            </Button>
            <div className="flex space-x-3">
              <Button 
                variant="ghost" 
                onClick={handleRetry}
                className="flex-1"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Recommencer
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleBackToLesson}
                className="flex-1"
              >
                Retour à la leçon
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FullScreenAdModal
        visible={showFullScreenAd}
        onClose={() => setShowFullScreenAd(false)}
        durationMs={5000}
        title="Résultats"
      />
    </div>
  )
}