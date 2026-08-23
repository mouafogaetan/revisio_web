import React, { useEffect, useRef, useState } from 'react'

interface MathJaxContentProps {
  html: string
  className?: string
  inline?: boolean
  key?: string | number
  forceRender?: boolean
}

export const MathJaxContent: React.FC<MathJaxContentProps> = ({ 
  html, 
  className = '',
  inline = false,
  key,
  forceRender = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderAttempts, setRenderAttempts] = useState(0)
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

      // Marquer le conteneur
      containerRef.current.classList.add('math-content')

      // Forcer le rendu
      await readyMathJax.typesetPromise?.([containerRef.current])

      // Traiter les éléments enfants avec des expressions
      const elementsWithMath = containerRef.current.querySelectorAll(
        'p, li, td, th, span, div'
      )

      for (const el of elementsWithMath) {
        const html = el.innerHTML
        if (html && (html.includes('$') || html.includes('\\(') || html.includes('\\[') || html.includes('$$'))) {
          try {
            await readyMathJax.typesetPromise?.([el])
          } catch (e) {
            // Ignorer les erreurs individuelles
          }
        }
      }

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
  }, [html, key, forceRender, renderAttempts])

  // Re-rendre quand le composant est visible
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (containerRef.current && !isRenderedRef.current) {
        renderMath()
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
      })
    }

    return () => observer.disconnect()
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