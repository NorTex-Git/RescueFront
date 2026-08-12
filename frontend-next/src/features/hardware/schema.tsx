import { z } from 'zod'
import { useFormContext } from 'react-hook-form'

import type { FieldOption, FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'
import type { Empresa } from '@/features/empresas/types'

export const hardwareFormSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  tipo: z.string().trim().min(1, 'El tipo de hardware es obligatorio').max(100),
  empresa_id: z.string().trim().min(1, 'La empresa es obligatoria'),
  empresa_nombre: z.string(),
  sede: z.string().trim().min(1, 'La sede es obligatoria').max(120),
  direccion: z.string().trim().max(250),
  brand: z.string().trim().min(1, 'La marca es obligatoria').max(100),
  model: z.string().trim().min(1, 'El modelo es obligatorio').max(100),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  status: z.enum(['available', 'out_of_stock', 'discontinued']),
  warranty: z.number().int().min(0).max(120),
  description: z.string().trim().max(500),
})

export type HardwareFormValues = z.infer<typeof hardwareFormSchema>

export const HARDWARE_DEFAULTS: HardwareFormValues = {
  nombre: '', tipo: '', empresa_id: '', empresa_nombre: '', sede: '', direccion: '', brand: '', model: '',
  price: 0, stock: 0, status: 'available', warranty: 12, description: '',
}

function EmpresaPicker({
  value,
  onChange,
  empresas,
  error,
}: {
  value: string
  onChange: (value: string) => void
  empresas: Empresa[]
  error?: string
}) {
  const { setValue } = useFormContext<HardwareFormValues>()

  return (
    <Select
      label="Empresa"
      value={value}
      onChange={(empresaId) => {
        const empresa = empresas.find((item) => item._id === empresaId)
        onChange(empresaId)
        setValue('empresa_nombre', empresa?.nombre ?? '')
        setValue('sede', '')
      }}
      options={empresas.map((empresa) => ({ value: empresa._id, label: empresa.nombre }))}
      placeholder="Selecciona una empresa"
      error={error}
      variant="glass"
    />
  )
}

function SedePicker({
  value,
  onChange,
  empresas,
  error,
}: {
  value: string
  onChange: (value: string) => void
  empresas: Empresa[]
  error?: string
}) {
  const { watch } = useFormContext<HardwareFormValues>()
  const empresaId = watch('empresa_id')
  const empresa = empresas.find((item) => item._id === empresaId)
  const sedes = empresa ? (empresa.sedes.length ? empresa.sedes : ['Principal']) : []

  return (
    <Select
      label="Sede"
      value={value}
      onChange={onChange}
      options={sedes.map((sede) => ({ value: sede, label: sede }))}
      placeholder={empresaId ? 'Selecciona una sede' : 'Elige una empresa primero'}
      disabled={!empresaId}
      error={error}
      variant="glass"
    />
  )
}

export function hardwareFields(
  tipos: FieldOption[],
  empresas: Empresa[],
): FormField<keyof HardwareFormValues & string>[] {
  return [
    { name: 'nombre', label: 'Nombre del equipo', placeholder: 'Ej. Sensor térmico norte' },
    { name: 'tipo', label: 'Tipo', type: 'select', options: tipos },
    {
      name: 'empresa_id',
      label: 'Empresa',
      render: ({ value, onChange, error }) => (
        <EmpresaPicker value={typeof value === 'string' ? value : ''} onChange={onChange} empresas={empresas} error={error} />
      ),
    },
    {
      name: 'sede',
      label: 'Sede',
      render: ({ value, onChange, error }) => (
        <SedePicker value={typeof value === 'string' ? value : ''} onChange={onChange} empresas={empresas} error={error} />
      ),
    },
    { name: 'direccion', label: 'Dirección / ubicación', placeholder: 'Ubicación del equipo', full: true },
    { name: 'brand', label: 'Marca', placeholder: 'Ej. Hikvision' },
    { name: 'model', label: 'Modelo', placeholder: 'Ej. DS-2CD' },
    { name: 'price', label: 'Precio', type: 'number', placeholder: '0' },
    { name: 'stock', label: 'Stock', type: 'number', placeholder: '0' },
    { name: 'status', label: 'Estado de inventario', type: 'select', options: [
      { value: 'available', label: 'Disponible' },
      { value: 'out_of_stock', label: 'Sin stock' },
      { value: 'discontinued', label: 'Descontinuado' },
    ] },
    { name: 'warranty', label: 'Garantía (meses)', type: 'number', placeholder: '12' },
    { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción técnica u observaciones', full: true },
  ]
}
