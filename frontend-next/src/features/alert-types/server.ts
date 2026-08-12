import type { FieldOption } from '@/components/ui/form-field'
import { apiFetch } from '@/lib/api/server'

import { alertLevelsSchema, alertTypesListSchema, type AlertType } from './types'

/**
 * Todos los tipos, de todas las empresas y globales, activos e inactivos. El estado
 * se filtra luego en cliente.
 *
 * `limit` amplio porque el listado viene paginado de 50 en 50; es el mismo valor que
 * pedía el original (`static/js/admin/spa/views/alert-types-main.js:313`).
 */
export async function fetchAlertTypes(): Promise<AlertType[]> {
  const raw = await apiFetch<unknown>('/api/tipos-alarma?page=1&limit=200')
  return alertTypesListSchema.parse(raw).data
}

/**
 * Severidad de cada nivel, y el orden en que se ofrecen.
 *
 * Los valores los define el backend (`TipoAlarma.TIPOS_ALERTA`), pero la severidad es
 * texto de interfaz que solo existe en el frontend: viene de
 * `templates/admin/spa/views/alert_types.html:235`.
 *
 * `AZUL` no aparece ahí, pese a estar en el enum. No se omite: se lista al final sin
 * severidad, porque esconderlo dejaría sin poder editar una alerta que ya lo use.
 */
const SEVERIDAD: Record<string, string> = {
  ROJO: 'Rojo (Crítica)',
  NARANJA: 'Naranja (Alta)',
  AMARILLO: 'Amarillo (Media)',
  VERDE: 'Verde (Baja)',
}

const ORDEN = ['ROJO', 'NARANJA', 'AMARILLO', 'VERDE']

/** Capitaliza un nivel que el backend añada y el frontend aún no conozca. */
function fallbackLabel(nivel: string): string {
  return nivel.charAt(0) + nivel.slice(1).toLowerCase()
}

/**
 * Niveles de alerta. Los valores los sirve el backend desde su propio enum, para que
 * añadir uno no obligue a tocar dos repositorios; aquí solo se les pone etiqueta.
 */
export async function fetchAlertLevels(): Promise<FieldOption[]> {
  const raw = await apiFetch<unknown>('/api/tipos-alarma/tipos-alerta')
  const niveles = alertLevelsSchema.parse(raw).data

  return [...niveles]
    .sort((a, b) => {
      // Los conocidos por gravedad; los que no, detrás y en el orden del backend.
      const posA = ORDEN.indexOf(a)
      const posB = ORDEN.indexOf(b)
      return (posA === -1 ? ORDEN.length : posA) - (posB === -1 ? ORDEN.length : posB)
    })
    .map((nivel) => ({ value: nivel, label: SEVERIDAD[nivel] ?? fallbackLabel(nivel) }))
}
