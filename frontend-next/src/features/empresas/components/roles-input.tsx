'use client'

import { useId, useState, type KeyboardEvent } from 'react'

import { Field, fieldClass } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import type { EmpresaRole } from '../types'

/**
 * Editor de los roles de una empresa.
 *
 * No es un `TagsInput` porque cada rol no es un texto suelto: lleva dos indicadores
 * (`is_creator`, `is_alert_manager`) que el backend valida como booleanos
 * (`models/empresa.py:validate()`). Con burbujas simples se perderían al editar.
 *
 * El backend normaliza el nombre a minúsculas y descarta duplicados
 * (`utils/role_utils.py:sanitize_roles()`), así que aquí se hace lo mismo: si no, el
 * usuario escribiría "Supervisor" y al recargar vería "supervisor".
 */
export function RolesInput({
  value,
  onChange,
  error,
  disabled,
}: {
  value: EmpresaRole[]
  onChange: (value: EmpresaRole[]) => void
  error?: string
  disabled?: boolean
}) {
  const inputId = useId()
  const [draft, setDraft] = useState('')

  function add() {
    const nombre = draft.trim().toLowerCase()
    if (!nombre || value.some((role) => role.nombre === nombre)) {
      setDraft('')
      return
    }
    onChange([...value, { nombre, is_creator: false, is_alert_manager: false }])
    setDraft('')
  }

  function toggleFlag(index: number, flag: 'is_creator' | 'is_alert_manager') {
    onChange(
      value.map((role, position) =>
        position === index ? { ...role, [flag]: !role[flag] } : role,
      ),
    )
  }

  function remove(index: number) {
    onChange(value.filter((_, position) => position !== index))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      // Si no, Enter enviaría el formulario del modal.
      event.preventDefault()
      add()
    }
  }

  return (
    <Field
      id={inputId}
      label="Roles"
      error={error}
      hint="Si lo dejas vacío, la empresa arranca con «operador» y «supervisor»."
      variant="glass"
    >
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          disabled={disabled}
          placeholder="Ej. supervisor"
          className={fieldClass('glass', error, 'flex-1')}
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || draft.trim() === ''}
          className={cn(
            'flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold',
            'bg-rescue-blue text-white transition-colors hover:bg-blue-600',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <i className="fas fa-plus" />
          <span className="sr-only sm:not-sr-only">Agregar</span>
        </button>
      </div>

      {value.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {value.map((role, index) => (
            <li
              key={role.nombre}
              className={cn(
                'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3',
                'border border-black/10 bg-white/50',
                'dark:border-white/10 dark:bg-white/5',
              )}
            >
              <span className="font-semibold text-gray-900 dark:text-white">{role.nombre}</span>

              <div className="ml-auto flex items-center gap-2">
                <FlagToggle
                  active={role.is_creator}
                  onClick={() => toggleFlag(index, 'is_creator')}
                  disabled={disabled}
                  icon="fas fa-pen-to-square"
                  label="Crea alertas"
                />
                <FlagToggle
                  active={role.is_alert_manager}
                  onClick={() => toggleFlag(index, 'is_alert_manager')}
                  disabled={disabled}
                  icon="fas fa-bell"
                  label="Gestiona alertas"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`Quitar ${role.nombre}`}
                  className="flex size-8 items-center justify-center rounded-full text-sm text-gray-400 transition-colors hover:bg-red-500/15 hover:text-red-600 dark:text-white/40 dark:hover:text-red-300"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

/** Interruptor de un indicador del rol. `aria-pressed` porque es un conmutador. */
function FlagToggle({
  active,
  onClick,
  disabled,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  icon: string
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border border-blue-500/30 bg-blue-500/15 text-blue-700 dark:border-blue-400/35 dark:bg-blue-400/20 dark:text-blue-100'
          : 'border border-black/10 bg-white/40 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <i className={icon} />
      {label}
    </button>
  )
}
