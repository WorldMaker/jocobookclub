import { AuthenticatorTransportFuture, Base64URLString, CredentialDeviceType } from '@simplewebauthn/server'

export interface Passkey {
    id: Base64URLString
    publicKey: Uint8Array
    userId: string
    webauthnUserId: Base64URLString
    counter: number
    deviceType: CredentialDeviceType
    backedUp: boolean
    transports?: AuthenticatorTransportFuture[]
}

export function getPasskeysForUser(kv: Deno.Kv, userId: string) {
    return kv.list<Passkey>({ prefix: ['passkey', userId] })
}

export function updatePasskey(kv: Deno.Kv, passkey: Passkey) {
    return kv.set(['passkey', passkey.userId, passkey.id], passkey)
}
