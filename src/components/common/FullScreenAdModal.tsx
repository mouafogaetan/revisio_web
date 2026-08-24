import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AdManager } from './AdManager'

interface FullScreenAdModalProps {
  visible: boolean
  onClose: () => void
  durationMs?: number
  title?: string
}

export const FullScreenAdModal: React.FC<FullScreenAdModalProps> = ({
  visible,
  onClose,
  durationMs = 180000,
  title = 'Publicité'
}) => {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!visible) {
      setProgress(0)
      setIsComplete(false)
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min((elapsed / durationMs) * 100, 100)
      setProgress(nextProgress)

      if (nextProgress >= 100) {
        setIsComplete(true)
        window.clearInterval(interval)
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [visible, durationMs])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">{title}</p>
            <h3 className="text-lg font-bold text-gray-800">Publicité sponsorisée</h3>
          </div>

          {isComplete && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              aria-label="Fermer la publicité"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mb-4 text-center text-sm text-gray-600">
          {isComplete
            ? 'La publicité est terminée. Vous pouvez la fermer.'
            : 'Cette publicité se ferme automatiquement lorsque le temps est écoulé.'}
        </p>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <AdManager type="banner" position="inline" delay={0} showLabel={false} className="w-full" />
        </div>

        {!isComplete && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Temps restant : {Math.max(0, Math.ceil((durationMs - progress * durationMs / 100) / 1000))}s
          </div>
        )}
      </div>
    </div>
  )
}
