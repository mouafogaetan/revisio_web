import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  size?: number
  className?: string
  onClick?: () => void
}

export const Icon: React.FC<IconProps> = ({ 
  icon: IconComponent, 
  size = 24, 
  className = '', 
  onClick 
}) => {
  return (
    <IconComponent 
      size={size} 
      className={className} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  )
}