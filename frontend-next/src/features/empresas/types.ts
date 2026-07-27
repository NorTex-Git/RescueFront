import { z } from 'zod'

/**
 * Un rol de empresa: `{ nombre, is_creator, is_alert_manager }`.
 *
 * `RescueBack/utils/role_utils.py:sanitize_roles()` acepta también cadenas sueltas y
 * las convierte, así que hay registros antiguos con roles en ambas formas. Aquí se
 * normalizan a objeto para que el resto del código no tenga que distinguir.
 */
export const empresaRoleSchema = z.union([
  z.string().transform((nombre) => ({ nombre, is_creator: false, is_alert_manager: false })),
  z.object({
    nombre: z.string().default(''),
    is_creator: z.boolean().default(false),
    is_alert_manager: z.boolean().default(false),
  }),
])

export type EmpresaRole = z.infer<typeof empresaRoleSchema>

/**
 * Forma de una empresa según `RescueBack/models/empresa.py:to_json()`.
 *
 * Ojo: el campo de estado es **`activa`**, en femenino, no `activo` como en el resto
 * de recursos. `password_hash` no se expone.
 */
export const empresaSchema = z.object({
  _id: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().nullish(),
  ubicacion: z.string().nullish(),
  username: z.string().nullish(),
  email: z.string().nullish(),
  sedes: z.array(z.string()).default([]),
  roles: z.array(empresaRoleSchema).default([]),
  tipo_empresa_id: z.string().nullish(),
  creado_por: z.string().nullish(),
  last_login: z.string().nullish(),
  fecha_creacion: z.string().nullish(),
  activa: z.boolean().default(true),
})

export type Empresa = z.infer<typeof empresaSchema>

export const empresasListSchema = z.object({
  success: z.boolean(),
  data: z.array(empresaSchema).default([]),
  count: z.number().optional(),
})
