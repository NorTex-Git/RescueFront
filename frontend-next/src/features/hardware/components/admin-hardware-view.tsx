'use client'

import { Icon } from '@/components/ui/icon'
import { CrudView, type CrudResource } from '@/components/crud/crud-view'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FieldOption } from '@/components/ui/form-field'
import { PrimaryCell } from '@/components/ui/primary-cell'
import type { Empresa } from '@/features/empresas/types'
import type { LoadResult } from '@/load-result'
import { formatDate } from '@/features/stats/format'
import { matchesText } from '@/hooks/use-filters'

import { createHardware, listHardware, toggleHardwareStatus, updateHardware } from '../api'
import {
  HARDWARE_DEFAULTS,
  hardwareFields,
  hardwareFormSchema,
  type HardwareFormValues,
} from '../schema'
import { detailsOf, physicalStatusOf, type Hardware } from '../types'

function money(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function inventoryStatus(item: Hardware) {
  const details = detailsOf(item)
  if (!item.activa) return 'Inactivo'
  if (details.status === 'discontinued') return 'Descontinuado'
  if (details.status === 'out_of_stock' || details.stock === 0) return 'Sin stock'
  return 'Disponible'
}

function normalizedPhysicalStatus(item: Hardware) {
  return physicalStatusOf(item).trim().toLowerCase()
}

function isPhysicalInactive(item: Hardware) {
  return ['inactivo', 'inactive', 'desactivado', 'offline'].includes(normalizedPhysicalStatus(item))
}

function isPhysicalActive(item: Hardware) {
  return ['activo', 'active', 'online'].includes(normalizedPhysicalStatus(item))
}

function buildResource(
  tipos: FieldOption[],
  empresas: Empresa[],
  scope?: { empresaId: string; empresaNombre: string },
): CrudResource<Hardware, HardwareFormValues> {
  const readOnly = Boolean(scope)
  return {
    queryKey: ['hardware', scope?.empresaId ?? 'all'],
    queryFn: () => listHardware(scope?.empresaId),
    readOnly,
    getId: (item) => item._id,
    rowClassName: (item) =>
      isPhysicalInactive(item)
        ? 'bg-red-500/15 hover:!bg-red-500/20'
        : isPhysicalActive(item)
          ? 'bg-emerald-500/10 hover:!bg-emerald-500/15'
          : undefined,
    labelOf: (item) => item.nombre,
    icon: 'microchip',
    header: {
      icon: 'microchip',
      title: 'Hardware',
      subtitle: scope
        ? `Equipos y estado físico de ${scope.empresaNombre}`
        : 'Inventario y equipos registrados',
    },
    headerStats: (items) => [
      { label: 'Activos', value: items.filter((item) => item.activa).length, tone: 'success' },
      {
        label: 'Sin stock',
        value: items.filter(
          (item) => detailsOf(item).status === 'out_of_stock' || detailsOf(item).stock === 0,
        ).length,
        tone: 'warning',
      },
      {
        label: 'Descontinuados',
        value: items.filter((item) => detailsOf(item).status === 'discontinued').length,
        tone: 'danger',
      },
    ],

    singular: 'equipo',
    plural: 'equipos',
    emptyMessage: 'Aún no hay equipos registrados. Crea el primero para iniciar el inventario.',
    emptyState: readOnly
      ? undefined
      : ({ openCreate }) => (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-[var(--shell-accent-soft)] text-2xl text-[var(--shell-accent)]">
              <Icon name="microchip" />
            </span>
            <div>
              <p className="text-base font-semibold text-[var(--shell-text-strong)]">
                Aún no hay hardware registrado
              </p>
              <p className="mt-1 text-sm text-[var(--shell-text-muted)]">
                Registra el primer dispositivo para iniciar el inventario.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Icon name="plus" />
              Nuevo Hardware
            </Button>
          </div>
        ),
    columns: [
      {
        key: 'nombre',
        header: 'Equipo',
        cell: (item) => (
          <PrimaryCell
            icon="microchip"
            title={item.nombre || '—'}
            subtitle={item.empresa_nombre || undefined}
          />
        ),
      },
      { key: 'tipo', header: 'Tipo', cell: (item) => item.tipo || '—' },
      {
        key: 'marca-modelo',
        header: 'Marca / modelo',
        cell: (item) => {
          const details = detailsOf(item)
          return [details.brand, details.model].filter(Boolean).join(' · ') || '—'
        },
      },
      { key: 'sede', header: 'Sede', cell: (item) => item.sede || '—' },
      { key: 'stock', header: 'Stock', cell: (item) => detailsOf(item).stock },
      {
        key: 'estado-fisico',
        header: 'Estado físico',
        cell: (item) => (
          <span
            className={
              isPhysicalInactive(item)
                ? 'font-medium text-red-600 dark:text-red-300'
                : isPhysicalActive(item)
                  ? 'font-medium text-emerald-600 dark:text-emerald-300'
                  : 'font-medium text-gray-500 dark:text-white/45'
            }
          >
            {physicalStatusOf(item) || 'Sin reporte'}
          </span>
        ),
      },
    ],
    filters: [
      {
        key: 'buscar',
        label: 'Buscar equipo',
        placeholder: 'Nombre, tipo, marca, modelo o sede',
        match: (item, value) => {
          const details = detailsOf(item)
          return matchesText(
            [item.nombre, item.tipo, item.sede, item.empresa_nombre, details.brand, details.model],
            value,
          )
        },
      },
      {
        key: 'estado',
        label: 'Estado administrativo',
        initial: 'all',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Activos' },
          { value: 'inactive', label: 'Inactivos' },
        ],
        match: (item, value) => (value === 'active' ? item.activa : !item.activa),
      },
      {
        key: 'estado-fisico',
        label: 'Estado físico',
        initial: 'all',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Activos' },
          { value: 'inactive', label: 'Inactivos' },
          { value: 'unknown', label: 'Sin reporte' },
        ],
        match: (item, value) =>
          value === 'active'
            ? isPhysicalActive(item)
            : value === 'inactive'
              ? isPhysicalInactive(item)
              : !physicalStatusOf(item),
      },
      {
        key: 'inventario',
        label: 'Inventario',
        initial: 'all',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'available', label: 'Disponible' },
          { value: 'out_of_stock', label: 'Sin stock' },
          { value: 'discontinued', label: 'Descontinuado' },
        ],
        match: (item, value) => detailsOf(item).status === value,
      },
    ],
    detailTitle: 'Detalle del equipo',
    detailDescription: 'Configuración, ubicación e inventario',
    detailIcon: 'microchip',
    detailSize: 'lg',
    detailHeading: {
      title: (item) => item.nombre,
      subtitle: (item) => {
        const details = detailsOf(item)
        return [details.brand, details.model].filter(Boolean).join(' · ') || item.tipo || 'Sin tipo'
      },
    },
    detailRows: [
      {
        icon: 'circle-check',
        label: 'Activo',
        value: (item) => <StatusBadge active={item.activa} />,
      },
      {
        icon: 'satellite-dish',
        label: 'Estado físico',
        value: (item) => physicalStatusOf(item) || 'Sin reporte',
      },
      { icon: 'boxes-stacked', label: 'Inventario', value: (item) => inventoryStatus(item) },
      { icon: 'tags', label: 'Tipo', value: (item) => item.tipo || '—' },
      {
        icon: 'building',
        label: 'Empresa',
        value: (item) => item.empresa_nombre || item.empresa_id || '—',
      },
      { icon: 'location-dot', label: 'Sede', value: (item) => item.sede || '—' },
      { icon: 'map-pin', label: 'Ubicación', value: (item) => item.direccion || '—' },
      { icon: 'copyright', label: 'Marca', value: (item) => detailsOf(item).brand || '—' },
      { icon: 'barcode', label: 'Modelo', value: (item) => detailsOf(item).model || '—' },
      {
        icon: 'dollar-sign',
        label: 'Precio',
        value: (item) => money(detailsOf(item).price),
      },
      {
        icon: 'cubes',
        label: 'Stock',
        value: (item) => `${detailsOf(item).stock} unidades`,
      },
      {
        icon: 'shield-halved',
        label: 'Garantía',
        value: (item) => `${detailsOf(item).warranty} meses`,
      },
      {
        icon: 'calendar',
        label: 'Creación',
        value: (item) => formatDate(item.fecha_creacion),
      },
    ],
    detailSections: [
      {
        icon: 'align-left',
        title: 'Descripción',
        content: (item) => <p>{detailsOf(item).description || 'Sin descripción.'}</p>,
      },
    ],
    fields: hardwareFields(tipos, empresas),
    formDescription: 'Los datos técnicos se guardan junto al equipo.',
    formSize: 'xl',
    schema: hardwareFormSchema,
    emptyValues: HARDWARE_DEFAULTS,
    toFormValues: (item) => {
      const details = detailsOf(item)
      return {
        nombre: item.nombre,
        tipo: item.tipo ?? '',
        empresa_id: item.empresa_id ?? '',
        empresa_nombre: item.empresa_nombre ?? '',
        sede: item.sede ?? '',
        direccion: item.direccion ?? '',
        brand: details.brand,
        model: details.model,
        price: details.price,
        stock: details.stock,
        status: ['available', 'out_of_stock', 'discontinued'].includes(details.status)
          ? (details.status as HardwareFormValues['status'])
          : 'available',
        warranty: details.warranty,
        description: details.description,
      }
    },
    create: createHardware,
    update: (item, values) => updateHardware(item._id, values),
    toggle: {
      isActive: (item) => item.activa,
      run: (item) => toggleHardwareStatus(item._id, !item.activa),
    },
  }
}

export function HardwareView({
  hardwareLoad,
  tiposLoad,
  empresasLoad,
  scope,
}: {
  hardwareLoad: LoadResult<Hardware[]>
  tiposLoad: LoadResult<FieldOption[]>
  empresasLoad: LoadResult<Empresa[]>
  scope?: { empresaId: string; empresaNombre: string }
}) {
  const tipos = tiposLoad.ok ? tiposLoad.data : []
  const empresas = empresasLoad.ok ? empresasLoad.data : []

  return (
    <CrudView
      resource={buildResource(tipos, empresas, scope)}
      initialLoad={hardwareLoad}
      dependencyLoads={scope ? [] : [tiposLoad, empresasLoad]}
    />
  )
}

export function AdminHardwareView(props: {
  hardwareLoad: LoadResult<Hardware[]>
  tiposLoad: LoadResult<FieldOption[]>
  empresasLoad: LoadResult<Empresa[]>
}) {
  return <HardwareView {...props} />
}
