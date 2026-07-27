import { NextResponse } from 'next/server'

import { fetchMediaFolders } from '@/features/media/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Carpetas del servicio de imágenes.
 *
 * Ruta propia y no el proxy genérico de `/api/[...path]`, porque el servicio tiene otra
 * base (`IMAGES_SERVICE_BASE_URL`). Equivale a `/admin/image-assets/folders` del Flask
 * original (`static/js/admin/spa/views/alert-types-main.js:1422`).
 */
export async function GET() {
  // El catálogo solo se ofrece a sesiones válidas: es un servicio de terceros y no
  // conviene dejarlo abierto a través de nuestro origen.
  await requireSession()

  try {
    return NextResponse.json({ folders: await fetchMediaFolders() })
  } catch {
    return NextResponse.json(
      { folders: [], error: 'No fue posible sincronizar las carpetas, intenta nuevamente.' },
      { status: 502 },
    )
  }
}
