import { describe, expect, it } from 'vitest'

import { parseHardwareList, physicalStatusOf } from './types'

const validHardware = {
  _id: 'hardware-1',
  nombre: 'Sirena principal',
  activa: true,
}

describe('parseHardwareList', () => {
  it('acepta el envoltorio del backend', () => {
    expect(parseHardwareList({ success: true, data: [validHardware] })).toEqual([validHardware])
  })

  it('acepta un array plano por compatibilidad', () => {
    expect(parseHardwareList([validHardware])).toEqual([validHardware])
  })

  it('permite una lista legítimamente vacía', () => {
    expect(parseHardwareList({ success: true, data: [] })).toEqual([])
  })

  it('conserva el reporte físico enviado por el software de monitoreo', () => {
    const report = { estado: 'Inactivo', updated_at: '2026-08-11T15:00:00' }
    const [hardware] = parseHardwareList({
      success: true,
      data: [{ ...validHardware, physical_status: report }],
    })

    expect(hardware.physical_status).toEqual(report)
    expect(physicalStatusOf(hardware)).toBe('Inactivo')
  })

  it('conserva el estado físico cuando el backend ya envía texto', () => {
    expect(
      parseHardwareList({
        success: true,
        data: [{ ...validHardware, physical_status: 'Activo' }],
      }),
    ).toEqual([{ ...validHardware, physical_status: 'Activo' }])
  })

  it('falla si una fila incumple el contrato en vez de descartarla', () => {
    expect(() =>
      parseHardwareList({
        success: true,
        data: [validHardware, { _id: 'hardware-2', nombre: 42 }],
      }),
    ).toThrow()
  })
})
