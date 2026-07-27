import { z } from 'zod'

/**
 * Forma de un usuario según `RescueBack/models/usuario.py`.
 *
 * Los campos opcionales lo son de verdad: el modelo los deja en `None` y varios
 * registros antiguos no los traen.
 */
export const usuarioSchema = z.object({
  _id: z.string(),
  nombre: z.string().default(''),
  cedula: z.union([z.string(), z.number()]).transform(String).default(''),
  rol: z.string().default(''),
  empresa_id: z.string().optional(),
  sede: z.string().nullish(),
  telefono: z.union([z.string(), z.number()]).transform(String).nullish(),
  email: z.string().nullish(),
  activo: z.boolean().default(true),
  fecha_creacion: z.string().nullish(),
})

export type Usuario = z.infer<typeof usuarioSchema>

/** Listado: `{ success, data: [...], count }`. */
export const usuariosListSchema = z.object({
  success: z.boolean(),
  data: z.array(usuarioSchema).default([]),
  count: z.number().optional(),
})
