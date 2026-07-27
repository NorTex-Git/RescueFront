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
