import { Fragment, jsx, run } from '@worldmaker/butterfloat'
import finalTallyVm from './vm.ts'
import { map, of, Subscription, switchMap } from 'rxjs'
import { Login } from './login.tsx'
import { Top5List } from './list.tsx'

function FinalTally() {
  const children = finalTallyVm.pipe(
    switchMap((vm) =>
      vm
        ? vm.finalTally.pipe(
          map((ft) =>
            ft
              ? () => <Top5List ranking={ft} />
              : () => (
                <progress class='progress is-small is-primary' max={100} />
              )
          ),
        )
        : of(Login)
    ),
  )
  return (
    <div class='block' childrenBind={children} childrenBindMode='replace'></div>
  )
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

customElements.define('final-tally-top5', FinalTallyComponent)
export default FinalTallyComponent
