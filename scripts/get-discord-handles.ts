import { User } from '../src/api/models/user.ts'

// Get all opt-in Discord handles from the database
// You will need to configure environment variables DENO_KV_ACCESS_TOKEN
// and CLUB_KV_URL

const hasKvAccess = Deno.env.has('DENO_KV_ACCESS_TOKEN')
const clubUrl = Deno.env.get('CLUB_KV_URL')

if (!hasKvAccess || !clubUrl) {
  console.log(
    'You need to set the DENO_KV_ACCESS_TOKEN and CLUB_KV_URL environment variables',
  )
  Deno.exit(1)
}

const kv = await Deno.openKv(clubUrl)

const users = kv.list({ prefix: ['user'] })
for await (const userEntry of users) {
  if (userEntry.value && typeof userEntry.value === 'object') {
    const user = User.safeParse(userEntry.value)
    if (user.success) {
      const { canDiscordDm, discordHandle } = user.data
      if (canDiscordDm) {
        console.log(discordHandle)
      }
    }
  }
}
