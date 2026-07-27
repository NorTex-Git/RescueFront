import type { ReactNode } from 'react'

type IconTone = 'blue' | 'green' | 'red' | 'purple'

/** Tarjeta `ios-stat-card` del CSS heredado, sin reescribir sus estilos. */
export function StatCard({
  icon,
  tone,
  label,
  children,
}: {
  icon: string
  tone: IconTone
  label: string
  children: ReactNode
}) {
  return (
    <div className="ios-stat-card">
      <div className={`ios-stat-icon ios-stat-icon-${tone}`}>
        <i className={icon} />
      </div>
      <div className="ios-stat-content">
        <div className="ios-stat-label">{label}</div>
        {children}
      </div>
      <div className="ios-stat-shimmer" />
    </div>
  )
}

/** Fila etiqueta/valor de los desgloses (hardware por tipo, alertas por prioridad). */
export function BreakdownRow({
  label,
  value,
  valueClassName = 'text-black dark:text-white',
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-white/70">{label}</span>
      <span className={`font-semibold ${valueClassName}`}>{value}</span>
    </div>
  )
}
