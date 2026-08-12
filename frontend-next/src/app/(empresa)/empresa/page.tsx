import Link from 'next/link'

import { PageHeader } from '@/components/shell/page-header'
import { HeaderStatPill } from '@/components/ui/header-stat-pill'
import { Icon } from '@/components/ui/icon'
import { RefreshButton } from '@/components/ui/refresh-button'
import { MetricCard } from '@/components/ui/stat-card'
import { fetchEmpresaAlerts } from '@/features/alerts/server'
import { fetchEmpresa } from '@/features/empresas/server'
import { getEmpresaStatistics } from '@/features/stats/api'
import { formatTimestamp, titleCase } from '@/features/stats/format'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'

const BAR_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4']
const PANEL = 'rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]'
const PANEL_HEAD =
  'flex items-center justify-between gap-3 border-b border-[var(--shell-border-soft)] px-5 py-[18px]'

export default async function EmpresaDashboardPage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)
  const empresa = await fetchEmpresa(empresaId)
  const [statsResult, alerts] = await Promise.all([
    getEmpresaStatistics(empresaId, empresa.nombre),
    fetchEmpresaAlerts(empresaId, 'active', 1, 5),
  ])

  if (!statsResult.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className={`${PANEL} p-8 text-center`}>
          <Icon name="circle-exclamation" className="mb-3 text-3xl text-red-500" />
          <h1 className="font-semibold text-[var(--shell-text-strong)]">
            No se pudo cargar el dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--shell-text-muted)]">{statsResult.error}</p>
        </div>
      </div>
    )
  }

  const stats = statsResult.data
  const hardware = Object.entries(stats.hardware.porTipo)
  const maxHardware = Math.max(1, ...hardware.map(([, count]) => count))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon="gauge-high"
        title="Dashboard"
        subtitle={`Resumen operativo de ${empresa.nombre}`}
        stats={<HeaderStatPill label="Sedes" value={empresa.sedes.length} tone="info" />}
        actions={<RefreshButton />}
      />

      <div className="mb-[22px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon="users"
          label="Usuarios"
          value={stats.usuarios.total}
          meta={`${stats.usuarios.activos} activos`}
        />
        <MetricCard
          icon="microchip"
          label="Hardware"
          value={stats.hardware.total}
          meta={`${stats.hardware.activos} conectados`}
        />
        <MetricCard
          icon="bell"
          label="Alertas activas"
          value={stats.alertas.activas}
          meta="requieren atención"
        />
        <MetricCard
          icon="circle-check"
          label="Resueltas"
          value={stats.alertas.resueltas}
          meta="histórico"
        />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        <section className={`${PANEL} overflow-hidden lg:col-span-2`}>
          <div className={PANEL_HEAD}>
            <div>
              <h2 className="text-sm font-semibold text-[var(--shell-text-strong)]">
                Alertas activas recientes
              </h2>
              <p className="mt-0.5 text-[11.5px] text-[var(--shell-text-muted)]">
                Actualizadas por el canal en tiempo real
              </p>
            </div>
            <Link
              href="/empresa/alertas"
              className="text-xs font-semibold text-[var(--shell-accent)] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {alerts.data.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Icon name="circle-check" className="mb-3 text-4xl text-emerald-500" />
              <p className="font-semibold text-[var(--shell-text-strong)]">
                La operación está al día
              </p>
              <p className="mt-1 text-sm text-[var(--shell-text-muted)]">No hay alertas activas.</p>
            </div>
          ) : (
            <ul className="p-2.5">
              {alerts.data.map((alert) => (
                <li
                  key={alert._id}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-3 hover:bg-[var(--shell-bg)]"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-300">
                    <Icon name="triangle-exclamation" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--shell-text-strong)]">
                      {alert.nombre_alerta || alert.tipo_alerta || 'Alerta'}
                    </p>
                    <p className="truncate text-[11.5px] text-[var(--shell-text-muted)]">
                      {alert.sede || 'Sin sede'} · {titleCase(alert.prioridad)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[11px] text-[var(--shell-text-muted)] sm:block">
                    {formatTimestamp(alert.fecha_creacion ?? null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={PANEL}>
          <div className={PANEL_HEAD}>
            <div>
              <h2 className="text-sm font-semibold text-[var(--shell-text-strong)]">
                Hardware por tipo
              </h2>
              <p className="mt-0.5 text-[11.5px] text-[var(--shell-text-muted)]">
                {stats.hardware.total} dispositivos registrados
              </p>
            </div>
            <Link
              href="/empresa/hardware"
              aria-label="Ver hardware"
              className="text-[var(--shell-accent)]"
            >
              <Icon name="arrow-right" />
            </Link>
          </div>
          <div className="p-5">
            {hardware.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--shell-text-muted)]">
                Sin equipos registrados.
              </p>
            ) : (
              <ul className="space-y-[18px]">
                {hardware.map(([type, count], index) => (
                  <li key={type} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--shell-text)]">{titleCase(type)}</span>
                      <strong className="text-[var(--shell-text-strong)]">{count}</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--shell-border-soft)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / maxHardware) * 100}%`,
                          backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
