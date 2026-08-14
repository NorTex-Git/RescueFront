'use client'

import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icon'
import { useRealtime, type IncomingAlarm } from '@/features/realtime/realtime-provider'

/** Proxy que sirve el audio conservando la sesión (mismo que `MediaAudioPlayer`). */
function soundUrl(source: string) {
  const query = new URLSearchParams({ source })
  return `/api/media/audio?${query.toString()}`
}

/**
 * Solo en la vista empresa: al llegar una alerta reproduce el sonido de su tipo en
 * bucle y muestra un popup chiquito con una bocina animada y un botón para silenciar.
 */
export function AlertSoundNotifier() {
  const { incomingAlarm } = useRealtime()
  const [active, setActive] = useState<IncomingAlarm | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastId = useRef<string | null>(null)

  // Desbloqueo de autoplay: al primer gesto del usuario, "prime" el elemento de audio
  // para que el navegador no bloquee el play() cuando llegue la alerta.
  useEffect(() => {
    function unlock() {
      const a = audioRef.current
      if (a) {
        a.muted = true
        a.play()
          .then(() => {
            a.pause()
            a.currentTime = 0
            a.muted = false
          })
          .catch(() => {
            a.muted = false
          })
      }
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Nueva alerta → mostrar popup y reproducir el sonido del tipo en bucle.
  useEffect(() => {
    if (!incomingAlarm || incomingAlarm.id === lastId.current) return
    lastId.current = incomingAlarm.id
    setActive(incomingAlarm)

    const source =
      typeof incomingAlarm.alert.sonido_link === 'string' ? incomingAlarm.alert.sonido_link : ''
    const audio = audioRef.current
    if (audio && source) {
      audio.src = soundUrl(source)
      audio.loop = true
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
