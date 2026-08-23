import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export const EvaluationScreen: React.FC = () => {
  const { classes, isLoading, loadClasses, loadMatieres, loadChapitres } = useAppStore()
  const [selectedClasseId, setSelectedClasseId] = useState<string>('')
  const [selectedMatiereId, setSelectedMatiereId] = useState<string>('')
  const [selectedChapitres, setSelectedChapitres] = useState<string[]>([])

  useEffect(() => {
    if (classes.length === 0) {
      loadClasses()
    }
  }, [])

  const handleClasseChange = async (classeId: string) => {
    setSelectedClasseId(classeId)
    setSelectedMatiereId('')
    setSelectedChapitres([])
    const classe = classes.find(c => c.classeId === classeId)
    if (classe && classe.matieres.length === 0) {
      await loadMatieres(classeId)
    }
  }

  const handleMatiereChange = async (matiereId: string) => {
    setSelectedMatiereId(matiereId)
    setSelectedChapitres([])
    const classe = classes.find(c => c.classeId === selectedClasseId)
    const matiere = classe?.matieres.find(m => m.matiereId === matiereId)
    if (matiere && matiere.chapitres.length === 0) {
      await loadChapitres(selectedClasseId, matiereId)
    }
  }

  const toggleChapitre = (chapitreId: string) => {
    setSelectedChapitres(prev =>
      prev.includes(chapitreId)
        ? prev.filter(id => id !== chapitreId)
        : [...prev, chapitreId]
    )
  }

  const classe = classes.find(c => c.classeId === selectedClasseId)
  const matiere = classe?.matieres.find(m => m.matiereId === selectedMatiereId)

  if (isLoading) {
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={selectedClasseId}
            onChange={(e) => handleClasseChange(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Matière</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={selectedMatiereId}
              onChange={(e) => handleMatiereChange(e.target.value)}
            >
              <option value="">Choisir une matière...</option>
              {classe?.matieres.map((m) => (
                <option key={m.matiereId} value={m.matiereId}>
                  {m.matiereName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sélection des chapitres */}
        {selectedMatiereId && matiere && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chapitres</label>
            <div className="space-y-2">
              {matiere.chapitres.map((chapitre) => (
                <label
                  key={chapitre.chapitreId}
                  className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedChapitres.includes(chapitre.chapitreId)}
                    onChange={() => toggleChapitre(chapitre.chapitreId)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="ml-3 text-gray-700">{chapitre.chapitreName}</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {chapitre.lessons?.length || 0} leçons
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Résumé et génération */}
        {selectedChapitres.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Chapitres sélectionnés: <span className="font-semibold">{selectedChapitres.length}</span>
            </p>
            <Button className="w-full mt-4">
              Générer l'examen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}