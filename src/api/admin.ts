import { bearerAuth } from 'hono/bearer-auth'
import { getSessionByToken, type Session } from './models/session.ts'
import type { KvProvidedVariables } from './kv.ts'
import { Hono } from 'hono'
import { queueRecountRequested } from './models/voting.ts'

interface Variables extends KvProvidedVariables {
  session: Session
}

const app = new Hono<{ Variables: Variables }>()
  .use(
    '/*',
    bearerAuth({
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
    }),
  )
  .post('/recount', async (c) => {
    const result = await queueRecountRequested(c.get('kv'))
    if (!result.ok) {
      return c.json({ error: 'Failed to queue recount' }, 500)
    }
    return c.json({ success: true }, 200)
  })

export default app
