import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Play, Video } from 'lucide-react'
import { getExerciceVideo } from '@/services/api'
import { ExerciceVideo } from '@/types/classeTypes'
import { getYouTubeId } from '@/lib/utils'
import { FullScreenAdModal } from '@/components/common/FullScreenAdModal'

export const ExerciceVideoScreen: React.FC = () => {
  const { classeId, matiereId, chapitreId, lessonId } = useParams<{ classeId: string; matiereId: string; chapitreId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { classes } = useAppStore()
  const [videos, setVideos] = useState<ExerciceVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullScreenAd, setShowFullScreenAd] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<ExerciceVideo | null>(null)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)
  const lesson = chapitre?.lessons.find(l => l.lessonId === lessonId)

  useEffect(() => {
    const loadVideos = async () => {
      if (!classeId || !matiereId || !chapitreId || !lessonId) return
      try {
        setLoading(true)
        setError(null)
        const data = await getExerciceVideo(classeId, matiereId, chapitreId, lessonId)
        const validVideos = data.filter(video => getYouTubeId(video.youtubeUrl))
        setVideos(validVideos)
        if (validVideos.length === 0) setError('Aucune vidéo valide disponible')
      } catch (err) {
        setError('Impossible de charger les vidéos')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadVideos()
  }, [classeId, matiereId, chapitreId, lessonId])

  useEffect(() => {
    const timer = window.setTimeout(() => setShowFullScreenAd(true), 60000)
    return () => window.clearTimeout(timer)
  }, [])

  const getThumbnailUrl = (url: string) => {
    const videoId = getYouTubeId(url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-2 text-gray-600">Chargement des vidéos...</span></div>
  if (error) return <div className="text-center py-10"><p className="text-red-500">{error}</p><Button onClick={() => window.location.reload()} className="mt-4">Réessayer</Button></div>
  if (!classe || !matiere || !chapitre || !lesson) return <div className="text-center py-10"><p className="text-red-500">Leçon non trouvée</p><Button onClick={() => navigate('/')} className="mt-4">Retour à l'accueil</Button></div>

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center w-full">
          <Button variant="ghost" onClick={() => navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}/${lessonId}`)} className="shrink-0"><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-xl font-bold text-gray-800 break-words">{lesson.lessonName}</h2>
          <p className="text-sm text-gray-500">Exercices vidéo</p>
        </div>
      </div>

      {selectedVideo ? (
        <div className="flex-1 flex flex-col">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.youtubeUrl)}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`}
              title={selectedVideo.title}
              className="w-full h-full min-h-[240px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="mt-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-800">{selectedVideo.title}</h3><Button variant="ghost" onClick={() => setSelectedVideo(null)}>Fermer</Button></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          {videos.map(video => <div key={video.exerciceVideoId} onClick={() => setSelectedVideo(video)} className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
            <div className="relative pb-[56.25%] h-0 bg-gray-100">
              {getThumbnailUrl(video.youtubeUrl) ? <img src={getThumbnailUrl(video.youtubeUrl)} alt={video.title} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Video className="w-12 h-12 text-gray-400" /></div>}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50"><Play className="w-12 h-12 text-white opacity-80" /></div>
            </div>
            <div className="p-4"><h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{video.title}</h3></div>
          </div>)}
        </div>
      )}

      {videos.length === 0 && !loading && <div className="text-center py-10"><p className="text-gray-500">Aucune vidéo disponible</p></div>}
      <FullScreenAdModal visible={showFullScreenAd} onClose={() => setShowFullScreenAd(false)} durationMs={5000} title="Exercice vidéo" />
    </div>
  )
}