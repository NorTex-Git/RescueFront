'use client'

import { useCallback, useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import styles from './glass-surface.module.css'

type Channel = 'R' | 'G' | 'B' | 'A'

type GlassSurfaceProps = {
  children: ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  borderWidth?: number
  brightness?: number
  opacity?: number
  blur?: number
  displace?: number
  backgroundOpacity?: number
  saturation?: number
  distortionScale?: number
  redOffset?: number
  greenOffset?: number
  blueOffset?: number
  xChannel?: Channel
  yChannel?: Channel
  mixBlendMode?: CSSProperties['mixBlendMode']
  className?: string
  style?: CSSProperties
}

type GlassStyle = CSSProperties & {
  '--glass-frost': number
  '--glass-saturation': number
  '--filter-id': string
}

export function GlassSurface({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'screen',
  className,
  style,
}: GlassSurfaceProps) {
  const uniqueId = useId().replace(/:/g, '-')
  const filterId = `glass-filter-${uniqueId}`
  const redGradientId = `red-gradient-${uniqueId}`
  const blueGradientId = `blue-gradient-${uniqueId}`
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<SVGFEImageElement>(null)
  const redRef = useRef<SVGFEDisplacementMapElement>(null)
  const greenRef = useRef<SVGFEDisplacementMapElement>(null)
  const blueRef = useRef<SVGFEDisplacementMapElement>(null)
  const blurRef = useRef<SVGFEGaussianBlurElement>(null)

  const updateMap = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || !imageRef.current) return
    const edge = Math.min(rect.width, rect.height) * borderWidth * 0.5
    const innerWidth = Math.max(rect.width - edge * 2, 0)
    const innerHeight = Math.max(rect.height - edge * 2, 0)
    const svg = `<svg viewBox="0 0 ${rect.width} ${rect.height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${redGradientId}" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="${blueGradientId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="${rect.width}" height="${rect.height}" fill="black"/><rect width="${rect.width}" height="${rect.height}" rx="${borderRadius}" fill="url(#${redGradientId})"/><rect width="${rect.width}" height="${rect.height}" rx="${borderRadius}" fill="url(#${blueGradientId})" style="mix-blend-mode:${mixBlendMode}"/><rect x="${edge}" y="${edge}" width="${innerWidth}" height="${innerHeight}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/></svg>`
    imageRef.current.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`)
  }, [
    blueGradientId,
    blur,
    borderRadius,
    borderWidth,
    brightness,
    mixBlendMode,
    opacity,
    redGradientId,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const safari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const supported =
      !safari &&
      !/Firefox/.test(navigator.userAgent) &&
      CSS.supports('backdrop-filter', `url(#${filterId})`)
    container.dataset.svgSupported = String(supported)

    const channels = [
      [redRef, redOffset],
      [greenRef, greenOffset],
      [blueRef, blueOffset],
    ] as const
    for (const [ref, offset] of channels) {
      ref.current?.setAttribute('scale', String(distortionScale + offset))
      ref.current?.setAttribute('xChannelSelector', xChannel)
      ref.current?.setAttribute('yChannelSelector', yChannel)
    }
    blurRef.current?.setAttribute('stdDeviation', String(displace))
    updateMap()

    let animationFrame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(updateMap)
    })
    observer.observe(container)
    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
    }
  }, [
    blueOffset,
    displace,
    distortionScale,
    filterId,
    greenOffset,
    redOffset,
    updateMap,
    xChannel,
    yChannel,
  ])

  const containerStyle: GlassStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': `url(#${filterId})`,
  }

  return (
    <div
      ref={containerRef}
      data-svg-supported="false"
      className={cn(styles.surface, className)}
      style={containerStyle}
    >
      <svg className={styles.filter} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feImage
              ref={imageRef}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              ref={redRef}
              in="SourceGraphic"
              in2="map"
              result="red-displacement"
            />
            <feColorMatrix
              in="red-displacement"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              ref={greenRef}
              in="SourceGraphic"
              in2="map"
              result="green-displacement"
            />
            <feColorMatrix
              in="green-displacement"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              ref={blueRef}
              in="SourceGraphic"
              in2="map"
              result="blue-displacement"
            />
            <feColorMatrix
              in="blue-displacement"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="red-green" />
            <feBlend in="red-green" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={blurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
