import { z } from 'zod'

export const contactSchema = z.object({
  firstName: z.string().trim().min(2, 'Escribe tu nombre').max(80),
  lastName: z.string().trim().min(2, 'Escribe tu apellido').max(80),
  email: z.string().trim().email('Escribe un correo válido').max(160),
  company: z.string().trim().min(2, 'Escribe el nombre de la empresa').max(140),
  phone: z.string().trim().max(30),
  projectType: z.string().min(1, 'Selecciona un tipo de proyecto'),
  message: z.string().trim().max(2000),
  privacy: z.literal(true, { error: 'Debes aceptar el tratamiento de datos' }),
})

export type ContactFormValues = z.infer<typeof contactSchema>
