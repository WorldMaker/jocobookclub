import { ulid } from '@std/ulid'

const EmptyQueueRetries = 3

export async function consume<MessageType>(
  kv: Deno.Kv,
  consumer: (message: MessageType) => Promise<void>,
) {
  const consumerId = ulid()
  console.log('Starting consumer', { consumerId })

  let running = true
  let retries = EmptyQueueRetries

  while (running) {
    let foundMessage = false
    for await (
      const { key, value, versionstamp } of kv.list({ prefix: ['dunq'] })
    ) {
      foundMessage = true
      // attempt dequeue
      const result = await kv.atomic()
        .check({ key, versionstamp })
        .delete(key)
        .commit()
      if (!result.ok) {
        console.log('Message already consumed by another consumer, skipping', {
          consumerId,
          key,
        })
        continue
      }

      console.log('Consuming message', { consumerId, key, value })
      try {
        await consumer(value as MessageType)
      } catch (error) {
        console.error('Error consuming message', { consumerId, key, error })
      }
    }

    if (foundMessage) {
      retries = EmptyQueueRetries
      console.log('Finished consuming messages, checking for more...', {
        consumerId,
      })
      continue
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
