import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import * as z from 'zod'
import { Invite, updateInvite } from './models/invite.ts'
import {
  getAllUserPreferredEmails,
  getUserById,
  getUserIdByEmail,
  UserId,
} from './models/user.ts'
import { pushRecountRequested } from './models/voting.ts'
import { adminToken, type SessionVariables } from './session-token.ts'
import {
  getPreferred,
  type Preferred,
  updatePreferred,
} from './models/preferred.ts'
import { Ballot, getUserBallot, updateUserBallot } from './models/ballot.ts'
import { getBallotEligibleBooks } from './clients/static-api.ts'

export const BallotDeactivationRequest = z.object({
  before: z.coerce.date(),
})

export const PreferredRequest = z.object({
  multiplier: z.number().int().gte(1),
  userIds: z.array(UserId).optional(),
  emails: z.array(z.email()).optional(),
  // TODO: Discord IDs?
})

const app = new Hono<{ Variables: SessionVariables }>()
  .use('/*', adminToken)
  .get('/ballot-stats', async (c) => {
    // TODO: Should this entire thing be a queue operation?
    const kv = c.get('kv')
    const stats: Array<
      {
        updated: string
        userId: string
        email: string
        canEmail: boolean
        ranks: number[]
        bookCount: number
        unrankedBallotCount: number
        percentUnranked: number
      }
    > = []
    const eligibleBooks = await getBallotEligibleBooks()
    for await (const entry of kv.list({ prefix: ['ballot'] })) {
      const maybeBallot = Ballot.safeParse(entry.value)
      if (!maybeBallot.success) {
        console.warn(
          `Failed to parse ballot for ${entry.key}:`,
          maybeBallot.error,
        )
        continue
      }
      const ballot = maybeBallot.data
      const ranks = [
        ...new Set(
          Object.values(ballot.books).map((b) =>
            typeof b === 'number' ? b : b.rank
          ),
        ),
      ]
      const user = await getUserById(kv, ballot.userId)
      if (!user.success) {
        console.warn(
          `No user found for ballot ${entry.key} with userId ${ballot.userId}`,
          user.error,
        )
        continue
      }
      const unrankedBallotCount = eligibleBooks.map((b) => ballot.books[b]).filter(
        (b) => !b,
      ).length
      stats.push({
        updated: ballot.updated.toISOString(),
        userId: ballot.userId,
        email: user.data.email,
        canEmail: user.data.canEmail ?? false,
        ranks,
        bookCount: Object.keys(ballot.books).length,
        unrankedBallotCount,
        percentUnranked: unrankedBallotCount / eligibleBooks.length,
      })
    }
    return c.json({ stats }, 200)
  })
  .get('/ballot-stats/:userId',
    zValidator(
      'param',
      z.object({
        userId: z.ulid(),
      }),
    ), async (c) => {
    const kv = c.get('kv')
    const userId = c.req.param('userId')
    const eligibleBooks = await getBallotEligibleBooks()
    const maybeBallot = await getUserBallot(kv, userId)
    if (!maybeBallot.success) {
      return c.json({ updated: null, unrankedBallotCount: eligibleBooks.length, percentUnranked: 1 }, 200)
    }
    const ballot = maybeBallot.data
    const unrankedBallotCount = eligibleBooks.map((b) => ballot.books[b]).filter(
      (b) => !b,
    ).length
    const percentUnranked = unrankedBallotCount / eligibleBooks.length
    return c.json({ updated: ballot.updated.toISOString(), unrankedBallotCount, percentUnranked }, 200)
  })
  .post(
    '/deactivate-ballots',
    zValidator('json', BallotDeactivationRequest),
    async (c) => {
      // TODO: Should this entire thing be a queue operation?
      const kv = c.get('kv')
      const { before } = c.req.valid('json')
      let deactivatedCount = 0
      for await (const entry of kv.list({ prefix: ['ballot'] })) {
        const maybeBallot = Ballot.safeParse(entry.value)
        if (!maybeBallot.success) {
          console.warn(
            `Failed to parse ballot for ${entry.key}:`,
            maybeBallot.error,
          )
          continue
        }
        const ballot = maybeBallot.data
        if (ballot.updated < before) {
          const deactivatedBallot = {
            ...ballot,
            active: false,
          }
          await updateUserBallot(kv, deactivatedBallot)
          deactivatedCount++
        }
      }
      let queueId: string | null = null
      if (deactivatedCount > 0) {
        queueId = await pushRecountRequested(kv)
      }
      return c.json({ deactivatedCount, queueId }, 200)
    },
  )
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
  .get('/preferred', async (c) => {
    const kv = c.get('kv')
    const preferred = await getPreferred(kv)
    return c.json({
      preferred: {
        multiplier: preferred.multiplier,
        userIds: Array.from(preferred.userIds.values()),
      },
    }, 200)
  })
  .put('/preferred', zValidator('json', PreferredRequest), async (c) => {
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
    return c.json({
      preferred: {
        multiplier: preferred.multiplier,
        userIds: Array.from(preferred.userIds.values()),
      },
      unknownEmails,
      queueId,
    }, 200)
  })
  .post('/recount', async (c) => {
    const queueId = await pushRecountRequested(c.get('kv'))
    return c.json({ queueId }, 200)
  })

export default app
