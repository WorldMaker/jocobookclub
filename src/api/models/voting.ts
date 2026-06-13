import * as z from 'zod'
import { atomicEnqueue, enqueue, push } from '../dunq/model.ts'
import { UserId } from './user.ts'
import {
  addTally,
  Bucket,
  type EligibleBooks,
  getTally,
  type Leaderboard,
  TallyBooksMismatchError,
  tallyFinal,
  zeroTally,
} from './tally.ts'
import type { Preferred } from './preferred.ts'

/**
 * A message that can be enqueued to the voting queue.
 *
 * @see docs/voting.md
 */
export const QueueMessages = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bucket-tallied'),
    bucket: Bucket,
    at: z.date(),
  }),
  z.object({
    type: z.literal('recount-bucket-requested'),
    bucket: Bucket,
    at: z.date(),
  }),
  z.object({
    type: z.literal('recount-requested'),
    at: z.date(),
  }),
  z.object({
    type: z.literal('user-voted'),
    userId: UserId,
    at: z.date(),
  }),
])

export type QueueMessages = z.infer<typeof QueueMessages>

export function queueRecountBucketRequested(kv: Deno.Kv, bucket: Bucket) {
  const at = new Date()
  return atomicEnqueue(kv.atomic(), {
    type: 'recount-bucket-requested',
    bucket,
    at,
  })
    .set(['recount-bucket', bucket], at)
    .commit()
}

export function pushRecountRequested(kv: Deno.Kv) {
  return push(kv, {
    type: 'recount-requested',
    at: new Date(),
  })
}

export function queueTallied(kv: Deno.Kv, bucket: Bucket) {
  return enqueue(kv, {
    type: 'bucket-tallied',
    bucket,
    at: new Date(),
  })
}

export function pushVoted(kv: Deno.Kv, userId: UserId) {
  return push(kv, {
    type: 'user-voted',
    userId,
    at: new Date(),
  })
}

export async function tallyFinalRanking(
  kv: Deno.Kv,
  books: EligibleBooks,
  preferred: Preferred,
) {
  let finalTally = zeroTally(books, preferred)
  let invalidBuckets = false
  for (const bucket of Bucket.options) {
    const tally = await getTally(kv, bucket)
    if (!tally.success) {
      await queueRecountBucketRequested(kv, bucket)
      console.warn('Invalid tally found, requesting recount for bucket', {
        bucket,
      })
      invalidBuckets = true
      continue
    }
    try {
      finalTally = addTally(finalTally, tally.data, preferred)
    } catch (error) {
      if (error instanceof TallyBooksMismatchError) {
        await queueRecountBucketRequested(kv, bucket)
        console.warn('Tally books mismatch, requesting recount for bucket', {
          bucket,
        })
        invalidBuckets = true
        continue
      }
      throw error
    }
  }
  if (invalidBuckets) {
    throw new Error('Invalid buckets found, recount requested')
  }
  return {
    finalTally: tallyFinal(finalTally),
    leaderboard: {
      leaders: finalTally.userSupports,
      updated: new Date(),
    } satisfies Leaderboard,
  }
}
