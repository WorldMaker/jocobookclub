import * as z from 'zod'
import { atomicEnqueue, enqueue, push } from '../dunq/model.ts'
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
