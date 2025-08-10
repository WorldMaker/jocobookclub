import * as z from 'zod'

export const UserId = z.ulid()

export type UserId = z.infer<typeof UserId>

export const User = z.object({
  id: UserId,
  email: z.email(),
  active: z.boolean(),
  canEmail: z.optional(z.boolean()),
  preferredName: z.optional(z.string()),
  canDiscordDm: z.optional(z.boolean()),
  discordHandle: z.optional(z.string())
})

export type User = z.infer<typeof User>

export const UserInfo = z.object({
  email: z.email(),
  canEmail: z.optional(z.boolean()),
  preferredName: z.optional(z.string()),
  canDiscordDm: z.optional(z.boolean()),
  discordHandle: z.optional(z.string())
})

export type UserInfo = z.infer<typeof UserInfo>

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

export function getUserPreferredEmail(user: User | UserInfo) {
  // JSON stringify seems a close enough approximation for "Quoted Printable" encoding among friends
  return user.preferredName && user.preferredName.length
    ? `${JSON.stringify(user.preferredName)} <${user.email}>`
    : user.email
}

export async function getAllUserPreferredEmails(kv: Deno.Kv) {
  const allUsers = kv.list({ prefix: ['user-allowed-email'] })
  const emails: string[] = []
  for await (const userEmail of allUsers) {
    if (typeof userEmail.value === 'string') {
      emails.push(userEmail.value)
    }
  }
  return emails
}

export function updateUser(kv: Deno.Kv, user: User) {
  User.parse(user)
  const atomic = kv.atomic()
  atomic.set(['user', user.id], user)
  atomic.set(['email', user.email], user.id)
  if (user.canEmail) {
    atomic.set(['user-allowed-email', user.id], getUserPreferredEmail(user))
  } else {
    atomic.delete(['user-allowed-email', user.id])
  }
  return atomic.commit()
}
