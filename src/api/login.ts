import { Hono } from 'hono'
import {
  AuthenticationResponseJSON,
  generateAuthenticationOptions,
  RegistrationResponseJSON,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { rpId } from './models/rp.ts'
import { getUserByEmail, updateUser, User } from './models/user.ts'
import { createSessionToken, Session, updateSession } from './models/session.ts'
import { ulid } from '@std/ulid'
import {
  getPasskey,
  getPasskeysForUser,
  getRegistrationChallenge,
  Passkey,
  storeLoginChallenge,
  updatePasskey,
} from './models/passkey.ts'
import { getLoginChallenge } from './models/passkey.ts'

const inviteVerifyQuerySchema = z.object({
  sessionKey: z.string(),
})

const authOptionsQuerySchema = z.object({
  email: z.string(),
})

const loginVerifySchema = z.object({
  email: z.string(),
  id: z.string(),
})

const app = new Hono()
  .post(
    '/invite-verify',
    zValidator('json', inviteVerifyQuerySchema),
    async (c) => {
      const kv = await Deno.openKv()
      const { sessionKey } = c.req.valid('json')
      if (!sessionKey) {
        return c.notFound()
      }
      const expectedChallenge = await getRegistrationChallenge(kv, sessionKey)
      if (!expectedChallenge.value) {
        return c.notFound()
      }
      let verification: VerifiedRegistrationResponse
      try {
        verification = await verifyRegistrationResponse({
          response: await c.req.json<RegistrationResponseJSON>(),
          expectedChallenge: expectedChallenge.value.challenge,
          expectedOrigin: origin,
          expectedRPID: rpId,
        })
      } catch (error) {
        c.status(400)
        const message = error && typeof error == 'object' && 'message' in error
          ? error.message
          : 'Unable to verify passkey'
        return c.json({ error: message })
      }
      const existingUser = await getUserByEmail(
        kv,
        expectedChallenge.value.user.name,
      )
      if (!verification.verified) {
        c.status(400)
        return c.json({ error: 'Unable to verify passkey' })
      }
      let session: Session | undefined
      let userId: string | undefined
      if (existingUser.value) {
        userId = existingUser.value.id
        const newSession = {
          token: createSessionToken(),
          userId,
          expiresAt: new Date(),
        }
        session = await updateSession(kv, newSession)
      } else {
        userId = ulid()
        const newSession = {
          token: createSessionToken(),
          userId: userId,
          expiresAt: new Date(),
        }
        const user: User = {
          active: true,
          email: expectedChallenge.value.user.name,
          id: userId,
        }
        await updateUser(kv, user)
        session = await updateSession(kv, newSession)
      }
      if (!session || !userId) {
        c.status(400)
        return c.json({ error: 'Unable to verify passkey' })
      }
      const { credential, credentialDeviceType, credentialBackedUp } =
        verification
          .registrationInfo!
      await updatePasskey(kv, {
        userId,
        webauthnUserId: expectedChallenge.value.user.id,
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      })
      return c.json({
        session,
        verification,
      })
    },
  )
  .get(
    '/auth-options',
    zValidator('query', authOptionsQuerySchema),
    async (c) => {
      const { email } = c.req.valid('query')
      const kv = await Deno.openKv()
      const user = await getUserByEmail(kv, email)
      if (!user.value) {
        return c.notFound()
      }
      const passkeys: Passkey[] = []
      for await (
        const passkey of getPasskeysForUser(kv, user.value.id)
      ) {
        passkeys.push(passkey.value)
      }
      const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials: passkeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports,
        })),
      })
      await storeLoginChallenge(kv, user.value.id, options)
      return c.json(options)
    },
  )
  .post('/verify', zValidator('json', loginVerifySchema), async (c) => {
    const { email, id } = c.req.valid('json')
    const kv = await Deno.openKv()
    const user = await getUserByEmail(kv, email)
    if (!user.value) {
      return c.notFound()
    }
    const passkey = await getPasskey(kv, user.value.id, id)
    if (!passkey.value) {
      c.status(400)
      return c.json({ error: 'Unknown passkey' })
    }
    const expectedChallenge = await getLoginChallenge(kv, user.value.id)
    if (!expectedChallenge.value) {
      return c.notFound()
    }
    let verification: VerifiedAuthenticationResponse
    try {
      verification = await verifyAuthenticationResponse({
        response: await c.req.json<AuthenticationResponseJSON>(),
        expectedChallenge: expectedChallenge.value.challenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        credential: {
          id: passkey.value.id,
          publicKey: passkey.value.publicKey,
          counter: passkey.value.counter,
          transports: passkey.value.transports,
        },
      })
    } catch (error) {
      c.status(400)
      const message = error && typeof error == 'object' && 'message' in error
        ? error.message
        : 'Unable to verify passkey'
      return c.json({ error: message })
    }
    if (!verification.verified) {
      c.status(400)
      return c.json({ error: 'Unable to verify passkey' })
    }
    await updatePasskey(kv, {
      ...passkey.value,
      counter: verification.authenticationInfo!.newCounter,
    })
    const newSession = {
      token: createSessionToken(),
      userId: user.value.id,
      expiresAt: new Date(),
    }
    const session = await updateSession(kv, newSession)
    if (!session) {
      return c.status(500)
    }
    return c.json({ session, verification })
  })

export default app