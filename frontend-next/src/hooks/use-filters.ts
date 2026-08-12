'use client'

import { useMemo, useState } from 'react'

import type { FieldOption } from '@/components/ui/form-field'

/**
 * Un filtro declarativo. Cada uno se describe con su etiqueta y un predicado; el
 * markup y el estado los pone `FilterBar` / `useFilters` una sola vez.
 *
 * Es el mismo trato que `FormField`: la feature dice *qué* filtra, no *cómo* se pinta.
 * En la SPA original cada vista repetía su propio `clearXFilters()` y su bloque de
 * `ios-filters-grid` a mano (`templates/admin/spa/views/*.html`).
 */
export type FilterDef<TItem> = {
  key: string
  label: string
  /** Sin `options` es un campo de texto libre. */
  options?: FieldOption[]
  placeholder?: string
  /** Valor de partida, y al que vuelve "Limpiar". Por defecto, cadena vacía. */
  initial?: string
  /**
   * `true` conserva la fila.
   *
   * No se invoca cuando el filtro está en su valor inicial: ese caso significa "sin
   * filtrar" y se resuelve antes, así que el predicado nunca recibe un valor vacío.
   */
  match: (item: TItem, value: string) => boolean
  /** Ocupa todo el ancho de la rejilla. */
  full?: boolean
}

export type FiltersState<TItem> = {
  values: Record<string, string>
  setValue: (key: string, value: string) => void
  reset: () => void
  /** Los elementos que pasan todos los filtros. */
  filtered: TItem[]
  /** Hay algún filtro fuera de su valor inicial; habilita "Limpiar". */
  isDirty: boolean
}

export function useFilters<TItem>(
  items: TItem[],
  filters: FilterDef<TItem>[] = [],
): FiltersState<TItem> {
  const filterSignature = filters
    .map((filter) => `${filter.key}:${filter.initial ?? ''}`)
    .join('|')
  const initial = useMemo(
    () => Object.fromEntries(filters.map((filter) => [filter.key, filter.initial ?? ''])),
    // `filters` suele ser un literal recreado en cada render del padre; comparar por
    // claves y valores iniciales evita rehacer esto sin motivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterSignature],
  )

  const [values, setValues] = useState<Record<string, string>>(initial)

  const isDirty = filters.some(
    (filter) => (values[filter.key] ?? '') !== (filter.initial ?? ''),
  )

  const filtered = useMemo(
    () =>
      !isDirty
        ? items
        : items.filter((item) =>
            filters.every((filter) => {
              const value = values[filter.key] ?? ''
              if (value === (filter.initial ?? '')) return true
              return filter.match(item, value)
            }),
          ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, values, isDirty],
  )

  return {
    values,
    setValue: (key, value) => setValues((current) => ({ ...current, [key]: value })),
    reset: () => setValues(initial),
    filtered,
    isDirty,
  }
}

/** Predicado de búsqueda listo para usar: compara sin acentos ni mayúsculas. */
export function matchesText(haystack: (string | undefined | null)[], query: string): boolean {
  const needle = normalize(query)
  return haystack.some((piece) => normalize(piece ?? '').includes(needle))
}

/**
 * Sin acentos y en minúscula: buscar "logistica" tiene que encontrar "Logística".
 * `NFD` separa la letra de su tilde y el rango Unicode se lleva las tildes sueltas.
 */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
