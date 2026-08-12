import type { Metadata } from 'next'

import type { FieldOption } from '@/components/ui/form-field'
import { fetchEmpresa } from '@/features/empresas/server'
import type { Empresa } from '@/features/empresas/types'
import { HardwareView } from '@/features/hardware/components/admin-hardware-view'
import { fetchHardwareByEmpresa } from '@/features/hardware/server'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'
import type { LoadResult } from '@/load-result'
import { preload } from '@/preload'

export const metadata: Metadata = { title: 'Hardware — RESCUE' }

const emptyTypes: LoadResult<FieldOption[]> = { ok: true, data: [] }
const emptyCompanies: LoadResult<Empresa[]> = { ok: true, data: [] }

export default async function EmpresaHardwarePage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)
  const [hardwareLoad, empresa] = await Promise.all([
    preload('hardware de la empresa', () => fetchHardwareByEmpresa(empresaId)),
    fetchEmpresa(empresaId),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HardwareView
        hardwareLoad={hardwareLoad}
        tiposLoad={emptyTypes}
        empresasLoad={emptyCompanies}
        scope={{ empresaId, empresaNombre: empresa.nombre }}
      />
    </div>
  )
}
