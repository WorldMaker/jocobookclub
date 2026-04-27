import { ulid } from '@std/ulid'

export async function consume<MessageType>(
  kv: Deno.Kv,
  consumer: (message: MessageType) => Promise<void>,
) {
  const consumerId = ulid()
  console.log('Starting consumer', { consumerId })

  let running = true
  let retries = 3

  while (running) {
    for await (const { key, value, versionstamp } of kv.list({ prefix: ['dunq'] })) {
      // attempt dequeue
      const result = await kv.atomic()
        .check({ key, versionstamp })
        .delete(key)
        .commit()
      if (!result.ok) {
        console.log('Message already consumed by another consumer, skipping', { consumerId, key })
        continue
      }

      console.log('Consuming message', { consumerId, key, value })
      await consumer(value as MessageType)
    }

    if (retries <= 0) {
      console.warn('No messages found, stopping consumer', { consumerId })
      running = false
      break
    }

    console.log('No messages found, retrying...', { consumerId, retries })
    retries--
  }
}
