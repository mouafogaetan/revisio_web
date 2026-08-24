import { useEffect } from 'react'

type MetaOptions = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
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
    if (opts.title) document.title = opts.title

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = opts.url || (typeof window !== 'undefined' ? window.location.href : origin)

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

    set('description', opts.description)
    set('twitter:card', 'summary_large_image')
    set('twitter:title', opts.title)
    set('twitter:description', opts.description)

    setTag('meta[property="og:title"]', 'content', opts.title || '')
    setTag('meta[property="og:description"]', 'content', opts.description || '')
    setTag('meta[property="og:type"]', 'content', opts.type || 'website')
    setTag('meta[property="og:url"]', 'content', url)
    if (opts.image) setTag('meta[property="og:image"]', 'content', opts.image)

    // canonical
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', url)

    return () => {
      document.title = prevTitle
    }
  }, [opts.title, opts.description, opts.image, opts.url, opts.type])
}

export default useMeta
