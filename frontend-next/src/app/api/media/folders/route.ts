import { NextResponse } from 'next/server'

import { createMediaFolder, fetchMediaFolders } from '@/features/media/server'
import { createFolderSchema } from '@/features/media/schema'
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

/**
 * Crea un directorio. Equivale a `admin_create_image_folder` (`app.py:1121`).
 *
 * Valida el nombre en el servidor —no solo en el formulario—: la ruta es alcanzable por
 * sí sola y el servicio externo no debe recibir slugs con caracteres extraños.
 */
export async function POST(request: Request) {
  await requireSession()

  const parsed = createFolderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'El nombre del directorio no es válido.' },
      { status: 400 },
    )
  }

  try {
    await createMediaFolder(parsed.data.name)
    // Tras invalidar la caché, la lectura vuelve fresca: se devuelven las carpetas ya
    // actualizadas, como hacía el original.
    return NextResponse.json({ folders: await fetchMediaFolders() }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No fue posible crear el directorio.' },
      { status: 502 },
    )
  }
}
