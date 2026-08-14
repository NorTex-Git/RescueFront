import type { MetadataRoute } from 'next'

const SITE_URL = 'https://rescue.com.co'

/**
 * Solo se listan URLs públicas indexables. El resto (portales admin/empresa) está tras
 * autenticación y bloqueado en robots.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
