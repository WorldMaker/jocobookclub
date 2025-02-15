import type {
  AuthenticatorTransportFuture,
  Base64URLString,
  CredentialDeviceType,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server'
import type { UserId } from './user.ts'

export interface Passkey {
  id: Base64URLString
  publicKey: Uint8Array
  userId: string
  admin?: boolean
  nickname?: string
  webauthnUserId: Base64URLString
  counter: number
  deviceType: CredentialDeviceType
  backedUp: boolean
  transports?: AuthenticatorTransportFuture[]
}

export type PasskeyMeta = Pick<
  Passkey,
  | 'id'
  | 'userId'
  | 'admin'
  | 'nickname'
  | 'backedUp'
  | 'deviceType'
  | 'transports'
>

export function toPasskeyMeta(passkey: Passkey): PasskeyMeta {
  return {
    id: passkey.id,
    userId: passkey.userId,
    admin: passkey.admin,
    nickname: passkey.nickname,
    backedUp: passkey.backedUp,
    deviceType: passkey.deviceType,
    transports: passkey.transports,
  }
}

export function getPasskeysForUser(kv: Deno.Kv, userId: UserId) {
  return kv.list<Passkey>({ prefix: ['passkey', userId] })
}

export function getPasskey(kv: Deno.Kv, userId: UserId, id: Base64URLString) {
  return kv.get<Passkey>(['passkey', userId, id])
}

export function updatePasskey(kv: Deno.Kv, passkey: Passkey) {
  return kv.set(['passkey', passkey.userId, passkey.id], passkey)
}

const defaultChallengeExpiresIn = 10 /* mins */ * 60 /* secs */ * 1000 /* ms */

export function storeRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
  options: PublicKeyCredentialCreationOptionsJSON,
  expireIn = defaultChallengeExpiresIn,
) {
  return kv.set(['register-challenge', sessionKey], options, { expireIn })
}

export async function getRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
) {
  const key = ['register-challenge', sessionKey]
  const challenge = await kv.get<PublicKeyCredentialCreationOptionsJSON>(key)
  await kv.delete(key)
  return challenge
}

export function storeUserRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
  options: PublicKeyCredentialCreationOptionsJSON,
  expireIn = defaultChallengeExpiresIn,
) {
  return kv.set(['user-register-challenge', sessionKey], options, { expireIn })
}

export async function getUserRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
) {
  const key = ['user-register-challenge', sessionKey]
  const challenge = await kv.get<PublicKeyCredentialCreationOptionsJSON>(key)
  await kv.delete(key)
  return challenge
}

export function storeLoginChallenge(
  kv: Deno.Kv,
  userId: UserId,
  options: PublicKeyCredentialRequestOptionsJSON,
  expireIn = defaultChallengeExpiresIn,
) {
  return kv.set(['login-challenge', userId], options, { expireIn })
}

export async function getLoginChallenge(
  kv: Deno.Kv,
  userId: UserId,
) {
  const key = ['login-challenge', userId]
  const challenge = await kv.get<PublicKeyCredentialRequestOptionsJSON>([
    'login-challenge',
    userId,
  ])
  await kv.delete(key)
  return challenge
}
