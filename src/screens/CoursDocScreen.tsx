import React, { useEffect, useState, useRef } from 'react'
import useMeta from '@/hooks/useMeta'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, VolumeX, Play, Pause } from 'lucide-react'
import { API_URL } from '@/constants'
import { MathJaxContent } from '@/components/common/MathJaxContent'
import { FullScreenAdModal } from '@/components/common/FullScreenAdModal'

interface SlideData {
  titre: string
  contenu: string
  texteParle: string
  note: string
}

export const CoursDocScreen: React.FC = () => {
  const { classeId, matiereId, chapitreId, lessonId } = useParams<{
    classeId: string
    matiereId: string
    chapitreId: string
    lessonId: string
  }>()
  const navigate = useNavigate()
  const { classes } = useAppStore()
  const [slides, setSlides] = useState<SlideData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullScreenAd, setShowFullScreenAd] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const chapitre = matiere?.chapitres.find(c => c.chapitreId === chapitreId)
  const lesson = chapitre?.lessons.find(l => l.lessonId === lessonId)
  const currentSlide = slides[currentIndex] || slides[0]
  const hasTextToSpeak = currentSlide?.texteParle && currentSlide.texteParle.trim() !== ''

  useMeta({
    title: currentSlide?.titre
      ? `${currentSlide.titre} — ${lesson?.lessonName || ''} | Revisio`
      : `${lesson?.lessonName || 'Cours'} | Revisio`,
    description: (() => {
      const raw = (currentSlide?.contenu || lesson?.lessonName || '').replace(/<[^>]*>/g, '')
      return raw.substring(0, 160)
    })(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    image: 'https://revisio-web.vercel.app/icon-512.png',
    type: 'article'
  })

  // Vérifier la synthèse vocale
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis
      setIsSpeechSupported(true)
    } else {
      setIsSpeechSupported(false)
    }

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel()
      }
    }
  }, [])

  // Arrêter la synthèse vocale quand on change de slide
  useEffect(() => {
    stopSpeaking()
  }, [currentIndex])

  useEffect(() => {
    const loadSlides = async () => {
      if (!classeId || !matiereId || !chapitreId || !lessonId) return

      try {
        setLoading(true)
        setError(null)
        const url = `${API_URL}/data/${classeId}/${matiereId}/${chapitreId}/cours/${lessonId}.html`
        const response = await fetch(url)
        const html = await response.text()
        
        const extractedSlides = extractSlidesFromHTML(html)
        if (extractedSlides.length > 0) {
          setSlides(extractedSlides)
          setCurrentIndex(0)
        } else {
          setSlides([{
            titre: lesson?.lessonName || 'Cours',
            contenu: `<p>${lesson?.lessonName || 'Cours'}</p>`,
            texteParle: lesson?.lessonName || 'Cours',
            note: ''
          }])
        }
      } catch (err) {
        setError('Impossible de charger le cours')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSlides()
  }, [classeId, matiereId, chapitreId, lessonId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowFullScreenAd(true)
    }, 60000)

    return () => window.clearTimeout(timer)
  }, [])

  const extractSlidesFromHTML = (html: string): SlideData[] => {
    try {
      const startMarker = 'const slides = ['
      const startPos = html.indexOf(startMarker)
      
      if (startPos === -1) {
        return []
      }

      let bracketCount = 0
      let inString = false
      let stringChar = ''
      let escapeNext = false
      let endPos = -1
      
      for (let i = startPos + startMarker.length; i < html.length; i++) {
        const char = html[i]
        
        if (escapeNext) {
          escapeNext = false
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          continue
        }
        
        if ((char === '"' || char === "'") && !inString) {
          inString = true
          stringChar = char
          continue
        }
        
        if (inString && char === stringChar) {
          inString = false
          stringChar = ''
          continue
        }
        
        if (inString) continue
        
        if (char === '[') {
          bracketCount++
        } else if (char === ']') {
          if (bracketCount === 0) {
            endPos = i
            break
          }
          bracketCount--
        }
      }

      if (endPos === -1) return []

      const slidesContent = html.substring(startPos + startMarker.length, endPos)
      const fullArrayStr = `[${slidesContent.trim()}]`
      
      let slidesData
      try {
        slidesData = new Function(`return ${fullArrayStr}`)()
      } catch {
        try {
          slidesData = eval(`(${fullArrayStr})`)
        } catch {
          return []
        }
      }
      
      if (!Array.isArray(slidesData) || slidesData.length === 0) {
        return []
      }

      return slidesData.map((slide: any) => ({
        titre: slide.titre || 'Sans titre',
        contenu: slide.contenu || '',
        texteParle: slide.texteParle || '',
        note: slide.note || '',
      }))
    } catch (err) {
      console.error('Erreur lors de l\'extraction des slides:', err)
      return []
    }
  }

  // Fonctions de synthèse vocale
  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
    }
    setIsSpeaking(false)
    setIsPaused(false)
  }

  const speakCurrentSlide = () => {
    if (!slides.length || currentIndex >= slides.length) return

    const slide = slides[currentIndex]
    const text = slide.texteParle || slide.titre

    if (!text || text.trim() === '' || !speechSynthRef.current) {
      return
    }

    if (isSpeaking && !isPaused) {
      stopSpeaking()
      return
    }

    if (isSpeaking && isPaused) {
      speechSynthRef.current.resume()
      setIsPaused(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.pitch = 1.0
    utterance.rate = 0.9
    
    const cleanText = text.replace(/<[^>]*>/g, '')
    utterance.text = cleanText

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error('Erreur de synthèse vocale:', event)
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    speechSynthRef.current.speak(utterance)
  }

  const toggleSpeaking = () => {
    if (isSpeaking && !isPaused) {
      if (speechSynthRef.current) {
        speechSynthRef.current.pause()
        setIsPaused(true)
      }
    } else if (isSpeaking && isPaused) {
      if (speechSynthRef.current) {
        speechSynthRef.current.resume()
        setIsPaused(false)
      }
    } else {
      speakCurrentSlide()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    }
  }

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1)
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement du cours...</span>
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

          <div className="flex items-center space-x-2 shrink-0">
            <Button variant="ghost" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 w-full">
          <h2 className="text-xl font-bold text-gray-800 break-words">
            {currentSlide?.titre || lesson.lessonName}
          </h2>
          <p className="text-sm text-gray-500">
            {lesson.lessonName}
          </p>
        </div>
      </div>

      {isSpeaking && (
        <div className="mb-2 flex items-center space-x-2 text-sm text-primary">
          <div className="flex space-x-1">
            <span className="animate-pulse">🔊</span>
            <span>{isPaused ? 'Lecture en pause' : 'Lecture en cours...'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopSpeaking}
            className="text-red-500 hover:text-red-700"
          >
            <VolumeX className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div 
        ref={contentRef}
        className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto border border-gray-200"
      >
        <MathJaxContent 
          html={currentSlide?.contenu || '<p>Contenu non disponible</p>'}
          key={`slide-${currentIndex}`}
        />
      </div>

      {currentSlide?.note && (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm font-semibold text-blue-700 mb-1">📝 Note :</p>
          <div className="text-sm text-blue-700">
            <MathJaxContent 
              html={currentSlide.note}
              key={`note-${currentIndex}`}
            />
          </div>
        </div>
      )}

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

          {isSpeechSupported && hasTextToSpeak && (
            <Button
              variant={isSpeaking ? 'default' : 'ghost'}
              onClick={toggleSpeaking}
              className={isSpeaking ? 'bg-primary text-white hover:bg-primary/90' : ''}
              title={isSpeaking ? (isPaused ? 'Reprendre la lecture' : 'Arrêter la lecture') : 'Lire à haute voix'}
            >
              {isSpeaking ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={currentIndex === slides.length - 1}
            className="disabled:opacity-50"
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {isSpeechSupported && hasTextToSpeak && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {isSpeaking ? '🔊' : '🔇'} Lecture disponible
            </span>
          )}
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Mobile floating controls (icons only) */}
      <div className="sm:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur rounded-full px-3 py-2 shadow-lg flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="p-2"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {isSpeechSupported && hasTextToSpeak && (
            <Button
              variant={isSpeaking ? 'default' : 'ghost'}
              onClick={toggleSpeaking}
              className={isSpeaking ? 'bg-primary text-white hover:bg-primary/90 p-2 rounded-full' : 'p-2'}
              aria-label="Lire"
            >
              {isSpeaking ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={currentIndex === slides.length - 1}
            className="p-2"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <FullScreenAdModal
        visible={showFullScreenAd}
        onClose={() => setShowFullScreenAd(false)}
      />
    </div>
  )
}