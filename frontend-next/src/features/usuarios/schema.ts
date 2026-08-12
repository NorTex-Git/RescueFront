import { z } from 'zod'

import type { FormField } from '@/components/ui/form-field'

/**
 * Espeja las validaciones de `RescueBack/models/usuario.py:validate()`, para que el
 * usuario vea el error al escribir y no después de un viaje al servidor.
 *
 * El backend sigue validando: esto es conveniencia, no la barrera de seguridad.
 */
export const usuarioFormSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  cedula: z
    .string()
    .trim()
    .min(1, 'La cédula es obligatoria')
    .regex(/^\d+$/, 'La cédula debe contener solo números')
    .refine((value) => value.length >= 6 && value.length <= 15, 'Debe tener entre 6 y 15 dígitos'),
  // El rol no tiene lista fija: sale de los tipos de alerta de la empresa.
  rol: z.string().trim().min(1, 'El rol es obligatorio'),
  sede: z
    .string()
    .trim()
    .min(1, 'La sede es obligatoria')
    .max(100, 'La sede no puede exceder 100 caracteres'),
  telefono: z.string().trim().optional(),
  email: z.union([z.literal(''), z.email('Correo inválido')]).optional(),
})

export type UsuarioFormValues = z.infer<typeof usuarioFormSchema>
export type UsuarioFormOptions = { roles: string[]; sedes: string[] }

export const USUARIO_FORM_DEFAULTS: UsuarioFormValues = {
  nombre: '',
  cedula: '',
  rol: '',
  sede: '',
  telefono: '',
  email: '',
}

/**
 * Campos del formulario. `roles` viene de la empresa, por eso es una función y no
 * una constante.
 */
export function usuarioFields(
  roles: string[],
  sedes: string[],
): FormField<keyof UsuarioFormValues & string>[] {
  return [
    { name: 'nombre', label: 'Nombre', placeholder: 'Nombre completo' },
    { name: 'cedula', label: 'Cédula', placeholder: 'Solo números' },
    {
      name: 'rol',
      label: 'Rol',
      type: 'select',
      options: roles.map((rol) => ({ value: rol, label: rol })),
    },
    {
      name: 'sede',
      label: 'Sede',
      type: 'select',
      placeholder: 'Selecciona una sede',
      options: sedes.map((sede) => ({ value: sede, label: sede })),
    },
    { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: 'Contacto directo' },
    {
      name: 'email',
      label: 'Correo',
      type: 'email',
      placeholder: 'correo@ejemplo.com',
      full: true,
    },
  ]
}
