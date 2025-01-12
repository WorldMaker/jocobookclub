import { ulid } from '@std/ulid'
import { generateRegistrationOptions, PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON, VerifiedRegistrationResponse, verifyRegistrationResponse } from "@simplewebauthn/server"
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { getInviteById } from "./models/invite.ts"
import { origin, rpId, rpName } from "./models/rp.ts"
import { getUserByEmail, getUserById, updateUser, User } from "./models/user.ts";
import { getPasskeysForUser, Passkey, updatePasskey } from "./models/passkey.ts";
import { createSessionToken, getSessionByToken, Session, updateSession } from "./models/session.ts";

type Variables = {
  session?: Session
}

const app = new Hono<{ Variables: Variables }>()

app.get('/invite/:invite/register-options', async (c) => {
  const kv = await Deno.openKv()
  const inviteId = c.req.param('invite')
  const sessionKey = c.req.query('sessionKey')
  if (!sessionKey) {
    return c.notFound()
  }
  const invite = await getInviteById(kv, inviteId)
  if (!invite.value) {
    return c.notFound()
  }
  const email = invite.value.openEnrollment ? c.req.query().email : invite.value.specificEmail!
  const existingUser = await getUserByEmail(kv, email)
  const passkeys: Passkey[] = []
  if (existingUser.value) {
    for await (const passkey of getPasskeysForUser(kv, existingUser.value.id)) {
      passkeys.push(passkey.value)
    }
  }
  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userName: email,
    attestationType: 'none', // we don't care for attestation, we don't care what passkey is used
    excludeCredentials: passkeys.map(passkey => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
    authenticatorSelection: {
      // prefer a passkey
      residentKey: 'required',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform'
    }
  })
  await kv.set(['register-challenge', sessionKey], options)
  return c.json(options)
})

app.post('/register-invite-verify', async (c) => {
  const kv = await Deno.openKv()
  const sessionKey = c.req.query('sessionKey')
  if (!sessionKey) {
    return c.notFound()
  }
  const expectedChallenge = await kv.get<PublicKeyCredentialCreationOptionsJSON>(['register-challenge', sessionKey])
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
    const message = error && typeof error == 'object' && 'message' in error ? error.message : 'Unable to verify passkey'
    return c.json({ error: message })
  }
  const existingUser = await getUserByEmail(kv, expectedChallenge.value.user.name)
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
      expiresAt: new Date()
    }
    session = await updateSession(kv, newSession)
  } else {
    userId = ulid()
    const newSession = {
      token: createSessionToken(),
      userId: userId,
      expiresAt: new Date()
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
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo!
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
    verification
  })
})

app.use('/user/*', bearerAuth({
  verifyToken: async (token, c) => {
    const kv = await Deno.openKv()
    const session = await getSessionByToken(kv, token)
    if (!session.value) {
      return false
    }
    c.set('session', session.value)
    return true
  }
}))

app.get('/user/register-options', async (c) => {
  const kv = await Deno.openKv()
  const session = c.get('session')
  if (!session) {
    return c.notFound()
  }
  const existingUser = await getUserById(kv, session.userId)
  if (!existingUser.value) {
    return c.notFound()
  }
  const { email } = existingUser.value
  const passkeys: Passkey[] = []
  for await (const passkey of getPasskeysForUser(kv, existingUser.value.id)) {
    passkeys.push(passkey.value)
  }
  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userName: email,
    attestationType: 'none', // we don't care for attestation, we don't care what passkey is used
    excludeCredentials: passkeys.map(passkey => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
    authenticatorSelection: {
      // prefer a passkey
      residentKey: 'required',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform'
    }
  })
  await kv.set(['user-register-challenge', session.token], options)
  return c.json(options)
})


app.post('/user/register-verify', async (c) => {
  const kv = await Deno.openKv()
  const session = c.get('session')
  if (!session) {
    return c.notFound()
  }
  const existingUser = await getUserById(kv, session.userId)
  if (!existingUser.value) {
    return c.notFound()
  }
  const expectedChallenge = await kv.get<PublicKeyCredentialCreationOptionsJSON>(['user-register-challenge', session.token])
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
    const message = error && typeof error == 'object' && 'message' in error ? error.message : 'Unable to verify passkey'
    return c.json({ error: message })
  }
  if (!verification.verified) {
    c.status(400)
    return c.json({ error: 'Unable to verify passkey' })
  }
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo!
  await updatePasskey(kv, {
    userId: existingUser.value.id,
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
    verification
  })
})

Deno.serve(app.fetch)
