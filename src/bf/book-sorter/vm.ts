import { butterfly, StateSetter } from '@worldmaker/butterfloat'
import { Observable } from 'rxjs'

export type Sort = 'title' | 'author' | 'rank'

export type SortDirection = 'asc' | 'desc'

export class SortVm {
  readonly #sort: Observable<Sort>
  readonly #setSort: (sort: StateSetter<Sort>) => void
  get sort() {
    return this.#sort
  }

  readonly #direction: Observable<SortDirection>
  readonly #setDirection: (direction: StateSetter<SortDirection>) => void
  get direction() {
    return this.#direction
  }

  constructor() {
    ;[this.#sort, this.#setSort] = butterfly<Sort>('title')
    ;[this.#direction, this.#setDirection] = butterfly<SortDirection>('asc')
  }

  setSort(sort: Sort) {
    // toggle direction if sort is already selected
    this.#setSort((currentSort) => {
      if (currentSort === sort) {
        this.#setDirection((currentDirection) =>
          currentDirection === 'asc' ? 'desc' : 'asc'
        )
      }
      return sort
    })
  }
}

// convenient singleton
const sortVm = new SortVm()
export default sortVm
