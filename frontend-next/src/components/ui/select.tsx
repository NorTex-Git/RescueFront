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
  searchable = false,
  searchPlaceholder = 'Buscar…',
  buttonClassName,
  menuMinWidth,
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
  searchable?: boolean
  searchPlaceholder?: string
  buttonClassName?: string
  menuMinWidth?: number
}) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listId = `${selectId}-list`

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

    const desiredWidth = Math.max(rect.width, menuMinWidth ?? 0)
    const width = Math.min(desiredWidth, window.innerWidth - 16)

    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      top: openUp ? rect.top - gap - maxHeight : rect.bottom + gap,
      maxHeight,
    })
  }, [menuMinWidth])

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

  const allItems = placeholder === null ? options : [{ value: '', label: placeholder }, ...options]
  const normalizeSearch = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')

  const normalizedQuery = normalizeSearch(query.trim())
  const items = normalizedQuery
    ? allItems.filter((item) => normalizeSearch(item.label).includes(normalizedQuery))
    : allItems
  const selectedIndex = allItems.findIndex((item) => item.value === value)
  const current = selectedIndex >= 0 ? allItems[selectedIndex] : allItems[0]

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
    const searchOffset = searchable ? 1 : 0
    listRef.current?.children[activeIndex + searchOffset]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, searchable])

  useEffect(() => {
    if (!open || !searchable) return
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [open, searchable])

  function openList() {
    if (disabled) return
    setQuery('')
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
        setActiveIndex((index) => Math.min(index + 1, Math.max(items.length - 1, 0)))
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
        setActiveIndex(Math.max(items.length - 1, 0))
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
      <div ref={rootRef} className="relative min-w-0 max-w-full">
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
            'flex min-w-0 max-w-full items-center justify-between gap-2 text-left',
            // Sin opción elegida el texto es un marcador de posición, no un valor.
            !current?.value && 'text-gray-500 dark:text-white/40',
            buttonClassName,
          )}
        >
          <span className="min-w-0 truncate">
            {current?.shortLabel ?? current?.label ?? placeholder}
          </span>
          <Icon
            name="chevron-down"
            className={cn('shrink-0 text-xs transition-transform', open && 'rotate-180')}
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
              {searchable && (
                <li
                  role="presentation"
                  className="sticky top-0 z-10 bg-white p-1.5 dark:bg-slate-900"
                >
                  <div className="relative">
                    <Icon
                      name="search"
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400 dark:text-white/40"
                    />
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setActiveIndex(0)
                      }}
                      onKeyDown={(event) => {
                        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
                          onKeyDown(event)
                        }
                      }}
                      placeholder={searchPlaceholder}
                      aria-label={searchPlaceholder}
                      className={cn(
                        'w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm outline-none',
                        'border-black/10 bg-gray-50 text-gray-900 placeholder:text-gray-400',
                        'focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
                        'dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-white/35',
                      )}
                    />
                  </div>
                </li>
              )}
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
                      <Icon
                        name="check"
                        className="shrink-0 text-xs text-blue-600 dark:text-blue-300"
                      />
                    )}
                  </li>
                )
              })}
              {items.length === 0 && (
                <li className="px-3.5 py-6 text-center text-sm text-gray-500 dark:text-white/45">
                  No se encontraron resultados
                </li>
              )}
            </ul>,
            document.body,
          )}
      </div>
    </Field>
  )
}
