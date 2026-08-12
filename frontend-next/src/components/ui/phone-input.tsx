'use client'

import { useId } from 'react'
import PhoneNumberInput, { type Value } from 'react-phone-number-input'
import labels from 'react-phone-number-input/locale/es.json'

import { cn } from '@/lib/utils'

import { Field, fieldClass, type FieldVariant } from './input'

export function InternationalPhoneInput({
  value,
  onChange,
  label,
  error,
  hint,
  disabled,
  variant = 'glass',
  id,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  hint?: string
  disabled?: boolean
  variant?: FieldVariant
  id?: string
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field id={inputId} label={label} error={error} hint={hint} variant={variant}>
      <PhoneNumberInput
        id={inputId}
        value={(value || undefined) as Value | undefined}
        onChange={(nextValue) => onChange(nextValue ?? '')}
        defaultCountry="CO"
        international
        countryCallingCodeEditable={false}
        addInternationalOption={false}
        labels={labels}
        disabled={disabled}
        limitMaxLength
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        numberInputProps={{ autoComplete: 'tel', inputMode: 'tel' }}
        className={cn(
          fieldClass(variant, error),
          '!flex items-center gap-3',
          '[&_.PhoneInputCountry]:m-0 [&_.PhoneInputCountry]:shrink-0',
          '[&_.PhoneInputCountryFlag]:text-lg',
          '[&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:flex-1',
          '[&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent',
          '[&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:text-inherit',
          '[&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:ring-0',
          '[&_.PhoneInputCountrySelect]:cursor-pointer',
        )}
      />
    </Field>
  )
}
