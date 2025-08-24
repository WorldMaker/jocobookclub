import { jsx, run } from '@worldmaker/butterfloat'
import {
  BehaviorSubject,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
} from 'rxjs'
import sessionManager from '../vm/session-manager.ts'
import { Top5List } from './list.tsx'
import { LoginTop5 } from './login.tsx'
import finalTallyVm, { FinalTallyVm, StaticApiBase } from './vm.ts'

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
        : of(LoginTop5)
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

interface TagTallyProps {
  tag: Observable<string>
}

function TagTally({ tag }: TagTallyProps) {
  const children = sessionManager.session.pipe(
    switchMap((session) =>
      session
        ? tag.pipe(
          map((tag) =>
            new FinalTallyVm(session, `${StaticApiBase}/tags/${tag}.json`)
          ),
          switchMap((vm) => vm.finalTally),
          map((ft) =>
            ft
              ? () => <Top5List ranking={ft} />
              : () => (
                <progress class='progress is-small is-primary' max={100} />
              )
          ),
        )
        : of(LoginTop5)
    ),
  )
  return (
    <div class='block' childrenBind={children} childrenBindMode='replace'></div>
  )
}

export class TagTallyComponent extends HTMLElement {
  #subscription: Subscription | null = null
  #tag = new BehaviorSubject('')

  static get observedAttributes() {
    return ['tag']
  }

  get tag() {
    return this.#tag.value
  }

  set tag(value: string) {
    this.#tag.next(value)
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (name === 'tag' && oldValue !== newValue) {
      this.tag = newValue ?? ''
    }
  }

  connectedCallback() {
    this.innerHTML = ''
    this.#subscription = run(this, () => TagTally({ tag: this.#tag }))
  }

  disconnectedCallback() {
    this.#subscription?.unsubscribe()
  }
}

customElements.define('tag-tally-top5', TagTallyComponent)
