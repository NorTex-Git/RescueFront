import { NextResponse } from 'next/server'

import { fetchMediaFiles } from '@/features/media/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Archivos de una carpeta, ya normalizados (ver `features/media/normalize.ts`).
 *
 * Equivale a `/admin/image-assets/folders/<folder>/files` del Flask original.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ folder: string }> }) {
  await requireSession()

  // En Next 16 los `params` de ruta son asíncronos. Firma explícita en vez de
  // `RouteContext<...>`: esta última depende de los tipos generados en `.next/types`,
  // que no siempre incluyen las rutas anidadas y rompían el typecheck de esta ruta.
  const { folder } = await params

  try {
    return NextResponse.json({ files: await fetchMediaFiles(folder) })
  } catch (error) {
    // Se propaga el mensaje real del servicio: sin él, un fallo del microservicio se veía
    // igual que una carpeta vacía y no había forma de distinguirlos.
    return NextResponse.json(
      {
        files: [],
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible obtener los archivos de la carpeta seleccionada.',
      },
      { status: 502 },
    )
  }
}
