export interface Invite {
    id: string
    openEnrollment?: boolean
    specificEmail?: string
}

export function getInviteById(kv: Deno.Kv, id: string) {
    return kv.get<Invite>(['invite', id])
}

const defaultExpireIn = 48 /* hours */ * 60 /* mins */ * 60 /* secs */ * 1000 /* ms */

export function updateInvite(kv: Deno.Kv, invite: Invite, expireIn = defaultExpireIn) {
    return kv.set(['invite', invite.id], invite, { expireIn })
}
