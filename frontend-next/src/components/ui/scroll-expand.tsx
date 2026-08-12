'use client'

import { useRef, type HTMLAttributes, type ReactNode } from 'react'

import { gsap, useGSAP } from '@/lib/gsap/register'
import { cn } from '@/lib/utils'
import styles from './scroll-expand.module.css'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

type ScrollExpandProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  src: string
  alt?: string
  title?: string
  scrollHint?: string
  startWidth?: number
  startHeight?: number
  startRadius?: number
  endRadius?: number
  mediaZoom?: number
  scrollDistance?: number
  holdDistance?: number
  smoothing?: number
  overlayScrim?: number
  useWindowScroll?: boolean
  enabled?: boolean
  children?: ReactNode
}

export function ScrollExpand({
  src,
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  className,
  style,
  ...rest
}: ScrollExpandProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const track = trackRef.current
      const stage = stageRef.current
      const frame = frameRef.current
      const media = mediaRef.current
      if (!root || !track || !stage || !frame || !media) return

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const expansion = Math.max(0.01, scrollDistance)
      const hold = Math.max(0, holdDistance)

      const measure = () => {
        const stageHeight = useWindowScroll ? window.innerHeight : root.clientHeight
        stage.style.height = `${Math.max(stageHeight, 1)}px`
        stage.style.setProperty(
          '--se-title-size',
          `${clamp((root.clientWidth || stageHeight) * 0.075, 30, 84)}px`,
        )
      }

      measure()
      const insetX = Math.max(0, (100 - startWidth) / 2)
      const insetY = Math.max(0, (100 - startHeight) / 2)
      gsap.set(frame, { clipPath: `inset(${insetY}% ${insetX}% round ${startRadius}px)` })
      gsap.set(media, { scale: mediaZoom })
      gsap.set(scrimRef.current, { opacity: 0 })
      gsap.set(overlayRef.current, { opacity: 0, y: 18 })
      gsap.set(titleRef.current, { opacity: 1, y: 0, scale: 1 })
      gsap.set(hintRef.current, { opacity: 1, y: 0 })

      if (!enabled || reduceMotion) {
        gsap.set(frame, { clipPath: `inset(0% 0% round ${endRadius}px)` })
        gsap.set(media, { scale: 1 })
        gsap.set(scrimRef.current, { opacity: overlayScrim })
        gsap.set(overlayRef.current, { opacity: 1, y: 0 })
        gsap.set([titleRef.current, hintRef.current], { opacity: 0 })
        return
      }

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track,
          scroller: useWindowScroll ? undefined : root,
          start: 'top top',
          end: () => {
            measure()
            const height = useWindowScroll ? window.innerHeight : root.clientHeight
            return `+=${Math.max(height, 1) * (expansion + hold)}`
          },
          pin: stage,
          pinType: 'transform',
          pinSpacing: true,
          scrub: smoothing <= 0 ? true : Math.max(0.1, smoothing),
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
        },
      })

      timeline
        .to(frame, { clipPath: `inset(0% 0% round ${endRadius}px)`, duration: expansion }, 0)
        .to(media, { scale: 1, duration: expansion }, 0)
        .to(scrimRef.current, { opacity: overlayScrim, duration: expansion }, 0)
        .to(hintRef.current, { opacity: 0, y: 8, duration: expansion * 0.12 }, 0)
        .to(
          titleRef.current,
          { opacity: 0, y: -28, scale: 1.06, duration: expansion * 0.48 },
          expansion * 0.4,
        )
        .to(
          overlayRef.current,
          { opacity: 1, y: 0, duration: expansion * 0.32 },
          expansion * 0.68,
        )
        .to({}, { duration: hold })
    },
    {
      scope: rootRef,
      dependencies: [
        enabled,
        endRadius,
        holdDistance,
        mediaZoom,
        overlayScrim,
        scrollDistance,
        smoothing,
        startHeight,
        startRadius,
        startWidth,
        useWindowScroll,
      ],
      revertOnUpdate: true,
    },
  )

  return (
    <div
      ref={rootRef}
      className={cn(styles.root, !useWindowScroll && styles.scroller, className)}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className={styles.track}>
        <div ref={stageRef} className={styles.stage}>
          <div ref={frameRef} className={styles.frame}>
            {/* eslint-disable-next-line @next/next/no-img-element -- asset local animado directamente */}
            <img ref={mediaRef} className={styles.media} src={src} alt={alt} draggable={false} />
            <div ref={scrimRef} className={styles.scrim} aria-hidden="true" />
            {children && (
              <div ref={overlayRef} className={styles.overlay}>
                {children}
              </div>
            )}
          </div>
          {title && (
            <div ref={titleRef} className={styles.title}>
              {title}
            </div>
          )}
          {scrollHint && (
            <div ref={hintRef} className={styles.hint}>
              {scrollHint}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
