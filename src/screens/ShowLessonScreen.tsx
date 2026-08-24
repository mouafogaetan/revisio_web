import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft } from 'lucide-react'
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
  const { classes, isLoading, loadLessons } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)

  useEffect(() => {
    if (classeId && matiereId && chapitreId && chapitre) {
      if (chapitre.lessons && chapitre.lessons.length > 0) {
        setIsDataLoaded(true)
        return
      }
      
      setLoading(true)
      loadLessons(classeId, matiereId, chapitreId).finally(() => {
        setLoading(false)
        setIsDataLoaded(true)
      })
    }
  }, [classeId, matiereId, chapitreId, chapitre])

  const handlePressLesson = (lessonId: string) => {
    navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}/${lessonId}`)
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

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/chapitre/${classeId}/${matiereId}`)} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Chapitre {chapitre.index + 1}: {chapitre.chapitreName}
          </h2>
          <p className="text-sm text-gray-500">{matiere.matiereName}</p>
        </div>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const imageUrl = getImageUrl('lesson', lesson.matiereId)

              return (
                <ContentCard
                  key={lesson.lessonId}
                  id={lesson.lessonId}
                  title={`Leçon ${lesson.index + 1}: ${lesson.lessonName}`}
                  iconType="lesson"
                  imageUrl={imageUrl}
                  onClick={handlePressLesson}
                  isLoading={!isDataLoaded}
                  className="w-full"
                />
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