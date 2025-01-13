import { z } from 'zod'
import { UserId } from './user.ts'

export const Ballot = z.object({
  userId: UserId,
  active: z.boolean(),
  books: z.record(z.number().int().gte(1).lte(5)),
  updated: z.string().datetime({ offset: true }),
})

export type Ballot = z.infer<typeof Ballot>

/**
 * Reverse the ULID string
 *
 * General reversing of strings is usually not a good idea (for example, it can break Unicode characters),
 * but we know the ULID is a fixed-length string with a limited character set.
 *
 * We are reversing the ULID to get a more interestingly bucketed key in the KV store. Assuming the random
 * part of the ULID is well-distributed, reversing the ULID will distribute the keys in the KV store in a
 * relatively random way, whereas the original ULID would have the keys in a more sequential cluster due to
 * the time component.
 * @param ulid ULID
 * @returns Reversed ULID
 */
function reverseUlid(ulid: UserId) {
  return [...ulid].reverse().join('')
}

export async function getUserBallot(kv: Deno.Kv, userId: UserId) {
  const maybeBallot = await kv.get(['ballot', reverseUlid(userId)])
  const ballot = Ballot.safeParse(maybeBallot.value)
  return ballot
}

export function updateUserBallot(kv: Deno.Kv, ballot: Ballot) {
  return kv.set(['ballot', reverseUlid(ballot.userId)], Ballot.parse(ballot))
}
