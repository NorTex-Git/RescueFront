import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

/**
 * Campos de formulario con dos aspectos:
 *
 * - `glass`: el de los modales, sobre el panel oscuro esmerilado. En utilidades de
 *   Tailwind, no con la clase heredada `ios-blur-input`: esa la mutila el optimizador
 *   de CSS (ver `modal.tsx`).
 * - `default`: para formularios embebidos en una página.
 */
export type FieldVariant = 'default' | 'glass'

const FIELD_STYLES =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ' +
  'placeholder:text-gray-400 focus:border-rescue-blue focus:ring-1 focus:ring-rescue-blue focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-gray-100 ' +
  'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-900'

const GLASS_STYLES =
  'w-full rounded-2xl px-5 py-3.5 text-base transition-colors ' +
  // Claro: vidrio blanco sobre el panel translúcido.
  'border border-black/10 bg-white/60 text-gray-900 placeholder:text-gray-500 ' +
  // Oscuro: el mismo vidrio, invertido.
  'dark:border-white/15 dark:bg-white/8 dark:text-white dark:placeholder:text-white/35 ' +
  'focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/25 focus:outline-none ' +
  'dark:focus:border-blue-400/60 dark:focus:bg-white/12 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const LABEL_STYLES: Record<FieldVariant, string> = {
  glass: 'mb-2 block text-sm font-semibold text-gray-700 dark:text-white/85',
  default: 'text-sm font-medium text-gray-700 dark:text-gray-200',
}

export function fieldClass(variant: FieldVariant, error: string | undefined, className?: string) {
  if (variant === 'glass') return cn(GLASS_STYLES, error && '!border-red-400/70', className)
  return cn(FIELD_STYLES, error && 'border-rescue-red', className)
}

/** Etiqueta + error/ayuda. Exportado para que `TagsInput` no lo reimplemente. */
export function Field({
  id,
  label,
  error,
  hint,
  variant,
  children,
}: {
  id: string
  label?: string
  error?: string
  hint?: string
  variant: FieldVariant
  children: ReactNode
}) {
  return (
    <div className={variant === 'glass' ? '' : 'flex flex-col gap-1.5'}>
      {label && (
        <label htmlFor={id} className={LABEL_STYLES[variant]}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className={cn(
            'mt-1.5 text-xs',
            variant === 'glass'
              ? 'text-red-600 dark:text-red-300'
              : 'text-red-600 dark:text-red-400',
          )}
        >
          {error}
        </p>
      ) : (
        hint && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              variant === 'glass'
                ? 'text-gray-600 dark:text-white/50'
                : 'text-gray-600 dark:text-gray-400',
            )}
          >
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type Common = { label?: string; error?: string; hint?: string; variant?: FieldVariant }

export function Input({
  label,
  error,
  hint,
  variant = 'default',
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & Common) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field id={inputId} label={label} error={error} hint={hint} variant={variant}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={fieldClass(variant, error, className)}
        {...props}
      />
    </Field>
  )
}

export function Textarea({
  label,
  error,
  hint,
  variant = 'default',
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Common) {
  const generatedId = useId()
  const areaId = id ?? generatedId

  return (
    <Field id={areaId} label={label} error={error} hint={hint} variant={variant}>
      <textarea
        id={areaId}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${areaId}-error` : undefined}
        className={fieldClass(variant, error, className)}
        {...props}
      />
    </Field>
  )
}

/*
 * Aquí había un `Select` sobre `<select>` nativo. Se retiró: la lista del nativo la
 * dibuja el sistema y parpadeaba en blanco al abrirse en tema oscuro. El sustituto,
 * con la lista pintada por nosotros, está en `components/ui/select.tsx`.
 */
