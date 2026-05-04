import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import * as z from 'zod'
import { Invite, updateInvite } from './models/invite.ts'
import { getAllUserPreferredEmails, getUserIdByEmail, UserId } from './models/user.ts'
import { pushRecountRequested } from './models/voting.ts'
import { adminToken, type SessionVariables } from './session-token.ts'
import { type Preferred, updatePreferred } from './models/preferred.ts'

export const PreferredRequest = z.object({
  multiplier: z.number().int().gte(1),
  userIds: z.array(UserId).optional(),
  emails: z.array(z.email()).optional(),
  // TODO: Discord IDs?
})

const app = new Hono<{ Variables: SessionVariables }>()
  .use('/*', adminToken)
  .get('/emails', async (c) => {
    const kv = c.get('kv')
    const emails = await getAllUserPreferredEmails(kv)
    return c.json({ emails }, 200)
  })
  .put(
    '/invite/:inviteId',
    zValidator(
      'param',
      z.object({
        inviteId: z.ulid(),
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
  .post('/preferred', zValidator('json', PreferredRequest), async (c) => {
    const kv = c.get('kv')
    const body = c.req.valid('json')
    const preferred: Preferred = {
      multiplier: body.multiplier,
      userIds: new Set(body.userIds ?? []),
    }
    const unknownEmails = []
    if (body.emails) {
      for (const email of body.emails) {
        const userId = await getUserIdByEmail(kv, email)
        if (userId.success) {
          preferred.userIds.add(userId.data)
        } else {
          unknownEmails.push(email)
        }
      }
    }
    const result = await updatePreferred(kv, preferred)
    if (!result.ok) {
      return c.json({ error: 'Failed to update preferred' }, 500)
    }
    const queueId = await pushRecountRequested(c.get('kv'))
    return c.json({ preferred, unknownEmails, queueId }, 200)
  })
  .post('/recount', async (c) => {
    const queueId = await pushRecountRequested(c.get('kv'))
    return c.json({ success: true, queueId }, 200)
  })

export default app
