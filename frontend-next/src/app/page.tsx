import type { Metadata } from 'next'

import { LandingPage } from '@/features/landing/components/landing-page'
import '@/features/landing/landing.css'

const SITE_URL = 'https://rescue.com.co'
const LANDING_TITLE = 'RESCUE — Plataforma de alertas y respuesta en tiempo real'
const LANDING_DESCRIPTION =
  'RESCUE conecta alertas, equipos y canales de respuesta en tiempo real por WhatsApp y hardware. ' +
  'Seguridad y gestión de emergencias para empresas en Colombia.'

export const metadata: Metadata = {
  // `absolute` evita el sufijo de plantilla del layout (la marca ya va en el título).
  title: { absolute: LANDING_TITLE },
  description: LANDING_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
  },
}

// Datos estructurados para que los buscadores entiendan la marca y el producto.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'RESCUE',
      url: SITE_URL,
      logo: `${SITE_URL}/RESCUE_logo_transparent.png`,
      description: LANDING_DESCRIPTION,
      areaServed: { '@type': 'Country', name: 'Colombia' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'RESCUE',
      inLanguage: 'es-CO',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RESCUE',
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: LANDING_DESCRIPTION,
      offers: { '@type': 'Offer', category: 'SaaS' },
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage year={new Date().getUTCFullYear()} />
    </>
  )
}
