'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from 'react-hook-form'
import type { ZodType } from 'zod'

import { ApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

import { ColorInput } from './color-input'

import type { FormField } from './form-field'
import { Input, Textarea } from './input'
import { Modal, ModalButton, type ModalSize } from './modal'
import { Select } from './select'
import { TagsInput } from './tags-input'

/**
 * Modal de formulario genérico: **uno solo para crear y editar, en todas las features**.
 *
 * Reemplaza los cinco `*-modals.js` (6.523 líneas), donde cada vista reimplementaba a
 * mano el mismo markup, validación y envío. Ojo al dato que motivó esto:
 * `usuarios-modals.js` estaba duplicado en admin y empresa con 38 líneas distintas de
 * ~1520, y las diferencias eran solo nombres de variable.
 *
 * Cada feature aporta tres cosas: un schema Zod, una lista de campos y una función que
 * envía. Nada de markup.
 */
export function FormModal<TValues extends FieldValues>({
  open,
  onClose,
  title,
  description,
  fields,
  schema,
  defaultValues,
  submitLabel = 'Guardar',
  onSubmit,
  icon,
  size = 'lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  fields: FormField<Path<TValues> & string>[]
  /**
   * Entrada y salida son el mismo tipo: el formulario edita exactamente lo que el
   * schema produce. Declararlo así evita que `zodResolver` infiera `unknown` de entrada.
   */
  schema: ZodType<TValues, TValues>
  defaultValues: DefaultValues<TValues>
  submitLabel?: string
  /** Debe lanzar para señalar error; el mensaje se muestra en el modal. */
  onSubmit: (values: TValues) => Promise<void>
  /** Icono del encabezado, como en cada template Jinja. */
  icon?: string
  /**
   * Por defecto `lg` (44rem): con la rejilla de dos columnas cada campo queda en
   * ~20rem, que es de sobra. Sube a `xl` si el formulario tiene muchos campos.
   */
  size?: ModalSize
}) {
  const methods = useForm<TValues>({
    resolver: zodResolver(schema) as Resolver<TValues>,
    defaultValues,
  })

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = methods

  // Al abrir se recarga el formulario: si no, editar A y luego B mostraría los datos de A.
  useEffect(() => {
    if (open) reset(defaultValues)
    // `defaultValues` se re-crea en cada render del padre; la apertura es el disparador real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  const rootError = errors.root?.message

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      onClose()
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'No se pudo completar la operación.',
      })
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      size={size}
      mobileFullscreen
      footer={
        <>
          <ModalButton type="button" icon="times" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </ModalButton>
          <ModalButton
            type="submit"
            form="form-modal"
            variant="primary"
            icon="save"
            loading={isSubmitting}
          >
            {submitLabel}
          </ModalButton>
        </>
      }
    >
      <FormProvider {...methods}>
        <form
          id="form-modal"
          onSubmit={submit}
          noValidate
          className="min-w-0 space-y-5 sm:space-y-6"
        >
          {rootError && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-200"
            >
              {rootError}
            </p>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {fields.map((field) => {
              const message = errors[field.name]?.message
              const common = {
                label: field.label,
                error: typeof message === 'string' ? message : undefined,
                hint: field.hint,
                disabled: field.disabled,
                variant: 'glass' as const,
              }

              return (
                <div
                  key={field.name}
                  className={cn('min-w-0 max-w-full', field.full && 'md:col-span-2')}
                >
                  {field.render ? (
                    <Controller
                      control={control}
                      name={field.name}
                      render={({ field: { value, onChange } }) =>
                        // `?? <></>` porque `render` devuelve `ReactNode`, y `Controller`
                        // exige un elemento.
                        (field.render?.({
                          value,
                          onChange,
                          error: common.error,
                          disabled: field.disabled,
                        }) as React.ReactElement) ?? <></>
                      }
                    />
                  ) : field.type === 'tags' ? (
                    /*
                     * `register` solo sirve para inputs nativos: aquí el valor es un
                     * `string[]` que no vive en ningún elemento del DOM, así que va por
                     * `Controller`.
                     */
                    <Controller
                      control={control}
                      name={field.name}
                      render={({ field: { value, onChange } }) => (
                        <TagsInput
                          {...common}
                          value={Array.isArray(value) ? (value as string[]) : []}
                          onChange={onChange}
                          placeholder={field.placeholder}
                          maxTags={field.maxTags}
                        />
                      )}
                    />
                  ) : field.type === 'color' ? (
                    <Controller
                      control={control}
                      name={field.name}
                      render={({ field: { value, onChange } }) => (
                        <ColorInput
                          {...common}
                          value={typeof value === 'string' ? value : ''}
                          onChange={onChange}
                        />
                      )}
                    />
                  ) : field.type === 'select' ? (
                    /*
                     * Controlado, no con `register`: el desplegable propio no es un
                     * `<select>` nativo, así que no emite eventos de cambio del DOM.
                     */
                    <Controller
                      control={control}
                      name={field.name}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          {...common}
                          value={typeof value === 'string' ? value : ''}
                          onChange={onChange}
                          options={field.options ?? []}
                          // Si el campo ya define una opción de valor vacío, esa es su
                          // propia semántica —"Global", "Todos"— y añadir un
                          // "Selecciona…" delante la duplicaría.
                          placeholder={
                            field.options?.some((option) => option.value === '') ? null : undefined
                          }
                        />
                      )}
                    />
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      {...common}
                      placeholder={field.placeholder}
                      {...register(field.name)}
                    />
                  ) : (
                    <Input
                      {...common}
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      {...register(
                        field.name,
                        field.type === 'number' ? { valueAsNumber: true } : undefined,
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}
