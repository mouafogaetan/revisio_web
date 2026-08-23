import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isMobile: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
}

const MOBILE_BREAKPOINT = 768

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)

  const toggleSidebar = useCallback(() => {
    if (!isMobile) {
      setIsOpen(prev => !prev)
    }
  }, [isMobile])

  const closeSidebar = useCallback(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  const openSidebar = useCallback(() => {
    if (!isMobile) {
      setIsOpen(true)
    }
  }, [isMobile])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      // Sur mobile, on ferme la sidebar desktop
      if (mobile) {
        setIsOpen(false)
      } else {
        // Sur desktop, on l'ouvre par défaut
        setIsOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    // Initialisation
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isMobile,
      toggleSidebar,
      closeSidebar,
      openSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  )
}