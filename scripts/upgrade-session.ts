import { parseArgs } from 'jsr:@std/cli'
import { getSessionByToken, updateSession } from '../src/api/models/session.ts'

// Upgrade a book club session to an Admin session
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

const args = parseArgs(Deno.args, {
  string: ['token'],
})

const token = args.token

if (!token) {
  console.error('You need to specify a session token to upgrade')
  Deno.exit(1)
}

const kv = await Deno.openKv(clubUrl)
const session = await getSessionByToken(kv, token)

if (!session.success) {
  console.error('Session not found')
  Deno.exit(1)
}

const updatedSession = await updateSession(kv, {
  ...session.data,
  admin: true,
})

console.log(JSON.stringify(updatedSession))
