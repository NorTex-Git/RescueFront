'use client'

import type { ReactNode } from 'react'

import type { FilterDef, FiltersState } from '@/hooks/use-filters'

import { Button } from './button'
import { Input } from './input'
import { Select } from './select'

/**
 * Barra de filtros reutilizable: buscador, selects y el botón de limpiar.
 *
 * Es tonta a propósito: el estado y el filtrado viven en `useFilters`, así que sirve
 * igual dentro de `CrudView` que en cualquier pantalla que no sea un CRUD.
 *
 * El reparto es `flex-wrap` y no una rejilla de columnas fijas. Con la rejilla, tres
 * filtros llenaban la primera fila y "Limpiar" se caía solo a una segunda, dejando
 * media franja vacía. Así los controles fluyen y el botón se queda al final de la
 * última fila, que es lo que hacía el original con `auto-fit` + `align-items: end`
 * (`styles/spa/ios-filters.css:29`).
 */
export function FilterBar<TItem>({
  filters,
  state,
  /**
   * Control propio de la pantalla que va antes de los filtros —el selector de empresa
   * del portal admin, por ejemplo—. Va aquí y no en su propia franja: era un
   * contenedor entero con `padding: 1.5rem` para un solo `select`.
   */
  leading,
}: {
  filters: FilterDef<TItem>[]
  state: FiltersState<TItem>
  leading?: ReactNode
}) {
  if (filters.length === 0 && !leading) return null

  return (
    <div className="ios-filters-container ios-blur-bg mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {leading && <div className="min-w-56 flex-1">{leading}</div>}

        {filters.map((filter) => {
          const value = state.values[filter.key] ?? ''
          const onChange = (next: string) => state.setValue(filter.key, next)

          return (
            <div
              key={filter.key}
              // `basis-48` marca el ancho al que se parte la fila; `flex-1` reparte
              // el sobrante para que no queden huecos al final.
              className={filter.full ? 'w-full' : 'min-w-48 flex-1 basis-48'}
            >
              {/*
               * Variante `glass`, la misma que en los modales: antes los filtros
               * usaban `default` y los formularios `glass`, así que dos selects de
               * la misma pantalla no se parecían.
               */}
              {filter.options ? (
                <Select
                  label={filter.label}
                  value={value}
                  onChange={onChange}
                  options={filter.options}
                  // Las opciones de un filtro ya incluyen su propio "Todos".
                  placeholder={null}
                />
              ) : (
                <Input
                  variant="glass"
                  type="search"
                  label={filter.label}
                  value={value}
                  placeholder={filter.placeholder}
                  onChange={(event) => onChange(event.target.value)}
                />
              )}
            </div>
          )
        })}

        {filters.length > 0 && (
          <Button
            variant="secondary"
            onClick={state.reset}
            // Deshabilitado si no hay nada que limpiar: así el botón informa de si
            // queda algún filtro puesto, que es la duda habitual al ver pocos datos.
            disabled={!state.isDirty}
            className="shrink-0"
          >
            <i className="fas fa-filter-circle-xmark" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
