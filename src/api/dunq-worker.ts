import { consume } from './dunq/consumer.ts'
import { listenQueue } from './queue.ts'

const kv = await Deno.openKv()
await consume(kv, (message) => listenQueue(kv, message))
