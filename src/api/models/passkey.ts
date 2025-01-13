import {
  AuthenticatorTransportFuture,
  Base64URLString,
  CredentialDeviceType,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";

export interface Passkey {
  id: Base64URLString;
  publicKey: Uint8Array;
  userId: string;
  webauthnUserId: Base64URLString;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}

export function getPasskeysForUser(kv: Deno.Kv, userId: string) {
  return kv.list<Passkey>({ prefix: ["passkey", userId] });
}

export function getPasskey(kv: Deno.Kv, userId: string, id: Base64URLString) {
  return kv.get<Passkey>(["passkey", userId, id]);
}

export function updatePasskey(kv: Deno.Kv, passkey: Passkey) {
  return kv.set(["passkey", passkey.userId, passkey.id], passkey);
}

const defaultChallengeExpiresIn = 10 /* mins */ * 60 /* secs */ * 1000; /* ms */

export function storeRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
  options: PublicKeyCredentialCreationOptionsJSON,
  expireIn = defaultChallengeExpiresIn,
) {
  return kv.set(["register-challenge", sessionKey], options, { expireIn });
}

export function getRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
) {
  return kv.get<PublicKeyCredentialCreationOptionsJSON>([
    "register-challenge",
    sessionKey,
  ]);
}

export function storeUserRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
  options: PublicKeyCredentialCreationOptionsJSON,
  expireIn = defaultChallengeExpiresIn,
) {
  return kv.set(["user-register-challenge", sessionKey], options, { expireIn });
}

export function getUserRegistrationChallenge(
  kv: Deno.Kv,
  sessionKey: string,
) {
  return kv.get<PublicKeyCredentialCreationOptionsJSON>([
    "user-register-challenge",
    sessionKey,
  ]);
}

export function storeLoginChallenge(
  kv: Deno.Kv,
  userId: string,
  options: PublicKeyCredentialRequestOptionsJSON,
  expireIn = defaultChallengeExpiresIn,
) {
  return kv.set(["login-challenge", userId], options, { expireIn });
}

export function getLoginChallenge(
  kv: Deno.Kv,
  userId: string,
) {
  return kv.get<PublicKeyCredentialRequestOptionsJSON>([
    "login-challenge",
    userId,
  ]);
}
