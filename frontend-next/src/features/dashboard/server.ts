import { apiFetch } from '@/lib/api/server'
import { fetchEmpresas } from '@/features/empresas/server'
import { fetchHardware } from '@/features/hardware/server'

/**
 * Datos del dashboard de admin. Solo se construye con fuentes cuya forma ya está
 * verificada en el resto de la app (`fetchEmpresas`, `fetchHardware`, y el propio
 * `/api/dashboard/stats` que ya usaba `admin/page.tsx`): nada de datos inventados.
 *
 * El mockup de referencia también mostraba "Usuarios recientes" y un desglose de
 * alertas del mes por severidad — se dejaron fuera a propósito. Existen endpoints
 * documentados para eso (`docs/api-contract.md` §8: `/api/dashboard/recent-users`,
 * `/api/dashboard/distribution-chart`), pero no están verificados contra el backend
 * real (no se pudo probar con una sesión autenticada) ni se usan en ningún otro sitio
 * de la app, así que no hay forma segura de saber qué campos traen. Añadirlos es
 * trabajo aparte una vez confirmada la forma real de la respuesta.
 */

export type DashboardStats = {
  total_empresas?: number
  total_usuarios?: number
  total_hardware?: number
  total_alertas?: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<{ data?: DashboardStats }>('/api/dashboard/stats')
    .then((raw) => raw.data ?? {})
    .catch(() => ({}) as DashboardStats)
}

export type ActivityEntry = {
  icon: string
  title: string
  subtitle: string
  date: string | null | undefined
}

/**
 * "Actividad reciente" mezclando empresas y hardware (las dos fuentes globales cuya
 * forma ya está verificada). Deja fuera "usuario creado": en esta app los usuarios se
 * listan por empresa (`listUsuarios(empresaId, ...)`), no hay un listado global de
 * usuarios de todas las empresas sin pasar por el endpoint de dashboard sin verificar.
 */
export async function fetchRecentActivity(limit = 6): Promise<ActivityEntry[]> {
  const [empresas, hardware] = await Promise.all([
    fetchEmpresas().catch(() => []),
    fetchHardware().catch(() => []),
  ])

  const empresaEntries: ActivityEntry[] = empresas
    .filter((empresa) => empresa.fecha_creacion)
    .map((empresa) => ({
      icon: 'fas fa-building',
      title: 'Nueva empresa registrada',
      subtitle: empresa.nombre,
      date: empresa.fecha_creacion,
    }))

  const hardwareEntries: ActivityEntry[] = hardware
    .filter((item) => item.fecha_creacion)
    .map((item) => ({
      icon: 'fas fa-microchip',
      title: 'Dispositivo vinculado',
      subtitle: item.empresa_nombre ? `${item.nombre} · ${item.empresa_nombre}` : item.nombre,
      date: item.fecha_creacion,
    }))

  return [...empresaEntries, ...hardwareEntries]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, limit)
}

/** "Sedes cubiertas" (Dashboard) y "Equipos activos" (widget del sidebar) — datos reales. */
export async function fetchCoverageStats(): Promise<{
  sedesCubiertas: number
  equiposActivos: number
}> {
  const [empresas, hardware] = await Promise.all([
    fetchEmpresas().catch(() => []),
    fetchHardware().catch(() => []),
  ])

  return {
    sedesCubiertas: empresas.reduce((sum, empresa) => sum + empresa.sedes.length, 0),
    equiposActivos: hardware.filter((item) => item.activa).length,
  }
}

export type HardwareBreakdownEntry = { tipo: string; cantidad: number }

/** "Hardware por tipo": conteo real agrupado por `tipo`, del mismo listado que usa /admin/hardware. */
export async function fetchHardwareBreakdown(): Promise<HardwareBreakdownEntry[]> {
  const hardware = await fetchHardware().catch(() => [])
  const counts = new Map<string, number>()

  for (const item of hardware) {
    const tipo = item.tipo?.trim() || 'Sin tipo'
    counts.set(tipo, (counts.get(tipo) ?? 0) + 1)
  }

  return Array.from(counts, ([tipo, cantidad]) => ({ tipo, cantidad })).sort(
    (a, b) => b.cantidad - a.cantidad,
  )
}
