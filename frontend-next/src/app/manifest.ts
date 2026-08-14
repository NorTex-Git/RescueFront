import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RESCUE — Alertas y respuesta en tiempo real',
    short_name: 'RESCUE',
    description:
      'Plataforma de alertas, seguridad y respuesta a emergencias en tiempo real por WhatsApp y hardware.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f19',
    theme_color: '#0b0f19',
    icons: [
      { src: '/RESCUE_logo_transparent.png', sizes: 'any', type: 'image/png' },
    ],
  }
}
