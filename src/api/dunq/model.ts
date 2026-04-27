import { ulid } from '@std/ulid'

/*
 * (Dumb, ugly, neglected queue)
 * A simple queue implementation using Deno's key-value store (Deno.Kv).
 */

export async function enqueue<MessageType>(kv: Deno.Kv, message: MessageType) {
  const id = ulid()
  await kv.set(['dunq', id], message)
  return id
}
