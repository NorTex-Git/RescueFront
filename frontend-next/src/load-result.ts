import { ApiError } from '@/lib/api/errors'

export type LoadErrorKind = 'auth' | 'permission' | 'contract' | 'network' | 'server' | 'unknown'

export type LoadErrorInfo = {
  kind: LoadErrorKind
  message: string
  status?: number
  resource?: string
}

export type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LoadErrorInfo }

export function toLoadError(error: unknown, resource?: string): LoadErrorInfo {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        kind: 'auth', status: error.status, resource,
        message: 'Tu sesión venció. Vuelve a iniciar sesión para continuar.',
      }
    }
    if (error.status === 403) {
      return {
        kind: 'permission', status: error.status, resource,
        message: 'No tienes permisos para consultar esta información.',
      }
    }
    return {
      kind: error.status >= 500 ? 'server' : 'unknown',
      status: error.status,
      resource,
      message: error.message,
    }
  }

  if (error instanceof Error && error.name === 'ZodError') {
    return {
      kind: 'contract', resource,
      message: 'La respuesta del servidor no tiene el formato esperado.',
    }
  }

  if (error instanceof TypeError) {
    return {
      kind: 'network', resource,
      message: 'No fue posible contactar el servidor. Revisa la conexión e intenta de nuevo.',
    }
  }

  return {
    kind: 'unknown',
    resource,
    message: error instanceof Error ? error.message : 'No se pudo cargar la información.',
  }
}

export function initialDataOf<T>(result: LoadResult<T>): T | undefined {
  return result.ok ? result.data : undefined
}
