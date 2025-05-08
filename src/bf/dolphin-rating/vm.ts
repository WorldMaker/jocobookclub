import { filter, map, Observable, of, shareReplay, switchMap } from 'rxjs'
import ballotManager from '../vm/ballot-manager.ts'
import { butterfly } from '@worldmaker/butterfloat'
import { firstValueFrom } from 'rxjs'
import { combineLatest } from 'rxjs'

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

  readonly #bothRatings: Observable<[hoverRating: number, currentRating: number]>
  get bothRatings() {
    return this.#bothRatings
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
      map((ballot) => ballot!.books[this.#ltid] ?? 0),
      shareReplay(1),
    )
    ;[this.#hoverRating, this.#setHoverRating] = butterfly(0)
    this.#bothRatings = combineLatest([this.#hoverRating, this.#currentRating]).pipe(
      shareReplay(1),
    )
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
