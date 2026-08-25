import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { ContentCard } from '@/components/common/ContentCard'
import { getImageUrl } from '@/services/api'
import { AdManager } from '@/components/common/AdManager'

export const ShowMatieresScreen: React.FC = () => {
  const { classeId } = useParams<{ classeId: string }>()
  const navigate = useNavigate()
  const { classes, isLoading, loadMatieres } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const classe = classes.find(c => c.classeId === classeId)

  useEffect(() => {
    if (classeId && classe) {
      // Si les matières sont déjà chargées
      if (classe.matieres && classe.matieres.length > 0) {
        setIsDataLoaded(true)
        return
      }
      
      // Sinon les charger
      setLoading(true)
      loadMatieres(classeId).finally(() => {
        setLoading(false)
        setIsDataLoaded(true)
      })
    }
  }, [classeId, classe])

  const handlePressMatiere = (matiereId: string) => {
    navigate(`/chapitre/${classeId}/${matiereId}`)
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des matières...</span>
      </div>
    )
  }

  if (!classe) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Classe non trouvée</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const matieres = classe.matieres || []
  const adInsertIndex = matieres.length > 2 ? Math.max(1, Math.ceil(matieres.length / 2)) : -1

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{classe.classeName}</h2>
          <p className="text-sm text-gray-500">
            {isDataLoaded ? `${matieres.length} matière(s)` : 'Chargement...'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => window.location.reload()} className="ml-auto" title="Rafraîchir" aria-label="Rafraîchir">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matieres.map((matiere, index) => {
              const imageUrl = getImageUrl('matiere', matiere.matiereId)
              const count = matiere.chapitres?.length || 0
              const showCount = isDataLoaded && matiere.chapitres !== undefined

              return (
                <React.Fragment key={matiere.matiereId}>
                  <ContentCard
                    id={matiere.matiereId}
                    title={matiere.matiereName}
                    iconType="matiere"
                    imageUrl={imageUrl}
                    count={showCount ? count : undefined}
                    countLabel="chapitre(s)"
                    onClick={handlePressMatiere}
                    isLoading={!isDataLoaded}
                  />

                  {adInsertIndex !== -1 && index === adInsertIndex - 1 && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <AdManager type="inArticle" position="inline" delay={1000} showLabel={false} className="w-full" />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {matieres.length === 0 && isDataLoaded && (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune matière disponible</p>
            </div>
          )}
        </div>

        <aside className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-24">
            <AdManager type="sidebar" position="inline" delay={1300} showLabel={true} className="w-full" />
          </div>
        </aside>
      </div>
    </div>
  )
}