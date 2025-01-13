import { z } from 'zod'
import { UserId } from './user.ts'

export const Ballot = z.object({
  userId: UserId,
  books: z.record(z.number().int().gte(1).lte(5)),
})

export type Ballot = z.infer<typeof Ballot>

export async function getUserBallot(kv: Deno.Kv, userId: string) {
  const maybeBallot = await kv.get(['ballot', userId])
  const ballot = Ballot.safeParse(maybeBallot.value)
  return ballot
}

export function updateUserBallot(kv: Deno.Kv, ballot: Ballot) {
  return kv.set(['ballot', ballot.userId], Ballot.parse(ballot))
}
