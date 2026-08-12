import type { Metadata } from 'next'

import { LandingPage } from '@/features/landing/components/landing-page'
import '@/features/landing/landing.css'

export const metadata: Metadata = {
  // Carácter invisible: la pestaña muestra únicamente el favicon, sin texto ni URL.
  title: '\u200B',
  description: 'Plataforma para conectar alertas, equipos y canales de respuesta en tiempo real.',
}

export default function Home() {
  return <LandingPage year={new Date().getUTCFullYear()} />
}
