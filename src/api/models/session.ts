export interface Session {
    token: string
    userId: string
    expiresAt: Date
}

export function getSessionByToken(kv: Deno.Kv, token: string) {
    return kv.get<Session>(['session', token])
}

const defaultExpiresIn = 2 /* hours */ * 60 /* mins */ * 60 /* secs */ * 1000 /* ms */

export function updateSession(kv: Deno.Kv, session: Session, expireIn = defaultExpiresIn) {
    return kv.set(['session', session.token], { ...session, expiresAt: new Date(new Date().getTime() + expireIn) }, { expireIn })
}
