import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2, BookOpen, CheckSquare, Square } from 'lucide-react'
import { generateExamQuizForLessons, ExamLessonSelection } from '@/services/api'
import { Quiz } from '@/types/classeTypes'

export const QuizExamScreen: React.FC = () => {
  const navigate = useNavigate()
  const { classes, isLoading, loadClasses, loadMatieres, loadChapitres, loadLessons } = useAppStore()
  
  const [selectedClasseId, setSelectedClasseId] = useState<string>('')
  const [selectedMatiereId, setSelectedMatiereId] = useState<string>('')
  const [selectedChapitreIds, setSelectedChapitreIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Charger les classes si nécessaire
  useEffect(() => {
    if (classes.length === 0 && !isLoading) {
      loadClasses()
    }
  }, [])

  const selectedClasse = classes.find(c => c.classeId === selectedClasseId)
  const selectedMatiere = selectedClasse?.matieres.find(m => m.matiereId === selectedMatiereId)
  const selectedChapitres = selectedMatiere?.chapitres.filter(c => selectedChapitreIds.includes(c.chapitreId)) || []
  const selectedLessonCount = selectedChapitres.reduce((count, ch) => count + (ch.lessons?.length || 0), 0)

  const handleClasseChange = async (classeId: string) => {
    setSelectedClasseId(classeId)
    setSelectedMatiereId('')
    setSelectedChapitreIds([])
    
    if (!classeId) return
    
    const classe = classes.find(c => c.classeId === classeId)
    if (classe && (!classe.matieres || classe.matieres.length === 0)) {
      setLoading(true)
      await loadMatieres(classeId)
      setLoading(false)
    }
  }

  const handleMatiereChange = async (matiereId: string) => {
    setSelectedMatiereId(matiereId)
    setSelectedChapitreIds([])
    
    if (!matiereId || !selectedClasseId) return
    
    const matiere = selectedClasse?.matieres.find(m => m.matiereId === matiereId)
    if (matiere && (!matiere.chapitres || matiere.chapitres.length === 0)) {
      setLoading(true)
      await loadChapitres(selectedClasseId, matiereId)
      setLoading(false)
    }
  }

  const handleChapitreToggle = async (chapitreId: string) => {
    setSelectedChapitreIds(prev => {
      const isSelected = prev.includes(chapitreId)
      const newSelection = isSelected 
        ? prev.filter(id => id !== chapitreId)
        : [...prev, chapitreId]
      
      // Charger les leçons si nécessaire
      if (!isSelected && selectedMatiere) {
        const chapitre = selectedMatiere.chapitres.find(c => c.chapitreId === chapitreId)
        if (chapitre && (!chapitre.lessons || chapitre.lessons.length === 0)) {
          loadLessons(selectedClasseId, selectedMatiereId, chapitreId)
        }
      }
      
      return newSelection
    })
  }

  const handleGenerateExam = async () => {
    if (!selectedClasse || !selectedMatiere || selectedChapitres.length === 0) {
      alert('Veuillez sélectionner une classe, une matière et au moins un chapitre.')
      return
    }

    if (selectedLessonCount === 0) {
      alert('Les chapitres sélectionnés ne contiennent aucune leçon.')
      return
    }

    const lessonsSelection: ExamLessonSelection[] = selectedChapitres.flatMap(chapitre =>
      chapitre.lessons.map(lesson => ({
        chapitreId: chapitre.chapitreId,
        lessonId: lesson.lessonId,
        lessonName: lesson.lessonName
      }))
    )

    setGenerating(true)
    try {
      const quiz = await generateExamQuizForLessons(
        selectedClasse.classeId,
        selectedMatiere.matiereId,
        lessonsSelection,
        selectedMatiere.matiereName,
        5
      )

      if (quiz) {
        navigate('/quiz', { state: { quiz } })
      } else {
        alert('Impossible de générer l\'examen. Réessayez plus tard.')
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'examen:', error)
      alert('Une erreur s\'est produite lors de la génération de l\'examen.')
    } finally {
      setGenerating(false)
    }
  }

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Examen personnalisé</h2>

      <div className="space-y-6 max-w-2xl">
        {/* Sélection de la classe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Classe
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            value={selectedClasseId}
            onChange={(e) => handleClasseChange(e.target.value)}
            disabled={loading}
          >
            <option value="">Choisir une classe...</option>
            {classes.map((c) => (
              <option key={c.classeId} value={c.classeId}>
                {c.classeName}
              </option>
            ))}
          </select>
        </div>

        {/* Sélection de la matière */}
        {selectedClasseId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matière
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              value={selectedMatiereId}
              onChange={(e) => handleMatiereChange(e.target.value)}
              disabled={loading || selectedClasse?.matieres?.length === 0}
            >
              <option value="">Choisir une matière...</option>
              {selectedClasse?.matieres.map((m) => (
                <option key={m.matiereId} value={m.matiereId}>
                  {m.matiereName}
                </option>
              ))}
            </select>
            {selectedClasse?.matieres?.length === 0 && !loading && (
              <p className="text-sm text-gray-500 mt-1">Chargement des matières...</p>
            )}
          </div>
        )}

        {/* Sélection des chapitres */}
        {selectedMatiereId && selectedMatiere && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapitres
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-500">Chargement des chapitres...</span>
              </div>
            ) : selectedMatiere.chapitres.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun chapitre disponible</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedMatiere.chapitres.map((chapitre) => {
                  const isSelected = selectedChapitreIds.includes(chapitre.chapitreId)
                  const hasLessons = chapitre.lessons && chapitre.lessons.length > 0
                  
                  return (
                    <div
                      key={chapitre.chapitreId}
                      onClick={() => handleChapitreToggle(chapitre.chapitreId)}
                      className={`
                        flex items-center p-3 bg-white border rounded-lg cursor-pointer transition-all
                        ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                        ${!hasLessons && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="mr-3">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700">
                          Chapitre {chapitre.index + 1}: {chapitre.chapitreName}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {chapitre.lessons?.length || 0} leçons
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Résumé */}
        {selectedChapitres.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Chapitres sélectionnés : <span className="font-semibold text-gray-800">{selectedChapitres.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Leçons totales : <span className="font-semibold text-gray-800">{selectedLessonCount}</span>
                </p>
              </div>
              <Button 
                onClick={handleGenerateExam}
                disabled={generating || selectedLessonCount === 0}
                className="min-w-[180px]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Générer l'examen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Message si aucun chapitre sélectionné */}
        {selectedMatiereId && selectedMatiere && selectedMatiere.chapitres.length > 0 && selectedChapitres.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500">Sélectionnez au moins un chapitre pour générer l'examen</p>
          </div>
        )}
      </div>
    </div>
  )
}