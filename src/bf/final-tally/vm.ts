import { FinalTally, Session } from '@worldmaker/jocobookclub-api/models'
import { butterfly } from '@worldmaker/butterfloat'
import { map, Observable, shareReplay } from 'rxjs'
import { apiClient } from '../client.ts'
import sessionManager from '../vm/session-manager.ts'

const ActiveBallotUrl =
  'https://worldmaker.net/jocobookclub/static-api/ballot.json'

export interface BookInfo {
  title: string
  author: string
  ltid: string
  url: string
}

export interface Ranking {
  finalTally: FinalTally
  books: Record<string, BookInfo>
}

export class FinalTallyVm {
  readonly #session: Session

  readonly #finalTally: Observable<Ranking | null>
  readonly #setFinalTally: (finalTally: Ranking | null) => void
  get finalTally() {
    return this.#finalTally
  }

  constructor(session: Session) {
    this.#session = session
    ;[this.#finalTally, this.#setFinalTally] = butterfly<Ranking | null>(null)
    this.load()
  }

  async load() {
    const staticResp = await fetch(ActiveBallotUrl)
    if (!staticResp.ok) {
      return
    }
    const books = await staticResp.json() as Record<string, BookInfo>
    const resp = await apiClient.user['final-tally'].$get({}, {
      headers: { 'Authorization': `Bearer ${this.#session.token}` },
    })
    if (resp.ok) {
      const finalTally = FinalTally.safeParse(await resp.json())
      if (finalTally.success) {
        this.#setFinalTally({
          finalTally: finalTally.data,
          books,
        })
      }
    }
  }
}

// convenient singleton instance
const finalTallyVm = sessionManager.session.pipe(
  map((session) => session ? new FinalTallyVm(session) : null),
  shareReplay(1),
)
export default finalTallyVm
