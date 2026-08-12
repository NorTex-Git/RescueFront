'use client'

import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import type { LoadErrorInfo } from '@/load-result'

export function LoadErrorState({
  error,
  onRetry,
  compact = false,
  message,
}: {
  error: LoadErrorInfo
  onRetry: () => void
  compact?: boolean
  message?: string
}) {
  const login = () => {
    const next = `${window.location.pathname}${window.location.search}`
    window.location.assign(`/login?next=${encodeURIComponent(next)}`)
  }

  if (compact) {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100"
      >
        <span>
          <Icon name="triangle-exclamation" className="mr-2" />
          {message ?? 'No se pudo actualizar la información. Se conservan los últimos datos disponibles.'}
        </span>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-300/50 bg-[var(--shell-surface)] px-6 py-10 text-center dark:border-red-400/25"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-xl text-red-600 dark:text-red-300">
        <Icon name="cloud-arrow-down" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[var(--shell-text-strong)]">
        No se pudo cargar la información
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--shell-text-muted)]">{error.message}</p>
      <div className="mt-5 flex justify-center">
        <Button onClick={error.kind === 'auth' ? login : onRetry}>
          <Icon name={error.kind === 'auth' ? 'right-to-bracket' : 'rotate-right'} />
          {error.kind === 'auth' ? 'Iniciar sesión' : 'Reintentar'}
        </Button>
      </div>
    </div>
  )
}
