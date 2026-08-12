'use client'

import { apiRequest } from '@/lib/api/client'
import type { ContactFormValues } from './schema'

type ContactResponse = { success?: boolean; message?: string }

export function sendContactRequest(values: ContactFormValues) {
  return apiRequest<ContactResponse>('/api/contact/send', { method: 'POST', body: values })
}
