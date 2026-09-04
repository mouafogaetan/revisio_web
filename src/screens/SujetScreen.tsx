import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Eye, FileText } from 'lucide-react'
import { DATA_SOURCE_URL } from '@/constants'
import { MathJaxContent } from '@/components/common/MathJaxContent'
import { getEpreuves } from '@/services/api'

interface Question {
  question: string
  reponse: string
}

interface Exercise {
  titre: string
  points: string
  enonce: string
  questions: Question[]
}

interface ExamData {
  matiere: string
  classe: string
  sequence: string
  anneeScolaire: string
  exercices: Exercise[]
}

interface SlideData {
  titre: string
  contenu: string
  note?: string
}

interface Epreuve {
  epreuveId: string
  title?: string
}

export const SujetScreen: React.FC = () => {
  const { classeId, matiereId } = useParams<{ classeId: string; matiereId: string }>()
  const navigate = useNavigate()
  const { classes, loadRouteData } = useAppStore()
  
  // États pour la liste des sujets
  const [epreuves, setEpreuves] = useState<Epreuve[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // États pour le sujet sélectionné
  const [selectedEpreuve, setSelectedEpreuve] = useState<Epreuve | null>(null)
  const [slides, setSlides] = useState<SlideData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, Record<number, boolean>>>({})
  const [loadingSubject, setLoadingSubject] = useState(false)
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [routeLoading, setRouteLoading] = useState(true)
  
  const contentRef = useRef<HTMLDivElement>(null)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const currentSlide = slides[currentIndex] || slides[0]

  useEffect(() => {
    if (!classeId || !matiereId) return

    loadRouteData(classeId, matiereId).finally(() => setRouteLoading(false))
  }, [classeId, matiereId, loadRouteData])

  // Charger la liste des épreuves
  useEffect(() => {
    const loadEpreuves = async () => {
      if (!classeId || !matiereId) return
      
      try {
        setLoadingList(true)
        setError(null)
        
        // Normaliser les champs bruts `id` et `nom` en `epreuveId` et `title`.
        const data = await getEpreuves(classeId, matiereId)
        setEpreuves(data)
      } catch (err) {
        setError('Impossible de charger les épreuves')
        console.error(err)
      } finally {
        setLoadingList(false)
      }
    }
    loadEpreuves()
  }, [classeId, matiereId])

  // Fonction pour ouvrir un sujet
  const openEpreuve = async (epreuve: Epreuve) => {
    if (!classeId || !matiereId) return

    try {
      setLoadingSubject(true)
      setSubjectError(null)
      setSelectedEpreuve(epreuve)

      // Charger le fichier HTML du sujet
      const htmlResponse = await fetch(`${DATA_SOURCE_URL}/data/${classeId}/${matiereId}/epreuves/${epreuve.epreuveId}.html`)
      if (!htmlResponse.ok) throw new Error('Impossible de charger le sujet')
      const html = await htmlResponse.text()

      // Extraire examData du HTML
      const extractedData = extractExamData(html)
      if (extractedData && extractedData.exercices.length > 0) {
        // Convertir les exercices en slides
        const convertedSlides = convertExercisesToSlides(extractedData)
        setSlides(convertedSlides)
        setCurrentIndex(0)
        // Initialiser les réponses révélées
        const initialRevealed: Record<number, Record<number, boolean>> = {}
        extractedData.exercices.forEach((_, exIndex) => {
          initialRevealed[exIndex] = {}
        })
        setRevealedAnswers(initialRevealed)
      } else {
        setSlides([{
          titre: 'Sujet non disponible',
          contenu: '<p>Le contenu du sujet n\'a pas pu être extrait.</p>',
        }])
      }
    } catch (err) {
      setSubjectError('Impossible de charger le sujet')
      console.error(err)
    } finally {
      setLoadingSubject(false)
    }
  }

  // Fermer le sujet pour revenir à la liste
  const closeEpreuve = () => {
    setSelectedEpreuve(null)
    setSlides([])
    setCurrentIndex(0)
    setRevealedAnswers({})
    setSubjectError(null)
  }

  // Extraire examData du HTML - Version améliorée
  const extractExamData = (html: string): ExamData | null => {
    try {
      // Méthode 1: Chercher examData avec regex
      const examDataRegex = /const\s+examData\s*=\s*({[\s\S]*?});/
      const match = html.match(examDataRegex)
      
      if (!match) {
        console.warn('examData non trouvé avec regex, tentative avec eval...')
        // Méthode 2: Chercher tout objet JavaScript dans le script
        try {
          // Extraire le contenu entre <script> et </script>
          const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/)
          if (scriptMatch) {
            const scriptContent = scriptMatch[1]
            // Chercher une affectation à examData
            const evalMatch = scriptContent.match(/examData\s*=\s*({[\s\S]*?});/)
            if (evalMatch) {
              const dataStr = evalMatch[1]
              const data = new Function(`return ${dataStr}`)()
              return data
            }
          }
        } catch (e) {
          console.warn('Erreur avec la méthode 2:', e)
        }
        return null
      }

      // Nettoyer la chaîne pour le parsing
      let dataStr = match[1]
      
      // Remplacer les guillemets simples par des doubles (pour les clés et les valeurs)
      // Mais attention aux apostrophes dans les textes
      dataStr = dataStr.replace(/'/g, (match, offset, string) => {
        // Vérifier si c'est une clé (suivi de deux-points)
        const after = string.substring(offset + 1)
        if (after.trim().startsWith(':')) {
          return '"'
        }
        // Sinon c'est une valeur, on garde les guillemets simples
        return "'"
      })

      // Essayer de parser avec JSON
      try {
        const data = JSON.parse(dataStr)
        return data
      } catch (parseError) {
        console.warn('Erreur de parsing JSON, tentative avec eval...')
        // Fallback: utiliser une fonction
        try {
          const data = new Function(`return ${dataStr}`)()
          return data
        } catch (evalError) {
          console.error('Erreur eval:', evalError)
          return null
        }
      }
    } catch (err) {
      console.error('Erreur extraction examData:', err)
      return null
    }
  }

  // Convertir les exercices en slides
  const convertExercisesToSlides = (data: ExamData): SlideData[] => {
    return data.exercices.map((exercise, index) => {
      // Construire le contenu HTML pour l'exercice
      let contenu = `
        <div class="exercise-card">
          <div class="exercise-header">
            <span class="exercise-title">${exercise.titre}</span>
            <span class="exercise-points">${exercise.points}</span>
          </div>
          <div class="exercise-statement">
            ${exercise.enonce}
          </div>
      `

      exercise.questions.forEach((q, qIndex) => {
        const isRevealed = revealedAnswers[index]?.[qIndex] || false
        contenu += `
          <div class="question-block ${isRevealed ? 'revealed' : ''}" data-exercise="${index}" data-question="${qIndex}">
            <div class="question-text">
              <span class="question-label">${qIndex + 1}.</span>
              <span>${q.question}</span>
            </div>
            <button 
              class="btn-reveal ${isRevealed ? 'revealed' : ''}" 
              data-exercise="${index}" 
              data-question="${qIndex}"
            >
              ${isRevealed ? '🙈 Masquer' : '👁️ Voir réponse'}
            </button>
            <div class="question-answer ${isRevealed ? 'visible' : ''}">
              ${q.reponse}
            </div>
          </div>
        `
      })

      contenu += `</div>`

      return {
        titre: `Exercice ${index + 1} : ${exercise.titre}`,
        contenu: contenu,
        note: `${exercise.points} - ${data.matiere}`
      }
    })
  }

  // Fonctions de navigation
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

  // Fonction pour basculer la réponse - Version améliorée avec gestion des événements
  const toggleAnswer = useCallback((exIndex: number, qIndex: number) => {
    setRevealedAnswers(prev => {
      const newRevealed = { ...prev }
      if (!newRevealed[exIndex]) {
        newRevealed[exIndex] = {}
      }
      newRevealed[exIndex][qIndex] = !newRevealed[exIndex][qIndex]
      return newRevealed
    })
  }, [])

  // Gestion des clics sur les boutons "Voir réponse/Masquer"
  useEffect(() => {
    const handleRevealClick = (e: Event) => {
      const target = e.target as HTMLElement
      const button = target.closest('.btn-reveal')
      if (button) {
        const exIndex = parseInt(button.getAttribute('data-exercise') || '0')
        const qIndex = parseInt(button.getAttribute('data-question') || '0')
        toggleAnswer(exIndex, qIndex)
      }
    }

    const container = contentRef.current
    if (container) {
      container.addEventListener('click', handleRevealClick)
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleRevealClick)
      }
    }
  }, [toggleAnswer])

  // Mettre à jour les slides quand revealedAnswers change
  useEffect(() => {
    if (selectedEpreuve && slides.length > 0) {
      // Reconstruire les slides avec les nouvelles réponses révélées
      const data = slides[0]?.contenu ? extractExamDataFromSlides() : null
      if (data) {
        const newSlides = convertExercisesToSlides(data)
        setSlides(newSlides)
      }
    }
  }, [revealedAnswers])

  // Fonction helper pour extraire les données des slides (simplifiée)
  const extractExamDataFromSlides = (): ExamData | null => {
    // Cette fonction serait complexe à implémenter parfaitement
    // Pour simplifier, on pourrait stocker les données originales
    return null
  }

  // Stocker les données originales pour la reconstruction
  const [originalExamData, setOriginalExamData] = useState<ExamData | null>(null)

  // Modifier openEpreuve pour stocker les données originales
  const openEpreuveWithData = async (epreuve: Epreuve) => {
    if (!classeId || !matiereId) return

    try {
      setLoadingSubject(true)
      setSubjectError(null)
      setSelectedEpreuve(epreuve)

      const htmlResponse = await fetch(`${DATA_SOURCE_URL}/data/${classeId}/${matiereId}/epreuves/${epreuve.epreuveId}.html`)
      if (!htmlResponse.ok) throw new Error('Impossible de charger le sujet')
      const html = await htmlResponse.text()

      const extractedData = extractExamData(html)
      if (extractedData && extractedData.exercices.length > 0) {
        setOriginalExamData(extractedData)
        const convertedSlides = convertExercisesToSlides(extractedData)
        setSlides(convertedSlides)
        setCurrentIndex(0)
        const initialRevealed: Record<number, Record<number, boolean>> = {}
        extractedData.exercices.forEach((_, exIndex) => {
          initialRevealed[exIndex] = {}
        })
        setRevealedAnswers(initialRevealed)
      } else {
        setSlides([{
          titre: 'Sujet non disponible',
          contenu: '<p>Le contenu du sujet n\'a pas pu être extrait.</p>',
        }])
      }
    } catch (err) {
      setSubjectError('Impossible de charger le sujet')
      console.error(err)
    } finally {
      setLoadingSubject(false)
    }
  }

  // Remplacer openEpreuve par openEpreuveWithData
  const openEpreuveFinal = openEpreuveWithData

  // Mettre à jour les slides quand les réponses changent
  useEffect(() => {
    if (originalExamData && slides.length > 0) {
      const newSlides = convertExercisesToSlides(originalExamData)
      // Garder l'index courant
      const currentIdx = currentIndex
      setSlides(newSlides)
      if (currentIdx < newSlides.length) {
        setCurrentIndex(currentIdx)
      }
    }
  }, [revealedAnswers, originalExamData])

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

  if (routeLoading || loadingList) {
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

  // ============================================================
  // AFFICHAGE DU SUJET SÉLECTIONNÉ (avec extraction des données)
  // ============================================================
  if (selectedEpreuve) {
    if (loadingSubject) {
      return (
        <div className="flex flex-col h-full w-full px-4">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={closeEpreuve}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[500px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Chargement du sujet...</span>
          </div>
        </div>
      )
    }

    if (subjectError) {
      return (
        <div className="flex flex-col h-full w-full px-4">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={closeEpreuve}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
          <div className="text-center py-10">
            <p className="text-red-500">{subjectError}</p>
            <Button onClick={() => openEpreuveFinal(selectedEpreuve)} className="mt-4">
              Réessayer
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full w-full px-4">
        {/* En-tête du sujet */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center justify-between gap-3 w-full">
            <Button 
              variant="ghost" 
              onClick={closeEpreuve}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-sm text-gray-400 hidden sm:inline">
                {slides.length} exercice{slides.length > 1 ? 's' : ''}
              </span>
              <Button variant="ghost" onClick={() => openEpreuveFinal(selectedEpreuve)}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 w-full">
            <h2 className="text-xl font-bold text-gray-800 break-words">
              {selectedEpreuve.title || 'Sujet'}
            </h2>
            <p className="text-sm text-gray-500 break-words">
              {matiere.matiereName} - {classe.classeName}
            </p>
          </div>
        </div>

        {/* Contenu du sujet */}
        <div 
          ref={contentRef}
          className="flex-1 min-h-[500px] bg-white rounded-lg shadow-md p-4 md:p-6 overflow-y-auto border border-gray-200"
        >
          <div className="subject-content">
            <MathJaxContent 
              html={currentSlide?.contenu || '<p>Contenu non disponible</p>'}
              key={`slide-${currentIndex}`}
            />
          </div>
        </div>

        {/* Note */}
        {currentSlide?.note && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm font-semibold text-blue-700 mb-1">📝 Informations :</p>
            <div className="text-sm text-blue-700">
              <MathJaxContent 
                html={currentSlide.note}
                key={`note-${currentIndex}`}
              />
            </div>
          </div>
        )}

        {/* Pied de page avec contrôles de navigation */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Précédent</span>
              <span className="sm:hidden">Préc.</span>
            </Button>

            <Button
              variant="ghost"
              onClick={goToNext}
              disabled={currentIndex === slides.length - 1}
              className="disabled:opacity-50"
            >
              <span className="hidden sm:inline">Suivant</span>
              <span className="sm:hidden">Suiv.</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Contrôles mobiles flottants */}
        <div className="sm:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/95 backdrop-blur rounded-full px-2 py-2 shadow-lg flex items-center gap-1 border border-gray-200">
            <Button
              variant="ghost"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-medium"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Préc.</span>
            </Button>

            <div className="min-w-[72px] text-center text-[10px] font-semibold text-gray-600 leading-tight px-1">
              {currentIndex + 1}
              <span className="block text-[9px] text-gray-500">/ {slides.length}</span>
            </div>

            <Button
              variant="ghost"
              onClick={goToNext}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-medium"
              aria-label="Suivant"
            >
              <span>Suiv.</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Styles pour le contenu du sujet */}
        <style>{`
          .subject-content .exercise-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 16px 16px 12px 16px;
            margin-bottom: 16px;
          }

          .subject-content .exercise-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            flex-wrap: wrap;
            gap: 8px;
          }

          .subject-content .exercise-title {
            font-weight: 700;
            font-size: 1.1rem;
            color: #1e40af;
          }

          .subject-content .exercise-points {
            font-size: 0.75rem;
            color: #64748b;
            background: rgba(0,0,0,0.04);
            padding: 2px 12px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            white-space: nowrap;
          }

          .subject-content .exercise-statement {
            color: #1e293b;
            line-height: 1.7;
            margin-bottom: 12px;
            font-size: 0.95rem;
            padding: 0 4px;
          }

          .subject-content .question-block {
            background: rgba(0,0,0,0.02);
            border-radius: 12px;
            padding: 12px 14px;
            margin-top: 8px;
            border-left: 3px solid #e2e8f0;
            transition: border-color 0.3s ease;
          }

          .subject-content .question-block.revealed {
            border-left-color: #059669;
          }

          .subject-content .question-text {
            font-size: 0.92rem;
            color: #1e293b;
            line-height: 1.6;
            margin-bottom: 8px;
            display: flex;
            gap: 8px;
          }

          .subject-content .question-label {
            font-weight: 600;
            color: #2563eb;
            flex-shrink: 0;
          }

          .subject-content .question-answer {
            background: rgba(5, 150, 105, 0.06);
            border: 1px solid rgba(5, 150, 105, 0.15);
            border-radius: 8px;
            padding: 10px 14px;
            margin-top: 8px;
            display: none;
            font-size: 0.9rem;
            color: #065f46;
            line-height: 1.6;
            transition: all 0.3s ease;
          }

          .subject-content .question-answer.visible {
            display: block;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .subject-content .btn-reveal {
            background: rgba(37, 99, 235, 0.08);
            border: 1px solid rgba(37, 99, 235, 0.15);
            border-radius: 20px;
            padding: 4px 14px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #2563eb;
            cursor: pointer;
            transition: all 0.15s ease;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
            margin-top: 4px;
          }

          .subject-content .btn-reveal:active {
            transform: scale(0.94);
            background: rgba(37, 99, 235, 0.15);
          }

          .subject-content .btn-reveal.revealed {
            background: rgba(5, 150, 105, 0.1);
            border-color: rgba(5, 150, 105, 0.2);
            color: #059669;
          }

          @media (max-width: 400px) {
            .subject-content .exercise-card {
              padding: 12px 12px 10px 12px;
            }
            .subject-content .exercise-title {
              font-size: 0.95rem;
            }
            .subject-content .exercise-statement {
              font-size: 0.85rem;
            }
            .subject-content .question-text {
              font-size: 0.82rem;
            }
            .subject-content .question-block {
              padding: 10px 10px;
            }
            .subject-content .btn-reveal {
              font-size: 0.7rem;
              padding: 3px 10px;
            }
          }

          @media (min-width: 768px) {
            .subject-content .exercise-card {
              padding: 20px 24px 16px 24px;
            }
            .subject-content .question-block {
              padding: 16px 20px;
            }
          }
        `}</style>
      </div>
    )
  }

  // ============================================================
  // AFFICHAGE DE LA LISTE DES SUJETS
  // ============================================================
  return (
    <div className="flex flex-col h-full w-full px-4">
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
                onClick={() => openEpreuveFinal(epreuve)}
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
    </div>
  )
}