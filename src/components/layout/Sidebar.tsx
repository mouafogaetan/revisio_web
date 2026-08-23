import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BookOpen,
  Book, 
  Newspaper, 
  Phone, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'

const navigation = [
  { name: 'Révision', icon: BookOpen, path: '/' },
  { name: 'Évaluation', icon: Book, path: '/evaluation' },
  { name: 'Actu', icon: Newspaper, path: '/actu' },
  { name: 'Contact', icon: Phone, path: '/contact' },
]

export const Sidebar: React.FC = () => {
  const { isOpen, toggleSidebar, isMobile } = useSidebar()
  const location = useLocation()
  // Par défaut, la sidebar n'est PAS collapsed sur desktop
  const [collapsed, setCollapsed] = useState(false)

  // Sur mobile, la sidebar est toujours en mode "collapsed" (bottom tabs)
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    } else {
      // Sur desktop, on initialise avec collapsed = false
      setCollapsed(false)
    }
  }, [isMobile])

  // Classes pour la sidebar
  const sidebarClasses = cn(
    "bg-white border-r border-gray-200 transition-all duration-300",
    isMobile 
      ? "fixed bottom-0 left-0 right-0 z-40 border-t border-r-0 h-auto min-h-0" 
      : "sticky top-16 min-h-[calc(100vh-4rem)]",
    isMobile ? "px-0" : "",
    !isMobile && !isOpen && "w-0 overflow-hidden border-r-0",
    isMobile && "block"
  )

  // Sur mobile, on affiche les bottom tabs
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around px-2 py-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex flex-col items-center py-1 px-2 text-xs transition-colors rounded-lg",
                  isActive
                    ? "text-primary"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6",
                  isActive ? "text-primary" : "text-gray-400"
                )} />
                <span className={cn(
                  "mt-0.5 text-[10px]",
                  isActive ? "text-primary font-medium" : "text-gray-400"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="w-32 h-1 bg-gray-300 rounded-full mx-auto mb-1.5" />
      </nav>
    )
  }

  // Version desktop - avec icône ET texte
  return (
    <aside className={sidebarClasses}>
      {isOpen && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-gray-400"
                    )} />
                    {/* Le texte est toujours visible sur desktop */}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="border-t border-gray-200 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="ml-2 text-xs text-gray-500">
                {collapsed ? 'Déplier' : 'Réduire'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}