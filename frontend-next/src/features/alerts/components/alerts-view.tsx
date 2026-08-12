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
import type { AlertType } from '@/features/alert-types/types'
import { formatTimestamp, titleCase } from '@/features/stats/format'

import { createEmpresaAlert, deactivateEmpresaAlert, listEmpresaAlerts } from '../api'
import type { Alert, AlertsPage, AlertStatus, CreateAlertInput } from '../types'

const PAGE_SIZE = 8
const PANEL =
  'overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]'

function textFrom(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function priorityTone(priority: string): 'danger' | 'warning' | 'info' | 'neutral' {
  const value = priority.toLowerCase()
  if (value.includes('crit') || value.includes('alta')) return 'danger'
  if (value.includes('media')) return 'warning'
  if (value.includes('baja')) return 'info'
  return 'neutral'
}

const detailRows: DetailRow<Alert>[] = [
  { label: 'Empresa', icon: 'building', value: (alert) => alert.empresa_nombre || '—' },
  { label: 'Sede', icon: 'location-dot', value: (alert) => alert.sede || '—' },
  { label: 'Prioridad', icon: 'signal', value: (alert) => titleCase(alert.prioridad) },
  {
    label: 'Origen',
    icon: 'bolt',
    value: (alert) =>
      textFrom(alert.activacion_alerta, 'nombre') ||
      textFrom(alert.data, 'origen') ||
      alert.hardware_nombre ||
      '—',
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
  const [selected, setSelected] = useState<Alert | null>(null)
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
  })
  const pageData = query.data ?? initialPage

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
      cell: (alert) =>
        textFrom(alert.activacion_alerta, 'nombre') ||
        alert.hardware_nombre ||
        titleCase(textFrom(alert.data, 'origen') || 'manual'),
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
            onClick={() => setSelected(alert)}
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
        open={selected !== null}
        onClose={() => setSelected(null)}
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
            options={alertTypes.map((type) => ({ value: type._id, label: type.nombre }))}
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
