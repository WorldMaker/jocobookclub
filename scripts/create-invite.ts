import { parseArgs } from 'jsr:@std/cli'
import { ulid } from 'jsr:@std/ulid'
import { updateInvite } from '../src/api/models/invite.ts'

// Create a new registration invite for the club
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
  boolean: ['open'],
  string: ['email'],
})

const kv = await Deno.openKv(clubUrl)

if (!args.open && !args.email) {
  console.error('You need to specify a type of invite with --open or --email')
  Deno.exit(1)
}

const id = ulid()
let created = false

if (args.email) {
  const invite = await updateInvite(kv, {
    id,
    type: 'specific-email',
    email: args.email,
  })
  if (invite.ok) {
    created = true
    console.log(`Invite created for ${args.email}`)
  }
} else if (args.open) {
  const invite = await updateInvite(kv, {
    id,
    type: 'open-enrollment',
  })
  if (invite.ok) {
    created = true
    console.log(`Open invite created`)
  }
}

if (created) {
  console.log(
    `Invite: https://worldmaker.net/jocobookclub/invite-register/#${id}`,
  )
}
