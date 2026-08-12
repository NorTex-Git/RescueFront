import { apiRequest } from '@/lib/api/client'

import type { AlertTypeFormValues } from './schema'
import { alertTypesListSchema, type AlertType } from './types'

/**
 * CRUD de tipos de alarma. Ojo al guion: la ruta es `tipos-alarma`, a diferencia de
 * `tipos_empresa`, que va con guion bajo. No normalizar (ver docs/api-contract.md).
 *
 * El blueprint se registra con `url_prefix='/api'` (`core/routes.py:527`).
 */
const BASE = '/api/tipos-alarma'

/**
 * Página amplia a propósito: el listado global viene paginado con `limit` 50 por
 * defecto y la pantalla filtra en cliente. Es el mismo `limit: 200` que pedía el
 * original (`static/js/admin/spa/views/alert-types-main.js:313`).
 */
const LIST_PARAMS = 'page=1&limit=200'

function toPayload(values: AlertTypeFormValues) {
  return {
    nombre: values.nombre,
    descripcion: values.descripcion,
    tipo_alerta: values.tipo_alerta,
    color_alerta: values.color_alerta,
    recomendaciones: values.recomendaciones,
    implementos_necesarios: values.implementos_necesarios,
    ...(values.imagen_base64 ? { imagen_base64: values.imagen_base64 } : {}),
    ...(values.sonido_link ? { sonido_link: values.sonido_link } : {}),
    /*
     * Cadena vacía significa **alerta global**, válida para todas las empresas. Es lo
     * que hacía el interruptor "global" del original (`alert-types-main.js:996`); aquí
     * es la primera opción del select de empresa.
     */
    empresa_id: values.empresa_id,
  }
}

/**
 * Todos los tipos, de todas las empresas y globales, activos e inactivos.
 *
 * El original pedía un endpoint distinto por estado (`/activos`, `/inactivos`, o el
 * listado a secas). Aquí se trae el listado completo una vez y el estado se filtra en
 * cliente, como el resto de pantallas: un viaje en vez de uno por cada cambio de filtro.
 */
export async function listAlertTypes(): Promise<AlertType[]> {
  const raw = await apiRequest<unknown>(`${BASE}?${LIST_PARAMS}`)
  return alertTypesListSchema.parse(raw).data
}

export async function createAlertType(values: AlertTypeFormValues): Promise<void> {
  await apiRequest(BASE, { method: 'POST', body: toPayload(values) })
}

export async function updateAlertType(id: string, values: AlertTypeFormValues): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: 'PUT', body: toPayload(values) })
}

/**
 * Borrado **real**: `delete_one` en `repositories/tipo_alarma_repository.py:350`, a
 * diferencia de empresas y tipos de empresa, donde el `DELETE` es un soft delete.
 * Por eso aquí sí se ofrece "Eliminar" además de desactivar.
 */
export async function deleteAlertType(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}`, { method: 'DELETE' })
}

/** Sin cuerpo: invierte el estado actual. */
export async function toggleAlertTypeStatus(id: string): Promise<void> {
  await apiRequest(`${BASE}/${id}/toggle-status`, { method: 'PATCH' })
}
