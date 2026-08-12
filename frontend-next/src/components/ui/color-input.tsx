'use client'

import { useId } from 'react'

import { cn } from '@/lib/utils'

import { Field, fieldClass, type FieldVariant } from './input'

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * Color: muestra de color más el hex escrito.
 *
 * Las dos mitades editan lo mismo. La muestra es un `<input type="color">` nativo
 * porque su selector lo abre el usuario a propósito —no es un desplegable que se
 * despliegue solo— y reimplementar una rueda de color no aporta nada. El campo de
 * texto está porque el nativo no deja pegar un hex, que es como llega un color de
 * una guía de marca.
 */
export function ColorInput({
  value,
  onChange,
  label,
  error,
  hint,
  variant = 'glass',
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  hint?: string
  variant?: FieldVariant
  disabled?: boolean
}) {
  const inputId = useId()
  // El nativo solo acepta `#rrggbb`; con cualquier otra cosa avisa por consola y se
  // queda en negro. Se le pasa un color válido y el texto real vive en el otro campo.
  const swatch = HEX.test(value) ? value : '#000000'

  return (
    <Field id={inputId} label={label} error={error} hint={hint} variant={variant}>
      <div className="flex gap-2">
        <input
          type="color"
          value={swatch}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label ? `${label}: selector` : 'Selector de color'}
          className={cn(
            'h-[3.25rem] w-16 shrink-0 cursor-pointer rounded-2xl border p-1',
            'border-black/10 bg-white/60 dark:border-white/15 dark:bg-white/8',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <input
          id={inputId}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#ef4444"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(fieldClass(variant, error, 'flex-1'), 'font-mono')}
        />
      </div>
    </Field>
  )
}
