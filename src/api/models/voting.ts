import { z } from 'zod/v4'
import { UserId } from './user.ts'
import { Bucket } from './tally.ts'

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
  return kv.atomic()
    .set(['recount-bucket', bucket], at)
    .enqueue({
      type: 'recount-bucket-requested',
      bucket,
      at,
    })
    .commit()
}

export function queueRecountRequested(kv: Deno.Kv) {
  return kv.enqueue({
    type: 'recount-requested',
    at: new Date(),
  })
}

export function queueTallied(kv: Deno.Kv, bucket: Bucket) {
  return kv.enqueue({
    type: 'bucket-tallied',
    bucket,
    at: new Date(),
  })
}

export function queueVoted(kv: Deno.Kv, userId: UserId) {
  return kv.enqueue({
    type: 'user-voted',
    userId,
    at: new Date(),
  })
}
