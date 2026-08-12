/**
 * Porta `utils/images_service.py:_normalize_file_entry` (líneas 27-72).
 *
 * El servicio de imágenes devuelve las entradas de forma inconsistente: a veces una
 * cadena suelta, a veces un objeto cuyo nombre está en `name`, `filename` o `title`, y
 * cuya URL está en `url`, `path` o `download_url`, absoluta o relativa. El contrato
 * (docs/api-contract.md §10) marcaba esto como lógica de negocio a portar, no como
 * ruido: sin ella la mitad de los archivos salen sin URL utilizable.
 */
export type MediaFile = {
  name: string
  displayName: string
  url: string
}

export type MediaCatalog = {
  folders: string[]
  filesByFolder: Record<string, MediaFile[]>
}

export function buildServiceUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function buildFileUrl(base: string, folder: string, file: string): string {
  const safeFolder = encodeURIComponent(folder.replace(/^\/+|\/+$/g, ''))
  // Solo el último segmento: algunas entradas traen la ruta completa como nombre.
  const safeFile = encodeURIComponent(file.split('/').pop() || 'archivo')
  return buildServiceUrl(base, `folders/${safeFolder}/files/${safeFile}`)
}

/** Nombre legible: los guiones y guiones bajos del archivo pasan a espacios. */
function toDisplayName(value: string): string {
  return value.replace(/[_-]/g, ' ').trim()
}

export function normalizeFileEntry(entry: unknown, folder: string, base: string): MediaFile {
  if (entry === null || typeof entry !== 'object') {
    const value = String(entry)
    const name = value.split('/').pop() || 'archivo'
    return {
      name,
      displayName: toDisplayName(name) || name,
      url: buildFileUrl(base, folder, value),
    }
  }

  const record = entry as Record<string, unknown>
  const rawName = record.name ?? record.filename ?? record.title
  const rawPath = record.path ?? record.url ?? record.download_url

  const name =
    String(rawName ?? rawPath ?? 'archivo')
      .split('/')
      .pop() || 'archivo'

  const rawUrl = record.url ?? record.download_url ?? record.path
  let url: string
  if (rawUrl) {
    url = String(rawUrl)
    // Las relativas se completan contra la base del servicio.
    if (!/^https?:\/\//.test(url)) url = buildServiceUrl(base, url)
  } else {
    url = buildFileUrl(base, folder, name)
  }

  const label = record.display_name ?? record.label ?? rawName ?? rawPath ?? name
  return {
    name,
    displayName: toDisplayName(String(label)) || name,
    url,
  }
}

/**
 * Las respuestas del servicio son un array plano o un objeto que lo envuelve bajo
 * `folders`/`files`/`data`/`items`, según el endpoint. Comprobado en el servicio real:
 * `folders` responde `["Arcobot","Imagenes","Sonidos"]` y `files` un array de objetos.
 */
export function unwrapList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const key = keys.find((candidate) => Array.isArray(record[candidate]))
    if (key) return record[key] as unknown[]

    // Un nivel de anidamiento: algunas respuestas envuelven la lista bajo `data`,
    // `result` o `payload` como objeto (`{ data: { files: [...] } }`), no como array.
    for (const wrapper of ['data', 'result', 'payload', 'body']) {
      const inner = record[wrapper]
      if (inner && typeof inner === 'object') {
        const nested = unwrapList(inner, keys)
        if (nested.length) return nested
      }
    }
  }
  return []
}
