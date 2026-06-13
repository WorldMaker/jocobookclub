import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import {
  Ballot,
  BookBallot,
  Mark,
  Session,
} from '@worldmaker/jocobookclub-api/models'
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
        for (const [ltid, maybeBook] of Object.entries(ballot.books)) {
          if (
            typeof maybeBook === 'number' &&
            this.#lastBallot.books[ltid] != maybeBook
          ) {
            return true
          } else if (typeof maybeBook === 'object') {
            const lastBook = this.#lastBallot.books[ltid]
            if (typeof lastBook !== 'object') {
              return true
            } else if (
              typeof lastBook === 'object' &&
              (lastBook.rank !== maybeBook.rank ||
                ('mark' in maybeBook) !== ('mark' in lastBook) ||
                ('mark' in maybeBook && 'mark' in lastBook &&
                  (maybeBook.mark![0] !== lastBook.mark![0] ||
                    maybeBook.mark![1].getTime() >
                      lastBook.mark![1].getTime())))
            ) {
              return true
            }
          }
        }
        return false
      }),
      shareReplay(1),
    )

    if (typeof document !== 'undefined') {
      // since the ballot manager is a global singleton, ignoring disposal for this subscription should be fine
      this.#unsaved.subscribe((unsaved) => {
        if (unsaved && !document.title.startsWith('💾 ')) {
          document.title = '💾 ' + document.title
        } else if (!unsaved && document.title.startsWith('💾 ')) {
          document.title = document.title.slice(2)
        }
      })
    }

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
      // reparse for Date coercion (JSON stringifies Dates)
      const remoteBallot = Ballot.parse(await response.json())
      if (this.#lastBallot && remoteBallot.userId != this.#lastBallot.userId) {
        throw new Error('User ID mismatch between local and server ballots')
      }
      this.#updateBallot((localBallot) => {
        // reparse for Date coercion (structuredClone stringifies Dates)
        const newBallot = Ballot.parse(structuredClone(remoteBallot))
        // try to merge local changes with server changes
        if (localBallot && this.#lastBallot) {
          if (localBallot.userId != this.#lastBallot.userId) {
            throw new Error('User ID mismatch between local ballots')
          }
          if (localBallot.active != this.#lastBallot.active) {
            newBallot.active = localBallot.active
          }
          for (const [ltid, maybeBook] of Object.entries(localBallot.books)) {
            if (
              typeof maybeBook === 'number' &&
              this.#lastBallot.books[ltid] != maybeBook
            ) {
              newBallot.books[ltid] = maybeBook
            } else if (typeof maybeBook === 'object') {
              const lastBook = this.#lastBallot.books[ltid]
              if (typeof lastBook !== 'object') {
                newBallot.books[ltid] = maybeBook
              } else if (
                typeof lastBook === 'object' &&
                (lastBook.rank !== maybeBook.rank ||
                  ('mark' in maybeBook) !== ('mark' in lastBook) ||
                  ('mark' in maybeBook && 'mark' in lastBook &&
                    (maybeBook.mark![0] !== lastBook.mark![0] ||
                      maybeBook.mark![1].getTime() >
                        lastBook.mark![1].getTime())))
              ) {
                // reparse for Date coercion (structuredClone stringifies Dates)
                newBallot.books[ltid] = BookBallot.parse(
                  structuredClone(maybeBook),
                )
              }
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
      const book = typeof ballot.books[ltid] === 'number'
        ? { rank }
        : { ...ballot.books[ltid], rank }
      return {
        ...ballot,
        books: {
          ...ballot.books,
          [ltid]: book,
        },
      }
    })
  }

  markBook(ltid: string, mark: Mark | null) {
    this.#updateBallot((ballot) => {
      if (!ballot) {
        return null
      }
      const current = ballot.books[ltid]
      const newMark = mark
        ? [mark, new Date()] satisfies [Mark, Date]
        : undefined
      const book = typeof current === 'number'
        ? { rank: current, mark: newMark }
        : { ...current, mark: newMark }
      return {
        ...ballot,
        books: {
          ...ballot.books,
          [ltid]: book,
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
