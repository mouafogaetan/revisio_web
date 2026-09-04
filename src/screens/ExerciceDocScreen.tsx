import React, { useEffect, useState } from 'react'
import useMeta from '@/hooks/useMeta'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { getExercices } from '@/services/api'
import { Exercice, Question as QuestionType } from '@/types/classeTypes'
import { MathJaxContent } from '@/components/common/MathJaxContent'
import { FullScreenAdModal } from '@/components/common/FullScreenAdModal'

export const ExerciceDocScreen: React.FC = () => {
  const { classeId, matiereId, chapitreId, lessonId } = useParams<{
    classeId: string
    matiereId: string
    chapitreId: string
    lessonId: string
  }>()
  const navigate = useNavigate()
  const { classes, loadRouteData } = useAppStore()
  const [exercices, setExercices] = useState<Exercice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullScreenAd, setShowFullScreenAd] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleAnswers, setVisibleAnswers] = useState<Record<string, boolean>>({})
  const [renderKey, setRenderKey] = useState(0)
  const [routeLoading, setRouteLoading] = useState(true)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)
  const lesson = chapitre?.lessons.find(l => l.lessonId === lessonId)

  useMeta({
    title: lesson ? `Exercices : ${lesson.lessonName} | Revisio` : 'Exercices | Revisio',
    description: lesson ? `Entraînez-vous avec les exercices de ${lesson.lessonName} sur Revisio.` : 'Entraînez-vous avec les exercices disponibles sur Revisio.',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  })

  useEffect(() => {
    if (!classeId || !matiereId || !chapitreId) return

    loadRouteData(classeId, matiereId, chapitreId).finally(() => setRouteLoading(false))
  }, [classeId, matiereId, chapitreId, loadRouteData])

  useEffect(() => {
    const loadExercices = async () => {
      if (!classeId || !matiereId || !chapitreId || !lessonId) return

      try {
        setLoading(true)
        setError(null)
        const data = await getExercices(classeId, matiereId, chapitreId, lessonId)
        const niveauOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3, 'very hard': 4 }
        const sorted = [...data].sort((a, b) => {
          const aNiveau = niveauOrder[a.niveau] || 99
          const bNiveau = niveauOrder[b.niveau] || 99
          return aNiveau - bNiveau
        })
        setExercices(sorted)
      } catch (err) {
        setError('Impossible de charger les exercices')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadExercices()
  }, [classeId, matiereId, chapitreId, lessonId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowFullScreenAd(true)
    }, 60000)

    return () => window.clearTimeout(timer)
  }, [])

  const toggleAnswer = (questionId: string) => {
    setVisibleAnswers(prev => {
      const newState = {
        ...prev,
        [questionId]: !prev[questionId]
      }
      // Forcer le re-rendu MathJax après le changement
      setRenderKey(prevKey => prevKey + 1)
      return newState
    })
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setVisibleAnswers({})
      setRenderKey(prev => prev + 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < exercices.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setVisibleAnswers({})
      setRenderKey(prev => prev + 1)
    }
  }

  const renderQuestion = (question: QuestionType, exerciceId: string, isSubQuestion = false) => {
    const questionId = `${exerciceId}-${question.numero}`
    const isVisible = visibleAnswers[questionId]

    return (
      <div key={`${questionId}-${renderKey}`} className="mb-4 pl-4 border-l-2 border-gray-200">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-gray-800">
            {isSubQuestion ? question.numero : `Question ${question.numero}`}
          </h4>
          {question.reponse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAnswer(questionId)}
              className="text-sm flex-shrink-0 ml-2"
            >
              {isVisible ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Voir la réponse
                </>
              )}
            </Button>
          )}
        </div>
        <div className="mt-2 text-gray-700">
          <MathJaxContent 
            html={question.texte}
            key={`q-${questionId}-${renderKey}`}
            forceRender={true}
          />
        </div>
        {isVisible && question.reponse && (
          <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm font-semibold text-green-700">✅ Réponse :</p>
            <div className="text-green-700">
              <MathJaxContent 
                html={question.reponse}
                key={`r-${questionId}-${renderKey}`}
                forceRender={true}
              />
            </div>
          </div>
        )}
        {question.sousQuestions?.map((sq) => renderQuestion(sq, exerciceId, true))}
      </div>
    )
  }

  if (routeLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des exercices...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    )
  }

  if (!classe || !matiere || !chapitre || !lesson) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Leçon non trouvée</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  if (exercices.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucun exercice disponible</p>
        <Button onClick={() => navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}/${lessonId}`)} className="mt-4">
          Retour à la leçon
        </Button>
      </div>
    )
  }

  const currentExercice = exercices[currentIndex]

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 w-full">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}/${lessonId}`)} 
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <div className="flex items-center justify-end gap-2 flex-wrap">
            <span className={`px-2 py-1 text-[10px] rounded-full ${
              currentExercice.type === 'ressource' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {currentExercice.type === 'ressource' ? '📖 Ressource' : '🎯 Compétence'}
            </span>
            <span className={`px-2 py-1 text-[10px] rounded-full ${
              currentExercice.niveau === 'easy' ? 'bg-green-100 text-green-700' :
              currentExercice.niveau === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              currentExercice.niveau === 'hard' ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {currentExercice.niveau}
            </span>
          </div>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-xl font-bold text-gray-800 break-words">{lesson.lessonName}</h2>
          <p className="text-sm text-gray-500">
            Exercice {currentIndex + 1} sur {exercices.length}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md p-6 border border-gray-200 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {currentExercice.intitule || `Exercice ${currentIndex + 1}`}
          </h3>
        </div>

        <div className="mb-4 text-gray-700">
          <MathJaxContent 
            html={currentExercice.enonce.texte}
            key={`enonce-${currentIndex}-${renderKey}`}
            forceRender={true}
          />
        </div>

        {currentExercice.enonce.images && currentExercice.enonce.images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4">
            {currentExercice.enonce.images.map((img, idx) => (
              <img
                key={idx}
                src={`data:image/png;base64,${img}`}
                alt={`Image ${idx + 1}`}
                className="max-w-full max-h-48 object-contain rounded border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {currentExercice.questions.map((q) => renderQuestion(q, currentExercice.id))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="hidden sm:flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>

          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={currentIndex === exercices.length - 1}
            className="disabled:opacity-50"
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="hidden sm:flex items-center space-x-1">
          {exercices.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx)
                setVisibleAnswers({})
                setRenderKey(prev => prev + 1)
              }}
              className={`
                w-3 h-3 rounded-full transition-all
                ${idx === currentIndex ? 'bg-primary w-6' : 'bg-gray-300 hover:bg-gray-400'}
              `}
            />
          ))}
        </div>

        <div className="hidden sm:block text-sm text-gray-500">
          {currentIndex + 1} / {exercices.length}
        </div>
      </div>

      <div className="sm:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur rounded-full px-2 py-2 shadow-lg flex items-center gap-1 border border-gray-200">
          <Button
            variant="ghost"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-medium"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Préc.</span>
          </Button>

          <div className="min-w-[78px] text-center text-[10px] font-semibold text-gray-600 leading-tight px-1">
            Ex. {currentIndex + 1}
            <span className="block text-[9px] text-gray-500">/ {exercices.length}</span>
          </div>

          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={currentIndex === exercices.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-medium"
            aria-label="Suivant"
          >
            <span>Suiv.</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <FullScreenAdModal
        visible={showFullScreenAd}
        onClose={() => setShowFullScreenAd(false)}
        durationMs={5000}
        title="Exercice"
      />
    </div>
  )
}