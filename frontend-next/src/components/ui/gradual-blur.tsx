import { memo, useMemo, type CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import styles from './gradual-blur.module.css'

type Position = 'top' | 'bottom' | 'left' | 'right'
type Curve = 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'

type GradualBlurProps = {
  target?: 'parent' | 'page'
  position?: Position
  height?: string
  width?: string
  strength?: number
  divCount?: number
  curve?: Curve
  exponential?: boolean
  opacity?: number
  zIndex?: number
  className?: string
  style?: CSSProperties
}

const curves: Record<Curve, (progress: number) => number> = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  'ease-in': (progress) => progress * progress,
  'ease-out': (progress) => 1 - (1 - progress) ** 2,
  'ease-in-out': (progress) =>
    progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2,
}

const directions: Record<Position, string> = {
  top: 'to top',
  bottom: 'to bottom',
  left: 'to left',
  right: 'to right',
}

export const GradualBlur = memo(function GradualBlur({
  target = 'parent',
  position = 'bottom',
  height = '6rem',
  width,
  strength = 2,
  divCount = 5,
  curve = 'linear',
  exponential = false,
  opacity = 1,
  zIndex = 40,
  className,
  style,
}: GradualBlurProps) {
  const count = Math.max(1, Math.round(divCount))
  const layers = useMemo(() => {
    const increment = 100 / count
    return Array.from({ length: count }, (_, index) => {
      const step = index + 1
      const progress = curves[curve](step / count)
      const blur = exponential
        ? 2 ** (progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * count + 1) * strength
      const start = Math.round((increment * step - increment) * 10) / 10
      const solidStart = Math.round(increment * step * 10) / 10
      const solidEnd = Math.min(100, Math.round((increment * step + increment) * 10) / 10)
      const end = Math.min(100, Math.round((increment * step + increment * 2) * 10) / 10)
      const gradient = `transparent ${start}%, black ${solidStart}%, black ${solidEnd}%, transparent ${end}%`

      return (
        <div
          key={step}
          className={styles.layer}
          style={{
            maskImage: `linear-gradient(${directions[position]}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${directions[position]}, ${gradient})`,
            backdropFilter: `blur(${blur.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
            opacity,
          }}
        />
      )
    })
  }, [count, curve, exponential, opacity, position, strength])

  const vertical = position === 'top' || position === 'bottom'
  const containerStyle: CSSProperties = {
    position: target === 'page' ? 'fixed' : 'absolute',
    zIndex,
    [position]: 0,
    ...(vertical
      ? { left: 0, right: 0, width: width ?? '100%', height }
      : { top: 0, bottom: 0, width: width ?? height, height: '100%' }),
    ...style,
  }

  return (
    <div className={cn(styles.blur, className)} style={containerStyle} aria-hidden="true">
      <div className={styles.inner}>{layers}</div>
    </div>
  )
})
