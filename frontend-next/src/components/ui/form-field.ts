/**
 * Definición declarativa de un campo de formulario.
 *
 * La idea: cada feature describe *qué* campos tiene, no *cómo* se pintan. El markup,
 * los estados de error, el foco y el envío los pone `FormModal` una sola vez. Así es
 * como los 6.523 líneas de `*-modals.js` se reducen a listas de campos.
 */
export type FieldOption = { value: string; label: string }

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'phone'
  | 'password'
  | 'number'
  | 'select'
  | 'textarea'
  /** Lista de valores que el usuario va añadiendo; el valor del campo es `string[]`. */
  | 'tags'
  /** Muestra de color + hex; el valor es la cadena `#rrggbb`. */
  | 'color'

export type FormField<TName extends string = string> = {
  name: TName
  label: string
  type?: FieldType
  placeholder?: string
  /** Opciones cuando `type: 'select'`. */
  options?: FieldOption[]
  /** Texto de ayuda bajo el campo. */
  hint?: string
  /** Ocupa las dos columnas de la rejilla. */
  full?: boolean
  /** Tope de elementos cuando `type: 'tags'`. */
  maxTags?: number
  autoComplete?: string
  disabled?: boolean

  /**
   * Control a medida, para valores que no encajan en ningún tipo de arriba.
   *
   * Existe para no arrastrar tipos de dominio hasta `components/ui`: el editor de
   * roles de empresa, por ejemplo, maneja `{nombre, is_creator, is_alert_manager}[]`,
   * que no tiene por qué conocer un componente genérico. `FormModal` lo cablea con
   * `Controller` igual que los demás campos controlados.
   *
   * Al usarlo, el archivo de campos pasa a ser `.tsx`.
   */
  render?: (props: {
    value: unknown
    onChange: (value: unknown) => void
    error?: string
    disabled?: boolean
  }) => React.ReactNode
}
