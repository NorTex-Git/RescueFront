'use client'

import { Icon } from '@/components/ui/icon'
import { hardwareCoords, type Hardware } from '../types'

/**
 * Mapa de ubicación del equipo dentro del modal de detalle. Usa el embed de
 * OpenStreetMap (sin dependencias ni scripts externos, solo un iframe) a partir de
 * las coordenadas guardadas en `direccion_open_maps` / `direccion_url`.
 */
export function HardwareLocationMap({ item }: { item: Hardware }) {
  const coords = hardwareCoords(item)

  if (!coords) {
    return (
      <p className="text-sm text-[var(--shell-text-muted)]">
        {item.direccion || 'Sin ubicación registrada para este equipo.'}
      </p>
    )
  }

  const { lat, lng, zoom } = coords
  const spanLng = 360 / 2 ** zoom
  const spanLat = spanLng * 0.6
  const bbox = [lng - spanLng / 2, lat - spanLat / 2, lng + spanLng / 2, lat + spanLat / 2].join(',')
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  const full =
    item.direccion_url || `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
        <iframe
          title={`Ubicación de ${item.nombre}`}
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-72 w-full"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {item.direccion ? (
          <p className="text-sm text-[var(--shell-text-muted)]">{item.direccion}</p>
        ) : (
          <span />
        )}
        <a
          href={full}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--shell-accent)] hover:underline"
        >
          <Icon name="external-link-alt" className="text-xs" />
          Abrir mapa completo
        </a>
      </div>
    </div>
  )
}
