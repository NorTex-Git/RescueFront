import { z } from 'zod'
import { isValidPhoneNumber } from 'react-phone-number-input'

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
  telefono: z
    .string()
    .trim()
    .refine((value) => !value || isValidPhoneNumber(value), 'Ingresa un teléfono válido')
    .optional(),
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

/** Lleva registros históricos al valor E.164 que espera el control internacional. */
export function toInternationalPhoneValue(value?: string | null): string {
  const raw = value?.trim()
  if (!raw) return ''
  if (raw.startsWith('+')) return raw

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10 && digits.startsWith('3')) return `+57${digits}`
  return `+${digits}`
}

/** El backend y WhatsApp usan el E.164 sin el signo inicial. */
export function toStoredPhoneValue(value?: string): string {
  return value?.replace(/\D/g, '') ?? ''
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
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'phone',
      hint: 'Selecciona el país; el prefijo internacional se agrega automáticamente.',
    },
    {
      name: 'email',
      label: 'Correo',
      type: 'email',
      placeholder: 'correo@ejemplo.com',
      full: true,
    },
  ]
}
