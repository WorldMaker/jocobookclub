import { z } from 'zod'

export const Invite = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('open-enrollment'),
  }),
  z.object({
    id: z.string(),
    type: z.literal('specific-email'),
    email: z.email(),
  }),
])

export type Invite = z.infer<typeof Invite>

export async function getInviteById(kv: Deno.Kv, id: string) {
  const maybeInvite = await kv.get(['invite', id])
  return Invite.safeParse(maybeInvite.value)
}

const defaultExpireIn = 48 /* hours */ * 60 /* mins */ * 60 /* secs */ *
  1000 /* ms */

export function updateInvite(
  kv: Deno.Kv,
  invite: Invite,
  expireIn = defaultExpireIn,
) {
  return kv.set(['invite', invite.id], Invite.parse(invite), { expireIn })
}
