'use client'

import { cn } from '@/lib/utils'

/**
 * Paginación del pie de tabla (diseño `admin-shell-v2.pen`): rango a la izquierda,
 * flechas + números a la derecha. Sin dependencias; el rango de páginas se recorta a
 * una ventana alrededor de la actual para no crecer sin límite.
 */
function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const arrow =
    'flex size-8 items-center justify-center rounded-lg border border-[var(--shell-border)] text-[var(--shell-text)] transition-colors hover:bg-[var(--shell-bg)] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--shell-border-soft)] px-5 py-3">
      <p className="text-xs text-[var(--shell-text-muted)]">
        Mostrando {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={arrow}
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <i className="fas fa-chevron-left text-xs" />
        </button>
        {pageWindow(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-[var(--shell-text-muted)]">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-[image:var(--shell-accent-grad)] text-white'
                  : 'border border-[var(--shell-border)] text-[var(--shell-text)] hover:bg-[var(--shell-bg)]',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={arrow}
          aria-label="Página siguiente"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <i className="fas fa-chevron-right text-xs" />
        </button>
      </div>
    </div>
  )
}
