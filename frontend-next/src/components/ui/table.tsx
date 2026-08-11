import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Tabla genérica (diseño `admin-shell-v2.pen` → tablas de las vistas de gestión).
 *
 * Las columnas se declaran como datos para que cada vista sea una lista de columnas y
 * no 300 líneas de `innerHTML` como en el Flask original. Estilo con tokens `--shell-*`:
 * cabecera en versalitas tenues, filas con divisor suave y badge de índice opcional.
 */

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  emptyMessage = 'No hay registros para mostrar.',
  emptyState,
  showIndex = false,
  indexOffset = 0,
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Estilo contextual calculado por el recurso. */
  rowClassName?: (row: T) => string | undefined
  emptyMessage?: string
  /** Estado vacío enriquecido (icono + textos + acciones). Gana a `emptyMessage`. */
  emptyState?: ReactNode
  /** Prepende un badge de índice por fila, como en el mockup. */
  showIndex?: boolean
  /** Desplazamiento del índice (para paginación). */
  indexOffset?: number
  className?: string
}) {
  const totalCols = columns.length + (showIndex ? 1 : 0)

  return (
    // El scroll horizontal vive aquí dentro: la página nunca debe desbordarse.
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--shell-border-soft)]">
            {showIndex && <th scope="col" className="w-12 px-4 py-3" />}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-[var(--shell-text-muted)] uppercase',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="px-4 py-12">
                {emptyState ?? (
                  <p className="text-center text-sm text-[var(--shell-text-muted)]">
                    {emptyMessage}
                  </p>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'border-b border-[var(--shell-border-soft)] transition-colors last:border-0 hover:bg-[var(--shell-bg)]',
                  rowClassName?.(row),
                )}
              >
                {showIndex && (
                  <td className="px-4 py-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--shell-accent-soft)] text-xs font-semibold text-[var(--shell-accent)]">
                      {String(indexOffset + index + 1).padStart(2, '0')}
                    </span>
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-[var(--shell-text)]', column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
