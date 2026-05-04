import * as z from 'zod'
import { UserId } from './user.ts'

export const Preferred = z.object({
  multiplier: z.number().int().gte(1),
  userIds: z.set(UserId),
})

export type Preferred = z.infer<typeof Preferred>

export async function getPreferred(kv: Deno.Kv): Promise<Preferred> {
  const preferred = await kv.get(['preferred'])
  const result = Preferred.safeParse(preferred.value)
  if (!result.success) {
    return { multiplier: 1, userIds: new Set<string>() }
  }
  return result.data
}

export function setPreferred(kv: Deno.Kv, preferred: Preferred) {
  Preferred.parse(preferred)
  return kv.set(['preferred'], preferred)
}
