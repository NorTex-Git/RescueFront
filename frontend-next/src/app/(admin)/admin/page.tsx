import { PageHeader } from '@/components/shell/page-header'
import { DonutChart } from '@/components/ui/donut-chart'
import { HeaderStatPill } from '@/components/ui/header-stat-pill'
import { RefreshButton } from '@/components/ui/refresh-button'
import { MetricCard } from '@/components/ui/stat-card'
import {
  fetchCoverageStats,
  fetchDashboardStats,
  fetchHardwareBreakdown,
  fetchRecentActivity,
} from '@/features/dashboard/server'
import { timeAgo } from '@/features/stats/format'
import { requireSession } from '@/lib/auth/session'

/**
 * Dashboard de admin (diseño `admin-shell-v2.pen` → nodo "Dashboard").
 *
 * Contadores de `/api/dashboard/stats`; "Actividad reciente" y "Hardware por tipo" de
 * datos ya verificados (`features/dashboard/server.ts`). El panel "Alertas del mes" del
 * mockup lleva un donut por severidad, pero no hay endpoint verificado que dé ese
 * desglose (ver nota en `server.ts`): se muestra el total real sin inventar proporciones.
 */
const BAR_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4']

/** Tinte del tile de cada fila de actividad según su icono. */
function activityTone(icon: string) {
  if (icon.includes('building'))
    return 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
  if (icon.includes('microchip') || icon.includes('cpu'))
    return 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'
  return 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
}

const PANEL = 'rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]'
const PANEL_HEAD = 'border-b border-[var(--shell-border-soft)] px-5 py-[18px]'
const PANEL_TITLE = 'text-sm font-semibold text-[var(--shell-text-strong)]'
const PANEL_SUB = 'mt-0.5 text-[11.5px] text-[var(--shell-text-muted)]'

export default async function AdminDashboardPage() {
  const session = await requireSession()

  const [stats, activity, hardwareBreakdown, coverage] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentActivity(),
    fetchHardwareBreakdown(),
    fetchCoverageStats(),
  ])

  const maxHardware = Math.max(1, ...hardwareBreakdown.map((item) => item.cantidad))
  const totalAlertas = stats.total_alertas ?? 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon="fas fa-tachometer-alt"
        title="Dashboard"
        subtitle={<>Resumen general de la operación · sesión de {session.displayName}</>}
        stats={
          <HeaderStatPill label="Sedes cubiertas" value={coverage.sedesCubiertas} tone="info" />
        }
        actions={<RefreshButton />}
      />

      <div className="mb-[22px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="fas fa-building" tone="blue" label="Empresas" value={stats.total_empresas ?? 0} meta="registradas" />
        <MetricCard icon="fas fa-users" tone="green" label="Usuarios" value={stats.total_usuarios ?? 0} meta="activos" />
        <MetricCard icon="fas fa-microchip" tone="purple" label="Hardware" value={stats.total_hardware ?? 0} meta="dispositivos" />
        <MetricCard icon="fas fa-bell" tone="red" label="Alertas" value={totalAlertas} meta="este mes" />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        {/* Actividad reciente */}
        <div className={`${PANEL} lg:col-span-2`}>
          <div className={PANEL_HEAD}>
            <h2 className={PANEL_TITLE}>Actividad reciente</h2>
            <p className={PANEL_SUB}>Últimos movimientos de la operación</p>
          </div>
          <div className="p-2.5">
            {activity.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--shell-text-muted)]">
                Sin actividad reciente.
              </p>
            ) : (
              <ul>
                {activity.map((entry, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-[13px] rounded-xl px-2.5 py-[13px]"
                  >
                    <span
                      className={`flex size-[34px] shrink-0 items-center justify-center rounded-[11px] text-sm ${activityTone(entry.icon)}`}
                    >
                      <i className={entry.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--shell-text-strong)]">
                        {entry.title}
                      </p>
                      <p className="truncate text-[11.5px] text-[var(--shell-text-muted)]">
                        {entry.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-[var(--shell-text-muted)]">
                      {timeAgo(entry.date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Columna derecha: distribución + severidad */}
        <div className="flex flex-col gap-[18px]">
          <div className={PANEL}>
            <div className={PANEL_HEAD}>
              <h2 className={PANEL_TITLE}>Hardware por tipo</h2>
              <p className={PANEL_SUB}>{stats.total_hardware ?? 0} dispositivos registrados</p>
            </div>
            <div className="p-5">
              {hardwareBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--shell-text-muted)]">
                  Sin equipos registrados.
                </p>
              ) : (
                <ul className="space-y-[18px]">
                  {hardwareBreakdown.map((item, index) => (
                    <li key={item.tipo} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--shell-text)]">{item.tipo}</span>
                        <span className="font-semibold text-[var(--shell-text-strong)]">
                          {item.cantidad}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--shell-border-soft)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.cantidad / maxHardware) * 100}%`,
                            backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={PANEL}>
            <div className={PANEL_HEAD}>
              <h2 className={PANEL_TITLE}>Alertas del mes</h2>
              <p className={PANEL_SUB}>Total registrado · últimos 30 días</p>
            </div>
            <div className="flex items-center gap-[22px] px-5 py-4">
              <DonutChart
                segments={[]}
                center={
                  <>
                    <span className="text-2xl font-bold tracking-[-0.6px] text-[var(--shell-text-strong)]">
                      {totalAlertas}
                    </span>
                    <span className="text-[10.5px] text-[var(--shell-text-muted)]">alertas</span>
                  </>
                }
              />
              {/*
               * El desglose por severidad (Críticas/Medias/Informativas) del mockup queda
               * pendiente: no hay endpoint verificado que lo entregue (ver `server.ts`). No
               * se inventan proporciones — se muestra solo el total real.
               */}
              <p className="flex-1 text-[12px] text-[var(--shell-text-muted)]">
                El desglose por severidad estará disponible al conectar el endpoint de
                distribución de alertas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
