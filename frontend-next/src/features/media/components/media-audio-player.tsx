'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type MediaAudioPlayerProps = {
  src: string
  onError?: () => void
}

function playableAudioUrl(source: string) {
  // `source` se envia completo y sin interpretarlo. La ruta conserva la sesion y los
  // rangos de audio para que el primer play quede esperando la descarga si hace falta.
  const query = new URLSearchParams({ source })
  return `/api/media/audio?${query.toString()}`
}

/**
 * Reproductor unico para cualquier modal.
 *
 * La URL reproducible se asigna desde el primer render. Asi, si el usuario pulsa play
 * durante la descarga, el navegador conserva esa intencion y empieza apenas puede.
 * No hay temporizadores, Blob intermedio ni reconstruccion de la URL recibida.
 */
export function MediaAudioPlayer(props: MediaAudioPlayerProps) {
  return <MediaAudioPlayerInstance key={props.src} {...props} />
}

function MediaAudioPlayerInstance({ src, onError }: MediaAudioPlayerProps) {
  const [repeat, setRepeat] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const onErrorRef = useRef(onError)
  const playbackUrl = playableAudioUrl(src)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  return (
    <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/10 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <audio
          controls
          preload="auto"
          src={playbackUrl}
          loop={repeat}
          aria-busy={!ready && !failed}
          onLoadStart={() => {
            setReady(false)
            setFailed(false)
          }}
          onCanPlay={() => setReady(true)}
          onCanPlayThrough={() => setReady(true)}
          onError={() => {
            setReady(false)
            setFailed(true)
            onErrorRef.current?.()
          }}
          onWaiting={() => setReady(false)}
          className="min-w-0 flex-1"
        >
          Tu navegador no puede reproducir este audio.
        </audio>

        <button
          type="button"
          onClick={() => setRepeat((current) => !current)}
          aria-label={repeat ? 'Desactivar repeticion' : 'Repetir sonido'}
          aria-pressed={repeat}
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors',
            repeat
              ? 'border-indigo-500/40 bg-indigo-600 text-white'
              : 'border-black/10 bg-white/60 text-gray-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/70',
          )}
        >
          <i className="fas fa-repeat" />
        </button>
      </div>

      <p
        role={failed ? 'alert' : undefined}
        className={cn(
          'mt-2 text-xs',
          failed
            ? 'font-semibold text-red-600 dark:text-red-300'
            : 'text-gray-600 dark:text-white/65',
        )}
      >
        {failed
          ? 'El sonido no se pudo cargar.'
          : !ready
            ? 'Descargando o preparando sonido...'
            : 'Sonido listo.'}
      </p>
    </div>
  )
}
