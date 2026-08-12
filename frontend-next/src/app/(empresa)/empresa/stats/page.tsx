import type { Metadata } from 'next'

import { PageHeader } from '@/components/shell/page-header'
import { HeaderStatPill } from '@/components/ui/header-stat-pill'
import { Icon } from '@/components/ui/icon'
import { RefreshButton } from '@/components/ui/refresh-button'
import { MetricCard } from '@/components/ui/stat-card'
import { getEmpresaStatistics } from '@/features/stats/api'
import { formatDate, formatTimestamp, titleCase } from '@/features/stats/format'
import { empresaIdFrom, requireSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Estadísticas — RESCUE' }

const PANEL = 'rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]'
const PANEL_HEAD = 'border-b border-[var(--shell-border-soft)] px-5 py-[18px]'
const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-red-500', 'bg-amber-500']

function Breakdown({ values }: { values: Record<string, number> }) {
  const entries = Object.entries(values)
  const max = Math.max(1, ...entries.map(([, value]) => value))
  if (!entries.length)
    return (
      <p className="py-8 text-center text-sm text-[var(--shell-text-muted)]">
        Sin datos disponibles.
      </p>
    )

  return (
    <ul className="space-y-[18px]">
      {entries.map(([label, value], index) => (
        <li key={label} className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--shell-text)]">{titleCase(label)}</span>
            <strong className="text-[var(--shell-text-strong)]">{value}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--shell-border-soft)]">
            <div
              className={`h-full rounded-full ${COLORS[index % COLORS.length]}`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function StatsPage() {
  const session = await requireSession()
  const empresaId = empresaIdFrom(session)
  const result = await getEmpresaStatistics(empresaId, session.displayName)

  if (!result.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className={`${PANEL} p-8 text-center`}>
          <Icon className="fas fa-circle-exclamation mb-3 text-3xl text-red-500" />
          <h1 className="font-semibold text-[var(--shell-text-strong)]">
            No se pudieron cargar las estadísticas
          </h1>
          <p className="mt-1 text-sm text-[var(--shell-text-muted)]">{result.error}</p>
        </div>
      </div>
    )
  }

  const stats = result.data
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon="fas fa-chart-line"
        iconGradient="from-violet-500 to-indigo-600"
        title="Estadísticas"
        subtitle={`Análisis detallado de ${stats.empresa.nombre}`}
        stats={
          <HeaderStatPill
            label={stats.empresa.activa ? 'Empresa activa' : 'Empresa inactiva'}
            value={formatDate(stats.empresa.fechaCreacion)}
            tone={stats.empresa.activa ? 'success' : 'neutral'}
          />
        }
        actions={<RefreshButton />}
      />

      <div className="mb-[22px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon="fas fa-users"
          tone="blue"
          label="Usuarios"
          value={stats.usuarios.total}
          meta={`${stats.usuarios.activos} activos`}
        />
        <MetricCard
          icon="fas fa-microchip"
          tone="green"
          label="Hardware"
          value={stats.hardware.total}
          meta={`${stats.hardware.activos} activos`}
        />
        <MetricCard
          icon="fas fa-bell"
          tone="red"
          label="Alertas"
          value={stats.alertas.total}
          meta={`${stats.alertas.activas} activas`}
        />
        <MetricCard
          icon="fas fa-wave-square"
          tone="purple"
          label="Actividad 30 días"
          value={stats.actividadReciente.logsUltimos30Dias}
          meta="registros"
        />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        <section className={PANEL}>
          <div className={PANEL_HEAD}>
            <h2 className="text-sm font-semibold text-[var(--shell-text-strong)]">
              Hardware por tipo
            </h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--shell-text-muted)]">
              Distribución del inventario
            </p>
          </div>
          <div className="p-5">
            <Breakdown values={stats.hardware.porTipo} />
          </div>
        </section>
        <section className={PANEL}>
          <div className={PANEL_HEAD}>
            <h2 className="text-sm font-semibold text-[var(--shell-text-strong)]">
              Alertas por prioridad
            </h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--shell-text-muted)]">
              Distribución histórica
            </p>
          </div>
          <div className="p-5">
            <Breakdown values={stats.alertas.porPrioridad} />
          </div>
        </section>
        <section className={PANEL}>
          <div className={PANEL_HEAD}>
            <h2 className="text-sm font-semibold text-[var(--shell-text-strong)]">
              Estado operativo
            </h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--shell-text-muted)]">
              Resumen de disponibilidad
            </p>
          </div>
          <dl className="space-y-4 p-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--shell-text-muted)]">Usuarios inactivos</dt>
              <dd className="font-semibold text-[var(--shell-text-strong)]">
                {stats.usuarios.inactivos}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--shell-text-muted)]">Hardware inactivo</dt>
              <dd className="font-semibold text-[var(--shell-text-strong)]">
                {stats.hardware.inactivos}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--shell-text-muted)]">Alertas resueltas</dt>
              <dd className="font-semibold text-[var(--shell-text-strong)]">
                {stats.alertas.resueltas}
              </dd>
            </div>
            <div className="border-t border-[var(--shell-border-soft)] pt-4">
              <dt className="mb-1 text-xs text-[var(--shell-text-muted)]">Última actividad</dt>
              <dd className="font-semibold text-[var(--shell-text-strong)]">
                {formatTimestamp(stats.actividadReciente.ultimaActividad)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
