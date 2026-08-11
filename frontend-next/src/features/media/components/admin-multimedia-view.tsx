'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormModal } from '@/components/ui/form-modal'
import type { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal, ModalButton } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { createFolder, deleteFolder, fetchFiles, fetchFolders, uploadFile } from '../api'
import type { MediaFile } from '../normalize'
import {
  FILE_BASENAME_PATTERN,
  createFolderSchema,
  type CreateFolderValues,
} from '../schema'
import { MediaAudioPlayer } from './media-audio-player'

const FOLDERS_KEY = ['media-folders'] as const

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a']

function hasExtension(name: string, extensions: string[]): boolean {
  return extensions.some((extension) => name.toLowerCase().endsWith(`.${extension}`))
}

/** Paleta de tiles por tarjeta, ciclada por índice (diseño `admin-shell-v2.pen`). */
const CARD_TONES = [
  'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
]

/** Icono según el nombre de la carpeta, para acercarse a las categorías del mockup. */
function folderIcon(folder: string): string {
  const f = folder.toLowerCase()
  if (f.includes('siren')) return 'fas fa-tower-broadcast'
  if (f.includes('camar') || f.includes('camera')) return 'fas fa-video'
  if (f.includes('panic') || f.includes('boton')) return 'fas fa-bell'
  if (f.includes('logo')) return 'fas fa-image'
  if (f.includes('campan') || f.includes('campaign')) return 'fas fa-bullhorn'
  if (f.includes('manual')) return 'fas fa-book'
  return 'fas fa-folder'
}

/** Nombre legible de una carpeta, como `_format_folder_display` del Flask (`app.py:1076`). */
function folderDisplayName(folder: string): string {
  const cleaned = folder.replace(/[_-]/g, ' ').trim()
  if (!cleaned) return 'Carpeta'
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const createFolderFields: FormField<'name'>[] = [
  {
    name: 'name',
    label: 'Nombre visible',
    placeholder: 'Ej. campanas-otono',
    hint: 'Letras, números, guion o guion bajo. Se envía como identificador de la carpeta.',
    full: true,
  },
]

export function AdminMultimediaView({ initialFolders }: { initialFolders: string[] }) {
  const queryClient = useQueryClient()

  const { data: folders = [], isFetching } = useQuery({
    queryKey: FOLDERS_KEY,
    queryFn: fetchFolders,
    initialData: initialFolders,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewFolder, setViewFolder] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const invalidateFolders = () => queryClient.invalidateQueries({ queryKey: FOLDERS_KEY })

  return (
    <>
      <PageHeader
        icon="fas fa-photo-video"
        title="Biblioteca Multimedia"
        titleBadge={`${folders.length} ${folders.length === 1 ? 'carpeta' : 'carpetas'}`}
        subtitle="Carpetas y archivos sincronizados desde el servicio multimedia"
        actions={
          <>
            {isFetching && <span className="text-xs opacity-60">Actualizando…</span>}
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(true)}
              disabled={isFetching && folders.length === 0}
            >
              <i className="fas fa-folder-plus" />
              Crear directorio
            </Button>
            <Button onClick={() => setUploadOpen(true)} disabled={folders.length === 0}>
              <i className="fas fa-plus" />
              Agregar archivo
            </Button>
          </>
        }
      />

      {folders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--shell-border)] bg-[var(--shell-surface)] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--shell-accent-soft)] text-2xl text-[var(--shell-accent)]">
            <i className="fas fa-folder-open" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--shell-text-strong)]">
            Sin carpetas disponibles
          </h3>
          <p className="mt-1 text-sm text-[var(--shell-text-muted)]">
            Crea el primer directorio o confirma que el servicio esté en línea.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder, index) => (
            <FolderCard
              key={folder}
              folder={folder}
              index={index}
              onView={() => setViewFolder(folder)}
              onDelete={() => setDeleteTarget(folder)}
            />
          ))}
        </div>
      )}

      <FormModal<CreateFolderValues>
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear nuevo directorio"
        description="Asigna un nombre para la carpeta en el servicio multimedia"
        icon="fas fa-folder-plus"
        iconGradient="from-indigo-500 to-purple-600"
        fields={createFolderFields}
        schema={createFolderSchema}
        defaultValues={{ name: '' }}
        submitLabel="Crear directorio"
        onSubmit={async (values) => {
          await createFolder(values.name)
          await invalidateFolders()
          toast.success('Directorio creado')
        }}
      />

      <UploadModal
        // Al remontar en cada apertura, el formulario nace limpio sin resetear estado
        // en un efecto (que dispara renders en cascada).
        key={uploadOpen ? 'upload-open' : 'upload-closed'}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folders={folders}
        onUploaded={async () => {
          await invalidateFolders()
          toast.success('Archivo cargado')
        }}
      />

      <ViewFolderModal folder={viewFolder} onClose={() => setViewFolder(null)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar directorio"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        icon="fas fa-trash"
        headerIcon="fas fa-triangle-exclamation"
        iconGradient="from-red-500 to-rose-700"
        onConfirm={async () => {
          if (!deleteTarget) return
          await deleteFolder(deleteTarget)
          await invalidateFolders()
          toast.success('Directorio eliminado')
        }}
      >
        <p className="text-sm text-gray-700 dark:text-white/80">
          Se eliminará <strong>{deleteTarget ? folderDisplayName(deleteTarget) : ''}</strong> y su
          contenido en el servicio multimedia. Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </>
  )
}

function FolderCard({
  folder,
  index,
  onView,
  onDelete,
}: {
  folder: string
  index: number
  onView: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] p-5 transition-colors hover:border-[var(--shell-accent)]/40">
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Eliminar ${folderDisplayName(folder)}`}
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-sm text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20 focus-visible:opacity-100 dark:text-red-300"
      >
        <i className="fas fa-trash" />
      </button>

      <div
        className={cn(
          'mb-4 flex size-12 items-center justify-center rounded-xl text-xl',
          CARD_TONES[index % CARD_TONES.length],
        )}
      >
        <i className={folderIcon(folder)} />
      </div>

      <h3
        className="truncate text-base font-semibold text-[var(--shell-text-strong)]"
        title={folder}
      >
        {folderDisplayName(folder)}
      </h3>
      <p className="mt-0.5 truncate text-xs text-[var(--shell-text-muted)]" title={folder}>
        {folder}
      </p>

      <div className="mt-4">
        <Button size="sm" variant="secondary" onClick={onView}>
          <i className="fas fa-eye" />
          Ver archivos
        </Button>
      </div>
    </div>
  )
}

function UploadModal({
  open,
  onClose,
  folders,
  onUploaded,
}: {
  open: boolean
  onClose: () => void
  folders: string[]
  onUploaded: () => Promise<void>
}) {
  // Estado inicial limpio en cada apertura: el padre remonta con `key` (no hay efecto
  // de reset que dispare renders en cascada).
  const [folder, setFolder] = useState('')
  const [filename, setFilename] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function close() {
    if (submitting) return
    onClose()
  }

  async function submit() {
    setError(null)

    if (!folder) return setError('Selecciona una carpeta destino.')
    if (!FILE_BASENAME_PATTERN.test(filename.trim())) {
      return setError('El nombre solo admite letras, números, guion o guion bajo (máx. 120).')
    }
    if (!file) return setError('Selecciona un archivo para cargar.')

    setSubmitting(true)
    try {
      await uploadFile({ folder, filename: filename.trim(), file })
      await onUploaded()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar el archivo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Agregar archivo multimedia"
      description="Selecciona la carpeta destino y adjunta el archivo"
      icon="fas fa-upload"
      iconGradient="from-emerald-500 to-lime-500"
      footer={
        <>
          <ModalButton icon="fas fa-times" onClick={close} disabled={submitting}>
            Cancelar
          </ModalButton>
          <ModalButton
            variant="primary"
            icon="fas fa-cloud-upload-alt"
            loading={submitting}
            onClick={submit}
          >
            Guardar archivo
          </ModalButton>
        </>
      }
    >
      <div className="space-y-5">
        <Select
          label="Carpeta destino"
          value={folder}
          onChange={setFolder}
          options={folders.map((name) => ({ value: name, label: folderDisplayName(name) }))}
          placeholder="Selecciona una carpeta"
          variant="glass"
        />

        <Input
          label="Nombre del archivo"
          value={filename}
          onChange={(event) => setFilename(event.target.value)}
          placeholder="Ej. banner_home"
          hint="Escribe el nombre final del archivo, sin la extensión."
          variant="glass"
        />

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white/85">
            Selecciona el archivo
          </label>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className={cn(
              'w-full rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm',
              'text-gray-700 dark:border-white/15 dark:bg-white/8 dark:text-white/85',
              'file:mr-4 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2',
              'file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600',
            )}
          />
          {file && (
            <p className="mt-2 truncate text-xs text-gray-600 dark:text-white/60" title={file.name}>
              <i className="fas fa-paperclip mr-1.5" />
              {file.name}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

function ViewFolderModal({ folder, onClose }: { folder: string | null; onClose: () => void }) {
  const {
    data: files = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['media-files', folder],
    queryFn: () => fetchFiles(folder as string),
    // Solo se piden los archivos de la carpeta abierta.
    enabled: folder !== null,
  })

  // Render progresivo: se pintan por lotes para no volcar cientos de nodos de una vez;
  // las imágenes además usan `loading="lazy"`, así el navegador solo descarga las que
  // entran en viewport. Entre las dos, la carpeta "va apareciendo" en vez de bloquearse.
  const BATCH = 12
  const [visible, setVisible] = useState(BATCH)
  // Al cambiar de carpeta, volver a empezar por el primer lote.
  useEffect(() => {
    setVisible(BATCH)
  }, [folder])

  return (
    <Modal
      open={folder !== null}
      onClose={onClose}
      title={folder ? folderDisplayName(folder) : 'Carpeta'}
      description="Archivos disponibles en la carpeta sincronizada"
      icon="fas fa-eye"
      iconGradient="from-sky-500 to-indigo-500"
      size="xl"
      footer={
        <ModalButton icon="fas fa-times" onClick={onClose}>
          Cerrar
        </ModalButton>
      }
    >
      {isPending ? (
        <p className="py-8 text-center text-sm text-gray-600 dark:text-white/60">Cargando…</p>
      ) : error ? (
        // Se muestra el mensaje real del servicio (la ruta lo propaga): una carpeta con
        // contenido que sale vacía casi siempre es un fallo del microservicio, no que no
        // tenga archivos, y así se puede diagnosticar en vez de adivinar.
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-red-600 dark:text-red-300">
            No se pudieron cargar los archivos
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-white/60">
            {error instanceof Error ? error.message : 'Error desconocido del servicio multimedia.'}
          </p>
        </div>
      ) : files.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600 dark:text-white/60">
          Esta carpeta no tiene archivos.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {files.slice(0, visible).map((mediaFile) => (
              <FilePreview key={mediaFile.url} file={mediaFile} />
            ))}
          </ul>
          {visible < files.length && (
            <div className="mt-5 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVisible((count) => count + BATCH)}
              >
                <i className="fas fa-arrow-down" />
                Cargar más ({files.length - visible} restantes)
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

function FilePreview({ file }: { file: MediaFile }) {
  const isImage = hasExtension(file.name, IMAGE_EXTENSIONS)
  const isAudio = hasExtension(file.name, AUDIO_EXTENSIONS)

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <i
          className={cn(
            'text-sm',
            isImage
              ? 'fas fa-image text-sky-600 dark:text-sky-300'
              : isAudio
                ? 'fas fa-volume-high text-indigo-600 dark:text-indigo-300'
                : 'fas fa-file text-gray-500 dark:text-white/50',
          )}
        />
        <p className="truncate text-sm font-semibold" title={file.displayName}>
          {file.displayName}
        </p>
      </div>

      {isImage ? (
        // `img` y no `next/image`: el host es externo (ver nota en `asset-picker.tsx`).
        // `loading="lazy"` + `decoding="async"`: el navegador solo descarga la imagen
        // cuando entra en viewport, así una carpeta grande no baja todo de golpe.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.url}
          alt={file.displayName}
          loading="lazy"
          decoding="async"
          className="h-40 w-full rounded-xl bg-slate-100/75 object-contain p-2 dark:bg-black/20"
        />
      ) : isAudio ? (
        <MediaAudioPlayer src={file.url} />
      ) : (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300"
        >
          <i className="fas fa-external-link-alt" />
          Abrir archivo
        </a>
      )}
    </li>
  )
}
