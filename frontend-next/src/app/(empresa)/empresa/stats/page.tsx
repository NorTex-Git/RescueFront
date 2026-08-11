import { Icon } from '@/components/ui/icon'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/shell/page-header'
import { getEmpresaStatistics } from '@/features/stats/api'
import { BreakdownRow, StatCard } from '@/components/ui/stat-card'
import { formatDate, formatTimestamp, titleCase } from '@/features/stats/format'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Estadísticas — RESCUE',
}

/**
 * Primera vista migrada de la Fase 3; sirve de plantilla del patrón:
 *
 * - Server Component hace el fetch → HTML con datos, sin spinner ni `setInterval`.
 * - El mapeo backend→UI vive en `features/stats/types.ts`, no en el componente.
 * - Sin estado en `window`, sin `innerHTML`.
 *
 * Paridad visual con `templates/empresa/spa/views/stats.html` reutilizando las
 * clases `ios-*` del CSS heredado.
 */
export default async function StatsPage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)

  if (!empresaId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo determinar la empresa de tu usuario.
        </p>
      </div>
    )
  }

  const { data: stats, error } = await getEmpresaStatistics(empresaId, session.displayName)

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="ios-filters-container ios-blur-bg">
          <h1 className="mb-2 text-xl font-bold text-black dark:text-white">
            No se pudieron cargar las estadísticas
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/70">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon="fas fa-chart-line"
        title="Estadísticas Avanzadas"
        subtitle={<>Análisis detallado de {stats.empresa.nombre}</>}
      />

      <div className="ios-filters-container ios-blur-bg mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-2xl font-bold text-white">
                {stats.empresa.nombre.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white">
                {stats.empresa.nombre}
              </h2>
              <p className="text-sm text-gray-600 dark:text-white/70">
                Activa desde {formatDate(stats.empresa.fechaCreacion)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`rounded-full px-3 py-1 text-xs font-medium text-white ${
                stats.empresa.activa ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {stats.empresa.activa ? 'ACTIVA' : 'INACTIVA'}
            </div>
          </div>
        </div>
      </div>

      <div className="ios-stats-grid empresa-stats-container mb-8">
        <StatCard icon="fas fa-users" tone="blue" label="Total Usuarios">
          <div className="ios-stat-value">{stats.usuarios.total}</div>
          <div className="ios-stat-trend">{stats.usuarios.activos} activos</div>
        </StatCard>

        <StatCard icon="fas fa-microchip" tone="green" label="Hardware Total">
          <div className="ios-stat-value">{stats.hardware.total}</div>
          <div className="ios-stat-trend">{stats.hardware.activos} activos</div>
        </StatCard>

        <StatCard icon="fas fa-exclamation-triangle" tone="red" label="Alertas">
          <div className="ios-stat-value">{stats.alertas.total}</div>
          <div className="ios-stat-trend">{stats.alertas.activas} activas</div>
        </StatCard>

        <StatCard icon="fas fa-chart-line" tone="purple" label="Actividad (30d)">
          <div className="ios-stat-value">{stats.actividadReciente.logsUltimos30Dias}</div>
          <div className="ios-stat-trend">logs registrados</div>
        </StatCard>
      </div>

      <div className="ios-stats-grid mb-8">
        <StatCard icon="fas fa-cogs" tone="green" label="Hardware por Tipo">
          <div className="mt-2 space-y-1">
            {Object.entries(stats.hardware.porTipo).length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-white/70">Sin datos</p>
            ) : (
              Object.entries(stats.hardware.porTipo).map(([tipo, cantidad]) => (
                <BreakdownRow key={tipo} label={titleCase(tipo)} value={cantidad} />
              ))
            )}
          </div>
        </StatCard>

        <StatCard icon="fas fa-bell" tone="red" label="Alertas por Prioridad">
          <div className="mt-2 space-y-1">
            {Object.entries(stats.alertas.porPrioridad).length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-white/70">Sin datos</p>
            ) : (
              Object.entries(stats.alertas.porPrioridad).map(([prioridad, cantidad]) => (
                <BreakdownRow key={prioridad} label={titleCase(prioridad)} value={cantidad} />
              ))
            )}
          </div>
        </StatCard>

        <StatCard icon="fas fa-user-friends" tone="blue" label="Estado de Usuarios">
          <div className="mt-2 space-y-1">
            <BreakdownRow
              label="Activos"
              value={stats.usuarios.activos}
              valueClassName="text-green-600 dark:text-green-400"
            />
            <BreakdownRow
              label="Inactivos"
              value={stats.usuarios.inactivos}
              valueClassName="text-red-600 dark:text-red-400"
            />
            <BreakdownRow label="Total" value={stats.usuarios.total} />
          </div>
        </StatCard>
      </div>

      <div className="ios-filters-container ios-blur-bg">
        <h3 className="mb-4 text-xl font-bold text-black dark:text-white">
          <Icon className="fas fa-clock mr-2 text-purple-600 dark:text-purple-400" />
          Actividad Reciente
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-gray-600 dark:text-white/80">
              Logs registrados en los últimos 30 días:
            </p>
            <p className="text-3xl font-bold text-black dark:text-white">
              {stats.actividadReciente.logsUltimos30Dias}
            </p>
          </div>
          <div>
            <p className="mb-2 text-gray-600 dark:text-white/80">Última actividad registrada:</p>
            <p className="text-lg text-black dark:text-white">
              {formatTimestamp(stats.actividadReciente.ultimaActividad)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <span className="text-sm text-gray-500 dark:text-white/60">
          Estadísticas Avanzadas • {stats.empresa.nombre}
        </span>
      </div>
    </div>
  )
}
