import type { Metadata } from 'next'

import { AdminHardwareView } from '@/features/hardware/components/admin-hardware-view'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchHardware, fetchHardwareTypeOptions } from '@/features/hardware/server'

export const metadata: Metadata = { title: 'Hardware — RESCUE' }

export default async function HardwarePage() {
  const [hardware, tipos, empresas] = await Promise.all([
    fetchHardware().catch(() => []),
    fetchHardwareTypeOptions().catch(() => []),
    fetchEmpresas().then((items) => items.filter((item) => item.activa)).catch(() => []),
  ])
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHardwareView initialData={hardware} tipos={tipos} empresas={empresas} />
    </div>
  )
}
