import type { MetadataRoute } from 'next'

const SITE_URL = 'https://rescue.com.co'

/**
 * Directivas para los crawlers. Se indexa la landing pública; se bloquean las áreas
 * autenticadas y la API para que no aparezcan en buscadores.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/empresa', '/login', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
