import { z } from 'zod'

/** Compartido entre el formulario del cliente y la Server Action. */
export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'Por favor ingresa tu usuario'),
  password: z.string().min(1, 'Por favor ingresa tu contraseña'),
})

export type LoginInput = z.infer<typeof loginSchema>
