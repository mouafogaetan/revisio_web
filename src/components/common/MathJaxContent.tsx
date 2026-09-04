import React, { useEffect, useRef, useState } from 'react'

interface MathJaxContentProps {
  html: string
  className?: string
  inline?: boolean
  forceRender?: boolean
}

export const MathJaxContent: React.FC<MathJaxContentProps> = ({ 
  html, 
  className = '',
  inline = false,
  forceRender = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderAttempts, setRenderAttempts] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const maxAttempts = 5
  const isRenderedRef = useRef(false)

  // Nettoyer le HTML pour MathJax
  const cleanHtml = (content: string): string => {
    if (!content) return ''
    
    let cleaned = content
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<div>\s*<\/div>/g, '')
    
    return cleaned
  }

  const renderMath = async () => {
    if (!containerRef.current) return

    const mathJax = window.MathJax

    // Attendre que MathJax soit disponible
    const waitForMathJax = (): Promise<void> => {
      return new Promise((resolve) => {
        if (mathJax) {
          resolve()
        } else {
          const interval = setInterval(() => {
            const latestMathJax = window.MathJax
            if (latestMathJax) {
              clearInterval(interval)
              resolve()
            }
          }, 100)
        }
      })
    }

    try {
      await waitForMathJax()

      const readyMathJax = window.MathJax
      if (!containerRef.current || !readyMathJax) return

      // Restaurer le HTML source avant de relancer MathJax après une modale.
      containerRef.current.innerHTML = cleanHtml(html)

      // Marquer le conteneur
      containerRef.current.classList.add('math-content')

      // Réinitialiser le suivi MathJax avant de rendre le HTML courant.
      readyMathJax.typesetClear?.([containerRef.current])
      await readyMathJax.typesetPromise?.([containerRef.current])

      isRenderedRef.current = true

    } catch (error) {
      console.warn('MathJax render error:', error)
      if (renderAttempts < maxAttempts) {
        setTimeout(() => {
          setRenderAttempts(prev => prev + 1)
        }, 500)
      }
    }
  }

  useEffect(() => {
    isRenderedRef.current = false
    const timeoutId = setTimeout(renderMath, 50)
    return () => {
      clearTimeout(timeoutId)
      // Nettoyer les rendus MathJax
      if (containerRef.current && window.MathJax) {
        try {
          // On ne peut pas vraiment "annuler" le rendu, mais on peut marquer comme non rendu
          isRenderedRef.current = false
        } catch (e) {
          // Ignorer
        }
      }
    }
  }, [html, forceRender, refreshKey, renderAttempts])

  useEffect(() => {
    const refreshMathJax = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('mathjax:refresh', refreshMathJax)

    return () => window.removeEventListener('mathjax:refresh', refreshMathJax)
  }, [])

  if (!html) return null

  const cleanedContent = cleanHtml(html)

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className} ${inline ? 'inline-block' : 'block'}`}
      style={{ display: inline ? 'inline-block' : 'block' }}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
  )
}