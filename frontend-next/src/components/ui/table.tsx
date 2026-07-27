import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Tabla genérica. Las columnas se declaran como datos para que cada vista sea
 * una lista de columnas y no 300 líneas de `innerHTML` como en el código Flask.
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
  emptyMessage = 'No hay registros para mostrar.',
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  className?: string
}) {
  return (
    // El scroll horizontal vive aquí dentro: la página nunca debe desbordarse.
    // El color lo pone `global-text-theme.css` sobre el contenedor heredado:
    // fijarlo aquí producía texto gris claro sobre tarjeta clara.
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('px-4 py-3 text-left font-semibold opacity-70', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center opacity-60">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-current/10 last:border-0 hover:bg-current/5"
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3', column.className)}>
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
