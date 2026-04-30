import { UserId } from '../../src/api/models/user.ts'
import { apiClient } from './client.ts'

const superToken = Deno.env.get('CLUB_SUPER_TOKEN')
if (!superToken) {
  console.error('CLUB_SUPER_TOKEN environment variable is not set')
  Deno.exit(1)
}

export async function superLogin(
  userId: UserId,
  email: string,
  admin?: boolean,
) {
  const response = await apiClient.login.super.verify.$post({
    json: {
      email,
      userId,
      admin,
    },
  }, {
    headers: {
      Authorization: `Bearer ${superToken}`,
    },
  })
  if (!response.ok) {
    console.error('Super login failed', await response.text())
    Deno.exit(1)
  }
  const { session } = await response.json()
  return session
}
