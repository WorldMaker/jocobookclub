import {
  ComponentContext,
  jsx,
  ObservableEvent,
  run,
} from '@worldmaker/butterfloat'
import sortVm, { Sort } from './book-sorter/vm.ts'
import { map, shareReplay, Subscription, withLatestFrom } from 'rxjs'

interface SortButtonProps {
  sort: Sort
  name: string
}

function SortButton(
  { sort, name }: SortButtonProps,
  { bindEffect, events }: ComponentContext<
    { click: ObservableEvent<MouseEvent> }
  >,
) {
  bindEffect(events.click, (_) => sortVm.setSort(sort))
  const isSorted = sortVm.sort.pipe(map((s) => s === sort), shareReplay(1))
  const notSorted = sortVm.sort.pipe(map((s) => s !== sort))
  const asc = isSorted.pipe(
    withLatestFrom(sortVm.direction),
    map(([isSorted, direction]) => isSorted && direction === 'asc'),
  )
  const desc = isSorted.pipe(
    withLatestFrom(sortVm.direction),
    map(([isSorted, direction]) => isSorted && direction === 'desc'),
  )
  return (
    <button
      class='button'
      title={`Sort by ${name}`}
      classBind={{ 'is-info': isSorted, 'is-selected': isSorted }}
      events={{ click: events.click }}
    >
      <span class='icon'>
        <i
          class='fa-duotone fa-solid'
          classBind={{
            'fa-sort': notSorted,
            'fa-sort-up': asc,
            'fa-sort-down': desc,
          }}
        >
        </i>
      </span>
      <span>{name}</span>
    </button>
  )
}

function SortPicker() {
  return (
    <div class='level'>
      <div class='level-item buttons has-addons'>
        <SortButton sort='title' name='Title' />
        <SortButton sort='author' name='Author' />
        <SortButton sort='rank' name='Rank' />
      </div>
    </div>
  )
}

class SortPickerComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, SortPicker)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('sort-picker', SortPickerComponent)

export default SortPickerComponent
