import { z } from 'zod'

import type { FieldOption, FormField } from '@/components/ui/form-field'

import { RolesInput } from './components/roles-input'
import type { EmpresaRole } from './types'

/**
 * Espeja `RescueBack/models/empresa.py:validate()`, límites incluidos. Los mensajes
 * son los mismos que devolvería el backend, para que validar en cliente no cambie el
 * texto que ve el usuario.
 */
const roleSchema = z.object({
  nombre: z.string().trim().min(1),
  is_creator: z.boolean(),
  is_alert_manager: z.boolean(),
})

const baseFields = {
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  ubicacion: z
    .string()
    .trim()
    .min(3, 'La ubicación debe tener al menos 3 caracteres')
    .max(200, 'La ubicación no puede exceder 200 caracteres'),
  username: z.string().trim().min(1, 'El nombre de usuario es obligatorio'),
  email: z.string().trim().min(1, 'El correo es obligatorio').email('El correo debe ser válido'),
  tipo_empresa_id: z.string().optional(),
  sedes: z.array(z.string().trim().min(1)),
  roles: z.array(roleSchema),
}

/**
 * Edición: la contraseña en blanco significa "conservar la actual"
 * (`services/empresa_service.py:221`).
 */
export const empresaFormSchema = z.object({
  ...baseFields,
  password: z.string(),
})

/** Alta: aquí la contraseña sí es obligatoria (`empresa_service.py:56`). */
export const empresaCreateSchema = z.object({
  ...baseFields,
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type EmpresaFormValues = z.infer<typeof empresaFormSchema>

export const EMPRESA_FORM_DEFAULTS: EmpresaFormValues = {
  nombre: '',
  descripcion: '',
  ubicacion: '',
  username: '',
  email: '',
  password: '',
  tipo_empresa_id: '',
  sedes: [],
  roles: [],
}

/** `tipos` son los tipos de empresa activos; se cargan en el Server Component. */
export function empresaFields(
  tipos: FieldOption[],
): FormField<keyof EmpresaFormValues & string>[] {
  return [
    { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Constructora Andina' },
    {
      name: 'tipo_empresa_id',
      label: 'Tipo de empresa',
      type: 'select',
      options: tipos,
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'A qué se dedica la empresa',
      hint: 'Mínimo 10 caracteres.',
      full: true,
    },
    { name: 'ubicacion', label: 'Ubicación', placeholder: 'Ciudad, país', full: true },

    { name: 'username', label: 'Usuario de acceso', autoComplete: 'off' },
    {
      name: 'password',
      label: 'Contraseña',
      type: 'password',
      autoComplete: 'new-password',
      hint: 'Obligatoria al crear. Al editar, déjala vacía para conservar la actual.',
    },
    { name: 'email', label: 'Correo', type: 'email', full: true },

    {
      name: 'sedes',
      label: 'Sedes',
      type: 'tags',
      placeholder: 'Ej. Planta norte',
      hint: 'Escribe una y pulsa Agregar o Enter.',
      full: true,
    },
    {
      name: 'roles',
      label: 'Roles',
      full: true,
      // Control a medida: cada rol lleva dos indicadores, no es un texto suelto.
      render: ({ value, onChange, error, disabled }) => (
        <RolesInput
          value={(value as EmpresaRole[] | undefined) ?? []}
          onChange={(next) => onChange(next)}
          error={error}
          disabled={disabled}
        />
      ),
    },
  ]
}
