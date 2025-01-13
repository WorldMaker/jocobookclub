import { z } from 'zod'
import { UserId } from './user.ts'

export const QueueMessages = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user-voted'),
    userId: UserId,
    at: z.date(),
  }),
])

export type QueueMessages = z.infer<typeof QueueMessages>

export function queueVoted(kv: Deno.Kv, userId: UserId) {
  return kv.enqueue({
    type: 'user-voted',
    userId,
    at: new Date(),
  })
}
