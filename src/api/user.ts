import {
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  type VerifiedRegistrationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import {
  getPasskeysForUser,
  getUserRegistrationChallenge,
  type Passkey,
  storeUserRegistrationChallenge,
  updatePasskey,
} from './models/passkey.ts'
import { origin, rpId, rpName } from './models/rp.ts'
import {
  deleteSession,
  getSessionByToken,
  type Session,
} from './models/session.ts'
import { getUserById } from './models/user.ts'
import { Ballot, getUserBallot, updateUserBallot } from './models/ballot.ts'
import { zValidator } from '@hono/zod-validator'
import { queueVoted } from './models/voting.ts'
import { getFinalTally } from './models/tally.ts'
import type { KvProvidedVariables } from './kv.ts'

interface Variables extends KvProvidedVariables {
  session: Session
}

const app = new Hono<{ Variables: Variables }>()
  .use(
    '/*',
    bearerAuth({
      verifyToken: async (token, c) => {
        const kv = c.get('kv')
        const session = await getSessionByToken(kv, token)
        if (!session.success) {
          return false
        }
        c.set('session', session.data)
        return true
      },
    }),
  )
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
        active: false,
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

export default app
