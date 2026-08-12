/** Error de API compartido por el fetch de servidor y el de cliente. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Saca el mensaje de error de una respuesta del backend.
 *
 * El backend usa `errors` como **array** (`{"success":false,"errors":["Credenciales
 * inválidas"]}`), no el `message` que suponía el código Flask. Se contemplan ambos
 * porque no todos los endpoints responden igual.
 */
export function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== 'object' || payload === null) return fallback

  const { message, errors, error } = payload as {
    message?: unknown
    errors?: unknown
    error?: unknown
  }

  if (typeof message === 'string' && message) return message
  if (typeof error === 'string' && error) return error

  if (Array.isArray(errors)) {
    const joined = errors.filter((item) => typeof item === 'string').join(', ')
    if (joined) return joined
  }
  // Algunos endpoints devuelven `errors` como objeto de validación campo→mensaje.
  if (typeof errors === 'object' && errors !== null) {
    const joined = Object.values(errors)
      .flat()
      .filter((item): item is string => typeof item === 'string')
      .join(', ')
    if (joined) return joined
  }

  return fallback
}
