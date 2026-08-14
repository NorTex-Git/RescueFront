import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { themeInitScript } from '@/components/theme-provider'

import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  variable: '--font-rescue',
  subsets: ['latin'],
})

const SITE_URL = 'https://rescue.com.co'
const SITE_NAME = 'RESCUE'
const SITE_DESCRIPTION =
  'RESCUE conecta alertas, equipos y canales de respuesta en tiempo real por WhatsApp y hardware. ' +
  'Plataforma de seguridad y gestión de emergencias para empresas en Colombia.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RESCUE — Alertas y respuesta en tiempo real',
    template: '%s · RESCUE',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'RESCUE',
    'Arisma',
    'plataforma de alertas',
    'alertas en tiempo real',
    'alertas por WhatsApp',
    'seguridad',
    'gestión de emergencias',
    'respuesta a emergencias',
    'botonera de emergencia',
    'monitoreo',
    'Colombia',
  ],
  authors: [{ name: 'RESCUE' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'RESCUE — Alertas y respuesta en tiempo real',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RESCUE — Alertas y respuesta en tiempo real',
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: '/RESCUE_logo_transparent.png',
    shortcut: '/RESCUE_logo_transparent.ico',
    apple: '/RESCUE_logo_transparent.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Aplica el tema antes del primer paint para evitar el flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* El script del `<head>` marca `dark` en el `<body>` antes de hidratar; sin
          esto React avisa por el desajuste, igual que en `<html>`. */}
      <body className="flex min-h-full flex-col font-rescue" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
