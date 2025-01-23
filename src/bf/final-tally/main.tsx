import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import finalTallyVm from './vm.ts'
import { map, of, switchMap, Subscription } from 'rxjs'
import { Login } from './login.tsx'
import { Table } from './table.tsx'

function FinalTally() {
  const children = finalTallyVm.pipe(
    switchMap((vm) => vm ? vm.finalTally.pipe(map(ft => ft ? () => <Table ranking={ft} /> : () => <progress class="progress is-small is-primary" max={100} />)) : of(Login)),
  )
  return <Fragment childrenBind={children} childrenBindMode='replace'></Fragment>
}

class FinalTallyComponent extends HTMLElement {
  #subscription: Subscription | null = null

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, FinalTally)
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('final-tally', FinalTallyComponent)
export default FinalTallyComponent
