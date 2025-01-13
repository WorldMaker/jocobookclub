export interface User {
  id: string
  email: string
  active: boolean
}

export function getUserById(kv: Deno.Kv, id: string) {
  return kv.get<User>(['user', id])
}

export async function getUserByEmail(kv: Deno.Kv, email: string) {
  const userId = await kv.get<string>(['email', email])
  if (!userId.value) {
    return {
      key: [],
      value: null,
      versionstamp: null,
    }
  }
  return await getUserById(kv, userId.value)
}

export function updateUser(kv: Deno.Kv, user: User) {
  const atomic = kv.atomic()
  atomic.set(['user', user.id], user)
  atomic.set(['email', user.email], user.id)
  return atomic.commit()
}
