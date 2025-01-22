import { Observable, filter, map, of, switchMap, shareReplay } from 'rxjs'
import ballotManager from '../vm/ballot-manager.ts'
import { butterfly } from '@worldmaker/butterfloat'
import { firstValueFrom } from 'rxjs'

export class DolphinsVm {
  readonly #ltid: string

  readonly #hasBallot: Observable<boolean>
  get hasBallot() {
    return this.#hasBallot
  }

  readonly #currentRating: Observable<number>
  get currentRating() {
    return this.#currentRating
  }

  readonly #hoverRating: Observable<number>
  readonly #setHoverRating: (rating: number) => void
  get hoverRating() {
    return this.#hoverRating
  }

  constructor(ltid: string) {
    this.#ltid = ltid

    const currentBallot = ballotManager.pipe(
      switchMap((bm) => bm ? bm.ballot : of(null)),
      shareReplay(1),
    )

    this.#hasBallot = currentBallot.pipe(
      map((ballot) => Boolean(ballot)),
    )

    this.#currentRating = currentBallot.pipe(
      filter((ballot) => Boolean(ballot)),
      map(ballot => ballot!.books[this.#ltid] ?? 0),
      shareReplay(1),
    )

    ;[this.#hoverRating, this.#setHoverRating] = butterfly(0)
  }

  updateHoverRating(rating: number) {
    this.#setHoverRating(rating)
  }

  async saveRating(rating: number) {
    const bm = await firstValueFrom(ballotManager)
    if (!bm) {
      return
    }
    bm.rankBook(this.#ltid, rating)
  }
}
