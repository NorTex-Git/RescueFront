export type MapCoords = { lat: number; lng: number; zoom: number }

/** Extrae lat/lng/zoom de las URLs de mapa del backend (OSM `#map=z/lat/lng` o Google). */
export function parseMapCoords(url: string | null | undefined): MapCoords | null {
  if (!url) return null
  let m = url.match(/#map=(\d+)\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
  if (m) return { zoom: Number(m[1]), lat: Number(m[2]), lng: Number(m[3]) }
  m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)z/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]), zoom: Number(m[3]) }
  m = url.match(/(?:[?&]q=|search\/)(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]), zoom: 15 }
  m = url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
  if (m) {
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng, zoom: 15 }
  }
  return null
}

/** URL de embed de OpenStreetMap con marcador, para un `<iframe>` sin librerías. */
export function osmEmbedSrc({ lat, lng, zoom }: MapCoords): string {
  const spanLng = 360 / 2 ** zoom
  const spanLat = spanLng * 0.6
  const bbox = [lng - spanLng / 2, lat - spanLat / 2, lng + spanLng / 2, lat + spanLat / 2].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}
