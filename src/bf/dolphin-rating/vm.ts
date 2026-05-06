import { filter, map, Observable, of, shareReplay, switchMap } from 'rxjs'
import ballotManager from '../vm/ballot-manager.ts'
import { butterfly } from '@worldmaker/butterfloat'
import { firstValueFrom } from 'rxjs'
import { combineLatest } from 'rxjs'
import { Mark } from '@worldmaker/jocobookclub-api/models'
import { BookBallot } from '../../api/models/ballot.ts'
import { GenreMarkSelectorVm } from '../genre-tags/mark.tsx'

export class DolphinsVm implements GenreMarkSelectorVm {
  readonly #ltid: string
  get ltid() {
    return this.#ltid
  }

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

  readonly #bothRatings: Observable<
    [hoverRating: number, currentRating: number]
  >
  get bothRatings() {
    return this.#bothRatings
  }

  readonly #currentMark: Observable<Mark | null>
  get currentMark() {
    return this.#currentMark
  }

  readonly #hoverMark: Observable<Mark | null>
  readonly #setHoverMark: (mark: Mark | null) => void
  get hoverMark() {
    return this.#hoverMark
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

    const bookBallot: Observable<BookBallot> = currentBallot.pipe(
      filter((ballot) => Boolean(ballot)),
      map((ballot) => ballot!.books[this.#ltid]),
      map((maybeBallot) =>
        typeof maybeBallot === 'number'
          ? { vote: maybeBallot }
          : maybeBallot ?? { vote: 0 }
      ),
      shareReplay(1),
    )

    this.#currentRating = bookBallot.pipe(
      map((ballot) => ballot.vote),
      shareReplay(1),
    )
    ;[this.#hoverRating, this.#setHoverRating] = butterfly(0)
    this.#bothRatings = combineLatest([this.#hoverRating, this.#currentRating])
      .pipe(
        shareReplay(1),
      )

    this.#currentMark = bookBallot.pipe(
      map((ballot) => 'mark' in ballot && ballot.mark ? ballot.mark[0] : null),
      shareReplay(1),
    )
    ;[this.#hoverMark, this.#setHoverMark] = butterfly<Mark | null>(null)
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

  async saveMark(mark: Mark | null) {
    const bm = await firstValueFrom(ballotManager)
    if (!bm) {
      return
    }
    bm.markBook(this.#ltid, mark)
  }

  markIsSelected(mark: Mark) {
    return this.#currentMark.pipe(map((currentMark) => currentMark === mark))
  }

  markIsHovered(mark: Mark) {
    return this.#hoverMark.pipe(map((hoverMark) => hoverMark === mark))
  }

  markHovered(mark: Mark | null) {
    this.#setHoverMark(mark)
  }

  markSelected(mark: Mark | null) {
    this.saveMark(mark)
  }
}
