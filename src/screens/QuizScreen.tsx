import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Questions, Quiz } from '@/types/classeTypes'
import { MathJaxContent } from '@/components/common/MathJaxContent'
import { FullScreenAdModal } from '@/components/common/FullScreenAdModal'

export const QuizScreen: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Questions[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderKey, setRenderKey] = useState(0)
  const [showFullScreenAd, setShowFullScreenAd] = useState(false)

  useEffect(() => {
    const quizData = location.state?.quiz
    
    if (quizData && quizData.questions && quizData.questions.length > 0) {
      setQuiz(quizData)
      setQuestions(quizData.questions.map((q: Questions) => ({ ...q, userAnswer: undefined })))
      setLoading(false)
    } else {
      setError('Aucune question disponible pour ce quiz')
      setLoading(false)
    }
  }, [location.state])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowFullScreenAd(true)
    }, 60000)

    return () => window.clearTimeout(timer)
  }, [])

  const handleSelectOption = (optionIndex: number) => {
    setQuestions(prev => 
      prev.map((q: Questions, idx: number) => 
        idx === currentIndex 
          ? { ...q, userAnswer: optionIndex }
          : q
      )
    )
    // Forcer le re-rendu MathJax
    setRenderKey(prev => prev + 1)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleValidate = () => {
    // Vérifier que toutes les questions ont été répondues
    const allAnswered = questions.every((q: Questions) => q.userAnswer !== undefined)
    
    if (!allAnswered) {
      alert('Veuillez répondre à toutes les questions avant de valider.')
      return
    }

    // Calculer le score
    let correct = 0
    questions.forEach((q: Questions) => {
      if (q.userAnswer === q.correctAnswer) {
        correct++
      }
    })

    // Créer le résultat
    const result = {
      quizId: quiz?.quizId || '',
      matiereId: quiz?.matiereId || '',
      nbrQuestions: questions.length,
      correctAnswers: correct,
      score: Math.round((correct / questions.length) * 20),
      lessons: quiz?.lessons || [],
      dateTaken: new Date(),
      type: quiz?.type || 'quiz'
    }

    // Naviguer vers ResultScreen avec le résultat et le quiz
    navigate('/result', { 
      state: { 
        result, 
        quiz: { ...quiz, questions } 
      } 
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-orange-100 text-orange-700'
      case 'very hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile'
      case 'medium': return 'Moyen'
      case 'hard': return 'Difficile'
      case 'very hard': return 'Très difficile'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement du quiz...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucune question disponible</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isAnswered = currentQuestion.userAnswer !== undefined
  const totalQuestions = questions.length
  const answeredCount = questions.filter((q: Questions) => q.userAnswer !== undefined).length
  const allAnswered = answeredCount === totalQuestions

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 w-full">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
            {getDifficultyLabel(currentQuestion.difficulty)}
          </span>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-xl font-bold text-gray-800 break-words">{quiz?.title || 'Quiz'}</h2>
          <p className="text-sm text-gray-500">
            Question {currentIndex + 1} sur {totalQuestions}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progression</span>
          <span>{answeredCount}/{totalQuestions} répondues</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6 border border-gray-200 overflow-y-auto">
        <div className="text-lg font-medium text-gray-800 mb-6">
          <MathJaxContent 
            html={currentQuestion.questionText}
            key={`q-${currentIndex}-${renderKey}`}
            forceRender={true}
          />
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = currentQuestion.userAnswer === index

            return (
              <div
                key={index}
                onClick={() => handleSelectOption(index)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  hover:border-primary hover:bg-primary/5
                  ${isSelected && 'border-primary bg-primary/10'}
                  ${!isSelected && 'border-gray-200'}
                `}
              >
                <div className="flex items-center">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-sm font-medium mr-3 flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">
                    <MathJaxContent 
                      html={option}
                      inline
                      key={`opt-${currentIndex}-${index}-${renderKey}`}
                      forceRender={true}
                    />
                  </span>
                  {isSelected && (
                    <div className="ml-2 flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation et validation */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleValidate}
            disabled={!allAnswered}
            className={allAnswered ? 'bg-green-600 hover:bg-green-700' : 'opacity-50'}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Valider
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
          className="disabled:opacity-50"
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Indicateur de complétion */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          {allAnswered ? '✅ Toutes les questions ont été répondues' : `${totalQuestions - answeredCount} question(s) restante(s)`}
        </p>
      </div>

      <FullScreenAdModal
        visible={showFullScreenAd}
        onClose={() => setShowFullScreenAd(false)}
        durationMs={5000}
        title="Quiz"
      />
    </div>
  )
}