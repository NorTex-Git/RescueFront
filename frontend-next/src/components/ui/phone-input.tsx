'use client'

import { useId } from 'react'
import PhoneNumberInput, {
  getCountryCallingCode,
  type Country,
  type Value,
} from 'react-phone-number-input'
import labels from 'react-phone-number-input/locale/es.json'

import { cn } from '@/lib/utils'

import { Field, fieldClass, type FieldVariant } from './input'
import { Select } from './select'

type LibraryCountryOption = {
  value?: Country
  label: string
  divider?: boolean
}

function flagOf(country: Country): string {
  return country
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

function SearchableCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
}: {
  value?: Country
  onChange: (country?: Country) => void
  options: LibraryCountryOption[]
  disabled?: boolean
  readOnly?: boolean
}) {
  const countryOptions = options
    .filter((option): option is LibraryCountryOption & { value: Country } =>
      Boolean(option.value && !option.divider),
    )
    .map((option) => {
      const flag = flagOf(option.value)
      const callingCode = `+${getCountryCallingCode(option.value)}`
      return {
        value: option.value,
        label: `${flag} ${option.label} (${callingCode})`,
        shortLabel: `${flag} ${callingCode}`,
      }
    })

  return (
    <div className="w-[7.5rem] shrink-0 sm:w-[8.5rem]">
      <Select
        value={value ?? 'CO'}
        onChange={(country) => onChange(country as Country)}
        options={countryOptions}
        placeholder={null}
        disabled={disabled || readOnly}
        searchable
        searchPlaceholder="Buscar país o prefijo"
        menuMinWidth={320}
        buttonClassName={cn(
          '!rounded-xl !border-0 !bg-black/5 !px-2.5 !py-2 shadow-none',
          'dark:!bg-white/8 focus:!ring-1',
        )}
      />
    </div>
  )
}

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
        countrySelectComponent={SearchableCountrySelect}
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
