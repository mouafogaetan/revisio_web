import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'
import { AdManager } from '@/components/common/AdManager'

// Composant interne pour gérer le padding
const LayoutContent: React.FC = () => {
  const { isMobile } = useSidebar()
  const location = useLocation()

  // Scroll en haut lors du changement de page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          isMobile ? "pb-24" : "pb-6"
        )}>
          {/* Bannière en haut de chaque page */}
          <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-2">
              <AdManager type="banner" position="top" delay={1500} showLabel={false} />
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="container mx-auto px-4 py-4 md:py-6">
            <Outlet />
          </div>
          
          {/* Bannière en bas de chaque page */}
          <div className="container mx-auto px-4 mt-4">
            <AdManager type="banner" position="bottom" delay={2000} />
          </div>
        </main>
      </div>
    </div>
  )
}

// Wrapper avec le provider
export const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}