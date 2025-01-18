import { z } from 'zod'
import { UserId } from './user.ts'

export const Session = z.object({
  token: z.string(),
  userId: UserId,
  expiresAt: z.date(),
})

export type Session = z.infer<typeof Session>

export async function getSessionByToken(kv: Deno.Kv, token: string) {
  const maybeSession = await kv.get(['session', token])
  return Session.safeParse(maybeSession.value)
}

const defaultExpiresIn = 2 /* hours */ * 60 /* mins */ * 60 /* secs */ *
  1000 /* ms */

export async function updateSession(
  kv: Deno.Kv,
  session: Session,
  expireIn = defaultExpiresIn,
) {
  const newSession = {
    ...Session.parse(session),
    expiresAt: new Date(new Date().getTime() + expireIn),
  }
  const commit = await kv.set(['session', session.token], {
    ...session,
    expiresAt: new Date(new Date().getTime() + expireIn),
  }, { expireIn })
  if (commit.ok) {
    return newSession
  } else {
    return undefined
  }
}

export function createSessionToken() {
  // TODO: something weirder than v4 UUID?
  return crypto.randomUUID()
}

export function deleteSession(kv: Deno.Kv, token: string) {
  return kv.delete(['session', token])
}
