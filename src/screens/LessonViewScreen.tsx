import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Video, FileQuestion, FileText, Play, Loader2 } from 'lucide-react'
import { generateQuizForLesson } from '@/services/api'

export const LessonViewScreen: React.FC = () => {
  const { classeId, matiereId, chapitreId, lessonId } = useParams<{
    classeId: string
    matiereId: string
    chapitreId: string
    lessonId: string
  }>()
  const navigate = useNavigate()
  const { classes } = useAppStore()
  const [generatingQuiz, setGeneratingQuiz] = useState(false)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)
  const lesson = chapitre?.lessons.find(l => l.lessonId === lessonId)

  const handleGenerateQuiz = async () => {
    if (!classeId || !matiereId || !chapitreId || !lessonId || !matiere || !lesson) return

    setGeneratingQuiz(true)
    try {
      const quiz = await generateQuizForLesson(
        classeId,
        matiereId,
        chapitreId,
        lessonId,
        matiere.matiereName,
        lesson.lessonName,
        10
      )

      if (quiz) {
        navigate('/quiz', { state: { quiz } })
      } else {
        alert('Aucune question disponible pour ce quiz.')
      }
    } catch (error) {
      console.error('Erreur lors de la génération du quiz:', error)
      alert('Une erreur s\'est produite lors de la génération du quiz.')
    } finally {
      setGeneratingQuiz(false)
    }
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

  const menuItems = [
    {
      icon: BookOpen,
      label: 'Cours',
      onClick: () => navigate(`/cours-doc/${classeId}/${matiereId}/${chapitreId}/${lessonId}`),
    },
    {
      icon: Video,
      label: 'Cours Vidéo',
      onClick: () => navigate(`/cours-video/${classeId}/${matiereId}/${chapitreId}/${lessonId}`),
    },
    {
      icon: FileQuestion,
      label: 'Quizzes',
      onClick: handleGenerateQuiz,
      loading: generatingQuiz,
    },
    {
      icon: FileText,
      label: 'Exercices',
      onClick: () => navigate(`/exercice-doc/${classeId}/${matiereId}/${chapitreId}/${lessonId}`),
    },
    {
      icon: Play,
      label: 'Exercice Vidéo',
      onClick: () => navigate(`/exercice-video/${classeId}/${matiereId}/${chapitreId}/${lessonId}`),
    },
  ]

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}`)} 
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{lesson.lessonName}</h2>
          <p className="text-sm text-gray-500">
            {matiere.matiereName} - Chapitre {chapitre.index + 1}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.loading ? undefined : item.onClick}
            className={`
              cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 p-8 border border-gray-200 text-center
              ${item.loading ? 'opacity-50 cursor-wait' : ''}
            `}
          >
            {item.loading ? (
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            ) : (
              <item.icon className="w-12 h-12 mx-auto text-primary mb-4" />
            )}
            <h3 className="text-lg font-semibold text-gray-800">
              {item.loading ? 'Génération...' : item.label}
            </h3>
          </div>
        ))}
      </div>
    </div>
  )
}