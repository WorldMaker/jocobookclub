import { bearerAuth } from 'hono/bearer-auth'
import { getSessionByToken, type Session } from './models/session.ts'
import type { KvProvidedVariables } from './kv.ts'

export interface SessionVariables extends KvProvidedVariables {
  session: Session
}

export const sessionToken = bearerAuth({
  verifyToken: async (token, c) => {
    const kv = c.get('kv')
    const session = await getSessionByToken(kv, token)
    if (!session.success) {
      return false
    }
    c.set('session', session.data)
    return true
  },
})

export const adminToken = bearerAuth({
  verifyToken: async (token, c) => {
    const kv = c.get('kv')
    const session = await getSessionByToken(kv, token)
    if (!session.success) {
      return false
    }
    if (!session.data.admin) {
      return false
    }
    c.set('session', session.data)
    return true
  },
})
