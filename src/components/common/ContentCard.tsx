import React from 'react'
import { ContentIcon, ItemType } from './ContentIcon'
import { cn } from '@/lib/utils'

interface ContentCardProps {
  id: string
  title: string
  subtitle?: string
  count?: number
  countLabel?: string
  iconType: ItemType
  imageUrl?: string | null
  onClick: (id: string) => void
  className?: string
  isLoading?: boolean
}

export const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  subtitle,
  count,
  countLabel = 'élément(s)',
  iconType,
  imageUrl,
  onClick,
  className,
  isLoading = false
}) => {
  // Ne pas afficher le compteur si l'élément est en cours de chargement
  const showCount = !isLoading && count !== undefined && count !== null && count !== 0
  const countValue = isLoading ? '...' : count

  return (
    <div
      onClick={() => onClick(id)}
      className={cn(
        "cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] p-4 border border-gray-200",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {/* Icône ou image */}
        <ContentIcon
          type={iconType}
          size={56}
          imageUrl={imageUrl}
          alt={title}
          className="flex-shrink-0"
        />

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
          {showCount && (
            <p className="text-xs text-gray-400 mt-1">
              {countValue} {countLabel}
            </p>
          )}
        </div>

        {/* Flèche */}
        <div className="flex-shrink-0 text-gray-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}