import { consume } from './dunq/consumer.ts'
import { listenQueue } from './queue.ts'

const kv = await Deno.openKv()
consume(kv, (message) => listenQueue(kv, message))
