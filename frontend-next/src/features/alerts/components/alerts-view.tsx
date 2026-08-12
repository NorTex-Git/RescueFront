'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DetailModal, type DetailRow, type DetailSection } from '@/components/ui/detail-modal'
import { HeaderStatPill } from '@/components/ui/header-stat-pill'
import { Icon } from '@/components/ui/icon'
import { Input, Textarea } from '@/components/ui/input'
import { Modal, ModalButton } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Table, type Column } from '@/components/ui/table'
import { isGlobalAlertType, type AlertType } from '@/features/alert-types/types'
import { formatTimestamp, titleCase } from '@/features/stats/format'

import { osmEmbedSrc, parseMapCoords } from '@/lib/maps'

import { createEmpresaAlert, deactivateEmpresaAlert, listEmpresaAlerts } from '../api'
import {
  alertContacts,
  alertLocation,
  alertOrigin,
  type Alert,
  type AlertsPage,
  type AlertStatus,
  type CreateAlertInput,
} from '../types'

const PAGE_SIZE = 8
const PANEL =
  'overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]'

function priorityTone(priority: string): 'danger' | 'warning' | 'info' | 'neutral' {
  const value = priority.toLowerCase()
  if (value.includes('crit') || value.includes('alta')) return 'danger'
  if (value.includes('media')) return 'warning'
  if (value.includes('baja')) return 'info'
  return 'neutral'
}

/** Estado "embarcado" (en camino) de cada contacto notificado. */
function EmbarkedBadge({ value }: { value: boolean | null }) {
  if (value === true) return <Badge tone="success">En camino</Badge>
  if (value === false) return <Badge tone="danger">No disponible</Badge>
  return <Badge tone="neutral">Sin respuesta</Badge>
}

function AlertContactsList({ alert }: { alert: Alert }) {
  const contacts = alertContacts(alert)
  if (!contacts.length)
    return <p className="text-[var(--shell-text-muted)]">Sin contactos notificados.</p>

  return (
    <ul className="grid gap-2">
      {contacts.map((contact, index) => (
        <li
          key={contact.numero ?? index}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--shell-border)] px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-[var(--shell-text-strong)]">
              {contact.nombre || 'Contacto'}
            </p>
            {contact.numero && (
              <p className="text-xs text-[var(--shell-text-muted)]">{contact.numero}</p>
            )}
          </div>
          <EmbarkedBadge value={contact.embarcado} />
        </li>
      ))}
    </ul>
  )
}

function AlertLocationMap({ alert }: { alert: Alert }) {
  const location = alertLocation(alert)
  const coords = parseMapCoords(location.osmUrl) ?? parseMapCoords(location.googleUrl)

  if (!coords)
    return (
      <p className="text-[var(--shell-text-muted)]">
        {location.direccion || 'Sin ubicación registrada.'}
      </p>
    )

  const full =
    location.googleUrl ||
    location.osmUrl ||
    `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=${coords.zoom}/${coords.lat}/${coords.lng}`

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-[var(--shell-border)]">
        <iframe
          title="Ubicación de la alerta"
          src={osmEmbedSrc(coords)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-64 w-full"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {location.direccion ? (
          <p className="text-sm text-[var(--shell-text-muted)]">{location.direccion}</p>
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
          Abrir mapa
        </a>
      </div>
    </div>
  )
}

const detailRows: DetailRow<Alert>[] = [
  { label: 'Empresa', icon: 'building', value: (alert) => alert.empresa_nombre || '—' },
  { label: 'Sede', icon: 'location-dot', value: (alert) => alert.sede || '—' },
  { label: 'Prioridad', icon: 'signal', value: (alert) => titleCase(alert.prioridad) },
  {
    label: 'Origen',
    icon: 'bolt',
    value: (alert) => alertOrigin(alert) ?? '—',
  },
  {
    label: 'Creada',
    icon: 'calendar',
    value: (alert) => formatTimestamp(alert.fecha_creacion ?? null),
    full: true,
  },
  {
    label: 'Desactivada',
    icon: 'circle-check',
    value: (alert) => formatTimestamp(alert.fecha_desactivacion ?? null),
    full: true,
  },
]

const detailSections: DetailSection<Alert>[] = [
  {
    title: 'Contactos notificados',
    icon: 'phone',
    content: (alert) => <AlertContactsList alert={alert} />,
  },
  {
    title: 'Ubicación',
    icon: 'map-pin',
    content: (alert) => <AlertLocationMap alert={alert} />,
  },
  {
    title: 'Descripción',
    icon: 'align-left',
    content: (alert) => alert.descripcion || 'Sin descripción.',
  },
  {
    title: 'Instrucciones',
    icon: 'list-check',
    content: (alert) =>
      alert.instrucciones.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {alert.instrucciones.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        'Sin instrucciones registradas.'
      ),
  },
  {
    title: 'Elementos necesarios',
    icon: 'toolbox',
    content: (alert) => alert.elementos_necesarios.join(', ') || 'Sin elementos registrados.',
  },
  {
    title: 'Cierre',
    icon: 'message',
    content: (alert) => alert.mensaje_desactivacion || 'Sin mensaje de cierre.',
  },
]

export function AlertsView({
  empresaId,
  empresaNombre,
  sedes,
  status,
  initialPage,
  alertTypes,
}: {
  empresaId: string
  empresaNombre: string
  sedes: string[]
  status: AlertStatus
  initialPage: AlertsPage
  alertTypes: AlertType[]
}) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deactivating, setDeactivating] = useState<Alert | null>(null)
  const [closingMessage, setClosingMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateAlertInput>({
    sede: sedes[0] ?? '',
    direccion: '',
    tipoAlertaId: '',
    descripcion: '',
    prioridad: 'media',
  })

  const queryKey = ['empresa', empresaId, 'alerts', status, page] as const
  const query = useQuery({
    queryKey,
    queryFn: () => listEmpresaAlerts(empresaId, status, page, PAGE_SIZE),
    initialData: page === 1 ? initialPage : undefined,
    staleTime: 20_000,
    // El backend no emite eventos de "embarcado"; mientras el modal de una alerta
    // activa está abierto, refrescamos esa página cada 12 s para ver los estados en
    // vivo. Fuera de eso el WebSocket (created/deactivated) mantiene la lista al día.
    refetchInterval: selectedId !== null && status === 'active' ? 12_000 : false,
  })
  const pageData = query.data ?? initialPage

  // La alerta del modal se deriva de la query: al refrescar, sus contactos/estado se
  // actualizan solos sin guardar una copia obsoleta.
  const selected = useMemo(
    () => pageData.data.find((alert) => String(alert._id) === selectedId) ?? null,
    [pageData.data, selectedId],
  )

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return pageData.data
    return pageData.data.filter((alert) =>
      [alert.nombre_alerta, alert.tipo_alerta, alert.descripcion, alert.sede, alert.hardware_nombre]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    )
  }, [pageData.data, search])

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ['empresa', empresaId, 'alerts'] })
  }

  async function submitCreate() {
    const type = alertTypes.find((item) => item._id === form.tipoAlertaId)
    if (!form.sede || !form.direccion.trim() || !type || form.descripcion.trim().length < 10) {
      toast.error('Completa la sede, dirección, tipo y una descripción de al menos 10 caracteres.')
      return
    }
    setSubmitting(true)
    try {
      await createEmpresaAlert(empresaId, form, type)
      toast.success('Alerta creada correctamente.')
      setCreateOpen(false)
      setForm({
        sede: sedes[0] ?? '',
        direccion: '',
        tipoAlertaId: '',
        descripcion: '',
        prioridad: 'media',
      })
      setPage(1)
      await refreshAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la alerta.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDeactivate() {
    if (!deactivating) return
    setSubmitting(true)
    try {
      await deactivateEmpresaAlert(deactivating._id, empresaId, closingMessage.trim())
      toast.success('Alerta desactivada correctamente.')
      setDeactivating(null)
      setClosingMessage('')
      await refreshAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desactivar la alerta.')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: Column<Alert>[] = [
    {
      key: 'alert',
      header: 'Alerta',
      cell: (alert) => (
        <div className="flex min-w-52 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-300">
            <Icon name="triangle-exclamation" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--shell-text-strong)]">
              {alert.nombre_alerta || alert.tipo_alerta || 'Alerta'}
            </p>
            <p className="max-w-72 truncate text-xs text-[var(--shell-text-muted)]">
              {alert.descripcion || 'Sin descripción'}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'sede', header: 'Sede', cell: (alert) => alert.sede || '—' },
    {
      key: 'origin',
      header: 'Origen',
      cell: (alert) => alertOrigin(alert) ?? 'Manual',
    },
    {
      key: 'priority',
      header: 'Prioridad',
      cell: (alert) => (
        <Badge tone={priorityTone(alert.prioridad)}>{titleCase(alert.prioridad)}</Badge>
      ),
    },
    {
      key: 'date',
      header: status === 'active' ? 'Creada' : 'Desactivada',
      cell: (alert) => (
        <span className="whitespace-nowrap text-xs">
          {formatTimestamp(
            (status === 'active' ? alert.fecha_creacion : alert.fecha_desactivacion) ?? null,
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cell: (alert) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            title="Ver detalle"
            aria-label="Ver detalle"
            onClick={() => setSelectedId(alert._id)}
          >
            <Icon name="eye" />
          </Button>
          {status === 'active' && (
            <Button
              variant="danger"
              size="sm"
              title="Desactivar"
              aria-label="Desactivar"
              onClick={() => setDeactivating(alert)}
            >
              <Icon name="circle-check" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const pagination = pageData.pagination
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={status === 'active' ? 'bell' : 'clock-rotate-left'}
        title={status === 'active' ? 'Alertas activas' : 'Historial de alertas'}
        subtitle={`${empresaNombre} · actualización automática en tiempo real`}
        stats={
          <HeaderStatPill
            label={status === 'active' ? 'Activas' : 'Registros'}
            value={pagination.total_items}
            tone={status === 'active' ? 'danger' : 'neutral'}
          />
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <Icon name="rotate" className={query.isFetching ? 'animate-spin' : undefined} />
              Actualizar
            </Button>
            {status === 'active' && (
              <Button onClick={() => setCreateOpen(true)}>
                <Icon name="plus" />
                Nueva alerta
              </Button>
            )}
          </div>
        }
      />

      <div className={`${PANEL} mb-4 p-4`}>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por alerta, sede, origen o descripción…"
          aria-label="Buscar alertas"
        />
      </div>

      <section className={PANEL} aria-busy={query.isFetching}>
        <Table
          columns={columns}
          rows={rows}
          rowKey={(alert) => alert._id}
          showIndex
          indexOffset={(page - 1) * PAGE_SIZE}
          emptyState={
            <div className="text-center">
              <Icon name="circle-check" className="mb-3 text-4xl text-emerald-500" />
              <p className="font-semibold text-[var(--shell-text-strong)]">
                {search
                  ? 'No hay coincidencias'
                  : status === 'active'
                    ? 'No hay alertas activas'
                    : 'No hay alertas en el historial'}
              </p>
            </div>
          }
        />
        <Pagination
          page={page}
          pageCount={pagination.total_pages}
          total={pagination.total_items}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </section>

      <DetailModal
        open={selectedId !== null && selected !== null}
        onClose={() => setSelectedId(null)}
        title="Detalle de la alerta"
        description="Información operativa completa"
        icon="triangle-exclamation"
        item={selected}
        heading={{
          title: (alert) => alert.nombre_alerta || alert.tipo_alerta || 'Alerta',
          subtitle: (alert) => alert.tipo_alerta || 'Sin tipo',
        }}
        rows={detailRows}
        sections={detailSections}
        size="lg"
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear alerta"
        description="Notifica al personal de la sede seleccionada"
        icon="bell"
        size="lg"
        footer={
          <>
            <ModalButton onClick={() => setCreateOpen(false)}>Cancelar</ModalButton>
            <ModalButton
              variant="primary"
              icon="paper-plane"
              loading={submitting}
              onClick={() => void submitCreate()}
            >
              Crear alerta
            </ModalButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Sede"
            value={form.sede}
            onChange={(sede) => setForm((current) => ({ ...current, sede }))}
            options={sedes.map((sede) => ({ value: sede, label: sede }))}
          />
          <Select
            label="Tipo de alerta"
            value={form.tipoAlertaId}
            onChange={(tipoAlertaId) => setForm((current) => ({ ...current, tipoAlertaId }))}
            options={alertTypes.map((type) => ({
              value: type._id,
              label: isGlobalAlertType(type) ? `${type.nombre} · Global` : type.nombre,
            }))}
          />
          <Select
            label="Prioridad"
            value={form.prioridad}
            onChange={(prioridad) => setForm((current) => ({ ...current, prioridad }))}
            placeholder={null}
            options={[
              { value: 'baja', label: 'Baja' },
              { value: 'media', label: 'Media' },
              { value: 'alta', label: 'Alta' },
              { value: 'critica', label: 'Crítica' },
            ]}
          />
          <Input
            variant="glass"
            label="Dirección"
            value={form.direccion}
            onChange={(event) =>
              setForm((current) => ({ ...current, direccion: event.target.value }))
            }
            placeholder="Dirección completa de la emergencia"
          />
          <div className="sm:col-span-2">
            <Textarea
              variant="glass"
              label="Descripción"
              rows={5}
              value={form.descripcion}
              onChange={(event) =>
                setForm((current) => ({ ...current, descripcion: event.target.value }))
              }
              placeholder="Describe la situación con al menos 10 caracteres"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        title="Desactivar alerta"
        description={deactivating?.nombre_alerta || deactivating?.tipo_alerta || 'Alerta activa'}
        icon="circle-check"
        size="sm"
        footer={
          <>
            <ModalButton onClick={() => setDeactivating(null)}>Cancelar</ModalButton>
            <ModalButton
              variant="danger"
              loading={submitting}
              onClick={() => void submitDeactivate()}
            >
              Desactivar
            </ModalButton>
          </>
        }
      >
        <Textarea
          variant="glass"
          label="Mensaje de cierre (opcional)"
          value={closingMessage}
          onChange={(event) => setClosingMessage(event.target.value)}
          placeholder="Indica cómo se resolvió la situación"
        />
      </Modal>
    </div>
  )
}
