import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import useMeta from '@/hooks/useMeta'
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
  const { classeId, matiereId, epreuveId } = useParams<{ classeId: string; matiereId: string; epreuveId?: string }>()
  const navigate = useNavigate()
  const { classes, loadRouteData } = useAppStore()
  
  const [epreuves, setEpreuves] = useState<Epreuve[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedEpreuve, setSelectedEpreuve] = useState<Epreuve | null>(null)
  const [slides, setSlides] = useState<SlideData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, Record<number, boolean>>>({})
  const [loadingSubject, setLoadingSubject] = useState(false)
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [routeLoading, setRouteLoading] = useState(true)
  const [renderKey, setRenderKey] = useState(0)
  
  const contentRef = useRef<HTMLDivElement>(null)

  const classe = classes.find(c => c.classeId === classeId)
  const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
  const currentSlide = slides[currentIndex] || slides[0]

  useMeta({
    title: selectedEpreuve
      ? `${selectedEpreuve.title || 'Épreuve'} | ${matiere?.matiereName || 'Revisio'}`
      : matiere
        ? `Épreuves de ${matiere.matiereName} | Revisio`
        : 'Épreuves | Revisio',
    description: selectedEpreuve
      ? `Consultez le sujet ${selectedEpreuve.title || selectedEpreuve.epreuveId} de ${matiere?.matiereName || 'cette matière'} et sa correction sur Revisio.`
      : matiere
        ? `Consultez les épreuves de ${matiere.matiereName} pour la classe ${classe?.classeName || ''} et révisez gratuitement sur Revisio.`
        : 'Consultez les épreuves disponibles et révisez gratuitement sur Revisio.',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    type: 'article',
  })

  useEffect(() => {
    if (!classeId || !matiereId) return
    loadRouteData(classeId, matiereId).finally(() => setRouteLoading(false))
  }, [classeId, matiereId, loadRouteData])

  useEffect(() => {
    const loadEpreuves = async () => {
      if (!classeId || !matiereId) return
      try {
        setLoadingList(true)
        setError(null)
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

  const closeEpreuve = () => {
    if (classeId && matiereId) {
      navigate(`/sujet/${classeId}/${matiereId}`)
    }
    setSelectedEpreuve(null)
    setSlides([])
    setCurrentIndex(0)
    setRevealedAnswers({})
    setSubjectError(null)
  }

  const extractExamData = (html: string): ExamData | null => {
    try {
      const assignment = html.match(/(?:const|let|var)\s+examData\s*=\s*/)
      if (!assignment || assignment.index === undefined) {
        return null
      }

      const objectStart = assignment.index + assignment[0].length
      if (html[objectStart] !== '{') {
        return null
      }

      let depth = 0
      let quote: '"' | "'" | null = null
      let escaped = false
      let objectEnd = -1

      for (let index = objectStart; index < html.length; index += 1) {
        const character = html[index]

        if (quote) {
          if (escaped) {
            escaped = false
          } else if (character === '\\') {
            escaped = true
          } else if (character === quote) {
            quote = null
          }
          continue
        }

        if (character === '"' || character === "'") {
          quote = character
        } else if (character === '{') {
          depth += 1
        } else if (character === '}') {
          depth -= 1
          if (depth === 0) {
            objectEnd = index + 1
            break
          }
        }
      }

      if (objectEnd === -1) {
        return null
      }

      return JSON.parse(html.slice(objectStart, objectEnd)) as ExamData
    } catch (err) {
      console.error('Erreur extraction examData:', err)
      return null
    }
  }

  const convertExercisesToSlides = (data: ExamData): SlideData[] => {
    return data.exercices.map((exercise, index) => {
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
      contenu += `</div>`
      return {
        titre: `Exercice ${index + 1} : ${exercise.titre}`,
        contenu: contenu,
        note: `${exercise.points} - ${data.matiere}`
      }
    })
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
      setRenderKey(prev => prev + 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1)
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
      setRenderKey(prev => prev + 1)
    }
  }

  const toggleAnswer = useCallback((exIndex: number, qIndex: number) => {
    setRevealedAnswers(prev => {
      const newRevealed = { ...prev }
      if (!newRevealed[exIndex]) {
        newRevealed[exIndex] = {}
      }
      newRevealed[exIndex][qIndex] = !newRevealed[exIndex][qIndex]
      return newRevealed
    })
    setRenderKey(prev => prev + 1)
  }, [])

  const [originalExamData, setOriginalExamData] = useState<ExamData | null>(null)

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
        setRenderKey(prev => prev + 1)
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

  const openEpreuveFinal = openEpreuveWithData

  useEffect(() => {
    if (!epreuveId || loadingList || selectedEpreuve || epreuves.length === 0) return
    const epreuve = epreuves.find(item => item.epreuveId === epreuveId)
    if (epreuve) {
      openEpreuveFinal(epreuve)
    } else {
      setSubjectError('Épreuve non trouvée')
    }
  }, [epreuveId, loadingList, selectedEpreuve, epreuves, openEpreuveFinal])

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
  // AFFICHAGE DU SUJET SÉLECTIONNÉ
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
        {/* En-tête */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="ghost" onClick={closeEpreuve} className="shrink-0">
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

        {/* Contenu - TOUT est dans MathJaxContent */}
        <div 
          ref={contentRef}
          className="flex-1 min-h-[500px] bg-white rounded-lg shadow-md p-4 md:p-6 overflow-y-auto border border-gray-200"
        >
          {originalExamData?.exercices[currentIndex] ? (
            <div className="subject-content" key={`subject-${renderKey}`}>
              <div className="exercise-card">
                <div className="exercise-header">
                  <span className="exercise-title">
                    {originalExamData.exercices[currentIndex].titre}
                  </span>
                  <span className="exercise-points">
                    {originalExamData.exercices[currentIndex].points}
                  </span>
                </div>

                {/* Énoncé avec MathJaxContent */}
                <div className="exercise-statement">
                  <MathJaxContent
                    html={originalExamData.exercices[currentIndex].enonce}
                    key={`enonce-${currentIndex}-${renderKey}`}
                    forceRender={true}
                  />
                </div>

                {/* Questions et réponses avec MathJaxContent */}
                {originalExamData.exercices[currentIndex].questions.map((question, questionIndex) => {
                  const isRevealed = revealedAnswers[currentIndex]?.[questionIndex] || false

                  return (
                    <div
                      key={`${currentIndex}-${questionIndex}`}
                      className={`question-block ${isRevealed ? 'revealed' : ''}`}
                    >
                      {/* Question avec MathJaxContent */}
                      <div className="question-text">
                        <span className="question-label">{questionIndex + 1}.</span>
                        <MathJaxContent 
                          html={question.question}
                          key={`q-${currentIndex}-${questionIndex}-${renderKey}`}
                          forceRender={true}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className={`btn-reveal ${isRevealed ? 'revealed' : ''}`}
                        onClick={() => toggleAnswer(currentIndex, questionIndex)}
                      >
                        {isRevealed ? '🙈 Masquer' : '👁️ Voir réponse'}
                      </Button>

                      {/* Réponse avec MathJaxContent */}
                      {isRevealed && (
                        <div className="question-answer visible">
                          <MathJaxContent 
                            html={question.reponse}
                            key={`r-${currentIndex}-${questionIndex}-${renderKey}`}
                            forceRender={true}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p>Contenu non disponible</p>
          )}
        </div>

        {/* Note */}
        {currentSlide?.note && (
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm font-semibold text-blue-700 mb-1">📝 Informations :</p>
            <div className="text-sm text-blue-700">
              <MathJaxContent 
                html={currentSlide.note}
                key={`note-${currentIndex}-${renderKey}`}
                forceRender={true}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
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

        {/* Styles */}
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

          .subject-content .exercise-statement .math-content {
            display: inline;
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

          .subject-content .question-text .math-content {
            flex: 1;
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
            display: none !important;
            font-size: 0.9rem;
            color: #065f46;
            line-height: 1.6;
            transition: all 0.3s ease;
          }

          .subject-content .question-answer.visible {
            display: block !important;
            animation: fadeIn 0.3s ease;
          }

          .subject-content .question-answer .math-content {
            color: #065f46;
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

          /* Styles pour les éléments mathématiques dans les questions */
          .subject-content .math-block {
            margin: 8px 0;
            padding: 8px 12px;
            background: rgba(0,0,0,0.02);
            border-radius: 8px;
            overflow-x: auto;
          }

          .subject-content .data-table {
            margin: 8px 0;
            overflow-x: auto;
          }

          .subject-content .data-table table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
          }

          .subject-content .data-table th,
          .subject-content .data-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 12px;
            text-align: center;
          }

          .subject-content .data-table th {
            background: #f1f5f9;
            font-weight: 600;
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
                onClick={() => navigate(`/sujet/${classeId}/${matiereId}/${epreuve.epreuveId}`)}
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