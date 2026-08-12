import { z } from 'zod'

/** Forma según `RescueBack/models/tipo_empresa.py`. */
export const companyTypeSchema = z.object({
  _id: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().nullish(),
  caracteristicas: z.array(z.string()).default([]),
  activo: z.boolean().default(true),
  fecha_creacion: z.string().nullish(),
})

export type CompanyType = z.infer<typeof companyTypeSchema>

export const companyTypesListSchema = z.object({
  success: z.boolean(),
  data: z.array(companyTypeSchema).default([]),
  count: z.number().optional(),
})
