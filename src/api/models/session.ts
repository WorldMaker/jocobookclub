export interface Session {
    token: string
    userId: string
    expiresAt: Date
}

export function getSessionByToken(kv: Deno.Kv, token: string) {
    return kv.get<Session>(['session', token])
}

const defaultExpiresIn = 2 /* hours */ * 60 /* mins */ * 60 /* secs */ * 1000 /* ms */

export async function updateSession(kv: Deno.Kv, session: Session, expireIn = defaultExpiresIn) {
    const newSession = {
        ...session,
        expiresAt: new Date(new Date().getTime() + expireIn)
    }
    const commit = await kv.set(['session', session.token], { ...session, expiresAt: new Date(new Date().getTime() + expireIn) }, { expireIn })
    if (commit.ok) {
        return newSession
    } else { 
        return undefined
    }
}

export function createSessionToken() {
    // TODO: something weirder than v4 UUID?
    return crypto.randomUUID()
}
