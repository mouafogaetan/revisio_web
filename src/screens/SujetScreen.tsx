import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, RefreshCw, Eye, FileText, X } from 'lucide-react'
import { getEpreuves } from '@/services/api'
import { Epreuve } from '@/types/classeTypes'
import { API_URL } from '@/constants'

export const SujetScreen: React.FC = () => {
  const { classeId, matiereId } = useParams<{ classeId: string; matiereId: string }>()
  const navigate = useNavigate()
  const { classes } = useAppStore()
  const [epreuves, setEpreuves] = useState<Epreuve[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEpreuve, setSelectedEpreuve] = useState<Epreuve | null>(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)

  useEffect(() => {
    const loadEpreuves = async () => {
      if (!classeId || !matiereId) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await getEpreuves(classeId, matiereId)
        setEpreuves(data)
      } catch (err) {
        setError('Impossible de charger les épreuves')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadEpreuves()
  }, [classeId, matiereId])

  const getEpreuveUrl = (epreuve: Epreuve): string => {
    return `${API_URL}/data/${classeId}/${matiereId}/epreuves/${epreuve.epreuveId}.html`
  }

  const openEpreuve = (epreuve: Epreuve) => {
    setSelectedEpreuve(epreuve)
    setIframeLoading(true)
    setIframeError(false)
  }

  const closeDetail = () => {
    setSelectedEpreuve(null)
    setIframeLoading(true)
    setIframeError(false)
  }

  const handleRetry = () => {
    setIframeLoading(true)
    setIframeError(false)
    const iframe = document.getElementById('epreuve-iframe') as HTMLIFrameElement
    if (iframe && selectedEpreuve) {
      iframe.src = getEpreuveUrl(selectedEpreuve)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des épreuves...</span>
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

  // Fonction pour obtenir la couleur de fond selon l'index
  const getCardColor = (index: number) => {
    const colors = [
      'bg-blue-50 hover:bg-blue-100 border-blue-200',
      'bg-green-50 hover:bg-green-100 border-green-200',
      'bg-purple-50 hover:bg-purple-100 border-purple-200',
      'bg-orange-50 hover:bg-orange-100 border-orange-200',
      'bg-pink-50 hover:bg-pink-100 border-pink-200',
      'bg-teal-50 hover:bg-teal-100 border-teal-200',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="flex flex-col h-full">
      {selectedEpreuve ? (
        <div className="flex flex-col h-[calc(100vh-8rem)] min-h-0">
          <div className="flex items-center mb-4 shrink-0">
            <Button
              variant="ghost"
              onClick={closeDetail}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-800 truncate">
                {selectedEpreuve.title || 'Épreuve'}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {matiere.matiereName} - {classe.classeName}
              </p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleRetry} title="Recharger">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative bg-white overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Chargement de l'épreuve...</span>
              </div>
            )}

            {iframeError ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500 mb-4">Impossible de charger l'épreuve</p>
                <Button onClick={handleRetry}>Réessayer</Button>
              </div>
            ) : (
              <iframe
                id="epreuve-iframe"
                ref={iframeRef}
                src={getEpreuveUrl(selectedEpreuve)}
                className="w-full h-full border-0"
                title={`Épreuve - ${selectedEpreuve.title || 'Épreuve'}`}
                onLoad={() => {
                  setIframeLoading(false)
                  setIframeError(false)
                  try {
                    const iframeDoc = iframeRef.current?.contentDocument
                    if (iframeDoc && iframeDoc.defaultView) {
                      const iframeWindow = iframeDoc.defaultView as any
                      if (iframeWindow.MathJax && iframeWindow.MathJax.typesetPromise) {
                        iframeWindow.MathJax.typesetPromise().catch(() => {})
                      }
                    }
                  } catch (e) {
                    // Ignorer les erreurs de cross-origin
                  }
                }}
                onError={() => {
                  setIframeLoading(false)
                  setIframeError(true)
                }}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}
          </div>
        </div>
      ): (
        <>
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/chapitre/${classeId}/${matiereId}`)}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Épreuves</h2>
              <p className="text-sm text-gray-500">
                {matiere.matiereName} - {classe.classeName}
              </p>
            </div>
            <div className="ml-auto text-sm text-gray-400">
              {epreuves.length} épreuve{epreuves.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {epreuves.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Aucune épreuve disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {epreuves.map((epreuve, index) => (
                  <div
                    key={epreuve.epreuveId}
                    onClick={() => openEpreuve(epreuve)}
                    className={`
                      cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-all
                      hover:scale-[1.02] p-5 border-2
                      ${getCardColor(index)}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-800">
                            {epreuve.title || `Épreuve ${index + 1}`}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                          {epreuve.epreuveId}
                        </p>
                        <div className="mt-2 ml-7">
                          <span className="text-xs bg-white/60 px-2 py-1 rounded-full text-gray-600">
                            📄 Cliquez pour ouvrir
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}