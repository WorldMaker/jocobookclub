import {
  generateRegistrationOptions,
  RegistrationResponseJSON,
  VerifiedRegistrationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import {
  getPasskeysForUser,
  getUserRegistrationChallenge,
  Passkey,
  storeUserRegistrationChallenge,
  updatePasskey,
} from "./models/passkey.ts";
import { origin, rpId, rpName } from "./models/rp.ts";
import { getSessionByToken, Session } from "./models/session.ts";
import { getUserById } from "./models/user.ts";

interface Variables {
  session: Session;
}

const app = new Hono<{ Variables: Variables }>()
  .use(
    "/*",
    bearerAuth({
      verifyToken: async (token, c) => {
        const kv = await Deno.openKv();
        const session = await getSessionByToken(kv, token);
        if (!session.value) {
          return false;
        }
        c.set("session", session.value);
        return true;
      },
    }),
  )
  .get("/user/register-options", async (c) => {
    const kv = await Deno.openKv();
    const session = c.get("session");
    const existingUser = await getUserById(kv, session.userId);
    if (!existingUser.value) {
      return c.notFound();
    }
    const { email } = existingUser.value;
    const passkeys: Passkey[] = [];
    for await (const passkey of getPasskeysForUser(kv, existingUser.value.id)) {
      passkeys.push(passkey.value);
    }
    const options = await generateRegistrationOptions({
      rpName,
      rpID: rpId,
      userName: email,
      attestationType: "none", // we don't care for attestation, we don't care what passkey is used
      excludeCredentials: passkeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        // prefer a passkey
        residentKey: "required",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });
    await storeUserRegistrationChallenge(kv, session.token, options);
    return c.json(options);
  })
  .post("/user/register-verify", async (c) => {
    const kv = await Deno.openKv();
    const session = c.get("session");
    const existingUser = await getUserById(kv, session.userId);
    if (!existingUser.value) {
      return c.notFound();
    }
    const expectedChallenge = await getUserRegistrationChallenge(
      kv,
      session.token,
    );
    if (!expectedChallenge.value) {
      return c.notFound();
    }
    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: await c.req.json<RegistrationResponseJSON>(),
        expectedChallenge: expectedChallenge.value.challenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
      });
    } catch (error) {
      c.status(400);
      const message = error && typeof error == "object" && "message" in error
        ? error.message
        : "Unable to verify passkey";
      return c.json({ error: message });
    }
    if (!verification.verified) {
      c.status(400);
      return c.json({ error: "Unable to verify passkey" });
    }
    const { credential, credentialDeviceType, credentialBackedUp } =
      verification
        .registrationInfo!;
    await updatePasskey(kv, {
      userId: existingUser.value.id,
      webauthnUserId: expectedChallenge.value.user.id,
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });
    return c.json({
      session,
      verification,
    });
  });

export default app;
