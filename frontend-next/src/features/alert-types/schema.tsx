import { z } from 'zod'

import type { FieldOption, FormField } from '@/components/ui/form-field'
import { AssetPicker } from '@/features/media/components/asset-picker'
import type { MediaCatalog } from '@/features/media/normalize'

/** Espeja `RescueBack/models/tipo_alarma.py:validate()`. */
export const alertTypeFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .trim()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tipo_alerta: z.string().min(1, 'El tipo de alerta es obligatorio'),
  color_alerta: z.string().trim().min(1, 'El color de alerta es obligatorio'),
  imagen_base64: z
    .string()
    .trim()
    .min(1, 'La imagen es obligatoria')
    .max(2048, 'La imagen no puede exceder 2048 caracteres'),
  sonido_link: z.string().trim().min(1, 'El sonido es obligatorio'),
  recomendaciones: z.array(z.string().trim().min(1)),
  implementos_necesarios: z.array(z.string().trim().min(1)),
  /** Vacío = alerta global, disponible para todas las empresas. */
  empresa_id: z.string(),
})

export type AlertTypeFormValues = z.infer<typeof alertTypeFormSchema>

export const ALERT_TYPE_DEFAULTS: AlertTypeFormValues = {
  nombre: '',
  descripcion: '',
  tipo_alerta: '',
  color_alerta: '#ef4444',
  imagen_base64: '',
  sonido_link: '',
  recomendaciones: [],
  implementos_necesarios: [],
  empresa_id: '',
}

/**
 * `niveles` son los valores de `TIPOS_ALERTA`, que los sirve el propio backend en
 * `/api/tipos-alarma/tipos-alerta`. No se escriben aquí para que añadir un nivel no
 * exija tocar el frontend.
 */
export function alertTypeFields(
  niveles: FieldOption[],
  empresas: FieldOption[],
  mediaCatalog: MediaCatalog,
): FormField<keyof AlertTypeFormValues & string>[] {
  return [
    { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Incendio' },
    // "Nivel de alerta", como en el original (`alert_types.html:231`).
    { name: 'tipo_alerta', label: 'Nivel de alerta', type: 'select', options: niveles },
    {
      name: 'empresa_id',
      label: 'Empresa',
      type: 'select',
      // La opción vacía es la alerta global, no un "sin elegir": por eso lleva
      // etiqueta propia y el select no ofrece marcador de posición.
      options: [{ value: '', label: 'Global (todas las empresas)' }, ...empresas],
      hint: 'Global la deja disponible para todas.',
    },
    { name: 'color_alerta', label: 'Color', type: 'color' },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Cuándo se dispara esta alarma',
      hint: 'Mínimo 5 caracteres.',
      full: true,
    },
    /*
     * Imagen y sonido no se escriben a mano: se eligen del servicio de imágenes, con
     * el par carpeta → archivo del formulario original. Lo que se guarda es la URL.
     */
    {
      name: 'imagen_base64',
      label: 'Imagen',
      hint: 'Obligatoria. Se elige del catálogo de multimedia.',
      render: ({ value, onChange, error, disabled }) => (
        <AssetPicker
          kind="image"
          catalog={mediaCatalog}
          label="Imagen *"
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          error={error}
          hint="Obligatoria. Se elige del catálogo de multimedia."
          disabled={disabled}
        />
      ),
    },
    {
      name: 'sonido_link',
      label: 'Sonido',
      render: ({ value, onChange, error, disabled }) => (
        <AssetPicker
          kind="sound"
          catalog={mediaCatalog}
          label="Sonido *"
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          error={error}
          hint="Obligatorio. Suena al dispararse la alerta."
          disabled={disabled}
        />
      ),
    },
    {
      name: 'recomendaciones',
      label: 'Recomendaciones',
      type: 'tags',
      placeholder: 'Ej. Evacuar por la salida norte',
      hint: 'Escribe una y pulsa Agregar o Enter.',
      full: true,
    },
    {
      name: 'implementos_necesarios',
      label: 'Implementos necesarios',
      type: 'tags',
      placeholder: 'Ej. Extintor',
      full: true,
    },
  ]
}
