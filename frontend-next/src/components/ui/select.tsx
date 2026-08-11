'use client'

import { Icon } from '@/components/ui/icon'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

import type { FieldOption } from './form-field'
import { Field, fieldClass, type FieldVariant } from './input'

/**
 * Desplegable propio, sin `<select>` nativo.
 *
 * Motivo: la lista de un `<select>` la dibuja el sistema en una ventana aparte, con su
 * superficie por defecto, y solo después aplica el color de las `option`. En tema
 * oscuro eso se ve como un parpadeo blanco de un fotograma al abrir, y no hay CSS de
 * la página que lo evite —`color-scheme` y `option { background }` llegan tarde—.
 * Pintando la lista nosotros, sale del color correcto desde el primer fotograma.
 *
 * A cambio hay que reimplementar lo que el nativo daba gratis; está cubierto:
 * navegación con flechas, Inicio/Fin, Enter/Espacio, Escape, cierre al pulsar fuera,
 * al perder el foco, y roles ARIA de `combobox`/`listbox`.
 */
export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Selecciona…',
  error,
  hint,
  variant = 'glass',
  disabled,
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: FieldOption[]
  label?: string
  /** Opción vacía inicial. `null` para no ofrecerla. */
  placeholder?: string | null
  error?: string
  hint?: string
  variant?: FieldVariant
  disabled?: boolean
  id?: string
}) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listId = `${selectId}-list`

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  /**
   * Posición de la lista en coordenadas de viewport.
   *
   * La lista se pinta en un portal al `<body>` y no junto al botón: los contenedores
   * que la rodean la recortaban o la hacían ocupar sitio —`ios-filters-container`
   * lleva `overflow: hidden`, y el cuerpo del modal `overflow-y: auto`—. Fuera de
   * ellos no hay nada que la recorte ni que se desplace por su culpa.
   */
  const [position, setPosition] = useState<{
    left: number
    top: number
    width: number
    maxHeight: number
  } | null>(null)

  const measure = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const gap = 8
    const below = window.innerHeight - rect.bottom - gap
    const above = rect.top - gap
    // Si abajo no caben ni 10rem, se abre hacia arriba.
    const openUp = below < 160 && above > below
    const maxHeight = Math.min(256, openUp ? above : below)

    setPosition({
      left: rect.left,
      width: rect.width,
      top: openUp ? rect.top - gap - maxHeight : rect.bottom + gap,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (open) measure()
  }, [open, measure])

  // Al ir en coordenadas de viewport, cualquier desplazamiento la desalinea. `true`
  // para capturar también el scroll de los contenedores internos, no solo el de la página.
  useEffect(() => {
    if (!open) return

    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open, measure])

  const items = placeholder === null ? options : [{ value: '', label: placeholder }, ...options]
  const selectedIndex = items.findIndex((item) => item.value === value)
  const current = selectedIndex >= 0 ? items[selectedIndex] : items[0]

  // Cierre al pulsar fuera. En `pointerdown` y no en `click` para que se cierre antes
  // de que el elemento de debajo reciba el evento.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      // La lista vive en un portal, fuera de `rootRef`: sin comprobarla también, al
      // pulsar una opción se cerraría en `pointerdown` y el `click` nunca llegaría a
      // registrar la elección.
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // La opción activa siempre visible al navegar con el teclado.
  useEffect(() => {
    if (!open) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function openList() {
    if (disabled) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function pick(index: number) {
    const item = items[index]
    if (!item) return
    onChange(item.value)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openList()
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, items.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(items.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        pick(activeIndex)
        break
      case 'Tab':
        // Tab sale del control: cerrar sin elegir, como el nativo.
        setOpen(false)
        break
    }
  }

  return (
    <Field id={selectId} label={label} error={error} hint={hint} variant={variant}>
      <div ref={rootRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={selectId}
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className={cn(
            fieldClass(variant, error),
            'flex items-center justify-between gap-2 text-left',
            // Sin opción elegida el texto es un marcador de posición, no un valor.
            !current?.value && 'text-gray-500 dark:text-white/40',
          )}
        >
          <span className="truncate">{current?.label ?? placeholder}</span>
          <Icon
            className={cn(
              'fas fa-chevron-down shrink-0 text-xs transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open &&
          position &&
          createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-activedescendant={`${selectId}-option-${activeIndex}`}
              tabIndex={-1}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className={cn(
                'fixed z-[10001] overflow-y-auto rounded-2xl p-1.5',
                'border shadow-xl',
                // Opaco a propósito: es lo que evita el parpadeo del nativo.
                'border-black/10 bg-white text-gray-900',
                'dark:border-white/15 dark:bg-slate-900 dark:text-white',
              )}
            >
              {items.map((item, index) => {
                const isSelected = item.value === value
                return (
                  <li
                    key={item.value || '__placeholder'}
                    id={`${selectId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    // `onMouseDown` con `preventDefault` para que el botón no pierda el
                    // foco antes de que se registre la elección.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm',
                      index === activeIndex && 'bg-blue-500/15 dark:bg-blue-400/20',
                      isSelected && 'font-semibold',
                      !item.value && 'text-gray-500 dark:text-white/40',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && item.value && (
                      <Icon className="fas fa-check shrink-0 text-xs text-blue-600 dark:text-blue-300" />
                    )}
                  </li>
                )
              })}
            </ul>,
            document.body,
          )}
      </div>
    </Field>
  )
}
