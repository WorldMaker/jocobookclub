import { zValidator } from '@hono/zod-validator'
import {
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  type VerifiedRegistrationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { Hono } from 'hono'
import { Ballot, getUserBallot, updateUserBallot } from './models/ballot.ts'
import {
  getPasskeysForUser,
  getUserRegistrationChallenge,
  type Passkey,
  type PasskeyMeta,
  storeUserRegistrationChallenge,
  toPasskeyMeta,
  updatePasskey,
} from './models/passkey.ts'
import { origin, rpId, rpName } from './models/rp.ts'
import { deleteSession } from './models/session.ts'
import { getFinalTally } from './models/tally.ts'
import { getUserById } from './models/user.ts'
import { queueVoted } from './models/voting.ts'
import { sessionToken, type SessionVariables } from './session-token.ts'
import { z } from 'zod/v4'

const passkeyPatch = z.object({
  admin: z.boolean().optional(),
  nickname: z.string().optional(),
})

const app = new Hono<{ Variables: SessionVariables }>()
  .use('/*', sessionToken)
  .get('/register-options', async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const existingUser = await getUserById(kv, session.userId)
    if (!existingUser.success) {
      return c.json({}, 404)
    }
    const { id: userId, email } = existingUser.data
    const passkeys: Passkey[] = []
    for await (const passkey of getPasskeysForUser(kv, userId)) {
      passkeys.push(passkey.value)
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
    await storeUserRegistrationChallenge(kv, session.token, options)
    return c.json(options, 200)
  })
  .post('/register-verify', async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const existingUser = await getUserById(kv, session.userId)
    if (!existingUser.success) {
      return c.json({}, 404)
    }
    const expectedChallenge = await getUserRegistrationChallenge(
      kv,
      session.token,
    )
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
    if (!verification.verified) {
      return c.json({ error: 'Unable to verify passkey' }, 400)
    }
    const { credential, credentialDeviceType, credentialBackedUp } =
      verification
        .registrationInfo!
    await updatePasskey(kv, {
      userId: existingUser.data.id,
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
  })
  .get('/ballot', async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const ballot = await getUserBallot(kv, session.userId)
    if (!ballot.success) {
      return c.json<Ballot>({
        userId: session.userId,
        active: true,
        books: {},
        updated: new Date().toISOString(),
      })
    }
    return c.json(ballot.data)
  })
  .put('/ballot', zValidator('json', Ballot), async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const ballot = c.req.valid('json')
    if (ballot.userId !== session.userId) {
      return c.json({}, 403)
    }
    await updateUserBallot(kv, ballot)
    await queueVoted(kv, ballot.userId)
    return c.json(ballot)
  })
  .get('/final-tally', async (c) => {
    const kv = c.get('kv')
    const tally = await getFinalTally(kv)
    if (!tally.success) {
      return c.json({}, 404)
    }
    return c.json(tally.data, 200)
  })
  .delete('/session', async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    await deleteSession(kv, session.token)
    return c.json({}, 200)
  })
  .get('/passkey', async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const passkeys: PasskeyMeta[] = []
    for await (const passkey of getPasskeysForUser(kv, session.userId)) {
      passkeys.push(toPasskeyMeta(passkey.value))
    }
    return c.json(passkeys, 200)
  })
  .patch('/passkey/:id', zValidator('json', passkeyPatch), async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const passkey = c.req.valid('json')
    const existingPasskey = await kv.get<Passkey>([
      'passkey',
      session.userId,
      c.req.param('id'),
    ])
    if (!existingPasskey.value) {
      return c.json({}, 404)
    }
    const updatedPasskey = {
      ...existingPasskey.value,
      admin: session.admin && passkey.admin,
      nickname: passkey.nickname,
    }
    const result = await updatePasskey(kv, updatedPasskey)
    if (!result.ok) {
      return c.json({}, 500)
    }
    return c.json(toPasskeyMeta(updatedPasskey), 200)
  })
  .delete('/passkey/:id', async (c) => {
    const kv = c.get('kv')
    const session = c.get('session')
    const existingPasskey = await kv.get<Passkey>([
      'passkey',
      session.userId,
      c.req.param('id'),
    ])
    if (!existingPasskey.value) {
      return c.json({}, 404)
    }
    if (existingPasskey.value.admin) {
      return c.json({ error: 'Cannot delete admin passkey' }, 403)
    }
    await kv.delete(['passkey', session.userId, c.req.param('id')])
    return c.body(null, 204)
  })

export default app
