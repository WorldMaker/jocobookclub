import { butterfly } from '@worldmaker/butterfloat'
import { Leaderboard, Session } from '@worldmaker/jocobookclub-api/models'
import { apiClient } from '../client.ts'
import { map, Observable, shareReplay } from 'rxjs'
import sessionManager from '../vm/session-manager.ts'

export class LeaderBoardVm {
  readonly #session: Session

  readonly #leaderboard: Observable<Leaderboard | null>
  readonly #setLeaderBoard: (leaderboard: Leaderboard | null) => void
  get leaderboard() {
    return this.#leaderboard
  }

  constructor(session: Session) {
    this.#session = session
    ;[this.#leaderboard, this.#setLeaderBoard] = butterfly<Leaderboard | null>(
      null,
    )
    this.load()
  }

  async load() {
    const resp = await apiClient.user.leaderboard.$get({}, {
      headers: { 'Authorization': `Bearer ${this.#session.token}` },
    })
    if (resp.ok) {
      const leaderboard = Leaderboard.safeParse(await resp.json())
      if (leaderboard.success) {
        this.#setLeaderBoard(leaderboard.data)
      } else {
        console.error('Failed to parse leaderboard response', {
          error: leaderboard.error,
        })
      }
    }
  }
}

// convenient singleton instance
export const leaderBoardVm = sessionManager.session.pipe(
  map((session) => session ? new LeaderBoardVm(session) : null),
  shareReplay(1),
)
export default leaderBoardVm
