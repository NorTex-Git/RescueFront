import type { Metadata } from 'next'

import { AdminHardwareView } from '@/features/hardware/components/admin-hardware-view'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchHardware, fetchHardwareTypeOptions } from '@/features/hardware/server'
import { preload } from '@/preload'

export const metadata: Metadata = { title: 'Hardware — RESCUE' }

export default async function HardwarePage() {
  const [hardwareLoad, tiposLoad, empresasLoad] = await Promise.all([
    preload('hardware', fetchHardware),
    preload('tipos de hardware', fetchHardwareTypeOptions),
    preload('empresas activas', () =>
      fetchEmpresas().then((items) => items.filter((item) => item.activa)),
    ),
  ])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHardwareView
        hardwareLoad={hardwareLoad}
        tiposLoad={tiposLoad}
        empresasLoad={empresasLoad}
      />
    </div>
  )
}
