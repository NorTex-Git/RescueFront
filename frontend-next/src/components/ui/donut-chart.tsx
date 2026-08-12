import type { ReactNode } from 'react'

export type DonutSegment = { label: string; value: number; color: string }

/**
 * Donut de severidad del Dashboard (diseño `admin-shell-v2.pen` → nodo "Donut").
 *
 * SVG puro con `stroke-dasharray`, sin librería de charts. Si no hay segmentos con
 * valor, dibuja solo el aro de fondo (estado sin desglose) — no inventa proporciones.
 */
export function DonutChart({
  segments,
  center,
  size = 118,
  thickness = 15,
}: {
  segments: DonutSegment[]
  /** Contenido centrado (total + etiqueta). */
  center?: ReactNode
  size?: number
  thickness?: number
}) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  let offset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--shell-border-soft)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((seg, i) => {
              const length = (seg.value / total) * circumference
              const dash = `${length} ${circumference - length}`
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                />
              )
              offset += length
              return el
            })}
        </g>
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{center}</div>
      )}
    </div>
  )
}
