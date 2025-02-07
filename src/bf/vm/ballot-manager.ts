import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { Ballot, Session } from '@worldmaker/jocobookclub-api/models'
import { firstValueFrom, map, Observable, shareReplay } from 'rxjs'
import { apiClient } from '../client.ts'
import sessionManager from './session-manager.ts'

export class BallotManager {
  readonly #session: Session

  readonly #ballot: Observable<Ballot | null>
  readonly #setBallot: (ballot: StateSetter<Ballot | null>) => void
  get ballot() {
    return this.#ballot
  }
  readonly #unsaved: Observable<boolean>
  get unsaved() {
    return this.#unsaved
  }
  readonly #active: Observable<boolean>
  get active() {
    return this.#active
  }

  // for "three-way merge", the last known *saved* ballot
  #lastBallot: Ballot | null = null

  constructor(session: Session) {
    this.#session = session
    ;[this.#ballot, this.#setBallot] = butterfly<Ballot | null>(null)

    this.#unsaved = this.#ballot.pipe(
      map((ballot) => {
        if (!ballot) {
          return false
        }
        if (!this.#lastBallot) {
          return true
        }
        if (ballot.active != this.#lastBallot.active) {
          return true
        }
        for (const [ltid, rank] of Object.entries(ballot.books)) {
          if (this.#lastBallot.books[ltid] != rank) {
            return true
          }
        }
        return false
      }),
      shareReplay(1),
    )

    this.#active = this.#ballot.pipe(
      map((ballot) => ballot ? ballot.active : false),
      shareReplay(1),
    )

    // stale while revalidate with local host caching
    const maybeBallot = localStorage.getItem(`ballot/${session.userId}`)
    if (maybeBallot) {
      const ballot = Ballot.safeParse(JSON.parse(maybeBallot))
      if (ballot.success) {
        this.#setBallot(ballot.data)
      }
    }
    const maybeLastBallot = localStorage.getItem(
      `saved/ballot/${session.userId}`,
    )
    if (maybeLastBallot) {
      const ballot = Ballot.safeParse(JSON.parse(maybeLastBallot))
      if (ballot.success) {
        this.#lastBallot = ballot.data
      }
    }
    this.load()
  }

  async load() {
    const response = await apiClient.user.ballot.$get({}, {
      headers: { Authorization: `Bearer ${this.#session.token}` },
    })
    if (response.ok) {
      const remoteBallot = await response.json()
      if (this.#lastBallot && remoteBallot.userId != this.#lastBallot.userId) {
        throw new Error('User ID mismatch between local and server ballots')
      }
      this.#updateBallot((localBallot) => {
        const newBallot = structuredClone(remoteBallot)
        // try to merge local changes with server changes
        if (localBallot && this.#lastBallot) {
          if (localBallot.userId != this.#lastBallot.userId) {
            throw new Error('User ID mismatch between local ballots')
          }
          if (localBallot.active != this.#lastBallot.active) {
            newBallot.active = localBallot.active
          }
          for (const [ltid, rank] of Object.entries(localBallot.books)) {
            if (this.#lastBallot.books[ltid] != rank) {
              newBallot.books[ltid] = rank
            }
          }
        }
        this.#updateLastBallot(remoteBallot)
        return newBallot
      })
    }
  }

  #updateBallot(ballot: StateSetter<Ballot | null>) {
    this.#setBallot((currentBallot) => {
      const updatedBallot = typeof ballot === 'function'
        ? ballot(currentBallot)
        : ballot
      localStorage.setItem(
        `ballot/${this.#session.userId}`,
        JSON.stringify(updatedBallot),
      )
      return updatedBallot
    })
  }

  #updateLastBallot(ballot: Ballot) {
    this.#lastBallot = structuredClone(ballot)
    localStorage.setItem(
      `saved/ballot/${this.#session.userId}`,
      JSON.stringify(ballot),
    )
  }

  activate() {
    this.#updateBallot((ballot) => {
      if (!ballot) {
        return null
      }
      return {
        ...ballot,
        active: true,
      }
    })
  }

  deactivate() {
    this.#updateBallot((ballot) => {
      if (!ballot) {
        return null
      }
      return {
        ...ballot,
        active: false,
      }
    })
  }

  rankBook(ltid: string, rank: number) {
    if (rank < 1 || rank > 5) {
      throw new Error('Rank must be between 1 and 5')
    }
    this.#updateBallot((ballot) => {
      if (!ballot) {
        return null
      }
      return {
        ...ballot,
        books: {
          ...ballot.books,
          [ltid]: rank,
        },
      }
    })
  }

  async vote() {
    const ballot = await firstValueFrom(this.ballot)
    if (!ballot) {
      return
    }
    const response = await apiClient.user.ballot.$put({ json: ballot }, {
      headers: { Authorization: `Bearer ${this.#session.token}` },
    })
    if (response.ok) {
      const updatedBallot = Ballot.safeParse(await response.json())
      if (updatedBallot.success) {
        this.#updateLastBallot(updatedBallot.data)
        this.#updateBallot(structuredClone(updatedBallot.data))
      }
    }
  }
}

// shared singleton instance
const ballotManager = sessionManager.session.pipe(
  map((session) => session ? new BallotManager(session) : null),
  shareReplay(1),
)
export default ballotManager
