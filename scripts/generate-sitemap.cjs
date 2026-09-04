#!/usr/bin/env node
const fs = require('fs').promises
const path = require('path')

const DATA_SOURCE_URL = process.env.VITE_API_URL || 'https://mouafogaetan.github.io/revisio_data'
const SITE_URL = process.env.SITE_URL || 'https://revisio-web.vercel.app'

const today = () => new Date().toISOString().split('T')[0]

const writeSitemap = async (urls) => {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  const footer = '</urlset>'
  const body = urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')
  const xml = `${header}${body}\n${footer}`
  const outPath = path.join(process.cwd(), 'public', 'sitemap.xml')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, xml, 'utf8')
  console.log(`Wrote sitemap to ${outPath}`)
}

const fetchJson = async (url) => {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

;(async () => {
  try {
    const urls = []
    const todayStr = today()

    // Static pages
    const staticPages = [
      { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${SITE_URL}/actu`, changefreq: 'daily', priority: '0.7' },
      { loc: `${SITE_URL}/evaluation`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.5' },
    ]
    for (const p of staticPages) urls.push({ ...p, lastmod: todayStr })

    const classes = await fetchJson(`${DATA_SOURCE_URL}/data/classes.json`)
    if (!classes) {
      console.error('Could not fetch classes.json')
      return
    }

    for (const classe of classes) {
      const matieres = await fetchJson(`${DATA_SOURCE_URL}/data/${classe.id}/matieres.json`) || []

      // Liste des matières de la classe
      urls.push({ loc: `${SITE_URL}/matiere/${classe.id}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.8' })

      for (const matiere of matieres) {
        const chapitres = await fetchJson(`${DATA_SOURCE_URL}/data/${classe.id}/${matiere.id}/chapitres.json`) || []

        // Liste des chapitres de la matière
        urls.push({ loc: `${SITE_URL}/chapitre/${classe.id}/${matiere.id}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.7' })

        for (const chapitre of chapitres) {
          // Liste des leçons du chapitre
          urls.push({ loc: `${SITE_URL}/lesson/${classe.id}/${matiere.id}/${chapitre.id}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.6' })

          const lessons = await fetchJson(`${DATA_SOURCE_URL}/data/${classe.id}/${matiere.id}/${chapitre.id}/lessons.json`) || []
          for (const lesson of lessons) {
            const lessonId = lesson.lessonId || lesson.id
            if (!lessonId) continue
            const base = `${SITE_URL}/lesson/${classe.id}/${matiere.id}/${chapitre.id}/${lessonId}`

            // Page de présentation de la leçon
            urls.push({ loc: base, lastmod: todayStr, changefreq: 'weekly', priority: '0.9' })

            // Cours, vidéos et exercices de la leçon
            urls.push({ loc: `${SITE_URL}/cours-doc/${classe.id}/${matiere.id}/${chapitre.id}/${lessonId}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.8' })
            urls.push({ loc: `${SITE_URL}/cours-video/${classe.id}/${matiere.id}/${chapitre.id}/${lessonId}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.7' })
            urls.push({ loc: `${SITE_URL}/exercice-doc/${classe.id}/${matiere.id}/${chapitre.id}/${lessonId}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.7' })
            urls.push({ loc: `${SITE_URL}/exercice-video/${classe.id}/${matiere.id}/${chapitre.id}/${lessonId}`, lastmod: todayStr, changefreq: 'weekly', priority: '0.6' })
          }
        }
      }
    }

    await writeSitemap(urls)
  } catch (err) {
    console.error('Error generating sitemap:', err)
  }
})()
