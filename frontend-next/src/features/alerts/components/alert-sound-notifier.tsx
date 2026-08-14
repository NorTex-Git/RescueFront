'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icon'
import { listAlertTypes } from '@/features/alert-types/api'
import { useRealtime, type IncomingAlarm } from '@/features/realtime/realtime-provider'

/** Proxy que sirve el audio conservando la sesión (mismo que `MediaAudioPlayer`). */
function soundUrl(source: string) {
  const query = new URLSearchParams({ source })
  return `/api/media/audio?${query.toString()}`
}

/**
 * Solo en la vista empresa: al llegar una alerta reproduce el sonido de su tipo en
 * bucle y muestra un popup chiquito con una bocina animada y un botón para silenciar.
 *
 * Los sonidos de todos los tipos se **precargan en segundo plano** (como blobs en
 * memoria = cache de sesión) apenas monta el portal, para que suenen al instante sin
 * esperar la descarga cuando llega la alerta.
 */
export function AlertSoundNotifier() {
  const { incomingAlarm } = useRealtime()
  const [active, setActive] = useState<IncomingAlarm | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastId = useRef<string | null>(null)
  // sonido_link -> object URL (blob ya descargado). Cache de sesión (se limpia al recargar).
  const cacheRef = useRef<Map<string, string>>(new Map())
  const unlockedRef = useRef(false)

  // Tipos de alerta (traen sonido_link). Cache de react-query; refresco perezoso.
  const { data: alertTypes } = useQuery({
    queryKey: ['alert-types'],
    queryFn: listAlertTypes,
    staleTime: 5 * 60_000,
  })

  // Precarga en segundo plano: descarga cada sonido único a un blob en memoria.
  useEffect(() => {
    if (!alertTypes) return
    let cancelled = false
    const cache = cacheRef.current
    const urls = [...new Set(alertTypes.map((t) => t.sonido_link).filter(Boolean) as string[])]
    for (const source of urls) {
      if (cache.has(source)) continue
      fetch(soundUrl(source), { credentials: 'same-origin' })
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => {
          if (!blob || cancelled || cache.has(source)) return
          cache.set(source, URL.createObjectURL(blob))
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [alertTypes])

  // Libera los object URLs al desmontar.
  useEffect(() => {
    const cache = cacheRef.current
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url)
      cache.clear()
    }
  }, [])

  // Desbloqueo de autoplay: al primer gesto reproduce un sonido precargado en mute para
  // "habilitar" el elemento; así el play() disparado por el WebSocket no queda bloqueado.
  useEffect(() => {
    function tryUnlock() {
      if (unlockedRef.current) return
      const audio = audioRef.current
      const anyBlob = cacheRef.current.values().next().value as string | undefined
      if (!audio || !anyBlob) return // aún sin sonidos precargados; se reintenta al próximo gesto
      audio.src = anyBlob
      audio.loop = false
      audio.muted = true
      audio
        .play()
        .then(() => {
          audio.pause()
          audio.currentTime = 0
          audio.muted = false
          unlockedRef.current = true
          window.removeEventListener('pointerdown', tryUnlock)
          window.removeEventListener('keydown', tryUnlock)
        })
        .catch(() => {
          audio.muted = false
        })
    }
    window.addEventListener('pointerdown', tryUnlock)
    window.addEventListener('keydown', tryUnlock)
    return () => {
      window.removeEventListener('pointerdown', tryUnlock)
      window.removeEventListener('keydown', tryUnlock)
    }
  }, [])

  // Nueva alerta → mostrar popup y reproducir el sonido del tipo en bucle (desde cache).
  useEffect(() => {
    if (!incomingAlarm || incomingAlarm.id === lastId.current) return
    lastId.current = incomingAlarm.id
    setActive(incomingAlarm)

    const source =
      typeof incomingAlarm.alert.sonido_link === 'string' ? incomingAlarm.alert.sonido_link : ''
    const audio = audioRef.current
    if (audio && source) {
      // Instantáneo si ya está en cache; si no, cae al proxy (y se descarga al vuelo).
      audio.src = cacheRef.current.get(source) ?? soundUrl(source)
      audio.loop = true
      audio.muted = false
      audio.currentTime = 0
      void audio.play().catch(() => {})
    }
  }, [incomingAlarm])

  function silence() {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setActive(null)
  }

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      {active && (
        <div className="fixed bottom-4 right-4 z-[10001] flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-red-500/30 bg-[var(--shell-surface)] px-4 py-3 shadow-2xl">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-300">
            <Icon name="volume-high" className="animate-pulse text-lg" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--shell-text-strong)]">
              {active.alert.nombre_alerta || active.alert.tipo_alerta || 'Nueva alerta'}
            </p>
            <p className="truncate text-xs text-[var(--shell-text-muted)]">
              {[active.alert.empresa_nombre, active.alert.sede].filter(Boolean).join(' · ') ||
                'Alerta entrante'}
            </p>
          </div>
          <button
            type="button"
            onClick={silence}
            className="shrink-0 rounded-full border border-[var(--shell-border)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-text-strong)] transition-colors hover:bg-[var(--shell-bg)]"
          >
            Silenciar
          </button>
        </div>
      )}
    </>
  )
}
