import type apiApp from '@worldmaker/jocobookclub-api'
import { hc } from 'hono/client'

export const apiClient = hc<typeof apiApp>('https://api.jocobook.club')
