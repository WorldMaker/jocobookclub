import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { Ballot } from '@worldmaker/jocobookclub-api/models'
import { Observable } from 'rxjs'
import { apiClient } from '../client.ts'

export class BallotManager {
  readonly #ballot: Observable<Ballot | null>
  readonly #setBallot: (ballot: StateSetter<Ballot | null>) => void
  get ballot() {
    return this.#ballot
  }

  // for "three-way merge"
  #lastBallot: Ballot | null = null

  constructor() {
    ;[this.#ballot, this.#setBallot] = butterfly<Ballot | null>(null)

    // stale while revalidate with local host caching
    const maybeBallot = localStorage.getItem('ballot')
    if (maybeBallot) {
      const ballot = Ballot.safeParse(JSON.parse(maybeBallot))
      if (ballot.success) {
        this.#lastBallot = ballot.data
        this.#setBallot(ballot.data)
      }
    }
  }

  async load() {
    const response = await apiClient.user.ballot.$get()
    if (response.ok) {
      const ballot = await response.json()
      if (this.#lastBallot && ballot.userId != this.#lastBallot.userId) {
        throw new Error('User ID mismatch between local and server ballots')
      }
      this.#setBallot((localBallot) => {
        // try to merge local changes with server changes
        if (localBallot && this.#lastBallot) {
          if (localBallot.userId != this.#lastBallot.userId) {
            throw new Error('User ID mismatch between local ballots')
          }
          if (localBallot.active != this.#lastBallot.active) {
            ballot.active = localBallot.active
          }
          for (const [ltid, rank] of Object.entries(localBallot.books)) {
            if (this.#lastBallot.books[ltid] != rank) {
              ballot.books[ltid] = rank
            }
          }
        }
        return ballot
      })
      this.#lastBallot = ballot
      localStorage.setItem('ballot', JSON.stringify(ballot))
    }
  }

  activate() {
    this.#setBallot((ballot) => {
      if (ballot) {
        ballot.active = true
      }
      return ballot
    })
  }

  deactivate() {
    this.#setBallot((ballot) => {
      if (ballot) {
        ballot.active = false
      }
      return ballot
    })
  }

  rankBook(ltid: string, rank: number) {
    if (rank < 1 || rank > 5) {
      throw new Error('Rank must be between 1 and 5')
    }
    this.#setBallot((ballot) => {
      if (ballot) {
        ballot.books[ltid] = rank
      }
      return ballot
    })
  }

  update(ballot: Ballot) {
    Ballot.parse(ballot)
    this.#setBallot(ballot)
  }

  async vote(ballot: Ballot) {
    // optimistic update
    this.update(ballot)
    this.#lastBallot
    const response = await apiClient.user.ballot.$put({ json: ballot })
    if (response.ok) {
      const updatedBallot = await response.json()
      this.update(updatedBallot)
      localStorage.setItem('ballot', JSON.stringify(updatedBallot))
      this.#lastBallot = updatedBallot
    }
  }
}

// shared singleton instance
const ballotManager = new BallotManager()
export default ballotManager
