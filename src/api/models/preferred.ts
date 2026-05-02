import * as z from 'zod'
import { UserId } from './user.ts'

export const Preferred = z.object({
  multiplier: z.number().int().gte(1),
  userIds: z.set(UserId),
})

export type Preferred = z.infer<typeof Preferred>

export async function getPreferred(kv: Deno.Kv) {
  const preferred = await kv.get(['preferred'])
  return Preferred.safeParse(preferred.value)
}

export function setPreferred(kv: Deno.Kv, preferred: Preferred) {
  Preferred.parse(preferred)
  return kv.set(['preferred'], preferred)
}
