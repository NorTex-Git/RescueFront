import { NextResponse } from 'next/server'

import { fetchMediaFolders, uploadMediaFile } from '@/features/media/server'
import { uploadFileSchema } from '@/features/media/schema'
import { requireSession } from '@/lib/auth/session'

/**
 * Sube un archivo a una carpeta. Equivale a `admin_upload_image_file` (`app.py:1034`).
 *
 * Recibe `multipart/form-data` (no JSON): el binario no cabe en un cuerpo JSON, así que
 * el cliente manda un `FormData` y aquí se lee con `request.formData()`.
 */
export async function POST(request: Request) {
  await requireSession()

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'La solicitud no es válida.' }, { status: 400 })
  }

  const parsed = uploadFileSchema.safeParse({
    folder: form.get('folder'),
    filename: form.get('filename'),
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Los datos del archivo no son válidos.' },
      { status: 400 },
    )
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'Selecciona un archivo válido para cargar.' },
      { status: 400 },
    )
  }

  try {
    await uploadMediaFile(parsed.data.folder, parsed.data.filename, file)
    return NextResponse.json({ folders: await fetchMediaFolders() }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No fue posible cargar el archivo.' },
      { status: 502 },
    )
  }
}
