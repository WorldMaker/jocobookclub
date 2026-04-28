import { ulid } from '@std/ulid'

/**
 * (Dumb, ugly, neglected queue)
 * A simple queue implementation using Deno's key-value store (Deno.Kv).
 */

/**
 * Enqueue a message to the queue.
 * @param kv KV store
 * @param message Queue message
 * @returns Queue ID
 */
export async function enqueue<MessageType>(kv: Deno.Kv, message: MessageType) {
  const id = ulid()
  await kv.set(['dunq', id], message)
  return id
}

/**
 * Enqueue a message to the queue and start a worker to process it.
 * @param kv KV Store
 * @param message Queue message
 * @returns Queue ID
 */
export async function push<MessageType>(kv: Deno.Kv, message: MessageType) {
  const id = await enqueue(kv, message)
  new Worker(new URL('../dunq-worker.ts', import.meta.url), {
    type: 'module'
  })
  return id
}
