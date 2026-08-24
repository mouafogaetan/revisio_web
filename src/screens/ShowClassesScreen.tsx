import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { ContentCard } from '@/components/common/ContentCard'
import { getImageUrl } from '@/services/api'
import { AddToHomeScreen } from '@/components/common/AddToHomeScreen'
import { AdManager } from '@/components/common/AdManager'

export const ShowClassesScreen: React.FC = () => {
  const navigate = useNavigate()
  const { classes, isLoading, error, loadClasses } = useAppStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (classes.length === 0 && !isLoading) {
      loadClasses()
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadClasses(true)
    setRefreshing(false)
  }

  const handlePressClasse = (classeId: string) => {
    navigate(`/matiere/${classeId}`)
  }

  const adInsertIndex = classes.length > 2 ? Math.max(1, Math.ceil(classes.length / 2)) : -1

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des classes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">Erreur: {error}</p>
        <Button onClick={handleRefresh}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mes Classes</h2>
        <Button 
          variant="ghost" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Rafraîchir
        </Button>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classe, index) => {
              const imageUrl = getImageUrl('classe', classe.classeId)
              const count = classe.matieres?.length || 0
              const showCount = !isLoading && classe.matieres !== undefined

              return (
                <React.Fragment key={classe.classeId}>
                  <ContentCard
                    id={classe.classeId}
                    title={classe.classeName}
                    iconType="classe"
                    imageUrl={imageUrl}
                    count={showCount ? count : undefined}
                    countLabel="matière(s)"
                    onClick={handlePressClasse}
                    isLoading={isLoading}
                  />

                  {adInsertIndex !== -1 && index === adInsertIndex - 1 && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <AdManager type="inArticle" position="inline" delay={900} showLabel={false} className="w-full" />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {classes.length === 0 && !isLoading && (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune classe disponible</p>
            </div>
          )}
        </div>

        <aside className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-24">
            <AdManager type="sidebar" position="inline" delay={1200} showLabel={true} className="w-full" />
          </div>
        </aside>
      </div>

      {/* Bouton flottant AddToHomeScreen */}
      <div className="fixed bottom-6 right-6 z-50">
        <AddToHomeScreen variant="icon" className="!bg-primary text-white shadow-lg hover:shadow-xl transition-shadow" />
      </div>
    </div>
  )
}