import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError } from '@/lib/api/errors'

import { initialDataOf, toLoadError } from './load-result'
import { preload } from './preload'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('load-result', () => {
  it('conserva una lista vacía exitosa como dato válido', async () => {
    const result = await preload('hardware', async () => [])
    expect(result).toEqual({ ok: true, data: [] })
    expect(initialDataOf(result)).toEqual([])
  })

  it('serializa un fallo sin convertirlo en datos vacíos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = await preload('hardware', async () => {
      throw new ApiError(500, 'Backend no disponible')
    })

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'server', status: 500, resource: 'hardware', message: 'Backend no disponible',
      },
    })
    expect(initialDataOf(result)).toBeUndefined()
  })

  it('clasifica autenticación y contratos de datos', () => {
    expect(toLoadError(new ApiError(401, 'Token expirado')).kind).toBe('auth')
    const contractError = z.object({ id: z.string() }).safeParse({ id: 2 }).error
    expect(toLoadError(contractError).kind).toBe('contract')
  })
})
