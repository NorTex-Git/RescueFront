import { z } from 'zod'

import type { FormField } from '@/components/ui/form-field'

/** Espeja `RescueBack/models/tipo_empresa.py:validate()`. */
export const companyTypeFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  descripcion: z
    .string()
    .trim()
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .optional(),
  /**
   * Array, igual que lo espera el backend. Antes era texto separado por comas y se
   * troceaba en `api.ts`: eso obligaba al usuario a conocer el formato y hacía
   * imposible una característica que llevara una coma.
   */
  caracteristicas: z
    .array(z.string().trim().min(1).max(100, 'Cada característica no puede exceder 100 caracteres'))
    .max(20, 'No se pueden tener más de 20 características'),
})

export type CompanyTypeFormValues = z.infer<typeof companyTypeFormSchema>

export const COMPANY_TYPE_DEFAULTS: CompanyTypeFormValues = {
  nombre: '',
  descripcion: '',
  caracteristicas: [],
}

export const companyTypeFields: FormField<keyof CompanyTypeFormValues & string>[] = [
  { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Constructora', full: true },
  {
    name: 'descripcion',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Para qué sirve este tipo de empresa',
    full: true,
  },
  {
    name: 'caracteristicas',
    label: 'Características',
    type: 'tags',
    placeholder: 'Ej. obra civil',
    hint: 'Escribe una y pulsa Agregar o Enter. Máximo 20, de hasta 100 caracteres cada una.',
    maxTags: 20,
    full: true,
  },
]
