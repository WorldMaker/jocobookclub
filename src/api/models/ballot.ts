import * as z from 'zod'
import { UserId } from './user.ts'
import { reverseUlid } from '../util/reverse.ts'
import { Mark } from './mark.ts'

export const Vote = z.number().int().gte(1).lte(5)

export type Vote = z.infer<typeof Vote>

export const BookBallot = z.object({
  vote: Vote,
  mark: z.tuple([Mark, z.coerce.date()]).optional(),
})

export const Ballot = z.object({
  userId: UserId,
  active: z.boolean(),
  books: z.record(z.string(), z.xor([Vote, BookBallot])),
  updated: z.coerce.date(),
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
