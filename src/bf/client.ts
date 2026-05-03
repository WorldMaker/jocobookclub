import type apiApp from '@worldmaker/jocobookclub-api'
import { hc } from 'hono/client'

const overrideApiUrl = localStorage.getItem('override/api-url')
const apiUrl = overrideApiUrl ?? 'https://jocobookclub-api.worldmaker.deno.net/'
if (overrideApiUrl) {
  console.warn(`Using overridden API URL: ${overrideApiUrl}`)
}

export const apiClient = hc<typeof apiApp>(apiUrl)
