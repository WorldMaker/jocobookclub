/// <reference lib="dom.iterable" />
import { combineLatest, merge, of, NEVER, Subscription, switchMap } from 'rxjs'
import sortVm from './vm.ts'
import ballotManager from '../vm/ballot-manager.ts'

class BookSorter extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    const ballot = ballotManager.pipe(
      switchMap((vm) => vm ? vm.ballot : merge(of(null), NEVER)),
    )

    this.#subscription = combineLatest([sortVm.sort, sortVm.direction, ballot])
      .subscribe(([sort, direction, ballot]) => {
        const books = [...this.querySelectorAll<HTMLDivElement>('div.card')]
        books.sort((a, b) => {
          if (sort === 'rank') {
            const rankA = ballot?.books[a.dataset.ltid!] ?? 0
            const rankB = ballot?.books[b.dataset.ltid!] ?? 0
            return direction === 'asc' ? rankA - rankB : rankB - rankA
          } else {
            const fieldA = a.dataset[sort]!
            const fieldB = b.dataset[sort]!
            return direction === 'asc'
              ? fieldA.localeCompare(fieldB)
              : fieldB.localeCompare(fieldA)
          }
        })
        for (const book of books) {
          // appending an existing element moves it
          this.appendChild(book)
        }
      })
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('book-sorter', BookSorter)

export default BookSorter
