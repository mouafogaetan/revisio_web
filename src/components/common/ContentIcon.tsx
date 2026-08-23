import React, { useState } from 'react'
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Library,
  File
} from 'lucide-react'

// Importer les images par défaut
import classeDefault from '@/assets/classe.png'
import matiereDefault from '@/assets/matiere.png'
import chapitreDefault from '@/assets/chapitre.png'
import lessonDefault from '@/assets/lesson.png'

export type ItemType = 'classe' | 'matiere' | 'chapitre' | 'lesson'

interface ContentIconProps {
  type: ItemType
  size?: number
  className?: string
  imageUrl?: string | null
  alt?: string
}

// Map des images par défaut
const DEFAULT_IMAGES: Record<ItemType, string> = {
  classe: classeDefault,
  matiere: matiereDefault,
  chapitre: chapitreDefault,
  lesson: lessonDefault,
}

// Map des icônes de fallback (si l'image par défaut ne charge pas)
const FALLBACK_ICONS: Record<ItemType, React.ReactNode> = {
  classe: <GraduationCap className="text-gray-400" />,
  matiere: <BookOpen className="text-gray-400" />,
  chapitre: <FileText className="text-gray-400" />,
  lesson: <Library className="text-gray-400" />,
}

export const ContentIcon: React.FC<ContentIconProps> = ({ 
  type, 
  size = 48, 
  className = '',
  imageUrl,
  alt = ''
}) => {
  const [imageError, setImageError] = useState(false)
  const [defaultImageError, setDefaultImageError] = useState(false)
  
  // Déterminer quelle image afficher
  const getImageSource = (): string | null => {
    // Si une image URL est fournie et pas d'erreur, l'utiliser
    if (imageUrl && !imageError) {
      return imageUrl
    }
    
    // Sinon, utiliser l'image par défaut du dossier assets
    if (!defaultImageError) {
      return DEFAULT_IMAGES[type]
    }
    
    // Si tout échoue, afficher l'icône
    return null
  }

  const imageSource = getImageSource()

  // Si une image est disponible
  if (imageSource) {
    return (
      <img
        src={imageSource}
        alt={alt || type}
        className={`object-cover rounded-lg ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor: '#f3f4f6' // Couleur de fond de fallback
        }}
        onError={(e) => {
          // Si c'est l'image externe qui échoue, essayer l'image par défaut
          if (imageUrl && !imageError) {
            setImageError(true)
            // Ne pas afficher d'erreur, le composant va se re-render avec l'image par défaut
          } else {
            // Si l'image par défaut échoue, afficher l'icône
            setDefaultImageError(true)
            // Masquer l'image pour afficher l'icône
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }
        }}
      />
    )
  }

  // Sinon afficher l'icône par défaut
  return (
    <div 
      className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: '#f3f4f6'
      }}
    >
      {FALLBACK_ICONS[type]}
    </div>
  )
}