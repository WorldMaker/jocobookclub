// deno-lint-ignore-file no-import-prefix
import type apiApp from '@worldmaker/jocobookclub-api'
import { hc } from 'npm:hono@^4.6.16/client'

const overrideApiUrl = Deno.env.get('CLUB_API_URL')
const apiUrl = overrideApiUrl ?? 'https://jocobookclub-api.worldmaker.deno.net/'

export const apiClient = hc<typeof apiApp>(apiUrl)
