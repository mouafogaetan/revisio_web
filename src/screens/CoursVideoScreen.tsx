import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { 
  Loader2, ArrowLeft, Play, Pause, Volume2, VolumeX, 
  Maximize, Minimize, Video, Settings, Subtitles, 
  ChevronDown, Check 
} from 'lucide-react'
import { getCoursVideo } from '@/services/api'
import { CoursVideo } from '@/types/classeTypes'
import { getYouTubeId } from '@/lib/utils'

// Qualités disponibles
const QUALITIES = [
  { label: 'Auto', value: 'auto' },
  { label: '2160p (4K)', value: '2160' },
  { label: '1440p (2K)', value: '1440' },
  { label: '1080p (HD)', value: '1080' },
  { label: '720p (HD)', value: '720' },
  { label: '480p', value: '480' },
  { label: '360p', value: '360' },
  { label: '240p', value: '240' },
  { label: '144p', value: '144' },
]

export const CoursVideoScreen: React.FC = () => {
  const { classeId, matiereId, chapitreId, lessonId } = useParams<{
    classeId: string
    matiereId: string
    chapitreId: string
    lessonId: string
  }>()
  const navigate = useNavigate()
  const { classes } = useAppStore()
  const [videos, setVideos] = useState<CoursVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<CoursVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(50)
  const [quality, setQuality] = useState('auto')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const [subtitleTrack, setSubtitleTrack] = useState<string>('fr')
  const [isBuffering, setIsBuffering] = useState(false)
  const iframeRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const qualityMenuRef = useRef<HTMLDivElement>(null)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)
  const lesson = chapitre?.lessons.find(l => l.lessonId === lessonId)

  // Fermer le menu qualité en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node)) {
        setShowQualityMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const loadVideos = async () => {
      if (!classeId || !matiereId || !chapitreId || !lessonId) return

      try {
        setLoading(true)
        setError(null)
        const data = await getCoursVideo(classeId, matiereId, chapitreId, lessonId)
        const validVideos = data.filter(v => getYouTubeId(v.youtubeUrl))
        setVideos(validVideos)
        if (validVideos.length === 0) {
          setError('Aucune vidéo valide disponible')
        }
      } catch (err) {
        setError('Impossible de charger les vidéos')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadVideos()
  }, [classeId, matiereId, chapitreId, lessonId])

  // Chargement du lecteur YouTube
  useEffect(() => {
    if (!selectedVideo || !window.YT) return

    const videoId = getYouTubeId(selectedVideo.youtubeUrl)
    if (!videoId) return

    // Détruire l'ancien lecteur s'il existe
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (e) {
        // Ignorer
      }
      playerRef.current = null
    }

    const player = new window.YT.Player('youtube-player', {
      videoId: videoId,
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        autoplay: 1,
        cc_load_policy: showSubtitles ? 1 : 0,
        hl: 'fr',
      },
      events: {
        onReady: (event: any) => {
          setPlayerReady(true)
          setDuration(event.target.getDuration())
          playerRef.current = event.target
          setIsBuffering(false)
        },
        onStateChange: (event: any) => {
          // -1 = non démarré, 0 = terminé, 1 = lecture, 2 = pause, 3 = buffering, 5 = signal d'en-tête
          setIsPlaying(event.data === 1)
          setIsBuffering(event.data === 3)
          if (event.data === 0) {
            setCurrentTime(0)
          }
          // Mettre à jour le volume si changé
          if (event.data === 1 || event.data === 2) {
            try {
              const currentVolume = event.target.getVolume()
              setVolume(currentVolume)
            } catch (e) {
              // Ignorer
            }
          }
        },
        onError: (event: any) => {
          console.error('YouTube Error:', event.data)
          setError('Erreur lors de la lecture de la vidéo')
          setIsBuffering(false)
        },
        onPlaybackQualityChange: (event: any) => {
          // Mise à jour de la qualité actuelle
          const currentQuality = event.target.getPlaybackQuality()
          const qualityLabel = QUALITIES.find(q => q.value === currentQuality)?.label || currentQuality
          console.log('Qualité changée:', qualityLabel)
        }
      }
    })

    // Mettre à jour le temps en cours
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const time = playerRef.current.getCurrentTime()
          if (time !== undefined) {
            setCurrentTime(time)
          }
        } catch (e) {
          // Ignorer les erreurs
        }
      }
    }, 500)

    return () => {
      clearInterval(interval)
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          // Ignorer
        }
        playerRef.current = null
      }
    }
  }, [selectedVideo, showSubtitles])

  // Charger l'API YouTube
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // Gestion de la qualité
  const handleQualityChange = (qualityValue: string) => {
    setQuality(qualityValue)
    setShowQualityMenu(false)
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackQuality(qualityValue)
      } catch (e) {
        console.warn('Impossible de changer la qualité:', e)
      }
    }
  }

  // Gestion des sous-titres
  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles)
    if (playerRef.current) {
      try {
        // Recharger la vidéo avec les sous-titres
        const videoId = getYouTubeId(selectedVideo?.youtubeUrl || '')
        if (videoId) {
          playerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: currentTime,
            suggestedQuality: quality
          })
          // Réappliquer les sous-titres
          setTimeout(() => {
            if (playerRef.current) {
              // Les sous-titres sont gérés via cc_load_policy
              // On peut aussi les activer/désactiver avec cette méthode
              if (showSubtitles) {
                playerRef.current.setOption('cc', 'track', { languageCode: subtitleTrack })
              }
            }
          }, 100)
        }
      } catch (e) {
        console.warn('Erreur lors du changement de sous-titres:', e)
      }
    }
  }

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(volume)
    } else {
      playerRef.current.mute()
    }
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setVolume(value)
    if (playerRef.current) {
      playerRef.current.setVolume(value)
      if (value === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!iframeRef.current) return
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  const formatTime = (time: number) => {
    if (!time || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return
    const value = parseFloat(e.target.value)
    setCurrentTime(value)
    playerRef.current.seekTo(value, true)
  }

  const getThumbnailUrl = (url: string): string => {
    const videoId = getYouTubeId(url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des vidéos...</span>
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

  // Obtenir l'étiquette de qualité actuelle
  const currentQualityLabel = QUALITIES.find(q => q.value === quality)?.label || 'Auto'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/lesson/${classeId}/${matiereId}/${chapitreId}/${lessonId}`)} 
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{lesson.lessonName}</h2>
          <p className="text-sm text-gray-500">Cours vidéo</p>
        </div>
      </div>

      {selectedVideo ? (
        <div className="flex-1 flex flex-col">
          {/* Lecteur vidéo */}
          <div ref={iframeRef} className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {!playerReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
                <span className="ml-2 text-white">Chargement de la vidéo...</span>
              </div>
            )}
            
            {isBuffering && playerReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
              </div>
            )}
            
            <div id="youtube-player" className="w-full h-full" />
            
            {/* Contrôles overlay */}
            {playerReady && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12">
                {/* Barre de progression */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
                    [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white"
                  style={{ 
                    background: `linear-gradient(to right, #66857A ${(currentTime / (duration || 1)) * 100}%, #4a5568 ${(currentTime / (duration || 1)) * 100}%)` 
                  }}
                />
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20 p-1"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    {/* Volume */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20 p-1"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer 
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                          [&::-webkit-slider-thumb]:bg-white"
                        style={{ 
                          background: `linear-gradient(to right, #66857A ${isMuted ? 0 : volume}%, #4a5568 ${isMuted ? 0 : volume}%)` 
                        }}
                      />
                    </div>
                    
                    {/* Temps */}
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Sous-titres */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSubtitles}
                      className={`p-1 ${showSubtitles ? 'text-primary' : 'text-white hover:bg-white/20'}`}
                      title={showSubtitles ? 'Désactiver les sous-titres' : 'Activer les sous-titres'}
                    >
                      <Subtitles className="w-5 h-5" />
                    </Button>

                    {/* Qualité */}
                    <div className="relative" ref={qualityMenuRef}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="text-white hover:bg-white/20 p-1"
                        title={`Qualité: ${currentQualityLabel}`}
                      >
                        <Settings className="w-5 h-5" />
                        <span className="text-xs ml-1 hidden sm:inline">{currentQualityLabel}</span>
                      </Button>
                      
                      {/* Menu qualité */}
                      {showQualityMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[180px] z-20">
                          <div className="p-2">
                            <p className="text-xs text-gray-400 px-2 py-1">Qualité vidéo</p>
                            {QUALITIES.map((q) => (
                              <button
                                key={q.value}
                                onClick={() => handleQualityChange(q.value)}
                                className={`
                                  w-full flex items-center justify-between px-3 py-2 text-sm rounded
                                  hover:bg-gray-700 transition-colors
                                  ${quality === q.value ? 'text-primary' : 'text-white'}
                                `}
                              >
                                <span>{q.label}</span>
                                {quality === q.value && <Check className="w-4 h-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Plein écran */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20 p-1"
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Titre de la vidéo */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{selectedVideo.title}</h3>
              <p className="text-sm text-gray-500">
                Qualité: {currentQualityLabel} • {showSubtitles ? 'Sous-titres activés' : 'Sous-titres désactivés'}
              </p>
            </div>
            <Button variant="ghost" onClick={() => {
              if (playerRef.current) {
                playerRef.current.destroy()
              }
              setSelectedVideo(null)
              setPlayerReady(false)
              setShowQualityMenu(false)
            }}>
              Fermer
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          {videos.map((video) => {
            const thumbnailUrl = getThumbnailUrl(video.youtubeUrl)
            return (
              <div
                key={video.coursVideoId}
                onClick={() => setSelectedVideo(video)}
                className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
              >
                <div className="relative pb-[56.25%] h-0 bg-gray-100">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity">
                    <Play className="w-12 h-12 text-white opacity-80" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {video.title}
                  </h3>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-gray-500">Aucune vidéo disponible</p>
        </div>
      )}
    </div>
  )
}