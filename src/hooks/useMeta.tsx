import { useEffect } from 'react'

type MetaOptions = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  noindex?: boolean // Ajout de l'option noindex
}

const setTag = (selector: string, attr: string, value: string) => {
  if (!value) return
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    const isProp = selector.startsWith('meta[property')
    if (isProp) {
      const prop = selector.match(/property="(.+)"/)?.[1]
      if (prop) el.setAttribute('property', prop)
    } else {
      const name = selector.match(/meta\[name="(.+)"\]/)?.[1]
      if (name) el.setAttribute('name', name)
    }
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export const useMeta = (opts: MetaOptions) => {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const prevTitle = document.title
    
    // Mettre à jour le titre
    if (opts.title) document.title = opts.title

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    
    // --- NOUVEAU : Générer l'URL canonique à partir du pathname ---
    // Utilisez le pathname pour construire l'URL canonique
    // Cela évite les paramètres de tracking (?utm_source, etc.)
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const canonicalUrl = opts.url || (origin + pathname)
    // --- FIN NOUVEAU ---

    // Fonction utilitaire pour définir les métadonnées
    const set = (name: string, value?: string) => {
      if (!value) return
      let m = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', name)
        document.head.appendChild(m)
      }
      m.setAttribute('content', value)
    }

    // --- NOUVEAU : Gestion de la balise noindex ---
    // Supprimer l'ancienne balise robots si elle existe
    const oldRobots = document.head.querySelector('meta[name="robots"]')
    if (oldRobots) {
      oldRobots.remove()
    }

    // Ajouter la nouvelle balise robots si noindex est true
    if (opts.noindex) {
      const robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      robots.setAttribute('content', 'noindex, nofollow')
      document.head.appendChild(robots)
    }
    // --- FIN NOUVEAU ---

    // Métadonnées standard
    set('description', opts.description)
    set('twitter:card', 'summary_large_image')
    set('twitter:title', opts.title)
    set('twitter:description', opts.description)

    // Métadonnées Open Graph
    setTag('meta[property="og:title"]', 'content', opts.title || '')
    setTag('meta[property="og:description"]', 'content', opts.description || '')
    setTag('meta[property="og:type"]', 'content', opts.type || 'website')
    setTag('meta[property="og:url"]', 'content', canonicalUrl) // Utiliser l'URL canonique
    if (opts.image) setTag('meta[property="og:image"]', 'content', opts.image)

    // --- NOUVEAU : Mettre à jour la balise canonical ---
    // Supprimer l'ancienne balise canonical si elle existe
    const oldCanonical = document.head.querySelector('link[rel="canonical"]')
    if (oldCanonical) {
      oldCanonical.remove()
    }

    // Créer la nouvelle balise canonical
    const link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', canonicalUrl)
    document.head.appendChild(link)
    // --- FIN NOUVEAU ---

    // Cleanup : restaurer le titre précédent et nettoyer les métadonnées
    return () => {
      document.title = prevTitle
      
      // Optionnel : Nettoyer les métadonnées ajoutées
      // Mais généralement on les laisse car elles seront écrasées par la prochaine page
    }
  }, [opts.title, opts.description, opts.image, opts.url, opts.type, opts.noindex])
}

export default useMeta