import { NextResponse } from 'next/server'

import { fetchMediaFiles } from '@/features/media/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Archivos de una carpeta, ya normalizados (ver `features/media/normalize.ts`).
 *
 * Equivale a `/admin/image-assets/folders/<folder>/files` del Flask original.
 */
export async function GET(_request: Request, context: RouteContext<'/api/media/folders/[folder]/files'>) {
  await requireSession()

  // En Next 16 los `params` de ruta son asíncronos.
  const { folder } = await context.params

  try {
    return NextResponse.json({ files: await fetchMediaFiles(folder) })
  } catch {
    return NextResponse.json(
      { files: [], error: 'No fue posible obtener los archivos de la carpeta seleccionada.' },
      { status: 502 },
    )
  }
}
