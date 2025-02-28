import { Hono } from 'hono'
import { queueRecountRequested } from './models/voting.ts'
import { adminToken, type SessionVariables } from './session-token.ts'

const app = new Hono<{ Variables: SessionVariables }>()
  .use('/*', adminToken)
  .post('/recount', async (c) => {
    const result = await queueRecountRequested(c.get('kv'))
    if (!result.ok) {
      return c.json({ error: 'Failed to queue recount' }, 500)
    }
    return c.json({ success: true }, 200)
  })

export default app
