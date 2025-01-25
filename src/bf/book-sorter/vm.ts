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
    const localSort = localStorage.getItem('sort')
    ;[this.#sort, this.#setSort] = butterfly<Sort>(localSort as Sort ?? 'title')
    const localDirection = localStorage.getItem('sort-direction')
    ;[this.#direction, this.#setDirection] = butterfly<SortDirection>(
      localDirection as SortDirection ?? 'asc',
    )
  }

  setSort(sort: Sort) {
    // toggle direction if sort is already selected
    this.#setSort((currentSort) => {
      if (currentSort === sort) {
        this.#setDirection((currentDirection) => {
          const toggledDirection = currentDirection === 'asc' ? 'desc' : 'asc'
          localStorage.setItem('sort-direction', toggledDirection)
          return toggledDirection
        })
      }
      localStorage.setItem('sort', sort)
      return sort
    })
  }
}

// convenient singleton
const sortVm = new SortVm()
export default sortVm
