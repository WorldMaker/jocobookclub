import { z } from 'zod'

export const UserId = z.ulid()

export type UserId = z.infer<typeof UserId>

export const User = z.object({
  id: UserId,
  email: z.email(),
  active: z.boolean(),
})

export type User = z.infer<typeof User>

export async function getUserById(kv: Deno.Kv, id: string) {
  const maybeUser = await kv.get(['user', id])
  return User.safeParse(maybeUser.value)
}

export async function getUserIdByEmail(kv: Deno.Kv, email: string) {
  const maybeUserId = await kv.get(['email', email])
  const userId = UserId.safeParse(maybeUserId.value)
  return userId
}

export async function getUserByEmail(kv: Deno.Kv, email: string) {
  const userId = await getUserIdByEmail(kv, email)
  if (!userId.success) {
    return userId
  }
  return await getUserById(kv, userId.data)
}

export function updateUser(kv: Deno.Kv, user: User) {
  User.parse(user)
  const atomic = kv.atomic()
  atomic.set(['user', user.id], user)
  atomic.set(['email', user.email], user.id)
  return atomic.commit()
}
