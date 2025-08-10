import { Hono } from 'hono'
import { queueRecountRequested } from './models/voting.ts'
import { adminToken, type SessionVariables } from './session-token.ts'
import { zValidator } from '@hono/zod-validator'
import { Invite, updateInvite } from './models/invite.ts'
import * as z from 'zod'

const app = new Hono<{ Variables: SessionVariables }>()
  .use('/*', adminToken)
  .put(
    '/invite/:inviteId',
    zValidator(
      'param',
      z.object({
        inviteId: z.string().ulid(),
      }),
    ),
    zValidator('json', Invite),
    async (c) => {
      const invite = c.req.valid('json')
      if (c.req.valid('param').inviteId != invite.id) {
        return c.json({ error: 'Invalid invite ID' }, 404)
      }
      const kv = c.get('kv')
      const result = await updateInvite(kv, invite)
      if (!result.ok) {
        return c.json({ error: 'Failed to update invite' }, 500)
      }
      return c.json(invite, 200)
    },
  )
  .post('/recount', async (c) => {
    const result = await queueRecountRequested(c.get('kv'))
    if (!result.ok) {
      return c.json({ error: 'Failed to queue recount' }, 500)
    }
    return c.json({ success: true }, 200)
  })

export default app
