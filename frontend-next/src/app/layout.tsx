import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { themeInitScript } from '@/components/theme-provider'

import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  variable: '--font-rescue',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'RESCUE',
  description: 'Plataforma de gestión y alertas RESCUE',
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
