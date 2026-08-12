import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import styles from './glass-icons.module.css'

type GlassIconSize = 'sm' | 'md' | 'lg'

const sizes: Record<GlassIconSize, string> = {
  sm: styles.small,
  md: styles.medium,
  lg: styles.large,
}

export function GlassIcon({
  children,
  size = 'md',
  className,
}: {
  children: ReactNode
  size?: GlassIconSize
  className?: string
}) {
  return (
    <span className={cn(styles.icon, sizes[size], className)} aria-hidden="true">
      <span className={styles.back} />
      <span className={styles.front}>
        <span className={styles.glyph}>{children}</span>
      </span>
    </span>
  )
}

export type GlassIconItem = {
  icon: ReactNode
  label: string
  onClick?: () => void
}

/** Variante en cuadrícula del componente React Bits, neutra por defecto. */
export function GlassIcons({
  items,
  className,
  colorful = false,
}: {
  items: GlassIconItem[]
  className?: string
  colorful?: boolean
}) {
  return (
    <div className={cn(styles.grid, className)} data-colorful={colorful}>
      {items.map((item) => (
        <div className={styles.item} key={item.label}>
          <button
            type="button"
            className={cn(styles.icon, styles.medium, styles.interactive)}
            aria-label={item.label}
            onClick={item.onClick}
          >
            <span className={styles.back} />
            <span className={styles.front}>
              <span className={styles.glyph}>{item.icon}</span>
            </span>
          </button>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
