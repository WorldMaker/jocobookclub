import { z } from 'zod'
import { UserId } from './user.ts'
import type { Bucket } from './tally.ts'

/**
 * A message that can be enqueued to the voting queue.
 * 
 * @see docs/voting.md
 */
export const QueueMessages = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bucket-tallied'),
    bucket: z.string(),
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
