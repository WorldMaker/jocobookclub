import { z } from 'zod/v4'
import { UserId } from './user.ts'
import { reverseUlid } from '../util/reverse.ts'

export const Ballot = z.object({
  userId: UserId,
  active: z.boolean(),
  books: z.record(z.number().int().gte(1).lte(5)),
  updated: z.string().datetime({ offset: true }),
})

export type Ballot = z.infer<typeof Ballot>

export async function getUserBallot(kv: Deno.Kv, userId: UserId) {
  const maybeBallot = await kv.get(['ballot', reverseUlid(userId)])
  const ballot = Ballot.safeParse(maybeBallot.value)
  return ballot
}

export function updateUserBallot(kv: Deno.Kv, ballot: Ballot) {
  return kv.set(['ballot', reverseUlid(ballot.userId)], Ballot.parse(ballot))
}
