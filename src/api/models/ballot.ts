export interface Ballot {
    userId: string
    books: {
        [ltid: string]: number
    }
}

export function getUserBallot(kv: Deno.Kv, userId: string) {
    return kv.get<Ballot>(['ballot', userId])
}

export function updateUserBallot(kv: Deno.Kv, ballot: Ballot) {
    return kv.set(['ballot', ballot.userId], ballot)
}
