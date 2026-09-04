import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { ContentCard } from '@/components/common/ContentCard'
import { getImageUrl } from '@/services/api'
import { AdManager } from '@/components/common/AdManager'

export const ShowLessonScreen: React.FC = () => {
  const { classeId, matiereId, chapitreId } = useParams<{
    classeId: string
    matiereId: string
    chapitreId: string
  }>()
  const navigate = useNavigate()
  const { classes, isLoading, loadRouteData } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)

  useEffect(() => {
    if (classeId && matiereId && chapitreId) {
      setIsDataLoaded(false)
      setLoading(true)
      loadRouteData(classeId, matiereId, chapitreId).finally(() => {
        setLoading(false)
        setIsDataLoaded(true)
      })
    }
  }, [classeId, matiereId, chapitreId, loadRouteData])

  const handlePressLesson = (lessonId: string) => {
    navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}/${lessonId}`)
  }

  const handleRefresh = async () => {
    if (!classeId || !matiereId || !chapitreId) return
    setLoading(true)
    setIsDataLoaded(false)
    await loadRouteData(classeId, matiereId, chapitreId, true)
    setLoading(false)
    setIsDataLoaded(true)
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des leçons...</span>
      </div>
    )
  }

  if (!classe || !matiere || !chapitre) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Chapitre non trouvé</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const lessons = chapitre.lessons || []
  const adInsertIndex = lessons.length > 2 ? Math.max(1, Math.ceil(lessons.length / 2)) : -1

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 w-full">
          <Button variant="ghost" onClick={() => navigate(`/chapitre/${classeId}/${matiereId}`)} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <Button variant="ghost" onClick={handleRefresh} disabled={loading} className="shrink-0" title="Rafraîchir" aria-label="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-2xl font-bold text-gray-800 break-words">
            Chapitre {chapitre.index + 1}: {chapitre.chapitreName}
          </h2>
          <p className="text-sm text-gray-500">{matiere.matiereName}</p>
        </div>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const imageUrl = getImageUrl('lesson', lesson.matiereId)

              return (
                <React.Fragment key={lesson.lessonId}>
                  <ContentCard
                    id={lesson.lessonId}
                    title={`Leçon ${lesson.index + 1}: ${lesson.lessonName}`}
                    iconType="lesson"
                    imageUrl={imageUrl}
                    onClick={handlePressLesson}
                    isLoading={!isDataLoaded}
                    className="w-full"
                  />

                  {adInsertIndex !== -1 && index === adInsertIndex - 1 && (
                    <AdManager type="inArticle" position="inline" delay={1200} showLabel={false} className="w-full" />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {lessons.length === 0 && isDataLoaded && (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune leçon disponible</p>
            </div>
          )}
        </div>

        <aside className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-24">
            <AdManager type="sidebar" position="inline" delay={1500} showLabel={true} className="w-full" />
          </div>
        </aside>
      </div>
    </div>
  )
}