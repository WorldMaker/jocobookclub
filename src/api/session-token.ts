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

export const superToken = bearerAuth({
  verifyToken: (token, c) => {
    const superToken = Deno.env.get('SUPER_TOKEN')
    if (!superToken) {
      console.warn('SUPER_TOKEN is not set in environment variables')
      return false
    }
    if (token !== superToken) {
      return false
    }
    const superTokenAdminCapable =
      Deno.env.get('SUPER_TOKEN_ADMIN_CAPABLE') === 'true'
    c.set(
      'session',
      {
        token,
        userId: '🦹 Super Token',
        expiresAt: new Date(),
        admin: superTokenAdminCapable,
      } satisfies Session,
    )
    return true
  },
})
