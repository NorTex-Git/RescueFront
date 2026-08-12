import { NextResponse } from 'next/server'

import { deleteMediaFolder, fetchMediaFolders } from '@/features/media/server'
import { FOLDER_SLUG_PATTERN } from '@/features/media/schema'
import { requireSession } from '@/lib/auth/session'

/**
 * Elimina un directorio del servicio de imágenes. Equivale a
 * `admin_delete_image_folder` (`app.py:1148`).
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ folder: string }> }) {
  await requireSession()

  // En Next 16 los `params` de ruta son asíncronos. Firma explícita, sin depender de
  // los tipos generados en `.next/types` (ver la ruta de `files`).
  const { folder } = await params

  if (!FOLDER_SLUG_PATTERN.test(folder)) {
    return NextResponse.json({ error: 'El nombre del directorio no es válido.' }, { status: 400 })
  }

  try {
    await deleteMediaFolder(folder)
    return NextResponse.json({ folders: await fetchMediaFolders() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No fue posible eliminar el directorio.' },
      { status: 502 },
    )
  }
}
