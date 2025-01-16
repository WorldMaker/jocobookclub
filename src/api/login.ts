import { Hono } from 'hono'
import {
  type AuthenticationResponseJSON,
  generateAuthenticationOptions,
  type RegistrationResponseJSON,
  type VerifiedAuthenticationResponse,
  type VerifiedRegistrationResponse,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { origin, rpId } from './models/rp.ts'
import { getUserByEmail, updateUser, type User } from './models/user.ts'
import {
  createSessionToken,
  type Session,
  updateSession,
} from './models/session.ts'
import { ulid } from '@std/ulid'
import {
  getPasskey,
  getPasskeysForUser,
  getRegistrationChallenge,
  type Passkey,
  storeLoginChallenge,
  updatePasskey,
} from './models/passkey.ts'
import { getLoginChallenge } from './models/passkey.ts'
import type { KvProvidedVariables } from './kv.ts'

const inviteVerifyQuerySchema = z.object({
  sessionKey: z.string(),
})

const authOptionsQuerySchema = z.object({
  email: z.string().email(),
})

const loginVerifySchema = z.object({
  email: z.string().email(),
  id: z.string(),
})

const app = new Hono<{ Variables: KvProvidedVariables }>()
  .post(
    '/invite-verify',
    zValidator('json', inviteVerifyQuerySchema),
    async (c) => {
      const kv = c.get('kv')
      const { sessionKey } = c.req.valid('json')
      if (!sessionKey) {
        return c.json({}, 404)
      }
      const expectedChallenge = await getRegistrationChallenge(kv, sessionKey)
      if (!expectedChallenge.value) {
        return c.json({}, 404)
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
        const message = error && typeof error == 'object' && 'message' in error
          ? error.message
          : 'Unable to verify passkey'
        return c.json({ error: message }, 400)
      }
      const existingUser = await getUserByEmail(
        kv,
        expectedChallenge.value.user.name,
      )
      if (!verification.verified) {
        return c.json({ error: 'Unable to verify passkey' }, 400)
      }
      let session: Session | undefined
      let userId: string | undefined
      if (existingUser.success) {
        userId = existingUser.data.id
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
        return c.json({ error: 'Unable to verify passkey' }, 400)
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
      }, 200)
    },
  )
  .get(
    '/auth-options',
    zValidator('query', authOptionsQuerySchema),
    async (c) => {
      const { email } = c.req.valid('query')
      const kv = c.get('kv')
      const user = await getUserByEmail(kv, email)
      if (!user.success) {
        return c.json({}, 404)
      }
      const passkeys: Passkey[] = []
      for await (
        const passkey of getPasskeysForUser(kv, user.data.id)
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
      await storeLoginChallenge(kv, user.data.id, options)
      return c.json(options, 200)
    },
  )
  .post('/verify', zValidator('json', loginVerifySchema), async (c) => {
    const { email, id } = c.req.valid('json')
    const kv = c.get('kv')
    const user = await getUserByEmail(kv, email)
    if (!user.success) {
      return c.json({}, 404)
    }
    const passkey = await getPasskey(kv, user.data.id, id)
    if (!passkey.value) {
      return c.json({ error: 'Unknown passkey' }, 400)
    }
    const expectedChallenge = await getLoginChallenge(kv, user.data.id)
    if (!expectedChallenge.value) {
      return c.json({}, 404)
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
      const message = error && typeof error == 'object' && 'message' in error
        ? error.message
        : 'Unable to verify passkey'
      return c.json({ error: message }, 400)
    }
    if (!verification.verified) {
      return c.json({ error: 'Unable to verify passkey' }, 400)
    }
    await updatePasskey(kv, {
      ...passkey.value,
      counter: verification.authenticationInfo!.newCounter,
    })
    const newSession = {
      token: createSessionToken(),
      userId: user.data.id,
      expiresAt: new Date(),
    }
    const session = await updateSession(kv, newSession)
    if (!session) {
      return c.json({ error: 'Unable to start session' }, 500)
    }
    return c.json({ session, verification }, 200)
  })

export default app
