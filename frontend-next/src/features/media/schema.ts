import { z } from 'zod'

/**
 * Validación compartida entre el formulario (cliente) y las rutas API (servidor), para
 * que ambos lados rechacen lo mismo. Porta los patrones del Flask original
 * (`app.py:58-59`): un slug de carpeta y un nombre base de archivo, ambos solo con
 * letras, números, guion y guion bajo.
 */
export const FOLDER_SLUG_PATTERN = /^[\w-]{1,50}$/
export const FILE_BASENAME_PATTERN = /^[\w-]{1,120}$/

const SLUG_MESSAGE = 'Solo se admiten letras, números, guion o guion bajo (máx. 50).'
const BASENAME_MESSAGE = 'Solo se admiten letras, números, guion o guion bajo (máx. 120).'

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del directorio es obligatorio.')
    .regex(FOLDER_SLUG_PATTERN, SLUG_MESSAGE),
})

export type CreateFolderValues = z.infer<typeof createFolderSchema>

/**
 * El archivo en sí no lo valida Zod (vive fuera del formulario de react-hook-form): la
 * carpeta destino y el nombre base sí.
 */
export const uploadFileSchema = z.object({
  folder: z.string().trim().min(1, 'Selecciona una carpeta destino.'),
  filename: z
    .string()
    .trim()
    .min(1, 'El nombre del archivo es obligatorio.')
    .regex(FILE_BASENAME_PATTERN, BASENAME_MESSAGE),
})

export type UploadFileValues = z.infer<typeof uploadFileSchema>
