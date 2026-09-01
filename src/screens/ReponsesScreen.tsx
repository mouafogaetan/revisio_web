import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { MathJaxContent } from '@/components/common/MathJaxContent'
import { FullScreenAdModal } from '@/components/common/FullScreenAdModal'

export const ReponsesScreen: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { quiz } = location.state || {}
  const [currentIndex, setCurrentIndex] = useState(0)
  const [renderKey, setRenderKey] = useState(0)
  const [showFullScreenAd, setShowFullScreenAd] = useState(true)

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Aucune réponse à afficher</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const questions = quiz.questions
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  const isCorrect = (question: any) => {
    return question.userAnswer === question.correctAnswer
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setRenderKey(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
      setRenderKey(prev => prev + 1)
    }
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

          <div className="flex items-center space-x-2 shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {getDifficultyLabel(currentQuestion.difficulty)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isCorrect(currentQuestion) 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isCorrect(currentQuestion) ? '✅ Correct' : '❌ Incorrect'}
            </span>
          </div>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-xl font-bold text-gray-800 break-words">{quiz.title}</h2>
          <p className="text-sm text-gray-500">
            Correction - Question {currentIndex + 1} sur {totalQuestions}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md p-6 border border-gray-200 overflow-y-auto">
        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Question {currentIndex + 1}
          </h3>
          <div className="text-gray-700">
            <MathJaxContent 
              html={currentQuestion.questionText}
              key={`q-${currentIndex}-${renderKey}`}
              forceRender={true}
            />
          </div>
        </div>

        {/* Options avec correction */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option: string, index: number) => {
            const isSelected = currentQuestion.userAnswer === index
            const isCorrectAnswer = index === currentQuestion.correctAnswer
            const isUserCorrect = isSelected && isCorrectAnswer
            const isUserWrong = isSelected && !isCorrectAnswer

            return (
              <div
                key={index}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isCorrectAnswer && 'border-green-500 bg-green-50'}
                  ${isUserWrong && 'border-red-500 bg-red-50'}
                  ${!isCorrectAnswer && !isUserWrong && 'border-gray-200'}
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
                  <div className="ml-2 flex-shrink-0">
                    {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {isUserWrong && <XCircle className="w-5 h-5 text-red-500" />}
                    {isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Explication */}
        {currentQuestion.explanation && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h4 className="font-semibold text-blue-700 mb-2">📖 Explication</h4>
            <div className="text-blue-700">
              <MathJaxContent 
                html={currentQuestion.explanation}
                key={`exp-${currentIndex}-${renderKey}`}
                forceRender={true}
              />
            </div>
          </div>
        )}

        {/* Réponse de l'utilisateur */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Votre réponse : 
            <span className={`font-semibold ml-1 ${
              isCorrect(currentQuestion) ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentQuestion.userAnswer !== undefined ? (
                <MathJaxContent 
                  html={currentQuestion.options[currentQuestion.userAnswer]}
                  inline
                  key={`user-answer-${currentIndex}-${renderKey}`}
                  forceRender={true}
                />
              ) : (
                'Non répondue'
              )}
            </span>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Bonne réponse : 
            <span className="font-semibold text-green-600 ml-1">
              <MathJaxContent 
                html={currentQuestion.options[currentQuestion.correctAnswer]}
                inline
                key={`correct-answer-${currentIndex}-${renderKey}`}
                forceRender={true}
              />
            </span>
          </p>
        </div>
      </div>

      {/* Navigation */}
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
        <div className="flex space-x-1">
          {questions.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx)
                setRenderKey(prev => prev + 1)
              }}
              className={`
                w-3 h-3 rounded-full transition-all
                ${idx === currentIndex ? 'bg-primary w-6' : 'bg-gray-300 hover:bg-gray-400'}
              `}
            />
          ))}
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

      <FullScreenAdModal
        visible={showFullScreenAd}
        onClose={() => setShowFullScreenAd(false)}
        durationMs={5000}
        title="Réponses"
      />
    </div>
  )
}