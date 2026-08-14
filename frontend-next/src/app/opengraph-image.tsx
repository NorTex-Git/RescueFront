import { ImageResponse } from 'next/og'

// Imagen que se muestra al compartir el link (WhatsApp, redes, buscadores).
export const alt = 'RESCUE — Alertas y respuesta en tiempo real'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b0f19 0%, #111a2e 60%, #1e293b 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -6 }}>RESCUE</div>
        <div style={{ fontSize: 46, color: '#93c5fd', marginTop: 8 }}>
          Alertas y respuesta en tiempo real
        </div>
        <div style={{ fontSize: 28, color: '#94a3b8', marginTop: 28 }}>
          WhatsApp · hardware · seguridad · Colombia
        </div>
      </div>
    ),
    { ...size },
  )
}
