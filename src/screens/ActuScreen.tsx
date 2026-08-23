import React, { useEffect, useState } from 'react'
import { getActu } from '@/services/api'
import { Actu } from '@/types/classeTypes'
import { Loader2 } from 'lucide-react'

export const ActuScreen: React.FC = () => {
  const [actus, setActus] = useState<Actu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActus = async () => {
      try {
        setLoading(true)
        const data = await getActu()
        const sorted = data.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setActus(sorted)
      } catch (err) {
        setError('Impossible de charger les actualités')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadActus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Chargement des actualités...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Actualités</h2>
      <div className="space-y-4">
        {actus.map((actu) => (
          <div key={actu.actuId} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">{actu.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{actu.date}</p>
            <p className="text-gray-700 mt-3">{actu.content}</p>
          </div>
        ))}
      </div>
      {actus.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">Aucune actualité disponible</p>
        </div>
      )}
    </div>
  )
}