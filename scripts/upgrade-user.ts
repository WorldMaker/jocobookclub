// deno-lint-ignore-file no-import-prefix no-unversioned-import
import { parseArgs } from 'jsr:@std/cli'
import { getUserIdByEmail } from '../src/api/models/user.ts'
import { getPasskeysForUser, updatePasskey } from '../src/api/models/passkey.ts'

// Upgrade a book club user's passkeys to Admin passkeys
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
  string: ['email'],
})

if (!args.email) {
  console.error('You need to specify an email of a user to upgrade')
  Deno.exit(1)
}

const kv = await Deno.openKv(clubUrl)

const userId = await getUserIdByEmail(kv, args.email)

if (!userId.success) {
  console.error('User not found')
  Deno.exit(1)
}

for await (const passkey of getPasskeysForUser(kv, userId.data)) {
  console.log(
    await updatePasskey(kv, {
      ...passkey.value,
      admin: true,
    }),
  )
}
