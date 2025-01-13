import { zValidator } from '@hono/zod-validator'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { Hono } from 'hono'
import { z } from 'zod'
import { getInviteById } from './models/invite.ts'
import {
  getPasskeysForUser,
  Passkey,
  storeRegistrationChallenge,
} from './models/passkey.ts'
import { rpId, rpName } from './models/rp.ts'
import { getUserByEmail } from './models/user.ts'

const registerOptionsQuerySchema = z.object({
  sessionKey: z.string(),
})

const app = new Hono()
  .get(
    '/:invite/register-options',
    zValidator('query', registerOptionsQuerySchema),
    async (c) => {
      const kv = await Deno.openKv()
      const inviteId = c.req.param('invite')
      const { sessionKey } = c.req.valid('query')
      const invite = await getInviteById(kv, inviteId)
      if (!invite.value) {
        return c.notFound()
      }
      const email = invite.value.openEnrollment
        ? c.req.query().email
        : invite.value.specificEmail!
      const existingUser = await getUserByEmail(kv, email)
      const passkeys: Passkey[] = []
      if (existingUser.value) {
        for await (
          const passkey of getPasskeysForUser(kv, existingUser.value.id)
        ) {
          passkeys.push(passkey.value)
        }
      }
      const options = await generateRegistrationOptions({
        rpName,
        rpID: rpId,
        userName: email,
        attestationType: 'none', // we don't care for attestation, we don't care what passkey is used
        excludeCredentials: passkeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports,
        })),
        authenticatorSelection: {
          // prefer a passkey
          residentKey: 'required',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
      })
      await storeRegistrationChallenge(kv, sessionKey, options)
      return c.json(options)
    },
  )

export default app
