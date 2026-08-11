'use client'

import { Icon } from '@/components/ui/icon'
import { useState } from 'react'

import { Field } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type { MediaCatalog } from '../normalize'
import { MediaAudioPlayer } from './media-audio-player'

/** Extensiones por tipo de recurso, como filtraba `filterFilesByType` del original. */
const EXTENSIONS: Record<AssetKind, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
  sound: ['mp3', 'wav', 'ogg', 'm4a'],
}

export type AssetKind = 'image' | 'sound'

/**
 * Elige un archivo del servicio de imágenes: primero la carpeta, luego el archivo.
 *
 * Porta el par de selectores en cascada del formulario original
 * (`static/js/admin/spa/views/alert-types-main.js:1414-1570`). El valor guardado es la
 * **URL** del archivo, que es lo que espera el backend en `imagen_base64` y
 * `sonido_link`.
 *
 * Sirve para los dos: la única diferencia es qué extensiones se listan.
 */
export function AssetPicker({
  value,
  onChange,
  kind,
  catalog,
  label,
  error,
  hint,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  kind: AssetKind
  catalog: MediaCatalog
  label: string
  error?: string
  hint?: string
  disabled?: boolean
}) {
  /**
   * `null` mientras el usuario no haya tocado el selector: entonces la carpeta se
   * deduce de la URL ya guardada (ver `derivedFolder`). Al editar llega la URL pero no
   * la carpeta de la que salió, y sin deducirla los selectores aparecerían vacíos, como
   * si no hubiera nada elegido.
   */
  const [pickedFolder, setPickedFolder] = useState<string | null>(null)

  const folders = catalog.folders

  // En edicion solo se usa coincidencia exacta con la URL recibida. No se interpreta
  // ni se reconstruye su estructura.
  const derivedFolder =
    folders.find((name) =>
      (catalog.filesByFolder[name] ?? []).some((file) => file.url === value),
    ) ?? ''
  const folder = pickedFolder ?? derivedFolder

  const files = folder ? (catalog.filesByFolder[folder] ?? []) : []

  const matching = files.filter((file) =>
    EXTENSIONS[kind].some((extension) => file.name.toLowerCase().endsWith(`.${extension}`)),
  )
  const selectedFile = files.find((file) => file.url === value)

  return (
    <Field id={`asset-${kind}`} label={label} error={error} hint={hint} variant="glass">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Carpeta"
          value={folder}
          onChange={(next) => {
            setPickedFolder(next)
            // Cambiar de carpeta invalida el archivo elegido: seguiría apuntando a la
            // anterior y el usuario no lo vería.
            onChange('')
          }}
          options={folders.map((name) => ({ value: name, label: name }))}
          placeholder={
            folders.length === 0 ? 'No hay carpetas disponibles' : 'Selecciona una carpeta'
          }
          disabled={disabled || folders.length === 0}
        />

        <Select
          label="Archivo"
          value={value}
          onChange={onChange}
          options={matching.map((file) => ({ value: file.url, label: file.displayName }))}
          placeholder={
            !folder
              ? 'Elige una carpeta primero'
              : matching.length === 0
                ? 'Sin archivos compatibles'
                : 'Selecciona un archivo'
          }
          disabled={disabled || !folder || matching.length === 0}
        />
      </div>

      {value && (
        <AssetPreview
          key={value}
          kind={kind}
          url={value}
          name={selectedFile?.displayName}
          onClear={() => onChange('')}
        />
      )}
    </Field>
  )
}

/**
 * Vista previa de lo elegido: la imagen se ve, el sonido se escucha.
 *
 * El sonido queda asignado en cuanto se elige en el selector, igual que la imagen. Antes
 * había un paso extra ("Usar este sonido") que solo se desbloqueaba tras reproducir la
 * muestra, y su estado se escribía tocando el DOM a mano (`ref.current.disabled`), fuera
 * de React: cualquier re-render lo revertía. Con el audio roto, además, nunca llegaba a
 * habilitarse y el sonido no se podía asignar.
 */
function AssetPreview({
  kind,
  url,
  name,
  onClear,
}: {
  kind: AssetKind
  url: string
  name?: string
  onClear: () => void
}) {
  const displayName = name || 'Archivo seleccionado'
  const [audioFailed, setAudioFailed] = useState(false)

  return (
    <div
      className={cn(
        'relative mt-4 flex flex-col gap-3 overflow-hidden rounded-2xl border p-3',
        'border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/5',
      )}
    >
      <div className="flex w-full items-center gap-3 pr-10">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300">
          <Icon className={kind === 'image' ? 'fas fa-image' : 'fas fa-volume-high'} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-white/50">Vista previa</p>
          <p className="truncate text-sm font-semibold" title={displayName}>
            {displayName}
          </p>
        </div>
      </div>

      {kind === 'image' ? (
        // `img` y no `next/image`: el host es externo y configurarlo en `next.config`
        // para una miniatura de formulario no compensa.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Vista previa de ${displayName}`}
          className="h-64 w-full rounded-xl bg-slate-100/75 p-3 object-contain sm:h-72 dark:bg-black/20"
        />
      ) : (
        <div className="space-y-3">
          <MediaAudioPlayer src={url} onError={() => setAudioFailed(true)} />
          {audioFailed && (
            <p role="alert" className="text-xs font-semibold text-red-600 dark:text-red-300">
              Este archivo no se pudo reproducir. Revísalo antes de guardar la alerta.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onClear}
        aria-label="Quitar selección"
        className="absolute top-3 right-3 flex size-9 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-sm text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300"
      >
        <Icon className="fas fa-times" />
      </button>
    </div>
  )
}
