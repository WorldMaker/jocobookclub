// deno-lint-ignore-file no-import-prefix no-unversioned-import
import { parseArgs } from 'jsr:@std/cli'
import { superLogin } from './api/super-login.ts'

// Save the final tally to disk
// You will need to configure environment variable CLUB_SUPER_TOKEN with a super token
// You may configure environment variable CLUB_API_URL to point to a different API URL

const args = parseArgs(Deno.args, {
  boolean: ['admin'],
  string: ['user-id', 'email'],
  default: {
    admin: false,
  },
})

const userId = Deno.env.get('CLUB_USER_ID') || args['user-id']
const email = Deno.env.get('CLUB_USER_EMAIL') || args['email']

if (!userId || !email) {
  console.error('User ID and email must be provided via environment variables or command line arguments')
  Deno.exit(1)
}

const session = await superLogin(userId, email, args.admin)

console.log(JSON.stringify(session))
