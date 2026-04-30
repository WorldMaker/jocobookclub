// deno-lint-ignore-file no-import-prefix
import type apiApp from '@worldmaker/jocobookclub-api'
import { hc } from 'npm:hono@^4.6.16/client'

const overrideApiUrl = Deno.env.get('CLUB_API_URL')
const apiUrl = overrideApiUrl ?? 'https://api.jocobook.club'
if (overrideApiUrl) {
  console.log(`Using env provided API URL: ${overrideApiUrl}`)
}

export const apiClient = hc<typeof apiApp>(apiUrl)
