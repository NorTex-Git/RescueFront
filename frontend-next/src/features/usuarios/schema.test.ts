import { describe, expect, it } from 'vitest'

import { toInternationalPhoneValue, toStoredPhoneValue, usuarioFormSchema } from './schema'

const validUser = {
  nombre: 'Usuario de prueba',
  cedula: '1234567',
  rol: 'brigadista',
  sede: 'Principal',
  email: '',
}

describe('teléfono internacional de usuarios', () => {
  it('convierte números colombianos históricos a E.164 para editarlos', () => {
    expect(toInternationalPhoneValue('3103391854')).toBe('+573103391854')
  })

  it('conserva números internacionales y guarda solo sus dígitos', () => {
    expect(toInternationalPhoneValue('14155552671')).toBe('+14155552671')
    expect(toStoredPhoneValue('+1 415 555 2671')).toBe('14155552671')
  })

  it('acepta teléfonos válidos de distintos países', () => {
    expect(usuarioFormSchema.safeParse({ ...validUser, telefono: '+573103391854' }).success).toBe(
      true,
    )
    expect(usuarioFormSchema.safeParse({ ...validUser, telefono: '+14155552671' }).success).toBe(
      true,
    )
  })

  it('rechaza números imposibles y permite dejar el teléfono vacío', () => {
    expect(usuarioFormSchema.safeParse({ ...validUser, telefono: '+123' }).success).toBe(false)
    expect(usuarioFormSchema.safeParse({ ...validUser, telefono: '' }).success).toBe(true)
  })
})
