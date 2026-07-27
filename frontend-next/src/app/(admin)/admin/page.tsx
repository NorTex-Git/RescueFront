import Link from 'next/link'

import { PageHeader } from '@/components/shell/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { apiFetch } from '@/lib/api/server'
import { requireSession } from '@/lib/auth/session'

/**
 * Dashboard de admin. Los contadores salen de `/api/dashboard/stats`, el mismo
 * endpoint que usaba `super_admin_dashboard()` en `app.py:414`.
 */
type DashboardStats = {
  total_empresas?: number
  total_usuarios?: number
  total_hardware?: number
  total_alertas?: number
}

export default async function AdminDashboardPage() {
  const session = await requireSession()

  const stats = await apiFetch<{ data?: DashboardStats }>('/api/dashboard/stats')
    .then((raw) => raw.data ?? {})
    .catch(() => ({}) as DashboardStats)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon="fas fa-tachometer-alt"
        title="Panel de Control"
        subtitle={<>Sesión iniciada como {session.displayName}</>}
      />

      <div className="ios-stats-grid mb-8">
        <StatCard icon="fas fa-building" tone="blue" label="Empresas">
          <div className="ios-stat-value">{stats.total_empresas ?? 0}</div>
        </StatCard>
        <StatCard icon="fas fa-users" tone="green" label="Usuarios">
          <div className="ios-stat-value">{stats.total_usuarios ?? 0}</div>
        </StatCard>
        <StatCard icon="fas fa-microchip" tone="purple" label="Hardware">
          <div className="ios-stat-value">{stats.total_hardware ?? 0}</div>
        </StatCard>
        <StatCard icon="fas fa-exclamation-triangle" tone="red" label="Alertas">
          <div className="ios-stat-value">{stats.total_alertas ?? 0}</div>
        </StatCard>
      </div>

      <div className="ios-filters-container ios-blur-bg">
        <p className="text-sm text-gray-600 dark:text-white/70">
          Migrado hasta ahora:{' '}
          <Link href="/admin/company-types" className="font-semibold text-blue-500 hover:underline">
            Tipos de Empresa
          </Link>
          . El resto de vistas del panel siguen en Flask.
        </p>
      </div>
    </div>
  )
}
