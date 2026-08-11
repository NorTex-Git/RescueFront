'use client'

import { Icon } from '@/components/ui/icon'
import { useId, useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

import { Field, fieldClass, type FieldVariant } from './input'

/**
 * Entrada de lista: se escribe un valor, se pulsa "+" (o Enter) y queda como burbuja
 * debajo, al estilo de las aptitudes de LinkedIn.
 *
 * Sustituye al campo de texto "separadas por comas" que se usaba para
 * `caracteristicas`. Aquel obligaba al usuario a conocer un formato, rompía con
 * cualquier valor que llevara coma, y dejaba el troceado repartido entre el schema y
 * `api.ts`. Aquí el valor **ya es** `string[]`, que es lo que el backend espera.
 */
export function TagsInput({
  value,
  onChange,
  label,
  error,
  hint,
  placeholder,
  disabled,
  variant = 'default',
  maxTags,
  id,
}: {
  value: string[]
  onChange: (value: string[]) => void
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  variant?: FieldVariant
  /** Si se alcanza, se bloquea la entrada en vez de dejar fallar la validación. */
  maxTags?: number
  id?: string
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [draft, setDraft] = useState('')

  const isFull = maxTags !== undefined && value.length >= maxTags

  function add() {
    const entry = draft.trim()
    // Silencioso a propósito: repetir o dejarlo vacío no es un error que reportar,
    // simplemente no añade nada.
    if (!entry || isFull || value.includes(entry)) {
      setDraft('')
      return
    }
    onChange([...value, entry])
    setDraft('')
  }

  function remove(index: number) {
    onChange(value.filter((_, position) => position !== index))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      // Sin esto, Enter enviaría el formulario del modal en vez de añadir la burbuja.
      event.preventDefault()
      add()
      return
    }
    // Retroceso con el campo vacío borra la última, como en los gestores de etiquetas.
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value.length - 1)
    }
  }

  return (
    <Field id={inputId} label={label} error={error} hint={hint} variant={variant}>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          // Al salir del campo se conserva lo escrito: perderlo en silencio sería peor.
          onBlur={add}
          disabled={disabled || isFull}
          placeholder={isFull ? `Máximo ${maxTags} alcanzado` : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={fieldClass(variant, error, 'flex-1')}
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || isFull || draft.trim() === ''}
          aria-label="Agregar"
          className={cn(
            'flex shrink-0 items-center justify-center gap-2 px-4 font-semibold transition-colors',
            variant === 'glass' ? 'rounded-2xl text-base' : 'rounded-lg text-sm',
            'bg-rescue-blue text-white hover:bg-blue-600',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <Icon className="fas fa-plus" />
          <span className="sr-only sm:not-sr-only">Agregar</span>
        </button>
      </div>

      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <li
              key={tag}
              className={cn(
                'inline-flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3.5 text-sm font-medium',
                'border border-blue-500/25 bg-blue-500/10 text-blue-700',
                'dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-100',
              )}
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label={`Quitar ${tag}`}
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs transition-colors',
                  'text-blue-700/60 hover:bg-blue-500/20 hover:text-blue-800',
                  'dark:text-blue-100/60 dark:hover:bg-blue-400/25 dark:hover:text-white',
                )}
              >
                <Icon className="fas fa-times" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}
