import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft } from 'lucide-react'
import { ContentCard } from '@/components/common/ContentCard'
import { getImageUrl } from '@/services/api'

export const ShowChapitresScreen: React.FC = () => {
  const { classeId, matiereId } = useParams<{ classeId: string; matiereId: string }>()
  const navigate = useNavigate()
  const { classes, isLoading, loadChapitres } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)

  useEffect(() => {
    if (classeId && matiereId && matiere) {
      if (matiere.chapitres && matiere.chapitres.length > 0) {
        setIsDataLoaded(true)
        return
      }
      
      setLoading(true)
      loadChapitres(classeId, matiereId).finally(() => {
        setLoading(false)
        setIsDataLoaded(true)
      })
    }
  }, [classeId, matiereId, matiere])

  const handlePressChapitre = (chapitreId: string) => {
    navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}`)
  }

  const handlePressSujet = () => {
    navigate(`/sujet/${classeId}/${matiereId}`)
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des chapitres...</span>
      </div>
    )
  }

  if (!classe || !matiere) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Matière non trouvée</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const chapitres = matiere.chapitres || []

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/matiere/${classeId}`)} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{matiere.matiereName}</h2>
          <p className="text-sm text-gray-500">{classe.classeName}</p>
        </div>
      </div>

      <Button onClick={handlePressSujet} className="mb-6 w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
        📄 Voir les épreuves
      </Button>

      <div className="space-y-3">
        {chapitres.map((chapitre) => {
          const imageUrl = getImageUrl('chapitre', chapitre.matiereId)
          const count = chapitre.lessons?.length || 0
          const showCount = isDataLoaded && chapitre.lessons !== undefined

          return (
            <ContentCard
              key={chapitre.chapitreId}
              id={chapitre.chapitreId}
              title={`Chapitre ${chapitre.index + 1}: ${chapitre.chapitreName}`}
              iconType="chapitre"
              imageUrl={imageUrl}
              count={showCount ? count : undefined}
              countLabel="leçon(s)"
              onClick={handlePressChapitre}
              isLoading={!isDataLoaded}
              className="w-full"
            />
          )
        })}
      </div>

      {chapitres.length === 0 && isDataLoaded && (
        <div className="text-center py-10">
          <p className="text-gray-500">Aucun chapitre disponible</p>
        </div>
      )}
    </div>
  )
}