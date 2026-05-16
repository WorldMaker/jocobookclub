import * as z from 'zod'
import { UserId } from './user.ts'
import { reverseUlid } from '../util/reverse.ts'
import { Mark } from './mark.ts'

export const Rank = z.number().int().gte(1).lte(5)

export type Rank = z.infer<typeof Rank>

export const BookBallot = z.object({
  rank: Rank,
  mark: z.tuple([Mark, z.coerce.date()]).optional(),
})

export type BookBallot = z.infer<typeof BookBallot>

export const Ballot = z.object({
  userId: UserId,
  active: z.boolean(),
  books: z.record(z.string(), z.xor([Rank, BookBallot])),
  updated: z.coerce.date(),
})

export type Ballot = z.infer<typeof Ballot>

export async function getUserBallot(kv: Deno.Kv, userId: UserId) {
  const maybeBallot = await kv.get(['ballot', reverseUlid(userId)])
  const ballot = Ballot.safeParse(maybeBallot.value)
  return ballot
}

export function updateUserBallot(kv: Deno.Kv, ballot: Ballot) {
  return kv.set(['ballot', reverseUlid(ballot.userId)], {
    ...Ballot.parse(ballot),
    updated: new Date(),
  })
}
