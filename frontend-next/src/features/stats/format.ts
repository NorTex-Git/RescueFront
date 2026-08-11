/**
 * Formatos que en Jinja eran filtros de plantilla y hay que reimplementar.
 */

/** Equivalente de `{{ tipo|title }}`. */
export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Equivalente de `{{ fecha[:19].replace('T', ' ') }}`.
 * Se corta la cadena en vez de usar `Date`: así se muestra el instante tal cual lo
 * mandó el backend, sin que el huso horario del navegador lo desplace.
 */
export function formatTimestamp(value: string | null): string {
  if (!value) return 'Sin registros'
  return value.slice(0, 19).replace('T', ' ')
}

/** Equivalente de `{{ fecha[:10] }}`. */
export function formatDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : 'Sin fecha'
}

/** "hace 4 min" / "hace 2 h" / "hace 3 d" — calculado a partir de la fecha real. */
export function timeAgo(value: string | null | undefined): string {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''

  const minutes = Math.round((Date.now() - then) / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}
